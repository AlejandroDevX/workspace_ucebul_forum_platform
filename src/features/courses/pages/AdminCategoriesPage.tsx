import { DataIcons } from 'ucebul_mui'
import { UnavailableSection } from '../../../components/UnavailableSection'

export default function AdminCategoriesPage() {
  return <UnavailableSection eyebrow="Administración" title="Categorías de cursos" description="Organizar los cursos por temáticas para que sean fáciles de encontrar." icon={DataIcons.navigation.tableOutline} backTo="/admin" backLabel="Volver al panel" />
}
