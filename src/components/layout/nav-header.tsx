import { NavLink } from 'react-router-dom'
import { GitCompareArrows, FileStack, ArrowRightLeft, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/agreements', label: 'Agreements', icon: FileStack },
  { to: '/compare', label: 'Compare', icon: ArrowRightLeft },
  { to: '/runs', label: 'Runs', icon: LayoutDashboard },
]

export function NavHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GitCompareArrows className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">DataDiff Pro</h1>
              <p className="text-xs text-muted-foreground">Multi-System Comparison Engine</p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
