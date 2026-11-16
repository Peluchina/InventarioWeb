# Stockwise — frontend de inventario

Frontend web para la gestión de inventario, construido con Angular standalone. Incluye los módulos Proveedores y Usuarios.

## Versiones

- Node.js: `24.11.0` (Angular 21 admite Node `^20.19.0`, `^22.12.0` o `^24.0.0`).
- npm: `11.12.0`.
- Angular: `21.2.26`.
- Angular CLI: `21.2.29`.
- TypeScript: `5.9.3`.
- Angular Material / CDK: `21.2.14`.
- RxJS: `7.8.2`.

Se eligió Angular 21 LTS porque Node 24.11.0 satisface su compatibilidad; Angular 22 requiere una versión posterior de Node 24. Ver [versiones y soporte de Angular](https://angular.dev/reference/releases) y [compatibilidad de versiones](https://angular.dev/reference/versions).

## Instalación y ejecución

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

## Build

```bash
npm run build
```

## API

El origen de la API se configura en `src/environments/environment.ts` y `src/environments/environment.production.ts`. Durante desarrollo, `proxy.conf.json` reenvía `/api` a `http://localhost:8080` para evitar problemas de CORS; en producción se configura `apiUrl` con el origen del backend.

El módulo Proveedores consume:

- `GET /api/proveedores`
- `GET /api/proveedores/{id}`
- `POST /api/proveedores`
- `PUT /api/proveedores/{id}`
- `PATCH /api/proveedores/{id}/estado`
- `DELETE /api/proveedores/{id}`

El módulo Usuarios consume los mismos métodos CRUD sobre `/api/usuarios`, incluido `PATCH /api/usuarios/{id}/estado`. Sus DTO usan `nombre`, `apellidos`, `dni`, `direccion`, `rolId`, `email`, `contrasenia` y `estadoId`. La contraseña no aparece en las respuestas de listado o detalle. El `PUT` del backend reemplaza `contrasenia`, por eso editar requiere ingresar una contraseña nueva. El backend no expone un endpoint para listar roles; el formulario acepta el `rolId` numérico.

## Autenticación y navegación

El frontend inicia el flujo de Spring Security en `/oauth2/authorization/google`. Tras el callback gestionado por Spring, obtiene el JWT desde `/auth/token` y el perfil desde `/api/auth/me`. Conserva el JWT en memoria durante la sesión de la página; al recargar, lo vuelve a solicitar usando la cookie de sesión de Spring. El interceptor envía `Authorization: Bearer` solo a rutas `/api/**`. Cerrar sesión limpia el estado local y llama a `POST /logout`. Las rutas se centralizan en `src/environments/environment.ts` y `src/environments/environment.production.ts`; en desarrollo, el proxy reenvía OAuth2 y logout al backend.

El endpoint `/api/auth/me` debe devolver un usuario con `email` y `name`, o con `email`, `nombre` y `apellidos`; `id` y `picture` son opcionales. El JWT debe ser estándar y contener `exp`, además de `rol` (o `role`); `sub` y `email` se usan cuando están presentes. Angular normaliza `ADMINISTRADOR` y `ROLE_ADMINISTRADOR` (igual para `ALMACENISTA`) antes de comprobar permisos. El rol se obtiene de los claims del JWT y no se edita en la interfaz. Para mostrar el resultado amigable de un fallo OAuth, Spring debe redirigir al frontend a `/login?error=user_not_registered` o `/login?error=user_inactive`; Angular nunca muestra ese valor interno. El código Spring Boot no está incluido en este workspace, por lo que hay que confirmar y configurar allí las reglas de autorización, la firma/claim del token, la política CSRF/CORS y el manejador de fallos OAuth.

Las rutas de módulos existentes quedan protegidas por `AuthGuard`; las rutas de creación y edición de proveedores, productos y usuarios requieren `ADMINISTRADOR`. El rol `ALMACENISTA` puede consultar esos listados y usar las operaciones existentes de movimientos. Las acciones administrativas también se ocultan en las listas para almacenistas. Categorías y almacenes aparecen como opciones pendientes porque todavía no tienen rutas o páginas en Angular.

El contrato OpenAPI local no coincide en algunos nombres (por ejemplo `rol_id` y el body del estado); el módulo sigue los DTO y el controlador Java del backend (`rolId` y `{ estadoId }`).

## Estructura

```text
src/app/
├── core/          Configuración, interceptor y servicios globales
├── features/      Funcionalidades aisladas por módulo
│   ├── proveedores/
│   └── usuarios/
├── layouts/       Layout principal con toolbar y sidebar
└── shared/        Componentes reutilizables
```
