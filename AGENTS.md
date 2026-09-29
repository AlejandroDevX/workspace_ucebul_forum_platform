# AGENTS — FRONTEND FORO TÉCNICO UCEBUL

Proyecto: workspace_ucebul_forum_platform.

Implementa una plataforma educativa y comunitaria agropecuaria.

## REGLAS DE EJECUCIÓN

No consultar, clonar ni investigar repositorios externos.

No analizar Workspace, ERP ni el código fuente remoto de ucebul_mui.

Los contratos están definidos en este documento y en los prompts de cada etapa.

Puedes leer los archivos del proyecto actual y las declaraciones TypeScript del paquete instalado cuando sea necesario para compilar correctamente.

No inventar endpoints, props, exports ni contratos de respuesta. Si falta un contrato imprescindible, reportarlo.

## STACK OBLIGATORIO

React 19 + TypeScript + Vite.

Gestor: npm.

Dependencias funcionales:
- axios
- react-router-dom
- zustand
- ucebul_mui

No instalar:
- Bun.
- pnpm.
- lucide-react.
- react-icons.
- @tanstack/react-query.
- react-hook-form.
- zod.
- Bibliotecas UI alternativas.

No generar bun.lock ni pnpm-lock.yaml.

Conservar package-lock.json.

## COMPONENTES UCEBUL

Importar desde:

'ucebul_mui'

Importar estilos globales:

'ucebul_mui/dist/style.css'

Componentes disponibles y relevantes:

Form, Field, Button, IconButton, Card, CardHeader, CardBody, CardFooter, Badge, Table, Pagination, Empty, Alert, Spinner, Skeleton, Modal, Dialog, Sidebar, Header, Avatar, Upload, Image, Tabs, Tooltip y DataIcons.

Usarlos según su interfaz real.

No desarrollar componentes que dupliquen controles existentes.

## ICONOS

Todos los iconos deben provenir de DataIcons.

Ejemplos confirmados:

DataIcons.navigation.home
DataIcons.navigation.folder
DataIcons.navigation.chats
DataIcons.navigation.document
DataIcons.navigation.users

DataIcons.forms.search
DataIcons.forms.email
DataIcons.forms.user
DataIcons.forms.book

DataIcons.buttons.plus
DataIcons.buttons.close

DataIcons.global.bookOutline
DataIcons.global.bookmarkOutline
DataIcons.global.eyeSolid
DataIcons.global.eyeOutline
DataIcons.global.trashOutline
DataIcons.global.uploadOutline
DataIcons.global.pdfIcon
DataIcons.global.checkOutline

No instalar bibliotecas de iconos adicionales.

No dibujar iconos SVG personalizados si existe uno equivalente en DataIcons.

## FORMULARIOS: REGLA OBLIGATORIA

Todos los formularios de captura deben construirse utilizando Form y Field de ucebul_mui.

No utilizar directamente input, textarea o select para reemplazar Field.

No crear un sistema de formularios paralelo.

Field requiere id y name.

Los valores de component soportados incluyen:
- input
- textarea
- select
- checkbox
- upload
- date

Para contraseñas:

component="input"
type="password"

NO utilizar component="password".

Utilizar validator para validar cada campo.

Firma:

validator={(value) => string | null}

Retornar null cuando el campo sea válido.

Form valida sus campos antes de ejecutar onSubmit.

Los valores de onSubmit llegan como un objeto indexado por name.

Normalizar esos valores a un DTO tipado antes de enviarlos mediante Axios.

En campos select, items utiliza elementos:
{ label: string, value: string | number }

En su onChange, Field entrega el objeto de selección original; manejarlo conforme a la interfaz del componente.

Para inputs y textarea, onChange entrega el evento de React.

Para upload, capturar File[] desde onChange y conservarlo en estado para construir FormData.

No depender de los valores registrados por Form para recuperar el contenido binario de archivos.

No asumir que Field.errorMessage muestra automáticamente errores del backend. Mostrar los errores 422 junto al campo y eliminarlos al corregirlo.

Usar Button de ucebul_mui para enviar formularios y mostrar estado de carga.

