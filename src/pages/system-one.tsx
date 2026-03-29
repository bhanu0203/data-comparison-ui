import { useState } from 'react'
import { PdfUpload } from '@/components/pdf-upload'
import { MetadataEditor } from '@/components/metadata-editor'
import { ProcessingAnimation } from '@/components/processing-animation'
import { JsonViewer } from '@/components/json-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { defaultMetadata, extractFromPdf, createSamplePdf } from '@/lib/mock-service'
import { Rocket, RotateCcw, ArrowRight, FileText, CheckCircle2, FlaskConical, Eye, EyeOff } from 'lucide-react'
import type { MetadataConstruct, ExtractionResult } from '@/types'

interface SystemOneProps {
  onComplete: (data: ExtractionResult) => void
  result: ExtractionResult | null
}

export function SystemOnePage({ onComplete, result }: SystemOneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<MetadataConstruct>(defaultMetadata)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [showInputSummary, setShowInputSummary] = useState(true)

  const handleExtract = async () => {
    if (!file) return
    setIsProcessing(true)
    setProcessingStep(0)

    const stepTimings = [800, 1200, 1000]
    for (let i = 0; i < stepTimings.length; i++) {
      await new Promise(r => setTimeout(r, stepTimings[i]))
      setProcessingStep(i + 1)
    }

    const data = await extractFromPdf(file, metadata)
    setIsProcessing(false)
    onComplete(data)
  }

  const handleReset = () => {
    setFile(null)
    setIsProcessing(false)
    setProcessingStep(0)
  }

  const handleLoadTestData = () => {
    setFile(createSamplePdf())
    setMetadata(defaultMetadata)
  }

  if (result) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">System 1 — Extraction Complete</h2>
            <p className="text-sm text-muted-foreground">Data extracted from PDF via LLM</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={handleReset}>
            <RotateCcw className="w-3 h-3" /> Re-extract
          </Button>
        </div>

        {/* Input summary */}
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                Input Summary
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {file?.name}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {metadata.fields.length} fields in schema
                </Badge>
              </CardTitle>
              <button
                onClick={() => setShowInputSummary(!showInputSummary)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showInputSummary ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </CardHeader>
          {showInputSummary && (
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">PDF Document</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File</span>
                      <span className="font-mono font-medium">{file?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-mono">{file ? (file.size / 1024).toFixed(1) + ' KB' : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-mono">application/pdf</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Metadata Schema</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schema</span>
                      <span className="font-mono font-medium">{metadata.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-mono">{metadata.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fields</span>
                      <span className="font-mono">{metadata.fields.length} defined</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg border bg-white p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Extraction Fields</p>
                <div className="flex flex-wrap gap-1.5">
                  {metadata.fields.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs">
                      <span className="font-medium text-foreground">{f.fieldName}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{f.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <JsonViewer data={result} />
      </div>
    )
  }

  if (isProcessing) {
    return (
      <Card className="animate-slide-up">
        <CardContent className="p-0">
          <ProcessingAnimation
            systemName="System 1 — LLM Extraction"
            steps={[
              'Parsing PDF document...',
              'Applying metadata schema to LLM...',
              'Extracting structured data...',
            ]}
            currentStep={processingStep}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">System 1 — PDF Extraction</h2>
          <p className="text-sm text-muted-foreground">Upload a PDF and define extraction metadata</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadTestData}
          className="ml-auto gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <FlaskConical className="w-3 h-3" />
          Load All Test Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PdfUpload onFileSelect={setFile} selectedFile={file} />
        <MetadataEditor metadata={metadata} onChange={setMetadata} />
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ready to Extract?</CardTitle>
          <CardDescription>
            The PDF and metadata will be sent to the LLM for structured data extraction.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button
            onClick={handleExtract}
            disabled={!file}
            size="lg"
            className="gap-2"
          >
            <Rocket className="w-4 h-4" />
            Extract Data
            <ArrowRight className="w-4 h-4" />
          </Button>
          {!file && (
            <span className="text-sm text-muted-foreground">Upload a PDF to continue</span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
