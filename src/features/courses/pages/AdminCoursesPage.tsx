import { DataIcons } from 'ucebul_mui'
import { UnavailableSection } from '../../../components/UnavailableSection'

export default function AdminCoursesPage() {
  return <UnavailableSection eyebrow="Administración" title="Gestión de cursos" description="Crear, editar, publicar y archivar los cursos del Foro Técnico." icon={DataIcons.navigation.folder} backTo="/admin" backLabel="Volver al panel" />
}
