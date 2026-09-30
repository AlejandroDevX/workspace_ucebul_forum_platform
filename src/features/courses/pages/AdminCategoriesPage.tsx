import { type ChangeEvent, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, CardBody, CardHeader, DataIcons, Empty, Field, Form, Spinner, Table } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { compose, matches, maxLength, required } from '../../../lib/validators'
import { useAuthStore } from '../../auth/store/auth.store'
import { createCourseCategory, listCourseCategories, updateCourseCategory } from '../api/course-category.service'
import type { ForumCourseCategory, ForumCourseCategoryPayload } from '../types/course.types'
import { SLUG_PATTERN, slugify } from '../utils/course-format'

const PER_PAGE = 20

const COLUMNS = [
  { key: 'name', name: 'Categoría' },
  { key: 'slug', name: 'Identificador' },
  { key: 'status', name: 'Estado', width: '100px' },
  { key: 'actions', name: <span className="sr-only">Acciones</span>, width: '90px' },
]

const validators = {
  name: compose(required('Escribe el nombre de la categoría.'), maxLength(160, 'El nombre admite máximo 160 caracteres.')),
  slug: compose(required('Define el identificador.'), maxLength(160, 'El identificador admite máximo 160 caracteres.'),
    matches(SLUG_PATTERN, 'Usa solo minúsculas, números y guiones entre palabras.')),
  description: maxLength(16000, 'La descripción admite máximo 16.000 caracteres.'),
}

export default function AdminCategoriesPage() {
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('page'))
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1
  useAuthStore((state) => state.currentApplicationPermissions)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canCreate = hasPermission('forum.courses.create')
  const canUpdate = hasPermission('forum.courses.update')
  const [editing, setEditing] = useState<ForumCourseCategory | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const categories = useRequest(`categories-${page}`, (signal) => listCourseCategories({ page, per_page: PER_PAGE }, signal))
  const result = categories.data
  const showForm = editing ? canUpdate : canCreate

  function saved(category: ForumCourseCategory, created: boolean) {
    setNotice(created ? `Categoría «${category.forum_course_category_name}» creada.` : `Categoría «${category.forum_course_category_name}» actualizada.`)
    setEditing(null)
    categories.reload()
  }

  return (
    <section className="page-section" aria-labelledby="categories-title">
      <p className="eyebrow">Administración</p>
      <h1 id="categories-title">Categorías de cursos</h1>
      <p className="page-intro">Organiza los cursos por temáticas. Las categorías inactivas se conservan para los cursos que ya las usan.</p>
      {notice && <p className="notice" role="status">{notice}</p>}

      <div className={`categories-layout ${showForm ? '' : 'categories-layout--single'}`}>
        <div aria-live="polite" aria-busy={categories.loading}>
          {categories.loading && <div className="loading-block"><Spinner label="Cargando categorías…" /></div>}
          {!categories.loading && categories.error && <div className="auth-error load-error" role="alert"><p>{categories.error.message}</p>
            <Button size="sm" onClick={categories.reload}>Reintentar</Button></div>}
          {!categories.loading && !categories.error && result && (result.data.length === 0
            ? <Empty icon={DataIcons.navigation.tableOutline} title="Aún no hay categorías"
                text={canCreate ? 'Crea la primera con el formulario.' : 'Todavía no se han creado categorías.'}
                buttonIcon={DataIcons.global.reloadOutline} buttonText="Actualizar" onClickButton={categories.reload} />
            : <div className="admin-table">
                <Table columns={COLUMNS} currentPage={result.meta.current_page} totalPages={Math.max(result.meta.last_page, 1)}
                  onChangePage={(next) => { if (next >= 1 && next <= result.meta.last_page) setParams({ page: String(next) }) }}
                  data={result.data.map((category) => ({
                    name: <div className="report-cell">
                      <strong>{category.forum_course_category_name}</strong>
                      {category.forum_course_category_description && <span className="muted">{category.forum_course_category_description}</span>}
                    </div>,
                    slug: <code>{category.forum_course_category_slug}</code>,
                    status: <Badge variant={category.forum_course_category_is_active ? 'success' : 'default'}>
                      {category.forum_course_category_is_active ? 'Activa' : 'Inactiva'}</Badge>,
                    actions: canUpdate && <Button size="sm" variant="primary--outline"
                      aria-pressed={editing?.forum_course_category_id === category.forum_course_category_id}
                      onClick={() => { setNotice(null); setEditing(category) }}>Editar</Button>,
                  }))} />
              </div>)}
        </div>

        {showForm && <CategoryForm key={editing?.forum_course_category_id ?? 'new'} category={editing}
          onSaved={saved} onCancel={editing && canCreate ? () => setEditing(null) : undefined} />}
      </div>
    </section>
  )
}

