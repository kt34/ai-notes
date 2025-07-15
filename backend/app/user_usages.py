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
   
async def get_remaining_uploads_count(user_id: str):
    try:
        # Single query with joins to get all needed data
        response = supabase.table("profiles") \
            .select("subscription_status, plan_limits!inner(max_uploads), user_usage!inner(uploads_count)") \
            .eq("id", user_id) \
            .single() \
            .execute()
        
        print(response)
        
        subscription_status = response.data['subscription_status']
        max_uploads = response.data['plan_limits']['max_uploads']
        current_uploads = response.data['user_usage']['uploads_count']
        
        remaining_uploads = max_uploads - current_uploads
        
        return {"success": True, "remaining_uploads": remaining_uploads}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting remaining uploads: {e}")

async def get_remaining_recordings_count(user_id: str):
    try:
        response = supabase.table("profiles") \
            .select("subscription_status, plan_limits!inner(max_recordings), user_usage!inner(recordings_count)") \
            .eq("id", user_id) \
            .single() \
            .execute()
        
        subscription_status = response.data['subscription_status']
        max_recordings = response.data['plan_limits']['max_recordings']
        current_recordings = response.data['user_usage']['recordings_count']    

        remaining_recordings = max_recordings - current_recordings

        return {"success": True, "remaining_recordings": remaining_recordings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting remaining recordings: {e}")

     
if __name__ == "__main__":
    import asyncio
    result = asyncio.run(get_remaining_uploads_count("66f5879e-5832-42d5-93d1-a5fa30b5984c"))
    print(result)
    result = asyncio.run(get_remaining_recordings_count("66f5879e-5832-42d5-93d1-a5fa30b5984c"))
    print(result)