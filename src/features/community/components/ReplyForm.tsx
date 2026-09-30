import { type ReactNode, useState } from 'react'
import { Button, DataIcons, Field, Form } from 'ucebul_mui'
import ButtonIcon from '../../../components/ButtonIcon'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { createPost, updatePost } from '../api/post.service'
import type { ForumPost } from '../types/community.types'
import { POST_MAX_LENGTH, postValidator } from '../utils/community-validators'

interface Props {
  topicId: number
  // Respuesta a otra respuesta.
  parentId?: number
  // Edición de una respuesta propia.
  post?: ForumPost
  label?: string
  submitLabel?: string
  placeholder?: string
  // Texto de ayuda bajo el campo, junto al contador de caracteres.
  hint?: string
  submitIcon?: ReactNode
  onSaved: (post: ForumPost) => void
  onCancel?: () => void
}

export default function ReplyForm({ topicId, parentId, post, label = 'Tu respuesta', submitLabel = 'Publicar respuesta', placeholder, hint, submitIcon, onSaved, onCancel }: Props) {
  const [formKey, setFormKey] = useState(0)
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)
  const [length, setLength] = useState(post?.forum_post_body.length ?? 0)
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
      if (!post) {
        setFormKey((key) => key + 1)
        setLength(0)
      }
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
          placeholder={placeholder} validator={postValidator} disabled={saving}
          onChange={(event: { target: HTMLTextAreaElement }) => {
            setLength(event.target.value.length)
            setError((current) => current && { ...current, fieldErrors: {} })
          }} />
        <FieldErrors messages={error?.fieldErrors.forum_post_body} />
        <div className="reply-form__hint">
          {hint && <span><span aria-hidden="true">{DataIcons.alert.info}</span>{hint}</span>}
          <span className="reply-form__count">{length.toLocaleString('es-CO')}/{POST_MAX_LENGTH.toLocaleString('es-CO')}</span>
        </div>
      </fieldset>
      <div className="reply-form__actions">
        <Button type="submit" size={submitIcon ? 'lg' : 'sm'} variant="primary" loading={saving} disabled={saving}>
          {submitIcon && <ButtonIcon icon={submitIcon} />}{saving ? 'Enviando…' : submitLabel}</Button>
        {onCancel && <Button size="sm" variant="default" disabled={saving} onClick={onCancel}>Cancelar</Button>}
      </div>
    </Form>
  )
}
