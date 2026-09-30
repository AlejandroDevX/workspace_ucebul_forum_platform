import { useState } from 'react'
import { toApiError } from '../../../lib/api-error'
import { deleteLesson, publishLesson, reorderLessons } from '../api/lesson.service'
import type { ForumLesson } from '../types/lesson.types'
import { moveLesson, sortLessons } from './lesson-payload'

// Reordenar, publicar y eliminar lecciones; compartido por el índice del curso y la administración.
export function useLessonActions(courseId: number, lessons: ForumLesson[], onChange?: (lessons: ForumLesson[]) => void) {
  const [busy, setBusy] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<ForumLesson | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function move(lesson: ForumLesson, position: number) {
    const ids = moveLesson(lessons.map((item) => item.forum_lesson_id), lesson.forum_lesson_id, position)
    const byId = new Map(lessons.map((item) => [item.forum_lesson_id, item]))
    const previous = lessons
    // Actualización optimista; se revierte si la API rechaza el orden.
    onChange?.(ids.map((id, index) => ({ ...byId.get(id)!, forum_lesson_position: index + 1 })))
    setBusy(lesson.forum_lesson_id)
    setError(null)
    try {
      const saved = await reorderLessons(courseId, ids)
      // La respuesta no incluye recursos: se conservan los que ya estaban cargados.
      onChange?.(sortLessons(saved.map((item) => ({ ...item, resources: byId.get(item.forum_lesson_id)?.resources }))))
    } catch (failure) {
      onChange?.(previous)
      setError(`No se pudo cambiar el orden: ${toApiError(failure).message}`)
    } finally {
      setBusy(null)
    }
  }

  async function publish(lesson: ForumLesson) {
    setBusy(lesson.forum_lesson_id)
    setError(null)
    try {
      const saved = await publishLesson(lesson.forum_lesson_id)
      onChange?.(lessons.map((item) => item.forum_lesson_id === saved.forum_lesson_id ? saved : item))
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  async function remove(lesson: ForumLesson) {
    setConfirm(null)
    setBusy(lesson.forum_lesson_id)
    setError(null)
    try {
      await deleteLesson(lesson.forum_lesson_id)
      onChange?.(lessons.filter((item) => item.forum_lesson_id !== lesson.forum_lesson_id))
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  return { busy, error, confirm, setConfirm, move, publish, remove }
}
