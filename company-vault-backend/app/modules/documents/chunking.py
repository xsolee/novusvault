"""Fixed-size, sentence-boundary-aware chunker. Token counts are approximated
by whitespace word count (no tokenizer dependency) — close enough for the
chunk-size/overlap tuning this needs."""

import re
from dataclasses import dataclass

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


@dataclass
class Chunk:
    content: str
    token_count: int


def chunk_text(text: str, *, chunk_size_tokens: int, chunk_overlap_tokens: int) -> list[Chunk]:
    text = text.strip()
    if not text:
        return []

    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]
    if not sentences:
        sentences = [text]

    chunks: list[Chunk] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = len(sentence.split())

        if current_tokens + sentence_tokens > chunk_size_tokens and current_sentences:
            chunks.append(_finalize(current_sentences, current_tokens))
            current_sentences, current_tokens = _carry_overlap(current_sentences, chunk_overlap_tokens)

        current_sentences.append(sentence)
        current_tokens += sentence_tokens

    if current_sentences:
        chunks.append(_finalize(current_sentences, current_tokens))

    return chunks


def _finalize(sentences: list[str], token_count: int) -> Chunk:
    return Chunk(content=" ".join(sentences), token_count=token_count)


def _carry_overlap(sentences: list[str], overlap_tokens: int) -> tuple[list[str], int]:
    """Keeps trailing sentences (most recent first) until the overlap budget
    is spent, so the next chunk starts with meaningful context."""
    carried: list[str] = []
    tokens = 0
    for sentence in reversed(sentences):
        sentence_tokens = len(sentence.split())
        if tokens + sentence_tokens > overlap_tokens and carried:
            break
        carried.insert(0, sentence)
        tokens += sentence_tokens
    return carried, tokens
