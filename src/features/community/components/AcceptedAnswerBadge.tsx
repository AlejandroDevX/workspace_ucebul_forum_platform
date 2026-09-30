import { Badge, DataIcons } from 'ucebul_mui'

export default function AcceptedAnswerBadge({ label = 'Solución aceptada' }: { label?: string }) {
  return <Badge variant="success" className="accepted-badge"><span aria-hidden="true">{DataIcons.global.checkOutline}</span>{label}</Badge>
}
