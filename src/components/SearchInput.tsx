import { type ChangeEvent, useEffect, useEffectEvent, useState } from 'react'
import { DataIcons, Field } from 'ucebul_mui'
import { maxLength } from '../lib/validators'

export const SEARCH_MAX_LENGTH = 100
export const SEARCH_DEBOUNCE_MS = 400
const searchValidator = maxLength(SEARCH_MAX_LENGTH, `La búsqueda admite máximo ${SEARCH_MAX_LENGTH} caracteres.`)

interface Props {
  id: string
  label: string
  // Término aplicado (normalmente leído de la URL).
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  delay?: number
}

// Buscador con debounce: aplica el término cuando se deja de escribir. La cancelación de la
// solicitud anterior la hace quien consulta (useRequest aborta al cambiar la clave).
export default function SearchInput({ id, label, value, onSearch, placeholder, delay = SEARCH_DEBOUNCE_MS }: Props) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  // Si el término aplicado cambia desde fuera (atrás, limpiar filtros), el campo lo refleja.
  // No se reescribe mientras coincide con lo escrito para no borrar espacios al teclear.
  if (synced !== value) {
    setSynced(value)
    if (value !== text.trim()) setText(value)
  }
  const commit = useEffectEvent(onSearch)

  useEffect(() => {
    const next = text.trim()
    if (next === value || next.length > SEARCH_MAX_LENGTH) return
    const timer = window.setTimeout(() => commit(next), delay)
    return () => window.clearTimeout(timer)
  }, [text, value, delay])

  return (
    <Field id={id} name={id} label={label} component="input" type="search" icon={DataIcons.forms.search}
      placeholder={placeholder} value={text} validator={searchValidator}
      onChange={(event: ChangeEvent<HTMLInputElement>) => setText(event.target.value)} />
  )
}
