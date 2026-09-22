import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-[1600px]">
        <header className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  )
}
