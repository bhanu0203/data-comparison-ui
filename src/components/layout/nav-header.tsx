import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Scale, FileStack, ArrowRightLeft, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/baselines', label: 'Baselines', icon: FileStack },
  { to: '/reconcile', label: 'Reconcile', icon: ArrowRightLeft },
  { to: '/runs', label: 'Extraction Runs', icon: LayoutDashboard },
]

export function NavHeader() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AgreementIQ</h1>
              <p className="text-xs text-muted-foreground">Agreement Extraction & Reconciliation</p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
              return (
                <button
                  key={item.to}
                  onClick={() => {
                    if (location.pathname === item.to || location.pathname.startsWith(item.to + '/')) {
                      // Force re-navigation by pushing with fresh state
                      navigate(item.to, { state: { refreshKey: Date.now() } })
                    } else {
                      navigate(item.to)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
