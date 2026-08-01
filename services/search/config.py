from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the SourceBook Search Service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    service_name: str = Field(default="SourceBook Search Service")
    environment: Literal["local", "development", "staging", "production"] = Field(
        default="local"
    )
    log_level: Literal["TRACE", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = (
        Field(default="INFO")
    )
    log_json: bool = Field(default=False)

    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8010, ge=1, le=65535)

    searxng_url: AnyHttpUrl = Field(default="http://localhost:8080")
    searxng_timeout_seconds: float = Field(default=15.0, gt=0)
    searxng_max_results: int = Field(default=10, ge=1, le=50)

    ollama_url: AnyHttpUrl = Field(default="http://localhost:11434")
    ollama_model: str = Field(default="gemma2", min_length=1)
    ollama_timeout_seconds: float = Field(default=60.0, gt=0)

    planner_max_queries: int = Field(default=5, ge=1, le=10)


def get_settings() -> Settings:
    """Create a validated settings object from environment variables."""
    return Settings()
