import { DataIcons, Image } from 'ucebul_mui'
import type { ForumCourse } from '../types/course.types'

export default function CourseCover({ course, className = '' }: { course: ForumCourse; className?: string }) {
  return (
    <div className={`course-cover ${className}`}>
      {course.forum_course_cover_url
        ? <Image src={course.forum_course_cover_url} alt="" width="100%" height="100%" />
        : <span className="course-cover__placeholder" aria-hidden="true">{DataIcons.global.bookOutline}</span>}
    </div>
  )
}
