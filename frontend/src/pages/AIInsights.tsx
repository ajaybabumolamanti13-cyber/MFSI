import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import PriorityBadge from '../components/PriorityBadge'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface Finding {
  id: string
  category: string
  related_artifact_type: string
  timestamp: string
  reason: string
  priority: string
  source_reference: string
  review_status: string
  engine: string
}

export default function AIInsights() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [findings, setFindings] = useState<Finding[]>([])
  const [priorityFilter, setPriorityFilter] = useState('')
  const [running, setRunning] = useState(false)

  const load = () => {
    if (!selected) return
    api.get('/api/ai/findings', { params: { investigation_id: selected, priority: priorityFilter || undefined } })
      .then((res) => setFindings(res.data)).catch(() => setFindings([]))
  }

  useEffect(load, [selected, priorityFilter])

  const runAnalysis = async () => {
    if (!selected) return
    setRunning(true)
    try {
      await api.post(`/api/ai/run/${selected}`)
      load()
    } finally {
      setRunning(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/api/ai/findings/${id}/review`, { review_status: status })
    load()
  }

  return (
    <Layout title="AI Insights & Anomaly Detection" subtitle="Rule-based analysis engine — every finding requires investigator review">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="bg-amber-950/30 border border-amber-800/40 text-amber-300 text-sm rounded-lg px-4 py-3 mb-6">
        Findings below are produced by a deterministic <strong>rule-based</strong> analysis engine (not a trained
        machine-learning model). They are leads for investigation, not confirmed forensic conclusions.
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={runAnalysis} disabled={running || !selected}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold px-4 py-2 rounded-md text-sm">
          {running ? 'Running analysis…' : 'Run AI Analysis'}
        </button>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <DataTable<Finding>
        rowKey={(f) => f.id}
        emptyLabel="No AI findings yet. Import evidence, then click 'Run AI Analysis'."
        rows={findings}
        columns={[
          { header: 'Priority', render: (f) => <PriorityBadge priority={f.priority} /> },
          { header: 'Category', render: (f) => f.category },
          { header: 'Reason', render: (f) => f.reason, className: 'max-w-md' },
          { header: 'Timestamp', render: (f) => new Date(f.timestamp).toLocaleString() },
          { header: 'Source', render: (f) => f.source_reference },
          { header: 'Engine', render: (f) => f.engine },
          {
            header: 'Review Status', render: (f) => (
              <select value={f.review_status} onChange={(e) => updateStatus(f.id, e.target.value)}
                className="bg-navy-800 border border-navy-700 rounded-md px-2 py-1 text-xs text-white">
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            ),
          },
        ]}
      />
    </Layout>
  )
}
