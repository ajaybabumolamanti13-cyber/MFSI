import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import { api } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

interface Summary {
  total_cases: number
  open_cases: number
  total_evidence_files: number
  total_ai_findings: number
  high_priority_findings: number
  total_reports: number
  recent_cases: { id: string; case_name: string; status: string }[]
  recent_reports: { id: string; investigation_id: string; generated_at: string }[]
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)

  useEffect(() => {
    api.get('/api/dashboard/summary').then((res) => setSummary(res.data))
  }, [])

  const chartData = summary
    ? [
        { name: 'Cases', value: summary.total_cases },
        { name: 'Evidence', value: summary.total_evidence_files },
        { name: 'AI Findings', value: summary.total_ai_findings },
        { name: 'Reports', value: summary.total_reports },
      ]
    : []

  const priorityData = summary && summary.total_ai_findings > 0
    ? [
        { name: 'High priority', value: summary.high_priority_findings, color: '#fb7185' },
        { name: 'Other findings', value: Math.max(summary.total_ai_findings - summary.high_priority_findings, 0), color: '#22d3ee' },
      ]
    : [{ name: 'No findings yet', value: 1, color: '#334155' }]

  return (
    <Layout title="Dashboard" subtitle="Investigation overview and system status">
      {!summary ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Cases" value={summary.total_cases} />
            <StatCard label="Open Cases" value={summary.open_cases} accent="amber" />
            <StatCard label="Evidence Files" value={summary.total_evidence_files} />
            <StatCard label="AI Findings" value={summary.total_ai_findings} />
            <StatCard label="High Priority" value={summary.high_priority_findings} accent="red" />
            <StatCard label="Reports Generated" value={summary.total_reports} accent="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">◒</span>
                <h2 className="text-sm font-semibold text-slate-300">Case &amp; Evidence Overview</h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', color: '#e2e8f0' }} />
                  <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Finding Priority</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
                    {priorityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #334155', color: '#e2e8f0' }} />
                  <Legend iconType="circle" wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent Investigations</h2>
              <ul className="space-y-2">
                {summary.recent_cases.length === 0 && <li className="text-slate-500 text-sm italic">No investigations yet.</li>}
                {summary.recent_cases.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.case_name}</span>
                    <span className="text-xs text-cyan-400 uppercase">{c.status}</span>
                  </li>
                ))}
              </ul>
              <Link to="/investigations/new" className="block text-center mt-4 text-xs text-cyan-400 hover:text-cyan-300">
                + Start a new investigation
              </Link>
            </div>
          </div>

          <div className="mt-6 bg-navy-900 border border-navy-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Recent Reports</h2>
            <ul className="space-y-1 text-sm">
              {summary.recent_reports.length === 0 && <li className="text-slate-500 italic">No reports generated yet.</li>}
              {summary.recent_reports.map((r) => (
                <li key={r.id} className="flex justify-between">
                  <span>{r.id} — case {r.investigation_id}</span>
                  <span className="text-slate-500">{new Date(r.generated_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Layout>
  )
}
