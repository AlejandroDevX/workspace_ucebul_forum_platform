// El formato de error de Forum API es el mismo de Workspace: message + errors por campo.
export { toAuthError as toApiError } from '../features/auth/api/auth.error'
export type { AuthError as ApiError } from '../features/auth/types/auth.types'
