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
  match: { icon: Equal, label: 'Match', bg: 'bg-diff-added/40', text: 'text-diff-added-text', badgeVariant: 'success' },
  mismatch: { icon: ArrowLeftRight, label: 'Mismatch', bg: 'bg-diff-changed/40', text: 'text-diff-changed-text', badgeVariant: 'warning' },
  missing_left: { icon: Plus, label: 'Only in System 2', bg: 'bg-blue-50', text: 'text-blue-600', badgeVariant: 'secondary' },
  missing_right: { icon: Minus, label: 'Only in System 1', bg: 'bg-purple-50', text: 'text-purple-600', badgeVariant: 'secondary' },
  type_mismatch: { icon: AlertTriangle, label: 'Type Mismatch', bg: 'bg-diff-removed/40', text: 'text-diff-removed-text', badgeVariant: 'error' },
  structural: { icon: ArrowLeftRight, label: 'Has Changes', bg: 'bg-diff-changed/20', text: 'text-diff-changed-text', badgeVariant: 'warning' },
}

function formatValue(val: unknown): string {
  if (val === undefined) return '—'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + (JSON.stringify(val).length > 60 ? '...' : '')
  return String(val)
}

function DiffNode({ entry, filter, depth = 0 }: { entry: DiffEntry; filter: DiffType | 'all'; depth?: number }) {
  const [isOpen, setIsOpen] = useState(entry.diffType !== 'match')
  const config = diffConfig[entry.diffType]
  const Icon = config.icon
  const hasChildren = entry.children && entry.children.length > 0

  // Filter logic
  if (filter !== 'all') {
    if (!hasChildren && entry.diffType !== filter) return null
    if (hasChildren) {
      const filteredChildren = entry.children!.filter(c => {
        if (c.children?.length) return true
        return c.diffType === filter
      })
      if (filteredChildren.length === 0 && entry.diffType !== filter) return null
    }
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
              entry.diffType === 'missing_left' ? 'bg-muted text-muted-foreground line-through' : 'bg-red-50 text-red-700'
            )}>
              {formatValue(entry.leftValue)}
            </span>
            <ArrowLeftRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className={cn(
              'text-xs font-mono truncate max-w-[200px] px-2 py-0.5 rounded',
              entry.diffType === 'missing_right' ? 'bg-muted text-muted-foreground line-through' : 'bg-green-50 text-green-700'
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
