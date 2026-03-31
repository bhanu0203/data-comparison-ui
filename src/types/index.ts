export interface MetadataField {
  fieldName: string
  jsonPath: string
  description: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array'
}

export interface MetadataConstruct {
  name: string
  version: string
  fields: MetadataField[]
}

export interface SystemOneInput {
  file: File | null
  fileName: string
  metadata: MetadataConstruct
}

export interface ExtractionResult {
  [key: string]: unknown
}

export type DiffType = 'match' | 'mismatch' | 'missing_left' | 'missing_right' | 'type_mismatch' | 'structural'

export interface DiffEntry {
  path: string
  key: string
  depth: number
  leftValue: unknown
  rightValue: unknown
  diffType: DiffType
  children?: DiffEntry[]
}

export interface DiffSummary {
  totalFields: number
  matched: number
  mismatched: number
  missingLeft: number
  missingRight: number
  typeMismatches: number
  matchPercentage: number
}

export interface ComparisonResult {
  diffs: DiffEntry[]
  summary: DiffSummary
  systemOneData: ExtractionResult
  systemTwoData: ExtractionResult
}

// ── Backend types ──

export interface Agreement {
  id: number
  agreement_id: string
  name: string
  field_count: number
  created_at: string
  updated_at: string
}

export interface AgreementDetail extends Agreement {
  json_data: Record<string, unknown>
}

export type RunStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type RunStage =
  | 'queued'
  | 'uploading'
  | 'pdf_parsing'
  | 'metadata_mapping'
  | 'llm_extraction'
  | 'response_validation'
  | 'diff_computation'
  | 'report_generation'
  | 'completed'

export interface ComparisonRun {
  id: number
  agreement_id: number
  agreement_display_id: string | null
  agreement_name: string | null
  run_name: string | null
  status: RunStatus
  current_stage: RunStage
  progress_percentage: number
  match_percentage: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

export interface ComparisonRunDetail extends ComparisonRun {
  system_one_result: Record<string, unknown> | null
  system_two_data: Record<string, unknown> | null
  metadata_construct: Record<string, unknown> | null
}

export interface RunProgress {
  id: number
  status: RunStatus
  current_stage: RunStage
  progress_percentage: number
  match_percentage: number | null
  error_message: string | null
}

// ── Pagination ──

export interface StatusCounts {
  queued: number
  processing: number
  completed: number
  failed: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
  status_counts: StatusCounts
}

export interface ComparisonSearchParams {
  page?: number
  page_size?: number
  search?: string
  status?: string
  date_from?: string
  date_to?: string
  match_min?: number
  match_max?: number
  agreement_id?: number
  sort_by?: string
  sort_order?: string
}
