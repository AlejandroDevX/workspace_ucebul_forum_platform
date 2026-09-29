export type ForumLessonStatus = 'draft' | 'published'
export type ForumLessonResourceType = 'video' | 'pdf' | 'image' | 'file'

export interface ForumLessonResource {
  forum_lesson_resource_id: number
  forum_lesson_resource_lesson_id: number
  forum_lesson_resource_type: ForumLessonResourceType
  forum_lesson_resource_title: string
  forum_lesson_resource_mime_type: string
  forum_lesson_resource_size_bytes: number
  forum_lesson_resource_position: number
  forum_lesson_resource_is_downloadable: boolean
  // La API no expone la ruta física del archivo privado; se lee siempre mediante el endpoint autorizado.
  forum_lesson_resource_path?: string
  forum_lesson_resource_created_at: string
  forum_lesson_resource_updated_at: string
  // Ruta relativa al origen (/api/forum/lesson-resources/{id}); exige Bearer.
  url: string
}

export interface ForumLesson {
  forum_lesson_id: number
  forum_lesson_course_id: number
  forum_lesson_title: string
  forum_lesson_slug: string
  forum_lesson_body: string | null
  forum_lesson_position: number
  forum_lesson_duration_minutes: number
  forum_lesson_is_preview: boolean
  forum_lesson_status: ForumLessonStatus
  forum_lesson_created_at: string
  forum_lesson_updated_at: string
  // El reordenamiento no incluye recursos.
  resources?: ForumLessonResource[]
}

// Cuerpo de POST/PUT de lecciones. La posición, el estado y el curso no se envían: la API responde 422.
export interface ForumLessonPayload {
  forum_lesson_title: string
  forum_lesson_slug: string
  forum_lesson_body: string | null
  forum_lesson_duration_minutes: number
  forum_lesson_is_preview: boolean
}

export interface ForumLessonResourceUpload {
  forum_lesson_resource_type: ForumLessonResourceType
  forum_lesson_resource_title: string
  forum_lesson_resource_is_downloadable: boolean
  file: File
}
