"""Three-tier classification per CLAUDE.md: (1) folder-path/filename rules,
(2) keyword rules, (3) LLM fallback (providers/llm). This module implements
tiers 1-2; tier 3 is only reached via documents/pipeline.py when neither
tier here produces a confident result."""

import re

from app.shared.classification import detect_department
from app.shared.enums import Department, DocumentCategory

# Folder-path segment (case-insensitive) -> department. Checked before filename.
_FOLDER_DEPARTMENT_RULES: list[tuple[re.Pattern[str], Department]] = [
    (re.compile(r"\b(hr|human[\s_-]?resources)\b", re.IGNORECASE), Department.HUMAN_RESOURCES),
    (re.compile(r"\baccounting\b", re.IGNORECASE), Department.ACCOUNTING),
    (re.compile(r"\btreasury\b", re.IGNORECASE), Department.TREASURY),
    (re.compile(r"\bfinance\b", re.IGNORECASE), Department.FINANCE),
    (re.compile(r"\bsales\b", re.IGNORECASE), Department.SALES),
    (re.compile(r"\boperations\b", re.IGNORECASE), Department.OPERATIONS),
    (re.compile(r"\bprocurement\b", re.IGNORECASE), Department.PROCUREMENT),
    (re.compile(r"\blegal\b", re.IGNORECASE), Department.LEGAL),
    (re.compile(r"\b(it|information[\s_-]?technology)\b", re.IGNORECASE), Department.INFORMATION_TECHNOLOGY),
    (re.compile(r"\badministration\b", re.IGNORECASE), Department.ADMINISTRATION),
]

_EXTENSION_CATEGORY_RULES: dict[str, DocumentCategory] = {
    ".xlsx": DocumentCategory.SPREADSHEET,
    ".xls": DocumentCategory.SPREADSHEET,
    ".csv": DocumentCategory.SPREADSHEET,
    ".pptx": DocumentCategory.PRESENTATION,
    ".ppt": DocumentCategory.PRESENTATION,
}

_FILENAME_CATEGORY_RULES: list[tuple[re.Pattern[str], DocumentCategory]] = [
    (re.compile(r"\bpolicy\b", re.IGNORECASE), DocumentCategory.POLICY),
    (re.compile(r"\b(procedure|sop)\b", re.IGNORECASE), DocumentCategory.PROCEDURE),
    (re.compile(r"\b(contract|agreement)\b", re.IGNORECASE), DocumentCategory.CONTRACT),
    (re.compile(r"\breport\b", re.IGNORECASE), DocumentCategory.REPORT),
    (re.compile(r"\binvoice\b", re.IGNORECASE), DocumentCategory.INVOICE),
    (re.compile(r"\breceipt\b", re.IGNORECASE), DocumentCategory.RECEIPT),
    (re.compile(r"\bmemo\b", re.IGNORECASE), DocumentCategory.MEMO),
    (re.compile(r"\bform\b", re.IGNORECASE), DocumentCategory.FORM),
    (re.compile(r"\bmanual\b", re.IGNORECASE), DocumentCategory.MANUAL),
    (re.compile(r"\bletter\b", re.IGNORECASE), DocumentCategory.LETTER),
    (re.compile(r"\b(minutes|meeting[\s_-]?notes)\b", re.IGNORECASE), DocumentCategory.MEETING_NOTES),
]


def classify_department_by_rules(*, filename: str, folder_path: str) -> tuple[Department | None, str] | None:
    """Tier 1 (folder path) then tier 2 (keyword scoring over filename).
    Returns (department, reason) or None if no rule matched."""
    for pattern, department in _FOLDER_DEPARTMENT_RULES:
        if pattern.search(folder_path):
            return department, f"folder-path rule matched '{pattern.pattern}'"

    department, confidence, _ = detect_department(filename)
    if department is not None:
        return department, f"keyword rule matched in filename (confidence {confidence:.2f})"

    return None


def classify_category_by_rules(*, filename: str) -> tuple[DocumentCategory | None, str] | None:
    lowered = filename.lower()
    for ext, category in _EXTENSION_CATEGORY_RULES.items():
        if lowered.endswith(ext):
            return category, f"file extension '{ext}' rule"

    for pattern, category in _FILENAME_CATEGORY_RULES:
        if pattern.search(filename):
            return category, f"filename keyword rule matched '{pattern.pattern}'"

    return None
