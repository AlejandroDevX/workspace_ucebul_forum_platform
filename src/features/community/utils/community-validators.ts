import { compose, maxLength, minLength, required } from '../../../lib/validators'

export const topicValidators = {
  title: compose(required('Escribe el título de tu pregunta.'), minLength(10, 'El título debe tener al menos 10 caracteres.'),
    maxLength(200, 'El título admite máximo 200 caracteres.')),
  category: required('Selecciona una categoría.'),
  body: compose(required('Describe tu pregunta.'), minLength(20, 'Describe tu pregunta con al menos 20 caracteres.'),
    maxLength(65535, 'El contenido admite máximo 65.535 caracteres.')),
}

export const POST_MAX_LENGTH = 65535

export const postValidator = compose(required('Escribe tu respuesta.'), minLength(5, 'La respuesta debe tener al menos 5 caracteres.'),
  maxLength(POST_MAX_LENGTH, 'La respuesta admite máximo 65.535 caracteres.'))
