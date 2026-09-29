import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { forumApi } from '../src/lib/api'
import { searchCourses, uploadCourseCover, createCourse } from '../src/features/courses/api/course.service'
import { listAllCourseCategories } from '../src/features/courses/api/course-category.service'
import { coverProblem, toCoursePayload } from '../src/features/courses/utils/course-payload'
import { formatDuration, slugify } from '../src/features/courses/utils/course-format'
import { integerInRange, required } from '../src/lib/validators'

function respond(config: InternalAxiosRequestConfig, data: unknown) {
  return Promise.resolve({ config, status: 200, statusText: 'OK', headers: {}, data })
}
const page = (data: unknown[], current = 1, last = 1) => ({ data, meta: { current_page: current, last_page: last, from: null, to: null, per_page: 100, total: data.length } })

test('toCoursePayload convierte los valores de Form al DTO de Laravel', () => {
  const payload = toCoursePayload({
    forum_course_title: '  Riego por goteo ',
    forum_course_summary: '   ',
    forum_course_description: 'Detalle',
    forum_course_category_id: '3',
    forum_course_duration_minutes: '90',
  }, 'riego-por-goteo', 'Básico')
  assert.deepEqual(payload, {
    forum_course_category_id: 3,
    forum_course_title: 'Riego por goteo',
    forum_course_slug: 'riego-por-goteo',
    forum_course_summary: null,
    forum_course_description: 'Detalle',
    forum_course_level: 'Básico',
    forum_course_duration_minutes: 90,
  })
  assert.equal(typeof payload.forum_course_category_id, 'number')
  assert.equal(toCoursePayload({ forum_course_category_id: 1 }, 'x', '').forum_course_level, null)
  assert.equal(toCoursePayload({ forum_course_category_id: 1 }, 'x', '').forum_course_duration_minutes, 0)
})

test('crear curso envía JSON sin campos prohibidos por la API', async () => {
  let body: Record<string, unknown> = {}
  forumApi.defaults.adapter = (config) => {
    assert.equal(config.url, '/forum/courses')
    body = JSON.parse(config.data)
    return respond(config, { success: true, message: 'ok', data: { forum_course_id: 7 } })
  }
  const created = await createCourse(toCoursePayload({ forum_course_title: 'A', forum_course_category_id: '2' }, 'a', ''))
  assert.equal(created.forum_course_id, 7)
  for (const forbidden of ['forum_course_status', 'forum_course_cover_path', 'forum_course_instructor_workspace_user_id']) {
    assert.equal(forbidden in body, false)
  }
})

test('la portada se envía como FormData con el archivo real en el campo cover', async () => {
  const file = new File(['imagen'], 'portada.png', { type: 'image/png' })
  forumApi.defaults.adapter = (config) => {
    assert.equal(config.url, '/forum/courses/5/cover')
    assert.ok(config.data instanceof FormData)
    assert.equal((config.data as FormData).get('cover'), file)
    return respond(config, { success: true, message: 'ok', data: { forum_course_id: 5 } })
  }
  await uploadCourseCover(5, file)
})

test('coverProblem valida tipo y tamaño de la portada', () => {
  assert.equal(coverProblem(new File(['x'], 'a.webp', { type: 'image/webp' })), null)
  assert.match(coverProblem(new File(['x'], 'a.gif', { type: 'image/gif' })) ?? '', /JPG, PNG o WebP/)
  assert.match(coverProblem(new File([new Uint8Array(5120 * 1024 + 1)], 'a.png', { type: 'image/png' })) ?? '', /5 MB/)
})

test('el catálogo usa la búsqueda con filtros y omite los vacíos', async () => {
  forumApi.defaults.adapter = (config) => {
    assert.equal(config.url, '/forum/search/courses')
    assert.deepEqual(config.params, { page: 2, per_page: 12, forum_course_category_id: 4, search: undefined })
    return respond(config, page([]))
  }
  await searchCourses({ page: 2, per_page: 12, forum_course_category_id: 4, search: undefined })
})

test('las categorías para selects recorren todas las páginas', async () => {
  const pages: number[] = []
  forumApi.defaults.adapter = (config) => {
    pages.push(config.params.page)
    return respond(config, page([{ forum_course_category_id: config.params.page }], config.params.page, 3))
  }
  const categories = await listAllCourseCategories()
  assert.deepEqual(pages, [1, 2, 3])
  assert.equal(categories.length, 3)
})

test('slugify, duración y validadores', () => {
  assert.equal(slugify('  Manejo de Pastos: ¿Cómo empezar?  '), 'manejo-de-pastos-como-empezar')
  assert.equal(formatDuration(0), 'Duración por definir')
  assert.equal(formatDuration(90), '1 h 30 min')
  assert.equal(required()(''), 'Este campo es obligatorio.')
  assert.equal(required()(3), null)
  const duration = integerInRange(0, 10)
  assert.equal(duration(''), null)
  assert.equal(duration('5'), null)
  assert.notEqual(duration('5.5'), null)
  assert.notEqual(duration('-1'), null)
  assert.notEqual(duration('11'), null)
})
