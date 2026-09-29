import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_PERMISSIONS, PERMISSIONS } from './app/navigation'
import AuthLayout from './layouts/AuthLayout'
import ForumLayout from './layouts/ForumLayout'
import AdminLayout from './layouts/AdminLayout'
import CoursesPage from './features/courses/pages/CoursesPage'
import AdminCoursesPage from './features/courses/pages/AdminCoursesPage'
import AdminCategoriesPage from './features/courses/pages/AdminCategoriesPage'
import CommunityPage from './features/community/pages/CommunityPage'
import MyCoursesPage from './features/learning/pages/MyCoursesPage'
import FavoritesPage from './features/favorites/pages/FavoritesPage'
import ModerationPage from './features/moderation/pages/ModerationPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import LoginPage from './features/auth/pages/LoginPage'
import SessionBoundary from './features/auth/components/SessionBoundary'
import PublicRoute from './routes/PublicRoute'
import PrivateRoute from './routes/PrivateRoute'
import PermissionRoute from './routes/PermissionRoute'
import './App.css'

export default function App() {
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
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.learningView]} />}>
            <Route path="my-courses" element={<MyCoursesPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.communityView]} />}>
            <Route path="forum" element={<CommunityPage />} />
          </Route>
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin" element={<PermissionRoute permissions={ADMIN_PERMISSIONS} mode="any" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route element={<PermissionRoute permissions={PERMISSIONS.adminCourses} mode="any" />}>
              <Route path="courses" element={<AdminCoursesPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={PERMISSIONS.adminCategories} mode="any" />}>
              <Route path="categories" element={<AdminCategoriesPage />} />
            </Route>
            <Route element={<PermissionRoute permissions={PERMISSIONS.adminModeration} mode="any" />}>
              <Route path="moderation" element={<ModerationPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Route>
    </Routes></SessionBoundary></BrowserRouter>
  )
}
