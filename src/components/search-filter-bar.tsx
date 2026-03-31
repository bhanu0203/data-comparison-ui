import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Search, X, SlidersHorizontal, Calendar, Percent, ArrowUpDown,
  ChevronDown, RotateCcw,
} from 'lucide-react'
import type { ComparisonSearchParams, RunStatus, StatusCounts } from '@/types'

interface SearchFilterBarProps {
  params: ComparisonSearchParams
  onChange: (params: ComparisonSearchParams) => void
  statusCounts: StatusCounts
  totalCount: number
}

const STATUS_OPTIONS: { value: RunStatus; label: string; color: string }[] = [
  { value: 'queued', label: 'Queued', color: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'Processing', color: 'bg-amber-100 text-amber-700' },
  { value: 'completed', label: 'Completed', color: 'bg-diff-added text-diff-added-text' },
  { value: 'failed', label: 'Failed', color: 'bg-diff-removed text-diff-removed-text' },
]

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'match_percentage', label: 'Match %' },
  { value: 'run_name', label: 'Run Name' },
  { value: 'id', label: 'Run ID' },
]

export function SearchFilterBar({ params, onChange, statusCounts, totalCount }: SearchFilterBarProps) {
  const [searchValue, setSearchValue] = useState(params.search || '')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      if (searchValue !== (params.search || '')) {
        onChange({ ...params, search: searchValue || undefined, page: 1 })
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchValue])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterPanelOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeStatuses = params.status ? params.status.split(',') : []
  const hasFilters = !!(params.search || params.status || params.date_from || params.date_to ||
    params.match_min !== undefined || params.match_max !== undefined)

  const toggleStatus = (status: string) => {
    let next: string[]
    if (activeStatuses.includes(status)) {
      next = activeStatuses.filter((s) => s !== status)
    } else {
      next = [...activeStatuses, status]
    }
    onChange({ ...params, status: next.length ? next.join(',') : undefined, page: 1 })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    onChange({ page: 1, page_size: params.page_size, sort_by: params.sort_by, sort_order: params.sort_order })
  }

  const setSort = (sortBy: string) => {
    const newOrder = params.sort_by === sortBy && params.sort_order === 'desc' ? 'asc' : 'desc'
    onChange({ ...params, sort_by: sortBy, sort_order: newOrder, page: 1 })
    setSortDropdownOpen(false)
  }

  // Active filter chips
  const chips: { label: string; onRemove: () => void }[] = []
  if (params.status) {
    activeStatuses.forEach((s) => {
      const opt = STATUS_OPTIONS.find((o) => o.value === s)
      if (opt) {
        chips.push({
          label: `Status: ${opt.label}`,
          onRemove: () => toggleStatus(s),
        })
      }
    })
  }
  if (params.date_from || params.date_to) {
    const from = params.date_from ? new Date(params.date_from).toLocaleDateString() : '...'
    const to = params.date_to ? new Date(params.date_to).toLocaleDateString() : '...'
    chips.push({
      label: `Date: ${from} – ${to}`,
      onRemove: () => onChange({ ...params, date_from: undefined, date_to: undefined, page: 1 }),
    })
  }
  if (params.match_min !== undefined || params.match_max !== undefined) {
    chips.push({
      label: `Match: ${params.match_min ?? 0}% – ${params.match_max ?? 100}%`,
      onRemove: () => onChange({ ...params, match_min: undefined, match_max: undefined, page: 1 }),
    })
  }

  return (
    <div className="space-y-3">
      {/* Search + Sort + Filter toggle */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search runs by name, agreement ID or name..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(''); onChange({ ...params, search: undefined, page: 1 }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-[42px]"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
            <ChevronDown className={cn('w-3 h-3 transition-transform', sortDropdownOpen && 'rotate-180')} />
          </Button>
          {sortDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-lg py-1 w-44 animate-slide-up">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/50 transition-colors',
                    params.sort_by === opt.value && 'text-primary font-medium'
                  )}
                >
                  {opt.label}
                  {params.sort_by === opt.value && (
                    <span className="text-[10px] text-primary">{params.sort_order === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters button */}
        <div ref={filterRef} className="relative">
          <Button
            variant={filterPanelOpen || hasFilters ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 h-[42px]"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {chips.length > 0 && (
              <span className="ml-0.5 w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                {chips.length}
              </span>
            )}
          </Button>

          {/* Filter panel */}
          {filterPanelOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-xl shadow-xl p-4 w-80 space-y-4 animate-slide-up">
              {/* Status */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = activeStatuses.includes(opt.value)
                    const count = statusCounts[opt.value]
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleStatus(opt.value)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          active
                            ? `${opt.color} border-transparent shadow-sm`
                            : 'bg-white text-muted-foreground border-border hover:border-primary/30'
                        )}
                      >
                        {opt.label}
                        <span className="ml-1 opacity-60">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={params.date_from || ''}
                    onChange={(e) => onChange({ ...params, date_from: e.target.value || undefined, page: 1 })}
                    className="flex-1 rounded-md border px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={params.date_to || ''}
                    onChange={(e) => onChange({ ...params, date_to: e.target.value || undefined, page: 1 })}
                    className="flex-1 rounded-md border px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Match percentage */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Match Percentage
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={params.match_min ?? ''}
                    onChange={(e) => onChange({
                      ...params,
                      match_min: e.target.value ? Number(e.target.value) : undefined,
                      page: 1,
                    })}
                    placeholder="Min"
                    className="w-20 rounded-md border px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={params.match_max ?? ''}
                    onChange={(e) => onChange({
                      ...params,
                      match_max: e.target.value ? Number(e.target.value) : undefined,
                      page: 1,
                    })}
                    placeholder="Max"
                    className="w-20 rounded-md border px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Clear all */}
              {hasFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <RotateCcw className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status quick-filter tabs + filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick status tabs */}
        <button
          onClick={() => onChange({ ...params, status: undefined, page: 1 })}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            !params.status
              ? 'bg-primary text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          All
          <span className={cn('ml-1.5 text-[10px]', !params.status ? 'text-white/70' : 'text-muted-foreground/50')}>
            {totalCount}
          </span>
        </button>
        {STATUS_OPTIONS.map((opt) => {
          const count = statusCounts[opt.value]
          const active = activeStatuses.length === 1 && activeStatuses[0] === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ ...params, status: opt.value, page: 1 })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {opt.label}
              <span className={cn('ml-1.5 text-[10px]', active ? 'text-white/70' : 'text-muted-foreground/50')}>
                {count}
              </span>
            </button>
          )
        })}

        {/* Active filter chips */}
        {chips.length > 0 && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            {chips.map((chip, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-1 text-[11px] cursor-default"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
