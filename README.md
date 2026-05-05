# Products App (NestJS Microservices)

Proyecto backend en progreso basado en NestJS con arquitectura de microservicios. Actualmente implementa un flujo basico de productos: un API Gateway HTTP que delega operaciones a un microservicio de productos via transporte TCP.

## Estado del proyecto (WIP)

**Estado:** Work In Progress (incompleto).

Ya existe una base funcional para CRUD de productos y persistencia con Prisma + SQLite, pero todavia faltan piezas clave para considerarlo listo para produccion (hardening, observabilidad, pruebas robustas y estandarizacion operativa).

## Arquitectura general

El repo contiene dos aplicaciones NestJS separadas:

1. **`client-gateway`**
   - Expone API HTTP REST bajo prefijo global `api`.
   - Valida DTOs con `ValidationPipe` global.
   - Se conecta al microservicio de productos con `@nestjs/microservices` usando **TCP**.
   - Traduce errores RPC hacia respuestas HTTP con un filtro custom.

2. **`products-ms`**
   - Microservicio NestJS (sin servidor HTTP) levantado con `Transport.TCP`.
   - Maneja comandos (`MessagePattern`) para crear/listar/consultar/actualizar/eliminar productos.
   - Persistencia con **Prisma** y adapter **better-sqlite3**.
   - Implementa borrado logico (`available = false`) en la eliminacion.

### Comunicacion entre servicios

- Cliente -> `client-gateway` por HTTP.
- `client-gateway` -> `products-ms` por TCP usando comandos:
  - `create_product`
  - `find_all_products`
  - `find_one_product`
  - `update_product`
  - `delete_product`

## Estructura de carpetas

```text
products-app/
├── client-gateway/
│   ├── src/
│   │   ├── common/          # DTOs y filtros de excepcion RPC->HTTP
│   │   ├── config/          # Validacion de env y tokens de servicios
│   │   ├── products/        # Controller REST + DTOs
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── products-ms/
│   ├── prisma/              # schema + migraciones
│   ├── src/
│   │   ├── common/          # DTOs compartidos (paginacion)
│   │   ├── config/          # Validacion de env
│   │   ├── generated/       # cliente Prisma generado
│   │   ├── products/        # controller RPC + service + DTOs
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── prisma.service.ts
│   └── package.json
└── README.md
```

## Requisitos

- Node.js 20+ recomendado.
- npm 10+.
- No requiere motor externo de base de datos para desarrollo local (usa SQLite por archivo).

## Configuracion (variables de entorno)

Definir variables de entorno por servicio.

### `client-gateway`

- `PORT`: puerto HTTP del gateway.
- `PRODUCTS_MICROSERVICE_HOST`: host del microservicio de productos.
- `PRODUCTS_MICROSERVICE_PORT`: puerto TCP del microservicio de productos.

### `products-ms`

- `PORT`: puerto TCP donde escucha el microservicio.
- `DATABASE_URL`: conexion SQLite usada por Prisma (por ejemplo, una ruta de archivo SQLite).

> Nota: las variables se validan con Joi al iniciar cada app. Si falta alguna, la app falla en bootstrap con error de configuracion.

## Ejecucion local

### 1) Instalar dependencias

```bash
# gateway
cd client-gateway
npm install

# microservicio
cd ../products-ms
npm install
```

### 2) Configurar entorno

- Crear/ajustar archivos de entorno en cada app (`client-gateway` y `products-ms`) con las variables listadas arriba.

### 3) Aplicar migraciones de Prisma (products-ms)

```bash
cd products-ms
npx prisma migrate dev
```

### 4) Levantar servicios en desarrollo

Terminal 1:

```bash
cd products-ms
npm run start:dev
```

Terminal 2:

```bash
cd client-gateway
npm run start:dev
```

Con eso, el gateway queda accesible por HTTP en `http://localhost:<PORT_DEL_GATEWAY>/api`.

## Scripts utiles

Ambas apps exponen scripts similares:

- `npm run start:dev` - arranque en modo watch.
- `npm run start` - arranque normal.
- `npm run start:prod` - ejecucion desde `dist`.
- `npm run build` - compilacion TypeScript.
- `npm run test` - tests unitarios (Jest).
- `npm run test:e2e` - tests e2e base.
- `npm run lint` - lint con ESLint.

En `products-ms`, adicionalmente se usan comandos Prisma por CLI (`npx prisma ...`) para migraciones y tareas de esquema.

## Roadmap / pendiente

- Consolidar manejo de errores (actualmente hay detalles a corregir en filtro RPC y consistencia de respuestas).
- Incorporar observabilidad (logs estructurados, trazas y metricas).
- Aumentar cobertura de tests unitarios/e2e del flujo completo gateway -> microservicio -> DB.
- Agregar documentacion de API (Swagger/OpenAPI en gateway).
- Revisar estrategia de configuracion para ambientes (dev/staging/prod).
- Definir politicas de seguridad y hardening (rate limit, validaciones adicionales, etc.).
- Evaluar extraccion de contratos compartidos (DTOs/eventos) para evitar duplicacion entre apps.

## Notas importantes

- Es un proyecto en construccion: puede haber cambios frecuentes en contratos y estructura.
- El CRUD actual de productos trabaja con campos principales: `name`, `price`, `available`, timestamps.
- La eliminacion implementada es logica (`available = false`), no borrado fisico.
- Hay artefactos compilados (`dist/`) presentes en el repo; para desarrollo diario, la fuente de verdad es `src/`.
