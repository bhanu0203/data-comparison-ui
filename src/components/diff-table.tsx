import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { DiffEntry, DiffType } from '@/types'

interface DiffTableProps {
  entries: DiffEntry[]
  filter: DiffType | 'all'
}

function flattenEntries(entries: DiffEntry[], result: DiffEntry[] = []): DiffEntry[] {
  for (const entry of entries) {
    if (entry.children && entry.children.length > 0) {
      flattenEntries(entry.children, result)
    } else {
      result.push(entry)
    }
  }
  return result
}

function formatValue(val: unknown): string {
  if (val === undefined) return '—'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const rowStyles: Record<DiffType, string> = {
  match: '',
  mismatch: 'bg-amber-50/60',
  missing_left: 'bg-blue-50/60',
  missing_right: 'bg-purple-50/60',
  type_mismatch: 'bg-rose-50/60',
  structural: 'bg-amber-50/30',
}

const badgeVariant: Record<DiffType, 'success' | 'warning' | 'error' | 'secondary'> = {
  match: 'success',
  mismatch: 'warning',
  missing_left: 'secondary',
  missing_right: 'secondary',
  type_mismatch: 'error',
  structural: 'warning',
}

const statusLabels: Record<DiffType, string> = {
  match: 'Match',
  mismatch: 'Mismatch',
  missing_left: 'Baseline Only',
  missing_right: 'LLM Only',
  type_mismatch: 'Type Diff',
  structural: 'Structural',
}

export function DiffTable({ entries, filter }: DiffTableProps) {
  const flat = flattenEntries(entries)
  const filtered = filter === 'all' ? flat : flat.filter(e => e.diffType === filter)

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Path</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">LLM Extract</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Baseline</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry, idx) => (
            <tr
              key={entry.path + idx}
              className={cn(
                'border-t transition-colors hover:bg-muted/30',
                rowStyles[entry.diffType]
              )}
            >
              <td className="px-4 py-2.5 font-mono text-xs text-foreground max-w-[250px] truncate">
                {entry.path}
              </td>
              <td className={cn(
                'px-4 py-2.5 font-mono text-xs max-w-[200px] truncate',
                entry.diffType === 'missing_left' ? 'text-muted-foreground italic' : 'text-foreground'
              )}>
                {formatValue(entry.leftValue)}
              </td>
              <td className={cn(
                'px-4 py-2.5 font-mono text-xs max-w-[200px] truncate',
                entry.diffType === 'missing_right' ? 'text-muted-foreground italic' : 'text-foreground'
              )}>
                {formatValue(entry.rightValue)}
              </td>
              <td className="px-4 py-2.5 text-center">
                <Badge variant={badgeVariant[entry.diffType]} className="text-[10px]">
                  {statusLabels[entry.diffType]}
                </Badge>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                No entries match the current filter
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
