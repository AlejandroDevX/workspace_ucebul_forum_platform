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
VITE_FORUM_API_URL=http://localhost:8001/api
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
