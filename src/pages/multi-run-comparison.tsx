import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress-ring'
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Filter,
  ArrowUpRight, ArrowDownRight, Equal, ChevronDown, ChevronRight,
  Braces, Plus, Trash2, Pencil, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getComparisonsBatch } from '@/lib/api-service'
import { analyzeMultipleRuns, type MultiRunAnalysis, type FieldAcrossRuns, type MetadataDiff, type MetadataFieldChange } from '@/lib/multi-run-diff'
import type { ComparisonRunDetail, DiffType } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type FieldFilter = 'all' | 'changed' | 'improved' | 'regressed' | 'consistent'

const DIFF_COLORS: Record<DiffType, string> = {
  match: 'bg-emerald-100 text-emerald-700',
  mismatch: 'bg-amber-100 text-amber-700',
  missing_left: 'bg-blue-100 text-blue-700',
  missing_right: 'bg-purple-100 text-purple-700',
  type_mismatch: 'bg-red-100 text-red-700',
  structural: 'bg-gray-100 text-gray-700',
}

const DIFF_LABELS: Record<DiffType, string> = {
  match: 'Match',
  mismatch: 'Mismatch',
  missing_left: 'Only Sys 2',
  missing_right: 'Only Sys 1',
  type_mismatch: 'Type Diff',
  structural: 'Structural',
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous
  if (Math.abs(delta) < 0.05) {
    return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Equal className="w-3 h-3" /> 0%</span>
  }
  if (delta > 0) {
    return <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-semibold"><ArrowUpRight className="w-3 h-3" /> +{delta.toFixed(1)}%</span>
  }
  return <span className="text-[10px] text-red-600 flex items-center gap-0.5 font-semibold"><ArrowDownRight className="w-3 h-3" /> {delta.toFixed(1)}%</span>
}

