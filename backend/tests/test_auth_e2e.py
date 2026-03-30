from types import SimpleNamespace

import pytest


class FakeAuth:
    """
    Small fake of the `supabase.auth` surface area used by `backend/app/auth.py`
    and `backend/app/main.py` auth endpoints.
    """

    def __init__(self):
        self.sign_up = None
        self.sign_in_with_password = None
        self.sign_out = None
        self.verify_email_otp = None
        self.resend_signup_email = None
        self.reset_password_for_email = None
        self.refresh_session = None


class FakeSupabaseWithAuth:
    """
    Wrapper that provides both:
    - `.table(...)` for `/auth/me`
    - `.auth` for `/auth/refresh` and other auth flows in `app/main.py`
    """

    def __init__(self, fake_db_table, fake_auth: FakeAuth):
        self._fake_db_table = fake_db_table
        self.auth = fake_auth

    def table(self, table_name: str):
        return self._fake_db_table.table(table_name)


def _patch_auth_module(monkeypatch, fake_auth: FakeAuth):
    import app.auth as auth_module

    monkeypatch.setattr(auth_module, "supabase", SimpleNamespace(auth=fake_auth))


def _patch_main_supabase(monkeypatch, fake_supabase):
    import app.main as main_module

    monkeypatch.setattr(main_module, "supabase", fake_supabase)


@pytest.fixture
def fake_auth():
    return FakeAuth()


def test_register_success_returns_user_id_and_message(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/register` (happy path).
    #
    # Scenario:
    # - Supabase `auth.sign_up` succeeds and returns a `user` with non-empty `identities`.
    #
    # Why non-empty identities?
    # - `register_user` treats "user exists" as: `user_response.user and not user_response.user.identities`
    #
    # Assertions:
    # - HTTP 200
    # - Response matches the `RegistrationSuccessResponse` schema:
    #   - `message`
    #   - `user_id`
    #   - `email`
    # - The call to `sign_up` includes:
    #   - email/password
    #   - options.data.full_name
    #   - options.email_redirect_to pointing to `${FRONTEND_URL}/verify-email`
    from app.config import settings

    captured = {}

    def fake_sign_up(payload):
        captured["payload"] = payload
        return SimpleNamespace(
            user=SimpleNamespace(id="user-123", email=payload["email"], identities=["idp-1"])
        )

    fake_auth.sign_up = fake_sign_up
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "pw123456", "full_name": "New User"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == "user-123"
    assert body["email"] == "new@example.com"
    assert "Registration successful" in body["message"]

    # Validate redirect link and name propagation to Supabase.
    assert captured["payload"]["options"]["data"]["full_name"] == "New User"
    assert (
        captured["payload"]["options"]["email_redirect_to"]
        == f"{settings.FRONTEND_URL}/verify-email"
    )


def test_register_conflict_when_user_exists(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/register` (conflict case).
    #
    # Scenario:
    # - Supabase `auth.sign_up` returns a user with empty `identities` list,
    #   which the backend interprets as "email already exists".
    #
    # Assertions:
    # - HTTP 409
    # - Error detail matches the backend's conflict message.
    def fake_sign_up(_payload):
        return SimpleNamespace(user=SimpleNamespace(id="any", email="new@example.com", identities=[]))

    fake_auth.sign_up = fake_sign_up
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "pw123456", "full_name": "New User"},
    )
    assert resp.status_code == 409
    assert resp.json()["detail"] == "An account with this email address already exists."


def test_login_success_returns_tokens(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/login` (happy path).
    #
    # Scenario:
    # - Supabase `auth.sign_in_with_password` returns:
    #   - `user` (id/email)
    #   - `session` with access_token and refresh_token
    #
    # Assertions:
    # - HTTP 200
    # - Response includes `user_id`, `email`, `access_token`, `refresh_token`
    captured = {}

    def fake_sign_in(payload):
        captured["payload"] = payload
        return SimpleNamespace(
            user=SimpleNamespace(id="user-1", email=payload["email"]),
            session=SimpleNamespace(access_token="access-token-1", refresh_token="refresh-token-1"),
        )

    fake_auth.sign_in_with_password = fake_sign_in
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "pw123456"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body == {
        "user_id": "user-1",
        "email": "user@example.com",
        "access_token": "access-token-1",
        "refresh_token": "refresh-token-1",
    }
    assert captured["payload"]["email"] == "user@example.com"
    assert captured["payload"]["password"] == "pw123456"


def test_login_failure_returns_401(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/login` (negative case).
    #
    # Scenario:
    # - Supabase `auth.sign_in_with_password` raises an exception (e.g. wrong password).
    #
    # Backend behavior:
    # - `login_user` wraps errors as `Exception("Login failed: <original>")`
    # - `POST /auth/login` catches and re-raises as HTTP 401 with `detail=str(e)`
    #
    # Assertions:
    # - HTTP 401
    # - detail begins with "Login failed:"
    def fake_sign_in(_payload):
        raise RuntimeError("Wrong password")

    fake_auth.sign_in_with_password = fake_sign_in
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "bad-password"},
    )
    assert resp.status_code == 401
    assert resp.json()["detail"].startswith("Login failed:")


