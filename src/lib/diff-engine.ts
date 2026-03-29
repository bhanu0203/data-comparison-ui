import type { DiffEntry, DiffSummary, DiffType } from '@/types'

function getType(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (Array.isArray(val)) return 'array'
  return typeof val
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function deepDiff(
  left: unknown,
  right: unknown,
  path = '',
  depth = 0
): DiffEntry[] {
  const entries: DiffEntry[] = []

  const leftIsObj = isObject(left)
  const rightIsObj = isObject(right)
  const leftIsArr = Array.isArray(left)
  const rightIsArr = Array.isArray(right)

  // Both are objects
  if (leftIsObj && rightIsObj) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key
      const inLeft = key in left
      const inRight = key in right

      if (!inLeft) {
        entries.push({
          path: fullPath,
          key,
          depth: depth + 1,
          leftValue: undefined,
          rightValue: right[key],
          diffType: 'missing_left',
          children: isObject(right[key]) || Array.isArray(right[key])
            ? flattenValue(right[key], fullPath, depth + 2, 'missing_left')
            : undefined,
        })
      } else if (!inRight) {
        entries.push({
          path: fullPath,
          key,
          depth: depth + 1,
          leftValue: left[key],
          rightValue: undefined,
          diffType: 'missing_right',
          children: isObject(left[key]) || Array.isArray(left[key])
            ? flattenValue(left[key], fullPath, depth + 2, 'missing_right')
            : undefined,
        })
      } else {
        const leftType = getType(left[key])
        const rightType = getType(right[key])

        if (leftType !== rightType) {
          entries.push({
            path: fullPath,
            key,
            depth: depth + 1,
            leftValue: left[key],
            rightValue: right[key],
            diffType: 'type_mismatch',
          })
        } else if (isObject(left[key]) || Array.isArray(left[key])) {
          const children = deepDiff(left[key], right[key], fullPath, depth + 1)
          const hasChanges = children.some(c => c.diffType !== 'match')
          entries.push({
            path: fullPath,
            key,
            depth: depth + 1,
            leftValue: left[key],
            rightValue: right[key],
            diffType: hasChanges ? 'structural' : 'match',
            children,
          })
        } else if (left[key] === right[key]) {
          entries.push({
            path: fullPath,
            key,
            depth: depth + 1,
            leftValue: left[key],
            rightValue: right[key],
            diffType: 'match',
          })
        } else {
          entries.push({
            path: fullPath,
            key,
            depth: depth + 1,
            leftValue: left[key],
            rightValue: right[key],
            diffType: 'mismatch',
          })
        }
      }
    }
    return entries
  }

  // Both are arrays
  if (leftIsArr && rightIsArr) {
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      const fullPath = `${path}[${i}]`
      if (i >= left.length) {
        entries.push({
          path: fullPath,
          key: `[${i}]`,
          depth: depth + 1,
          leftValue: undefined,
          rightValue: right[i],
          diffType: 'missing_left',
        })
      } else if (i >= right.length) {
        entries.push({
          path: fullPath,
          key: `[${i}]`,
          depth: depth + 1,
          leftValue: left[i],
          rightValue: undefined,
          diffType: 'missing_right',
        })
      } else {
        const children = deepDiff(left[i], right[i], fullPath, depth + 1)
        if (isObject(left[i]) || Array.isArray(left[i])) {
          const hasChanges = children.some(c => c.diffType !== 'match')
          entries.push({
            path: fullPath,
            key: `[${i}]`,
            depth: depth + 1,
            leftValue: left[i],
            rightValue: right[i],
            diffType: hasChanges ? 'structural' : 'match',
            children,
          })
        } else if (left[i] === right[i]) {
          entries.push({
            path: fullPath,
            key: `[${i}]`,
            depth: depth + 1,
            leftValue: left[i],
            rightValue: right[i],
            diffType: 'match',
          })
        } else {
          entries.push({
            path: fullPath,
            key: `[${i}]`,
            depth: depth + 1,
            leftValue: left[i],
            rightValue: right[i],
            diffType: 'mismatch',
          })
        }
      }
    }
    return entries
  }

  return entries
}

function flattenValue(val: unknown, path: string, depth: number, diffType: DiffType): DiffEntry[] {
  if (isObject(val)) {
    return Object.entries(val).map(([k, v]) => ({
      path: `${path}.${k}`,
      key: k,
      depth,
      leftValue: diffType === 'missing_left' ? undefined : v,
      rightValue: diffType === 'missing_right' ? undefined : v,
      diffType,
      children: isObject(v) || Array.isArray(v) ? flattenValue(v, `${path}.${k}`, depth + 1, diffType) : undefined,
    }))
  }
  if (Array.isArray(val)) {
    return val.map((v, i) => ({
      path: `${path}[${i}]`,
      key: `[${i}]`,
      depth,
      leftValue: diffType === 'missing_left' ? undefined : v,
      rightValue: diffType === 'missing_right' ? undefined : v,
      diffType,
    }))
  }
  return []
}

export function computeSummary(diffs: DiffEntry[]): DiffSummary {
  let matched = 0
  let mismatched = 0
  let missingLeft = 0
  let missingRight = 0
  let typeMismatches = 0

  function walk(entries: DiffEntry[]) {
    for (const entry of entries) {
      if (entry.children && entry.children.length > 0) {
        walk(entry.children)
      } else {
        switch (entry.diffType) {
          case 'match': matched++; break
          case 'mismatch': mismatched++; break
          case 'missing_left': missingLeft++; break
          case 'missing_right': missingRight++; break
          case 'type_mismatch': typeMismatches++; break
        }
      }
    }
  }

  walk(diffs)

  const totalFields = matched + mismatched + missingLeft + missingRight + typeMismatches

  return {
    totalFields,
    matched,
    mismatched,
    missingLeft,
    missingRight,
    typeMismatches,
    matchPercentage: totalFields > 0 ? Math.round((matched / totalFields) * 100) : 0,
  }
}
