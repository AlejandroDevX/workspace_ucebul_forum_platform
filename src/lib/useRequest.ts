import axios from 'axios'
import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { toApiError, type ApiError } from './api-error'

interface State<T> {
  key: string | null
  data: T | undefined
  error: ApiError | null
}

// Carga datos cuando cambia `key` y cancela la solicitud anterior. `key` null no solicita nada.
export function useRequest<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const [reloads, setReloads] = useState(0)
  const [state, setState] = useState<State<T>>({ key: null, data: undefined, error: null })
  const requestKey = key === null ? null : `${key}#${reloads}`
  const run = useEffectEvent(load)

  useEffect(() => {
    if (requestKey === null) return
    const controller = new AbortController()
    run(controller.signal)
      .then((data) => setState({ key: requestKey, data, error: null }))
      .catch((failure: unknown) => {
        if (axios.isCancel(failure) || controller.signal.aborted) return
        setState((previous) => ({ key: requestKey, data: previous.data, error: toApiError(failure) }))
      })
    return () => controller.abort()
  }, [requestKey])

  const setData = useCallback((update: (current: T | undefined) => T | undefined) => {
    setState((previous) => ({ ...previous, data: update(previous.data) }))
  }, [])

  return {
    data: state.data,
    error: state.key === requestKey ? state.error : null,
    loading: requestKey !== null && state.key !== requestKey,
    reload: useCallback(() => setReloads((value) => value + 1), []),
    setData,
  }
}
