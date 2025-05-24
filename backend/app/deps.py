import aioredis
from .config import settings
from supabase import create_client, Client

redis = None
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def get_redis():
    global redis
    if not redis and settings.REDIS_URL:
        redis = await aioredis.from_url(settings.REDIS_URL)
    return redis