import sys
import os
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Optional

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]

# `app.config.Settings` uses `env_file=".env"` relative to the current working
# directory, so tests must ensure `backend/.env` is available via `os.environ`
# regardless of where pytest is launched from.
_env_path = BACKEND_DIR / ".env"
if _env_path.exists():
    for raw_line in _env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

if str(BACKEND_DIR) not in sys.path:
    # Allows `import app.main` (the `app/` dir lives under backend/)
    sys.path.insert(0, str(BACKEND_DIR))


class FakeResponse:
    def __init__(self, data: Any):
        self.data = data
        self.error = None


class FakeQuery:
    def __init__(self, client: "FakeSupabase", table_name: str):
        self._client = client
        self._table_name = table_name
        self._select_fields: Optional[str] = None
        self._filters: List[tuple[str, Any]] = []
        self._single = False
        self._update_data: Optional[Dict[str, Any]] = None
        self._delete = False

    def select(self, fields: str) -> "FakeQuery":
        self._select_fields = fields
        return self

    def eq(self, column: str, value: Any) -> "FakeQuery":
        self._filters.append((column, value))
        return self

    def single(self) -> "FakeQuery":
        self._single = True
        return self

    def order(self, _column: str, desc: bool = False) -> "FakeQuery":
        # Not needed for Stripe tests right now; kept for compatibility.
        return self

    def update(self, update_data: Dict[str, Any]) -> "FakeQuery":
        self._update_data = dict(update_data)
        return self

    def delete(self) -> "FakeQuery":
        self._delete = True
        return self

    def _match_rows(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not self._filters:
            return rows

        def row_matches(row: Dict[str, Any]) -> bool:
            for col, val in self._filters:
                if row.get(col) != val:
                    return False
            return True

        return [r for r in rows if row_matches(r)]

    def _project_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        if not self._select_fields or self._select_fields.strip() == "*":
            return dict(row)

        # Support `select("id")` and `select("stripe_customer_id")` used in Stripe endpoints.
        # For more complex joins (e.g. plan_limits!left(...)), just return the full row.
        if "!" in self._select_fields or "," in self._select_fields:
            return dict(row)

        field = self._select_fields.strip()
        return {field: row.get(field)}

    def execute(self) -> FakeResponse:
        table = self._client._data.setdefault(self._table_name, {})
        rows = list(table.values())
        matched = self._match_rows(rows)

        if self._delete:
            # Not needed for Stripe tests; implement minimally.
            for row in matched:
                key = row.get("id") or row.get("user_id")
                if key in table:
                    del table[key]
            return FakeResponse(data=None)

        if self._update_data is not None:
            if not matched:
                # Make tests easier: auto-create missing rows.
                # Primary keys are `id` (profiles) and `user_id` (user_usage).
                created = dict(self._update_data)
                for col, val in self._filters:
                    created[col] = val
                key = created.get("id") or created.get("user_id")
                if key is None:
                    key = f"auto_{len(table)}"
                table[key] = created
                return FakeResponse(data=created)

            for row in matched:
                row.update(self._update_data)
            return FakeResponse(data=matched[0] if self._single and matched else matched)

        # Default: SELECT
        if self._single:
            if not matched:
                return FakeResponse(data={})
            return FakeResponse(data=self._project_row(matched[0]))

        projected = [self._project_row(r) for r in matched]
        return FakeResponse(data=projected)


class FakeSupabase:
    def __init__(self, initial_data: Dict[str, Dict[str, Dict[str, Any]]]):
        # Shape: { "profiles": {user_id: {...}}, "user_usage": {user_id: {...}} }
        self._data: Dict[str, Dict[str, Dict[str, Any]]] = initial_data

    def table(self, table_name: str) -> FakeQuery:
        return FakeQuery(self, table_name)


@pytest.fixture
def api_client():
    """
    FastAPI client with auth dependency overridden.
    Stripe/Supabase are still mocked inside individual tests.
    """
    # Import after sys.path manipulation above.
    from app.main import app as fastapi_app
    from app.auth import SupabaseUser, get_authenticated_user_from_header

    user = SupabaseUser(
        id="user-1",
        email="user-1@example.com",
        user_metadata={"full_name": "User One"},
    )

    async def override_get_authenticated_user_from_header():
        return user

    fastapi_app.dependency_overrides[get_authenticated_user_from_header] = (
        override_get_authenticated_user_from_header
    )
    with TestClient(fastapi_app) as client:
        yield client


@pytest.fixture
def fake_db_factory():
    def _make(initial_profiles: Optional[Dict[str, Any]] = None, initial_usage: Optional[Dict[str, Any]] = None):
        user_id = "user-1"
        profiles_row = {
            "id": user_id,
            "stripe_customer_id": None,
            "stripe_subscription_id": None,
            "subscription_status": "free",
            "is_cancelled": False,
        }
        if initial_profiles:
            profiles_row.update(initial_profiles)

        usage_row = {
            "user_id": user_id,
            "uploads_count": 5,
            "recordings_count": 7,
            "usage_period_start": "2020-01-01T00:00:00+00:00",
            "usage_period_end": "2020-02-01T00:00:00+00:00",
        }
        if initial_usage:
            usage_row.update(initial_usage)

        initial_data: Dict[str, Dict[str, Dict[str, Any]]] = {
            "profiles": {user_id: profiles_row},
            "user_usage": {user_id: usage_row},
        }
        return FakeSupabase(initial_data)

    return _make