## VALIDACIONES

Crear validadores reutilizables solamente cuando corresponda.

Ejemplos:

required(message)
minLength(length, message)
maxLength(length, message)
validEmail(message)
positiveNumber(message)

Los validadores deben devolver string | null.

No duplicar manualmente el mecanismo de validación que ya proporciona Field.

Además de las validaciones frontend, mostrar las respuestas 422 de Laravel.

## ARQUITECTURA

Organizar por funcionalidades:

src/features/auth
src/features/courses
src/features/lessons
src/features/learning
src/features/community
src/features/moderation
src/features/favorites

Cada funcionalidad puede tener:
api/
components/
pages/
types/

Crear carpetas solamente cuando sean necesarias.

## HTTP

Utilizar Axios directamente.

Dos instancias:

workspaceApi
forumApi

No utilizar React Query.

Zustand se utiliza principalmente para autenticación.

Las consultas de cursos y módulos usan estado local, efectos y servicios Axios.

Cancelar solicitudes obsoletas cuando corresponda.

## ENV

VITE_WORKSPACE_API_URL=http://localhost:8000/api
VITE_FORUM_API_URL=http://localhost:8002/api
VITE_APPLICATION_SLUG=ucebul-forum

## CONTRATO BACKEND

Workspace devuelve:

{
  "success": true,
  "message": "...",
  "data": {}
}

Forum API utiliza la misma estructura para respuestas exitosas y errores.

Los identificadores y propiedades conservan los prefijos completos de MySQL:

forum_course_id
forum_course_title
forum_lesson_id
forum_topic_id

No asumir nombres genéricos.

## ALCANCE

No PWA.
No Service Worker.
No IndexedDB.
No almacenamiento offline.
No IA avanzada.
No notificaciones en tiempo real.

## CALIDAD

Interfaz responsive, accesible y en español.

No utilizar mocks permanentes.

No ocultar errores reales.

Al terminar cada tarea ejecutar npm run build y npm run lint cuando corresponda.

Reportar cambios, pruebas ejecutadas y contratos pendientes.

Crear o actualizar AGENTS.md con estas reglas.

## AUTENTICACIÓN — TAREA 01

- Login Workspace: POST /auth/login con workspace_user_email, workspace_user_password y workspace_personal_access_token_name = forum-platform.
- Respuesta login en data: workspace_access_token, workspace_access_token_type, workspace_user.
- Consultar GET /auth/me con application_slug = ucebul-forum antes de autorizar el foro.
- Sesión: workspace_user_id, workspace_user_email, workspace_user_name, workspace_user_last_name, current_application, current_application_access y current_application_permissions.
- Exigir acceso activo; un token válido por sí solo no autoriza el foro.
- Pendiente de confirmación: estructura y valor activo/inactivo de current_application_access. No inventarlos ni considerar cualquier objeto como acceso activo.
- Extraer workspace_application_permission_slug de los permisos agrupados por módulo. No inventar slugs de permisos para páginas.
- Persistir token con clave ucebul.forum.access-token; Zustand mantiene la sesión. Deduplicar bootstrap y descartar respuestas obsoletas.
- Ambas API envían Bearer. 401 invalida; 403 conserva token y muestra denegación; 503 conserva token y muestra indisponibilidad temporal.
- Logout: POST /auth/logout en Workspace; después limpiar estado y token local, informando errores del cierre remoto.
- Mantener LoginPage, UnauthorizedPage, NotFoundPage, PublicRoute, PrivateRoute y PermissionRoute.
- No implementar cursos durante esta tarea.
- Ejecutar npm test para comprobar regresiones de autenticación, además de build y lint.

## CURSOS — TAREA 03

