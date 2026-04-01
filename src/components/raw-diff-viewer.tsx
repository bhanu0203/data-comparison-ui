import { useRef, useCallback, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface RawDiffViewerProps {
  leftData: unknown
  rightData: unknown
  leftLabel?: string
  rightLabel?: string
}

type LineStatus = 'match' | 'changed' | 'removed' | 'added' | 'section'

interface DiffLine {
  left: string
  right: string
  lineNumLeft: number | null
  lineNumRight: number | null
  status: LineStatus
}

function jsonToLines(data: unknown): string[] {
  return JSON.stringify(data, null, 2).split('\n')
}

/**
 * Simple LCS-based line diff that pairs up lines and marks differences.
 */
function computeLineDiff(leftLines: string[], rightLines: string[]): DiffLine[] {
  // Build LCS table
  const m = leftLines.length
  const n = rightLines.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = m, j = n

  const stack: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      stack.push({
        left: leftLines[i - 1],
        right: rightLines[j - 1],
        lineNumLeft: i,
        lineNumRight: j,
        status: 'match',
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        left: '',
        right: rightLines[j - 1],
        lineNumLeft: null,
        lineNumRight: j,
        status: 'added',
      })
      j--
    } else {
      stack.push({
        left: leftLines[i - 1],
        right: '',
        lineNumLeft: i,
        lineNumRight: null,
        status: 'removed',
      })
      i--
    }
  }

  stack.reverse()

  // Post-process: merge adjacent removed+added into "changed" pairs
  for (let k = 0; k < stack.length; k++) {
    const curr = stack[k]
    const next = stack[k + 1]

    if (curr.status === 'removed' && next && next.status === 'added') {
      result.push({
        left: curr.left,
        right: next.right,
        lineNumLeft: curr.lineNumLeft,
        lineNumRight: next.lineNumRight,
        status: 'changed',
      })
      k++ // skip next
    } else {
      result.push(curr)
    }
  }

  return result
}

const statusStyles: Record<LineStatus, { left: string; right: string; gutter: string }> = {
  match: { left: '', right: '', gutter: 'text-muted-foreground/40' },
  changed: {
    left: 'bg-red-50 text-red-900',
    right: 'bg-green-50 text-green-900',
    gutter: 'text-amber-500 font-bold',
  },
  removed: {
    left: 'bg-red-100 text-red-800',
    right: 'bg-gray-50 text-gray-400',
    gutter: 'text-red-500 font-bold',
  },
  added: {
    left: 'bg-gray-50 text-gray-400',
    right: 'bg-green-100 text-green-800',
    gutter: 'text-green-500 font-bold',
  },
  section: { left: '', right: '', gutter: '' },
}

const gutterSymbol: Record<LineStatus, string> = {
  match: ' ',
  changed: '~',
  removed: '-',
  added: '+',
  section: ' ',
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export function RawDiffViewer({ leftData, rightData, leftLabel = 'LLM Extract', rightLabel = 'Baseline' }: RawDiffViewerProps) {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  const leftText = useMemo(() => JSON.stringify(leftData, null, 2), [leftData])
  const rightText = useMemo(() => JSON.stringify(rightData, null, 2), [rightData])

  const diffLines = useMemo(() => {
    const leftLines = jsonToLines(leftData)
    const rightLines = jsonToLines(rightData)
    return computeLineDiff(leftLines, rightLines)
  }, [leftData, rightData])

  const stats = useMemo(() => {
    let matched = 0, changed = 0, added = 0, removed = 0
    for (const line of diffLines) {
      if (line.status === 'match') matched++
      else if (line.status === 'changed') changed++
      else if (line.status === 'added') added++
      else if (line.status === 'removed') removed++
    }
    return { matched, changed, added, removed, total: diffLines.length }
  }, [diffLines])

  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (isSyncing.current) return
    isSyncing.current = true

    const from = source === 'left' ? leftRef.current : rightRef.current
    const to = source === 'left' ? rightRef.current : leftRef.current

    if (from && to) {
      to.scrollTop = from.scrollTop
      to.scrollLeft = from.scrollLeft
    }

    requestAnimationFrame(() => {
      isSyncing.current = false
    })
  }, [])

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">{stats.total} lines</span>
        {stats.matched > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted" />
            {stats.matched} matching
          </span>
        )}
        {stats.changed > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {stats.changed} changed
          </span>
        )}
        {stats.removed > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {stats.removed} removed
          </span>
        )}
        {stats.added > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {stats.added} added
          </span>
        )}
      </div>

      {/* Diff viewer */}
      <div className="rounded-xl border overflow-hidden bg-white">
        {/* Headers */}
        <div className="grid grid-cols-2 border-b">
          <div className="flex items-center justify-between px-4 py-2 bg-red-50/30 border-r">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{leftLabel}</span>
            <CopyButton text={leftText} label={leftLabel} />
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-green-50/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{rightLabel}</span>
            <CopyButton text={rightText} label={rightLabel} />
          </div>
        </div>

        {/* Synchronized scroll panels */}
        <div className="grid grid-cols-2" style={{ height: '600px' }}>
          {/* Left panel */}
          <div
            ref={leftRef}
            className="overflow-auto border-r h-full diff-scroll"
            onScroll={() => handleScroll('left')}
          >
            <div className="font-mono text-xs leading-[22px]">
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex min-h-[22px]',
                    statusStyles[line.status].left
                  )}
                >
                  <span className={cn(
                    'w-8 flex-shrink-0 text-right pr-2 select-none border-r',
                    statusStyles[line.status].gutter
                  )}>
                    {line.lineNumLeft ?? ''}
                  </span>
                  <span className="w-5 flex-shrink-0 text-center select-none text-muted-foreground/60">
                    {gutterSymbol[line.status]}
                  </span>
                  <span className="whitespace-pre px-1">{line.left || '\u00A0'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div
            ref={rightRef}
            className="overflow-auto h-full diff-scroll"
            onScroll={() => handleScroll('right')}
          >
            <div className="font-mono text-xs leading-[22px]">
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex min-h-[22px]',
                    statusStyles[line.status].right
                  )}
                >
                  <span className={cn(
                    'w-8 flex-shrink-0 text-right pr-2 select-none border-r',
                    statusStyles[line.status].gutter
                  )}>
                    {line.lineNumRight ?? ''}
                  </span>
                  <span className="w-5 flex-shrink-0 text-center select-none text-muted-foreground/60">
                    {gutterSymbol[line.status]}
                  </span>
                  <span className="whitespace-pre px-1">{line.right || '\u00A0'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
