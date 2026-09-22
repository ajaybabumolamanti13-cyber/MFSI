import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface CallLog {
  id: string
  contact: string
  direction: string
  call_datetime: string
  duration_seconds: number
  source_artifact: string
}

export default function CallLogAnalysis() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [calls, setCalls] = useState<CallLog[]>([])
  const [frequent, setFrequent] = useState<{ contact: string; count: number }[]>([])
  const [contact, setContact] = useState('')

  const load = () => {
    if (!selected) return
    api.get('/api/calls', { params: { investigation_id: selected, contact: contact || undefined } }).then((res) => setCalls(res.data))
    api.get('/api/calls/frequent-contacts', { params: { investigation_id: selected } }).then((res) => setFrequent(res.data))
  }

  useEffect(load, [selected])

  return (
    <Layout title="Call Log Analysis" subtitle="Review imported call records and frequent-contact patterns">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap gap-3 mb-4">
            <input placeholder="Filter by contact…" value={contact} onChange={(e) => setContact(e.target.value)}
              className="bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 min-w-[220px]" />
            <button onClick={load} className="bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold px-4 py-2 rounded-md text-sm">
              Search
            </button>
          </div>
          <DataTable<CallLog>
            rowKey={(c) => c.id}
            emptyLabel="No call log records imported for this case yet."
            rows={calls}
            columns={[
              { header: 'Date/Time', render: (c) => new Date(c.call_datetime).toLocaleString() },
              { header: 'Contact', render: (c) => c.contact },
              { header: 'Direction', render: (c) => c.direction },
              { header: 'Duration', render: (c) => `${c.duration_seconds}s` },
              { header: 'Source', render: (c) => c.source_artifact },
            ]}
          />
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 h-fit">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Frequent Contacts</h2>
          <ul className="space-y-2 text-sm">
            {frequent.length === 0 && <li className="text-slate-500 italic">No data yet.</li>}
            {frequent.map((f) => (
              <li key={f.contact} className="flex justify-between">
                <span>{f.contact}</span>
                <span className="text-cyan-400">{f.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  )
}
