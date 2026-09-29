import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dialog } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { archiveCourse, deleteCourse, publishCourse } from '../api/course.service'
import type { ForumCourse } from '../types/course.types'
import { useCoursePermissions } from '../utils/useCoursePermissions'

interface Props {
  course: ForumCourse
  onUpdated: (course: ForumCourse) => void
  onDeleted: () => void
  size?: 'sm' | 'md'
}

type Action = 'publish' | 'archive' | 'delete'

export default function CourseActions({ course, onUpdated, onDeleted, size = 'md' }: Props) {
  const navigate = useNavigate()
  const { canUpdate, canDelete, canPublish } = useCoursePermissions()
  const [busy, setBusy] = useState<Action | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editable = canUpdate(course)
  const publishable = canPublish(course)
  const deletable = canDelete(course)
  if (!editable && !publishable && !deletable) return null

  async function run(action: Action) {
    setBusy(action)
    setError(null)
    try {
      if (action === 'delete') {
        await deleteCourse(course.forum_course_id)
        onDeleted()
        return
      }
      onUpdated(action === 'publish' ? await publishCourse(course.forum_course_id) : await archiveCourse(course.forum_course_id))
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="course-actions">
      <div className="course-actions__buttons">
        {editable && <Button size={size} variant="primary--outline" disabled={busy !== null}
          onClick={() => navigate(`/admin/courses/${course.forum_course_id}/edit`)}>Editar</Button>}
        {publishable && course.forum_course_status !== 'published' && <Button size={size} variant="primary"
          loading={busy === 'publish'} disabled={busy !== null} onClick={() => void run('publish')}>Publicar</Button>}
        {publishable && course.forum_course_status === 'published' && <Button size={size} variant="secondary--outline"
          loading={busy === 'archive'} disabled={busy !== null} onClick={() => void run('archive')}>Archivar</Button>}
        {deletable && <Button size={size} variant="danger--outline" loading={busy === 'delete'} disabled={busy !== null}
          onClick={() => setConfirmDelete(true)}>Eliminar</Button>}
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <Dialog open={confirmDelete} typeDialog="danger" titleDialog="Eliminar curso"
        textDialog={`¿Seguro que quieres eliminar «${course.forum_course_title}»? Dejará de estar disponible para los estudiantes.`}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => setConfirmDelete(false)}
        callbackDialog={() => { setConfirmDelete(false); void run('delete') }} />
    </div>
  )
}
