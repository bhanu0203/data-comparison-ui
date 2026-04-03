import { useRef, useCallback, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { ArrayKeyConfig } from '@/types'

interface RawDiffViewerProps {
  leftData: unknown
  rightData: unknown
  leftLabel?: string
  rightLabel?: string
  arrayKeys?: ArrayKeyConfig
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
 * Reorder arrays in `data` so elements match the order found in `reference`,
 * using the key fields from `arrayKeys`. This ensures the raw JSON diff
 * aligns matched elements instead of showing index-based mismatches.
 */
function alignToBaseline(data: unknown, reference: unknown, arrayKeys: ArrayKeyConfig, path = ''): unknown {
  if (Array.isArray(data) && Array.isArray(reference)) {
    const configPath = path.replace(/\[\d+\]/g, '').replace(/\.$/, '')
    const keyField = arrayKeys[configPath]

    if (keyField && data.length > 0 && reference.length > 0 &&
        typeof data[0] === 'object' && data[0] !== null &&
        typeof reference[0] === 'object' && reference[0] !== null) {
      const leftByKey = new Map<string, unknown>()
      const unmatched: unknown[] = []
      for (const item of data) {
        const key = String((item as Record<string, unknown>)[keyField] ?? '')
        if (key) leftByKey.set(key, item)
        else unmatched.push(item)
      }

      // Build reordered array: baseline order first, then LLM-only elements
      const reordered: unknown[] = []
      const usedKeys = new Set<string>()
      for (const refItem of reference) {
        const key = String((refItem as Record<string, unknown>)[keyField] ?? '')
        if (key && leftByKey.has(key)) {
          usedKeys.add(key)
          reordered.push(leftByKey.get(key))
        }
      }
      // Append LLM-only elements at the end
      for (const item of data) {
        const key = String((item as Record<string, unknown>)[keyField] ?? '')
        if (key && !usedKeys.has(key)) reordered.push(item)
      }
      for (const item of unmatched) reordered.push(item)

      // Recurse into each element
      return reordered.map((item, i) =>
        i < reference.length
          ? alignToBaseline(item, reference[i], arrayKeys, `${path}[${i}]`)
          : item
      )
    }

    // No key config — recurse positionally
    return data.map((item, i) =>
      i < reference.length
        ? alignToBaseline(item, reference[i], arrayKeys, `${path}[${i}]`)
        : item
    )
  }

  if (data !== null && typeof data === 'object' && !Array.isArray(data) &&
      reference !== null && typeof reference === 'object' && !Array.isArray(reference)) {
    const dataObj = data as Record<string, unknown>
    const refObj = reference as Record<string, unknown>
    const result: Record<string, unknown> = {}

    // Add keys in baseline order first — this aligns lines so LCS
    // doesn't bleed across object boundaries when fields are missing
    for (const k of Object.keys(refObj)) {
      if (k in dataObj) {
        const childPath = path ? `${path}.${k}` : k
        result[k] = alignToBaseline(dataObj[k], refObj[k], arrayKeys, childPath)
      }
    }
    // Then append LLM-only keys at the end
    for (const k of Object.keys(dataObj)) {
      if (!(k in refObj)) {
        result[k] = dataObj[k]
      }
    }
    return result
  }

  return data
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

export function RawDiffViewer({ leftData, rightData, leftLabel = 'LLM Extract', rightLabel = 'Baseline', arrayKeys }: RawDiffViewerProps) {
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  // Reorder LLM arrays to match baseline order when arrayKeys is configured
  const alignedLeftData = useMemo(
    () => arrayKeys && Object.keys(arrayKeys).length > 0
      ? alignToBaseline(leftData, rightData, arrayKeys)
      : leftData,
    [leftData, rightData, arrayKeys]
  )

  const leftText = useMemo(() => JSON.stringify(alignedLeftData, null, 2), [alignedLeftData])
  const rightText = useMemo(() => JSON.stringify(rightData, null, 2), [rightData])

  const diffLines = useMemo(() => {
    const leftLines = jsonToLines(alignedLeftData)
    const rightLines = jsonToLines(rightData)
    return computeLineDiff(leftLines, rightLines)
  }, [alignedLeftData, rightData])

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
