import type { ReactNode } from 'react'

// Icono de DataIcons delante del texto de un Button de ucebul_mui.
export default function ButtonIcon({ icon }: { icon: ReactNode }) {
  return <span className="button-icon" aria-hidden="true">{icon}</span>
}
