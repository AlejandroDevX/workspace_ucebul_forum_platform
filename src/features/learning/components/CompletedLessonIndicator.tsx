import { DataIcons } from 'ucebul_mui'

export default function CompletedLessonIndicator({ completed }: { completed: boolean }) {
  return (
    <span className={`completed-indicator ${completed ? 'is-completed' : ''}`} title={completed ? 'Completada' : 'Pendiente'}>
      <span aria-hidden="true">{completed ? DataIcons.global.checkOutline : null}</span>
      <span className="sr-only">{completed ? 'Completada' : 'Pendiente'}</span>
    </span>
  )
}
