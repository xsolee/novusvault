import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import jwt
from cryptography.fernet import Fernet

from app.core.config import get_settings

settings = get_settings()


def create_access_token(*, admin_id: uuid.UUID, email: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(admin_id),
        "email": email,
        "role": "ADMIN",
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)


_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(settings.token_encryption_key.encode())
    return _fernet


def encrypt_token(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt_token(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()


def generate_pkce_pair() -> tuple[str, str]:
    """Returns (code_verifier, code_challenge) for an OAuth PKCE S256 flow."""
    import base64

    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


def generate_oauth_state() -> str:
    return secrets.token_urlsafe(32)
