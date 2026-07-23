from dataclasses import dataclass
from typing import Protocol


@dataclass
class OCRResult:
    text: str
    confidence: float


class OCRProvider(Protocol):
    async def extract_text(self, file_bytes: bytes, mime_type: str) -> OCRResult: ...
