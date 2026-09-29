import type { ForumCourse } from '../../courses/types/course.types'
import type { ForumLesson } from '../../lessons/types/lesson.types'

// Resumen calculado por Laravel; solo cuenta lecciones publicadas.
export interface ProgressSummary {
  published_lessons: number
  completed_lessons: number
  percentage: number
  is_completed: boolean
}

export interface CourseProgressSummary extends ProgressSummary {
  forum_course_id: number
  forum_enrollment_id: number
  forum_enrollment_completed_at: string | null
}

export interface ForumEnrollment {
  forum_enrollment_id: number
  forum_enrollment_course_id: number
  forum_enrollment_workspace_user_id: number
  forum_enrollment_enrolled_at: string
  forum_enrollment_completed_at: string | null
  forum_enrollment_created_at: string
  forum_enrollment_updated_at: string
  progress: ProgressSummary
  // null si el curso se eliminó o dejó de ser visible.
  course: ForumCourse | null
}

export interface ForumLessonProgress {
  forum_lesson_progress_id: number
  forum_lesson_progress_lesson_id: number
  forum_lesson_progress_workspace_user_id: number
  forum_lesson_progress_is_completed: boolean
  forum_lesson_progress_last_position_seconds: number
  forum_lesson_progress_completed_at: string | null
  forum_lesson_progress_created_at: string
  forum_lesson_progress_updated_at: string
}

export interface LessonProgressWithCourse extends ForumLessonProgress {
  course: CourseProgressSummary
}

export type LessonWithProgress = Omit<ForumLesson, 'resources'> & { progress: ForumLessonProgress | null }

export interface CourseProgressWithLessons extends CourseProgressSummary {
  lessons: LessonWithProgress[]
}

export interface CourseProgressWithNext extends CourseProgressSummary {
  lesson: LessonWithProgress | null
}
