from functools import lru_cache

from app.core.config import get_settings
from app.providers.ocr.base import OCRProvider
from app.providers.ocr.mock import MockOCRProvider

settings = get_settings()


@lru_cache
def get_ocr_provider() -> OCRProvider:
    if settings.ocr_provider == "mock":
        return MockOCRProvider()
    if settings.ocr_provider == "tesseract":
        from app.providers.ocr.tesseract_provider import TesseractOCRProvider

        return TesseractOCRProvider()  # type: ignore[return-value]
    raise ValueError(f"Unknown OCR_PROVIDER: {settings.ocr_provider}")