export function MultiRunComparisonPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [runs, setRuns] = useState<ComparisonRunDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>('all')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [metadataSectionOpen, setMetadataSectionOpen] = useState(true)

  const ids = useMemo(() => {
    const raw = searchParams.get('ids') || ''
    return raw.split(',').map(Number).filter((n) => n > 0)
  }, [searchParams])

  useEffect(() => {
    if (ids.length < 2) {
      setError('Select at least 2 runs to compare')
      setLoading(false)
      return
    }
    setLoading(true)
    getComparisonsBatch(ids)
      .then(setRuns)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load runs'))
      .finally(() => setLoading(false))
  }, [ids])

  const analysis: MultiRunAnalysis | null = useMemo(() => {
    if (runs.length < 2) return null
    return analyzeMultipleRuns(runs)
  }, [runs])

  const filteredFields = useMemo(() => {
    if (!analysis) return []
    switch (fieldFilter) {
      case 'changed': return analysis.fieldComparisons.filter((f) => !f.isConsistent)
      case 'improved': return analysis.fieldComparisons.filter((f) => f.improved)
      case 'regressed': return analysis.fieldComparisons.filter((f) => f.regressed)
      case 'consistent': return analysis.fieldComparisons.filter((f) => f.isConsistent)
      default: return analysis.fieldComparisons
    }
  }, [analysis, fieldFilter])

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  if (loading) {
    return <div className="text-center text-sm text-muted-foreground py-12 animate-slide-up">Loading runs...</div>
  }

  if (error || !analysis) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          {error || 'Could not analyze runs'}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-3 h-3" /> Back to Runs
        </Button>
      </div>
    )
  }

  const chartData = analysis.matchTrend.map((t, i) => ({
    name: t.runName || `Run #${t.runId}`,
    match: t.matchPercentage,
    runId: t.runId,
    fill: i === analysis.matchTrend.length - 1 ? 'oklch(0.65 0.2 250)' : 'oklch(0.75 0.15 250 / 0.6)',
  }))

  const filterOptions: { value: FieldFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All Fields', count: analysis.totalFieldPaths },
    { value: 'changed', label: 'Changed', count: analysis.improvedCount + analysis.regressedCount },
    { value: 'improved', label: 'Improved', count: analysis.improvedCount },
    { value: 'regressed', label: 'Regressed', count: analysis.regressedCount },
    { value: 'consistent', label: 'Unchanged', count: analysis.unchangedCount },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Multi-Run Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Comparing {analysis.runs.length} runs across {analysis.totalFieldPaths} fields
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-wrap justify-end">
          {analysis.runs.map((r) => (
            <Badge key={r.runId} variant="outline" className="text-[10px] gap-1">
              #{r.runId}
              {r.runName && <span className="text-muted-foreground truncate max-w-24">{r.runName}</span>}
            </Badge>
          ))}
        </div>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analysis.runs.map((run, i) => (
          <Card
            key={run.runId}
            className={cn(
              'transition-all',
              i === analysis.runs.length - 1 && 'border-primary/30 shadow-md'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ProgressRing value={run.matchPercentage ?? 0} size={48} strokeWidth={4} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {run.runName || `Run #${run.runId}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    #{run.runId} · {new Date(run.createdAt).toLocaleDateString()}
                  </div>
                  {i > 0 && run.matchPercentage != null && analysis.runs[i - 1].matchPercentage != null && (
                    <DeltaBadge current={run.matchPercentage} previous={analysis.runs[i - 1].matchPercentage!} />
                  )}
                  {i === 0 && <span className="text-[10px] text-muted-foreground">Baseline</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-600">{run.summary.matched}</div>
                  <div className="text-[10px] text-muted-foreground">Match</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-amber-600">{run.summary.mismatched}</div>
                  <div className="text-[10px] text-muted-foreground">Diff</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-red-600">{run.summary.missingLeft + run.summary.missingRight}</div>
                  <div className="text-[10px] text-muted-foreground">Missing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Match % trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Match Percentage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0 0)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid oklch(0.9 0 0)' }}
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Match']}
                />
                <Bar dataKey="match" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Impact summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">{analysis.improvedCount}</div>
              <div className="text-xs text-emerald-600">Fields Improved</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700">{analysis.regressedCount}</div>
              <div className="text-xs text-red-600">Fields Regressed</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Minus className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">{analysis.unchangedCount}</div>
              <div className="text-xs text-gray-600">Fields Unchanged</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata Construct Comparison */}
      {analysis.metadataDiff && (
        <MetadataComparisonSection
          diff={analysis.metadataDiff}
          open={metadataSectionOpen}
          onToggle={() => setMetadataSectionOpen(!metadataSectionOpen)}
          runCount={analysis.runs.length}
        />
      )}

      {/* Field-level comparison table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Field-Level Comparison
            </CardTitle>
            <div className="flex items-center gap-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFieldFilter(opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                    fieldFilter === opt.value
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {opt.label}
                  <span className={cn('ml-1', fieldFilter === opt.value ? 'text-white/70' : 'text-muted-foreground/50')}>
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid items-center border-y bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground"
            style={{ gridTemplateColumns: `280px repeat(${analysis.runs.length}, 1fr) 80px` }}
          >
            <div>Field Path</div>
            {analysis.runs.map((r) => (
              <div key={r.runId} className="text-center truncate px-1">
                {r.runName || `Run #${r.runId}`}
              </div>
            ))}
            <div className="text-center">Trend</div>
          </div>

          {/* Table body */}
          <div className="max-h-[600px] overflow-y-auto">
            {filteredFields.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No fields match the current filter
              </div>
            ) : (
              filteredFields.map((field) => (
                <FieldRow
                  key={field.path}
                  field={field}
                  runCount={analysis.runs.length}
                  expanded={expandedPaths.has(field.path)}
                  onToggle={() => toggleExpand(field.path)}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FieldRow({
  field,
  runCount,
  expanded,
  onToggle,
}: {
  field: FieldAcrossRuns
  runCount: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={cn(
      'border-b last:border-b-0 transition-colors',
      field.improved && 'bg-emerald-50/30',
      field.regressed && 'bg-red-50/20',
    )}>
      {/* Main row */}
      <div
        className="grid items-center px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
        style={{ gridTemplateColumns: `280px repeat(${runCount}, 1fr) 80px` }}
        onClick={onToggle}
      >
        {/* Path */}
        <div className="flex items-center gap-1.5 min-w-0">
          {expanded
            ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          }
          <span className="font-mono text-xs truncate" title={field.path}>{field.path}</span>
        </div>

        {/* Diff badges per run */}
        {field.values.map((v) => (
          <div key={v.runId} className="flex justify-center">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium',
              DIFF_COLORS[v.diffType]
            )}>
              {DIFF_LABELS[v.diffType]}
            </span>
          </div>
        ))}

        {/* Trend indicator */}
        <div className="flex justify-center">
          {field.improved && <ArrowUpRight className="w-4 h-4 text-emerald-600" />}
          {field.regressed && <ArrowDownRight className="w-4 h-4 text-red-600" />}
          {!field.improved && !field.regressed && <Equal className="w-4 h-4 text-muted-foreground/40" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="grid px-4 pb-3 gap-2 animate-slide-up"
          style={{ gridTemplateColumns: `280px repeat(${runCount}, 1fr) 80px` }}
        >
          <div className="text-[10px] text-muted-foreground pt-1">Values</div>
          {field.values.map((v) => (
            <div key={v.runId} className="text-xs space-y-1 px-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">Sys 1:</span>
                <span className="font-mono text-[11px] truncate bg-muted/40 rounded px-1.5 py-0.5" title={formatValue(v.systemOneValue)}>
                  {formatValue(v.systemOneValue)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">Sys 2:</span>
                <span className="font-mono text-[11px] truncate bg-muted/40 rounded px-1.5 py-0.5" title={formatValue(v.systemTwoValue)}>
                  {formatValue(v.systemTwoValue)}
                </span>
              </div>
            </div>
          ))}
          <div />
        </div>
      )}
    </div>
  )
}

// ── Metadata Comparison ──

const CHANGE_STYLES: Record<MetadataFieldChange, { icon: typeof Plus; color: string; label: string; bg: string }> = {
  added: { icon: Plus, color: 'text-emerald-600', label: 'Added', bg: 'bg-emerald-50' },
  removed: { icon: Trash2, color: 'text-red-600', label: 'Removed', bg: 'bg-red-50' },
  modified: { icon: Pencil, color: 'text-amber-600', label: 'Modified', bg: 'bg-amber-50' },
  unchanged: { icon: Check, color: 'text-muted-foreground', label: 'Unchanged', bg: '' },
}

function MetadataComparisonSection({
  diff,
  open,
  onToggle,
  runCount,
}: {
  diff: MetadataDiff
  open: boolean
  onToggle: () => void
  runCount: number
}) {
  const [showUnchanged, setShowUnchanged] = useState(false)

  const visibleFields = showUnchanged
    ? diff.fieldDiffs
    : diff.fieldDiffs.filter((f) => f.change !== 'unchanged')

  return (
    <Card className={cn(diff.hasChanges && 'border-amber-200')}>
      <CardHeader className="pb-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={onToggle}
        >
          <CardTitle className="text-sm flex items-center gap-2">
            <Braces className="w-4 h-4 text-primary" />
            Metadata Construct Comparison
            {diff.hasChanges && (
              <Badge variant="warning" className="text-[10px]">
                {diff.addedCount + diff.removedCount + diff.modifiedCount} changes
              </Badge>
            )}
            {!diff.hasChanges && (
              <Badge variant="secondary" className="text-[10px]">Identical</Badge>
            )}
          </CardTitle>
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          {/* Schema overview per run */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${runCount}, 1fr)` }}>
            {diff.schemaChanges.map((s, i) => (
              <div
                key={s.runId}
                className={cn(
                  'rounded-lg border p-3 space-y-1',
                  i === diff.schemaChanges.length - 1 ? 'border-primary/30 bg-primary/5' : 'bg-muted/20'
                )}
              >
                <div className="text-[11px] text-muted-foreground">
                  {s.runName || `Run #${s.runId}`}
                </div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5">v{s.version}</Badge>
                  <span className="text-[11px] text-muted-foreground">{s.fieldCount} fields</span>
                </div>
              </div>
            ))}
          </div>

          {/* Change summary badges */}
          {diff.hasChanges && (
            <div className="flex items-center gap-3 flex-wrap">
              {diff.addedCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <Plus className="w-3 h-3" /> {diff.addedCount} added
                </span>
              )}
              {diff.removedCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <Trash2 className="w-3 h-3" /> {diff.removedCount} removed
                </span>
              )}
              {diff.modifiedCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Pencil className="w-3 h-3" /> {diff.modifiedCount} modified
                </span>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setShowUnchanged(!showUnchanged)}
                className="text-[11px] text-primary hover:underline"
              >
                {showUnchanged ? 'Hide unchanged fields' : 'Show all fields'}
              </button>
            </div>
          )}

          {/* Field diff table */}
          {(diff.hasChanges || showUnchanged) && visibleFields.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div
                className="grid items-center bg-muted/30 px-4 py-2 text-[11px] font-medium text-muted-foreground border-b"
                style={{ gridTemplateColumns: `60px 160px repeat(${runCount}, 1fr)` }}
              >
                <div>Status</div>
                <div>Field Name</div>
                {diff.schemaChanges.map((s) => (
                  <div key={s.runId} className="text-center truncate px-1">
                    {s.runName || `Run #${s.runId}`}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="max-h-[400px] overflow-y-auto">
                {visibleFields.map((fd) => {
                  const style = CHANGE_STYLES[fd.change]
                  const Icon = style.icon
                  return (
                    <div
                      key={fd.fieldName}
                      className={cn(
                        'grid items-center px-4 py-2 border-b last:border-b-0 text-xs',
                        style.bg
                      )}
                      style={{ gridTemplateColumns: `60px 160px repeat(${runCount}, 1fr)` }}
                    >
                      {/* Change badge */}
                      <div>
                        <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium', style.color)}>
                          <Icon className="w-3 h-3" />
                          {style.label}
                        </span>
                      </div>

                      {/* Field name */}
                      <div className="font-medium truncate" title={fd.fieldName}>
                        {fd.fieldName}
                      </div>

                      {/* Per-run details */}
                      {fd.details.map((d) => (
                        <div key={d.runId} className="px-2">
                          {d.field ? (
                            <div className="space-y-0.5">
                              <div className="font-mono text-[10px] text-primary/70 truncate" title={d.field.jsonPath}>
                                {d.field.jsonPath}
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                  {d.field.type}
                                </Badge>
                                {d.field.description && (
                                  <span className="text-[10px] text-muted-foreground truncate" title={d.field.description}>
                                    {d.field.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 italic">Not present</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!diff.hasChanges && !showUnchanged && (
            <p className="text-xs text-muted-foreground text-center py-4">
              All runs use identical metadata constructs.
              <button
                onClick={() => setShowUnchanged(true)}
                className="text-primary hover:underline ml-1"
              >
                View fields
              </button>
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
