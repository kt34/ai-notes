import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    DEEPGRAM_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    REDIS_URL: str = None
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()