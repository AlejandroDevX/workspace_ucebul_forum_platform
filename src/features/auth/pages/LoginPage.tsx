import { useEffect } from 'react'
import { Button, DataIcons, Field, Form } from 'ucebul_mui'
import { useAuthStore } from '../store/auth.store'
import type { LoginCredentials } from '../types/auth.types'

function emailValidator(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Ingresa tu correo electrónico.'
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'Ingresa un correo electrónico válido.'
}

function passwordValidator(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? null : 'Ingresa tu contraseña.'
}

export default function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const clearError = useAuthStore((state) => state.clearError)
  const error = useAuthStore((state) => state.error)
  const loading = useAuthStore((state) => state.status === 'authenticating')

  useEffect(() => { document.title = 'Iniciar sesión | Foro técnico UCEBUL' }, [])

  function onSubmit(values: Record<string, unknown>) {
    const credentials: LoginCredentials = {
      workspace_user_email: String(values.workspace_user_email ?? '').trim(),
      workspace_user_password: String(values.workspace_user_password ?? ''),
    }
    void login(credentials)
  }

  return <div className="login-panel">
    <aside className="login-intro">
      <p className="eyebrow">Educación y comunidad agropecuaria</p>
      <h1>El campo<br /> nos reúne.</h1>
      <p>Entra a tu comunidad para aprender y compartir conocimiento.</p>
      <span aria-hidden="true" className="login-community-icon">{DataIcons.navigation.users}</span>
    </aside>
    <section className="login-form-panel" aria-labelledby="login-title">
      <h2 id="login-title">Iniciar sesión</h2>
      <p>Usa el correo y la contraseña de tu cuenta Workspace.</p>
      <Form className="login-form" onSubmit={onSubmit}>
        {error && <div className="auth-error" role="alert">{error.message}</div>}
        <div>
          <Field id="workspace_user_email" name="workspace_user_email" label="Correo electrónico"
            component="input" type="email" icon={DataIcons.forms.email} disabled={loading}
            validator={emailValidator} onChange={() => clearError('workspace_user_email')} />
          {error?.fieldErrors.workspace_user_email?.map((message) => <p className="field-server-error" role="alert" key={message}>{message}</p>)}
        </div>
        <div>
          <Field id="workspace_user_password" name="workspace_user_password" label="Contraseña"
            component="input" type="password" disabled={loading} validator={passwordValidator}
            onChange={() => clearError('workspace_user_password')} />
          {error?.fieldErrors.workspace_user_password?.map((message) => <p className="field-server-error" role="alert" key={message}>{message}</p>)}
        </div>
        <Button type="submit" variant="primary" loading={loading} disabled={loading}>
          {loading ? 'Verificando acceso…' : 'Entrar al foro'}
        </Button>
      </Form>
      <p className="login-help">Necesitas acceso activo a Foro Técnico. Si aún no lo tienes, contacta al administrador de tu organización.</p>
    </section>
  </div>
}
