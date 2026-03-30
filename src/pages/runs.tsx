import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress-ring'
import { RunProgressBar } from '@/components/run-progress-bar'
import {
  LayoutDashboard, Eye, Trash2, Clock, AlertCircle, ArrowRightLeft, RefreshCw,
} from 'lucide-react'
import { listComparisons, deleteComparison } from '@/lib/api-service'
import type { ComparisonRun, RunStatus } from '@/types'

const STATUS_STYLES: Record<RunStatus, { bg: string; text: string; label: string }> = {
  queued: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Queued' },
  processing: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Processing' },
  completed: { bg: 'bg-diff-added', text: 'text-diff-added-text', label: 'Completed' },
  failed: { bg: 'bg-diff-removed', text: 'text-diff-removed-text', label: 'Failed' },
}

const FILTER_OPTIONS: { value: RunStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued — waiting to start',
  uploading: 'Uploading PDF...',
  pdf_parsing: 'Parsing PDF document...',
  metadata_mapping: 'Mapping metadata schema...',
  llm_extraction: 'Running LLM extraction...',
  response_validation: 'Validating response...',
  diff_computation: 'Computing differences...',
  report_generation: 'Generating report...',
  completed: 'Completed',
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const ms = e - s
  if (ms < 1000) return '<1s'
  const secs = Math.floor(ms / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  return `${mins}m ${secs % 60}s`
}

export function RunsPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<ComparisonRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<RunStatus | 'all'>('all')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRuns = useCallback(async () => {
    try {
      const data = await listComparisons()
      setRuns(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  // Auto-refresh when in-progress runs exist
  useEffect(() => {
    const hasInProgress = runs.some((r) => r.status === 'queued' || r.status === 'processing')
    if (hasInProgress) {
      intervalRef.current = setInterval(fetchRuns, 2000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [runs, fetchRuns])

  const handleDelete = async (id: number) => {
    try {
      await deleteComparison(id)
      await fetchRuns()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const filtered = filter === 'all' ? runs : runs.filter((r) => r.status === filter)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Comparison Runs</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all extraction comparisons
          </p>
        </div>
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => navigate('/compare')}
        >
          <ArrowRightLeft className="w-3 h-3" /> New Comparison
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.value === 'all' ? runs.length : runs.filter((r) => r.status === opt.value).length
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === opt.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
              <span className={`ml-1.5 text-xs ${filter === opt.value ? 'text-white/70' : 'text-muted-foreground/50'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-sm text-muted-foreground py-12">Loading runs...</div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <LayoutDashboard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No comparison runs yet' : `No ${filter} runs`}
            </p>
            {filter === 'all' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => navigate('/compare')}
              >
                <ArrowRightLeft className="w-3 h-3" /> Start a Comparison
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run Cards */}
      {filtered.map((run) => {
        const style = STATUS_STYLES[run.status]
        const isActive = run.status === 'queued' || run.status === 'processing'

        return (
          <Card
            key={run.id}
            className={`transition-all duration-200 hover:shadow-md ${isActive ? 'border-primary/30 shadow-md' : ''}`}
          >
            <CardContent className="p-5">
              {/* Top row: identity + status + actions */}
              <div className="flex items-center gap-4">
                {/* Match ring or progress circle */}
                <div className="shrink-0">
                  {run.status === 'completed' && run.match_percentage != null ? (
                    <ProgressRing value={run.match_percentage} size={56} strokeWidth={5} />
                  ) : isActive ? (
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center relative">
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      <span className="absolute -bottom-1 text-[10px] font-bold text-primary bg-white px-1 rounded">
                        {run.progress_percentage}%
                      </span>
                    </div>
                  ) : run.status === 'failed' ? (
                    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">
                        {run.progress_percentage}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">
                      Run #{run.id}
                    </span>
                    {run.run_name && (
                      <span className="text-sm text-muted-foreground truncate max-w-60">— {run.run_name}</span>
                    )}
                    <Badge className={`${style.bg} ${style.text} border-0 text-[10px]`}>
                      {style.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {run.agreement_display_id && (
                      <span className="font-mono">{run.agreement_display_id}</span>
                    )}
                    {run.agreement_name && (
                      <span className="truncate max-w-48">{run.agreement_name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(run.started_at, run.completed_at)}
                    </span>
                    <span>{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {run.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => navigate(`/runs/${run.id}`)}
                    >
                      <Eye className="w-3 h-3" /> View Report
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(run.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Rich inline progress for active runs */}
              {isActive && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {STAGE_LABELS[run.current_stage] || run.current_stage}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {run.progress_percentage}%
                    </span>
                  </div>
                  <RunProgressBar
                    currentStage={run.current_stage}
                    status={run.status}
                  />
                </div>
              )}

              {/* Error detail for failed runs */}
              {run.status === 'failed' && run.error_message && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-destructive bg-destructive/5 rounded-lg p-2.5">
                    {run.error_message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
