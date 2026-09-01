# Proyecto Seminario Integrador

## Puesta en marcha

Estas instrucciones permiten ejecutar el proyecto después de clonarlo por primera vez.

### Requisitos

- [Node.js](https://nodejs.org/) instalado, preferentemente la versión LTS.
- [Docker](https://www.docker.com/) y Docker Compose instalados.
- Git instalado para clonar el repositorio.

### Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/LautaroVillarreal1/Proyecto-Seminario-Integrador.git
   ```

2. Entrar a la carpeta del proyecto:

   ```bash
   cd Proyecto-Seminario-Integrador/sistema-gestor-de-remitos
   ```

3. Instalar las dependencias (incluyendo Prisma):

   ```bash
   npm install
   ```

4. Levantar la base de datos PostgreSQL con Docker:

   ```bash
   docker-compose up -d
   ```

   Este comando inicia un contenedor PostgreSQL en segundo plano. El puerto 5432 estará disponible localmente.

5. Generar el cliente de Prisma y aplicar las migraciones:

   ```bash
   npx prisma migrate dev --name init
   ```

   Esto genera el cliente de Prisma y sincroniza el esquema con la base de datos PostgreSQL.

6. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run start:dev
   ```

El servidor queda disponible en [http://localhost:3000](http://localhost:3000). El modo desarrollo vuelve a cargar la aplicación automáticamente cuando se modifica el código.

Para detener el servidor, presionar `Ctrl + C` en la terminal.

### Importante

- El comando `npm run start:dev` debe ejecutarse desde la carpeta `sistema-gestor-de-remitos`, porque allí se encuentra el `package.json` que define ese script.
- El contenedor PostgreSQL debe estar corriendo antes de ejecutar las migraciones y el servidor.
- Para detener el contenedor: `docker-compose down`
- Para ver los logs del contenedor: `docker-compose logs -f`
- Las credenciales por defecto son: usuario `postgres`, contraseña `postgres`, base de datos `sistema_gestor_remitos`.