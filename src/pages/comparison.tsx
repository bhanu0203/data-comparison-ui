import { useMemo, useState } from 'react'
import { SummaryDashboard } from '@/components/summary-dashboard'
import { DiffTree } from '@/components/diff-tree'
import { DiffTable } from '@/components/diff-table'
import { SideBySide } from '@/components/side-by-side'
import { RawDiffViewer } from '@/components/raw-diff-viewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deepDiff, computeSummary } from '@/lib/diff-engine'
import {
  GitCompareArrows,
  TreePine,
  Table2,
  Columns2,
  Code2,
  Filter,
  Download,
} from 'lucide-react'
import type { ExtractionResult, DiffType } from '@/types'

type ViewMode = 'tree' | 'table' | 'side-by-side' | 'raw'

interface ComparisonProps {
  systemOneData: ExtractionResult
  systemTwoData: ExtractionResult
  matchPercentage?: number | null
}

const filterOptions: { value: DiffType | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-foreground text-background' },
  { value: 'match', label: 'Matched', color: 'bg-diff-added text-diff-added-text' },
  { value: 'mismatch', label: 'Mismatched', color: 'bg-diff-changed text-diff-changed-text' },
  { value: 'missing_left', label: 'Only Sys 2', color: 'bg-blue-100 text-blue-700' },
  { value: 'missing_right', label: 'Only Sys 1', color: 'bg-purple-100 text-purple-700' },
  { value: 'type_mismatch', label: 'Type Diff', color: 'bg-diff-removed text-diff-removed-text' },
]

const viewModes: { value: ViewMode; label: string; icon: typeof TreePine }[] = [
  { value: 'tree', label: 'Tree', icon: TreePine },
  { value: 'table', label: 'Table', icon: Table2 },
  { value: 'side-by-side', label: 'Side by Side', icon: Columns2 },
  { value: 'raw', label: 'Raw JSON', icon: Code2 },
]

export function ComparisonPage({ systemOneData, systemTwoData, matchPercentage }: ComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [filter, setFilter] = useState<DiffType | 'all'>('all')

  const diffs = useMemo(() => deepDiff(systemOneData, systemTwoData), [systemOneData, systemTwoData])
  const summary = useMemo(() => computeSummary(diffs), [diffs])

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary,
      systemOneData,
      systemTwoData,
      diffs,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparison-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <GitCompareArrows className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Comparison & Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Deep diff between System 1 and System 2 outputs
          </p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={handleExport}>
          <Download className="w-3 h-3" /> Export Report
        </Button>
      </div>

      {/* Summary Dashboard */}
      <Card>
        <CardContent className="p-6">
          <SummaryDashboard summary={summary} matchPercentageOverride={matchPercentage} />
        </CardContent>
      </Card>

      {/* View Mode + Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View mode tabs */}
        <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
          {viewModes.map(mode => {
            const Icon = mode.icon
            return (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === mode.value
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            )
          })}
        </div>

        {/* Filters */}
        {viewMode !== 'raw' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1.5">
              {filterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    filter === opt.value
                      ? opt.color + ' shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diff Views */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {viewModes.find(m => m.value === viewMode)?.label} View
            <Badge variant="secondary" className="text-xs font-normal">
              {summary.totalFields} fields
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'tree' && <DiffTree entries={diffs} filter={filter} />}
          {viewMode === 'table' && <DiffTable entries={diffs} filter={filter} />}
          {viewMode === 'side-by-side' && <SideBySide entries={diffs} filter={filter} />}
          {viewMode === 'raw' && (
            <RawDiffViewer
              leftData={systemOneData}
              rightData={systemTwoData}
              leftLabel="System 1 — PDF Extraction"
              rightLabel="System 2 — Direct Extraction"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
