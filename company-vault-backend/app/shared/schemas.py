from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base for every response/request schema. Python stays snake_case,
    JSON in/out is camelCase — matches the frontend's TS field names exactly
    (e.g. `documentId`, `detectedDepartment`). Enum *values* are untouched."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class AuthorizationUrlResponse(CamelModel):
    authorization_url: str


class ErrorResponse(CamelModel):
    error_code: str
    message: str
