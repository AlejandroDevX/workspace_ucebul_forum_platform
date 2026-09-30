import { Link } from 'react-router-dom'
import { Badge, Card, CardBody, DataIcons } from 'ucebul_mui'
import type { ForumCourse } from '../types/course.types'
import { categoryName, formatDuration } from '../utils/course-format'
import { instructorLabel } from '../utils/useCoursePermissions'
import CourseCover from './CourseCover'
import CourseStatusBadge from './CourseStatusBadge'
import FavoriteButton from '../../favorites/components/FavoriteButton'

export default function CourseCard({ course, userId, onFavoriteChange }: {
  course: ForumCourse
  userId?: number | string
  onFavoriteChange?: (favorite: boolean) => void
}) {
  const category = categoryName(course)
  const description = course.forum_course_summary || course.forum_course_description

  return (
    <Card className="course-card">
      <CourseCover course={course} />
      <FavoriteButton kind="course" id={course.forum_course_id} title={course.forum_course_title} onChange={onFavoriteChange} className="card-favorite" />
      <CardBody>
        <div className="course-card__tags">
          {category && <Badge variant="info">{category}</Badge>}
          {course.forum_course_level && <Badge>{course.forum_course_level}</Badge>}
          {course.forum_course_status !== 'published' && <CourseStatusBadge status={course.forum_course_status} />}
        </div>
        <h3><Link to={`/courses/${course.forum_course_id}`}>{course.forum_course_title}</Link></h3>
        {description && <p className="course-card__description">{description}</p>}
        <dl className="course-meta">
          <div><dt><span aria-hidden="true">{DataIcons.global.clockOutline}</span><span className="sr-only">Duración</span></dt><dd>{formatDuration(course.forum_course_duration_minutes)}</dd></div>
          <div><dt><span aria-hidden="true">{DataIcons.global.userOutline}</span><span className="sr-only">Instructor</span></dt><dd>{instructorLabel(course, userId)}</dd></div>
        </dl>
      </CardBody>
    </Card>
  )
}
