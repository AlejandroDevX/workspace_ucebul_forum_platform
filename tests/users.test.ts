import { test } from 'node:test'
import assert from 'node:assert/strict'
import { authorLabel } from '../src/features/community/utils/community-format'
import { instructorLabel } from '../src/features/courses/utils/useCoursePermissions'
import type { ForumCourse } from '../src/features/courses/types/course.types'
import { workspaceUserName } from '../src/lib/workspace-user'

const ana = { workspace_user_id: 7, workspace_user_name: 'Ana', workspace_user_last_name: 'Pérez' }
const notMine = () => false

test('el nombre sale del resumen de Workspace y el ID solo es respaldo', () => {
  assert.equal(workspaceUserName(ana), 'Ana Pérez')
  assert.equal(workspaceUserName({ ...ana, workspace_user_last_name: null }), 'Ana')
  assert.equal(workspaceUserName({ ...ana, workspace_user_name: '  ', workspace_user_last_name: null }), null)
  assert.equal(authorLabel(7, notMine, ana), 'Ana Pérez')
  assert.equal(authorLabel(7, notMine, null), 'Usuario #7')
  assert.equal(authorLabel(7, notMine), 'Usuario #7')
  assert.equal(authorLabel(7, (id) => id === 7, ana), 'Tú')
})

test('el instructor usa su resumen de Workspace', () => {
  const course = { forum_course_instructor_workspace_user_id: 7, forum_course_instructor_workspace_user: ana } as ForumCourse
  assert.equal(instructorLabel(course, 42), 'Ana Pérez')
  assert.equal(instructorLabel(course, 7), 'Tú')
  assert.equal(instructorLabel({ ...course, forum_course_instructor_workspace_user: null }, 42), 'Instructor #7')
})
