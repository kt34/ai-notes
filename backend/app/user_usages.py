from .db import supabase
from fastapi import HTTPException, status, Depends

import asyncio

async def get_usage(user_id: str):
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        return {"subscription_status": response.data['subscription_status']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching usage: {e}")

async def update_usage_plan(user_id: str, updated_plan: str):
    try:
        supabase.table("profiles").update({"subscription_status": updated_plan}).eq("id", user_id).execute()
        return {"success": True, "message": "Subscription updated", "updated_plan": updated_plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating usage: {e}")

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
        