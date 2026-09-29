export interface WorkspaceUser {
  workspace_user_id: number | string
  workspace_user_email: string
  workspace_user_name: string
  workspace_user_last_name: string
}

export interface LoginCredentials {
  workspace_user_email: string
  workspace_user_password: string
}

export interface LoginResponse {
  workspace_access_token: string
  workspace_access_token_type: string
  workspace_user: WorkspaceUser
}

export interface WorkspaceSession extends WorkspaceUser {
  current_application: unknown
  current_application_access: unknown
  current_application_permissions: unknown
}

export interface AuthError {
  status: number | null
  message: string
  fieldErrors: Record<string, string[]>
}

export type AuthStatus = 'idle' | 'anonymous' | 'authenticating' | 'authenticated'
  | 'unauthorized' | 'error' | 'logging-out'
