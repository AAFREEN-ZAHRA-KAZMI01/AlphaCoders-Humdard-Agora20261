import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({ baseURL: BASE })

// ── Request: attach Bearer token ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: silent token refresh on 401 ───────────────────────────────────
let refreshing = false
let queue = []

const flush = (err, token = null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }

    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
    }

    original._retry = true
    refreshing = true

    try {
      const { refreshToken, setTokens, logout } = useAuthStore.getState()
      if (!refreshToken) { logout(); return Promise.reject(err) }

      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      setTokens(data.access_token, data.refresh_token)
      flush(null, data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (refreshErr) {
      flush(refreshErr)
      useAuthStore.getState().logout()
      window.location.href = '/signin'
      return Promise.reject(refreshErr)
    } finally {
      refreshing = false
    }
  },
)

export default api
