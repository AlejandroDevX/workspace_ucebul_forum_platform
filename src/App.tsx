import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_PERMISSIONS, PERMISSIONS } from './app/navigation'
import AuthLayout from './layouts/AuthLayout'
import ForumLayout from './layouts/ForumLayout'
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import LoginPage from './features/auth/pages/LoginPage'
import SessionBoundary from './features/auth/components/SessionBoundary'
import PublicRoute from './routes/PublicRoute'
import PrivateRoute from './routes/PrivateRoute'
import PermissionRoute from './routes/PermissionRoute'
import { useKeyboardSupport } from './lib/useKeyboardSupport'
import './App.css'

// Cada sección se descarga al visitarla; AppShell muestra un indicador mientras llega su código.
const CoursesPage = lazy(() => import('./features/courses/pages/CoursesPage'))
const AdminCoursesPage = lazy(() => import('./features/courses/pages/AdminCoursesPage'))
const AdminCategoriesPage = lazy(() => import('./features/courses/pages/AdminCategoriesPage'))
const CourseDetailPage = lazy(() => import('./features/courses/pages/CourseDetailPage'))
const CourseFormPage = lazy(() => import('./features/courses/pages/CourseFormPage'))
const LessonDetailPage = lazy(() => import('./features/lessons/pages/LessonDetailPage'))
const LessonFormPage = lazy(() => import('./features/lessons/pages/LessonFormPage'))
const AdminLessonsPage = lazy(() => import('./features/lessons/pages/AdminLessonsPage'))
const ForumHomePage = lazy(() => import('./features/community/pages/ForumHomePage'))
const ForumCategoryPage = lazy(() => import('./features/community/pages/ForumCategoryPage'))
const ForumCategoriesPage = lazy(() => import('./features/community/pages/ForumCategoriesPage'))
const TopicDetailPage = lazy(() => import('./features/community/pages/TopicDetailPage'))
const TopicFormPage = lazy(() => import('./features/community/pages/TopicFormPage'))
const TopicSearchPage = lazy(() => import('./features/community/pages/TopicSearchPage'))
const LearningPage = lazy(() => import('./features/learning/pages/LearningPage'))
const MyCoursesPage = lazy(() => import('./features/learning/pages/MyCoursesPage'))
const FavoritesPage = lazy(() => import('./features/favorites/pages/FavoritesPage'))
const ModerationPage = lazy(() => import('./features/moderation/pages/ModerationPage'))
const ReportDetailPage = lazy(() => import('./features/moderation/pages/ReportDetailPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))

export default function App() {
  useKeyboardSupport()
  return (
    <BrowserRouter><SessionBoundary><Routes>
      <Route element={<AuthLayout />}>
        <Route element={<PublicRoute />}><Route path="login" element={<LoginPage />} /></Route>
        <Route path="unauthorized" element={<UnauthorizedPage />} />
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<ForumLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route element={<PermissionRoute permissions={[PERMISSIONS.coursesView]} />}>
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:courseId" element={<CourseDetailPage />} />
            <Route element={<PermissionRoute permissions={[PERMISSIONS.lessonsView]} />}>
              <Route path="courses/:courseId/lessons/:lessonId" element={<LessonDetailPage />} />
            </Route>
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.learningView]} />}>
            <Route path="my-courses" element={<MyCoursesPage />} />
            <Route path="courses/:courseId/learn" element={<LearningPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.communityView]} />}>
            <Route path="forum" element={<ForumHomePage />} />
            <Route path="forum/search" element={<TopicSearchPage />} />
            <Route path="forum/categories/:categoryId" element={<ForumCategoryPage />} />
            <Route path="forum/topics/:topicId" element={<TopicDetailPage />} />
            <Route element={<PermissionRoute permissions={[PERMISSIONS.communityCreate]} />}>
              <Route path="forum/new" element={<TopicFormPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.communityUpdate]} />}>
              <Route path="forum/topics/:topicId/edit" element={<TopicFormPage />} />
            </Route>
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.coursesView, PERMISSIONS.communityView]} mode="any" />}>
            <Route path="favorites" element={<FavoritesPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin" element={<PermissionRoute permissions={ADMIN_PERMISSIONS} mode="any" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route element={<PermissionRoute permissions={PERMISSIONS.adminCourses} mode="any" />}>
              <Route path="courses" element={<AdminCoursesPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.courseCreate]} />}>
              <Route path="courses/new" element={<CourseFormPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.courseUpdate]} />}>
              <Route path="courses/:courseId/edit" element={<CourseFormPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.lessonsView]} />}>
              <Route path="courses/:courseId/lessons" element={<AdminLessonsPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.lessonsCreate]} />}>
              <Route path="courses/:courseId/lessons/new" element={<LessonFormPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.lessonsUpdate]} />}>
              <Route path="courses/:courseId/lessons/:lessonId/edit" element={<LessonFormPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={PERMISSIONS.adminCategories} mode="any" />}>
              <Route path="categories" element={<AdminCategoriesPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.communityManageAny]} />}>
              <Route path="forum-categories" element={<ForumCategoriesPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={[PERMISSIONS.moderationView]} />}>
              <Route path="moderation" element={<ModerationPage />} />
              <Route path="moderation/reports/:reportId" element={<ReportDetailPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes></SessionBoundary></BrowserRouter>
  )
}
