import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    navigate('/login')
    return null
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setSuccess(true)
      await refreshUser()
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-cyan-400 font-bold text-xl tracking-widest">MFIS</div>
          <div className="text-slate-400 text-sm mt-1">Change your password to continue</div>
        </div>

        <form onSubmit={onSubmit} className="bg-navy-900 border border-navy-700 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">New Password</label>
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Confirm New Password</label>
            <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-cyan-500" />
          </div>

          {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-md px-3 py-2">Password updated. Redirecting…</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-navy-950 font-semibold py-2 rounded-md transition-colors">
            {loading ? 'Updating…' : 'Update Password'}
          </button>
          <button type="button" onClick={logout} className="w-full text-xs text-slate-500 hover:text-slate-300">
            Cancel and sign out
          </button>
        </form>
      </div>
    </div>
  )
}
