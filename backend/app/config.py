import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEEPGRAM_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    OPENAI_API_KEY: str

    # Pydantic v2: combine config for env file and extra handling
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()