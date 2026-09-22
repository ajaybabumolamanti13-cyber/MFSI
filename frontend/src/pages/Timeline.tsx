import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import PriorityBadge from '../components/PriorityBadge'
import { api } from '../api/client'

interface TimelineEntry {
  timestamp: string
  category: string
  title: string
  detail: string
  priority?: string
  source_id: string
}

const CATEGORY_ICON: Record<string, string> = {
  message: '💬', call: '📞', location: '📍', app: '🌐', ai_finding: '🧠',
}

export default function Timeline() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [category, setCategory] = useState('')

  const load = () => {
    if (!selected) return
    api.get('/api/timeline', { params: { investigation_id: selected, category: category || undefined } })
      .then((res) => setEntries(res.data))
  }

  useEffect(load, [selected, category])

  return (
    <Layout title="Evidence Timeline" subtitle="Chronological, cross-artifact view of all imported evidence">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="flex gap-3 mb-6">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
          <option value="">All Categories</option>
          <option value="message">Messages</option>
          <option value="call">Calls</option>
          <option value="location">Location</option>
          <option value="app">Application</option>
          <option value="ai_finding">AI Findings</option>
        </select>
      </div>

      <div className="relative border-l border-navy-700 pl-6 space-y-4">
        {entries.length === 0 && <div className="text-slate-500 italic">No timeline entries for this case yet.</div>}
        {entries.map((e, i) => (
          <div key={`${e.source_id}-${i}`} className="relative">
            <span className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-navy-950" />
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-200">
                  <span className="mr-2">{CATEGORY_ICON[e.category] || '•'}</span>
                  {e.title}
                </div>
                {e.priority && <PriorityBadge priority={e.priority} />}
              </div>
              <div className="text-xs text-slate-500 mt-1">{new Date(e.timestamp).toLocaleString()}</div>
              {e.detail && <div className="text-sm text-slate-400 mt-1">{e.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
