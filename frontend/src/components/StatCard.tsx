export default function StatCard({ label, value, hint, accent = 'cyan' }: { label: string; value: string | number; hint?: string; accent?: 'cyan' | 'red' | 'amber' | 'green' }) {
  const accentMap: Record<string, string> = {
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    green: 'text-emerald-400',
  }
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
      <div className="text-slate-400 text-xs uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accentMap[accent]}`}>{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  )
}
