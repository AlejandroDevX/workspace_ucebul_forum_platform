import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { forumApi, workspaceApi } from '../src/lib/api'
import { ACCESS_TOKEN_KEY, useAuthStore } from '../src/features/auth/store/auth.store'
import { hasActiveAccess, permissionSlugs } from '../src/features/auth/utils/session-policy'

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value) },
  removeItem: (key: string) => { storage.delete(key) },
} })

function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { config, status, statusText: String(status), headers: {}, data }
}
function rejected(config: InternalAxiosRequestConfig, status: number) {
  return Promise.reject(new AxiosError('Request failed', undefined, config, undefined,
    response(config, { message: `Error ${status}` }, status)))
}
function withToken(status: 'idle' | 'authenticated' = 'idle') {
  localStorage.setItem(ACCESS_TOKEN_KEY, 'test-token')
  useAuthStore.setState({ token: 'test-token', status, isBootstrapping: false })
}
beforeEach(() => {
  useAuthStore.getState().clearSession()
  useAuthStore.setState({ status: 'idle', isBootstrapping: true })
  const unexpected: AxiosAdapter = (config) => { throw new Error(`Unexpected request: ${config.url}`) }
  workspaceApi.defaults.adapter = unexpected
  forumApi.defaults.adapter = unexpected
})

test('sin token, inicia como anónimo sin consultar Workspace', async () => {
  await useAuthStore.getState().initializeSession()
  assert.equal(useAuthStore.getState().status, 'anonymous')
  assert.equal(useAuthStore.getState().isBootstrapping, false)
})

test('extrae exclusivamente slugs de permisos agrupados por módulo', () => {
  const groups = {
    modulo_a: [{ workspace_application_permission_slug: 'a.read' }],
    modulo_b: [{ workspace_application_permission_slug: 'b.read' }, { workspace_application_permission_slug: 'a.read' }],
    malformed: [{ slug: 'ignored' }, null, 'ignored'],
  }
  assert.deepEqual([...permissionSlugs(groups)], ['a.read', 'b.read'])
  withToken('authenticated')
  useAuthStore.setState({ currentApplicationPermissions: groups })
  assert.equal(useAuthStore.getState().hasPermission('a.read'), true)
  assert.equal(useAuthStore.getState().hasPermission('ignored'), false)
  assert.equal(useAuthStore.getState().hasAnyPermission(['missing', 'b.read']), true)
  assert.equal(useAuthStore.getState().hasAnyPermission([]), false)
  useAuthStore.setState({ status: 'unauthorized' })
  assert.equal(useAuthStore.getState().hasAnyPermission(['a.read']), false)
})

test('deduplica la recuperación y envía el token y el slug del foro', async () => {
  localStorage.setItem(ACCESS_TOKEN_KEY, 'test-token')
  let requests = 0
  let finish!: () => void
  const pending = new Promise<void>((resolve) => { finish = resolve })
  workspaceApi.defaults.adapter = async (config) => {
    requests++
    assert.equal(config.url, '/auth/me')
    assert.equal(config.params.application_slug, 'ucebul-forum')
    assert.equal(config.headers.get('Authorization'), 'Bearer test-token')
    await pending
    return response(config, { data: { current_application_access: null } })
  }
  const first = useAuthStore.getState().initializeSession()
  const second = useAuthStore.getState().initializeSession()
  assert.equal(first, second)
  finish()
  await first
  assert.equal(requests, 1)
  assert.equal(useAuthStore.getState().status, 'unauthorized')
  assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), 'test-token')
})

for (const [name, api] of [['Workspace', workspaceApi], ['Forum', forumApi]] as const) {
  for (const status of [401, 403, 503]) {
    test(`${name}: Bearer y manejo de ${status}`, async () => {
      withToken('authenticated')
      api.defaults.adapter = (config) => {
        assert.equal(config.headers.get('Authorization'), 'Bearer test-token')
        return rejected(config, status)
      }
      await assert.rejects(api.get('/test-only'))
      const state = useAuthStore.getState()
      assert.equal(state.error?.status, status)
      assert.equal(state.token, status === 401 ? null : 'test-token')
      assert.equal(state.status, status === 401 ? 'anonymous' : 'authenticated')
      assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), status === 401 ? null : 'test-token')
    })
  }
}

test('503 durante bootstrap conserva el token y permite reintentar', async () => {
  withToken()
  workspaceApi.defaults.adapter = (config) => rejected(config, 503)
  await useAuthStore.getState().initializeSession()
  assert.equal(useAuthStore.getState().status, 'error')
  assert.equal(useAuthStore.getState().token, 'test-token')
  workspaceApi.defaults.adapter = async (config) => response(config, { data: { current_application_access: null } })
  await useAuthStore.getState().initializeSession()
  assert.equal(useAuthStore.getState().status, 'unauthorized')
})