def test_logout_calls_sign_out(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/logout`.
    #
    # Scenario:
    # - Supabase `auth.sign_out` succeeds.
    #
    # Assertions:
    # - HTTP 200
    # - Response matches what `logout_user()` returns.
    called = {"value": False}

    def fake_sign_out():
        called["value"] = True
        return {"success": True}

    fake_auth.sign_out = fake_sign_out
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post("/auth/logout")
    assert resp.status_code == 200
    assert resp.json() == {"success": True}
    assert called["value"] is True


def test_refresh_token_returns_new_access_and_refresh(api_client, fake_auth, monkeypatch, fake_db_factory):
    # End-to-end test for `POST /auth/refresh`.
    #
    # Scenario:
    # - This endpoint uses `supabase.auth.refresh_session(refresh_token)` from `app/main.py`.
    # - We provide a fake supabase instance with both:
    #   - `.table(...)` (not used by this endpoint but required by our wrapper)
    #   - `.auth.refresh_session(...)` (used by this endpoint)
    #
    # Assertions:
    # - HTTP 200
    # - Response includes `access_token` and `refresh_token` from the fake session.
    fake_db = fake_db_factory()

    def fake_refresh_session(refresh_token):
        assert refresh_token == "old-refresh-token"
        return SimpleNamespace(
            session=SimpleNamespace(access_token="new-access-token", refresh_token="new-refresh-token")
        )

    fake_auth.refresh_session = fake_refresh_session
    fake_supabase = FakeSupabaseWithAuth(fake_db, fake_auth)
    _patch_main_supabase(monkeypatch, fake_supabase)

    resp = api_client.post("/auth/refresh", params={"refresh_token": "old-refresh-token"})
    assert resp.status_code == 200
    assert resp.json() == {"access_token": "new-access-token", "refresh_token": "new-refresh-token"}


def test_verify_email_returns_success_message(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/verify` (happy path).
    #
    # Scenario:
    # - Supabase `auth.verify_email_otp(token)` is called successfully.
    #
    # Assertions:
    # - HTTP 200
    # - Response contains `{"message": "Email verified successfully"}`.
    called = {"token": None}

    def fake_verify_email_otp(token):
        called["token"] = token
        return {}

    fake_auth.verify_email_otp = fake_verify_email_otp
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post("/auth/verify", json={"token": "verify-otp-token"})
    assert resp.status_code == 200
    assert resp.json() == {"message": "Email verified successfully"}
    assert called["token"] == "verify-otp-token"


def test_resend_verification_sends_with_redirect_link(api_client, fake_auth, monkeypatch, fake_db_factory):
    # End-to-end test for `POST /auth/resend-verification`.
    #
    # Scenario:
    # - `resend_verification_email` calls `supabase.auth.resend_signup_email`
    #   with a specific payload including:
    #   - `email`
    #   - `options.email_redirect_to = ${FRONTEND_URL}/verify-email`
    #   - `options.email_template = custom-email-template`
    #
    # Assertions:
    # - HTTP 200
    # - Response message matches backend.
    # - Supabase call payload includes the expected redirect URL and template name.
    from app.config import settings

    captured = {}

    def fake_resend_signup_email(payload):
        captured["payload"] = payload
        return {}

    fake_auth.resend_signup_email = fake_resend_signup_email
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post("/auth/resend-verification", json={"email": "user@example.com"})
    assert resp.status_code == 200
    assert resp.json() == {"message": "Verification email sent successfully"}

    assert captured["payload"]["email"] == "user@example.com"
    assert captured["payload"]["options"]["email_redirect_to"] == f"{settings.FRONTEND_URL}/verify-email"
    assert captured["payload"]["options"]["email_template"] == "custom-email-template"


def test_forgot_password_sets_update_password_redirect_link(api_client, fake_auth, monkeypatch):
    # End-to-end test for `POST /auth/forgot-password`.
    #
    # Scenario:
    # - Backend calls `supabase.auth.reset_password_for_email` with:
    #   - `email` from request
    #   - `options.redirect_to = ${FRONTEND_URL}/update-password`
    #
    # Assertions:
    # - HTTP 200
    # - Response contains the generic success message
    # - Supabase reset function is called with the correct redirect URL.
    from app.config import settings

    captured = {}

    def fake_reset_password_for_email(email, options):
        captured["email"] = email
        captured["options"] = options
        return {}

    fake_auth.reset_password_for_email = fake_reset_password_for_email
    _patch_auth_module(monkeypatch, fake_auth)

    resp = api_client.post("/auth/forgot-password", json={"email": "user@example.com"})
    assert resp.status_code == 200
    assert resp.json() == {"message": "Password reset email sent. Please check your inbox."}

    assert captured["email"] == "user@example.com"
    assert captured["options"]["redirect_to"] == f"{settings.FRONTEND_URL}/update-password"


def test_auth_me_returns_profile_fields_from_supabase(api_client, fake_db_factory, monkeypatch):
    # End-to-end test for `GET /auth/me`.
    #
    # Scenario:
    # - Dependency `get_authenticated_user_from_header` is overridden by `tests/conftest.py`
    #   to return a fake authenticated user with:
    #   - id="user-1"
    #   - email="user-1@example.com"
    # - Endpoint then queries `supabase.table("profiles")` for that user id.
    #
    # Assertions:
    # - HTTP 200
    # - Response includes:
    #   - id + email matching the authenticated user
    #   - full_name/subscription_status/is_cancelled from the profile row we seeded.
    fake_db = fake_db_factory(
        initial_profiles={
            "full_name": "User One",
            "subscription_status": "pro",
            "is_cancelled": False,
        }
    )
    _patch_main_supabase(monkeypatch, fake_db)

    resp = api_client.get("/auth/me")
    assert resp.status_code == 200
    assert resp.json() == {
        "id": "user-1",
        "email": "user-1@example.com",
        "full_name": "User One",
        "subscription_status": "pro",
        "is_cancelled": False,
    }


def test_google_oauth_start_redirects_to_google_consent(api_client, monkeypatch):
    # End-to-end redirect test for `GET /login/google`.
    #
    # Scenario:
    # - Backend builds a Google OAuth consent URL and returns it as a 302 redirect.
    # - With `FRONTEND_URL` containing "localhost", the backend sets redirect_uri to its own
    #   callback route URL (computed via `request.url_for`).
    #
    # Assertions:
    # - HTTP 302
    # - Location header contains:
    #   - `https://accounts.google.com/o/oauth2/v2/auth?`
    #   - `client_id=` and `redirect_uri=` query parameters.
    resp = api_client.get("/login/google", follow_redirects=False)
    assert resp.status_code == 302
    location = resp.headers["Location"]
    assert location.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
    assert "client_id=" in location
    assert "redirect_uri=" in location


def test_google_oauth_callback_redirects_to_frontend_record_hash(api_client, fake_db_factory, monkeypatch):
    # End-to-end redirect test for `GET /auth/callback/google`.
    #
    # Scenario:
    # - Backend exchanges the provided OAuth `code` for a Google `id_token`
    #   by calling `requests.post(...)` (mocked).
    # - Then it exchanges the `id_token` for Supabase access/refresh tokens (mocked).
    # - Finally it redirects the browser to:
    #   `${FRONTEND_URL}/record#access_token=<...>&refresh_token=<...>`
    #
    # Assertions:
    # - HTTP 302
    # - Location header matches the redirect format and includes access/refresh tokens.
    from app.config import settings

    calls = {"count": 0}

    class FakeResponse:
        def __init__(self, status_code, json_data=None, text=""):
            self.status_code = status_code
            self._json = json_data or {}
            self.text = text

        def json(self):
            return self._json

    def fake_requests_post(url, data=None, json=None, headers=None, timeout=None):
        calls["count"] += 1
        if calls["count"] == 1:
            # Google token exchange response
            return FakeResponse(200, json_data={"id_token": "google-id-token"})
        # Supabase token exchange response
        return FakeResponse(200, json_data={"access_token": "supabase-access", "refresh_token": "supabase-refresh"})

    import app.main as main_module

    monkeypatch.setattr(main_module.requests, "post", fake_requests_post)

    resp = api_client.get("/auth/callback/google?code=auth-code", follow_redirects=False)
    assert resp.status_code == 302
    location = resp.headers["Location"]
    assert location.startswith(f"{settings.FRONTEND_URL.rstrip('/')}/record#")
    assert "access_token=supabase-access" in location
    assert "refresh_token=supabase-refresh" in location

