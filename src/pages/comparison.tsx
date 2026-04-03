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
  Download,
} from 'lucide-react'
import type { ExtractionResult, DiffType, ArrayKeyConfig } from '@/types'

type ViewMode = 'tree' | 'table' | 'side-by-side' | 'raw'

interface ComparisonProps {
  systemOneData: ExtractionResult
  systemTwoData: ExtractionResult
  matchPercentage?: number | null
  arrayKeys?: ArrayKeyConfig
}

const viewModes: { value: ViewMode; label: string; icon: typeof TreePine }[] = [
  { value: 'tree', label: 'Tree', icon: TreePine },
  { value: 'table', label: 'Table', icon: Table2 },
  { value: 'side-by-side', label: 'Side by Side', icon: Columns2 },
  { value: 'raw', label: 'Raw JSON', icon: Code2 },
]

export function ComparisonPage({ systemOneData, systemTwoData, matchPercentage, arrayKeys }: ComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [filter, setFilter] = useState<DiffType | 'all'>('all')

  const diffs = useMemo(() => deepDiff(systemOneData, systemTwoData, '', 0, arrayKeys), [systemOneData, systemTwoData, arrayKeys])
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
          <h2 className="text-xl font-bold text-foreground">Reconciliation Report</h2>
          <p className="text-sm text-muted-foreground">
            Field-level reconciliation of LLM extraction against baseline
          </p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={handleExport}>
          <Download className="w-3 h-3" /> Export Report
        </Button>
      </div>

      {/* Summary Dashboard — stat cards are now clickable filters */}
      <Card>
        <CardContent className="p-6">
          <SummaryDashboard
            summary={summary}
            matchPercentageOverride={matchPercentage}
            activeFilter={viewMode === 'raw' ? 'all' : filter}
            onFilterChange={viewMode === 'raw' ? undefined : setFilter}
          />
        </CardContent>
      </Card>

      {/* View Mode tabs only — filters are now in the dashboard above */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
          {viewModes.map(mode => {
            const Icon = mode.icon
            return (
              <button
                key={mode.value}
                onClick={() => { setViewMode(mode.value); if (mode.value === 'raw') setFilter('all') }}
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

        {/* Active filter indicator */}
        {filter !== 'all' && viewMode !== 'raw' && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 pl-2 pr-1.5 py-1 text-xs">
              Filtering: {filter === 'match' ? 'Matched' : filter === 'mismatch' ? 'Mismatched' : filter === 'missing_left' ? 'Baseline Only' : filter === 'missing_right' ? 'LLM Only' : 'Type Mismatch'}
              <button
                onClick={() => setFilter('all')}
                className="ml-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
              >
                <span className="text-[10px]">✕</span>
              </button>
            </Badge>
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
              leftLabel="LLM Extraction"
              rightLabel="Baseline (Ground Truth)"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
