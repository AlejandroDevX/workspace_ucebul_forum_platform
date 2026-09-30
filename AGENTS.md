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
- current_application_access autoriza solo con workspace_user_application_is_active === true (session-policy.ts). No considerar cualquier objeto como acceso activo.
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

## COMUNIDAD — TAREA 06

- Rutas: /forum (ForumHomePage), /forum/categories/:categoryId, /forum/topics/:topicId, /forum/new (?category=&course=), /forum/topics/:topicId/edit y /admin/forum-categories.
- Filtros de temas en la URL: page, status (open/closed) y course. GET /forum/topics no tiene búsqueda de texto.
- No existe GET de una categoría: se busca en el listado completo. Solo se listan categorías activas, salvo con forum.community.manage-any.
- Crear o editar categorías del foro exige forum.community.manage-any además de create/update. Sin categorías activas nadie puede crear temas.
- GET /forum/topics/{id} no trae respuestas: raíz con GET /topics/{id}/posts y las hijas con forum_post_parent_id (se cargan al pedir "Ver respuestas"). Desde el tercer nivel no se indenta.
- user_reaction es un objeto ForumReaction o null. POST/DELETE de reacción no devuelven conteos: se derivan del estado previo y de la reacción confirmada (applyReaction).
- Editar un tema envía solo los campos modificados (PUT parcial; categoría activa y curso visible solo se validan si se envían).
- Autores: solo existe forum_*_workspace_user_id. Se muestra "Tú" o "Usuario #ID"; no hay endpoint público de usuarios.

## ADMINISTRACIÓN Y MODERACIÓN — TAREA 07

- Rutas: /admin (AdminDashboardPage), /admin/courses (AdminCoursesPage), /admin/categories (AdminCategoriesPage), /admin/courses/:courseId/lessons (AdminLessonsPage), /admin/moderation (ModerationPage, filtros status/topic/post en la URL) y /admin/moderation/reports/:reportId (ReportDetailPage).
- Endpoints: POST/GET /forum/reports, GET /forum/reports/{id}, POST /forum/reports/{id}/resolve|dismiss, POST /forum/topics/{id}/hide|restore y POST /forum/posts/{id}/hide|restore. Servicios en features/moderation/api; cursos y lecciones reutilizan sus servicios existentes.
- Permisos por endpoint: reportar = forum.moderation.reports; listar y consultar = forum.moderation.view; resolver, descartar, ocultar y restaurar = forum.moderation.manage (no exige autoría ni manage-any). Las rutas de moderación exigen forum.moderation.view; manage o reports solos no abren el panel. Nunca deducir permisos del rol.
- POST /forum/reports: exactamente uno de forum_report_topic_id / forum_report_post_id, forum_report_reason (máx. 255) y forum_report_description opcional. Enviar autor, estado o datos de resolución responde 422 (incluso null).
- Resolver y descartar: solo desde pending y SIN cuerpo; no existe nota de resolución. Resolver no oculta el contenido: el formulario de resolución llama a hide antes de resolve si se marca «Ocultar».
- Transiciones: tema open/closed → hidden y hidden → open (restaurar reabre); respuesta published ↔ hidden. Los eliminados no se restauran. Confirmar siempre con Dialog antes de ocultar, restaurar, resolver o descartar.
- Los resúmenes topic/post del reporte incluyen eliminados lógicamente. Para el contexto se usa GET /forum/topics/{id}; un tema oculto responde 404 sin forum.community.manage-any.
- Table de ucebul_mui siempre renderiza su Pagination y no tiene estado vacío: usar Empty cuando no hay filas y pasar filas ya renderizadas (Record<string, ReactNode>).
- Modal de ucebul_mui: sus `buttons` quedan fuera del contenido; los formularios dentro de Modal llevan sus propios Button de envío.

## BÚSQUEDA Y FAVORITOS — TAREA 08

