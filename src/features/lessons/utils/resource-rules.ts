import type { ForumLessonResourceType } from '../types/lesson.types'

interface ResourceRule {
  label: string
  mimeTypes: string[]
  extensions: string[]
  maxBytes: number
  hint: string
}

const KIB = 1024
const withUpper = (extensions: string[]) => [...extensions, ...extensions.map((extension) => extension.toUpperCase())]

// Tabla de archivos permitidos de Forum API.
export const RESOURCE_RULES: Record<ForumLessonResourceType, ResourceRule> = {
  video: { label: 'Video', mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'], extensions: withUpper(['.mp4', '.webm', '.mov']), maxBytes: 102400 * KIB, hint: 'MP4, WebM o MOV de máximo 100 MB.' },
  pdf: { label: 'PDF', mimeTypes: ['application/pdf'], extensions: withUpper(['.pdf']), maxBytes: 20480 * KIB, hint: 'PDF de máximo 20 MB.' },
  image: { label: 'Imagen', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], extensions: withUpper(['.jpg', '.jpeg', '.png', '.webp', '.gif']), maxBytes: 20480 * KIB, hint: 'JPG, PNG, WebP o GIF de máximo 20 MB.' },
  file: {
    label: 'Archivo',
    mimeTypes: ['application/pdf', 'text/plain', 'text/csv', 'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    extensions: withUpper(['.pdf', '.txt', '.csv', '.zip', '.docx', '.xlsx', '.pptx']),
    maxBytes: 20480 * KIB,
    hint: 'PDF, TXT, CSV, ZIP, DOCX, XLSX o PPTX de máximo 20 MB.',
  },
}

export const RESOURCE_TYPES = Object.keys(RESOURCE_RULES) as ForumLessonResourceType[]

// Algunos navegadores no informan el MIME (p. ej. CSV o ZIP): se acepta si la extensión es válida.
export function resourceFileProblem(type: ForumLessonResourceType, file: File) {
  const rule = RESOURCE_RULES[type]
  const extension = `.${file.name.split('.').pop() ?? ''}`
  const validType = file.type ? rule.mimeTypes.includes(file.type) : rule.extensions.includes(extension)
  if (!validType) return `El archivo no corresponde al tipo ${rule.label.toLowerCase()}. ${rule.hint}`
  if (file.size > rule.maxBytes) return `El archivo supera el tamaño permitido. ${rule.hint}`
  return null
}

export function formatBytes(bytes: number) {
  if (bytes < KIB) return `${bytes} B`
  if (bytes < KIB * KIB) return `${Math.round(bytes / KIB)} KB`
  return `${(bytes / (KIB * KIB)).toFixed(1).replace('.0', '')} MB`
}

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'text/plain': 'txt', 'text/csv': 'csv', 'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
}

// La API sirve el nombre interno del archivo; al descargar se usa el título del recurso.
export function downloadName(title: string, mimeType: string) {
  const base = title.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'recurso'
  const extension = EXTENSIONS[mimeType]
  return extension && !base.toLowerCase().endsWith(`.${extension}`) ? `${base}.${extension}` : base
}
