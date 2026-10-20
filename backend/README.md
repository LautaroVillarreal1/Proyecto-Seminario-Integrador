# Backend

API NestJS con Prisma. Los módulos de negocio se encuentran en `src/`, y el esquema, las migraciones y el seed de Prisma en `prisma/`.

Desde esta carpeta:

```bash
npm install
docker compose up -d postgres
npm run db:setup
npm run start:dev
```

`docker compose up -d` inicia el stack completo (PostgreSQL, backend y frontend). Si vas a ejecutar NestJS localmente con `npm run start:dev`, iniciá sólo PostgreSQL con `docker compose up -d postgres` para evitar un conflicto de puerto con el backend en contenedor.

La guía general de ejecución está en el [README del repositorio](../README.md).
