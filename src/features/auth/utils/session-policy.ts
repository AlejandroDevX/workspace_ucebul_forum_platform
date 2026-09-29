// Workspace marca el acceso activo con workspace_user_application_is_active.
// Falla cerrado: solo un `true` explícito autoriza; un objeto no vacío no basta.
export function hasActiveAccess(access: unknown): boolean {
  return typeof access === 'object' && access !== null
    && 'workspace_user_application_is_active' in access
    && access.workspace_user_application_is_active === true
}

export function permissionSlugs(groups: unknown): Set<string> {
  const slugs = new Set<string>()
  const visited = new WeakSet<object>()
  function visit(value: unknown) {
    if (!value || typeof value !== 'object' || visited.has(value)) return
    visited.add(value)
    if ('workspace_application_permission_slug' in value
      && typeof value.workspace_application_permission_slug === 'string') {
      slugs.add(value.workspace_application_permission_slug)
    }
    // Recorre grupos por módulo sin depender de nombres de módulos o envolturas.
    for (const child of Object.values(value)) visit(child)
  }
  visit(groups)
  return slugs
}

// Nombre del rol de la aplicación, si Workspace lo incluye en current_application_access.
export function applicationRoleName(access: unknown): string | null {
  if (typeof access !== 'object' || access === null || !('workspace_application_role' in access)) return null
  const role = access.workspace_application_role
  if (typeof role !== 'object' || role === null || !('workspace_application_role_name' in role)) return null
  return typeof role.workspace_application_role_name === 'string' ? role.workspace_application_role_name : null
}
