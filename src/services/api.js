import axios from 'axios'

/**
 * Axios Instance — সব API call এখান দিয়ে যাবে
 * Base URL: /api (vite proxy → localhost:5000)
 */
const API_BASE =
  import.meta.env.DEV
    ? '/api'
    : 'https://ridwah-foundation-backend.onrender.com'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

// ─── Request Interceptor — token attach ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor — global error handle ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status
    const isAuthRoute = error.config?.url?.includes('/auth/login') ||
                        error.config?.url?.includes('/auth/register')

    // 401 on non-auth routes → logout
    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api