import { type ChangeEvent, useMemo, useState } from 'react'
import { Button, Field, Form, type FormOption } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { compose, maxLength, required } from '../../../lib/validators'
import { uploadLessonResource } from '../api/lesson-resource.service'
import type { ForumLessonResource, ForumLessonResourceType } from '../types/lesson.types'
import { RESOURCE_RULES, RESOURCE_TYPES, resourceFileProblem } from '../utils/resource-rules'

const titleValidator = compose(required('Escribe un título para el recurso.'), maxLength(255, 'El título admite máximo 255 caracteres.'))
const fileValidator = required('Selecciona el archivo que quieres adjuntar.')
const typeValidator = required('Selecciona el tipo de recurso.')

export default function ResourceUploadForm({ lessonId, onUploaded }: { lessonId: number; onUploaded: (resource: ForumLessonResource) => void }) {
  const [formKey, setFormKey] = useState(0)
  const [type, setType] = useState<ForumLessonResourceType>('video')
  const [title, setTitle] = useState('')
  const [downloadable, setDownloadable] = useState(false)
  // El archivo binario se conserva aquí: Field upload solo registra su nombre en el Form.
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const typeItems = useMemo<FormOption[]>(() => RESOURCE_TYPES.map((value) => ({ label: RESOURCE_RULES[value].label, value })), [])
  const fileProblem = file ? resourceFileProblem(type, file) : null
  const uploading = progress !== null

  function clearField(name: string) {
    setError((current) => {
      if (!current?.fieldErrors[name]) return current
      const fieldErrors = { ...current.fieldErrors }
      delete fieldErrors[name]
      return { ...current, fieldErrors }
    })
  }

  function onFile(files: File[]) {
    clearField('file')
    const selected = files[0] ?? null
    setFile(selected)
    if (selected && !title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, '').slice(0, 255))
  }

  async function onSubmit(values: Record<string, unknown>) {
    if (!file || fileProblem) return
    setError(null)
    setProgress(0)
    try {
      const resource = await uploadLessonResource(lessonId, {
        forum_lesson_resource_type: type,
        forum_lesson_resource_title: String(values.forum_lesson_resource_title ?? '').trim(),
        forum_lesson_resource_is_downloadable: downloadable,
        file,
      }, setProgress)
      onUploaded(resource)
      setFile(null)
      setTitle('')
      setDownloadable(false)
      setFormKey((key) => key + 1)
    } catch (failure) {
      setError(toApiError(failure))
    } finally {
      setProgress(null)
    }
  }

  const fieldErrors = error?.fieldErrors ?? {}

  return (
    <Form key={formKey} className="stacked-form resource-upload" onSubmit={(values) => void onSubmit(values)}>
      {error && <div className="auth-error" role="alert">{error.status === 422 ? 'Revisa los campos marcados.' : error.message}</div>}
      <fieldset disabled={uploading} className="form-grid form-grid--two">
        <legend>Adjuntar recurso</legend>
        <div>
          <Field id="forum_lesson_resource_type" name="forum_lesson_resource_type" label="Tipo" component="select"
            items={typeItems} value={type} validator={typeValidator} disabled={uploading}
            onChange={(option: FormOption) => { clearField('forum_lesson_resource_type'); setType(option.value as ForumLessonResourceType) }} />
          <FieldErrors messages={fieldErrors.forum_lesson_resource_type} />
        </div>
        <div>
          <Field id="forum_lesson_resource_title" name="forum_lesson_resource_title" label="Título" component="input" type="text"
            value={title} validator={titleValidator}
            onChange={(event: ChangeEvent<HTMLInputElement>) => { clearField('forum_lesson_resource_title'); setTitle(event.target.value) }} />
          <FieldErrors messages={fieldErrors.forum_lesson_resource_title} />
        </div>
        <div className="form-grid__full">
          <Field id="forum_lesson_resource_file" name="forum_lesson_resource_file" label="Archivo" component="upload"
            allowedFileTypes={RESOURCE_RULES[type].extensions} validator={fileValidator} disabled={uploading}
            smallText={RESOURCE_RULES[type].hint} onChange={onFile} />
          {fileProblem && <p className="field-server-error" role="alert">{fileProblem}</p>}
          <FieldErrors messages={fieldErrors.file} />
        </div>
        <div className="form-grid__full">
          <Field id="forum_lesson_resource_is_downloadable" name="forum_lesson_resource_is_downloadable" label="Permitir descarga a los estudiantes"
            component="checkbox" value={downloadable} disabled={uploading}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDownloadable(event.target.checked)} />
          <FieldErrors messages={fieldErrors.forum_lesson_resource_is_downloadable} />
        </div>
      </fieldset>
      {uploading && <div className="upload-progress" role="status">
        <progress max={100} value={progress ?? 0} aria-label="Progreso de la carga" />
        <span>Subiendo… {progress}%</span>
      </div>}
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={uploading} disabled={uploading || Boolean(fileProblem)}>
          {uploading ? 'Subiendo…' : 'Adjuntar recurso'}</Button>
      </div>
    </Form>
  )
}
