from supabase import create_client, Client
from .config import settings

# Supabase client for Postgres and auth
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_user_lectures(user_id: str):
    """
    Fetch all lectures for a specific user ID.
    Returns a list of lectures ordered by creation date (newest first).
    """
    response = supabase.table("lectures") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("inserted_at", desc=True) \
        .execute()
    
    return response.data

if __name__ == "__main__":
    print(get_user_lectures("test_user"))