- Rutas del frontend: /courses (catálogo), /courses/:courseId (detalle), /admin/courses, /admin/courses/new, /admin/courses/:courseId/edit y /admin/categories.
- El catálogo usa GET /forum/search/courses (search, forum_course_category_id, forum_course_level, page, per_page). GET /forum/courses no admite filtros y se usa en el listado de administración.
- POST /forum/courses exige forum_course_slug (único, minúsculas, números y guiones). El formulario lo genera desde el título y permite editarlo.
- No enviar forum_course_status, forum_course_instructor_workspace_user_id, forum_course_cover_path ni forum_course_published_at: la API responde 422.
- La portada NO va en el POST/PUT del curso: se sube después con POST /forum/courses/{id}/cover, multipart con el campo `cover` (JPG/PNG/WebP, máx. 5120 KiB). Se muestra forum_course_cover_url.
- Field upload registra solo el nombre del archivo: el File real se toma de onChange y se conserva en estado.
- Field select registra option.value y reinicia su selección si cambia la referencia de items: memoizar items y controlar value desde el estado.
- Select monta internamente un Field name="search" dentro del Form: no nombrar "search" a ningún campo propio.
- Editar, eliminar, publicar y archivar exigen el permiso y además ser instructor del curso o tener forum.courses.manage-any; las acciones se ocultan si no se cumple.
- forum_course_level es texto libre (máx. 50); el formulario ofrece Básico, Intermedio y Avanzado.
- Pendiente de contrato: la API solo expone forum_course_instructor_workspace_user_id; no hay nombre de instructor. Se muestra "Tú" o "Instructor #ID".

## LECCIONES — TAREA 04

- Rutas: /courses/:courseId/lessons/:lessonId (detalle), /admin/courses/:courseId/lessons/new y /admin/courses/:courseId/lessons/:lessonId/edit.
- Las lecciones se listan dentro del detalle del curso (CourseLessons) con GET /forum/courses/{course}/lessons recorriendo todas las páginas (per_page 100).
- POST/PUT de lecciones exigen forum_lesson_slug y rechazan forum_lesson_position, forum_lesson_status y forum_lesson_course_id. El orden se cambia solo con PUT /forum/courses/{course}/lessons/reorder enviando TODOS los IDs; el campo "Orden" del formulario hace ese reorder después de guardar.
- Gestionar lecciones y recursos exige ser el instructor del curso además del permiso; forum.courses.manage-any no basta.
- Los recursos son privados: leerlos siempre con GET /forum/lesson-resources/{id} mediante forumApi (Bearer, responseType blob) y mostrarlos con URL.createObjectURL. No usar URLs de Storage ni el campo `url` (ya incluye /api) como src.
- download=1 solo funciona si forum_lesson_resource_is_downloadable es true.
- Subida de recursos: multipart con forum_lesson_resource_type, forum_lesson_resource_title, forum_lesson_resource_is_downloadable (1/0) y file. Video máx. 100 MiB; pdf, image y file máx. 20 MiB. Subidas y descargas de archivos usan timeout 0.
- Un estudiante no inscrito solo ve las lecciones publicadas marcadas como vista previa; GET de una lección no preview responde 403 (inscripción requerida).
- Pendiente de contrato: la API no devuelve forum_lesson_resource_path.

## APRENDIZAJE Y PROGRESO — TAREA 05

- Rutas: /my-courses (MyCoursesPage, pestañas En curso / Finalizados) y /courses/:courseId/learn (LearningPage). El detalle del curso y de la lección muestran inscripción y avance.
- No existe un endpoint "¿estoy inscrito?": se usa GET /forum/courses/{id}/progress; 403 = no inscrito, 404 = curso no publicado.
- forumApi admite `silentStatuses` para que un estado esperado (p. ej. 403 = no inscrito) no dispare el aviso global. Nunca silenciar 401.
- Ningún endpoint de aprendizaje recibe workspace_user_id: la identidad sale del token.
- La UI solo refleja resúmenes devueltos por la API (enroll, progress, complete). El porcentaje lo calcula Laravel y solo se redondea para mostrarlo (puede traer decimales de coma flotante).
- Posición del video: createPositionSaver aplica throttling (máx. una petición cada 15 s y solo si avanzó 5 s o más), nunca dos peticiones simultáneas, y guarda siempre al pausar, terminar, ocultar la pestaña o salir de la lección. Solo se sigue el primer video de la lección.
- Solo se registra avance en lecciones publicadas de cursos publicados donde el usuario está inscrito.
