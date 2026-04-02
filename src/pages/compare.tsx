import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PdfUpload } from '@/components/pdf-upload'
import { AgreementPicker } from '@/components/agreement-picker'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowRightLeft, Rocket, ArrowRight, AlertCircle, FileStack,
} from 'lucide-react'
import { defaultMetadata } from '@/lib/mock-service'
import { listAgreements, createComparison } from '@/lib/api-service'
import type { MetadataConstruct, Agreement } from '@/types'

export function ComparePage() {
  const navigate = useNavigate()
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [selectedAgreementId, setSelectedAgreementId] = useState<number | null>(null)
  const [runName, setRunName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<MetadataConstruct>(defaultMetadata)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingAgreements, setLoadingAgreements] = useState(true)

  useEffect(() => {
    listAgreements()
      .then((data) => {
        setAgreements(data)
        if (data.length > 0) setSelectedAgreementId(data[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load agreements'))
      .finally(() => setLoadingAgreements(false))
  }, [])

  const handleSubmit = async () => {
    if (!selectedAgreementId || !file) return
    setSubmitting(true)
    setError(null)
    try {
      const run = await createComparison({
        agreement_id: selectedAgreementId,
        run_name: runName || undefined,
        metadata_construct: JSON.stringify(metadata),
        pdf: file,
      })
      navigate('/runs')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedAgreement = agreements.find((a) => a.id === selectedAgreementId)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">New Reconciliation</h2>
          <p className="text-sm text-muted-foreground">
            Select a baseline, upload an agreement PDF, and run LLM extraction against ground truth
          </p>
        </div>
      </div>

      {/* Agreement Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileStack className="w-4 h-4" /> Select Baseline Agreement
          </CardTitle>
          <CardDescription>
            The ground truth JSON will be reconciled against the LLM extraction result
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {agreements.length === 0 && !loadingAgreements ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No baselines available.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5"
                onClick={() => navigate('/baselines')}
              >
                <FileStack className="w-3 h-3" /> Add a Baseline
              </Button>
            </div>
          ) : (
            <AgreementPicker
              agreements={agreements}
              selectedId={selectedAgreementId}
              onSelect={setSelectedAgreementId}
              loading={loadingAgreements}
            />
          )}

          {/* Run Name */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Run Name <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="e.g. Initial extraction test"
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* PDF Upload + Reconcile Action — side by side */}
      {(() => {
        const isReady = !!selectedAgreementId && !!file && !submitting
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PdfUpload onFileSelect={setFile} selectedFile={file} />

            <Card className={`transition-all duration-500 flex flex-col ${
              isReady
                ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 border-primary/40 shadow-lg shadow-primary/10 animate-ready-glow'
                : 'bg-gradient-to-br from-primary/5 to-transparent border-primary/20'
            }`}>
              <CardHeader className="pb-2 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    isReady ? 'bg-primary/15' : 'bg-muted/50'
                  }`}>
                    <Rocket className={`w-5 h-5 transition-all duration-500 ${
                      isReady ? 'text-primary animate-bounce' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className={`text-sm transition-colors duration-300 ${isReady ? 'text-primary' : ''}`}>
                      {isReady ? 'All Set — Ready to Reconcile!' : 'Ready to Reconcile'}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {selectedAgreement
                        ? `Reconcile against "${selectedAgreement.name}"`
                        : 'Select a baseline and upload a PDF'}
                    </CardDescription>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selectedAgreementId ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {selectedAgreementId ? '✓' : '1'}
                    </div>
                    <span className={selectedAgreementId ? 'text-foreground' : 'text-muted-foreground'}>
                      Baseline selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      file ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {file ? '✓' : '2'}
                    </div>
                    <span className={file ? 'text-foreground' : 'text-muted-foreground'}>
                      PDF uploaded
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={handleSubmit}
                  disabled={!isReady}
                  size="lg"
                  className={`w-full gap-2 transition-all duration-500 ${
                    isReady ? 'animate-ready-pulse shadow-lg shadow-primary/25' : ''
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Run Reconciliation'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      })()}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  )
}
