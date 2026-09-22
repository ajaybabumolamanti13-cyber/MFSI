import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { api } from '../api/client'

export default function NewInvestigation() {
  const [caseName, setCaseName] = useState('')
  const [investigatorName, setInvestigatorName] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceSource, setEvidenceSource] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const resetForm = () => {
    setCaseName(''); setInvestigatorName(''); setDescription(''); setEvidenceSource(''); setConsent(false)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!consent) {
      setError('Authorization / consent confirmation is required before creating a case.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/api/investigations', {
        case_name: caseName,
        investigator_name: investigatorName,
        case_description: description,
        evidence_source: evidenceSource,
        consent_confirmed: consent,
      })
      setSuccess(`Investigation ${res.data.id} created.`)
      setTimeout(() => navigate('/devices'), 800)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not create investigation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="New Investigation" subtitle="Register a case and confirm authorization before importing evidence">
      <form onSubmit={onSubmit} className="max-w-2xl bg-navy-900 border border-navy-700 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Case Name</label>
          <input required value={caseName} onChange={(e) => setCaseName(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Investigator Name</label>
          <input required value={investigatorName} onChange={(e) => setInvestigatorName(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Case Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Evidence Source</label>
          <input value={evidenceSource} onChange={(e) => setEvidenceSource(e.target.value)}
            placeholder="e.g. Seized device, voluntary submission, authorized extraction"
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-300 bg-navy-800/60 border border-navy-700 rounded-md p-3">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>I confirm this investigation is authorized and that appropriate consent / legal authority exists for examining this device and its evidence.</span>
        </label>

        {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">{error}</div>}
        {success && <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-md px-3 py-2">{success}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold px-5 py-2 rounded-md">
            {loading ? 'Creating…' : 'Create Investigation'}
          </button>
          <button type="button" onClick={resetForm} className="bg-navy-800 hover:bg-navy-700 text-slate-300 px-5 py-2 rounded-md">
            Reset Form
          </button>
        </div>
      </form>
    </Layout>
  )
}
