import axios from 'axios'

// Tat ca request goi toi /api/** - Vite se proxy sang Spring Boot backend (xem vite.config.js)
const client = axios.create({ baseURL: '/api' })

function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  }
}

function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// Gan Authorization header vao moi request
client.interceptors.request.use((config) => {
  const { accessToken } = getTokens()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Neu access token het han (401) -> tu dong goi /api/auth/refresh 1 lan,
// neu refresh con han thi lay token moi va goi lai request cu (khong bat user dang nhap lai).
// Day la hanh vi tuong ung voi yeu cau backend: "refresh con han thi tu cap token moi".
let refreshPromise = null

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      originalRequest._retry = true
      const { refreshToken } = getTokens()
      if (!refreshToken) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', { refreshToken })
            .then((res) => res.data.data)
            .finally(() => { refreshPromise = null })
        }
        const newTokens = await refreshPromise
        setTokens(newTokens)
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
        return client(originalRequest)
      } catch (refreshError) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default client
export { getTokens, setTokens, clearTokens }
