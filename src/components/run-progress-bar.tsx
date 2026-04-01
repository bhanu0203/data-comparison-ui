import type { RunStage } from '@/types'
import { cn } from '@/lib/utils'
import {
  Upload, FileSearch, Braces, Brain, ShieldCheck, GitCompareArrows, FileBarChart, CircleCheckBig,
} from 'lucide-react'

const STAGES: { key: RunStage; label: string; short: string; icon: typeof Upload }[] = [
  { key: 'uploading', label: 'Upload', short: 'UPL', icon: Upload },
  { key: 'pdf_parsing', label: 'Parse', short: 'PDF', icon: FileSearch },
  { key: 'metadata_mapping', label: 'Map', short: 'MAP', icon: Braces },
  { key: 'llm_extraction', label: 'Extract', short: 'LLM', icon: Brain },
  { key: 'response_validation', label: 'Validate', short: 'VAL', icon: ShieldCheck },
  { key: 'diff_computation', label: 'Diff', short: 'DIF', icon: GitCompareArrows },
  { key: 'report_generation', label: 'Report', short: 'RPT', icon: FileBarChart },
  { key: 'completed', label: 'Done', short: 'OK', icon: CircleCheckBig },
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

  if (compact) {
    // Compact: simple dot-style progress
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center gap-1">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx || currentStage === 'completed'
            const isCurrent = idx === currentIdx && currentStage !== 'completed'
            const isPending = idx > currentIdx
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-full h-1.5 rounded-full transition-all duration-500',
                    isCompleted && 'bg-success',
                    isCurrent && !isFailed && 'bg-primary animate-progress-pulse',
                    isCurrent && isFailed && 'bg-destructive',
                    isPending && 'bg-muted',
                  )}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Full: stepper with icons + connector lines
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIdx || currentStage === 'completed'
          const isCurrent = idx === currentIdx && currentStage !== 'completed'
          const isPending = idx > currentIdx
          const Icon = stage.icon
          const isLast = idx === STAGES.length - 1

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center relative">
              {/* Connector line (before this node) */}
              {idx > 0 && (
                <div
                  className={cn(
                    'absolute top-[14px] right-1/2 h-[2px] w-full transition-all duration-700',
                    isCompleted ? 'bg-success' :
                    isCurrent && !isFailed ? 'bg-gradient-to-r from-success to-primary' :
                    isCurrent && isFailed ? 'bg-gradient-to-r from-success to-destructive' :
                    'bg-muted',
                  )}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Icon circle */}
              <div
                className={cn(
                  'relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 border-2',
                  isCompleted && 'bg-success border-success text-white',
                  isCurrent && !isFailed && 'bg-primary/10 border-primary text-primary animate-progress-pulse shadow-sm shadow-primary/30',
                  isCurrent && isFailed && 'bg-destructive/10 border-destructive text-destructive',
                  isPending && 'bg-white border-muted text-muted-foreground/40',
                )}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[9px] font-medium mt-1.5 transition-colors leading-tight text-center',
                  isCompleted && 'text-success',
                  isCurrent && !isFailed && 'text-primary font-semibold',
                  isCurrent && isFailed && 'text-destructive font-semibold',
                  isPending && 'text-muted-foreground/40',
                )}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
