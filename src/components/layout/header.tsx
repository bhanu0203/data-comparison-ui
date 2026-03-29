import { GitCompareArrows } from 'lucide-react'

interface HeaderProps {
  currentStep: number
}

const steps = [
  { label: 'System 1: PDF Extraction', num: 1 },
  { label: 'System 2: Direct Extraction', num: 2 },
  { label: 'Comparison & Analysis', num: 3 },
]

export function Header({ currentStep }: HeaderProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GitCompareArrows className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">DataDiff Pro</h1>
              <p className="text-xs text-muted-foreground">Multi-System Comparison Engine</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: currentStep >= step.num ? 'var(--color-primary)' : 'transparent',
                    color: currentStep >= step.num ? 'white' : 'var(--color-muted-foreground)',
                  }}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${currentStep >= step.num ? 'bg-white/20' : 'bg-muted'}`}>
                    {currentStep > step.num ? '\u2713' : step.num}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-8 h-px mx-1 transition-colors duration-300 ${
                    currentStep > step.num ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
