import { useState } from 'react'
import { Button, Field, Form } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { createPost, updatePost } from '../api/post.service'
import type { ForumPost } from '../types/community.types'
import { postValidator } from '../utils/community-validators'

interface Props {
  topicId: number
  // Respuesta a otra respuesta.
  parentId?: number
  // Edición de una respuesta propia.
  post?: ForumPost
  label?: string
  submitLabel?: string
  onSaved: (post: ForumPost) => void
  onCancel?: () => void
}

export default function ReplyForm({ topicId, parentId, post, label = 'Tu respuesta', submitLabel = 'Publicar respuesta', onSaved, onCancel }: Props) {
  const [formKey, setFormKey] = useState(0)
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)
  const id = `forum_post_body_${post?.forum_post_id ?? `new_${parentId ?? 'root'}`}`

  async function onSubmit(values: Record<string, unknown>) {
    const body = String(values.forum_post_body ?? '').trim()
    setSaving(true)
    setError(null)
    try {
      const saved = post
        ? await updatePost(post.forum_post_id, { forum_post_body: body })
        : await createPost(topicId, parentId ? { forum_post_body: body, forum_post_parent_id: parentId } : { forum_post_body: body })
      onSaved(saved)
      if (!post) setFormKey((key) => key + 1)
    } catch (failure) {
      setError(toApiError(failure))
    } finally {
      setSaving(false)
    }
  }

  const otherErrors = Object.entries(error?.fieldErrors ?? {}).filter(([name]) => name !== 'forum_post_body').flatMap(([, messages]) => messages)

  return (
    <Form key={formKey} className="reply-form" onSubmit={(values) => void onSubmit(values)}>
      {error && <div className="auth-error" role="alert">
        {error.status === 422 && !otherErrors.length ? 'Revisa tu respuesta.' : otherErrors[0] ?? error.message}
      </div>}
      <fieldset disabled={saving}>
        <legend className="sr-only">{label}</legend>
        <Field id={id} name="forum_post_body" label={label} component="textarea" value={post?.forum_post_body ?? ''}
          validator={postValidator} disabled={saving}
          onChange={() => setError((current) => current && { ...current, fieldErrors: {} })} />
        <FieldErrors messages={error?.fieldErrors.forum_post_body} />
      </fieldset>
      <div className="reply-form__actions">
        <Button type="submit" size="sm" variant="primary" loading={saving} disabled={saving}>{saving ? 'Enviando…' : submitLabel}</Button>
        {onCancel && <Button size="sm" variant="default" disabled={saving} onClick={onCancel}>Cancelar</Button>}
      </div>
    </Form>
  )
}
