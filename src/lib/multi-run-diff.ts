import { deepDiff, computeSummary } from './diff-engine'
import type { ComparisonRunDetail, DiffEntry, DiffSummary, DiffType, MetadataConstruct, MetadataField } from '@/types'

export interface RunAnalysis {
  runId: number
  runName: string | null
  createdAt: string
  matchPercentage: number | null
  summary: DiffSummary
  diffs: DiffEntry[]
}

export interface FieldAcrossRuns {
  path: string
  values: {
    runId: number
    runName: string | null
    systemOneValue: unknown
    systemTwoValue: unknown
    diffType: DiffType
  }[]
  isConsistent: boolean
  improved: boolean // diff type got better in latest run vs first
  regressed: boolean // diff type got worse in latest run vs first
}

export type MetadataFieldChange = 'added' | 'removed' | 'modified' | 'unchanged'

export interface MetadataFieldDiff {
  fieldName: string
  jsonPath: string
  change: MetadataFieldChange
  details: {
    runId: number
    runName: string | null
    field: MetadataField | null // null if field doesn't exist in this run
  }[]
}

export interface MetadataDiff {
  schemaChanges: {
    runId: number
    runName: string | null
    name: string
    version: string
    fieldCount: number
  }[]
  fieldDiffs: MetadataFieldDiff[]
  hasChanges: boolean
  addedCount: number
  removedCount: number
  modifiedCount: number
}

export interface MultiRunAnalysis {
  runs: RunAnalysis[]
  fieldComparisons: FieldAcrossRuns[]
  matchTrend: { runId: number; runName: string | null; matchPercentage: number; createdAt: string }[]
  totalFieldPaths: number
  improvedCount: number
  regressedCount: number
  unchangedCount: number
  metadataDiff: MetadataDiff | null
}

// Flatten a DiffEntry tree into leaf entries with their full path
function flattenDiffs(entries: DiffEntry[]): Map<string, DiffEntry> {
  const map = new Map<string, DiffEntry>()
  function walk(items: DiffEntry[]) {
    for (const entry of items) {
      if (entry.children && entry.children.length > 0) {
        walk(entry.children)
      } else {
        map.set(entry.path, entry)
      }
    }
  }
  walk(entries)
  return map
}

const DIFF_RANK: Record<DiffType, number> = {
  match: 0,
  mismatch: 1,
  type_mismatch: 2,
  missing_left: 3,
  missing_right: 3,
  structural: 4,
}

