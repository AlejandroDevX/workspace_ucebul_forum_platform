import { useNavigate } from 'react-router-dom'
import { DataIcons, Empty } from 'ucebul_mui'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return <section className="page-section"><h1>Página no encontrada</h1><Empty icon={DataIcons.navigation.document} title="No encontramos esta dirección" text="Revisa el enlace o vuelve al inicio para explorar las secciones." buttonIcon={DataIcons.navigation.home} buttonText="Volver al inicio" onClickButton={() => navigate('/dashboard')} /></section>
}
