import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { toApiError } from '../../../lib/api-error'
import { saveLessonPosition } from '../api/learning.service'
import type { LessonProgressWithCourse } from '../types/learning.types'
import { createPositionSaver } from './position-saver'

interface Options {
  lessonId: number
  enabled: boolean
  initialPosition: number
  onSaved: (result: LessonProgressWithCourse) => void
}

// Registra la última posición del video con throttling y la guarda siempre al pausar, terminar o salir.
export function useVideoProgress({ lessonId, enabled, initialPosition, onSaved }: Options) {
  const [error, setError] = useState<string | null>(null)
  const [saver] = useState(() => createPositionSaver({ send: async () => 0 }))
  const lastTime = useRef<number | null>(null)

  useEffect(() => {
    saver.configure({
      send: async (seconds) => {
        const result = await saveLessonPosition(lessonId, seconds)
        setError(null)
        onSaved(result)
        return result.forum_lesson_progress_last_position_seconds
      },
      onError: (failure) => setError(`No se pudo guardar tu posición en el video: ${toApiError(failure).message}`),
    })
  })

  useEffect(() => { saver.reset() }, [saver, lessonId])
  useEffect(() => { saver.sync(initialPosition, enabled) }, [saver, enabled, initialPosition])

  // Al ocultar la pestaña o salir de la lección se envía la última posición conocida.
  useEffect(() => {
    const flush = () => { if (lastTime.current !== null) saver.update(lastTime.current, true) }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
      lastTime.current = null
    }
  }, [saver, lessonId])

  return {
    error,
    handlers: {
      onTimeUpdate: (event: SyntheticEvent<HTMLVideoElement>) => {
        lastTime.current = event.currentTarget.currentTime
        saver.update(event.currentTarget.currentTime)
      },
      onPause: (event: SyntheticEvent<HTMLVideoElement>) => saver.update(event.currentTarget.currentTime, true),
      onEnded: (event: SyntheticEvent<HTMLVideoElement>) => saver.update(event.currentTarget.currentTime, true),
    },
  }
}
