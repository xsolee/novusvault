from dataclasses import dataclass


@dataclass
class GoogleTokenResponse:
    access_token: str
    refresh_token: str | None
    expires_in: int
    id_token: str | None
    scope: str


@dataclass
class GoogleIdentity:
    subject_id: str
    email: str
    name: str
    picture: str | None
