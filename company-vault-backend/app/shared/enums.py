"""Enums shared across modules. Values must stay in sync with the frontend's
`src/types/domain.ts` TS unions exactly — trust the frontend types over any
prose description that drifts from them (see plan notes on Department status
and ChatResponseType casing).
"""

from enum import StrEnum


class Department(StrEnum):
    HUMAN_RESOURCES = "HUMAN_RESOURCES"
    ACCOUNTING = "ACCOUNTING"
    TREASURY = "TREASURY"
    FINANCE = "FINANCE"
    SALES = "SALES"
    OPERATIONS = "OPERATIONS"
    PROCUREMENT = "PROCUREMENT"
    LEGAL = "LEGAL"
    INFORMATION_TECHNOLOGY = "INFORMATION_TECHNOLOGY"
    ADMINISTRATION = "ADMINISTRATION"
    GENERAL = "GENERAL"
    UNKNOWN = "UNKNOWN"


class DocumentCategory(StrEnum):
    POLICY = "POLICY"
    PROCEDURE = "PROCEDURE"
    CONTRACT = "CONTRACT"
    REPORT = "REPORT"
    INVOICE = "INVOICE"
    RECEIPT = "RECEIPT"
    SPREADSHEET = "SPREADSHEET"
    PRESENTATION = "PRESENTATION"
    MEMO = "MEMO"
    FORM = "FORM"
    MANUAL = "MANUAL"
    LETTER = "LETTER"
    MEETING_NOTES = "MEETING_NOTES"
    OTHER = "OTHER"


class DocumentProcessingStatus(StrEnum):
    """No UNSUPPORTED — the frontend TS union only has these four values."""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"


class DocumentSource(StrEnum):
    GOOGLE_DRIVE = "GOOGLE_DRIVE"


class DriveConnectionState(StrEnum):
    NOT_CONNECTED = "NOT_CONNECTED"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    FAILED = "FAILED"


class SyncStage(StrEnum):
    STARTING = "STARTING"
    DISCOVERING_FILES = "DISCOVERING_FILES"
    DOWNLOADING_FILES = "DOWNLOADING_FILES"
    EXTRACTING_TEXT = "EXTRACTING_TEXT"
    RUNNING_OCR = "RUNNING_OCR"
    DETECTING_DEPARTMENT = "DETECTING_DEPARTMENT"
    CREATING_EMBEDDINGS = "CREATING_EMBEDDINGS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SyncStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_ERRORS = "COMPLETED_WITH_ERRORS"
    FAILED = "FAILED"


class ChatRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatResponseType(StrEnum):
    """Lowercase-with-underscores — matches the frontend TS union exactly,
    not the uppercase ANSWER/CLARIFICATION_REQUIRED/... shown in some prose."""

    ANSWER = "answer"
    CLARIFICATION_REQUIRED = "clarification_required"
    NO_RESULTS = "no_results"
    ERROR = "error"


class OAuthFlowType(StrEnum):
    LOGIN = "LOGIN"
    DRIVE_CONNECT = "DRIVE_CONNECT"


class AdminRole(StrEnum):
    """Exactly one role exists in the MVP — no roles/permissions system."""

    ADMIN = "ADMIN"
