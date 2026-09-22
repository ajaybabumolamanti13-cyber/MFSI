import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface Message {
  id: string
  sender: string
  receiver: string
  content: string
  timestamp: string
  message_type: string
  source_artifact: string
  flagged_keyword: string
}

export default function MessagesAnalysis() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [contact, setContact] = useState('')

  const load = () => {
    if (!selected) return
    api.get('/api/messages', { params: { investigation_id: selected, q: search || undefined, contact: contact || undefined } })
      .then((res) => setMessages(res.data))
  }

  useEffect(load, [selected])

  return (
    <Layout title="Messages Analysis" subtitle="Search and review imported SMS / messaging artifacts">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="flex flex-wrap gap-3 mb-4">
        <input placeholder="Search message content…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 flex-1 min-w-[220px]" />
        <input placeholder="Filter by contact…" value={contact} onChange={(e) => setContact(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 min-w-[220px]" />
        <button onClick={load} className="bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold px-4 py-2 rounded-md text-sm">
          Search
        </button>
      </div>

      <DataTable<Message>
        rowKey={(m) => m.id}
        emptyLabel="No messages imported for this case yet."
        rows={messages}
        columns={[
          { header: 'Timestamp', render: (m) => new Date(m.timestamp).toLocaleString() },
          { header: 'Sender', render: (m) => m.sender },
          { header: 'Receiver', render: (m) => m.receiver },
          { header: 'Content', render: (m) => <span className={m.content?.toLowerCase().match(/wire transfer|untraceable|burner|delete this|cash only|no questions/) ? 'text-amber-300' : ''}>{m.content}</span> },
          { header: 'Type', render: (m) => m.message_type },
          { header: 'Source', render: (m) => m.source_artifact },
        ]}
      />
    </Layout>
  )
}
