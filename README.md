# Proyecto Seminario Integrador

El repositorio está separado en dos aplicaciones independientes:

- `backend/`: API NestJS, módulos de negocio, pruebas y Prisma.
- `front/`: aplicación React/Vite.
- `archivos/`: documentación, diagramas y recursos de referencia del proyecto.

## Requisitos

- Node.js y npm.
- Docker Desktop con Docker Compose.

## Backend

Instalá las dependencias y levantá los servicios Docker desde `backend/`:

```bash
cd backend
npm install
docker compose up -d
```

El Compose inicia PostgreSQL, el backend y el frontend. En ese modo, la API queda disponible en `http://localhost:3000/api` y la aplicación web en `http://localhost:4200`. No ejecutes a la vez el backend local de desarrollo mientras el servicio `backend` de Compose esté activo, porque ambos usan el puerto 3000.

Para trabajar con el backend local, iniciá únicamente PostgreSQL y luego el servidor NestJS:

```bash
cd backend
docker compose up -d postgres
npm run db:setup
npm run start:dev
```

El servidor local queda disponible en `http://localhost:3000/api`. El archivo `backend/.env` contiene la configuración local de entorno y no se versiona; configurá `DATABASE_URL` y `JWT_SECRET` para tu entorno.

## Frontend

Para ejecutar Vite independientemente:

```bash
cd front
npm install
npm run start:dev
```

El frontend usa el servidor de desarrollo de Vite en `http://localhost:8443`. También se puede compilar con `npm run build` desde `front/`.

## Pruebas del backend

Desde `backend/`:

```bash
npm test
npm run test:e2e
```

## Estructura

```text
backend/
  src/
    auth/
    catalog/
    realtime/
    recipes/
    remitos/
    reports/
    shared/infrastructure/prisma/
    users/
  prisma/
  test/
front/
  src/
    assets/
    components/
    context/
    data/
    pages/
    utils/
```

Los modelos y las migraciones del ORM permanecen en `backend/prisma/`; no se duplican como entidades TypeScript. Los módulos NestJS mantienen sus responsabilidades y DTOs junto a cada módulo.

## Archivos de referencia

La carpeta `archivos/` reúne la descripción del caso, los requisitos funcionales, los diagramas del sistema y el logo original de Frulatti. El frontend conserva su propia copia del logo en `front/src/assets/`.