function CategoryForm({ category, onSaved, onCancel }: {
  category: ForumCourseCategory | null
  onSaved: (category: ForumCourseCategory, created: boolean) => void
  onCancel?: () => void
}) {
  const [slug, setSlug] = useState(category?.forum_course_category_slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(category))
  const [active, setActive] = useState(category?.forum_course_category_is_active ?? true)
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)

  function clearField(name: string) {
    setError((current) => {
      if (!current?.fieldErrors[name]) return current
      const fieldErrors = { ...current.fieldErrors }
      delete fieldErrors[name]
      return { ...current, fieldErrors }
    })
  }

  async function onSubmit(values: Record<string, unknown>) {
    const description = String(values.forum_course_category_description ?? '').trim()
    const payload: ForumCourseCategoryPayload = {
      forum_course_category_name: String(values.forum_course_category_name ?? '').trim(),
      forum_course_category_slug: slug.trim(),
      forum_course_category_description: description || null,
      forum_course_category_is_active: active,
    }
    setSaving(true)
    setError(null)
    try {
      const result = category
        ? await updateCourseCategory(category.forum_course_category_id, payload)
        : await createCourseCategory(payload)
      onSaved(result, !category)
    } catch (failure) {
      setError(toApiError(failure))
      setSaving(false)
    }
  }

  const fieldErrors = error?.fieldErrors ?? {}

  return (
    <Card className="form-card category-form">
      <CardHeader><h2>{category ? 'Editar categoría' : 'Nueva categoría'}</h2></CardHeader>
      <CardBody>
        <Form className="stacked-form" onSubmit={(values) => void onSubmit(values)}>
          {error && <div className="auth-error" role="alert">{error.status === 422 ? 'Revisa los campos marcados.' : error.message}</div>}
          <fieldset disabled={saving}>
            <legend className="sr-only">Datos de la categoría</legend>
            <div>
              <Field id="forum_course_category_name" name="forum_course_category_name" label="Nombre" component="input" type="text"
                value={category?.forum_course_category_name ?? ''} validator={validators.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  clearField('forum_course_category_name')
                  if (!slugTouched) setSlug(slugify(event.target.value, 160))
                }} />
              <FieldErrors messages={fieldErrors.forum_course_category_name} />
            </div>
            <div>
              <Field id="forum_course_category_slug" name="forum_course_category_slug" label="Identificador" component="input" type="text"
                value={slug} validator={validators.slug} smallText="Único. Solo minúsculas, números y guiones."
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  clearField('forum_course_category_slug')
                  setSlugTouched(true)
                  setSlug(event.target.value)
                }} />
              <FieldErrors messages={fieldErrors.forum_course_category_slug} />
            </div>
            <div>
              <Field id="forum_course_category_description" name="forum_course_category_description" label="Descripción (opcional)"
                component="textarea" value={category?.forum_course_category_description ?? ''} validator={validators.description}
                onChange={() => clearField('forum_course_category_description')} />
              <FieldErrors messages={fieldErrors.forum_course_category_description} />
            </div>
            <div>
              <Field id="forum_course_category_is_active" name="forum_course_category_is_active" label="Categoría activa"
                component="checkbox" value={active} disabled={saving}
                onChange={(event: ChangeEvent<HTMLInputElement>) => { clearField('forum_course_category_is_active'); setActive(event.target.checked) }} />
              <FieldErrors messages={fieldErrors.forum_course_category_is_active} />
            </div>
          </fieldset>
          <div className="form-actions">
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {saving ? 'Guardando…' : category ? 'Guardar cambios' : 'Crear categoría'}</Button>
            {onCancel && <Button variant="default" disabled={saving} onClick={onCancel}>Cancelar</Button>}
          </div>
        </Form>
      </CardBody>
    </Card>
  )
}
