from datetime import datetime
from pydantic import BaseModel


# ── Agreements ──

class AgreementCreate(BaseModel):
    agreement_id: str
    name: str
    json_data: dict


class AgreementResponse(BaseModel):
    id: int
    agreement_id: str
    name: str
    field_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgreementDetail(AgreementResponse):
    json_data: dict

    model_config = {"from_attributes": True}


# ── Comparison Runs ──

class ComparisonRunResponse(BaseModel):
    id: int
    agreement_id: int
    agreement_display_id: str | None = None
    agreement_name: str | None = None
    run_name: str | None
    status: str
    current_stage: str
    progress_percentage: int
    match_percentage: float | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None

    model_config = {"from_attributes": True}


class ComparisonRunDetail(ComparisonRunResponse):
    system_one_result: dict | None = None
    system_two_data: dict | None = None
    metadata_construct: dict | None = None

    model_config = {"from_attributes": True}


class StatusCounts(BaseModel):
    queued: int = 0
    processing: int = 0
    completed: int = 0
    failed: int = 0


class PaginatedComparisonRuns(BaseModel):
    items: list[ComparisonRunResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    status_counts: StatusCounts


class RerunRequest(BaseModel):
    metadata_construct: dict | None = None
    run_name: str | None = None


class RunProgress(BaseModel):
    id: int
    status: str
    current_stage: str
    progress_percentage: int
    match_percentage: float | None
    error_message: str | None

    model_config = {"from_attributes": True}
