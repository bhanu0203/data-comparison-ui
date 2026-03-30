import enum


class RunStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RunStage(str, enum.Enum):
    QUEUED = "queued"
    UPLOADING = "uploading"
    PDF_PARSING = "pdf_parsing"
    METADATA_MAPPING = "metadata_mapping"
    LLM_EXTRACTION = "llm_extraction"
    RESPONSE_VALIDATION = "response_validation"
    DIFF_COMPUTATION = "diff_computation"
    REPORT_GENERATION = "report_generation"
    COMPLETED = "completed"


STAGE_PROGRESS = {
    RunStage.QUEUED: 0,
    RunStage.UPLOADING: 5,
    RunStage.PDF_PARSING: 15,
    RunStage.METADATA_MAPPING: 30,
    RunStage.LLM_EXTRACTION: 50,
    RunStage.RESPONSE_VALIDATION: 65,
    RunStage.DIFF_COMPUTATION: 80,
    RunStage.REPORT_GENERATION: 95,
    RunStage.COMPLETED: 100,
}
