import { cn } from '@/lib/utils'
import { Brain, FileSearch, Database, Loader2 } from 'lucide-react'

interface ProcessingAnimationProps {
  systemName: string
  steps: string[]
  currentStep: number
  className?: string
  badge?: string
}

export function ProcessingAnimation({ systemName, steps, currentStep, className, badge = 'AI' }: ProcessingAnimationProps) {
  const icons = [FileSearch, Brain, Database]

  return (
    <div className={cn('flex flex-col items-center py-12', className)}>
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold animate-pulse-soft">
          {badge}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{systemName}</h3>
      <p className="text-sm text-muted-foreground mb-8">Processing your request...</p>

      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, idx) => {
          const Icon = icons[idx % icons.length]
          const isActive = idx === currentStep
          const isDone = idx < currentStep

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500',
                isActive && 'bg-primary/5 border border-primary/20 shadow-sm',
                isDone && 'bg-diff-added/50',
                !isActive && !isDone && 'opacity-40'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                isActive && 'bg-primary text-white',
                isDone && 'bg-success text-white',
                !isActive && !isDone && 'bg-muted text-muted-foreground',
              )}>
                {isDone ? (
                  <span className="text-sm">&#10003;</span>
                ) : isActive ? (
                  <Icon className="w-4 h-4 animate-pulse-soft" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={cn(
                'text-sm font-medium',
                isActive && 'text-foreground',
                isDone && 'text-success',
                !isActive && !isDone && 'text-muted-foreground',
              )}>
                {step}
              </span>
              {isActive && (
                <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
