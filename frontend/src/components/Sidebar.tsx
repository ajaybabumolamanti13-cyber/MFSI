import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/investigations/new', label: 'New Investigation', icon: '＋' },
  { to: '/devices', label: 'Device Information', icon: '▣' },
  { to: '/evidence', label: 'Evidence Acquisition', icon: '⇩' },
  { to: '/analysis/messages', label: 'Messages Analysis', icon: '◌' },
  { to: '/analysis/calls', label: 'Call Log Analysis', icon: '◉' },
  { to: '/analysis/location', label: 'Location Analysis', icon: '⌖' },
  { to: '/analysis/social', label: 'Social Media Analysis', icon: '◎' },
  { to: '/ai-insights', label: 'AI Insights & Anomalies', icon: '✦' },
  { to: '/timeline', label: 'Evidence Timeline', icon: '◷' },
  { to: '/reports', label: 'Forensic Reports', icon: '▤' },
  { to: '/tools', label: 'Forensic Tools', icon: '⚒' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const { logout, user } = useAuth()

  return (
    <aside className="w-64 shrink-0 bg-navy-900 border-r border-navy-700 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-navy-700">
        <div className="text-cyan-400 font-bold tracking-widest text-sm">MFIS</div>
        <div className="text-xs text-slate-400 mt-0.5">Mobile Forensic Intelligence System</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <span aria-hidden="true" className="w-5 text-center text-base text-cyan-300/80">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-navy-700">
        <div className="text-xs text-slate-400 mb-2 truncate">{user?.email}</div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-navy-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 text-sm transition-colors"
        >
          ⇥ Logout
        </button>
      </div>
    </aside>
  )
}
