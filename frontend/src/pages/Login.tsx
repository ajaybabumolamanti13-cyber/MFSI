import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('demo@agency.gov')
  const [password, setPassword] = useState('demo123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = () => {
    setEmail('demo@agency.gov')
    setPassword('demo123')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-cyan-400 font-bold text-3xl tracking-widest flex items-center justify-center gap-2">
            <span>MFIS</span>
          </div>
          <div className="text-slate-400 text-sm mt-1">Mobile Forensic Intelligence System</div>
        </div>

        {/* Demo credentials banner */}
        <div className="mb-4 bg-gradient-to-r from-cyan-950/70 to-navy-900 border border-cyan-500/40 rounded-xl p-4 text-xs text-slate-300 shadow-lg shadow-cyan-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold text-[11px] tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Demo Mode Active
            </span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
            >
              Fill Demo
            </button>
          </div>
          <p className="text-slate-300 mb-1.5">
            You can log in with <strong className="text-white">any email</strong> and <strong className="text-white">any password</strong>.
          </p>
          <div className="bg-navy-950/60 rounded px-2.5 py-1.5 font-mono text-[11px] text-cyan-200 flex justify-between items-center">
            <span>Demo Email: <strong>demo@agency.gov</strong></span>
            <span>Password: <strong>demo123</strong></span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-navy-900 border border-navy-700 rounded-xl p-6 space-y-4 shadow-xl">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email or Username</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="e.g. demo@agency.gov or any email"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 pr-10 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. demo123 or any password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 text-xs px-1"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold py-2.5 rounded-md transition-colors shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="text-xs text-slate-500 text-center pt-2">
            Authorized investigators only. All access is logged.
          </p>
        </form>
      </div>
    </div>
  )
}
