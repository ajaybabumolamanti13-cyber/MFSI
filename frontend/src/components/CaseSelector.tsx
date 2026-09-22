import { useEffect, useState } from 'react'
import { api } from '../api/client'

export interface CaseOption {
  id: string
  case_name: string
  status: string
}

export function useCaseSelector() {
  const [cases, setCases] = useState<CaseOption[]>([])
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    api.get('/api/investigations').then((res) => {
      setCases(res.data)
      if (res.data.length > 0) setSelected(res.data[0].id)
    })
  }, [])

  return { cases, selected, setSelected }
}

export default function CaseSelector({ cases, selected, onChange }: { cases: CaseOption[]; selected: string; onChange: (id: string) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">Investigation / Case</label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 min-w-[320px]"
      >
        {cases.length === 0 && <option value="">No investigations yet</option>}
        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.case_name} ({c.id}) — {c.status}
          </option>
        ))}
      </select>
    </div>
  )
}
