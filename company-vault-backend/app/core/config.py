from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    log_level: str = "INFO"

    enable_dev_login: bool = False
    dev_admin_email: str = "dev-admin@company-vault.local"
    dev_admin_name: str = "Dev Admin"
    admin_allowed_email: str | None = None

    database_url: str = "postgresql+asyncpg://company_vault:company_vault@localhost:5432/company_vault"
    test_database_url: str = (
        "postgresql+asyncpg://company_vault:company_vault@localhost:5432/company_vault_test"
    )

    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 30

    token_encryption_key: str = "changeme-generate-a-real-fernet-key"

    google_client_id: str = ""
    google_client_secret: str = ""
    google_login_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    google_drive_redirect_uri: str = "http://localhost:8000/api/v1/drive/callback"
    frontend_drive_callback_url: str = "http://localhost:8081/drive"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "company_vault"
    s3_secret_key: str = "company_vault_minio_secret"
    s3_bucket_name: str = "company-vault-documents"
    s3_region: str = "us-east-1"

    llm_provider: str = "ollama"
    embedding_provider: str = "ollama"
    ocr_provider: str = "mock"

    ollama_base_url: str = "http://ollama:11434"
    ollama_llm_model: str = "llama3.1:8b"
    ollama_embedding_model: str = "nomic-embed-text"
    ollama_request_timeout_seconds: int = 120

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-4-8"

    chat_department_confidence_threshold: float = 0.65
    chat_department_gap_threshold: float = 0.15
    chunk_size_tokens: int = 800
    chunk_overlap_tokens: int = 150
    chat_rate_limit: str = "10/minute"

    cors_allowed_origins: str = "http://localhost:8080,http://localhost:8081"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def dev_login_active(self) -> bool:
        """Both flags must agree — an intentional double-gate, not redundancy."""
        return self.is_development and self.enable_dev_login


@lru_cache
def get_settings() -> Settings:
    return Settings()
