# Foro Técnico UCEBUL — frontend

Plataforma educativa y comunitaria agropecuaria: cursos con lecciones y recursos, inscripciones y progreso, foro técnico con reacciones, moderación, búsqueda y favoritos.

Stack: React 19, TypeScript, Vite, npm, Axios, Zustand, React Router y `ucebul_mui` (componentes, estilos e iconos `DataIcons`). No usa Bun, pnpm, React Query, React Hook Form, Zod, lucide-react, react-icons ni otras librerías visuales.

## Requisitos

- Node.js 20.19+ o 22.12+ (requisito de Vite 8) y npm.
- API de Workspace (autenticación, sesión y permisos).
- API de Foro Técnico (`workspace_ucebul_forum_api`).

## Instalación

```sh
npm ci
cp .env.example .env
```

`ucebul_mui` se instala desde `vendor/ucebul_mui-0.0.38.tgz` (referenciado en `package.json`). Conservar ese archivo y `package-lock.json` para que `npm ci` sea reproducible.

## Variables de entorno

```dotenv
VITE_WORKSPACE_API_URL=http://localhost:8000/api
VITE_FORUM_API_URL=http://localhost:8002/api
VITE_APPLICATION_SLUG=ucebul-forum
```

| Variable | Uso |
| --- | --- |
| `VITE_WORKSPACE_API_URL` | Base de `workspaceApi`: login, sesión (`/auth/me`) y logout. |
| `VITE_FORUM_API_URL` | Base de `forumApi`: todos los endpoints `/forum/...`. |
| `VITE_APPLICATION_SLUG` | Se envía como `application_slug` al consultar la sesión. Debe ser `ucebul-forum`. |

Las variables `VITE_*` se incrustan en el bundle y son públicas: no poner secretos.

## Desarrollo, compilación y pruebas

```sh
npm run dev      # Vite en http://localhost:5175
npm run build    # tsc -b + vite build → dist/ (una sección por chunk con React.lazy)
npm run lint     # ESLint
npm test         # pruebas de servicios y lógica (node:test)
npm run preview  # sirve dist/ localmente
```

En producción, el servidor web debe devolver `index.html` para cualquier ruta del frontend (React Router).

Cada página se carga bajo demanda (`React.lazy`); el chunk inicial ronda 240 kB. `vite.config.ts` descarta el WASM de ONNX (~21 MB) que ucebul_mui arrastra por su reconocimiento de voz, solo si ningún chunk lo referencia.

Las pruebas usan adaptadores Axios exclusivos de test; la aplicación no contiene mocks. Cubren autenticación y códigos de error, contratos de cursos, lecciones, recursos, aprendizaje, comunidad, moderación, búsqueda y favoritos.

## Estructura

```
src/
  app/          AppShell (Sidebar + Header) y navegación con permisos
  components/   Componentes compartidos (SearchInput, SearchFilters, FieldErrors…)
  config/       Lectura y validación de variables de entorno
  features/     auth, courses, lessons, learning, community, moderation, favorites
                (cada una con api/, components/, pages/, types/, utils/ según necesite)
  layouts/      AuthLayout, ForumLayout, AdminLayout
  lib/          Axios (workspaceApi, forumApi), useRequest, validadores, paginación, teclado
  pages/        Inicio, panel de administración, 404 y acceso denegado
  routes/       PublicRoute, PrivateRoute, PermissionRoute
```

## Contrato con Workspace

- `POST /auth/login` con `workspace_user_email`, `workspace_user_password` y `workspace_personal_access_token_name: "forum-platform"`. Respuesta en `data`: `workspace_access_token`, `workspace_access_token_type`, `workspace_user`.
- `GET /auth/me?application_slug=ucebul-forum`: `workspace_user_*`, `current_application`, `current_application_access` y `current_application_permissions`.
- Solo autoriza el foro un acceso con `workspace_user_application_is_active === true`; un token válido sin acceso activo muestra acceso denegado.
- Los permisos son los `workspace_application_permission_slug` de `current_application_permissions` (agrupados por módulo). Nunca se deducen del rol.
- `POST /auth/logout` antes de limpiar la sesión local; si falla, la sesión local se cierra igual y se informa.
- El token se guarda en `localStorage` (`ucebul.forum.access-token`); el resto de la sesión vive en Zustand y se recupera al recargar.

### Códigos de error

| Código | Comportamiento |
| --- | --- |
| 401 | Invalida la sesión, borra el token y redirige al login. |
| 403 | Conserva el token y muestra acceso denegado (o el aviso del recurso). |
| 422 | Errores de Laravel (`errors`) junto a cada campo; se borran al corregirlo. |
| 503 | Conserva el token y muestra indisponibilidad temporal con opción de reintentar. |

