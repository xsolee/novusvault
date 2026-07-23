from urllib.parse import urlencode

import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import get_settings
from app.providers.google_oauth.base import GoogleIdentity, GoogleTokenResponse

_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"

settings = get_settings()


def build_authorization_url(*, scopes: list[str], redirect_uri: str, state: str, code_challenge: str) -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{_AUTH_ENDPOINT}?{urlencode(params)}"


async def exchange_code(*, code: str, code_verifier: str, redirect_uri: str) -> GoogleTokenResponse:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            _TOKEN_ENDPOINT,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "code_verifier": code_verifier,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        data = response.json()

    return GoogleTokenResponse(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token"),
        expires_in=data["expires_in"],
        id_token=data.get("id_token"),
        scope=data.get("scope", ""),
    )


async def refresh_access_token(refresh_token: str) -> GoogleTokenResponse:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            _TOKEN_ENDPOINT,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        response.raise_for_status()
        data = response.json()

    return GoogleTokenResponse(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token", refresh_token),
        expires_in=data["expires_in"],
        id_token=data.get("id_token"),
        scope=data.get("scope", ""),
    )


def verify_id_token(id_token_str: str) -> GoogleIdentity:
    claims = google_id_token.verify_oauth2_token(
        id_token_str, google_requests.Request(), settings.google_client_id
    )
    return GoogleIdentity(
        subject_id=claims["sub"],
        email=claims["email"],
        name=claims.get("name", claims["email"]),
        picture=claims.get("picture"),
    )
