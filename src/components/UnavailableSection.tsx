import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, DataIcons, Empty } from 'ucebul_mui'

interface Props {
  title: string
  description: string
  icon: ReactNode
  eyebrow?: string
  backTo?: string
  backLabel?: string
}

export function UnavailableSection({ title, description, icon, eyebrow = 'Foro técnico UCEBUL', backTo = '/dashboard', backLabel = 'Volver al inicio' }: Props) {
  const navigate = useNavigate()

  return (
    <section className="page-section" aria-labelledby="section-title">
      <div className="page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <Badge variant="info">En preparación</Badge>
      </div>
      <h1 id="section-title">{title}</h1>
      <p className="page-intro">{description}</p>
      <Card className="availability-card">
        <CardBody>
          <Empty
            icon={icon}
            title="Esta sección aún no está disponible"
            text="Estamos preparando este espacio. Mientras tanto puedes volver y explorar las demás secciones."
            buttonIcon={DataIcons.buttons.arrowLongLeft}
            buttonText={backLabel}
            onClickButton={() => navigate(backTo)}
          />
        </CardBody>
      </Card>
    </section>
  )
}