Algunas consultas marcan estados esperados como silenciosos (`silentStatuses`, p. ej. 403 = no inscrito) para que no muestren el aviso global; 401 nunca se silencia.

## Contrato con Foro Técnico

- Todas las peticiones llevan `Authorization: Bearer <token de Workspace>`; la identidad sale del token y nunca se envía `workspace_user_id`.
- Respuestas: `{ success, message, data }`; errores: `{ success: false, message, errors }`. Los listados paginados devuelven `data`, `links` y `meta` (`current_page`, `last_page`, `per_page`, `total`…) y aceptan `page` y `per_page` (1–100).
- Los campos conservan los nombres físicos (`forum_course_id`, `forum_lesson_resource_is_downloadable`, `forum_course_favorite_course_id`…).
- Los formularios usan `Form` y `Field` de ucebul_mui con `validator`; sus valores se normalizan a DTO tipados: IDs de select como número, textos recortados y vacíos como `null` donde el contrato lo admite.
- Archivos: portada con `POST /forum/courses/{id}/cover` (campo `cover`) y recursos con `POST /forum/lessons/{id}/resources` (campo `file`), siempre `FormData` con el `File` real tomado de `onChange` de `Field upload`, nunca su nombre.
- Los recursos de lección son privados: se leen con `GET /forum/lesson-resources/{id}` como Blob con Bearer.
- Nombres de usuario: el foro solo guarda IDs de Workspace. La API del foro consulta `GET /api/workspace-user-summaries` de Workspace (una petición por respuesta, caché de 10 min) y añade junto a `forum_topic_workspace_user_id`, `forum_post_workspace_user_id`, `forum_course_instructor_workspace_user_id`, `forum_report_reported_by_workspace_user_id` y `forum_report_resolved_by_workspace_user_id` el objeto `*_workspace_user` (`workspace_user_id`, `workspace_user_name`, `workspace_user_last_name`). La interfaz muestra «Tú», el nombre o, si Workspace no respondió, «Usuario #ID».
- Resolver y descartar reportes aceptan `forum_report_resolution_note` opcional (máx. 2000); se muestra en el detalle del reporte.
- El frontend usa 61 de los 62 endpoints documentados; no usa `PUT /forum/courses/{id}/instructor` (reasignar instructor), que no forma parte de ninguna tarea.

Los detalles por módulo (rutas, reglas y decisiones) están en `AGENTS.md`.

## Funcionalidades

- **Sesión:** login, recuperación al recargar, logout, rutas públicas, privadas y por permiso.
- **Cursos:** catálogo con búsqueda y filtros, detalle, alta y edición con portada, publicación, archivo y eliminación.
- **Lecciones y recursos:** lecciones ordenables, vista previa, video, PDF, imágenes y archivos privados con descarga controlada.
- **Aprendizaje:** inscripción, progreso por curso y lección, posición de video y «Mis cursos».
- **Comunidad:** categorías, preguntas, respuestas anidadas, solución aceptada y reacciones.
- **Moderación:** reportes, revisión con contexto, resolver o descartar con nota opcional, y ocultar o restaurar contenido con confirmación.
- **Búsqueda y favoritos:** búsqueda de cursos y preguntas con debounce, y favoritos de cursos y preguntas guardados en la API.

## Accesibilidad y diseño adaptable

- Diseño verificado sin desplazamiento horizontal a 320, 375, 768, 1024 y 1280 px.
- Enlace «Saltar al contenido», foco visible y botones nativos para todas las acciones.
- `useKeyboardSupport` completa el soporte de teclado de ucebul_mui sin reemplazar sus componentes: las opciones de Select y las pestañas de Tabs reciben foco, roles ARIA, Enter/Espacio y flechas; Dialog y Modal mueven el foco a Cancelar/Cerrar y se cierran con Escape.

## Pendientes y limitaciones conocidas

- **Permisos de gestión total inexistentes en Workspace:** la API exige `forum.community.manage-any` para crear o editar categorías del foro y `forum.courses.manage-any` para gestionar cursos ajenos, pero el seeder de Workspace no define esos permisos. Hoy nadie puede crear categorías desde la aplicación y, sin categorías activas, nadie puede publicar preguntas. Hay que añadir esos permisos en Workspace o cambiar la regla de la API.
- No existen endpoints «¿estoy inscrito?» ni «¿es favorito?»: se derivan del progreso (403 = no inscrito) y del listado completo de favoritos.
- `zod` aparece en `package-lock.json` solo como dependencia de desarrollo transitiva de `eslint-plugin-react-hooks`; la aplicación no lo usa.
- El botón «Reportar» no aparece en el contenido propio; el flujo de reporte desde la interfaz solo se puede probar con dos usuarios.
