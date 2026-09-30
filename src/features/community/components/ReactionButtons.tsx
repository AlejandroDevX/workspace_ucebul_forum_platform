import { useState } from 'react'
import { Button, DataIcons } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { reactToPost, removeReaction } from '../api/post.service'
import type { ForumPost, ForumReactionType } from '../types/community.types'
import { applyReaction } from '../utils/community-format'

// Votar, cambiar el voto o retirarlo pulsando el voto activo. Solo cambia con la respuesta de la API.
export default function ReactionButtons({ post, canReact, onChange }: { post: ForumPost; canReact: boolean; onChange: (post: ForumPost) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = post.user_reaction?.forum_reaction_type ?? null

  async function vote(type: ForumReactionType) {
    setBusy(true)
    setError(null)
    try {
      if (current === type) {
        await removeReaction(post.forum_post_id)
        onChange(applyReaction(post, null))
      } else {
        onChange(applyReaction(post, await reactToPost(post.forum_post_id, type)))
      }
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(false)
    }
  }

  const button = (type: ForumReactionType, count: number, label: string) => (
    <Button size="md" variant={current === type ? 'primary--outline' : 'default'}
      className={`reaction-button reaction-button--${type} ${current === type ? 'is-active' : ''}`}
      aria-pressed={current === type} disabled={!canReact || busy} onClick={() => void vote(type)}
      title={canReact ? (current === type ? 'Quitar mi voto' : label) : 'No tienes permiso para votar'}>
      <span aria-hidden="true">{DataIcons.navigation.arrowDown}</span>
      <span className="sr-only">{label}: </span>{count}
    </Button>
  )

  return (
    <div className="reaction-buttons" role="group" aria-label="Votos de la respuesta" aria-busy={busy}>
      {button('upvote', post.forum_post_upvotes_count ?? 0, 'Útil')}
      {button('downvote', post.forum_post_downvotes_count ?? 0, 'No útil')}
      {error && <span className="reaction-buttons__error" role="alert">{error}</span>}
    </div>
  )
}
