import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import CaseSelector, { useCaseSelector } from '../components/CaseSelector'
import { api } from '../api/client'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts'

interface LocationRecord {
  id: string
  latitude: number
  longitude: number
  timestamp: string
  location_source: string
  accuracy_m: number | null
  source_artifact: string
}

export default function LocationAnalysis() {
  const { cases, selected, setSelected } = useCaseSelector()
  const [locations, setLocations] = useState<LocationRecord[]>([])

  useEffect(() => {
    if (!selected) return
    api.get('/api/location', { params: { investigation_id: selected } }).then((res) => setLocations(res.data))
  }, [selected])

  const sourceData = locations.length > 0
    ? Object.entries(locations.reduce<Record<string, number>>((counts, location) => {
        counts[location.location_source] = (counts[location.location_source] || 0) + 1
        return counts
      }, {})).map(([name, value], index) => ({
        name,
        value,
        color: ['#22d3ee', '#a78bfa', '#fbbf24', '#fb7185'][index % 4],
      }))
    : [{ name: 'No records yet', value: 1, color: '#334155' }]

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    observations: locations.filter((location) => new Date(location.timestamp).getHours() === hour).length,
  })).filter((entry) => entry.observations > 0 || locations.length === 0 || Number(entry.hour.slice(0, 2)) % 3 === 0)

  return (
    <Layout title="Location Analysis" subtitle="Chronological GPS / location history and repeated-location patterns">
      <CaseSelector cases={cases} selected={selected} onChange={setSelected} />

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">⌖</span>
          <h2 className="text-sm font-semibold text-slate-300">Location Scatter (Longitude / Latitude)</h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Simplified coordinate plot for the MVP. Full interactive mapping (tile layers, clustering) is reserved for a future release.
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" dataKey="longitude" name="Longitude" stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
            <YAxis type="number" dataKey="latitude" name="Latitude" stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#111827', border: '1px solid #334155', color: '#e2e8f0' }}
              formatter={(value: any) => value} />
            <Scatter data={locations} fill="#22d3ee" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Location Sources</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                {sourceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', color: '#e2e8f0' }} />
              <Legend iconType="circle" wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Observations by Hour</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} interval={2} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', color: '#e2e8f0' }} />
              <Bar dataKey="observations" name="Observations" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-300 mb-3">Location Timeline</h2>
      <DataTable<LocationRecord>
        rowKey={(l) => l.id}
        emptyLabel="No location records imported for this case yet."
        rows={locations}
        columns={[
          { header: 'Timestamp', render: (l) => new Date(l.timestamp).toLocaleString() },
          { header: 'Coordinates', render: (l) => `${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)}` },
          { header: 'Source', render: (l) => l.location_source },
          { header: 'Accuracy', render: (l) => l.accuracy_m ? `${l.accuracy_m} m` : '-' },
          { header: 'Artifact', render: (l) => l.source_artifact },
        ]}
      />
    </Layout>
  )
}
