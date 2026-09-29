# Foro técnico UCEBUL

Base frontend de una plataforma educativa y comunitaria agropecuaria. React 19, TypeScript y Vite, con componentes e iconos de `ucebul_mui`.

## Desarrollo

```sh
npm ci
cp .env.example .env
npm run dev
```

Vite sirve la aplicación en el puerto 5175. Para comprobar la entrega:

```sh
npm run build
npm run lint
```

En producción, configurar el servidor para devolver `index.html` en las rutas del frontend (React Router).

## Autenticación — Tarea 01

**Pendiente de contrato:** el prompt exige `current_application_access` activo, pero no define su tipo, propiedad de estado ni valor activo. La implementación conserva ese dato como `unknown` y bloquea la autorización hasta confirmarlo. Un acceso ausente produce acceso denegado; uno presente muestra un error de verificación. El login completo con acceso autorizado **no está terminado ni validado contra Workspace real**. Para completarlo se necesita un ejemplo JSON de acceso activo e inactivo y ajustar `src/features/auth/utils/session-policy.ts`.

Implementado:

- `src/features/auth/store/auth.store.ts`: Zustand con token, usuario, estado, aplicación, acceso, permisos, bootstrap y error. Acciones de login, logout, recuperación, limpieza y consulta de permisos.
- Token persistido únicamente en `localStorage` bajo `ucebul.forum.access-token`. Usuario y permisos se recuperan de Workspace, sin persistir la contraseña.
- `POST /auth/login` con los campos `workspace_user_email`, `workspace_user_password` y `workspace_personal_access_token_name: "forum-platform"`; luego `GET /auth/me?application_slug=ucebul-forum`.
- Bootstrap deduplicado incluso con React StrictMode. Cancelación y control de versión para que respuestas anteriores no restauren ni invaliden otra sesión.
- Bearer en `workspaceApi` y `forumApi`. El login se envía sin una sesión anterior. Un 401 invalida la sesión; 403 muestra acceso denegado sin borrar el token; 503 conserva el token. Si falla la verificación de sesión, las rutas permanecen bloqueadas y se ofrece reintentar.
- `POST /auth/logout` a Workspace antes de limpiar estado y almacenamiento local, incluso si falla el cierre remoto. Se informa el fallo remoto.
- Login con `Form`, `Field`, `Button`, validadores e iconos de `ucebul_mui`. Errores de servidor junto al formulario y errores Laravel 422 de `errors` junto al campo, eliminados al corregir.
- `PublicRoute`, `PrivateRoute`, `PermissionRoute`, `/login`, `/unauthorized` y página 404. Las secciones existentes están protegidas por sesión. Se conserva el destino solicitado tras iniciar sesión.
- Extracción de `workspace_application_permission_slug` recorriendo los grupos por módulo. `PermissionRoute` admite `permissions` y `mode="all" | "any"`, niega listas vacías y se usa dentro de `PrivateRoute`. No se asignan permisos supuestos a las secciones: faltan sus slugs concretos.

Las secciones de cursos, comunidad, aprendizaje y favoritos mantienen sus páginas de disponibilidad pendiente. No se implementaron cursos en esta tarea.

## Variables

```dotenv
VITE_WORKSPACE_API_URL=http://localhost:8000/api
VITE_FORUM_API_URL=http://localhost:8002/api
VITE_APPLICATION_SLUG=ucebul-forum
```

Las variables Vite son públicas: no incluir secretos. `VITE_APPLICATION_SLUG` se envía como `application_slug` en la consulta de sesión.

## Dependencia UI local

El proyecto inicial utilizaba pnpm y una referencia GitHub para `ucebul_mui`. Se migró a npm y `package-lock.json`. Para evitar acceso a repositorios externos, `vendor/ucebul_mui-0.0.38.tgz` contiene la versión ya instalada, empaquetada localmente sin ejecutar scripts. `package.json` utiliza ese archivo; conservarlo para que `npm ci` sea reproducible. No se consultó el código remoto ni se modificó el paquete.

El paquete UI declara sus propias dependencias transitivas. Esta aplicación no utiliza sus funcionalidades de IA ni servicios internos. La compilación actual emite un WASM de aproximadamente 21,6 MB como dependencia transitiva del paquete UI; esto aumenta el tamaño de distribución y queda pendiente de optimización desde el paquete, sin modificarlo en este proyecto.

## Contratos pendientes

- **Imprescindible para terminar Tarea 01:** JSON de `current_application_access` activo e inactivo. No se interpreta la mera existencia del objeto como autorización.
- Confirmar un ejemplo real de `current_application_permissions` agrupado por módulo y los slugs requeridos por las futuras secciones.
- Confirmar la ubicación de errores 422 si Workspace utiliza una envoltura distinta del formato Laravel `errors` de primer nivel.
- Las futuras tareas necesitan sus contratos de cursos, lecciones, aprendizaje, comunidad, favoritos, moderación y archivos.

## Verificación

```sh
npm test
npm run build
npm run lint
```

Las pruebas utilizan el runner de Node y adaptadores Axios exclusivos de tests; la aplicación no incorpora mocks. Cubren DTO de login, Bearer en ambas API, acceso ausente, extracción de permisos, deduplicación, reintento tras 503, 401/403/503, errores 422, logout y respuestas obsoletas. No acreditan todavía un ingreso con acceso activo.

Comprobado en Chrome headless: redirección de una ruta protegida al login, tipos email/password, validaciones de campos requeridos y ausencia de desbordamiento horizontal a 1440, 375 y 320 px. Las comprobaciones finales no produjeron excepciones de JavaScript.
