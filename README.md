# Proyecto Seminario Integrador

## Puesta en marcha

Estas instrucciones permiten ejecutar el proyecto después de clonarlo por primera vez.

### Requisitos

- [Node.js](https://nodejs.org/) instalado, preferentemente la versión LTS.
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

3. Instalar las dependencias:

   ```bash
   npm install
   ```

4. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run start:dev
   ```

El servidor queda disponible en [http://localhost:3000](http://localhost:3000). El modo desarrollo vuelve a cargar la aplicación automáticamente cuando se modifica el código.

Para detener el servidor, presionar `Ctrl + C` en la terminal.

### Importante

El comando `npm run start:dev` debe ejecutarse desde la carpeta `sistema-gestor-de-remitos`, porque allí se encuentra el `package.json` que define ese script.