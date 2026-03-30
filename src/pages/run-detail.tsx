import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ComparisonPage } from '@/pages/comparison'
import { RunProgressBar } from '@/components/run-progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Clock, AlertCircle, RefreshCw,
} from 'lucide-react'
import { getComparison } from '@/lib/api-service'
import type { ComparisonRunDetail } from '@/types'

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  uploading: 'Uploading PDF...',
  pdf_parsing: 'Parsing PDF document...',
  metadata_mapping: 'Mapping metadata schema...',
  llm_extraction: 'Running LLM extraction...',
  response_validation: 'Validating response...',
  diff_computation: 'Computing differences...',
  report_generation: 'Generating report...',
  completed: 'Completed',
}

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [run, setRun] = useState<ComparisonRunDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRun = useCallback(async () => {
    if (!id) return
    try {
      const data = await getComparison(Number(id))
      setRun(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load run')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRun()
  }, [fetchRun])

  // Poll while in progress
  useEffect(() => {
    if (run && (run.status === 'queued' || run.status === 'processing')) {
      intervalRef.current = setInterval(fetchRun, 2000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [run, fetchRun])

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground py-12 animate-slide-up">
        Loading run details...
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" /> {error || 'Run not found'}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-3 h-3" /> Back to Runs
        </Button>
      </div>
    )
  }

  // Completed: show comparison report
  if (run.status === 'completed' && run.system_one_result && run.system_two_data) {
    return (
      <div className="space-y-4 animate-slide-up">
        {/* Back button + run info */}
        <div className="flex items-center gap-3 px-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/runs')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Run #{run.id}</span>
            {run.run_name && <span className="text-sm text-muted-foreground">— {run.run_name}</span>}
            <Badge variant="success" className="text-[10px]">Completed</Badge>
          </div>
          <div className="ml-auto text-xs text-muted-foreground flex items-center gap-3">
            {run.agreement_display_id && <span>{run.agreement_display_id}</span>}
            {run.agreement_name && <span>{run.agreement_name}</span>}
          </div>
        </div>

        <ComparisonPage
          systemOneData={run.system_one_result}
          systemTwoData={run.system_two_data}
        />
      </div>
    )
  }

  // In progress or failed: show progress
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 px-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Run #{run.id}</span>
            {run.run_name && <span className="text-sm text-muted-foreground">— {run.run_name}</span>}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            {run.agreement_display_id && <span>{run.agreement_display_id}</span>}
            {run.agreement_name && <span>{run.agreement_name}</span>}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-8">
          <div className="max-w-lg mx-auto space-y-8">
            {/* Status */}
            <div className="text-center">
              {run.status === 'failed' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-destructive">Comparison Failed</h3>
                  {run.error_message && (
                    <p className="text-sm text-muted-foreground mt-2">{run.error_message}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Processing Comparison</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {STAGE_LABELS[run.current_stage] || run.current_stage}
                  </p>
                </>
              )}
            </div>

            {/* Progress percentage */}
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">{run.progress_percentage}%</span>
            </div>

            {/* Progress bar */}
            <RunProgressBar
              currentStage={run.current_stage}
              status={run.status}
            />

            {/* Meta */}
            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started {run.started_at ? new Date(run.started_at).toLocaleTimeString() : '—'}
              </span>
              <span>Created {new Date(run.created_at).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
