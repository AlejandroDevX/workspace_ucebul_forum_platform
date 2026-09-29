import AppShell from '../app/AppShell'
import { ADMIN_NAVIGATION } from '../app/navigation'

export default function AdminLayout() {
  return <AppShell variant="admin" title="Administración" navigation={ADMIN_NAVIGATION} />
}
