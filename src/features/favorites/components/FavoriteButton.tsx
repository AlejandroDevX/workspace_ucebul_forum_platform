import { useEffect, useState } from 'react'
import { DataIcons, IconButton } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { useFavoritesStore } from '../store/favorites.store'
import type { FavoriteKind } from '../types/favorite.types'
import { useFavoritePermissions } from '../utils/useFavoritePermissions'

interface Props {
  kind: FavoriteKind
  id: number
  title: string
  // Tras confirmar el cambio en la API.
  onChange?: (favorite: boolean) => void
  className?: string
}

export default function FavoriteButton({ kind, id, title, onChange, className = '' }: Props) {
  const allowed = useFavoritePermissions()[kind]
  const ids = useFavoritesStore((state) => state.ids[kind])
  const loadError = useFavoritesStore((state) => state.loadErrors[kind])
  const pending = useFavoritesStore((state) => Boolean(state.pending[`${kind}:${id}`]))
  const ensure = useFavoritesStore((state) => state.ensure)
  const toggle = useFavoritesStore((state) => state.toggle)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (allowed) void ensure(kind) }, [allowed, ensure, kind])
  if (!allowed) return null

  const known = ids !== null
  const favorite = ids?.has(id) ?? false
  const label = !known
    ? loadError ? `Reintentar consultar si «${title}» está en favoritos` : 'Consultando favoritos…'
    : favorite ? `Quitar «${title}» de favoritos` : `Guardar «${title}» en favoritos`

  async function onClick() {
    setError(null)
    if (!known) return void ensure(kind)
    try {
      // No usar onChange?.(await toggle(...)): sin onChange el argumento no se evalúa y no se llama a la API.
      const saved = await toggle(kind, id)
      onChange?.(saved)
    } catch (failure) {
      const apiError = toApiError(failure)
      setError(apiError.status === 404 ? 'Ya no está disponible.' : apiError.message)
    }
  }

  return (
    <span className={`favorite-button ${favorite ? 'is-favorite' : ''} ${className}`}>
      <IconButton size="sm" icon={DataIcons.global.bookmarkOutline} label={label} title={label}
        aria-pressed={known ? favorite : undefined} disabled={(!known && !loadError) || pending} onClick={() => void onClick()} />
      {error && <span className="favorite-button__error" role="alert">{error}</span>}
    </span>
  )
}
