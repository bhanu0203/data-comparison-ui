import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress-ring'
import { RunProgressBar } from '@/components/run-progress-bar'
import { MetadataEditor } from '@/components/metadata-editor'
import { SearchFilterBar } from '@/components/search-filter-bar'
import {
  LayoutDashboard, Eye, Trash2, Clock, AlertCircle, ArrowRightLeft,
  RefreshCw, X, Layers, CheckSquare, Square, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { listComparisons, deleteComparison, rerunComparison, getComparison } from '@/lib/api-service'
import { defaultMetadata } from '@/lib/mock-service'
import type { ComparisonRun, RunStatus, MetadataConstruct, ComparisonSearchParams, StatusCounts } from '@/types'

const STATUS_STYLES: Record<RunStatus, { bg: string; text: string; label: string }> = {
  queued: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Queued' },
  processing: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Processing' },
  completed: { bg: 'bg-diff-added', text: 'text-diff-added-text', label: 'Completed' },
  failed: { bg: 'bg-diff-removed', text: 'text-diff-removed-text', label: 'Failed' },
}

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function RunsPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState<ComparisonRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ queued: 0, processing: 0, completed: 0, failed: 0 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Search/filter/pagination params
  const [searchParams, setSearchParams] = useState<ComparisonSearchParams>({
    page: 1,
    page_size: 25,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Rerun dialog state
  const [rerunDialogOpen, setRerunDialogOpen] = useState(false)
  const [rerunRunId, setRerunRunId] = useState<number | null>(null)
  const [rerunRunName, setRerunRunName] = useState('')
  const [rerunMetadata, setRerunMetadata] = useState<MetadataConstruct | null>(null)
  const [rerunFetching, setRerunFetching] = useState(false)
  const [rerunSubmitting, setRerunSubmitting] = useState(false)

  const fetchRuns = useCallback(async () => {
    try {
      const data = await listComparisons(searchParams)
      setRuns(data.items)
      setTotalCount(data.total)
      setTotalPages(data.total_pages)
      setStatusCounts(data.status_counts)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load runs')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

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

  // Delete confirmation
  const [deleteTargetRun, setDeleteTargetRun] = useState<ComparisonRun | null>(null)
  const [deletingRun, setDeletingRun] = useState(false)

  const confirmDeleteRun = async () => {
    if (!deleteTargetRun) return
    setDeletingRun(true)
    try {
      await deleteComparison(deleteTargetRun.id)
      selectedIds.delete(deleteTargetRun.id)
      setSelectedIds(new Set(selectedIds))
      setDeleteTargetRun(null)
      await fetchRuns()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingRun(false)
    }
  }

  const openRerunDialog = async (run: ComparisonRun) => {
    setRerunRunId(run.id)
    setRerunRunName('')
    setRerunDialogOpen(true)
    setRerunFetching(true)
    try {
      const detail = await getComparison(run.id)
      if (detail.metadata_construct) {
        setRerunMetadata(detail.metadata_construct as unknown as MetadataConstruct)
      } else {
        setRerunMetadata(defaultMetadata)
      }
    } catch {
      setRerunMetadata(defaultMetadata)
    } finally {
      setRerunFetching(false)
    }
  }

  const confirmRerun = async () => {
    if (!rerunRunId || !rerunMetadata) return
    setRerunSubmitting(true)
    try {
      await rerunComparison(rerunRunId, {
        metadata_construct: rerunMetadata as unknown as Record<string, unknown>,
        run_name: rerunRunName || undefined,
      })
      setRerunDialogOpen(false)
      await fetchRuns()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rerun failed')
    } finally {
      setRerunSubmitting(false)
    }
  }

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleCompareSelected = () => {
    const ids = Array.from(selectedIds).join(',')
    navigate(`/runs/compare?ids=${ids}`)
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  // Pagination helpers
  const currentPage = searchParams.page || 1
  const pageSize = searchParams.page_size || 25
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  const goToPage = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }))
  }

  // Generate page numbers to show
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Extraction Runs</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage LLM extraction reconciliations
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={selectionMode ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
          >
            <Layers className="w-3 h-3" />
            {selectionMode ? 'Cancel Selection' : 'Cross-Run Analysis'}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => navigate('/reconcile')}
          >
            <ArrowRightLeft className="w-3 h-3" /> New Reconciliation
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilterBar
        params={searchParams}
        onChange={setSearchParams}
        statusCounts={statusCounts}
        totalCount={totalCount}
      />

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
      {!loading && runs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <LayoutDashboard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {totalCount === 0 ? 'No extraction runs yet' : 'No runs match your filters'}
            </p>
            {totalCount === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => navigate('/reconcile')}
              >
                <ArrowRightLeft className="w-3 h-3" /> Start a Reconciliation
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Run Cards */}
      {runs.map((run) => {
        const style = STATUS_STYLES[run.status]
        const isActive = run.status === 'queued' || run.status === 'processing'
        const isSelected = selectedIds.has(run.id)
        const isSelectable = run.status === 'completed'

        return (
          <Card
            key={run.id}
            className={cn(
              'transition-all duration-200 hover:shadow-md',
              isActive && 'border-primary/30 shadow-md',
              selectionMode && isSelected && 'border-primary ring-2 ring-primary/20',
              selectionMode && !isSelectable && 'opacity-50',
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                {/* Selection checkbox */}
                {selectionMode && (
                  <button
                    onClick={() => isSelectable && toggleSelection(run.id)}
                    disabled={!isSelectable}
                    className={cn(
                      'shrink-0 transition-colors',
                      isSelectable ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                    title={isSelectable ? undefined : 'Only completed runs can be compared'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className={cn('w-5 h-5', isSelectable ? 'text-muted-foreground hover:text-primary' : 'text-muted-foreground/30')} />
                    )}
                  </button>
                )}

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
                {!selectionMode && (
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
                    {(run.status === 'completed' || run.status === 'failed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openRerunDialog(run)}
                      >
                        <RefreshCw className="w-3 h-3" /> Rerun
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTargetRun(run)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Showing {startItem}–{endItem} of {totalCount} runs
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => goToPage(1)}
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={cn(
                    'h-8 w-8 rounded-md text-xs font-medium transition-colors',
                    p === currentPage
                      ? 'bg-primary text-white'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  {p}
                </button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(totalPages)}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, page_size: Number(e.target.value), page: 1 }))}
              className="rounded-md border px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Selection floating bar — rendered via portal to escape transform containing block */}
      {selectionMode && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="flex items-center gap-4 bg-foreground text-background rounded-2xl shadow-2xl px-6 py-3 animate-slide-up">
            {selectedIds.size === 0 ? (
              <span className="text-sm text-background/70">
                Select completed runs to compare
              </span>
            ) : (
              <span className="text-sm font-medium">
                {selectedIds.size} run{selectedIds.size > 1 ? 's' : ''} selected
              </span>
            )}
            <div className="w-px h-5 bg-background/20" />
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            )}
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90 text-white"
              disabled={selectedIds.size < 2}
              onClick={handleCompareSelected}
            >
              <Layers className="w-3.5 h-3.5" />
              Compare{selectedIds.size >= 2 ? ` ${selectedIds.size} Runs` : ''}
            </Button>
            <button
              onClick={exitSelectionMode}
              className="ml-1 p-1 rounded-full hover:bg-background/20 transition-colors"
              title="Exit selection mode"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Rerun Dialog */}
      <Dialog.Root open={rerunDialogOpen} onOpenChange={setRerunDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Rerun Extraction
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                  Creates a new extraction run from Run #{rerunRunId}. Optionally update the metadata construct below.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Run Name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={rerunRunName}
                  onChange={(e) => setRerunRunName(e.target.value)}
                  placeholder={`Rerun of #${rerunRunId}`}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {rerunFetching ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Loading metadata construct...</span>
                </div>
              ) : rerunMetadata ? (
                <MetadataEditor metadata={rerunMetadata} onChange={setRerunMetadata} />
              ) : null}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
              <p className="text-xs text-muted-foreground">
                A new extraction run will be created with a separate reconciliation report.
              </p>
              <div className="flex items-center gap-2">
                <Dialog.Close asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </Dialog.Close>
                <Button
                  size="sm"
                  onClick={confirmRerun}
                  disabled={rerunSubmitting || rerunFetching}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${rerunSubmitting ? 'animate-spin' : ''}`} />
                  {rerunSubmitting ? 'Creating...' : 'Create Rerun'}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete confirmation dialog */}
      <Dialog.Root open={!!deleteTargetRun} onOpenChange={(open) => { if (!open) setDeleteTargetRun(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold text-foreground">
                    Delete Extraction Run
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground mt-1">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-foreground">
                      Run #{deleteTargetRun?.id}
                      {deleteTargetRun?.run_name && ` — ${deleteTargetRun.run_name}`}
                    </span>
                    ? This will permanently remove the run and its reconciliation report.
                  </Dialog.Description>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={confirmDeleteRun}
                disabled={deletingRun}
              >
                <Trash2 className="w-3 h-3" />
                {deletingRun ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
