import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  color?: string
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  label,
  color,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const getColor = () => {
    if (color) return color
    if (value >= 90) return 'stroke-success'
    if (value >= 70) return 'stroke-warning'
    return 'stroke-destructive'
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn('fill-none transition-all duration-1000 ease-out', getColor())}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-bold leading-none"
          style={{ fontSize: Math.max(10, (size - strokeWidth) * 0.28) }}
        >
          {Math.round(value)}%
        </span>
        {label && (
          <span
            className="text-muted-foreground leading-none mt-0.5"
            style={{ fontSize: Math.max(8, (size - strokeWidth) * 0.16) }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
