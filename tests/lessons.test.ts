import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { forumApi } from '../src/lib/api'
import { toApiError } from '../src/lib/api-error'
import { createLesson, listAllCourseLessons, reorderLessons } from '../src/features/lessons/api/lesson.service'
import { fetchLessonResource, uploadLessonResource } from '../src/features/lessons/api/lesson-resource.service'
import { moveLesson, toLessonPayload } from '../src/features/lessons/utils/lesson-payload'
import { downloadName, formatBytes, resourceFileProblem } from '../src/features/lessons/utils/resource-rules'

const respond = (config: InternalAxiosRequestConfig, data: unknown, status = 200) =>
  Promise.resolve({ config, status, statusText: 'OK', headers: {}, data })

test('toLessonPayload normaliza valores y nunca envía posición, estado ni curso', () => {
  const payload = toLessonPayload({ forum_lesson_title: ' Ley de Ohm ', forum_lesson_body: '  ', forum_lesson_duration_minutes: '15', forum_lesson_position: '2' }, 'ley-de-ohm', true)
  assert.deepEqual(payload, {
    forum_lesson_title: 'Ley de Ohm', forum_lesson_slug: 'ley-de-ohm', forum_lesson_body: null,
    forum_lesson_duration_minutes: 15, forum_lesson_is_preview: true,
  })
  for (const forbidden of ['forum_lesson_position', 'forum_lesson_status', 'forum_lesson_course_id']) assert.equal(forbidden in payload, false)
})

test('moveLesson reubica una lección conservando todos los IDs', () => {
  assert.deepEqual(moveLesson([1, 2, 3, 4], 4, 1), [4, 1, 2, 3])
  assert.deepEqual(moveLesson([1, 2, 3, 4], 1, 3), [2, 3, 1, 4])
  assert.deepEqual(moveLesson([1, 2, 3], 2, 99), [1, 3, 2])
})

test('crear lección y reordenar usan las rutas y cuerpos del contrato', async () => {
  const calls: Array<{ method?: string; url?: string; body: unknown }> = []
  forumApi.defaults.adapter = (config) => {
    calls.push({ method: config.method, url: config.url, body: JSON.parse(config.data) })
    return respond(config, { success: true, message: 'ok', data: config.url?.endsWith('reorder') ? [] : { forum_lesson_id: 9 } })
  }
  await createLesson(3, toLessonPayload({ forum_lesson_title: 'A' }, 'a', false))
  await reorderLessons(3, [2, 9, 1])
  assert.equal(calls[0].method, 'post')
  assert.equal(calls[0].url, '/forum/courses/3/lessons')
  assert.deepEqual(calls[1], { method: 'put', url: '/forum/courses/3/lessons/reorder', body: { forum_lesson_ids: [2, 9, 1] } })
})

test('las lecciones se cargan completas recorriendo todas las páginas', async () => {
  forumApi.defaults.adapter = (config) => respond(config, {
    data: [{ forum_lesson_id: config.params.page }], meta: { current_page: config.params.page, last_page: 2 },
  })
  assert.deepEqual((await listAllCourseLessons(1)).map((lesson) => lesson.forum_lesson_id), [1, 2])
})

test('el recurso se sube como multipart con el archivo real y sin timeout', async () => {
  const file = new File(['%PDF'], 'guia.pdf', { type: 'application/pdf' })
  forumApi.defaults.adapter = (config) => {
    assert.equal(config.url, '/forum/lessons/4/resources')
    assert.equal(config.timeout, 0)
    const body = config.data as FormData
    assert.ok(body instanceof FormData)
    assert.equal(body.get('forum_lesson_resource_type'), 'pdf')
    assert.equal(body.get('forum_lesson_resource_title'), 'Guía')
    assert.equal(body.get('forum_lesson_resource_is_downloadable'), '1')
    assert.equal(body.get('file'), file)
    assert.equal(body.has('forum_lesson_resource_path'), false)
    return respond(config, { success: true, message: 'ok', data: { forum_lesson_resource_id: 1 } }, 201)
  }
  await uploadLessonResource(4, { forum_lesson_resource_type: 'pdf', forum_lesson_resource_title: 'Guía', forum_lesson_resource_is_downloadable: true, file })
})

test('los recursos privados se leen del endpoint autorizado como Blob', async () => {
  forumApi.defaults.adapter = (config) => {
    assert.equal(config.url, '/forum/lesson-resources/7')
    assert.equal(config.responseType, 'blob')
    assert.deepEqual(config.params, { download: 1 })
    return respond(config, new Blob(['video']))
  }
  const blob = await fetchLessonResource(7, { download: true })
  assert.equal(await blob.text(), 'video')
})

test('un error JSON recibido como Blob conserva el mensaje del backend', async () => {
  forumApi.defaults.adapter = (config) => Promise.reject(new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined, {
    config, status: 403, statusText: 'Forbidden', headers: {},
    data: new Blob([JSON.stringify({ success: false, message: 'Descarga no habilitada.', errors: {} })], { type: 'application/json' }),
  }))
  await assert.rejects(fetchLessonResource(7, { download: true }), (error) => {
    assert.equal(toApiError(error).message, 'Descarga no habilitada.')
    return true
  })
})

test('reglas de archivos por tipo de recurso', () => {
  assert.equal(resourceFileProblem('video', new File(['x'], 'a.mp4', { type: 'video/mp4' })), null)
  assert.match(resourceFileProblem('video', new File(['x'], 'a.pdf', { type: 'application/pdf' })) ?? '', /no corresponde/)
  assert.equal(resourceFileProblem('file', new File(['x'], 'datos.csv', { type: '' })), null)
  assert.match(resourceFileProblem('pdf', new File([new Uint8Array(20480 * 1024 + 1)], 'a.pdf', { type: 'application/pdf' })) ?? '', /supera/)
  assert.equal(formatBytes(2048), '2 KB')
  assert.equal(downloadName('Guía: ejercicios', 'application/pdf'), 'Guía- ejercicios.pdf')
})
