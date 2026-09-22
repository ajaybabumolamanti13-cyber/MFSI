import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../api/client'

interface Tool {
  id: string
  name: string
  purpose: string
  integration_status: string
  availability_status: string
  supported_workflow: string
  action_label: string
}

const STATUS_COLOR: Record<string, string> = {
  'Fully integrated': 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
  'Partially integrated': 'text-amber-400 border-amber-700/50 bg-amber-900/20',
  'Import workflow only': 'text-cyan-400 border-cyan-700/50 bg-cyan-900/20',
}

export default function ForensicTools() {
  const [tools, setTools] = useState<Tool[]>([])

  useEffect(() => {
    api.get('/api/tools').then((res) => setTools(res.data))
  }, [])

  return (
    <Layout title="Forensic Tools" subtitle="Integration status for external forensic tools used by MFIS">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((t) => (
          <div key={t.id} className="bg-navy-900 border border-navy-700 rounded-lg p-5 flex flex-col">
            <div className="text-slate-100 font-semibold">{t.name}</div>
            <p className="text-xs text-slate-400 mt-1 flex-1">{t.purpose}</p>
            <div className={`text-xs border rounded-full px-2 py-0.5 w-fit mt-3 ${STATUS_COLOR[t.integration_status] || 'text-slate-400 border-slate-700 bg-slate-800'}`}>
              {t.integration_status}
            </div>
            <div className="text-xs text-slate-500 mt-2">{t.availability_status}</div>
            <div className="text-xs text-slate-500 mt-1 mb-4">{t.supported_workflow}</div>
            <button className="mt-auto bg-navy-800 hover:bg-navy-700 text-slate-200 text-sm px-3 py-1.5 rounded-md self-start">
              {t.action_label}
            </button>
          </div>
        ))}
      </div>
    </Layout>
  )
}
