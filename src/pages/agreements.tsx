import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonViewer } from '@/components/json-viewer'
import {
  FileStack, Plus, Trash2, Eye, EyeOff, Upload, X, AlertCircle, AlertTriangle,
  Search, Database, Hash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calendar, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { listAgreements, createAgreement, deleteAgreement, getAgreement } from '@/lib/api-service'
import type { Agreement, AgreementDetail } from '@/types'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<AgreementDetail | null>(null)

  // Search + pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Upload form state
  const [agreementId, setAgreementId] = useState('')
  const [name, setName] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fetchAgreements = useCallback(async () => {
    try {
      const data = await listAgreements()
      setAgreements(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agreements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgreements()
  }, [fetchAgreements])

  // Filtered + paginated
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return agreements
    const q = searchQuery.toLowerCase()
    return agreements.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.agreement_id.toLowerCase().includes(q)
    )
  }, [agreements, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedAgreements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  // Reset page when search or page size changes
  useEffect(() => { setCurrentPage(1) }, [searchQuery, pageSize])

  // Stats
  const totalFields = agreements.reduce((sum, a) => sum + a.field_count, 0)

  const handleUpload = async () => {
    setUploadError(null)
    if (!agreementId.trim() || !name.trim() || !jsonText.trim()) {
      setUploadError('All fields are required')
      return
    }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setUploadError('Invalid JSON')
      return
    }
    setUploading(true)
    try {
      await createAgreement({ agreement_id: agreementId.trim(), name: name.trim(), json_data: parsed })
      setShowUpload(false)
      setAgreementId('')
      setName('')
      setJsonText('')
      await fetchAgreements()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Agreement | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAgreement(deleteTarget.id)
      if (expandedId === deleteTarget.id) {
        setExpandedId(null)
        setExpandedDetail(null)
      }
      setDeleteTarget(null)
      await fetchAgreements()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    try {
      const detail = await getAgreement(id)
      setExpandedDetail(detail)
      setExpandedId(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agreement')
    }
  }

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        setJsonText(text)
        if (!name) setName(file.name.replace(/\.json$/i, ''))
      }
    }
    reader.readAsText(file)
  }

  // Page numbers helper
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileStack className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Agreement Baselines</h2>
          <p className="text-sm text-muted-foreground">
            Manage ground truth data for agreement reconciliation
          </p>
        </div>
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showUpload ? 'Cancel' : 'Add Baseline'}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" /> New Baseline
            </CardTitle>
            <CardDescription>
              Upload a JSON file or paste ground truth data for an agreement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Agreement ID
                </label>
                <input
                  type="text"
                  value={agreementId}
                  onChange={(e) => setAgreementId(e.target.value)}
                  placeholder="e.g. AGR-2024-00847"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FNB TechServe SLA 2024"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">
                  JSON Data
                </label>
                <label className="text-xs text-primary cursor-pointer hover:underline">
                  <input type="file" accept=".json" className="hidden" onChange={handleJsonFile} />
                  Import from file
                </label>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{ "agreement": { ... } }'
                rows={8}
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" /> {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={uploading} className="gap-1.5">
                <Upload className="w-3 h-3" />
                {uploading ? 'Uploading...' : 'Save Baseline'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-sm text-muted-foreground py-12">
          Loading baselines...
        </div>
      )}

      {/* Empty state */}
      {!loading && agreements.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileStack className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No baselines uploaded yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add ground truth agreement data to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content area: stats + search + table */}
      {!loading && agreements.length > 0 && (
        <>
          {/* Summary stat chips */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
              <Database className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{agreements.length}</span>
              <span className="text-xs text-primary/70">Baselines</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/50">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">{totalFields.toLocaleString()}</span>
              <span className="text-xs text-emerald-600/70">Total Fields</span>
            </div>

            {/* Search */}
            <div className="ml-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-64 rounded-lg border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Agreement
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      ID
                    </th>
                    <th className="text-center px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Fields
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAgreements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                        <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        No baselines match &ldquo;{searchQuery}&rdquo;
                      </td>
                    </tr>
                  )}
                  {paginatedAgreements.map((agr) => (
                    <Fragment key={agr.id}>
                      <tr
                        className={cn(
                          'border-b transition-colors group',
                          expandedId === agr.id
                            ? 'bg-primary/[0.03] border-b-0'
                            : 'hover:bg-muted/30',
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                              'bg-gradient-to-br from-primary/15 to-primary/5 text-primary',
                            )}>
                              {agr.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[280px]">
                              {agr.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                            {agr.agreement_id}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            {agr.field_count}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(agr.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'h-8 gap-1.5 text-xs',
                                expandedId === agr.id
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                              onClick={() => handleToggleExpand(agr.id)}
                            >
                              {expandedId === agr.id
                                ? <><EyeOff className="w-3.5 h-3.5" /> Hide</>
                                : <><Eye className="w-3.5 h-3.5" /> View</>
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(agr)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline expanded JSON — directly below the row */}
                      {expandedId === agr.id && expandedDetail && (
                        <tr className="border-b">
                          <td colSpan={5} className="p-0">
                            <div className="bg-muted/20 animate-fade-in">
                              <div className="px-5 py-2.5 flex items-center justify-between bg-muted/30 border-y">
                                <div className="flex items-center gap-2">
                                  <Eye className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-xs font-semibold text-foreground">
                                    JSON Data
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {expandedDetail.field_count} fields
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1 text-muted-foreground"
                                  onClick={() => { setExpandedId(null); setExpandedDetail(null) }}
                                >
                                  <X className="w-3 h-3" /> Close
                                </Button>
                              </div>
                              <div className="p-5 max-h-[400px] overflow-auto">
                                <JsonViewer data={expandedDetail.json_data} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer — always shown */}
            <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
                <div className="text-xs text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filtered.length)}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} baseline{filtered.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    <ChevronsLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>

                  {getPageNumbers().map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          'h-7 w-7 rounded-md text-xs font-medium transition-colors',
                          p === currentPage
                            ? 'bg-primary text-white'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    <ChevronsRight className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-md border px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
          </Card>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog.Root open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold text-foreground">
                    Delete Baseline
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground mt-1">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-foreground">{deleteTarget?.name}</span>
                    {deleteTarget?.agreement_id && (
                      <> (<span className="font-mono text-xs">{deleteTarget.agreement_id}</span>)</>
                    )}
                    ? This action cannot be undone.
                  </Dialog.Description>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </Dialog.Close>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <Trash2 className="w-3 h-3" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
