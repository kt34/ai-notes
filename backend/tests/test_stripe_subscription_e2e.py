import datetime as dt
from types import SimpleNamespace

import pytest


def _set_supabase_mocks(monkeypatch, fake_db):
    import app.main as main_module
    import app.user_usages as user_usages_module
    import app.db as db_module

    monkeypatch.setattr(main_module, "supabase", fake_db)
    monkeypatch.setattr(user_usages_module, "supabase", fake_db)
    monkeypatch.setattr(db_module, "supabase", fake_db)


@pytest.fixture
def stripe_settings():
    from app.config import settings

    return settings


def test_create_checkout_session_creates_customer_and_session_when_missing_customer_id(
    api_client, fake_db_factory, monkeypatch, stripe_settings
):
    # End-to-end test for `POST /api/v1/stripe/create-checkout-session` when the user
    # does NOT yet have a Stripe customer id stored in Supabase.
    #
    # Scenario being simulated:
    # - User "user-1" has `profiles.stripe_customer_id = None`.
    # - Request plan_type="plus".
    # - Backend should:
    #   1) create a Stripe Customer
    #   2) save the created customer id back into the user's `profiles`
    #   3) create a Stripe Checkout subscription session with the correct `price`
    #
    # Stripe mocking strategy:
    # - `stripe.Customer.create` returns a fake `cus_new`
    # - `stripe.checkout.Session.create` returns a fake `cs_new`
    #
    # Assertions:
    # - HTTP 200 + correct returned JSON `{"sessionId": ...}`
    # - Supabase fake updated with `stripe_customer_id="cus_new"`
    # - Customer/session creation functions were called.
    fake_db = fake_db_factory(initial_profiles={"stripe_customer_id": None})
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    created = {"customer_called": False, "session_called": False, "session_args": None}

    def fake_customer_create(**kwargs):
        created["customer_called"] = True
        assert kwargs["email"] == "user-1@example.com"
        return SimpleNamespace(id="cus_new")

    def fake_session_create(**kwargs):
        created["session_called"] = True
        created["session_args"] = kwargs
        assert kwargs["customer"] == "cus_new"
        assert kwargs["line_items"][0]["price"] == stripe_settings.STRIPE_PRICE_PLUS
        return SimpleNamespace(id="cs_new")

    monkeypatch.setattr(main_module.stripe.Customer, "create", fake_customer_create)
    monkeypatch.setattr(main_module.stripe.checkout.Session, "create", fake_session_create)

    resp = api_client.post(
        "/api/v1/stripe/create-checkout-session",
        json={"plan_type": "plus"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"sessionId": "cs_new"}
    assert fake_db._data["profiles"]["user-1"]["stripe_customer_id"] == "cus_new"
    assert created["customer_called"] is True
    assert created["session_called"] is True


def test_create_checkout_session_uses_existing_customer_id(
    api_client, fake_db_factory, monkeypatch, stripe_settings
):
    # End-to-end test for `POST /api/v1/stripe/create-checkout-session` when the user
    # already has a Stripe customer id.
    #
    # Scenario:
    # - `profiles.stripe_customer_id` is pre-populated with "cus_existing".
    # - Request plan_type="pro".
    #
    # What we validate:
    # - The backend must *not* create another customer.
    # - It must create the checkout session using the existing `customer="cus_existing"`.
    # - It must choose the correct Stripe price id for "pro".
    fake_db = fake_db_factory(initial_profiles={"stripe_customer_id": "cus_existing"})
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    def fake_customer_create(**_kwargs):
        raise AssertionError("Customer.create should not be called when customer_id exists")

    def fake_session_create(**kwargs):
        assert kwargs["customer"] == "cus_existing"
        assert kwargs["line_items"][0]["price"] == stripe_settings.STRIPE_PRICE_PRO
        return SimpleNamespace(id="cs_existing")

    monkeypatch.setattr(main_module.stripe.Customer, "create", fake_customer_create)
    monkeypatch.setattr(main_module.stripe.checkout.Session, "create", fake_session_create)

    resp = api_client.post(
        "/api/v1/stripe/create-checkout-session",
        json={"plan_type": "pro"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"sessionId": "cs_existing"}


def test_create_checkout_session_invalid_plan_type(api_client, fake_db_factory, monkeypatch):
    # End-to-end test for input validation:
    # `POST /api/v1/stripe/create-checkout-session` should reject unknown `plan_type` values.
    #
    # Scenario:
    # - Provide plan_type="bad"
    #
    # Validation expectation:
    # - HTTP 400 with detail "Invalid plan type provided."
    fake_db = fake_db_factory()
    _set_supabase_mocks(monkeypatch, fake_db)

    resp = api_client.post(
        "/api/v1/stripe/create-checkout-session",
        json={"plan_type": "bad"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Invalid plan type provided."


def test_update_subscription_after_payment_happy_path_pro(
    api_client, fake_db_factory, monkeypatch, stripe_settings
):
    # End-to-end happy path test for:
    # `POST /api/v1/stripe/update-subscription`
    #
    # Scenario:
    # - Stripe checkout session is retrieved successfully via mocked `stripe.checkout.Session.retrieve`.
    # - `payment_status="paid"`
    # - `client_reference_id` matches the authenticated user id
    # - The session line item price id corresponds to the "pro" plan
    # - The subscription contains Stripe period start/end timestamps
    #
    # What is mocked:
    # - Checkout session retrieve returns a fake session with:
    #   - `line_items.data[0].price.id = STRIPE_PRICE_PRO`
    #   - `subscription.id` + `subscription.items.data[0].current_period_start/end`
    #
    # Assertions:
    # - HTTP 200 + `plan_type == "pro"`
    # - `profiles.subscription_status` updated to "pro"
    # - `profiles.stripe_subscription_id` + `stripe_customer_id` updated
    # - `user_usage.usage_period_start/end` updated to ISO strings from the provided timestamps
    fake_db = fake_db_factory()
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    start_ts = 1710000000
    end_ts = 1710003600
    start_iso = dt.datetime.fromtimestamp(start_ts, tz=dt.timezone.utc).isoformat()
    end_iso = dt.datetime.fromtimestamp(end_ts, tz=dt.timezone.utc).isoformat()

    class FakeStripeSubscription:
        def __init__(self, sub_id: str, period_start: int, period_end: int):
            self.id = sub_id
            self._items = SimpleNamespace(
                data=[
                    SimpleNamespace(
                        current_period_start=period_start,
                        current_period_end=period_end,
                    )
                ]
            )

        def __getitem__(self, key):
            if key == "items":
                return self._items
            raise KeyError(key)

    def fake_session_retrieve(_session_id, expand=None):
        assert expand == ["line_items", "subscription"]
        return SimpleNamespace(
            payment_status="paid",
            client_reference_id="user-1",
            customer="cus_pro",
            line_items=SimpleNamespace(
                data=[
                    SimpleNamespace(
                        price=SimpleNamespace(id=stripe_settings.STRIPE_PRICE_PRO)
                    )
                ]
            ),
            subscription=FakeStripeSubscription(
                "sub_123", period_start=start_ts, period_end=end_ts
            ),
        )

    monkeypatch.setattr(main_module.stripe.checkout.Session, "retrieve", fake_session_retrieve)

    resp = api_client.post(
        "/api/v1/stripe/update-subscription",
        json={"session_id": "cs_test"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["plan_type"] == "pro"

    profiles = fake_db._data["profiles"]["user-1"]
    assert profiles["subscription_status"] == "pro"
    assert profiles["stripe_subscription_id"] == "sub_123"
    assert profiles["stripe_customer_id"] == "cus_pro"

    usage = fake_db._data["user_usage"]["user-1"]
    assert usage["usage_period_start"] == start_iso
    assert usage["usage_period_end"] == end_iso


def test_update_subscription_after_payment_payment_not_paid(
    api_client, fake_db_factory, monkeypatch
):
    # End-to-end test for a critical negative case:
    # `POST /api/v1/stripe/update-subscription` must reject sessions where payment
    # is not complete.
    #
    # Scenario:
    # - Mock Stripe session retrieve returns `payment_status="unpaid"`
    #
    # Expected behavior:
    # - HTTP 400 with detail "Payment not completed"
    fake_db = fake_db_factory()
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    def fake_session_retrieve(_session_id, expand=None):
        return SimpleNamespace(
            payment_status="unpaid",
            client_reference_id="user-1",
            customer="cus",
            line_items=SimpleNamespace(data=[]),
            subscription=SimpleNamespace(id="sub"),
        )

    monkeypatch.setattr(main_module.stripe.checkout.Session, "retrieve", fake_session_retrieve)

    resp = api_client.post(
        "/api/v1/stripe/update-subscription",
        json={"session_id": "cs_test"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Payment not completed"


def test_update_subscription_after_payment_client_reference_mismatch(
    api_client, fake_db_factory, monkeypatch
):
    # End-to-end test for session ownership verification:
    # the backend must ensure a Stripe checkout session belongs to the authenticated user.
    #
    # Scenario:
    # - Stripe session retrieve returns `payment_status="paid"`
    # - `client_reference_id` is for a different user than the authenticated one
    #
    # Expected behavior:
    # - HTTP 403 with detail "Session does not belong to current user"
    fake_db = fake_db_factory()
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    def fake_session_retrieve(_session_id, expand=None):
        return SimpleNamespace(
            payment_status="paid",
            client_reference_id="some_other_user",
            customer="cus",
            line_items=SimpleNamespace(data=[]),
            subscription=SimpleNamespace(id="sub"),
        )

    monkeypatch.setattr(main_module.stripe.checkout.Session, "retrieve", fake_session_retrieve)

    resp = api_client.post(
        "/api/v1/stripe/update-subscription",
        json={"session_id": "cs_test"},
    )
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Session does not belong to current user"


def test_update_subscription_after_payment_unknown_price(
    api_client, fake_db_factory, monkeypatch, stripe_settings
):
    # End-to-end test for plan mapping correctness:
    # if the Stripe session price id does not match any known plan ids,
    # the backend must reject it.
    #
    # Scenario:
    # - Mock Stripe session retrieve returns a price id that is not one of:
    #   STRIPE_PRICE_PLUS/PRO/MAX
    #
    # Expected behavior:
    # - HTTP 400 with detail "Could not determine plan type from session"
    fake_db = fake_db_factory()
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    def fake_session_retrieve(_session_id, expand=None):
        return SimpleNamespace(
            payment_status="paid",
            client_reference_id="user-1",
            customer="cus",
            line_items=SimpleNamespace(
                data=[SimpleNamespace(price=SimpleNamespace(id="price_unknown"))]
            ),
            subscription=SimpleNamespace(
                id="sub_123",
                __getitem__=lambda self, key: SimpleNamespace(
                    data=[SimpleNamespace(current_period_start=1, current_period_end=2)]
                ),
            ),
        )

    monkeypatch.setattr(main_module.stripe.checkout.Session, "retrieve", fake_session_retrieve)

    resp = api_client.post(
        "/api/v1/stripe/update-subscription",
        json={"session_id": "cs_test"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Could not determine plan type from session"


def test_cancel_subscription_happy_path(
    api_client, fake_db_factory, monkeypatch
):
    # End-to-end happy path test for:
    # `POST /api/v1/stripe/cancel-subscription`
    #
    # Scenario:
    # - User has `profiles.stripe_subscription_id="sub_cancel"`
    # - Backend should call Stripe `Subscription.modify(..., cancel_at_period_end=True)`
    # - Backend should mark the profile as `is_cancelled=True`
    #
    # Stripe mock:
    # - `stripe.Subscription.modify` is mocked to capture the subscription id and flag.
    #
    # Assertions:
    # - HTTP 200 success
    # - modify called with the correct arguments
    # - Supabase profile fake updated with `is_cancelled=True`
    fake_db = fake_db_factory(initial_profiles={"stripe_subscription_id": "sub_cancel"})
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    modify_called = {"called": False, "args": None}

    def fake_modify(subscription_id, cancel_at_period_end=False):
        modify_called["called"] = True
        modify_called["args"] = (subscription_id, cancel_at_period_end)
        return SimpleNamespace(id=subscription_id)

    monkeypatch.setattr(main_module.stripe.Subscription, "modify", fake_modify)

    resp = api_client.post("/api/v1/stripe/cancel-subscription")
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert modify_called["called"] is True
    assert modify_called["args"] == ("sub_cancel", True)
    assert fake_db._data["profiles"]["user-1"]["is_cancelled"] is True


def test_cancel_subscription_no_active_subscription(
    api_client, fake_db_factory, monkeypatch
):
    # Negative end-to-end test for cancel flow:
    # if there is no active Stripe subscription id in the user's profile,
    # the backend must return 404.
    #
    # Scenario:
    # - `profiles.stripe_subscription_id` is None
    #
    # Expected behavior:
    # - HTTP 404 with detail "No active subscription found to cancel."
    fake_db = fake_db_factory(initial_profiles={"stripe_subscription_id": None})
    _set_supabase_mocks(monkeypatch, fake_db)

    resp = api_client.post("/api/v1/stripe/cancel-subscription")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "No active subscription found to cancel."


def test_create_portal_session_happy_path(
    api_client, fake_db_factory, monkeypatch
):
    # End-to-end test for creating a Stripe Customer Portal session.
    #
    # Scenario:
    # - User has `profiles.stripe_customer_id="cus_portal"`
    #
    # What backend should do:
    # - Call `stripe.billing_portal.Session.create` with:
    #   - `customer="cus_portal"`
    #   - a `return_url` pointing back to the frontend profile page
    #
    # Assertions:
    # - HTTP 200 returns `{"url": "<portal url>"}` from the mocked Stripe response.
    fake_db = fake_db_factory(initial_profiles={"stripe_customer_id": "cus_portal"})
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    def fake_portal_create(**kwargs):
        assert kwargs["customer"] == "cus_portal"
        assert "return_url" in kwargs
        return SimpleNamespace(url="https://portal.test")

    monkeypatch.setattr(main_module.stripe.billing_portal.Session, "create", fake_portal_create)

    resp = api_client.post("/api/v1/stripe/create-portal-session")
    assert resp.status_code == 200
    assert resp.json() == {"url": "https://portal.test"}


def test_create_portal_session_missing_customer(
    api_client, fake_db_factory, monkeypatch
):
    # Negative end-to-end test for the portal-session flow:
    # if Stripe customer id is missing, backend must return 404.
    #
    # Scenario:
    # - `profiles.stripe_customer_id` is None
    #
    # Expected:
    # - HTTP 404 detail "Stripe customer not found for this user."
    fake_db = fake_db_factory(initial_profiles={"stripe_customer_id": None})
    _set_supabase_mocks(monkeypatch, fake_db)

    resp = api_client.post("/api/v1/stripe/create-portal-session")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Stripe customer not found for this user."


def test_stripe_webhook_invoice_paid_resets_usage(
    api_client, fake_db_factory, monkeypatch, stripe_settings
):
    # End-to-end webhook test for `invoice.paid`:
    # When Stripe sends an invoice paid webhook with `billing_reason="subscription_cycle"`,
    # the backend must:
    # - find the user by `profiles.stripe_customer_id`
    # - reset usage counters (`uploads_count`, `recordings_count`)
    # - update the usage window to the period start/end from the invoice payload.
    #
    # Mocking:
    # - `stripe.Webhook.construct_event` returns a fake event payload with:
    #   - customer id
    #   - line item period start/end timestamps
    #
    # Assertions:
    # - HTTP 200 success
    # - usage counters become 0
    # - usage period start/end are ISO strings derived from timestamps.
    fake_db = fake_db_factory(initial_profiles={"stripe_customer_id": "cus_existing"})
    # non-zero values so we can assert reset
    fake_db._data["user_usage"]["user-1"]["uploads_count"] = 9
    fake_db._data["user_usage"]["user-1"]["recordings_count"] = 11

    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    start_ts = 1710000000
    end_ts = 1710003600
    start_iso = dt.datetime.fromtimestamp(start_ts, tz=dt.timezone.utc).isoformat()
    end_iso = dt.datetime.fromtimestamp(end_ts, tz=dt.timezone.utc).isoformat()

    def fake_construct_event(_payload, _sig_header, _secret):
        return {
            "type": "invoice.paid",
            "data": {
                "object": {
                    "billing_reason": "subscription_cycle",
                    "customer": "cus_existing",
                    "lines": {
                        "data": [
                            {"period": {"start": start_ts, "end": end_ts}}
                        ]
                    },
                }
            },
        }

    monkeypatch.setattr(main_module.stripe.Webhook, "construct_event", fake_construct_event)

    resp = api_client.post(
        "/api/v1/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "t"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "success"}

    usage = fake_db._data["user_usage"]["user-1"]
    assert usage["uploads_count"] == 0
    assert usage["recordings_count"] == 0
    assert usage["usage_period_start"] == start_iso
    assert usage["usage_period_end"] == end_iso


def test_stripe_webhook_customer_subscription_updated_updates_plan(
    api_client, fake_db_factory, monkeypatch, stripe_settings
):
    # End-to-end webhook test for `customer.subscription.updated`.
    #
    # Scenario:
    # - Webhook event indicates the customer subscribed/changed to a new price tier (max).
    # - Payload includes:
    #   - customer id
    #   - subscription id
    #   - items[0].price.id mapping to STRIPE_PRICE_MAX
    #   - items[0].current_period_start/end timestamps
    #
    # What backend should do:
    # - Resolve the user by `stripe_customer_id`
    # - Determine plan_type from price id (max => "max")
    # - Call `update_usage_plan(...)` with:
    #   - correct subscription id and customer id
    #   - correct billing-period timestamps
    #
    # Assertions:
    # - HTTP 200 success
    # - profile `subscription_status` becomes "max"
    # - profile `stripe_subscription_id` becomes the subscription id from the webhook
    # - usage window start/end match ISO timestamps from webhook payload.
    fake_db = fake_db_factory(initial_profiles={"stripe_customer_id": "cus_existing"})
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    start_ts = 1710000000
    end_ts = 1710003600
    start_iso = dt.datetime.fromtimestamp(start_ts, tz=dt.timezone.utc).isoformat()
    end_iso = dt.datetime.fromtimestamp(end_ts, tz=dt.timezone.utc).isoformat()

    def fake_construct_event(_payload, _sig_header, _secret):
        return {
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_updated",
                    "customer": "cus_existing",
                    "items": {
                        "data": [
                            {
                                "price": {"id": stripe_settings.STRIPE_PRICE_MAX},
                                "current_period_start": start_ts,
                                "current_period_end": end_ts,
                            }
                        ]
                    },
                }
            },
        }

    monkeypatch.setattr(main_module.stripe.Webhook, "construct_event", fake_construct_event)

    resp = api_client.post(
        "/api/v1/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "t"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "success"}

    profiles = fake_db._data["profiles"]["user-1"]
    assert profiles["subscription_status"] == "max"
    assert profiles["stripe_subscription_id"] == "sub_updated"

    usage = fake_db._data["user_usage"]["user-1"]
    # Will only be set if webhook passes start/end timestamps down correctly.
    assert usage["usage_period_start"] == start_iso
    assert usage["usage_period_end"] == end_iso


def test_stripe_webhook_customer_subscription_deleted_downgrades_to_free(
    api_client, fake_db_factory, monkeypatch
):
    # End-to-end webhook test for `customer.subscription.deleted`.
    #
    # Scenario:
    # - Subscription for the user was deleted (or fully ended).
    # - Webhook contains customer id, so backend must locate the user.
    #
    # Expected backend behavior:
    # - Downgrade the user to the "free" plan.
    # - Clear Stripe subscription id by passing empty string "" into `update_usage_plan`.
    # - Set `is_cancelled` to False for the user after downgrade.
    # - Set usage period end to "infinity".
    #
    # Assertions:
    # - HTTP 200 success
    # - profile subscription_status becomes "free"
    # - profile stripe_subscription_id becomes ""
    # - profile is_cancelled becomes False
    # - usage_period_end becomes "infinity"
    fake_db = fake_db_factory(
        initial_profiles={
            "stripe_customer_id": "cus_existing",
            "stripe_subscription_id": "sub_existing",
            "subscription_status": "pro",
            "is_cancelled": True,
        }
    )
    _set_supabase_mocks(monkeypatch, fake_db)

    import app.main as main_module

    def fake_construct_event(_payload, _sig_header, _secret):
        return {
            "type": "customer.subscription.deleted",
            "data": {"object": {"customer": "cus_existing"}},
        }

    monkeypatch.setattr(main_module.stripe.Webhook, "construct_event", fake_construct_event)

    resp = api_client.post(
        "/api/v1/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "t"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "success"}

    profiles = fake_db._data["profiles"]["user-1"]
    assert profiles["subscription_status"] == "free"
    assert profiles["stripe_subscription_id"] == ""
    assert profiles["is_cancelled"] is False
    assert fake_db._data["user_usage"]["user-1"]["usage_period_end"] == "infinity"


