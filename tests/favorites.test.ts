import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { forumApi } from '../src/lib/api'
import { searchTopics } from '../src/features/community/api/topic.service'
import { searchCourses } from '../src/features/courses/api/course.service'
import {
  addCourseFavorite, addTopicFavorite, listFavoriteTargetIds, removeCourseFavorite, removeTopicFavorite,
} from '../src/features/favorites/api/favorite.service'
import { useFavoritesStore } from '../src/features/favorites/store/favorites.store'
import { positiveInt, withChanges } from '../src/lib/search-params'

const ok = (config: InternalAxiosRequestConfig, body: unknown, status = 200) =>
  Promise.resolve({ config, status, statusText: 'OK', headers: {}, data: body })
const notFound = (config: InternalAxiosRequestConfig) => Promise.reject(Object.assign(new Error('404'), {
  isAxiosError: true, config, response: { config, status: 404, statusText: 'Not Found', headers: {}, data: { success: false, message: 'Resource not found', errors: {} } },
}))

test('las búsquedas envían los filtros del contrato', async () => {
  const params: unknown[] = []
  forumApi.defaults.adapter = (config) => {
    params.push([config.url, config.params])
    return ok(config, { data: [], meta: { current_page: 1, last_page: 1, total: 0 } })
  }
  await searchCourses({ page: 2, per_page: 12, search: 'maíz', forum_course_category_id: 3, forum_course_level: 'Básico' })
  await searchTopics({ page: 1, per_page: 15, search: 'riego', forum_topic_category_id: 4, forum_topic_course_id: 7 })
  assert.deepEqual(params, [
    ['/forum/search/courses', { page: 2, per_page: 12, search: 'maíz', forum_course_category_id: 3, forum_course_level: 'Básico' }],
    ['/forum/search/topics', { page: 1, per_page: 15, search: 'riego', forum_topic_category_id: 4, forum_topic_course_id: 7 }],
  ])
})

test('favoritos: rutas con el ID del destino, sin cuerpo; retirar un favorito inexistente (404) no es error', async () => {
  const calls: unknown[] = []
  forumApi.defaults.adapter = (config) => {
    calls.push([config.method, config.url, config.data ?? null])
    if (config.method === 'delete' && config.url?.endsWith('/9')) return notFound(config)
    return ok(config, { success: true, message: 'ok', data: config.method === 'delete' ? null : { forum_course_favorite_id: 1 } }, config.method === 'post' ? 201 : 200)
  }
  await addCourseFavorite(5)
  await addTopicFavorite(6)
  await removeCourseFavorite(5)
  await removeTopicFavorite(9)
  assert.deepEqual(calls, [
    ['post', '/forum/favorites/courses/5', null],
    ['post', '/forum/favorites/topics/6', null],
    ['delete', '/forum/favorites/courses/5', null],
    ['delete', '/forum/favorites/topics/9', null],
  ])
})

test('los IDs favoritos se leen de los nombres físicos recorriendo todas las páginas', async () => {
  const pages: unknown[] = []
  forumApi.defaults.adapter = (config) => {
    pages.push(config.params)
    const page = config.params.page as number
    return ok(config, {
      data: [{ forum_topic_favorite_id: page * 10, forum_topic_favorite_topic_id: page, forum_topic_favorite_workspace_user_id: 42, topic: null }],
      meta: { current_page: page, last_page: 2, total: 2 },
    })
  }
  assert.deepEqual(await listFavoriteTargetIds('topic'), [1, 2])
  assert.deepEqual(pages, [{ page: 1, per_page: 100 }, { page: 2, per_page: 100 }])
})

test('el store solo refleja cambios confirmados por la API y comparte una única carga', async () => {
  let listCalls = 0
  let fail = false
  forumApi.defaults.adapter = (config) => {
    if (config.method === 'get') {
      listCalls += 1
      return ok(config, { data: [{ forum_course_favorite_id: 1, forum_course_favorite_course_id: 3, forum_course_favorite_workspace_user_id: 42, course: null }], meta: { current_page: 1, last_page: 1, total: 1 } })
    }
    if (fail) return notFound(config)
    return ok(config, { success: true, message: 'ok', data: null })
  }
  const store = useFavoritesStore.getState()
  store.reset()
  await Promise.all([store.ensure('course'), store.ensure('course')])
  assert.equal(listCalls, 1)
  assert.deepEqual([...useFavoritesStore.getState().ids.course!], [3])

  assert.equal(await useFavoritesStore.getState().toggle('course', 8), true)
  assert.equal(await useFavoritesStore.getState().toggle('course', 3), false)
  assert.deepEqual([...useFavoritesStore.getState().ids.course!], [8])

  fail = true
  await assert.rejects(useFavoritesStore.getState().toggle('course', 12))
  assert.equal(useFavoritesStore.getState().ids.course!.has(12), false)
  assert.deepEqual(useFavoritesStore.getState().pending, {})

  useFavoritesStore.getState().reset()
  assert.equal(useFavoritesStore.getState().ids.course, null)
})

test('filtros en la URL: enteros positivos y vuelta a la primera página', () => {
  assert.equal(positiveInt('3'), 3)
  assert.equal(positiveInt('0'), undefined)
  assert.equal(positiveInt('abc'), undefined)
  const next = withChanges(new URLSearchParams('q=maiz&page=4&category=2'), { category: '', level: 'Básico' })
  assert.equal(next.toString(), 'q=maiz&level=B%C3%A1sico')
  assert.equal(withChanges(new URLSearchParams('q=maiz'), { page: '2' }).toString(), 'q=maiz&page=2')
})
