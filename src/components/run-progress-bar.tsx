import type { RunStage } from '@/types'
import { cn } from '@/lib/utils'

const STAGES: { key: RunStage; label: string; short: string }[] = [
  { key: 'uploading', label: 'Uploading', short: 'UPL' },
  { key: 'pdf_parsing', label: 'PDF Parsing', short: 'PDF' },
  { key: 'metadata_mapping', label: 'Metadata Mapping', short: 'MAP' },
  { key: 'llm_extraction', label: 'LLM Extraction', short: 'LLM' },
  { key: 'response_validation', label: 'Validation', short: 'VAL' },
  { key: 'diff_computation', label: 'Diff Compute', short: 'DIF' },
  { key: 'report_generation', label: 'Report Gen', short: 'RPT' },
  { key: 'completed', label: 'Done', short: 'OK' },
]

const STAGE_ORDER: Record<string, number> = {}
STAGES.forEach((s, i) => { STAGE_ORDER[s.key] = i })

interface RunProgressBarProps {
  currentStage: RunStage
  status: string
  className?: string
  compact?: boolean
}

export function RunProgressBar({ currentStage, status, className, compact = false }: RunProgressBarProps) {
  const currentIdx = STAGE_ORDER[currentStage] ?? -1
  const isFailed = status === 'failed'

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-0.5">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIdx || currentStage === 'completed'
          const isCurrent = idx === currentIdx && currentStage !== 'completed'
          const isPending = idx > currentIdx

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-full h-2 rounded-full transition-all duration-500',
                  isCompleted && 'bg-success',
                  isCurrent && !isFailed && 'bg-primary animate-progress-pulse',
                  isCurrent && isFailed && 'bg-destructive',
                  isPending && 'bg-muted',
                )}
              />
              {!compact && (
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    isCompleted && 'text-success',
                    isCurrent && !isFailed && 'text-primary',
                    isCurrent && isFailed && 'text-destructive',
                    isPending && 'text-muted-foreground/50',
                  )}
                >
                  {stage.short}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
