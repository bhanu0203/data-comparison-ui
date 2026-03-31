import { useState, useMemo, useRef, useCallback, useEffect, type CSSProperties, type ReactElement } from 'react'
import { List, useListRef } from 'react-window'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Search, ChevronsUpDown, Check, FileStack, X,
  ArrowUpDown, Clock, Hash, SortAsc,
} from 'lucide-react'
import type { Agreement } from '@/types'

type SortKey = 'name' | 'date' | 'fields' | 'id'

interface AgreementPickerProps {
  agreements: Agreement[]
  selectedId: number | null
  onSelect: (id: number) => void
  loading?: boolean
}

const ITEM_HEIGHT = 56
const MAX_VISIBLE = 8

// Row props passed via List's rowProps
interface RowExtraProps {
  items: Agreement[]
  selectedId: number | null
  focusIndex: number
  onItemSelect: (id: number) => void
  onItemHover: (index: number) => void
}

// Row component for react-window v2
function AgreementRow({
  index,
  style,
  items,
  selectedId,
  focusIndex,
  onItemSelect,
  onItemHover,
}: RowExtraProps & {
  ariaAttributes: unknown
  index: number
  style: CSSProperties
}): ReactElement | null {
  const agr = items[index]
  if (!agr) return null
  const isSelected = agr.id === selectedId
  const isFocused = index === focusIndex
  return (
    <div style={style} className="px-1">
      <button
        onClick={() => onItemSelect(agr.id)}
        onMouseEnter={() => onItemHover(index)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors h-[48px]',
          isFocused && 'bg-primary/8',
          isSelected && !isFocused && 'bg-primary/5',
          !isFocused && !isSelected && 'hover:bg-muted/50'
        )}
      >
        <div
          className={cn(
            'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
          )}
        >
          {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{agr.name}</span>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {agr.agreement_id}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{agr.field_count} fields</span>
            <span>{new Date(agr.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {isSelected && (
          <Check className="w-4 h-4 text-primary shrink-0" />
        )}
      </button>
    </div>
  )
}

export function AgreementPicker({
  agreements,
  selectedId,
  onSelect,
  loading,
}: AgreementPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [focusIndex, setFocusIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useListRef(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    let items = agreements
    if (q) {
      items = agreements.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.agreement_id.toLowerCase().includes(q) ||
          String(a.field_count).includes(q)
      )
    }
    const sorted = [...items]
    switch (sortKey) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'date':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'fields':
        sorted.sort((a, b) => b.field_count - a.field_count)
        break
      case 'id':
        sorted.sort((a, b) => a.agreement_id.localeCompare(b.agreement_id))
        break
    }
    return sorted
  }, [agreements, query, sortKey])

  // Reset focus index when filter changes
  useEffect(() => {
    setFocusIndex(0)
    listRef.current?.scrollToRow({ index: 0 })
  }, [query, sortKey, listRef])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusIndex((prev) => {
            const next = Math.min(prev + 1, filtered.length - 1)
            listRef.current?.scrollToRow({ index: next, align: 'smart' })
            return next
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusIndex((prev) => {
            const next = Math.max(prev - 1, 0)
            listRef.current?.scrollToRow({ index: next, align: 'smart' })
            return next
          })
          break
        case 'Enter':
          e.preventDefault()
          if (filtered[focusIndex]) {
            onSelect(filtered[focusIndex].id)
            setOpen(false)
            setQuery('')
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          setQuery('')
          break
      }
    },
    [open, filtered, focusIndex, onSelect, listRef]
  )

  const handleSelect = useCallback(
    (id: number) => {
      onSelect(id)
      setOpen(false)
      setQuery('')
    },
    [onSelect]
  )

  const handleHover = useCallback((index: number) => {
    setFocusIndex(index)
  }, [])

  const selected = agreements.find((a) => a.id === selectedId)
  const listHeight = Math.min(filtered.length, MAX_VISIBLE) * ITEM_HEIGHT

  const sortOptions: { key: SortKey; icon: typeof SortAsc; label: string }[] = [
    { key: 'name', icon: SortAsc, label: 'Name' },
    { key: 'date', icon: Clock, label: 'Recent' },
    { key: 'fields', icon: Hash, label: 'Fields' },
    { key: 'id', icon: ArrowUpDown, label: 'ID' },
  ]

  // Memoize rowProps to avoid unnecessary re-renders
  const rowProps: RowExtraProps = useMemo(
    () => ({
      items: filtered,
      selectedId,
      focusIndex,
      onItemSelect: handleSelect,
      onItemHover: handleHover,
    }),
    [filtered, selectedId, focusIndex, handleSelect, handleHover]
  )

  if (loading) {
    return (
      <div className="h-12 rounded-lg border bg-muted/30 animate-pulse flex items-center px-4">
        <span className="text-sm text-muted-foreground">Loading agreements...</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
          open
            ? 'border-primary ring-2 ring-primary/20 bg-white'
            : 'border-border hover:border-primary/40 bg-white',
          !selected && 'text-muted-foreground'
        )}
      >
        <FileStack className={cn('w-5 h-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground/50')} />
        {selected ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">{selected.name}</span>
              <Badge variant="secondary" className="text-[10px]">{selected.agreement_id}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{selected.field_count} fields</span>
          </div>
        ) : (
          <span className="flex-1 text-sm">Select an agreement...</span>
        )}
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl border bg-white shadow-xl shadow-black/10 overflow-hidden animate-slide-up">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, or field count..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-0.5 rounded hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Sort bar + count */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/10">
            <div className="flex items-center gap-1">
              {sortOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSortKey(opt.key)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
                      sortKey === opt.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {filtered.length === agreements.length
                ? `${agreements.length} agreements`
                : `${filtered.length} of ${agreements.length}`}
            </span>
          </div>

          {/* Virtualized list */}
          {filtered.length > 0 ? (
            <List<RowExtraProps>
              listRef={listRef}
              rowComponent={AgreementRow}
              rowCount={filtered.length}
              rowHeight={ITEM_HEIGHT}
              rowProps={rowProps}
              overscanCount={5}
              style={{ height: listHeight }}
            />
          ) : (
            <div className="py-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No agreements match "{query}"</p>
              <button
                onClick={() => setQuery('')}
                className="text-xs text-primary hover:underline mt-1"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Keyboard hint */}
          <div className="flex items-center gap-3 px-3 py-2 border-t bg-muted/20 text-[11px] text-muted-foreground">
            <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> select</span>
            <span><kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> close</span>
          </div>
        </div>
      )}
    </div>
  )
}
