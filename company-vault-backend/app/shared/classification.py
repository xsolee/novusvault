"""Keyword-based department/topic detection, ported from the frontend's
`chatMock.ts` so document classification (tier 2) and chat department
detection share identical, deterministic scoring. Not LLM-based — this is
the literal keyword tier described in CLAUDE.md's classification order."""

from app.shared.enums import Department

DEPARTMENT_KEYWORDS: dict[Department, list[str]] = {
    Department.HUMAN_RESOURCES: ["leave", "maternity", "onboarding", "handbook", "employee", "hr"],
    Department.ACCOUNTING: ["reimbursement", "expense", "withholding tax", "accounting"],
    Department.TREASURY: ["treasury", "payment release", "outgoing payment"],
    Department.PROCUREMENT: ["vendor", "procurement", "accreditation", "purchase order"],
    Department.LEGAL: ["contract", "acme", "agreement", "legal"],
    Department.FINANCE: ["financial report", "budget", "finance"],
    Department.INFORMATION_TECHNOLOGY: ["access request", "password", "it ticket"],
}

_BROAD_TERMS = ["approval process", "the process", "policy", "requirements", "the rules", "documents"]


def score_departments(text: str) -> dict[Department, int]:
    lowered = text.lower()
    scores: dict[Department, int] = {}
    for department, keywords in DEPARTMENT_KEYWORDS.items():
        hits = sum(1 for keyword in keywords if keyword in lowered)
        if hits:
            scores[department] = hits
    return scores


def detect_department(text: str) -> tuple[Department | None, float, dict[Department, float]]:
    """Returns (top department or None, top confidence, per-department
    confidence map) — confidence = min(0.95, 0.6 + matched_keyword_count * 0.15),
    matching the frontend's exact formula."""
    scores = score_departments(text)
    if not scores:
        return None, 0.0, {}

    confidences = {dept: min(0.95, 0.6 + count * 0.15) for dept, count in scores.items()}
    top_department = max(confidences, key=lambda d: confidences[d])
    return top_department, confidences[top_department], confidences


def is_broad_question(text: str, top_confidence: float) -> bool:
    lowered = text.lower()
    mentions_broad_term = any(term in lowered for term in _BROAD_TERMS)
    return mentions_broad_term and top_confidence < 0.65


def guess_topic(text: str) -> str:
    lowered = text.lower()
    if "maternity" in lowered:
        return "Maternity leave"
    if "leave" in lowered:
        return "Leave policy"
    if "reimbursement" in lowered or "expense" in lowered:
        return "Expense reimbursement"
    if "payment" in lowered:
        return "Payment procedure"
    if "vendor" in lowered or "accreditation" in lowered:
        return "Vendor accreditation"
    return "General inquiry"