test('login envía DTO, valida /me y no autoriza un token sin acceso', async () => {
  const requests: string[] = []
  workspaceApi.defaults.adapter = async (config) => {
    requests.push(config.url!)
    if (config.url === '/auth/login') {
      assert.equal(config.headers.has('Authorization'), false)
      assert.deepEqual(JSON.parse(config.data), {
        workspace_user_email: 'persona@example.com', workspace_user_password: ' password ',
        workspace_personal_access_token_name: 'forum-platform',
      })
      return response(config, { data: { workspace_access_token: 'new-token', workspace_access_token_type: 'Bearer' } })
    }
    assert.equal(config.headers.get('Authorization'), 'Bearer new-token')
    return response(config, { data: { current_application_access: null } })
  }
  await useAuthStore.getState().login({ workspace_user_email: 'persona@example.com', workspace_user_password: ' password ' })
  assert.deepEqual(requests, ['/auth/login', '/auth/me'])
  assert.equal(useAuthStore.getState().status, 'unauthorized')
  assert.equal(useAuthStore.getState().hasPermission('any'), false)
})

test('422 muestra errores de campo y los elimina al corregir', async () => {
  workspaceApi.defaults.adapter = (config) => Promise.reject(new AxiosError('Validation', undefined, config, undefined,
    response(config, { message: 'Datos inválidos', errors: { workspace_user_email: ['Correo inválido'] } }, 422)))
  await useAuthStore.getState().login({ workspace_user_email: 'a@b.com', workspace_user_password: 'bad' })
  assert.deepEqual(useAuthStore.getState().error?.fieldErrors.workspace_user_email, ['Correo inválido'])
  useAuthStore.getState().clearError('workspace_user_email')
  assert.equal(useAuthStore.getState().error, null)
})

for (const status of [200, 401, 503]) {
  test(`logout ${status}: solicita cierre remoto y después limpia el token`, async () => {
    withToken('authenticated')
    workspaceApi.defaults.adapter = async (config) => {
      assert.equal(config.url, '/auth/logout')
      assert.equal(config.method, 'post')
      assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), 'test-token')
      return status === 200 ? response(config, {}) : rejected(config, status)
    }
    await useAuthStore.getState().logout()
    assert.equal(useAuthStore.getState().token, null)
    assert.equal(useAuthStore.getState().status, 'anonymous')
    assert.equal(localStorage.getItem(ACCESS_TOKEN_KEY), null)
  })
}

test('una respuesta 401 antigua no invalida una sesión posterior', async () => {
  withToken('authenticated')
  let reject!: () => void
  forumApi.defaults.adapter = (config) => new Promise((_, rejectPromise) => {
    reject = () => rejectPromise(new AxiosError('expired', undefined, config, undefined, response(config, {}, 401)))
  })
  const request = forumApi.get('/test-only')
  await new Promise((resolve) => setTimeout(resolve, 0))
  useAuthStore.getState().clearSession()
  withToken('authenticated')
  reject()
  await assert.rejects(request)
  assert.equal(useAuthStore.getState().token, 'test-token')
})

test('cerrar la sesión cancela una recuperación pendiente', async () => {
  withToken()
  let finish!: () => void
  workspaceApi.defaults.adapter = (config) => new Promise((resolve) => {
    finish = () => resolve(response(config, { data: { current_application_access: null } }))
  })
  const request = useAuthStore.getState().initializeSession()
  await new Promise((resolve) => setTimeout(resolve, 0))
  useAuthStore.getState().clearSession()
  finish()
  await request
  assert.equal(useAuthStore.getState().token, null)
  assert.equal(useAuthStore.getState().status, 'anonymous')
  assert.equal(axios.isCancel(useAuthStore.getState().error), false)
})

test('sesión con acceso activo queda autenticada y expone permisos', async () => {
  withToken()
  workspaceApi.defaults.adapter = async (config) => response(config, { data: {
    workspace_user_id: 1,
    current_application_access: { workspace_user_application_is_active: true },
    current_application_permissions: { community: { permissions: [{ workspace_application_permission_slug: 'forum.community.view' }] } },
  } })
  await useAuthStore.getState().initializeSession()
  assert.equal(useAuthStore.getState().status, 'authenticated')
  assert.equal(useAuthStore.getState().hasPermission('forum.community.view'), true)
})

test('hasActiveAccess solo autoriza un true explícito', () => {
  assert.equal(hasActiveAccess({ workspace_user_application_is_active: true }), true)
  assert.equal(hasActiveAccess({ workspace_user_application_is_active: false }), false)
  assert.equal(hasActiveAccess({ workspace_user_application_is_active: 1 }), false)
  assert.equal(hasActiveAccess({}), false)
  assert.equal(hasActiveAccess(null), false)
})
