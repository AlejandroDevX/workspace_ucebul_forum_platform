import axios from 'axios'
import { env } from '../config/env'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipSessionAuth?: boolean
    sessionVersion?: number
  }
}

export const workspaceApi = axios.create({
  baseURL: env.workspaceApiUrl,
  headers: { Accept: 'application/json' },
  timeout: 20_000,
})

export const forumApi = axios.create({
  baseURL: env.forumApiUrl,
  headers: { Accept: 'application/json' },
  timeout: 20_000,
})

interface SessionHandlers {
  getToken: () => string | null
  getVersion: () => number
  onError: (error: unknown) => void
}

let session: SessionHandlers | undefined

// Se registra una sola vez desde el store; evita una dependencia circular.
export function configureApiSession(handlers: SessionHandlers) {
  session = handlers
}

for (const api of [workspaceApi, forumApi]) {
  api.interceptors.request.use((config) => {
    config.sessionVersion = session?.getVersion()
    const token = config.skipSessionAuth ? null : session?.getToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    else config.headers.delete('Authorization')
    return config
  })
  api.interceptors.response.use((response) => response, (error: unknown) => {
    if (axios.isAxiosError(error) && !error.config?.skipSessionAuth
      && error.config?.sessionVersion === session?.getVersion()
      && [401, 403, 503].includes(error.response?.status ?? 0)) {
      session?.onError(error)
    }
    return Promise.reject(error)
  })
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
