import type {
  Agreement,
  AgreementDetail,
  ComparisonRun,
  ComparisonRunDetail,
  RunProgress,
  PaginatedResponse,
  ComparisonSearchParams,
} from '@/types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Agreements ──

export async function createAgreement(data: {
  agreement_id: string
  name: string
  json_data: Record<string, unknown>
}): Promise<Agreement> {
  return request('/agreements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function listAgreements(): Promise<Agreement[]> {
  return request('/agreements')
}

export async function getAgreement(id: number): Promise<AgreementDetail> {
  return request(`/agreements/${id}`)
}

export async function deleteAgreement(id: number): Promise<void> {
  return request(`/agreements/${id}`, { method: 'DELETE' })
}

// ── Comparison Runs ──

export async function createComparison(data: {
  agreement_id: number
  run_name?: string
  metadata_construct: string
  pdf: File
}): Promise<ComparisonRun> {
  const form = new FormData()
  form.append('agreement_id', String(data.agreement_id))
  if (data.run_name) form.append('run_name', data.run_name)
  form.append('metadata_construct', data.metadata_construct)
  form.append('pdf', data.pdf)
  return request('/comparisons', { method: 'POST', body: form })
}

export async function listComparisons(
  params?: ComparisonSearchParams
): Promise<PaginatedResponse<ComparisonRun>> {
  const sp = new URLSearchParams()
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        sp.set(key, String(val))
      }
    }
  }
  const qs = sp.toString()
  return request(`/comparisons${qs ? `?${qs}` : ''}`)
}

export async function getComparison(id: number): Promise<ComparisonRunDetail> {
  return request(`/comparisons/${id}`)
}

export async function getComparisonsBatch(runIds: number[]): Promise<ComparisonRunDetail[]> {
  return request('/comparisons/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(runIds),
  })
}

export async function getRunProgress(id: number): Promise<RunProgress> {
  return request(`/comparisons/${id}/progress`)
}

export async function rerunComparison(
  id: number,
  options?: { metadata_construct?: Record<string, unknown>; run_name?: string }
): Promise<ComparisonRun> {
  return request(`/comparisons/${id}/rerun`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: options ? JSON.stringify(options) : undefined,
  })
}

export async function deleteComparison(id: number): Promise<void> {
  return request(`/comparisons/${id}`, { method: 'DELETE' })
}
