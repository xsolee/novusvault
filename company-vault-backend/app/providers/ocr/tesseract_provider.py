import asyncio
import io

import pytesseract
from PIL import Image

from app.providers.ocr.base import OCRResult


class TesseractOCRProvider:
    """Real OCR_PROVIDER=tesseract implementation. Expects image bytes —
    PDF pages are rasterized to images by documents/extraction.py before
    being handed here, so this provider only ever deals with raster images."""

    async def extract_text(self, file_bytes: bytes, mime_type: str) -> OCRResult:
        return await asyncio.to_thread(self._extract_sync, file_bytes)

    def _extract_sync(self, file_bytes: bytes) -> OCRResult:
        image = Image.open(io.BytesIO(file_bytes))
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        text = " ".join(word for word in data["text"] if word.strip())
        confidences = [int(c) for c in data["conf"] if c not in ("-1", -1)]
        avg_confidence = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0
        return OCRResult(text=text, confidence=avg_confidence)
