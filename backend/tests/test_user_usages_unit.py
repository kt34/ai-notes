import asyncio
import datetime as dt


def test_update_usage_plan_non_free_updates_profiles_and_user_usage(
    fake_db_factory, monkeypatch
):
    # Verifies the core non-free subscription update path in `update_usage_plan`.
    # Scenario:
    # - Move a user from their current plan to a paid plan (e.g. "pro").
    # - Provide Stripe-related identifiers and billing period timestamps.
    # What this test checks:
    # - `profiles` are updated with:
    #   - `subscription_status` = the new plan
    #   - `stripe_subscription_id` and `stripe_customer_id` saved correctly
    # - `user_usage` are updated with:
    #   - `usage_period_start/end` converted from Stripe timestamps (unix seconds) to ISO strings.
    # Why it matters:
    # Stripe billing-period timestamps are what gate usage limits in your app.
    from app.user_usages import update_usage_plan
    import app.user_usages as user_usages_module

    fake_db = fake_db_factory()
    monkeypatch.setattr(user_usages_module, "supabase", fake_db)

    start_ts = 1710000000
    end_ts = 1710003600

    start_iso = dt.datetime.fromtimestamp(start_ts, tz=dt.timezone.utc).isoformat()
    end_iso = dt.datetime.fromtimestamp(end_ts, tz=dt.timezone.utc).isoformat()

    asyncio.run(
        update_usage_plan(
            user_id="user-1",
            updated_plan="pro",
            stripe_subscription_id="sub_999",
            stripe_customer_id="cus_999",
            start_date=start_ts,
            end_date=end_ts,
            is_cancelled=None,
        )
    )

    profiles = fake_db._data["profiles"]["user-1"]
    assert profiles["subscription_status"] == "pro"
    assert profiles["stripe_subscription_id"] == "sub_999"
    assert profiles["stripe_customer_id"] == "cus_999"

    usage = fake_db._data["user_usage"]["user-1"]
    assert usage["usage_period_start"] == start_iso
    assert usage["usage_period_end"] == end_iso


def test_update_usage_plan_free_sets_infinity_and_optional_cancel_flag(
    fake_db_factory, monkeypatch
):
    # Verifies the downgrade-to-free behavior in `update_usage_plan`.
    # Scenario:
    # - Update a user to plan "free".
    # - Pass an empty-string Stripe subscription id (""), which should CLEAR the stored value.
    # - Provide a cancellation flag (`is_cancelled=False`) to ensure optional profile updates work.
    # What this test checks:
    # - `profiles.subscription_status` becomes "free"
    # - `profiles.stripe_subscription_id` becomes "" (explicitly cleared)
    # - `profiles.is_cancelled` is set when `is_cancelled` is provided
    # - `user_usage.usage_period_end` becomes "infinity" and `user_usage.usage_period_start`
    #   is set to "now" (we don't assert the exact value, only the "infinity" contract).
    # Why it matters:
    # Incorrect free downgrade logic can accidentally keep usage windows or stale Stripe ids.
    from app.user_usages import update_usage_plan
    import app.user_usages as user_usages_module

    fake_db = fake_db_factory()
    # ensure non-free defaults don't mask infinity expectations
    fake_db._data["user_usage"]["user-1"]["usage_period_end"] = "some_end"

    monkeypatch.setattr(user_usages_module, "supabase", fake_db)

    asyncio.run(
        update_usage_plan(
            user_id="user-1",
            updated_plan="free",
            stripe_subscription_id="",
            stripe_customer_id=None,
            start_date=None,
            end_date=None,
            is_cancelled=False,
        )
    )

    profiles = fake_db._data["profiles"]["user-1"]
    assert profiles["subscription_status"] == "free"
    assert profiles["stripe_subscription_id"] == ""
    assert profiles["is_cancelled"] is False

    usage = fake_db._data["user_usage"]["user-1"]
    assert usage["usage_period_end"] == "infinity"


def test_reset_user_usage_sets_counts_to_zero_and_updates_period(
    fake_db_factory, monkeypatch
):
    # Verifies `reset_user_usage`, which is called by the Stripe webhook when an invoice is paid.
    # Scenario:
    # - Simulate a billing-cycle reset with explicit start/end timestamps.
    # What this test checks:
    # - `uploads_count` and `recordings_count` are reset to 0
    # - `usage_period_start` and `usage_period_end` are updated to ISO strings derived
    #   from the passed unix timestamps.
    # Why it matters:
    # If reset_user_usage doesn't set the correct billing window, users can get wrong limits.
    from app.user_usages import reset_user_usage
    import app.user_usages as user_usages_module

    fake_db = fake_db_factory()
    monkeypatch.setattr(user_usages_module, "supabase", fake_db)

    start_ts = 1710000000
    end_ts = 1710003600

    start_iso = dt.datetime.fromtimestamp(start_ts, tz=dt.timezone.utc).isoformat()
    end_iso = dt.datetime.fromtimestamp(end_ts, tz=dt.timezone.utc).isoformat()

    asyncio.run(reset_user_usage("user-1", start_date=start_ts, end_date=end_ts))

    usage = fake_db._data["user_usage"]["user-1"]
    assert usage["uploads_count"] == 0
    assert usage["recordings_count"] == 0
    assert usage["usage_period_start"] == start_iso
    assert usage["usage_period_end"] == end_iso

