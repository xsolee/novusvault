# --- deps: shared base for api and worker ---
FROM python:3.12-slim AS deps
WORKDIR /app

# tesseract-ocr binary is only exercised when OCR_PROVIDER=tesseract; harmless to
# always include since it keeps the image usable for the real provider without a rebuild.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

COPY . .

# --- api: uvicorn serving the FastAPI app ---
FROM deps AS api
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- worker: Dramatiq worker process ---
# Concurrency pinned to 1/1 so a sync run's `stage`/`currentFilename` stay an
# accurate single-file snapshot instead of a lossy multi-document approximation.
FROM deps AS worker
CMD ["dramatiq", "app.workers.actors", "--processes", "1", "--threads", "1"]

# --- migrate: one-shot alembic upgrade, run before api/worker start ---
FROM deps AS migrate
CMD ["alembic", "upgrade", "head"]
