import { DataIcons } from 'ucebul_mui'
import { UnavailableSection } from '../../../components/UnavailableSection'

export default function ModerationPage() {
  return <UnavailableSection eyebrow="Administración" title="Moderación" description="Revisar reportes y mantener una comunidad respetuosa y útil." icon={DataIcons.navigation.documentCheck} backTo="/admin" backLabel="Volver al panel" />
}
