function apiUrl(value: string | undefined, fallback: string): string {
  const url = new URL(value?.trim() || fallback)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Las direcciones de las API deben utilizar HTTP o HTTPS.')
  }
  return url.toString().replace(/\/$/, '')
}

export const env = {
  workspaceApiUrl: apiUrl(import.meta.env.VITE_WORKSPACE_API_URL, 'http://localhost:8000/api'),
  forumApiUrl: apiUrl(import.meta.env.VITE_FORUM_API_URL, 'http://localhost:8002/api'),
  applicationSlug: import.meta.env.VITE_APPLICATION_SLUG?.trim() || 'ucebul-forum',
}
