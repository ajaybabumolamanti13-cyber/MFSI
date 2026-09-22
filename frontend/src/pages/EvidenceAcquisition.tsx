import { useEffect, useState, FormEvent } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface Evidence {
  id: string
  filename: string
  evidence_type: string
  file_size_bytes: number
  sha256_hash: string
  acquisition_status: string
  processing_status: string
  is_demo_data: boolean
  uploaded_at: string
}

const ACQUISITION_OPTIONS = [
  { id: 'file', label: 'Upload Evidence File', desc: 'CSV, JSON, SQLite (.db/.sqlite), TXT/XML, forensic image (.zip), or Cellebrite UFDR export' },
  { id: 'adb', label: 'Connect via ADB', desc: 'Requires ADB installed and an authorized, connected Android device — see Forensic Tools' },
  { id: 'cellebrite', label: 'Import Cellebrite Export', desc: 'Requires a licensed Cellebrite Academic export file' },
  { id: 'autopsy', label: 'Import Autopsy Output', desc: 'Import structured output produced by Autopsy' },
]

export default function EvidenceAcquisition() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [sourceDevice, setSourceDevice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadEvidence = () => {
    if (!selected) return
    api.get('/api/evidence', { params: { investigation_id: selected } }).then((res) => setEvidence(res.data))
  }

  useEffect(loadEvidence, [selected])

  const onUpload = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setNotice('')
    if (!selected) { setError('Select or create an investigation first.'); return }
    if (!file) { setError('Choose a file to upload.'); return }

    const formData = new FormData()
    formData.append('investigation_id', selected)
    formData.append('source_device', sourceDevice)
    formData.append('file', file)

    setUploading(true)
    setProgress(0)
    try {
      await api.post('/api/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100))
        },
      })
      setNotice('Evidence uploaded and hashed successfully.')
      setFile(null)
      loadEvidence()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Layout title="Evidence Acquisition" subtitle="Import forensic evidence for the selected investigation">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {ACQUISITION_OPTIONS.map((opt) => (
          <div key={opt.id} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
            <div className="text-slate-200 text-sm font-semibold">{opt.label}</div>
            <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
          </div>
        ))}
      </div>

      <form onSubmit={onUpload} className="bg-navy-900 border border-navy-700 rounded-lg p-5 space-y-3 max-w-xl mb-8">
        <h2 className="text-sm font-semibold text-slate-300">Upload Evidence File</h2>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Source Device (optional label)</label>
          <input value={sourceDevice} onChange={(e) => setSourceDevice(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Evidence File</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-cyan-500 file:text-navy-950 file:font-semibold" />
        </div>
        {uploading && (
          <div className="w-full bg-navy-800 rounded-full h-2">
            <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">{error}</div>}
        {notice && <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-md px-3 py-2">{notice}</div>}
        <button type="submit" disabled={uploading} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold px-4 py-2 rounded-md text-sm">
          {uploading ? `Uploading… ${progress}%` : 'Upload Evidence'}
        </button>
      </form>

      <h2 className="text-sm font-semibold text-slate-300 mb-3">Evidence Inventory</h2>
      <DataTable<Evidence>
        rowKey={(e) => e.id}
        emptyLabel="No evidence files imported for this case yet."
        rows={evidence}
        columns={[
          { header: 'Filename', render: (e) => e.filename },
          { header: 'Type', render: (e) => e.evidence_type },
          { header: 'Size', render: (e) => `${(e.file_size_bytes / 1024).toFixed(1)} KB` },
          { header: 'SHA-256', render: (e) => <span className="font-mono text-xs break-all">{e.sha256_hash.slice(0, 16)}…</span> },
          { header: 'Status', render: (e) => e.acquisition_status },
          { header: 'Data Type', render: (e) => e.is_demo_data ? <span className="text-amber-400">DEMO</span> : 'Imported' },
        ]}
      />
    </Layout>
  )
}
