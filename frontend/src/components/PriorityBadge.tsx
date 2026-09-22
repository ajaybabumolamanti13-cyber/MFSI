export default function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: 'bg-red-900/40 text-red-300 border-red-700/50',
    Medium: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    Low: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[priority] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      {priority}
    </span>
  )
}
