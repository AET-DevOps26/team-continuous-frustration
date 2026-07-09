import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import './index.css'
import App from './App.tsx'
import { refresh } from './api/auth'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
axios.defaults.baseURL = baseUrl
axios.defaults.withCredentials = true

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number; _allowUnsafeRetry?: boolean }

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 300
const IDEMPOTENT_METHODS = ['get', 'head', 'options', 'put']

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableError = (error: AxiosError) =>
  !error.response || (error.response.status >= 500 && error.response.status < 600)

const isRetryableMethod = (config: RetryableRequestConfig) =>
  config._allowUnsafeRetry || IDEMPOTENT_METHODS.includes(config.method?.toLowerCase() ?? '')

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined
    if (!config) return Promise.reject(error)

    const noRefreshEndpoints = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh', '/api/v1/auth/logout']
    const isAuthEndpoint = noRefreshEndpoints.some((endpoint) => config.url?.includes(endpoint))

    if (error.response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true
      try {
        await refresh()
        return axios(config)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    if (isRetryableError(error) && isRetryableMethod(config)) {
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
