import axios from 'axios'
import type { AuthError } from '../types/auth.types'

export function toAuthError(error: unknown): AuthError {
  const status = axios.isAxiosError(error) ? error.response?.status ?? null : null
  const body: unknown = axios.isAxiosError(error) ? error.response?.data : null
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const fieldErrors: Record<string, string[]> = {}
  if (record.errors && typeof record.errors === 'object') {
    for (const [name, messages] of Object.entries(record.errors)) {
      if (Array.isArray(messages)) {
        fieldErrors[name] = messages.filter((value): value is string => typeof value === 'string')
      }
    }
  }
  const messages: Record<number, string> = {
    401: 'La sesión no es válida o ha expirado. Inicia sesión de nuevo.',
    403: 'Acceso denegado. No tienes autorización para esta operación.',
    422: 'Revisa los datos del formulario.',
    503: 'El servicio no está disponible temporalmente. Inténtalo de nuevo.',
  }
  const serverMessage = typeof record.message === 'string' ? record.message : null
  const fallback = error instanceof Error && !axios.isAxiosError(error)
    ? error.message : 'No pudimos conectar con el servicio. Inténtalo de nuevo.'
  return {
    status,
    message: status === 503 ? messages[503] : serverMessage || messages[status ?? 0] || fallback,
    fieldErrors,
  }
}
