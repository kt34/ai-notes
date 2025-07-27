from .db import supabase
from fastapi import HTTPException, status, Depends
from datetime import datetime, timedelta, timezone

import asyncio

async def get_usage(user_id: str):
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        return {"subscription_status": response.data['subscription_status']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching usage: {e}")

async def update_usage_plan(user_id: str, updated_plan: str, stripe_subscription_id: str = None, stripe_customer_id: str = None, start_date: int = None, end_date: int = None):
    try:
        update_data = {"subscription_status": updated_plan}
        if stripe_subscription_id:
            update_data["stripe_subscription_id"] = stripe_subscription_id
        if stripe_customer_id:
            update_data["stripe_customer_id"] = stripe_customer_id

        # first update the profiles table
        print("Trying to update the profiles tab")
        supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        print("Successfully updated")

        # After we need to update the user usages table
        print(type(start_date))
        print(type(end_date))

        if updated_plan != "free":
            start_date_dt = datetime.fromtimestamp(start_date, tz=timezone.utc)
            end_date_dt = datetime.fromtimestamp(end_date, tz=timezone.utc)

            print(start_date_dt)
            print(end_date_dt)

            supabase.table("user_usage").update({"usage_period_start": start_date_dt.isoformat(), "usage_period_end": end_date_dt.isoformat()}).eq("user_id", user_id).execute()
        else:
            current_time = datetime.now(timezone.utc)
            supabase.table("user_usage").update({"usage_period_start": current_time.isoformat(), "usage_period_end": "infinity"}).eq("user_id", user_id).execute()
            
        return {"success": True, "message": "Subscription updated", "updated_plan": updated_plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating usage: {e}")

async def reset_user_usage(user_id: str, start_date:int = None, end_date: int = None):
    """Resets usage counts and updates the billing period for a user."""
    try:
        start_date_dt = datetime.fromtimestamp(start_date, tz=timezone.utc)
        end_date_dt = datetime.fromtimestamp(end_date, tz=timezone.utc)

        update_data = {
            "uploads_count": 0,
            "recordings_count": 0,
            "usage_period_start": start_date_dt.isoformat(),
            "usage_period_end": end_date_dt.isoformat()
        }
        
        supabase.table("user_usage").update(update_data).eq("user_id", user_id).execute()
        
        return {"success": True, "message": "User usage has been reset."}
    except Exception as e:
        # It's better to log this error than to raise an HTTPException,
        # as Stripe webhook responses are critical.
        print(f"CRITICAL: Failed to reset usage for user {user_id}. Error: {e}")
        # Re-raising for now, but in production, you might want more robust error handling.
        raise HTTPException(status_code=500, detail=f"Failed to reset user usage: {e}")


async def update_usage_uploads(user_id: str):
    try:
        # First, get the current uploads count
        response = supabase.table("user_usage").select("uploads_count").eq("user_id", user_id).single().execute()
        current_count = response.data['uploads_count']
        
        # Then update with the incremented value
        supabase.table("user_usage").update({"uploads_count": current_count + 1}).eq("user_id", user_id).execute()
        return {"success": True, "message": "Uploads incremented"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating uploads: {e}")

async def update_usage_recordings(user_id: str):
    try:
        response = supabase.table("user_usage").select("recordings_count").eq("user_id", user_id).single().execute()
        current_count = response.data['recordings_count']
        supabase.table("user_usage").update({"recordings_count": current_count + 1}).eq("user_id", user_id).execute()
        return {"success": True, "message": "Recordings incremented"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating recordings: {e}")
   
async def get_remaining_uploads_count(user_id: str):
    try:
        print(user_id)
        # Use left joins to be more resilient to missing related records
        response = supabase.table("profiles") \
            .select("subscription_status, plan_limits!left(max_uploads), user_usage!left(uploads_count)") \
            .eq("id", user_id) \
            .single() \
            .execute()

        print(response)

        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")

        # Safely access nested data with default values
        plan_limits = response.data.get('plan_limits')
        user_usage = response.data.get('user_usage')

        max_uploads = plan_limits.get('max_uploads', 0) if plan_limits else 0
        current_uploads = user_usage.get('uploads_count', 0) if user_usage else 0

        remaining_uploads = max_uploads - current_uploads
        
        return {"success": True, "remaining_uploads": remaining_uploads}
    except Exception as e:
        # Re-raise HTTPExceptions, otherwise wrap
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error getting remaining uploads: {e}")

async def get_remaining_recordings_count(user_id: str):
    try:
        response = supabase.table("profiles") \
            .select("subscription_status, plan_limits!left(max_recordings), user_usage!left(recordings_count)") \
            .eq("id", user_id) \
            .single() \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")

        # Safely access nested data with default values
        plan_limits = response.data.get('plan_limits')
        user_usage = response.data.get('user_usage')

        max_recordings = plan_limits.get('max_recordings', 0) if plan_limits else 0
        current_recordings = user_usage.get('recordings_count', 0) if user_usage else 0

        remaining_recordings = max_recordings - current_recordings
 
        return {"success": True, "remaining_recordings": remaining_recordings}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error getting remaining recordings: {e}")


async def get_usage_summary(user_id: str):
    try:
        response = supabase.table("profiles") \
            .select("subscription_status, plan_limits!left(max_uploads, max_recordings), user_usage!left(uploads_count, recordings_count, usage_period_end)") \
            .eq("id", user_id) \
            .single() \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found.")

        profile_data = response.data
        plan_limits = profile_data.get('plan_limits')
        user_usage = profile_data.get('user_usage')

        max_uploads = plan_limits.get('max_uploads') if plan_limits else None
        current_uploads = user_usage.get('uploads_count', 0) if user_usage else 0
        if max_uploads is not None:
            remaining_uploads = max_uploads - current_uploads
        else:
            remaining_uploads = -1  # Use -1 for unlimited

        max_recordings = plan_limits.get('max_recordings') if plan_limits else None
        current_recordings = user_usage.get('recordings_count', 0) if user_usage else 0
        if max_recordings is not None:
            remaining_recordings = max_recordings - current_recordings
        else:
            remaining_recordings = -1  # Use -1 for unlimited

        usage_period_end = user_usage.get('usage_period_end') if user_usage else None
        
        return {
            "success": True, 
            "remaining_uploads": remaining_uploads,
            "remaining_recordings": remaining_recordings,
            "usage_period_end": usage_period_end
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error getting usage summary: {e}")

     
if __name__ == "__main__":
    import asyncio
    result = asyncio.run(get_remaining_uploads_count("66f5879e-5832-42d5-93d1-a5fa30b5984c"))
    print(result)
    result = asyncio.run(get_remaining_recordings_count("66f5879e-5832-42d5-93d1-a5fa30b5984c"))
    print(result)