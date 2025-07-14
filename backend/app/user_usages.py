from .db import supabase
from fastapi import HTTPException, status, Depends

import asyncio

async def get_usage(user_id: str):
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        return {"subscription_status": response.data['subscription_status']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching usage: {e}")

async def update_usage(user_id: str, updated_plan: str):
    try:
        supabase.table("profiles").update({"subscription_status": updated_plan}).eq("id", user_id).execute()
        return {"success": True, "message": "Subscription updated", "updated_plan": updated_plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating usage: {e}")
