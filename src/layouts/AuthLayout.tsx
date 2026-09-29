import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return <main className="auth-layout">
    <div className="auth-layout__brand brand"><strong>UCEBUL<span aria-hidden="true">.</span></strong><span>Foro técnico</span></div>
    <Outlet />
  </main>
}
