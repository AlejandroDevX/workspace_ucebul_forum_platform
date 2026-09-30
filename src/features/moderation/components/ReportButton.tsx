import { useState } from 'react'
import { Button, DataIcons } from 'ucebul_mui'
import type { ReportTarget } from '../types/moderation.types'
import { useModerationPermissions } from '../utils/useModerationPermissions'
import ReportFormModal from './ReportFormModal'

// Acción «Reportar» del foro; requiere forum.moderation.reports.
export default function ReportButton({ target }: { target: ReportTarget }) {
  const { canReport } = useModerationPermissions()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  if (!canReport) return null

  return (
    <>
      {sent
        ? <span className="report-sent" role="status"><span aria-hidden="true">{DataIcons.global.checkOutline}</span> Reporte enviado</span>
        : <Button size="sm" variant="default" onClick={() => setOpen(true)}>Reportar</Button>}
      <ReportFormModal target={target} open={open} onClose={() => setOpen(false)}
        onReported={() => { setOpen(false); setSent(true) }} />
    </>
  )
}
