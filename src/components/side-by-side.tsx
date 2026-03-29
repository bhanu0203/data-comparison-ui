import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiffEntry, DiffType } from '@/types'

interface SideBySideProps {
  entries: DiffEntry[]
  filter: DiffType | 'all'
}

const bgMap: Record<DiffType, [string, string]> = {
  match: ['', ''],
  mismatch: ['bg-red-50/60', 'bg-green-50/60'],
  missing_left: ['bg-gray-50', 'bg-blue-50/60'],
  missing_right: ['bg-purple-50/60', 'bg-gray-50'],
  type_mismatch: ['bg-red-50/60', 'bg-amber-50/60'],
  structural: ['', ''],
}

function formatVal(val: unknown): string {
  if (val === undefined) return ''
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

function SideBySideNode({ entry, depth, filter }: { entry: DiffEntry; depth: number; filter: DiffType | 'all' }) {
  const [open, setOpen] = useState(entry.diffType !== 'match')
  const hasChildren = entry.children && entry.children.length > 0

  if (filter !== 'all' && !hasChildren && entry.diffType !== filter) return null

  const [leftBg, rightBg] = bgMap[entry.diffType]
  const indent = depth * 16

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-[1fr,1px,1fr] min-h-[36px] border-b hover:bg-muted/20 transition-colors',
          hasChildren && 'cursor-pointer',
        )}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {/* Left */}
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs', leftBg)} style={{ paddingLeft: indent + 12 }}>
          {hasChildren && (
            open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="text-indigo-600 font-medium flex-shrink-0">{entry.key}</span>
          {!hasChildren && (
            <span className={cn(
              'truncate',
              entry.diffType === 'missing_left' ? 'text-muted-foreground italic' :
              entry.diffType === 'mismatch' || entry.diffType === 'type_mismatch' ? 'text-red-700 line-through' :
              'text-foreground'
            )}>
              : {formatVal(entry.leftValue)}
            </span>
          )}
          {hasChildren && !open && <span className="text-muted-foreground">{'{...}'}</span>}
        </div>

        {/* Divider */}
        <div className="bg-border" />

        {/* Right */}
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs', rightBg)} style={{ paddingLeft: indent + 12 }}>
          {hasChildren && (
            open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <span className="text-indigo-600 font-medium flex-shrink-0">{entry.key}</span>
          {!hasChildren && (
            <span className={cn(
              'truncate',
              entry.diffType === 'missing_right' ? 'text-muted-foreground italic' :
              entry.diffType === 'mismatch' || entry.diffType === 'type_mismatch' ? 'text-green-700 font-semibold' :
              'text-foreground'
            )}>
              : {formatVal(entry.rightValue)}
            </span>
          )}
          {hasChildren && !open && <span className="text-muted-foreground">{'{...}'}</span>}
        </div>
      </div>

      {hasChildren && open && entry.children!.map((child, i) => (
        <SideBySideNode key={child.path + i} entry={child} depth={depth + 1} filter={filter} />
      ))}
    </>
  )
}

export function SideBySide({ entries, filter }: SideBySideProps) {
  return (
    <div className="rounded-xl border overflow-hidden bg-white">
      {/* Header */}
      <div className="grid grid-cols-[1fr,1px,1fr] border-b bg-muted/40">
        <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          System 1 — PDF Extraction
        </div>
        <div className="bg-border" />
        <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          System 2 — Direct Extraction
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[600px] overflow-auto">
        {entries.map((entry, idx) => (
          <SideBySideNode key={entry.path + idx} entry={entry} depth={0} filter={filter} />
        ))}
      </div>
    </div>
  )
}
