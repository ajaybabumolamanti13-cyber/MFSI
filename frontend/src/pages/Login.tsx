import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      setError(err?.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-cyan-400 font-bold text-2xl tracking-widest">MFIS</div>
          <div className="text-slate-400 text-sm mt-1">Mobile Forensic Intelligence System</div>
        </div>

        <form onSubmit={onSubmit} className="bg-navy-900 border border-navy-700 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email or Username</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              placeholder="investigator@agency.gov"
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
                className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 pr-10 text-white focus:outline-none focus:border-cyan-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 text-xs"
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
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold py-2 rounded-md transition-colors"
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
