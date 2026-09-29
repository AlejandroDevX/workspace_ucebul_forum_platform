import axios from 'axios'
import { create } from 'zustand'
import { configureApiSession } from '../../../lib/api'
import { loginRequest, logoutRequest, sessionRequest } from '../api/auth.service'
import { toAuthError } from '../api/auth.error'
import { hasActiveAccess, permissionSlugs } from '../utils/session-policy'
import type { AuthError, AuthStatus, LoginCredentials, WorkspaceSession, WorkspaceUser } from '../types/auth.types'

export const ACCESS_TOKEN_KEY = 'ucebul.forum.access-token'

interface AuthState {
  token: string | null
  user: WorkspaceUser | null
  status: AuthStatus
  currentApplication: WorkspaceSession['current_application'] | null
  currentApplicationAccess: WorkspaceSession['current_application_access'] | null
  currentApplicationPermissions: WorkspaceSession['current_application_permissions'] | null
  isBootstrapping: boolean
  error: AuthError | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  initializeSession: () => Promise<void>
  clearSession: () => void
  clearError: (field?: string) => void
  hasPermission: (slug: string) => boolean
  hasAnyPermission: (slugs: readonly string[]) => boolean
}

const emptySession = {
  token: null,
  user: null,
  currentApplication: null,
  currentApplicationAccess: null,
  currentApplicationPermissions: null,
}

let version = 0
let controller: AbortController | null = null
let initialization: Promise<void> | null = null
let loginOperation: Promise<void> | null = null
let logoutOperation: Promise<void> | null = null

function beginOperation() {
  controller?.abort()
  controller = new AbortController()
  version += 1
  return { revision: version, signal: controller.signal }
}

export const useAuthStore = create<AuthState>((set, get) => {
  function acceptSession(session: WorkspaceSession) {
    const active = hasActiveAccess(session.current_application_access)
    set({
      user: {
        workspace_user_id: session.workspace_user_id,
        workspace_user_email: session.workspace_user_email,
        workspace_user_name: session.workspace_user_name,
        workspace_user_last_name: session.workspace_user_last_name,
      },
      currentApplication: session.current_application,
      currentApplicationAccess: session.current_application_access,
      currentApplicationPermissions: session.current_application_permissions,
      status: active ? 'authenticated' : 'unauthorized',
      error: active ? null : {
        status: 403,
        message: 'Tu cuenta no tiene acceso activo a Foro Técnico.',
        fieldErrors: {},
      },
    })
  }

  function fail(error: unknown, revision: number) {
    if (revision !== version || axios.isCancel(error)) return
    const parsed = toAuthError(error)
    if (parsed.status === 401) {
      get().clearSession()
      set({ error: parsed })
    } else {
      set({ error: parsed, status: parsed.status === 403 ? 'unauthorized' : get().token ? 'error' : 'anonymous' })
    }
  }

  return {
    ...emptySession,
    status: 'idle',
    isBootstrapping: true,
    error: null,

    clearSession: () => {
      beginOperation()
      initialization = null
      loginOperation = null
      logoutOperation = null
      let error: AuthError | null = null
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
      } catch {
        error = { status: null, message: 'No se pudo borrar la sesión del almacenamiento del navegador.', fieldErrors: {} }
      }
      set({ ...emptySession, status: 'anonymous', isBootstrapping: false, error })
    },

    clearError: (field) => {
      const error = get().error
      if (!field || !error) { set({ error: null }); return }
      const fieldErrors = { ...error.fieldErrors }
      delete fieldErrors[field]
      set({ error: Object.keys(fieldErrors).length ? { ...error, fieldErrors } : null })
    },

    initializeSession: () => {
      if (initialization) return initialization
      if (loginOperation) return loginOperation
      if (logoutOperation) return logoutOperation
      if (['authenticated', 'unauthorized', 'anonymous'].includes(get().status)) return Promise.resolve()
      const { revision, signal } = beginOperation()
      set({ isBootstrapping: true, error: null })
      const operation = (async () => {
        try {
          const token = get().token || localStorage.getItem(ACCESS_TOKEN_KEY)
          if (!token) {
            set({ ...emptySession, status: 'anonymous' })
            return
          }
          set({ token })
          const session = await sessionRequest(signal)
          if (revision === version) acceptSession(session)
        } catch (error) {
          fail(error, revision)
        } finally {
          if (revision === version) set({ isBootstrapping: false })
        }
      })()
      initialization = operation
      void operation.then(() => { if (initialization === operation) initialization = null })
      return operation
    },

    login: (credentials) => {
      if (loginOperation) return loginOperation
      const { revision, signal } = beginOperation()
      set({ ...emptySession, status: 'authenticating', isBootstrapping: false, error: null })
      const operation = (async () => {
        try {
          localStorage.removeItem(ACCESS_TOKEN_KEY)
          const response = await loginRequest(credentials, signal)
          if (revision !== version) return
          if (!response.workspace_access_token || response.workspace_access_token_type?.toLowerCase() !== 'bearer') {
            throw new Error('Workspace no devolvió un token Bearer válido.')
          }
          localStorage.setItem(ACCESS_TOKEN_KEY, response.workspace_access_token)
          set({ token: response.workspace_access_token })
          const session = await sessionRequest(signal)
          if (revision === version) acceptSession(session)
        } catch (error) {
          fail(error, revision)
        }
      })()
      loginOperation = operation
      void operation.then(() => { if (loginOperation === operation) loginOperation = null })
      return operation
    },

    logout: () => {
      if (logoutOperation) return logoutOperation
      const { revision, signal } = beginOperation()
      const token = get().token
      set({ status: 'logging-out', error: null, isBootstrapping: false })
      const operation = (async () => {
        let failure: AuthError | null = null
        try {
          if (token) await logoutRequest(signal)
        } catch (error) {
          if (!axios.isCancel(error)) {
            const parsed = toAuthError(error)
            failure = { ...parsed, message: `${parsed.message} La sesión local se cerró; no se pudo confirmar el cierre en Workspace.` }
          }
        } finally {
          if (revision === version) {
            get().clearSession()
            if (failure) set({ error: failure })
          }
        }
      })()
      logoutOperation = operation
      void operation.then(() => { if (logoutOperation === operation) logoutOperation = null })
      return operation
    },

    hasPermission: (slug) => get().status === 'authenticated'
      && permissionSlugs(get().currentApplicationPermissions).has(slug),
    hasAnyPermission: (slugs) => slugs.some((slug) => get().hasPermission(slug)),
  }
})

configureApiSession({
  getToken: () => useAuthStore.getState().token,
  getVersion: () => version,
  onError: (error) => {
    const parsed = toAuthError(error)
    if (parsed.status === 401) useAuthStore.getState().clearSession()
    useAuthStore.setState({ error: parsed })
  },
})
