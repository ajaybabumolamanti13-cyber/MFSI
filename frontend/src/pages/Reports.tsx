import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface ReportItem {
  id: string
  investigation_id: string
  generated_at: string
  generated_by: string
  summary: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Reports() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [reports, setReports] = useState<ReportItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const load = () => {
    if (!selected) return
    api.get('/api/reports', { params: { investigation_id: selected } }).then((res) => setReports(res.data)).catch(() => setReports([]))
  }

  useEffect(load, [selected])

  const generate = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      await api.post(`/api/reports/generate/${selected}`)
      load()
    } finally {
      setGenerating(false)
    }
  }

  const token = localStorage.getItem('mfis_token')

  return (
    <Layout title="Forensic Reports" subtitle="Generate, preview, and download investigation reports">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <button onClick={generate} disabled={generating || !selected}
        className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold px-5 py-2 rounded-md text-sm mb-6">
        {generating ? 'Generating report…' : 'Generate Forensic Report'}
      </button>

      <DataTable<ReportItem>
        rowKey={(r) => r.id}
        emptyLabel="No reports generated for this case yet."
        rows={reports}
        columns={[
          { header: 'Report ID', render: (r) => r.id },
          { header: 'Generated', render: (r) => new Date(r.generated_at).toLocaleString() },
          { header: 'By', render: (r) => r.generated_by },
          { header: 'Summary', render: (r) => r.summary },
          {
            header: 'Actions', render: (r) => (
              <div className="flex gap-3">
                <button
                  className="text-cyan-400 hover:text-cyan-300 text-xs underline"
                  onClick={() => setPreviewUrl(`${API_BASE}/api/reports/${r.id}/html`)}
                >
                  Preview
                </button>
                <a
                  className="text-cyan-400 hover:text-cyan-300 text-xs underline"
                  href={`${API_BASE}/api/reports/${r.id}/pdf`}
                  target="_blank" rel="noreferrer"
                  onClick={(e) => {
                    // Fetch with auth header then open as blob, since <a> can't send bearer tokens.
                    e.preventDefault()
                    fetch(`${API_BASE}/api/reports/${r.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
                      .then((res) => res.blob())
                      .then((blob) => {
                        const url = window.URL.createObjectURL(blob)
                        window.open(url, '_blank')
                      })
                  }}
                >
                  Download PDF
                </a>
              </div>
            ),
          },
        ]}
      />

      {previewUrl && (
        <div className="mt-6 bg-navy-900 border border-navy-700 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 border-b border-navy-700">
            <span className="text-sm text-slate-300">Report Preview</span>
            <button onClick={() => setPreviewUrl(null)} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <ReportFrame url={previewUrl} token={token} />
        </div>
      )}
    </Layout>
  )
}

function ReportFrame({ url, token }: { url: string; token: string | null }) {
  const [html, setHtml] = useState<string>('')
  useEffect(() => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.text()).then(setHtml)
  }, [url])
  return <iframe title="report-preview" srcDoc={html} className="w-full h-[600px] bg-white" />
}
