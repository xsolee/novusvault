import logging
import re

from app.core.config import get_settings

_REDACT_PATTERNS = [
    re.compile(r"(Bearer\s+)[A-Za-z0-9\-_.]+", re.IGNORECASE),
    re.compile(r"(\"?(?:access_token|refresh_token|token|password|secret)\"?\s*[:=]\s*\"?)[^\s\"',}]+", re.IGNORECASE),
]


class RedactingFilter(logging.Filter):
    """Never let tokens, secrets, or credentials reach log output."""

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        for pattern in _REDACT_PATTERNS:
            message = pattern.sub(r"\1[REDACTED]", message)
        record.msg = message
        record.args = ()
        return True


def configure_logging() -> None:
    settings = get_settings()
    root = logging.getLogger()
    root.setLevel(settings.log_level)

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)-8s %(name)s: %(message)s"))
    handler.addFilter(RedactingFilter())

    root.handlers.clear()
    root.addHandler(handler)
