# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository holds **Company Vault**, a monorepo whose architecture and constraints are documented
here so implementation work stays consistent across sessions. Both apps have a working implementation:
the backend's modules, providers, and schema are built out, and the frontend's `src/services/*` call the
real backend (see "Cross-cutting notes" for what's still stubbed/deferred rather than mock-only).

Build order was **frontend first, then backend**: the frontend was built to run fully against mocked
services so it could be demoed before any backend endpoint existed, then the backend was built to match
that same API/type contract. `src/mocks/*` still exists as Jest test fixtures, not the runtime path.

## What Company Vault is

A company-wide knowledge and document assistant. A single administrator signs in with Google, connects a
Google Drive folder, manually triggers synchronization of documents from that folder, and asks natural-
language questions over the indexed company knowledge via a department-aware RAG chatbot. Documents may
come from any department (HR, Accounting, Treasury, Finance, Sales, Operations, Procurement, Legal, IT,
Administration, General) — nothing is invoice/receipt-specific.

**MVP user model:** exactly one role, `ADMIN`. No organizations, invitations, user management, roles, or
permissions. Do not add these even if they seem like natural extensions.

## Repository layout

```text
novusvault/
  company-vault-frontend/   # Expo React Native app (web + Android + iOS from one codebase)
  company-vault-backend/    # FastAPI modular monolith + Dramatiq worker
```

The two apps communicate exclusively over REST. The frontend never talks to Google Drive or any LLM/OCR/
embedding provider directly — all of that is backend-only, behind the backend's REST API.

---

## Frontend — `company-vault-frontend/`

### Stack
React Native + Expo + Expo Router + TypeScript (strict) + React Native Web + TanStack Query +
React Hook Form + Zod + Axios + Expo SecureStore + Jest + React Native Testing Library.

Avoid `any` unless truly unavoidable. The same codebase must run on web, Android, and iOS.

### Commands
```bash
npm install
npm run start      # Expo dev server
npm run web
npm run android
npm run ios
npm run test        # Jest + React Native Testing Library
npm run typecheck   # tsc --noEmit
```
To run a single test file: `npm run test -- path/to/file.test.tsx`.

### Architecture
Feature-based monolithic structure, not a package-per-feature workspace:

```text
app/                  # Expo Router routes only (screens wire together src/features)
  _layout.tsx
  index.tsx / login.tsx / dashboard.tsx
  documents/ (index.tsx, [id].tsx)
  drive/  chat/  settings/
src/
  components/common|layout|feedback/
  features/auth|dashboard|drive|documents|chat|settings/
  services/            # apiClient.ts, authService.ts, driveService.ts, documentService.ts, chatService.ts, settingsService.ts
  hooks/  types/  utils/  constants/
  mocks/                # typed mock API implementations, separate from page components
```

Key rules:
- Routing/screen files under `app/` should stay thin; real logic lives in `src/features/*`.
- All backend calls go through `src/services/*`; no screen calls Axios or the Drive API directly.
- `src/services/*` call the real backend via `apiClient` (`src/services/apiClient.ts`). `src/mocks/*`
  remains only as Jest test fixtures — not the runtime implementation. Exception: real Google OAuth
  login has no frontend completion path yet (the backend's `/auth/google/callback` returns raw JSON to
  whatever browser tab Google redirects to, with no frontend callback route to intercept it), so
  `useAuth`'s `signInWithGoogle` currently calls the backend's `/auth/dev-login` route instead — real
  Google login is a follow-up that needs a backend-side redirect change first.
- The frontend **never** receives or stores Google provider tokens — only the Company Vault app
  session token, stored via Expo SecureStore (or the platform-appropriate equivalent on web).
- Navigation: bottom tabs on mobile, left sidebar on web/large screens. Primary sections: Dashboard,
  Documents, Google Drive, Ask Company Vault, Settings. Keep navigation flat/simple.

### Domain contract types (must mirror backend)
`AdminUser`, `AuthSession`, `GoogleDriveConnection`, `DriveFolder`, `SyncRun`, `SyncStatus`, `Document`,
`DocumentDetails`, `DocumentDepartment`, `DocumentCategory`, `DocumentProcessingStatus`, `ChatMessage`,
`ChatRequest`, `ChatResponse`, `ChatCitation`, `ClarificationSuggestion`.

`ChatResponseType` is a union: `"answer" | "clarification_required" | "no_results" | "error"`. The chat UI
must render clarification suggestions and citations distinctly from a plain answer — see the backend
section below for the exact response shapes.

### Explicit MVP boundaries (frontend)
Do not implement: multi-org support, member invitations, user/role/permission management, file
change/delete/modify detection, automatic or scheduled sync, retention/version history/file restore,
document delete/archive/bulk actions, document-type-specific detail forms, heavy analytics/charts.

---

## Backend — `company-vault-backend/`

### Stack
Python 3.12+, FastAPI (async where practical), Pydantic v2, SQLAlchemy 2 (async), Alembic, PostgreSQL +
pgvector (hosted on Supabase), Redis, Dramatiq, Google OAuth 2.0 + Google Drive API, S3-compatible object
storage (Supabase Storage), Ollama (self-hosted in Docker — default LLM + embeddings provider) with
Anthropic's Claude API as the swappable hosted LLM alternative, Pytest, Docker Compose. Strict type hints
throughout.

### Commands
```bash
docker compose up -d        # Redis, Ollama (+ model pull), API, worker.
                             # Postgres/pgvector and object storage are hosted on Supabase, not local
                             # containers — DATABASE_URL and S3_* in .env point at the real project.
alembic upgrade head         # apply migrations (against the Supabase DATABASE_URL)
uvicorn app.main:app --reload
pytest                       # full suite
pytest path/to/test_file.py::test_name   # single test
```

### Architecture: modular monolith
One deployable FastAPI app + one Dramatiq worker from the same codebase, one Postgres database. No
microservices.

```text
app/
  main.py
  core/          # config, database, security, logging, exceptions
  modules/
    auth/        # Google OAuth login/session
    admin/       # current-admin profile
    drive/       # Google Drive connection + folder selection (separate from auth!)
    sync/        # manual synchronization runs
    documents/   # extraction, classification, document records
    knowledge/   # retrieval + RAG chat
    settings/
    # each module: router.py, schemas.py, service.py, repository.py, models.py
  providers/     # llm/, embeddings/, ocr/, storage/ — swappable adapters behind interfaces
  workers/       # broker.py, actors.py (Dramatiq)
  shared/        # enums, pagination, dependencies, utils
migrations/
tests/
```

Layering rule: routers stay thin → business logic in `service.py` → DB access in `repository.py` →
external calls (Google, LLM, OCR, storage) only through `providers/*` adapters. Nothing outside
`providers/` should import a specific vendor SDK directly.

### Auth model (important nuance)
Google **Login** and Google **Drive** authorization are separate capabilities/flows — an admin can log in
without ever granting Drive access. Login uses backend-controlled OAuth 2.0 authorization-code flow with
state/PKCE validation; issues a short-lived JWT access token + refresh token; HTTP-only cookies for web,
secure code-exchange for Expo mobile. Google tokens (both login and Drive) are encrypted at rest and never
returned to the frontend.

### Source connector abstraction
Ingestion sources are behind a `SourceConnector` protocol (`list_files`, `download_file`,
`get_file_metadata`) so future sources (Sheets, S3, upload, OneDrive, SharePoint, Gmail) can be added
later. For the MVP, implement only `GoogleDriveConnector`. One Drive account, one selected root folder,
manual sync only — dedupe new files by Google Drive file ID, don't build change detection/reconciliation.

### Document processing pipeline
`download → extract text → OCR (only for images/scanned/low-text PDFs) → classify department → classify
category → summarize/extract topics → chunk → embed → mark indexed`. Every stage must be retryable and
idempotent (Dramatiq actors, exponential backoff, clear error recording).

Classification order: **(1) folder-path/filename rules → (2) keyword rules → (3) LLM fallback**, returning
structured JSON (`department`, `document_category`, `confidence`, `reason`). Don't build per-department
schemas.

Enums (keep in sync with frontend types):
- Department: `HUMAN_RESOURCES, ACCOUNTING, TREASURY, FINANCE, SALES, OPERATIONS, PROCUREMENT, LEGAL, INFORMATION_TECHNOLOGY, ADMINISTRATION, GENERAL, UNKNOWN`
- Category: `POLICY, PROCEDURE, CONTRACT, REPORT, INVOICE, RECEIPT, SPREADSHEET, PRESENTATION, MEMO, FORM, MANUAL, LETTER, MEETING_NOTES, OTHER`
- Processing status: `Pending, Processing, Indexed, Failed, Unsupported`

### Retrieval and chat (RAG)
Hybrid retrieval = pgvector similarity + Postgres full-text + department/category filters. No graph DB,
reranker service, or multi-agent framework.

Chat flow: detect department → detect topic → assess whether the question is specific enough → if not,
return a clarification request (options must come only from departments/topics that actually exist in
indexed data — never invent options) → otherwise retrieve chunks → generate a grounded answer with
citations.

Ambiguity is decided by combining keyword scores + search-result distribution + department metadata + LLM
classification — not the LLM alone. Reference thresholds: top department confidence below 0.65, or the
gap between the top two departments below 0.15, → ask for clarification (thresholds should be
configurable).

Response contract (`type` drives frontend rendering): `ANSWER | CLARIFICATION_REQUIRED | NO_RESULTS |
ERROR`. An `ANSWER` includes `detected_department`, `detected_topic`, and `citations[]`
(`document_id, document_name, department, page_number, excerpt`). A `CLARIFICATION_REQUIRED` includes
`suggestions[]` (`label, department, topic`).

Hallucination guardrails are load-bearing, not optional: answer only from retrieved context, cite every
company-specific factual claim, explicitly say when the indexed documents are insufficient, never let
general model knowledge masquerade as a company fact.

### Provider abstractions
`providers/llm`, `providers/embeddings`, `providers/ocr`, `providers/storage` each define an interface
with a mock implementation for tests, so vendor code (OpenAI/Anthropic/Gemini, OCR engine, S3) never
leaks into `modules/*`. LLM/embeddings default to a real Ollama provider (running in Docker) in normal
operation, not mock — `LLM_PROVIDER=anthropic` (+ `ANTHROPIC_API_KEY`) swaps to the hosted Claude API
without touching `modules/*`. `EMBEDDING_PROVIDER` has no hosted alternative wired up yet (see
"Infrastructure decisions" below for why that's not just a config flip).

### Infrastructure decisions (don't "fix" these without reading why)
- **Supabase: direct connection (port 5432), not the transaction pooler (6543).** At single-admin MVP
  scale, pgbouncer's transaction-mode incompatibility with asyncpg's prepared-statement cache isn't worth
  taking on for a workload nowhere near the pooler's actual purpose. Revisit only if connection-count
  pressure appears (e.g. multiple `api`/`worker` replicas).
- **`document_embeddings.embedding` is `vector(768)`, pinned to Ollama's `nomic-embed-text` output size —
  not the more common 1536.** Switching to a 1536-dim provider (e.g. `EMBEDDING_PROVIDER=openai`) later
  needs a schema migration and a full re-embed of every existing chunk, not just a config change.

### API surface
```text
GET  /api/v1/auth/google/login        GET  /api/v1/auth/google/callback
POST /api/v1/auth/refresh             POST /api/v1/auth/logout
GET  /api/v1/auth/me

GET    /api/v1/drive/connect          GET    /api/v1/drive/callback
GET    /api/v1/drive/status           GET    /api/v1/drive/folders
POST   /api/v1/drive/select-folder    DELETE /api/v1/drive/disconnect

POST /api/v1/sync                     GET  /api/v1/sync
GET  /api/v1/sync/{sync_run_id}

GET  /api/v1/documents                GET  /api/v1/documents/{document_id}
GET  /api/v1/documents/{document_id}/content
POST /api/v1/documents/{document_id}/reprocess

POST /api/v1/chat                     GET  /api/v1/chat/history
GET  /api/v1/settings

GET /health   GET /ready
```
Keep response models aligned with the frontend's TypeScript types listed above.

### Data model (SQLAlchemy models + Alembic migrations)
`admins, auth_sessions, google_oauth_states, drive_connections, drive_folders, sync_runs, documents,
document_chunks, document_embeddings, chat_conversations, chat_messages, chat_citations,
application_settings`. UUID primary keys where appropriate. Keep the schema clean enough to add
multi-org later, but do not implement org behavior now.

### Security constraints worth remembering
Encrypted Google refresh tokens; OAuth state + PKCE; JWT validation; rate limiting on `/chat`; MIME-type
and file-size validation on ingestion; never log tokens, full document contents, embeddings, or
sensitive chat context.

### Explicit MVP boundaries (backend)
Do not implement: multi-org/multi-tenancy, multiple roles, invitations, document deletion/version
handling, automatic or scheduled Drive sync, change tokens/push notifications, retention/purging policies,
approval workflows, Sheets/S3/email ingestion, knowledge graphs, multi-agent orchestration, fine-grained
permissions.

---

## Cross-cutting notes
- The frontend's mocked services (`src/mocks/*`) and the backend's chat/document/sync contracts are meant
  to be the *same* shapes described above — when building the backend, check the frontend's `src/types/*`
  and mocks first rather than re-deriving the contract from the spec text alone.
- Both apps ship a `.env.example`: frontend needs `EXPO_PUBLIC_API_BASE_URL` and
  `EXPO_PUBLIC_APP_NAME`; backend needs Google OAuth credentials/redirect URIs, a Supabase
  `DATABASE_URL` (direct connection) + Supabase Storage's S3-compatible credentials (`S3_*`,
  separate from the DB password), `REDIS_URL`, JWT secrets/expiries, `OLLAMA_*` (base URL + model
  names, default provider), `ANTHROPIC_*` (only needed if `LLM_PROVIDER=anthropic`), and
  `LLM_PROVIDER` / `EMBEDDING_PROVIDER` / `OCR_PROVIDER` selectors.
