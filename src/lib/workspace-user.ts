// Resumen de Workspace que la API del foro añade junto a cada *_workspace_user_id que se muestra
// (p. ej. forum_topic_workspace_user). null si Workspace no lo devolvió o no respondió.
export interface WorkspaceUserSummary {
  workspace_user_id: number
  workspace_user_name: string | null
  workspace_user_last_name: string | null
}

export function workspaceUserName(summary: WorkspaceUserSummary | null | undefined) {
  const name = [summary?.workspace_user_name, summary?.workspace_user_last_name]
    .map((part) => part?.trim()).filter(Boolean).join(' ')
  return name || null
}
