import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import './index.css'
import App from './App.tsx'
import { refresh } from './api/auth'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
axios.defaults.baseURL = baseUrl
axios.defaults.withCredentials = true

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 300

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableError = (error: AxiosError) =>
  !error.response || (error.response.status >= 500 && error.response.status < 600)

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined
    if (!config) return Promise.reject(error)

    const isAuthEndpoint = config.url?.includes('/api/v1/auth/')

    if (error.response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true
      try {
        await refresh()
        return axios(config)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    if (isRetryableError(error)) {
      const retryCount = config._retryCount ?? 0
      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1
        await delay(RETRY_DELAY_MS * config._retryCount)
        return axios(config)
      }
    }

    return Promise.reject(error)
  }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
