from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Identity ---
    app_name: str = "ApexGrid F1 API"
    app_version: str = "0.1.0"

    # --- Routing ---
    # All v1 routes hang under this prefix so we never break a released API.
    api_v1_prefix: str = "/api/v1"

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # --- FastF1 on-disk cache (Step 2) ---
    fastf1_cache_dir: str = "cache"

    # --- API response cache (in-memory, per-process) ---
    response_cache_ttl_seconds: int = 300      # 5 minutes
    response_cache_maxsize: int = 128          # max cached entries

    # Load overrides from a .env file if one exists.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
   
    return Settings()
