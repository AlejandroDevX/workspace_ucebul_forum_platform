import { useState } from 'react'
import { Button, Field, Form, type FormOption, Modal } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { createReport } from '../api/report.service'
import type { ForumReport, ReportTarget } from '../types/moderation.types'
import { OTHER_REASON, REPORT_REASONS, reportValidators, toReportPayload } from '../utils/report-format'

const REASON_ITEMS: FormOption[] = REPORT_REASONS.map((reason) => ({ label: reason, value: reason }))
const FIELD_NAMES = ['forum_report_reason', 'forum_report_description']

interface Props {
  target: ReportTarget
  open: boolean
  onClose: () => void
  onReported: (report: ForumReport) => void
}

export default function ReportFormModal({ target, open, onClose, onReported }: Props) {
  return (
    <Modal isOpen={open} onClose={onClose} className="report-modal"
      title={target.kind === 'topic' ? 'Reportar pregunta' : 'Reportar respuesta'}>
      {/* Se monta de nuevo en cada apertura para empezar con el formulario limpio. */}
      {open && <ReportForm target={target} onCancel={onClose} onReported={onReported} />}
    </Modal>
  )
}

function ReportForm({ target, onCancel, onReported }: { target: ReportTarget; onCancel: () => void; onReported: (report: ForumReport) => void }) {
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)

  function clearField(name: string) {
    setError((current) => {
      if (!current?.fieldErrors[name]) return current
      const fieldErrors = { ...current.fieldErrors }
      delete fieldErrors[name]
      return { ...current, fieldErrors }
    })
  }

  async function onSubmit(values: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      onReported(await createReport(toReportPayload(target, { ...values, forum_report_reason: reason })))
    } catch (failure) {
      setError(toApiError(failure))
      setSaving(false)
    }
  }

  const fieldErrors = error?.fieldErrors ?? {}
  // Errores del destino (no existe o ya no es visible) y demás campos sin control propio.
  const otherErrors = Object.entries(fieldErrors).filter(([name]) => !FIELD_NAMES.includes(name)).flatMap(([, messages]) => messages)

  return (
    <Form className="stacked-form report-form" onSubmit={(values) => void onSubmit(values)}>
      <p className="muted">El equipo de moderación revisará tu reporte. Tu identidad no se muestra al autor del contenido.</p>
      {error && <div className="auth-error" role="alert">
        {error.status === 422 ? 'Revisa los datos del reporte.' : error.message}
        {otherErrors.length > 0 && <ul>{otherErrors.map((message) => <li key={message}>{message}</li>)}</ul>}
      </div>}
      <fieldset disabled={saving}>
        <legend className="sr-only">Datos del reporte</legend>
        <div>
          <Field id="forum_report_reason" name="forum_report_reason" label="Motivo" component="select"
            items={REASON_ITEMS} value={reason} validator={reportValidators.reason} disabled={saving}
            onChange={(option: FormOption) => { clearField('forum_report_reason'); setReason(String(option.value)) }} />
          <FieldErrors messages={fieldErrors.forum_report_reason} />
        </div>
        <div>
          <Field id="forum_report_description" name="forum_report_description" component="textarea"
            label={reason === OTHER_REASON ? 'Descripción' : 'Descripción (opcional)'}
            placeholder="Explica qué ocurre con este contenido." value=""
            validator={reportValidators.description(reason)}
            onChange={() => clearField('forum_report_description')} />
          <FieldErrors messages={fieldErrors.forum_report_description} />
        </div>
      </fieldset>
      <div className="form-actions">
        <Button type="submit" variant="danger" loading={saving} disabled={saving}>{saving ? 'Enviando…' : 'Enviar reporte'}</Button>
        <Button variant="default" disabled={saving} onClick={onCancel}>Cancelar</Button>
      </div>
    </Form>
  )
}
