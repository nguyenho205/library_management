import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_API_HOST, STORAGE_KEYS, getApiBaseUrl } from '../constants/config'

const client = axios.create({
  baseURL: DEFAULT_API_HOST,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach dynamic base URL and auth token before every request
client.interceptors.request.use(
  async (config) => {
    try {
      const activeUrl = await getApiBaseUrl()
      config.baseURL = activeUrl

      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // ignore
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercept responses for auth expiration
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN)
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      await AsyncStorage.removeItem(STORAGE_KEYS.USER)
    }
    return Promise.reject(error)
  }
)

export function readError(error) {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message === 'Network Error') {
    return 'Không thể kết nối đến máy chủ thư viện. Vui lòng kiểm tra lại địa chỉ IP máy chủ trong phần Cài đặt.'
  }
  if (error.code === 'ECONNABORTED') {
    return 'Quá thời gian kết nối (Timeout). Vui lòng thử lại.'
  }
  return error.message || 'Đã xảy ra lỗi không xác định.'
}

export default client

