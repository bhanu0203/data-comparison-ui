import { useState } from 'react'
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonViewerProps {
  data: unknown
  maxDepth?: number
  className?: string
}

function JsonNode({ name, value, depth, maxDepth }: { name?: string; value: unknown; depth: number; maxDepth: number }) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)

  if (!isObject) {
    return (
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: depth * 20 }}>
        {name !== undefined && (
          <span className="text-indigo-600 font-medium">"{name}"</span>
        )}
        {name !== undefined && <span className="text-foreground">: </span>}
        <span className={cn(
          typeof value === 'string' && 'text-emerald-600',
          typeof value === 'number' && 'text-amber-600',
          typeof value === 'boolean' && 'text-purple-600',
          value === null && 'text-muted-foreground italic',
        )}>
          {typeof value === 'string' ? `"${value}"` : String(value)}
        </span>
      </div>
    )
  }

  const entries = isArray ? value.map((v, i) => [String(i), v] as const) : Object.entries(value as Record<string, unknown>)
  const bracket = isArray ? ['[', ']'] : ['{', '}']

  if (depth >= maxDepth) {
    return (
      <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: depth * 20 }}>
        {name !== undefined && <span className="text-indigo-600 font-medium">"{name}"</span>}
        {name !== undefined && <span>: </span>}
        <span className="text-muted-foreground">{bracket[0]}...{bracket[1]} ({entries.length})</span>
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-muted/50 rounded"
        style={{ paddingLeft: depth * 20 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
        {name !== undefined && (
          <>
            <span className="text-indigo-600 font-medium">"{name}"</span>
            <span>: </span>
          </>
        )}
        <span className="text-muted-foreground">
          {bracket[0]}
          {!isOpen && `... ${entries.length} items ${bracket[1]}`}
        </span>
      </div>
      {isOpen && (
        <>
          {entries.map(([k, v]) => (
            <JsonNode key={k} name={isArray ? undefined : k} value={v} depth={depth + 1} maxDepth={maxDepth} />
          ))}
          <div style={{ paddingLeft: depth * 20 }}>
            <span className="text-muted-foreground">{bracket[1]}</span>
          </div>
        </>
      )}
    </div>
  )
}

export function JsonViewer({ data, maxDepth = 6, className }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative rounded-xl border bg-white overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
        <span className="text-xs font-medium text-muted-foreground">JSON Response</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-4 font-mono text-xs overflow-auto max-h-[500px]">
        <JsonNode value={data} depth={0} maxDepth={maxDepth} />
      </div>
    </div>
  )
}
