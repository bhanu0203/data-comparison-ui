import { useState } from 'react'
import { ProcessingAnimation } from '@/components/processing-animation'
import { JsonViewer } from '@/components/json-viewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { extractFromSystemTwo, systemTwoSampleInput } from '@/lib/mock-service'
import { Database, Zap, RotateCcw, CheckCircle2, Eye, EyeOff, Globe, Key, Send, Settings2, ChevronDown, ChevronRight } from 'lucide-react'
import type { ExtractionResult } from '@/types'

interface SystemTwoProps {
  onComplete: (data: ExtractionResult) => void
  result: ExtractionResult | null
}

export function SystemTwoPage({ onComplete, result }: SystemTwoProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [showInputParams, setShowInputParams] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    headers: false,
    queryParams: true,
    requestBody: true,
  })

  const input = systemTwoSampleInput

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleExtract = async () => {
    setIsProcessing(true)
    setProcessingStep(0)

    const stepTimings = [600, 800, 1000]
    for (let i = 0; i < stepTimings.length; i++) {
      await new Promise(r => setTimeout(r, stepTimings[i]))
      setProcessingStep(i + 1)
    }

    const data = await extractFromSystemTwo(input)
    setIsProcessing(false)
    onComplete(data)
  }

  if (result) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">System 2 — Extraction Complete</h2>
            <p className="text-sm text-muted-foreground">Data retrieved from direct system API</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() => { setIsProcessing(false); setProcessingStep(0) }}
          >
            <RotateCcw className="w-3 h-3" /> Re-extract
          </Button>
        </div>

        {/* Input summary */}
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                Request Summary
                <Badge variant="default" className="text-[10px] font-mono">{input.method}</Badge>
                <Badge variant="secondary" className="text-[10px] font-mono">{input.endpoint}</Badge>
              </CardTitle>
              <button
                onClick={() => setShowInputParams(!showInputParams)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showInputParams ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </CardHeader>
          {showInputParams && (
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* Query Parameters */}
              <div className="rounded-lg border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors"
                  onClick={() => toggleSection('queryParams')}
                >
                  {expandedSections.queryParams ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Globe className="w-3 h-3" />
                  Query Parameters
                  <Badge variant="secondary" className="text-[10px] ml-auto">{Object.keys(input.queryParams).length}</Badge>
                </button>
                {expandedSections.queryParams && (
                  <div className="px-3 pb-3 space-y-1">
                    {Object.entries(input.queryParams).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 text-xs font-mono py-0.5">
                        <span className="text-indigo-600 font-medium min-w-[140px]">{key}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="text-emerald-600">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Headers */}
              <div className="rounded-lg border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors"
                  onClick={() => toggleSection('headers')}
                >
                  {expandedSections.headers ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Key className="w-3 h-3" />
                  Request Headers
                  <Badge variant="secondary" className="text-[10px] ml-auto">{Object.keys(input.headers).length}</Badge>
                </button>
                {expandedSections.headers && (
                  <div className="px-3 pb-3 space-y-1">
                    {Object.entries(input.headers).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-2 text-xs font-mono py-0.5">
                        <span className="text-indigo-600 font-medium min-w-[140px] flex-shrink-0">{key}</span>
                        <span className="text-muted-foreground flex-shrink-0">:</span>
                        <span className="text-foreground/70 truncate">{
                          key === 'Authorization' ? val.slice(0, 20) + '...[redacted]' : val
                        }</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Request Body */}
              <div className="rounded-lg border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/30 transition-colors"
                  onClick={() => toggleSection('requestBody')}
                >
                  {expandedSections.requestBody ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Send className="w-3 h-3" />
                  Request Body
                </button>
                {expandedSections.requestBody && (
                  <div className="px-3 pb-3">
                    <pre className="text-xs font-mono text-foreground/80 bg-muted/30 rounded-md p-3 overflow-auto max-h-[200px]">
                      {JSON.stringify(input.requestBody, null, 2)}
                    </pre>
                  </div>
                )}
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
            systemName="System 2 — Direct Extraction"
            badge="API"
            steps={[
              'Connecting to system API...',
              'Querying agreement data...',
              'Transforming response...',
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
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">System 2 — Direct Extraction</h2>
          <p className="text-sm text-muted-foreground">Generate JSON directly from the secondary system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: API Info Card */}
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">System 2 API</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Direct database query — no PDF required
                </p>
              </div>
              <div className="space-y-2 text-left">
                {[
                  { label: 'Endpoint', value: input.endpoint, icon: Globe },
                  { label: 'Method', value: input.method, icon: Send },
                  { label: 'Format', value: 'JSON', icon: Settings2 },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-2 bg-white/70 rounded-lg p-2.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-mono font-medium text-foreground truncate">{item.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button onClick={handleExtract} size="lg" className="w-full gap-2 shadow-lg">
                <Zap className="w-4 h-4" />
                Run Extraction
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: Input Parameters */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Request Configuration
            </CardTitle>
            <CardDescription>Parameters that will be sent to the System 2 API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Query Parameters */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Query Parameters
              </p>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                {Object.entries(input.queryParams).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-600 font-medium min-w-[130px]">{key}</span>
                    <span className="text-xs text-muted-foreground">=</span>
                    <input
                      type="text"
                      readOnly
                      value={val}
                      className="flex-1 text-xs font-mono px-2 py-1 rounded border bg-white text-foreground"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Send className="w-3 h-3" /> Request Body
              </p>
              <div className="rounded-lg border bg-muted/20 overflow-hidden">
                <pre className="text-xs font-mono text-foreground/80 p-4 overflow-auto max-h-[300px]">
                  {JSON.stringify(input.requestBody, null, 2)}
                </pre>
              </div>
            </div>

            {/* Headers */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Key className="w-3 h-3" /> Headers
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(input.headers).map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs">
                    <span className="font-mono font-medium text-foreground">{key}</span>
                    <span className="text-muted-foreground font-mono truncate max-w-[120px]">
                      {key === 'Authorization' ? 'Bearer ...****' : val}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
