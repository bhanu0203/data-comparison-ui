import { ProgressRing } from '@/components/ui/progress-ring'
import { Card, CardContent } from '@/components/ui/card'
import { Equal, ArrowLeftRight, Plus, Minus, AlertTriangle, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiffSummary, DiffType } from '@/types'

interface SummaryDashboardProps {
  summary: DiffSummary
  matchPercentageOverride?: number | null
  activeFilter?: DiffType | 'all'
  onFilterChange?: (filter: DiffType | 'all') => void
}

const FILTER_KEYS: DiffType[] = ['match', 'mismatch', 'missing_left', 'missing_right', 'type_mismatch']

export function SummaryDashboard({ summary, matchPercentageOverride, activeFilter = 'all', onFilterChange }: SummaryDashboardProps) {
  const displayMatchPercentage = matchPercentageOverride ?? summary.matchPercentage
  const interactive = !!onFilterChange

  const stats: {
    filterKey: DiffType
    label: string
    value: number
    icon: typeof Equal
    color: string
    bg: string
    barBg: string
    borderActive: string
    percent: number
  }[] = [
    {
      filterKey: 'match',
      label: 'Matched',
      value: summary.matched,
      icon: Equal,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      barBg: 'bg-emerald-400',
      borderActive: 'ring-emerald-400/40 border-emerald-400/50',
      percent: summary.totalFields > 0 ? Math.round((summary.matched / summary.totalFields) * 100) : 0,
    },
    {
      filterKey: 'mismatch',
      label: 'Mismatched',
      value: summary.mismatched,
      icon: ArrowLeftRight,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      barBg: 'bg-amber-400',
      borderActive: 'ring-amber-400/40 border-amber-400/50',
      percent: summary.totalFields > 0 ? Math.round((summary.mismatched / summary.totalFields) * 100) : 0,
    },
    {
      filterKey: 'missing_left',
      label: 'Baseline Only',
      value: summary.missingLeft,
      icon: Plus,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      barBg: 'bg-blue-400',
      borderActive: 'ring-blue-400/40 border-blue-400/50',
      percent: summary.totalFields > 0 ? Math.round((summary.missingLeft / summary.totalFields) * 100) : 0,
    },
    {
      filterKey: 'missing_right',
      label: 'LLM Only',
      value: summary.missingRight,
      icon: Minus,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      barBg: 'bg-purple-400',
      borderActive: 'ring-purple-400/40 border-purple-400/50',
      percent: summary.totalFields > 0 ? Math.round((summary.missingRight / summary.totalFields) * 100) : 0,
    },
    {
      filterKey: 'type_mismatch',
      label: 'Type Mismatch',
      value: summary.typeMismatches,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      barBg: 'bg-rose-400',
      borderActive: 'ring-rose-400/40 border-rose-400/50',
      percent: summary.totalFields > 0 ? Math.round((summary.typeMismatches / summary.totalFields) * 100) : 0,
    },
  ]

  const handleCardClick = (filterKey: DiffType) => {
    if (!onFilterChange) return
    // Toggle: click active card again → reset to 'all'
    onFilterChange(activeFilter === filterKey ? 'all' : filterKey)
  }

  const handleRingClick = () => {
    if (!onFilterChange) return
    onFilterChange('all')
  }

  return (
    <div className="space-y-6">
      {/* Main score */}
      <div className="flex items-center gap-8 justify-center py-4">
        <div
          className={cn(
            'rounded-full transition-all duration-200',
            interactive && 'cursor-pointer hover:scale-105',
            interactive && activeFilter === 'all' && 'ring-2 ring-primary/30 ring-offset-2',
          )}
          onClick={handleRingClick}
          title={interactive ? 'Show all fields' : undefined}
        >
          <ProgressRing value={displayMatchPercentage} size={140} strokeWidth={12} label="Match Rate" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Reconciliation Overview</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{summary.totalFields}</p>
          <p className="text-sm text-muted-foreground">Total fields compared</p>
          <div className="mt-3 w-64 rounded-full bg-muted overflow-hidden flex relative items-center" style={{ height: '20px' }}>
            {stats.map(s => {
              const isBarActive = activeFilter === s.filterKey
              const isBarDimmed = interactive && activeFilter !== 'all' && !isBarActive
              return (
                s.value > 0 && (
                  <div
                    key={s.label}
                    className={cn(
                      'transition-all duration-300',
                      s.barBg,
                      interactive && 'cursor-pointer',
                      isBarActive ? 'h-5 z-10 rounded shadow-md' : 'h-3',
                      isBarDimmed && 'opacity-25',
                    )}
                    style={{ width: `${s.percent}%` }}
                    title={`${s.label}: ${s.value} (${s.percent}%)`}
                    onClick={() => handleCardClick(s.filterKey)}
                  />
                )
              )
            })}
          </div>
          <div className="flex gap-3 mt-3">
            {stats.filter(s => s.value > 0).map(s => {
              const isLegendActive = activeFilter === s.filterKey
              const isLegendDimmed = interactive && activeFilter !== 'all' && !isLegendActive
              return (
                <div
                  key={s.label}
                  className={cn(
                    'flex items-center gap-1.5 transition-all duration-200',
                    interactive && 'cursor-pointer hover:opacity-100',
                    isLegendActive && 'font-medium',
                    isLegendDimmed ? 'opacity-50' : 'opacity-100',
                  )}
                  onClick={() => handleCardClick(s.filterKey)}
                >
                  <div className={cn(
                    'rounded-full transition-all duration-200',
                    s.barBg,
                    isLegendActive ? 'w-3 h-3 ring-2 ring-offset-1' : 'w-2.5 h-2.5',
                    isLegendActive && s.borderActive,
                  )} />
                  <span className={cn(
                    'text-[10px]',
                    isLegendActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )}>
                    {s.label}
                    {isLegendActive && ` (${s.value})`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Interactive stat cards */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon
          const isActive = activeFilter === stat.filterKey
          const isDimmed = interactive && activeFilter !== 'all' && !isActive
          return (
            <Card
              key={stat.label}
              className={cn(
                'overflow-hidden transition-all duration-200',
                interactive && 'cursor-pointer hover:shadow-md',
                isActive && `ring-2 ${stat.borderActive} shadow-md`,
                isDimmed && 'opacity-50 hover:opacity-70',
              )}
              onClick={() => handleCardClick(stat.filterKey)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  {isActive && (
                    <span className="text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${stat.bg} rounded-full transition-all duration-1000`}
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
