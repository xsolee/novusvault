from fastapi import APIRouter

# No standalone /api/v1/admin/* routes exist in the API surface — GET /auth/me
# is the effective profile endpoint and calls into admin/service.py directly.
# This router is mounted (per the fixed module template) but intentionally empty.
router = APIRouter()