export function analyzeMultipleRuns(runs: ComparisonRunDetail[]): MultiRunAnalysis {
  // Sort runs by creation date
  const sorted = [...runs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Compute diffs for each run
  const analyses: RunAnalysis[] = sorted.map((run) => {
    const s1 = run.system_one_result || {}
    const s2 = run.system_two_data || {}
    const diffs = deepDiff(s1, s2, '', 0, run.array_keys ?? undefined)
    const summary = computeSummary(diffs)
    return {
      runId: run.id,
      runName: run.run_name,
      createdAt: run.created_at,
      matchPercentage: run.match_percentage,
      summary,
      diffs,
    }
  })

  // Collect all unique field paths across all runs
  const allPaths = new Set<string>()
  const flatMaps = analyses.map((a) => {
    const fm = flattenDiffs(a.diffs)
    for (const path of fm.keys()) allPaths.add(path)
    return fm
  })

  // Build cross-run field comparison
  const fieldComparisons: FieldAcrossRuns[] = []
  let improvedCount = 0
  let regressedCount = 0
  let unchangedCount = 0

  for (const path of allPaths) {
    const values = analyses.map((analysis, idx) => {
      const entry = flatMaps[idx].get(path)
      return {
        runId: analysis.runId,
        runName: analysis.runName,
        systemOneValue: entry?.leftValue ?? undefined,
        systemTwoValue: entry?.rightValue ?? undefined,
        diffType: entry?.diffType ?? ('missing_right' as DiffType),
      }
    })

    const diffTypes = values.map((v) => v.diffType)
    const isConsistent = diffTypes.every((d) => d === diffTypes[0])

    const firstRank = DIFF_RANK[diffTypes[0]] ?? 4
    const lastRank = DIFF_RANK[diffTypes[diffTypes.length - 1]] ?? 4
    const improved = lastRank < firstRank
    const regressed = lastRank > firstRank

    if (improved) improvedCount++
    else if (regressed) regressedCount++
    else unchangedCount++

    fieldComparisons.push({ path, values, isConsistent, improved, regressed })
  }

  // Sort: changed fields first, then by path
  fieldComparisons.sort((a, b) => {
    if (a.isConsistent !== b.isConsistent) return a.isConsistent ? 1 : -1
    return a.path.localeCompare(b.path)
  })

  const matchTrend = analyses.map((a) => ({
    runId: a.runId,
    runName: a.runName,
    matchPercentage: a.matchPercentage ?? 0,
    createdAt: a.createdAt,
  }))

  // Metadata construct comparison
  const metadataDiff = compareMetadataConstructs(sorted)

  return {
    runs: analyses,
    fieldComparisons,
    matchTrend,
    totalFieldPaths: allPaths.size,
    improvedCount,
    regressedCount,
    unchangedCount,
    metadataDiff,
  }
}

function compareMetadataConstructs(runs: ComparisonRunDetail[]): MetadataDiff | null {
  const mcs = runs.map((r) => r.metadata_construct as unknown as MetadataConstruct | null)

  // If no run has metadata, skip
  if (mcs.every((mc) => !mc)) return null

  const schemaChanges = runs.map((r, i) => {
    const mc = mcs[i]
    return {
      runId: r.id,
      runName: r.run_name,
      name: mc?.name ?? '—',
      version: mc?.version ?? '—',
      fieldCount: mc?.fields?.length ?? 0,
    }
  })

  // Collect all unique fields by fieldName across all runs
  const allFieldNames = new Set<string>()
  const fieldMaps: Map<string, MetadataField>[] = mcs.map((mc) => {
    const map = new Map<string, MetadataField>()
    if (mc?.fields) {
      for (const f of mc.fields) {
        map.set(f.fieldName, f)
        allFieldNames.add(f.fieldName)
      }
    }
    return map
  })

  const fieldDiffs: MetadataFieldDiff[] = []
  let addedCount = 0
  let removedCount = 0
  let modifiedCount = 0

  for (const fieldName of allFieldNames) {
    const details = runs.map((r, i) => ({
      runId: r.id,
      runName: r.run_name,
      field: fieldMaps[i].get(fieldName) ?? null,
    }))

    // Determine change type by comparing first and last run
    const firstField = details[0].field
    const lastField = details[details.length - 1].field
    let change: MetadataFieldChange = 'unchanged'

    if (!firstField && lastField) {
      change = 'added'
      addedCount++
    } else if (firstField && !lastField) {
      change = 'removed'
      removedCount++
    } else if (firstField && lastField) {
      const changed =
        firstField.jsonPath !== lastField.jsonPath ||
        firstField.type !== lastField.type ||
        firstField.description !== lastField.description
      if (changed) {
        change = 'modified'
        modifiedCount++
      }
    }

    const jsonPath = lastField?.jsonPath ?? firstField?.jsonPath ?? ''

    fieldDiffs.push({ fieldName, jsonPath, change, details })
  }

  // Sort: changes first (added, removed, modified), then unchanged
  const changeOrder: Record<MetadataFieldChange, number> = { added: 0, removed: 1, modified: 2, unchanged: 3 }
  fieldDiffs.sort((a, b) => changeOrder[a.change] - changeOrder[b.change] || a.fieldName.localeCompare(b.fieldName))

  const hasChanges = addedCount > 0 || removedCount > 0 || modifiedCount > 0

  return { schemaChanges, fieldDiffs, hasChanges, addedCount, removedCount, modifiedCount }
}
