import { useState } from 'react'
import { PdfUpload } from '@/components/pdf-upload'
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
            <h2 className="text-xl font-bold text-foreground">LLM Extraction Complete</h2>
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
            systemName="LLM Extraction"
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
          <h2 className="text-xl font-bold text-foreground">LLM Extraction</h2>
          <p className="text-sm text-muted-foreground">Upload a PDF for LLM extraction</p>
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

        <Card className={`transition-all duration-500 flex flex-col ${
          file
            ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 border-primary/40 shadow-lg shadow-primary/10 animate-ready-glow'
            : 'bg-gradient-to-br from-primary/5 to-transparent border-primary/20'
        }`}>
          <CardHeader className="pb-2 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                file ? 'bg-primary/15' : 'bg-muted/50'
              }`}>
                <Rocket className={`w-5 h-5 transition-all duration-500 ${
                  file ? 'text-primary animate-bounce' : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <CardTitle className={`text-sm transition-colors duration-300 ${file ? 'text-primary' : ''}`}>
                  {file ? 'All Set — Ready to Reconcile!' : 'Ready to Reconcile'}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Extract structured data from PDF via LLM
                </CardDescription>
              </div>
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  file ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                  {file ? '✓' : '1'}
                </div>
                <span className={file ? 'text-foreground' : 'text-muted-foreground'}>
                  PDF uploaded
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={handleExtract}
              disabled={!file}
              size="lg"
              className={`w-full gap-2 transition-all duration-500 ${
                file ? 'animate-ready-pulse shadow-lg shadow-primary/25' : ''
              }`}
            >
              <Rocket className="w-4 h-4" />
              Reconcile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
