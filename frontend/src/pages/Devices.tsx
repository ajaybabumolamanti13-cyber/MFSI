import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'

interface Device {
  id: string
  owner_reference: string
  brand: string
  model: string
  imei: string
  serial_number: string
  mac_address: string
  ip_address: string
  os_type: string
  os_version: string
  timezone: string
  notes: string
}

const emptyForm = {
  owner_reference: '', brand: '', model: '', imei: '', serial_number: '',
  model_number: '', mac_address: '', ip_address: '', os_type: 'Android',
  os_version: '', timezone: 'UTC', notes: '',
}

export default function Devices() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [devices, setDevices] = useState<Device[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDevices = () => {
    if (!selected) return
    api.get('/api/devices', { params: { investigation_id: selected } }).then((res) => setDevices(res.data))
  }

  useEffect(loadDevices, [selected])

  const onChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!selected) { setError('Select or create an investigation first.'); return }
    try {
      await api.post('/api/devices', { investigation_id: selected, ...form })
      setSuccess('Device profile saved.')
      setForm(emptyForm)
      loadDevices()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not save device')
    }
  }

  return (
    <Layout title="Device Information" subtitle="Register device metadata for the selected investigation">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={onSubmit} className="bg-navy-900 border border-navy-700 rounded-lg p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">Device Profile Form</h2>
          {[
            ['owner_reference', 'Device Owner / Case Reference'],
            ['brand', 'Device Brand'],
            ['model', 'Device Model'],
            ['imei', 'IMEI Number'],
            ['serial_number', 'Serial Number'],
            ['model_number', 'Model Number'],
            ['mac_address', 'MAC Address'],
            ['ip_address', 'IP Address'],
            ['os_version', 'OS Version'],
            ['timezone', 'Device Timezone'],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input value={(form as any)[field]} onChange={onChange(field)}
                className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Operating System</label>
            <select value={form.os_type} onChange={onChange('os_type')}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500">
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Additional Notes</label>
            <textarea value={form.notes} onChange={onChange('notes')} rows={2}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>

          {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-md px-3 py-2">{success}</div>}

          <div className="flex gap-3 pt-1">
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold px-4 py-2 rounded-md text-sm">
              Save Device
            </button>
            <button type="button" onClick={() => setForm(emptyForm)} className="bg-navy-800 hover:bg-navy-700 text-slate-300 px-4 py-2 rounded-md text-sm">
              Reset Form
            </button>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Identifiers such as IMEI, serial number, MAC and IP address are recorded as case metadata for
            identification and correlation only — entering them does not retrieve any private device data.
          </p>
        </form>

        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Registered Device Profiles</h2>
          <DataTable<Device>
            rowKey={(d) => d.id}
            emptyLabel="No devices registered for this case yet."
            rows={devices}
            columns={[
              { header: 'Brand / Model', render: (d) => `${d.brand} ${d.model}` },
              { header: 'OS', render: (d) => `${d.os_type} ${d.os_version}` },
              { header: 'IMEI', render: (d) => d.imei },
              { header: 'MAC', render: (d) => d.mac_address },
              { header: 'Timezone', render: (d) => d.timezone },
            ]}
          />
        </div>
      </div>
    </Layout>
  )
}
