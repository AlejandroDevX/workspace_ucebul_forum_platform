// Limita el guardado de la posición del video: como máximo una petición cada `intervalMs` durante la
// reproducción, solo si avanzó al menos `minDeltaSeconds`, y nunca dos peticiones simultáneas.
// `force` (pausa, final o salida) ignora el intervalo; la posición más reciente se envía al terminar la anterior.

export interface PositionSaverOptions {
  // Envía la posición y devuelve la posición confirmada por la API.
  send: (seconds: number) => Promise<number>
  onError?: (error: unknown) => void
  now?: () => number
  intervalMs?: number
  minDeltaSeconds?: number
}

export function createPositionSaver(options: PositionSaverOptions) {
  let config = options
  let lastSaved = 0
  let lastSentAt = Number.NEGATIVE_INFINITY
  let inFlight = false
  let pending: number | null = null
  let enabled = true

  const now = () => (config.now ?? Date.now)()

  function send(position: number) {
    inFlight = true
    lastSentAt = now()
    config.send(position)
      .then((confirmed) => { lastSaved = confirmed })
      .catch((error: unknown) => config.onError?.(error))
      .finally(() => {
        inFlight = false
        const next = pending
        pending = null
        if (next !== null && enabled && next !== lastSaved) send(next)
      })
  }

  return {
    update(seconds: number, force = false) {
      if (!enabled || !Number.isFinite(seconds)) return
      const position = Math.max(0, Math.floor(seconds))
      if (position === lastSaved) return
      if (!force) {
        if (now() - lastSentAt < (config.intervalMs ?? 15_000)) return
        if (Math.abs(position - lastSaved) < (config.minDeltaSeconds ?? 5)) return
      }
      if (inFlight) {
        pending = position
        return
      }
      send(position)
    },
    // Nueva lección: descarta lo pendiente y vuelve a empezar el intervalo.
    reset() {
      lastSaved = 0
      lastSentAt = Number.NEGATIVE_INFINITY
      pending = null
    },
    // Toma la posición confirmada por la API como referencia, sin reiniciar el intervalo.
    sync(confirmedSeconds: number, isEnabled: boolean) {
      enabled = isEnabled
      if (!inFlight) lastSaved = Math.max(0, Math.floor(confirmedSeconds))
    },
    configure(next: PositionSaverOptions) {
      config = next
    },
  }
}
