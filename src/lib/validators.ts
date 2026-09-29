// Validadores para la prop `validator` de Field: devuelven el mensaje o null si el valor es válido.
export type FieldValidator = (value: unknown) => string | null

const text = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '')

export const required = (message = 'Este campo es obligatorio.'): FieldValidator =>
  (value) => (text(value).trim() ? null : message)

export const maxLength = (length: number, message = `Máximo ${length} caracteres.`): FieldValidator =>
  (value) => (text(value).length > length ? message : null)

export const matches = (pattern: RegExp, message: string): FieldValidator =>
  (value) => (!text(value) || pattern.test(text(value)) ? null : message)

export const integerInRange = (min: number, max: number, message = `Ingresa un número entero entre ${min} y ${max}.`): FieldValidator =>
  (value) => {
    const raw = text(value).trim()
    if (!raw) return null
    if (!/^\d+$/.test(raw)) return message
    const number = Number(raw)
    return number >= min && number <= max ? null : message
  }

export const compose = (...validators: FieldValidator[]): FieldValidator =>
  (value) => validators.reduce<string | null>((error, validator) => error ?? validator(value), null)
