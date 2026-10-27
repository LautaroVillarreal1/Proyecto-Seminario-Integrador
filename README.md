# Frulatti — gestión de pedidos y remitos

Aplicación web para administrar productos e insumos, preparar pedidos y hacer el seguimiento de sus entregas. El sistema está compuesto por una interfaz web, una API y una base de datos PostgreSQL.

## Qué permite hacer

- **Administrar productos y categorías:** mantener el catálogo, sus precios, unidades, códigos y niveles de stock.
- **Controlar insumos:** registrar existencias, costos, proveedores y stock mínimo; identificar insumos con bajo stock.
- **Gestionar recetas:** asociar ingredientes a productos, registrar rendimiento e instrucciones, y calcular cuánto se puede producir con los insumos disponibles.
- **Crear y seguir remitos:** elegir un cliente, asignar un viajante, agregar productos y cantidades, aplicar descuentos y consultar el estado del pedido.
- **Dar seguimiento a entregas:** los viajantes consultan los remitos que tienen asignados y pueden informar el avance, marcar una entrega o registrar un inconveniente y su forma de pago.
- **Consultar indicadores e informes:** el panel resume remitos y alertas de stock; los informes permiten analizar entregas por período, estado, forma de pago, viajante y ventas diarias.
- **Mantener los cambios sincronizados:** las actualizaciones de remitos se transmiten al frontend en tiempo real mediante Server-Sent Events (SSE).

### Flujo de un remito

Un administrador crea el remito con cliente, viajante y detalle de productos, y puede guardarlo como borrador o dejarlo pendiente. Si no alcanza el stock, el sistema informa qué productos faltan y solicita confirmación: el remito queda pendiente y no descuenta existencias hasta que un administrador lo confirme con stock suficiente. Cuando hay stock suficiente al crearlo, las cantidades se descuentan automáticamente.

El viajante ve sus remitos asignados y puede avanzar su estado durante la entrega: **pendiente → en camino → entregado**. Si surge un problema, puede reportarlo y luego reanudar el envío, completar la entrega o cancelar el remito. Al registrar una entrega se guarda la forma de pago.

### Perfiles

- **Administración:** acceso al panel, remitos, catálogo, categorías, inventario, recetas e informes.
- **Viajante:** acceso a sus remitos asignados y a las acciones de seguimiento de la entrega.

## Tecnologías

- **Frontend:** React, TypeScript, Vite y React Router.
- **Backend:** NestJS, TypeScript y Prisma.
- **Base de datos:** PostgreSQL.
- **Ejecución integrada:** Docker Compose con PostgreSQL, API y frontend servido por Nginx.

## Requisitos

- Node.js y npm para desarrollo local.
- Docker Desktop con Docker Compose para ejecutar la aplicación completa.

## Ejecutar la aplicación completa con Docker

Desde la carpeta `backend/`:

```bash
cd backend
docker compose up --build
```

Compose levanta PostgreSQL, la API y el frontend; el contenedor del backend prepara la base y carga los datos iniciales. La primera ejecución puede tardar mientras se construyen las imágenes.

- Aplicación web: <http://localhost:4200>
- API: <http://localhost:3000/api>
- PostgreSQL: `localhost:5432`

Para detener los servicios, desde `backend/` ejecutá:

```bash
docker compose down
```

Para borrar también los datos persistidos de PostgreSQL, se puede usar `docker compose down -v`. **Esto elimina los datos locales de la base.**

## Desarrollo local del backend

1. Iniciá PostgreSQL desde `backend/`:

   ```bash
   cd backend
   docker compose up -d postgres
   ```

2. Creá `backend/.env` con una URL de conexión válida y un secreto JWT local. Por ejemplo, con las credenciales de PostgreSQL declaradas en Compose:

   ```dotenv
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_gestor_remitos?schema=public"
   JWT_SECRET="reemplazar-por-un-secreto-local"
   ```

3. Instalá las dependencias, prepará la base y levantá NestJS:

   ```bash
   npm install
   npm run db:setup
   npm run start:dev
   ```

La API local queda disponible en <http://localhost:3000/api>. `db:setup` ejecuta las migraciones y carga los datos iniciales. El archivo `backend/.env` es local y no se versiona.

No ejecutes al mismo tiempo el backend local y el servicio `backend` de Compose: ambos utilizan el puerto `3000`.

## Desarrollo local del frontend

Desde `front/`:

```bash
cd front
npm install
npm run start:dev
```

Vite sirve la interfaz en <http://localhost:8443>. El frontend envía sus solicitudes a rutas relativas bajo `/api`; el proxy a la API está configurado en el Nginx usado por Docker Compose, no en el servidor Vite. Por eso, para probar la aplicación completa con API y base de datos, usá Compose; Vite por separado sirve para trabajar sobre la interfaz salvo que se configure un proxy de desarrollo.

Para generar la compilación del frontend:

```bash
npm run build
```

## Pruebas

Desde `backend/`:

```bash
npm test
npm run test:e2e
```

## Estructura del repositorio

```text
backend/
  src/
    auth/          # Autenticación y permisos por rol
    catalog/       # Productos, categorías, insumos y datos geográficos
    recipes/       # Recetas y cálculo asociado
    remitos/       # Creación, consulta y seguimiento de remitos
    reports/       # Resúmenes de remitos
    realtime/      # Eventos SSE de actualización
    users/         # Usuarios
    shared/        # Infraestructura compartida, incluido Prisma
  prisma/          # Esquema, migraciones y datos iniciales
  test/            # Pruebas end-to-end
front/
  src/
    components/    # Componentes reutilizables
    context/       # Estado compartido e integración con la API
    pages/         # Vistas de la aplicación
    utils/         # Utilidades
archivos/          # Requisitos, descripción del caso, diagramas y recursos
```

Los modelos persistidos se definen en `backend/prisma/schema.prisma`. La configuración de Docker Compose y los Dockerfiles permiten ejecutar los tres servicios integrados.
