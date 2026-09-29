export interface ForumCourseCategory {
  forum_course_category_id: number
  forum_course_category_name: string
  forum_course_category_slug: string
  forum_course_category_description: string | null
  forum_course_category_is_active: boolean
  forum_course_category_created_at: string
  forum_course_category_updated_at: string
}

export type ForumCourseStatus = 'draft' | 'published' | 'archived'

export interface ForumCourse {
  forum_course_id: number
  forum_course_category_id: number
  forum_course_instructor_workspace_user_id: number
  forum_course_title: string
  forum_course_slug: string
  forum_course_summary: string | null
  forum_course_description: string | null
  forum_course_cover_path: string | null
  forum_course_cover_url: string | null
  forum_course_level: string | null
  forum_course_duration_minutes: number
  forum_course_status: ForumCourseStatus
  forum_course_published_at: string | null
  forum_course_created_at: string
  forum_course_updated_at: string
  // Relación opcional: solo existe cuando la API la carga.
  category?: ForumCourseCategory
}

// Cuerpo de POST/PUT /forum/courses. No incluye estado, instructor ni portada: la API los rechaza.
export interface ForumCoursePayload {
  forum_course_category_id: number
  forum_course_title: string
  forum_course_slug: string
  forum_course_summary: string | null
  forum_course_description: string | null
  forum_course_level: string | null
  forum_course_duration_minutes?: number
}

export interface ForumCourseCategoryPayload {
  forum_course_category_name: string
  forum_course_category_slug: string
  forum_course_category_description: string | null
  forum_course_category_is_active: boolean
}

export interface CourseSearchFilters {
  page?: number
  per_page?: number
  search?: string
  forum_course_category_id?: number
  forum_course_level?: string
}
