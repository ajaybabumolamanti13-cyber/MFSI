import axios from 'axios'

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || ''
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL.slice(0, -4) : rawBaseURL

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mfis_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('mfis_token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)
