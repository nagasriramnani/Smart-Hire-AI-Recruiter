'use client'

import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-secondary">
      <Header />
      <Sidebar />
      <main className="pl-64 pt-16">
        <div className="p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  )
}

