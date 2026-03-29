import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { SystemOnePage } from '@/pages/system-one'
import { SystemTwoPage } from '@/pages/system-two'
import { ComparisonPage } from '@/pages/comparison'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, GitCompareArrows } from 'lucide-react'
import type { ExtractionResult } from '@/types'

function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [systemOneResult, setSystemOneResult] = useState<ExtractionResult | null>(null)
  const [systemTwoResult, setSystemTwoResult] = useState<ExtractionResult | null>(null)

  const canProceed = () => {
    if (currentStep === 1) return systemOneResult !== null
    if (currentStep === 2) return systemTwoResult !== null
    return false
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentStep={currentStep} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentStep === 1 && (
          <SystemOnePage
            onComplete={(data) => setSystemOneResult(data)}
            result={systemOneResult}
          />
        )}

        {currentStep === 2 && (
          <SystemTwoPage
            onComplete={(data) => setSystemTwoResult(data)}
            result={systemTwoResult}
          />
        )}

        {currentStep === 3 && systemOneResult && systemTwoResult && (
          <ComparisonPage
            systemOneData={systemOneResult}
            systemTwoData={systemTwoResult}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map(step => (
              <button
                key={step}
                onClick={() => {
                  if (step <= currentStep || (step === 2 && systemOneResult) || (step === 3 && systemOneResult && systemTwoResult)) {
                    setCurrentStep(step)
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  step === currentStep ? 'bg-primary scale-125' :
                  step < currentStep ? 'bg-primary/40' : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" disabled>
              <GitCompareArrows className="w-4 h-4" /> Analysis Complete
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
