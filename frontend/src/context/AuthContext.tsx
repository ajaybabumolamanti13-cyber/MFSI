import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../api/client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  must_change_password: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  mustChangePassword: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const refreshUser = async () => {
    const token = localStorage.getItem('mfis_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/api/auth/me')
      setUser(res.data)
      setMustChangePassword(res.data.must_change_password)
    } catch {
      localStorage.removeItem('mfis_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('mfis_token', res.data.access_token)
    setMustChangePassword(res.data.must_change_password)
    await refreshUser()
  }

  const logout = () => {
    localStorage.removeItem('mfis_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, mustChangePassword, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
