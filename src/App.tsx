import { Routes, Route, Navigate } from 'react-router-dom'
import { NavHeader } from '@/components/layout/nav-header'
import { AgreementsPage } from '@/pages/agreements'
import { ComparePage } from '@/pages/compare'
import { RunsPage } from '@/pages/runs'
import { RunDetailPage } from '@/pages/run-detail'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/agreements" replace />} />
          <Route path="/agreements" element={<AgreementsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/runs/:id" element={<RunDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
