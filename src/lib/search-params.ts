// Utilidades para filtros guardados en la URL.
export function positiveInt(value: string | null) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : undefined
}

// Aplica cambios a la query; cualquier cambio que no sea de página vuelve a la primera.
export function withChanges(params: URLSearchParams, changes: Record<string, string | null>) {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') next.delete(key)
    else next.set(key, value)
  }
  if (!('page' in changes)) next.delete('page')
  return next
}
