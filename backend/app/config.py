from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DEEPGRAM_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    OPENAI_API_KEY: str
    FRONTEND_URL: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()