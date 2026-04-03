import type { DiffEntry, DiffSummary, DiffType, ArrayKeyConfig } from '@/types'

function getType(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (Array.isArray(val)) return 'array'
  return typeof val
}

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

/**
 * Strip array indices from a path to get the "shape" path for key config lookup.
 * e.g. "parties[0].name" → "parties", "a.items[2].sub[1]" → "a.items.sub"
 */
function toKeyConfigPath(path: string): string {
  return path.replace(/\[\d+\]/g, '').replace(/\.$/, '')
}

export function deepDiff(
  left: unknown,
  right: unknown,
  path = '',
  depth = 0,
  arrayKeys?: ArrayKeyConfig
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
          const children = deepDiff(left[key], right[key], fullPath, depth + 1, arrayKeys)
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
    // Check if we have a key config for this array path
    const configPath = toKeyConfigPath(path)
    const keyField = arrayKeys?.[configPath]

    // Use key-based matching if configured and elements are objects
    if (keyField && left.length > 0 && right.length > 0 && isObject(left[0]) && isObject(right[0])) {
      return diffArrayByKey(left, right, path, depth, keyField, arrayKeys)
    }

    // Fallback: index-by-index comparison
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
        const children = deepDiff(left[i], right[i], fullPath, depth + 1, arrayKeys)
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

/**
 * Match array elements by a key field, then diff matched pairs.
 * - Matched pairs: deep-diff their contents
 * - In right (baseline) but not left (LLM): missing_left (LLM failed to extract)
 * - In left (LLM) but not right (baseline): missing_right (LLM Only)
 */
function diffArrayByKey(
  left: unknown[],
  right: unknown[],
  path: string,
  depth: number,
  keyField: string,
  arrayKeys?: ArrayKeyConfig
): DiffEntry[] {
  const entries: DiffEntry[] = []

  // Build map of right (baseline) elements by key
  const rightByKey = new Map<string, { index: number; value: Record<string, unknown> }>()
  for (let i = 0; i < right.length; i++) {
    if (isObject(right[i])) {
      const key = String((right[i] as Record<string, unknown>)[keyField] ?? '')
      if (key) rightByKey.set(key, { index: i, value: right[i] as Record<string, unknown> })
    }
  }

  const matchedRightKeys = new Set<string>()
  let outputIndex = 0

  // Walk left (LLM) elements, try to match each to a right (baseline) element
  for (let i = 0; i < left.length; i++) {
    const leftEl = left[i]
    if (!isObject(leftEl)) {
      // Non-object element — fallback to positional
      const fullPath = `${path}[${outputIndex}]`
      if (i < right.length) {
        if (leftEl === right[i]) {
          entries.push({ path: fullPath, key: `[${outputIndex}]`, depth: depth + 1, leftValue: leftEl, rightValue: right[i], diffType: 'match' })
        } else {
          entries.push({ path: fullPath, key: `[${outputIndex}]`, depth: depth + 1, leftValue: leftEl, rightValue: right[i], diffType: 'mismatch' })
        }
      } else {
        entries.push({ path: fullPath, key: `[${outputIndex}]`, depth: depth + 1, leftValue: leftEl, rightValue: undefined, diffType: 'missing_right' })
      }
      outputIndex++
      continue
    }

    const keyValue = String((leftEl as Record<string, unknown>)[keyField] ?? '')
    const fullPath = `${path}[${outputIndex}]`
    const displayKey = keyValue ? `[${keyField}=${keyValue}]` : `[${outputIndex}]`

    if (keyValue && rightByKey.has(keyValue)) {
      // Matched — diff the pair
      matchedRightKeys.add(keyValue)
      const rightEl = rightByKey.get(keyValue)!.value
      const children = deepDiff(leftEl, rightEl, fullPath, depth + 1, arrayKeys)
      const hasChanges = children.some(c => c.diffType !== 'match')
      entries.push({
        path: fullPath,
        key: displayKey,
        depth: depth + 1,
        leftValue: leftEl,
        rightValue: rightEl,
        diffType: hasChanges ? 'structural' : 'match',
        children,
      })
    } else {
      // In LLM but not baseline → LLM Only
      entries.push({
        path: fullPath,
        key: displayKey,
        depth: depth + 1,
        leftValue: leftEl,
        rightValue: undefined,
        diffType: 'missing_right',
        children: flattenValue(leftEl, fullPath, depth + 2, 'missing_right'),
      })
    }
    outputIndex++
  }

  // Remaining unmatched right (baseline) elements → missing_left (LLM failed to extract)
  for (const [key, { value }] of rightByKey) {
    if (!matchedRightKeys.has(key)) {
      const fullPath = `${path}[${outputIndex}]`
      const displayKey = `[${keyField}=${key}]`
      entries.push({
        path: fullPath,
        key: displayKey,
        depth: depth + 1,
        leftValue: undefined,
        rightValue: value,
        diffType: 'missing_left',
        children: flattenValue(value, fullPath, depth + 2, 'missing_left'),
      })
      outputIndex++
    }
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
  // Match rate is based on baseline fields only — LLM-only fields don't reduce match %
  const baselineFields = matched + mismatched + missingLeft + typeMismatches

  return {
    totalFields,
    matched,
    mismatched,
    missingLeft,
    missingRight,
    typeMismatches,
    matchPercentage: baselineFields > 0 ? Math.round((matched / baselineFields) * 100) : 0,
  }
}
