import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { forumApi } from '../src/lib/api'
import { useAuthStore } from '../src/features/auth/store/auth.store'
import { completeLesson, enrollInCourse, getCourseProgress, saveLessonPosition } from '../src/features/learning/api/learning.service'
import { createPositionSaver } from '../src/features/learning/utils/position-saver'
import { formatClock, formatPercentage } from '../src/features/learning/utils/learning-format'

const respond = (config: InternalAxiosRequestConfig, data: unknown) =>
  Promise.resolve({ config, status: 200, statusText: 'OK', headers: {}, data: { success: true, message: 'ok', data } })
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

test('inscribirse y completar no envían identidad del usuario', async () => {
  const calls: Array<{ url?: string; data: unknown }> = []
  forumApi.defaults.adapter = (config) => { calls.push({ url: config.url, data: config.data }); return respond(config, {}) }
  await enrollInCourse(3)
  await completeLesson(8)
  assert.deepEqual(calls.map((call) => call.url), ['/forum/courses/3/enroll', '/forum/lessons/8/complete'])
  for (const call of calls) assert.equal(call.data, undefined)
})

test('la posición se envía en segundos enteros con el nombre físico del campo', async () => {
  forumApi.defaults.adapter = (config) => {
    assert.equal(config.url, '/forum/lessons/5/progress')
    assert.equal(config.method, 'put')
    assert.deepEqual(JSON.parse(config.data), { forum_lesson_progress_last_position_seconds: 42 })
    return respond(config, { forum_lesson_progress_last_position_seconds: 42 })
  }
  await saveLessonPosition(5, 42.87)
})

test('un 403 de progreso (no inscrito) no muestra el aviso global de acceso', async () => {
  useAuthStore.setState({ error: null })
  forumApi.defaults.adapter = (config) => Promise.reject(new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, undefined,
    { config, status: 403, statusText: 'Forbidden', headers: {}, data: { success: false, message: 'Inscripción requerida.', errors: {} } }))
  await assert.rejects(getCourseProgress(1))
  assert.equal(useAuthStore.getState().error, null)
})

test('el guardado de posición aplica throttling y fuerza al pausar', async () => {
  let clock = 0
  const sent: number[] = []
  const saver = createPositionSaver({ now: () => clock, send: async (seconds) => { sent.push(seconds); return seconds } })

  // timeupdate ~4 veces por segundo durante 40 s de reproducción.
  for (let time = 0; time <= 40; time += 0.25) {
    clock = time * 1000
    saver.update(time)
    await flush()
  }
  assert.deepEqual(sent, [5, 20, 35])

  // Pausa: guarda aunque no haya pasado el intervalo.
  saver.update(41.2, true)
  await flush()
  assert.deepEqual(sent, [5, 20, 35, 41])

  // La misma posición no se reenvía.
  saver.update(41.9, true)
  await flush()
  assert.equal(sent.length, 4)
})

test('nunca hay dos guardados simultáneos: se envía la posición más reciente al terminar', async () => {
  const resolvers: Array<(value: number) => void> = []
  const sent: number[] = []
  const saver = createPositionSaver({ send: (seconds) => { sent.push(seconds); return new Promise((resolve) => resolvers.push(resolve)) } })
  saver.update(10, true)
  saver.update(12, true)
  saver.update(15, true)
  assert.deepEqual(sent, [10])
  resolvers[0](10)
  await flush()
  assert.deepEqual(sent, [10, 15])
})

test('deshabilitado (sin inscripción) no envía nada', async () => {
  const sent: number[] = []
  const saver = createPositionSaver({ send: async (seconds) => { sent.push(seconds); return seconds } })
  saver.sync(0, false)
  saver.update(30, true)
  await flush()
  assert.deepEqual(sent, [])
})

test('el porcentaje de Laravel solo se redondea para mostrarlo', () => {
  assert.equal(formatPercentage(33.333333333333336), 33)
  assert.equal(formatPercentage(66.66666666666667), 67)
  assert.equal(formatPercentage(100), 100)
  assert.equal(formatClock(75), '1:15')
  assert.equal(formatClock(3725), '1:02:05')
})
