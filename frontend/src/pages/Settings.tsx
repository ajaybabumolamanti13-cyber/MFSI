import { useState, FormEvent } from 'react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await api.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setSuccess('Password updated successfully.')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not update password')
    }
  }

  return (
    <Layout title="Settings" subtitle="Account and security settings">
      <div className="max-w-lg bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Account</h2>
        <div className="text-sm text-slate-400 space-y-1">
          <div><span className="text-slate-500">Name:</span> {user?.full_name}</div>
          <div><span className="text-slate-500">Email:</span> {user?.email}</div>
          <div><span className="text-slate-500">Role:</span> {user?.role}</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-w-lg bg-navy-900 border border-navy-700 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">Change Password</h2>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Current Password</label>
          <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">New Password</label>
          <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Confirm New Password</label>
          <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
        </div>
        {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">{error}</div>}
        {success && <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-md px-3 py-2">{success}</div>}
        <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-semibold px-4 py-2 rounded-md text-sm">
          Update Password
        </button>
      </form>
    </Layout>
  )
}
