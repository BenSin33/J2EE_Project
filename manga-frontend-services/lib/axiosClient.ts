import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Chỉnh URL nếu đổi port
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor Request: Tự động gài Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor Response: Bắt lỗi 401 hết hạn Token
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout() // Xoá token nếu bị đá
    }
    return Promise.reject(error)
  }
)
