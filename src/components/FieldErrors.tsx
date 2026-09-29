// Errores 422 de Laravel mostrados junto al campo correspondiente.
export default function FieldErrors({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <>{messages.map((message) => <p className="field-server-error" role="alert" key={message}>{message}</p>)}</>
}
