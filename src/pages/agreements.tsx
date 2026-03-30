import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JsonViewer } from '@/components/json-viewer'
import {
  FileStack, Plus, Trash2, Eye, EyeOff, Upload, X, AlertCircle,
} from 'lucide-react'
import { listAgreements, createAgreement, deleteAgreement, getAgreement } from '@/lib/api-service'
import type { Agreement, AgreementDetail } from '@/types'

export function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [expandedDetail, setExpandedDetail] = useState<AgreementDetail | null>(null)

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

  const handleDelete = async (id: number) => {
    try {
      await deleteAgreement(id)
      if (expandedId === id) {
        setExpandedId(null)
        setExpandedDetail(null)
      }
      await fetchAgreements()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
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
        // Auto-fill name from filename if empty
        if (!name) setName(file.name.replace(/\.json$/i, ''))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileStack className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Agreement Store</h2>
          <p className="text-sm text-muted-foreground">
            Upload and manage ground truth agreement JSONs
          </p>
        </div>
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showUpload ? 'Cancel' : 'Upload Agreement'}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" /> New Agreement
            </CardTitle>
            <CardDescription>
              Upload a JSON file or paste JSON data as ground truth
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
                {uploading ? 'Uploading...' : 'Upload Agreement'}
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
          Loading agreements...
        </div>
      )}

      {/* Empty state */}
      {!loading && agreements.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileStack className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No agreements uploaded yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Upload a ground truth JSON to get started
            </p>
          </CardContent>
        </Card>
      )}

      {/* Agreement List */}
      {agreements.map((agr) => (
        <Card key={agr.id} className="transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileStack className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{agr.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{agr.agreement_id}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{agr.field_count} fields</span>
                  <span>Uploaded {new Date(agr.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleExpand(agr.id)}
                >
                  {expandedId === agr.id
                    ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                    : <Eye className="w-4 h-4 text-muted-foreground" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(agr.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Expanded JSON view */}
            {expandedId === agr.id && expandedDetail && (
              <div className="mt-4 pt-4 border-t">
                <JsonViewer data={expandedDetail.json_data} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
