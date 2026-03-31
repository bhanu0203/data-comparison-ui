import { ProgressRing } from '@/components/ui/progress-ring'
import { Card, CardContent } from '@/components/ui/card'
import { Equal, ArrowLeftRight, Plus, Minus, AlertTriangle, BarChart3 } from 'lucide-react'
import type { DiffSummary } from '@/types'

interface SummaryDashboardProps {
  summary: DiffSummary
  matchPercentageOverride?: number | null
}

export function SummaryDashboard({ summary, matchPercentageOverride }: SummaryDashboardProps) {
  const displayMatchPercentage = matchPercentageOverride ?? summary.matchPercentage
  const stats = [
    {
      label: 'Matched',
      value: summary.matched,
      icon: Equal,
      color: 'text-diff-added-text',
      bg: 'bg-diff-added',
      percent: summary.totalFields > 0 ? Math.round((summary.matched / summary.totalFields) * 100) : 0,
    },
    {
      label: 'Mismatched',
      value: summary.mismatched,
      icon: ArrowLeftRight,
      color: 'text-diff-changed-text',
      bg: 'bg-diff-changed',
      percent: summary.totalFields > 0 ? Math.round((summary.mismatched / summary.totalFields) * 100) : 0,
    },
    {
      label: 'Only in System 2',
      value: summary.missingLeft,
      icon: Plus,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      percent: summary.totalFields > 0 ? Math.round((summary.missingLeft / summary.totalFields) * 100) : 0,
    },
    {
      label: 'Only in System 1',
      value: summary.missingRight,
      icon: Minus,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      percent: summary.totalFields > 0 ? Math.round((summary.missingRight / summary.totalFields) * 100) : 0,
    },
    {
      label: 'Type Mismatch',
      value: summary.typeMismatches,
      icon: AlertTriangle,
      color: 'text-diff-removed-text',
      bg: 'bg-diff-removed',
      percent: summary.totalFields > 0 ? Math.round((summary.typeMismatches / summary.totalFields) * 100) : 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main score */}
      <div className="flex items-center gap-8 justify-center py-4">
        <ProgressRing value={displayMatchPercentage} size={140} strokeWidth={12} label="Match Rate" />
        <div className="text-left">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Comparison Overview</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{summary.totalFields}</p>
          <p className="text-sm text-muted-foreground">Total fields compared</p>
          <div className="mt-3 h-3 w-64 rounded-full bg-muted overflow-hidden flex">
            {stats.map(s => (
              s.value > 0 && (
                <div
                  key={s.label}
                  className={`h-full ${s.bg} transition-all duration-1000`}
                  style={{ width: `${s.percent}%` }}
                  title={`${s.label}: ${s.value}`}
                />
              )
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            {stats.filter(s => s.value > 0).map(s => (
              <div key={s.label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${s.bg}`} />
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
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
