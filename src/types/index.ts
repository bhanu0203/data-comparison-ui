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
