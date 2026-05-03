import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { useState } from 'react'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
