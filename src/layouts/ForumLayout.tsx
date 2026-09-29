import AppShell from '../app/AppShell'
import { FORUM_NAVIGATION } from '../app/navigation'

export default function ForumLayout() {
  return <AppShell variant="forum" title="Foro Técnico" navigation={FORUM_NAVIGATION} />
}
