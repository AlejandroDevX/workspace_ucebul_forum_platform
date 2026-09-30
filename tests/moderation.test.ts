import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { InternalAxiosRequestConfig } from 'axios'
import { forumApi } from '../src/lib/api'
import { hidePost, hideTopic, restorePost, restoreTopic } from '../src/features/moderation/api/moderation.service'
import { createReport, dismissReport, getReport, listReports, resolveReport } from '../src/features/moderation/api/report.service'
import type { ForumReport } from '../src/features/moderation/types/moderation.types'
import { OTHER_REASON, reportContentState, reportTargetTitle, reportValidators, toReportPayload } from '../src/features/moderation/utils/report-format'

const respond = (config: InternalAxiosRequestConfig, data: unknown) =>
  Promise.resolve({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, message: 'ok', data } })

const report = (overrides: Partial<ForumReport> = {}): ForumReport => ({
  forum_report_id: 1, forum_report_topic_id: 4, forum_report_post_id: null, forum_report_reported_by_workspace_user_id: 42,
  forum_report_reason: 'Spam o publicidad', forum_report_description: null, forum_report_status: 'pending',
  forum_report_resolved_by_workspace_user_id: null, forum_report_resolved_at: null, forum_report_resolution_note: null, forum_report_created_at: '', forum_report_updated_at: '',
  topic: { forum_topic_id: 4, forum_topic_title: 'Plaga en maíz', forum_topic_status: 'open', forum_topic_deleted_at: null },
  post: null, ...overrides,
})

test('el reporte envía exactamente un destino y nunca la identidad, el estado ni la resolución', () => {
  const topic = toReportPayload({ kind: 'topic', id: 4 }, { forum_report_reason: ' Spam o publicidad ', forum_report_description: '  ' })
  assert.deepEqual(topic, { forum_report_topic_id: 4, forum_report_reason: 'Spam o publicidad', forum_report_description: null })
  const post = toReportPayload({ kind: 'post', id: 9 }, { forum_report_reason: OTHER_REASON, forum_report_description: 'Enlace sospechoso' })
  assert.deepEqual(post, { forum_report_post_id: 9, forum_report_reason: OTHER_REASON, forum_report_description: 'Enlace sospechoso' })
  for (const payload of [topic, post]) {
    const keys = Object.keys(payload)
    for (const forbidden of ['workspace_user_id', 'forum_report_reported_by_workspace_user_id', 'forum_report_status', 'forum_report_resolved_by_workspace_user_id', 'forum_report_resolved_at']) {
      assert.equal(keys.includes(forbidden), false)
    }
  }
})

test('validadores del formulario de reporte', () => {
  assert.equal(reportValidators.reason(''), 'Selecciona el motivo del reporte.')
  assert.equal(reportValidators.reason('Spam o publicidad'), null)
  assert.equal(reportValidators.reason('x'.repeat(256)), 'El motivo admite máximo 255 caracteres.')
  assert.equal(reportValidators.description('Spam o publicidad')(''), null)
  assert.notEqual(reportValidators.description(OTHER_REASON)(''), null)
  assert.equal(reportValidators.description(OTHER_REASON)('Detalle'), null)
})

test('estado del contenido reportado a partir del resumen', () => {
  assert.equal(reportContentState(report()), 'visible')
  assert.equal(reportContentState(report({ topic: { forum_topic_id: 4, forum_topic_title: 'T', forum_topic_status: 'hidden', forum_topic_deleted_at: null } })), 'hidden')
  assert.equal(reportContentState(report({ topic: { forum_topic_id: 4, forum_topic_title: 'T', forum_topic_status: 'open', forum_topic_deleted_at: '2026-09-29T00:00:00Z' } })), 'deleted')
  const postReport = report({ forum_report_topic_id: null, forum_report_post_id: 9, topic: null,
    post: { forum_post_id: 9, forum_post_topic_id: 4, forum_post_body: 'Compra aquí', forum_post_status: 'hidden', forum_post_deleted_at: null } })
  assert.equal(reportContentState(postReport), 'hidden')
  assert.equal(reportTargetTitle(postReport), 'Compra aquí')
  assert.equal(reportContentState(report({ topic: null })), 'unknown')
})

test('los endpoints de moderación usan las rutas del contrato y resolver/ocultar van sin cuerpo', async () => {
  const calls: Array<{ method?: string; url?: string; params?: unknown; body: unknown }> = []
  forumApi.defaults.adapter = (config) => {
    calls.push({ method: config.method, url: config.url, params: config.params, body: config.data ? JSON.parse(config.data) : undefined })
    return config.url === '/forum/reports' && config.method === 'get'
      ? Promise.resolve({ config, status: 200, statusText: 'OK', headers: {}, data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } } })
      : respond(config, {})
  }
  await createReport({ forum_report_topic_id: 4, forum_report_reason: 'Spam o publicidad', forum_report_description: null })
  await listReports({ page: 2, per_page: 15, forum_report_status: 'pending' })
  await getReport(3)
  await resolveReport(3)
  await dismissReport(3)
  await hideTopic(4)
  await restoreTopic(4)
  await hidePost(9)
  await restorePost(9)
  assert.deepEqual(calls, [
    { method: 'post', url: '/forum/reports', params: undefined, body: { forum_report_topic_id: 4, forum_report_reason: 'Spam o publicidad', forum_report_description: null } },
    { method: 'get', url: '/forum/reports', params: { page: 2, per_page: 15, forum_report_status: 'pending' }, body: undefined },
    { method: 'get', url: '/forum/reports/3', params: undefined, body: undefined },
    { method: 'post', url: '/forum/reports/3/resolve', params: undefined, body: undefined },
    { method: 'post', url: '/forum/reports/3/dismiss', params: undefined, body: undefined },
    { method: 'post', url: '/forum/topics/4/hide', params: undefined, body: undefined },
    { method: 'post', url: '/forum/topics/4/restore', params: undefined, body: undefined },
    { method: 'post', url: '/forum/posts/9/hide', params: undefined, body: undefined },
    { method: 'post', url: '/forum/posts/9/restore', params: undefined, body: undefined },
  ])
})

test('resolver y descartar envían la nota solo si tiene texto', async () => {
  const bodies: unknown[] = []
  forumApi.defaults.adapter = (config) => {
    bodies.push([config.url, config.data ? JSON.parse(config.data) : undefined])
    return respond(config, {})
  }
  await resolveReport(3, '  Spam confirmado.  ')
  await dismissReport(4, '   ')
  await resolveReport(5)
  assert.deepEqual(bodies, [
    ['/forum/reports/3/resolve', { forum_report_resolution_note: 'Spam confirmado.' }],
    ['/forum/reports/4/dismiss', undefined],
    ['/forum/reports/5/resolve', undefined],
  ])
})
