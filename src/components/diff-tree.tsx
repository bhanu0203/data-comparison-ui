import { useState } from 'react'
import { ChevronRight, ChevronDown, Equal, AlertTriangle, Plus, Minus, ArrowLeftRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DiffEntry, DiffType } from '@/types'

interface DiffTreeProps {
  entries: DiffEntry[]
  filter: DiffType | 'all'
}

const diffConfig: Record<DiffType, { icon: typeof Equal; label: string; bg: string; text: string; badgeVariant: 'success' | 'error' | 'warning' | 'secondary' }> = {
  match: { icon: Equal, label: 'Match', bg: 'bg-emerald-50', text: 'text-emerald-600', badgeVariant: 'success' },
  mismatch: { icon: ArrowLeftRight, label: 'Mismatch', bg: 'bg-amber-50', text: 'text-amber-600', badgeVariant: 'warning' },
  missing_left: { icon: Plus, label: 'Baseline Only', bg: 'bg-blue-50', text: 'text-blue-600', badgeVariant: 'secondary' },
  missing_right: { icon: Minus, label: 'LLM Only', bg: 'bg-purple-50', text: 'text-purple-600', badgeVariant: 'secondary' },
  type_mismatch: { icon: AlertTriangle, label: 'Type Mismatch', bg: 'bg-rose-50', text: 'text-rose-600', badgeVariant: 'error' },
  structural: { icon: ArrowLeftRight, label: 'Has Changes', bg: 'bg-amber-50/50', text: 'text-amber-600', badgeVariant: 'warning' },
}

function formatValue(val: unknown): string {
  if (val === undefined) return '—'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + (JSON.stringify(val).length > 60 ? '...' : '')
  return String(val)
}

// Recursively check if a subtree contains any leaf node matching the filter
function hasMatchingLeaf(entry: DiffEntry, filter: DiffType): boolean {
  if (entry.children && entry.children.length > 0) {
    return entry.children.some(c => hasMatchingLeaf(c, filter))
  }
  return entry.diffType === filter
}

function DiffNode({ entry, filter, depth = 0 }: { entry: DiffEntry; filter: DiffType | 'all'; depth?: number }) {
  const [isOpen, setIsOpen] = useState(entry.diffType !== 'match')
  const config = diffConfig[entry.diffType]
  const Icon = config.icon
  const hasChildren = entry.children && entry.children.length > 0

  // Filter logic: hide nodes that don't contain any matching leaves
  if (filter !== 'all') {
    if (!hasChildren && entry.diffType !== filter) return null
    if (hasChildren && !hasMatchingLeaf(entry, filter)) return null
  }

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${depth * 20}ms` }}>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 group',
          hasChildren ? 'cursor-pointer' : '',
          entry.diffType !== 'match' && entry.diffType !== 'structural' && config.bg,
          'hover:bg-muted/60'
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> :
                   <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <Icon className={cn('w-4 h-4 flex-shrink-0', config.text)} />
        )}

        <span className="font-mono text-sm font-medium text-foreground flex-shrink-0">
          {entry.key}
        </span>

        {!hasChildren && entry.diffType !== 'match' && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn(
              'text-xs font-mono truncate max-w-[200px] px-2 py-0.5 rounded',
              entry.diffType === 'missing_left' ? 'bg-muted text-muted-foreground line-through' :
              entry.diffType === 'type_mismatch' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
            )}>
              {formatValue(entry.leftValue)}
            </span>
            <ArrowLeftRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className={cn(
              'text-xs font-mono truncate max-w-[200px] px-2 py-0.5 rounded',
              entry.diffType === 'missing_right' ? 'bg-muted text-muted-foreground line-through' :
              entry.diffType === 'type_mismatch' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            )}>
              {formatValue(entry.rightValue)}
            </span>
          </div>
        )}

        {!hasChildren && entry.diffType === 'match' && (
          <span className="text-xs font-mono text-muted-foreground truncate max-w-[300px]">
            {formatValue(entry.leftValue)}
          </span>
        )}

        <div className="ml-auto flex-shrink-0">
          <Badge variant={config.badgeVariant} className="text-[10px]">
            {config.label}
          </Badge>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="border-l border-dashed border-muted-foreground/20" style={{ marginLeft: `${depth * 24 + 24}px` }}>
          {entry.children!.map((child, idx) => (
            <DiffNode key={child.path + idx} entry={child} filter={filter} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DiffTree({ entries, filter }: DiffTreeProps) {
  return (
    <div className="space-y-0.5">
      {entries.map((entry, idx) => (
        <DiffNode key={entry.path + idx} entry={entry} filter={filter} />
      ))}
    </div>
  )
}
