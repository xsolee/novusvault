from app.providers.ocr.base import OCRResult


class MockOCRProvider:
    """Always 'succeeds' so the pipeline never stalls in demo mode.
    Set OCR_PROVIDER=tesseract for real text extraction."""

    async def extract_text(self, file_bytes: bytes, mime_type: str) -> OCRResult:
        return OCRResult(
            text=f"[MOCK OCR OUTPUT for {mime_type}, {len(file_bytes)} bytes] "
            "Set OCR_PROVIDER=tesseract for real text extraction.",
            confidence=0.5,
        )
