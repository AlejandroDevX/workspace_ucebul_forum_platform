import { create } from 'zustand'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { useAuthStore } from '../../auth/store/auth.store'
import {
  addCourseFavorite, addTopicFavorite, listFavoriteTargetIds, removeCourseFavorite, removeTopicFavorite,
} from '../api/favorite.service'
import type { FavoriteKind } from '../types/favorite.types'

type ByKind<T> = Record<FavoriteKind, T>

interface FavoritesState {
  // IDs de destino marcados como favoritos según la API; null = aún no cargados.
  ids: ByKind<ReadonlySet<number> | null>
  loadErrors: ByKind<ApiError | null>
  // Operaciones en curso por `${kind}:${id}`.
  pending: Record<string, boolean>
  ensure: (kind: FavoriteKind) => Promise<void>
  toggle: (kind: FavoriteKind, id: number) => Promise<boolean>
  reset: () => void
}

const empty = () => ({
  ids: { course: null, topic: null } as ByKind<ReadonlySet<number> | null>,
  loadErrors: { course: null, topic: null } as ByKind<ApiError | null>,
  pending: {},
})

// Una sola carga por tipo y sesión, compartida por todos los botones de la pantalla.
let loads: Partial<ByKind<Promise<void>>> = {}
let generation = 0

const withId = (set: ReadonlySet<number> | null, id: number, favorite: boolean) => {
  const next = new Set(set ?? [])
  if (favorite) next.add(id)
  else next.delete(id)
  return next
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  ...empty(),

  ensure: (kind) => {
    if (get().ids[kind]) return Promise.resolve()
    const running = loads[kind]
    if (running) return running
    const current = generation
    const load = listFavoriteTargetIds(kind)
      .then((ids) => {
        if (current !== generation) return
        set((state) => ({ ids: { ...state.ids, [kind]: new Set(ids) }, loadErrors: { ...state.loadErrors, [kind]: null } }))
      })
      .catch((failure: unknown) => {
        if (current !== generation) return
        set((state) => ({ loadErrors: { ...state.loadErrors, [kind]: toApiError(failure) } }))
      })
      .finally(() => { if (current === generation) delete loads[kind] })
    loads[kind] = load
    return load
  },

  toggle: async (kind, id) => {
    const key = `${kind}:${id}`
    if (get().pending[key]) return get().ids[kind]?.has(id) ?? false
    const favorite = !(get().ids[kind]?.has(id) ?? false)
    const current = generation
    set((state) => ({ pending: { ...state.pending, [key]: true } }))
    try {
      if (kind === 'course') await (favorite ? addCourseFavorite(id) : removeCourseFavorite(id))
      else await (favorite ? addTopicFavorite(id) : removeTopicFavorite(id))
      // Solo se refleja lo que la API confirmó.
      if (current === generation) set((state) => ({ ids: { ...state.ids, [kind]: withId(state.ids[kind], id, favorite) } }))
      return favorite
    } finally {
      if (current === generation) set((state) => {
        const pending = { ...state.pending }
        delete pending[key]
        return { pending }
      })
    }
  },

  reset: () => {
    generation += 1
    loads = {}
    set(empty())
  },
}))

// Otra sesión (logout, cambio de usuario o token) no debe heredar los favoritos cargados.
useAuthStore.subscribe((state, previous) => {
  if (state.token !== previous.token || state.user?.workspace_user_id !== previous.user?.workspace_user_id) {
    useFavoritesStore.getState().reset()
  }
})