- Rutas: /courses (catálogo con SearchFilters), /forum/search (TopicSearchPage) y /favorites (FavoritesPage, pestañas ?tab=courses|topics y ?page=).
- Componentes compartidos: src/components/SearchInput (Field input, debounce 400 ms, máx. 100 caracteres) y SearchFilters (texto + Field select que se aplican al elegir; Enter aplica sin esperar). Los filtros viven en la URL; el texto usa replace para no llenar el historial.
- La cancelación de búsquedas obsoletas la hace useRequest: cada cambio de filtros cambia la clave y aborta la solicitud anterior.
- GET /forum/search/topics no filtra por estado; GET /forum/search/courses admite search, categoría y nivel. search vacío se omite.
- Favoritos: POST/DELETE usan el ID del destino (curso o tema), sin cuerpo. POST devuelve 201 o 200 si ya existía. DELETE devuelve 200 con data null; 404 = el favorito no existía y se trata como retirado.
- No hay endpoint «¿es favorito?» ni campo en cursos/temas: favorites.store (Zustand) carga todos los IDs (per_page 100) una vez por sesión, solo refleja cambios confirmados por la API y se reinicia al cambiar token o usuario.
- Permisos: favoritos de cursos = forum.courses.view; de temas = forum.community.view. FavoriteButton se oculta sin el permiso.
- Los temas de GET /forum/favorites/topics no traen forum_topic_posts_count: TopicCard oculta el conteo si falta.
- No escribir onChange?.(await fn()): con onChange indefinido el argumento no se evalúa y fn nunca se ejecuta.

## AUDITORÍA FINAL — TAREA 09

- useKeyboardSupport (src/lib) completa el teclado de ucebul_mui sobre su marcado: opciones de Select y pestañas de Tabs con foco, roles ARIA, Enter/Espacio y flechas; Dialog/Modal enfocan Cancelar/Cerrar y cierran con Escape. No crear controles paralelos para esto.
- Probar el diseño a 320 px: el nombre del perfil de Header se oculta visualmente en móvil y las tablas llevan sus .sr-only dentro del contenedor con scroll.
- .env.example usa la API del foro en :8002.

## PENDIENTES RESUELTOS — NOMBRES, NOTA, BUNDLE E IMÁGENES

- Nombres: Workspace expone GET /api/workspace-user-summaries?application_slug=&workspace_user_ids[] (auth:sanctum; exige acceso activo a la aplicación; solo usuarios vinculados a ella; máx. 100 IDs; solo ID, nombre y apellido). La API del foro añade *_workspace_user junto a los IDs mostrados (middleware workspace.users). Nunca guardar nombres en tablas del foro. Mostrar con authorLabel/instructorLabel (Tú › nombre › «Usuario #ID»).
- Reportes: resolve/dismiss aceptan forum_report_resolution_note (opcional, máx. 2000, vacía = null); ForumReportResource la devuelve.
- Páginas con React.lazy y Suspense dentro de AppShell. vite.config.ts elimina el WASM de ONNX no referenciado.
- Portadas y visor de imágenes usan Image de ucebul_mui; el CSS actúa sobre .image-container y respeta su estado --loading.
- Workspace no define forum.community.manage-any ni forum.courses.manage-any: nadie puede crear categorías del foro (pendiente de decisión).

## SHELL Y DASHBOARD — BRANDING

- Sidebar, Header y Footer usan los estilos de ucebul_mui sin sobrescribir colores; el CSS del proyecto solo ajusta disposición. Sidebar va con variant="dark"; Header sin buscador (no pasar onSearchChange).
- No redefinir en :root tokens de ucebul_mui (--ink, --green-*, --dark-*, --light*, --border-color, --status-*…). El color de texto del proyecto es --app-ink: --ink es el fondo del sidebar oscuro.
- En escritorio ucebul_mui pinta la navegación con vertical-navigation--light aunque el Sidebar sea dark: App.css reaplica sus tokens de navegación oscura bajo .sidebar--dark.
- El título del Header es la sección activa. El Sidebar muestra «Menú» fijo: no admite logo por props.
- Dashboard: GET /forum/my-courses (compartido con InProgressCourses vía la prop enrollments), GET /forum/search/courses para recomendados (excluye inscritos) y GET /forum/topics per_page 5 para actividad. No existe conteo de participación del usuario en el foro; no se muestra.
- La imagen del hero (src/assets/dashboard-hero.webp) es una copia comprimida de background-login-3 de ucebul_mui (el paquete no exporta sus assets).
