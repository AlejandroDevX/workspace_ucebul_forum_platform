import { type ChangeEvent, useState } from 'react'
import { Button, Dialog, Field, Form, type FormOption } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { maxLength, required } from '../../../lib/validators'
import { hidePost, hideTopic } from '../api/moderation.service'
import { dismissReport, resolveReport } from '../api/report.service'
import type { ForumReport } from '../types/moderation.types'
import { reportContentState, reportTargetKind } from '../utils/report-format'

type Decision = 'resolve' | 'dismiss'

const DECISION_ITEMS: FormOption[] = [
  { label: 'Resolver: el contenido incumple las normas', value: 'resolve' },
  { label: 'Descartar: no requiere acción', value: 'dismiss' },
]
const decisionValidator = required('Selecciona una decisión.')
const noteValidator = maxLength(2000, 'La nota admite máximo 2.000 caracteres.')
const NOTE_FIELD = 'forum_report_resolution_note'

type Choice = { decision: Decision; hide: boolean; note: string | null }

interface Props {
  report: ForumReport
  // Reporte actualizado y si el contenido quedó oculto (también cuando falla el cierre después de ocultar).
  onUpdated: (report: ForumReport, contentHidden: boolean) => void
}

// La decisión y la opción de ocultar determinan qué endpoints se llaman; la nota viaja en resolve/dismiss.
export default function ResolveReportForm({ report, onUpdated }: Props) {
  const [decision, setDecision] = useState<Decision | ''>('')
  const [hide, setHide] = useState(false)
  const [pending, setPending] = useState<Choice | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const kind = reportTargetKind(report)
  const canHide = reportContentState(report) === 'visible'
  const willHide = decision === 'resolve' && canHide && hide

  async function run(choice: Choice) {
    setPending(null)
    setSaving(true)
    setError(null)
    let hidden = false
    try {
      if (choice.hide) {
        if (kind === 'topic') await hideTopic(report.forum_report_topic_id!)
        else await hidePost(report.forum_report_post_id!)
        hidden = true
      }
      const saved = choice.decision === 'resolve'
        ? await resolveReport(report.forum_report_id, choice.note)
        : await dismissReport(report.forum_report_id, choice.note)
      onUpdated(saved, hidden)
    } catch (failure) {
      const apiError = toApiError(failure)
      // Si el contenido ya se ocultó, se informa para no repetir la acción.
      setError(hidden ? { ...apiError, message: `El contenido se ocultó, pero el reporte no se pudo cerrar: ${apiError.message}` } : apiError)
      if (hidden) onUpdated({ ...report }, true)
      setSaving(false)
    }
  }

  // La nota muestra su 422 junto al campo; el resto (p. ej. reporte ya cerrado) se lista arriba.
  const fieldErrors = error?.fieldErrors ?? {}
  const messages = Object.entries(fieldErrors).filter(([name]) => name !== NOTE_FIELD).flatMap(([, list]) => list)
  const confirmText = pending?.decision === 'dismiss'
    ? 'El reporte quedará descartado y no podrá volver a pendiente. El contenido no cambia.'
    : pending?.hide
      ? `El reporte quedará resuelto y ${kind === 'topic' ? 'la pregunta' : 'la respuesta'} se ocultará del foro. Podrás restaurarla después.`
      : 'El reporte quedará resuelto y no podrá volver a pendiente. Resolver no oculta el contenido.'

  return (
    <>
      <Form className="stacked-form" onSubmit={(values) => {
        const note = String(values[NOTE_FIELD] ?? '').trim()
        if (decision) setPending({ decision, hide: willHide, note: note || null })
      }}>
        {error && <div className="auth-error" role="alert">
          {error.message}
          {messages.length > 0 && <ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul>}
        </div>}
        <fieldset disabled={saving}>
          <legend className="sr-only">Resolución del reporte</legend>
          <div>
            <Field id="report_decision" name="report_decision" label="Decisión" component="select" items={DECISION_ITEMS}
              value={decision} validator={decisionValidator} disabled={saving}
              onChange={(option: FormOption) => { setError(null); setDecision(option.value as Decision) }} />
          </div>
          {decision === 'resolve' && canHide && <div>
            <Field id="report_hide_content" name="report_hide_content" component="checkbox" disabled={saving} value={hide}
              label={kind === 'topic' ? 'Ocultar también la pregunta reportada' : 'Ocultar también la respuesta reportada'}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setHide(event.target.checked)} />
          </div>}
          <div>
            <Field id={NOTE_FIELD} name={NOTE_FIELD} label="Nota de resolución (opcional)" component="textarea" value=""
              placeholder="Qué se revisó y por qué se tomó esta decisión." validator={noteValidator}
              onChange={() => setError((current) => current?.fieldErrors[NOTE_FIELD]
                ? { ...current, fieldErrors: Object.fromEntries(Object.entries(current.fieldErrors).filter(([name]) => name !== NOTE_FIELD)) }
                : current)} />
            <FieldErrors messages={fieldErrors[NOTE_FIELD]} />
          </div>
        </fieldset>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={saving} disabled={saving}>{saving ? 'Guardando…' : 'Aplicar decisión'}</Button>
        </div>
      </Form>
      <Dialog open={pending !== null} typeDialog={pending?.hide ? 'warning' : 'info'}
        titleDialog={pending?.decision === 'dismiss' ? 'Descartar reporte' : 'Resolver reporte'} textDialog={confirmText}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Confirmar"
        onCancelDialog={() => setPending(null)} callbackDialog={() => { if (pending) void run(pending) }} />
    </>
  )
}
