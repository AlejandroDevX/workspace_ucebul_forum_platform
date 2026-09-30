import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { forumApi } from '../src/lib/api'
import { createPost, reactToPost, removeReaction } from '../src/features/community/api/post.service'
import { acceptAnswer, createTopic, listTopics } from '../src/features/community/api/topic.service'
import type { ForumPost, ForumReaction, ForumTopic } from '../src/features/community/types/community.types'
import { applyReaction, mergePosts } from '../src/features/community/utils/community-format'
import { postValidator, topicValidators } from '../src/features/community/utils/community-validators'
import { changedFields } from '../src/features/community/utils/topic-payload'

const respond = (config: InternalAxiosRequestConfig, data: unknown) =>
  Promise.resolve({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, message: 'ok', data } })

const post = (overrides: Partial<ForumPost> = {}): ForumPost => ({
  forum_post_id: 1, forum_post_topic_id: 1, forum_post_parent_id: null, forum_post_workspace_user_id: 2,
  forum_post_body: 'Respuesta', forum_post_status: 'published', forum_post_created_at: '', forum_post_updated_at: '',
  forum_post_replies_count: 0, forum_post_upvotes_count: 3, forum_post_downvotes_count: 1, user_reaction: null, ...overrides,
})
const reaction = (type: 'upvote' | 'downvote'): ForumReaction => ({
  forum_reaction_id: 9, forum_reaction_post_id: 1, forum_reaction_workspace_user_id: 2, forum_reaction_type: type,
  forum_reaction_created_at: '', forum_reaction_updated_at: '',
})

test('los conteos se derivan de la reacción confirmada: votar, cambiar y retirar', () => {
  const voted = applyReaction(post(), reaction('upvote'))
  assert.deepEqual([voted.forum_post_upvotes_count, voted.forum_post_downvotes_count], [4, 1])
  const changed = applyReaction(voted, reaction('downvote'))
  assert.deepEqual([changed.forum_post_upvotes_count, changed.forum_post_downvotes_count], [3, 2])
  const removed = applyReaction(changed, null)
  assert.deepEqual([removed.forum_post_upvotes_count, removed.forum_post_downvotes_count], [3, 1])
  assert.equal(removed.user_reaction, null)
})

test('los servicios envían solo los campos del contrato, sin identidad del usuario', async () => {
  const calls: Array<{ method?: string; url?: string; body: unknown }> = []
  forumApi.defaults.adapter = (config) => {
    calls.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data) : undefined })
    return respond(config, {})
  }
  await createTopic({ forum_topic_category_id: 2, forum_topic_course_id: null, forum_topic_title: 'Título de prueba', forum_topic_body: 'Cuerpo' })
  await createPost(5, { forum_post_body: 'Hola', forum_post_parent_id: 7 })
  await reactToPost(7, 'downvote')
  await removeReaction(7)
  await acceptAnswer(5, 7)
  assert.deepEqual(calls, [
    { method: 'post', url: '/forum/topics', body: { forum_topic_category_id: 2, forum_topic_course_id: null, forum_topic_title: 'Título de prueba', forum_topic_body: 'Cuerpo' } },
    { method: 'post', url: '/forum/topics/5/posts', body: { forum_post_body: 'Hola', forum_post_parent_id: 7 } },
    { method: 'post', url: '/forum/posts/7/reaction', body: { forum_reaction_type: 'downvote' } },
    { method: 'delete', url: '/forum/posts/7/reaction', body: undefined },
    { method: 'post', url: '/forum/topics/5/accept-answer', body: { forum_post_id: 7 } },
  ])
  for (const call of calls) assert.equal(JSON.stringify(call.body ?? {}).includes('workspace_user_id'), false)
})

test('el listado de temas envía los filtros del contrato', async () => {
  forumApi.defaults.adapter = (config) => {
    assert.deepEqual(config.params, { page: 2, per_page: 15, forum_topic_category_id: 3, forum_topic_status: 'open' })
    return Promise.resolve({ config, status: 200, statusText: 'OK', headers: {}, data: { data: [], meta: { current_page: 2, last_page: 2 } } })
  }
  await listTopics({ page: 2, per_page: 15, forum_topic_category_id: 3, forum_topic_status: 'open' })
})

test('editar un tema envía solo los campos modificados', () => {
  const topic = { forum_topic_title: 'Título original', forum_topic_body: 'Cuerpo', forum_topic_category_id: 1, forum_topic_course_id: null } as ForumTopic
  assert.deepEqual(changedFields(topic, { forum_topic_title: 'Título original', forum_topic_body: 'Cuerpo nuevo', forum_topic_category_id: 1, forum_topic_course_id: null }),
    { forum_topic_body: 'Cuerpo nuevo' })
  assert.deepEqual(changedFields(topic, { forum_topic_title: 'Título original', forum_topic_body: 'Cuerpo', forum_topic_category_id: 1, forum_topic_course_id: 4 }),
    { forum_topic_course_id: 4 })
})

test('mergePosts no duplica respuestas al cargar más páginas', () => {
  const merged = mergePosts([post({ forum_post_id: 1 }), post({ forum_post_id: 2 })], [post({ forum_post_id: 2 }), post({ forum_post_id: 3 })])
  assert.deepEqual(merged.map((item) => item.forum_post_id), [1, 2, 3])
})

test('validadores de longitud mínima y máxima', () => {
  assert.equal(topicValidators.title(''), 'Escribe el título de tu pregunta.')
  assert.match(topicValidators.title('Corto') ?? '', /al menos 10/)
  assert.equal(topicValidators.title('¿Cómo controlar plagas?'), null)
  assert.match(topicValidators.title('x'.repeat(201)) ?? '', /máximo 200/)
  assert.match(topicValidators.body('Muy corto') ?? '', /al menos 20/)
  assert.match(postValidator('ok') ?? '', /al menos 5/)
  assert.equal(postValidator('Gracias por la respuesta'), null)
})
