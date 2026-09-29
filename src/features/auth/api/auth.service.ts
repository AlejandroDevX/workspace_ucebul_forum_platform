import { workspaceApi, type ApiResponse } from '../../../lib/api'
import { env } from '../../../config/env'
import type { LoginCredentials, LoginResponse, WorkspaceSession } from '../types/auth.types'

export async function loginRequest(credentials: LoginCredentials, signal: AbortSignal) {
  const response = await workspaceApi.post<ApiResponse<LoginResponse>>('/auth/login', {
    ...credentials,
    workspace_personal_access_token_name: 'forum-platform',
  }, { signal, skipSessionAuth: true })
  return response.data.data
}

export async function sessionRequest(signal: AbortSignal) {
  const response = await workspaceApi.get<ApiResponse<WorkspaceSession>>('/auth/me', {
    params: { application_slug: env.applicationSlug },
    signal,
  })
  return response.data.data
}

export async function logoutRequest(signal: AbortSignal) {
  await workspaceApi.post('/auth/logout', undefined, { signal })
}
