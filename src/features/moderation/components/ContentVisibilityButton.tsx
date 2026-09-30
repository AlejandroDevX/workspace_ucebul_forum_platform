import { useState } from 'react'
import { Button, Dialog } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import type { ForumPost, ForumTopic } from '../../community/types/community.types'
import { hidePost, hideTopic, restorePost, restoreTopic } from '../api/moderation.service'
import { useModerationPermissions } from '../utils/useModerationPermissions'

type Props =
  | { kind: 'topic'; id: number; hidden: boolean; onChanged: (topic: ForumTopic) => void; size?: 'sm' | 'md' }
  | { kind: 'post'; id: number; hidden: boolean; onChanged: (post: ForumPost) => void; size?: 'sm' | 'md' }

const COPY = {
  topic: {
    hide: ['Ocultar pregunta', 'La pregunta dejará de verse en el foro. Solo su autor y quienes gestionan la comunidad podrán consultarla.'],
    restore: ['Restaurar pregunta', 'La pregunta volverá a estar visible y abierta en el foro.'],
  },
  post: {
    hide: ['Ocultar respuesta', 'La respuesta dejará de verse en la conversación. Solo su autor y quienes gestionan la comunidad podrán consultarla.'],
    restore: ['Restaurar respuesta', 'La respuesta volverá a estar visible en la conversación.'],
  },
} as const

// Ocultar o restaurar contenido (forum.moderation.manage) siempre con confirmación previa.
export default function ContentVisibilityButton(props: Props) {
  const { canManage } = useModerationPermissions()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!canManage) return null

  const action = props.hidden ? 'restore' : 'hide'
  const [title, text] = COPY[props.kind][action]

  async function run() {
    setConfirm(false)
    setBusy(true)
    setError(null)
    try {
      if (props.kind === 'topic') props.onChanged(props.hidden ? await restoreTopic(props.id) : await hideTopic(props.id))
      else props.onChanged(props.hidden ? await restorePost(props.id) : await hidePost(props.id))
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button size={props.size ?? 'sm'} variant={props.hidden ? 'primary--outline' : 'danger--outline'} loading={busy} disabled={busy}
        onClick={() => setConfirm(true)}>{props.hidden ? 'Restaurar' : 'Ocultar'}</Button>
      {error && <p className="auth-error content-visibility-error" role="alert">{error}</p>}
      <Dialog open={confirm} typeDialog={props.hidden ? 'info' : 'warning'} titleDialog={title} textDialog={text}
        buttonCancelDialog="Cancelar" buttonConfirmDialog={props.hidden ? 'Restaurar' : 'Ocultar'}
        onCancelDialog={() => setConfirm(false)} callbackDialog={() => void run()} />
    </>
  )
}
