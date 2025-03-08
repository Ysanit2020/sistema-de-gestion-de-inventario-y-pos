
# Instrucciones para ejecutar y compilar la aplicación

## Requisitos previos
- Node.js (versión 18 o superior, se ha probado con Node 22)
- npm (versión 8 o superior, se ha probado con npm 10)
- Git (opcional, para clonar el repositorio)

## Ejecutar en modo desarrollo

1. Clona o descarga el repositorio
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias:

```bash
npm install --legacy-peer-deps
```

El flag `--legacy-peer-deps` es necesario para evitar errores con dependencias obsoletas.

4. Inicia la aplicación en modo desarrollo:

```bash
npm run dev
```

## Compilar la aplicación para distribución

### Para Windows

1. Asegúrate de tener instalado Node.js 18 o superior
2. Ejecuta los siguientes comandos:

```bash
npm install --legacy-peer-deps
npm run build
npm run electron:build
```

Los archivos instalables se crearán en la carpeta `release` con el nombre "Sistema de Gestión de Inventario y POS". Se generará tanto una versión instalable (.exe) como una versión portable.

### Para macOS

```bash
npm install --legacy-peer-deps
npm run build
npm run electron:build-mac
```

### Para Linux

```bash
npm install --legacy-peer-deps
npm run build
npm run electron:build-linux
```

## Solución de problemas comunes

Si encuentras errores relacionados con versiones de dependencias o conflictos, prueba los siguientes pasos:

1. Limpia la caché de npm:
   ```bash
   npm cache clean --force
   ```

2. Elimina la carpeta node_modules y el archivo package-lock.json:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   ```

3. Reinstala las dependencias con el flag para ignorar problemas de dependencias entre pares:
   ```bash
   npm install --legacy-peer-deps
   ```

4. Si continúas teniendo problemas, prueba con una versión LTS de Node.js (18 LTS) que es más estable para proyectos Electron.

## Notas importantes

- La primera vez que ejecutes la aplicación, se creará una base de datos SQLite en la carpeta de datos de la aplicación.
- Por defecto, se incluirán usuarios de ejemplo:
  - Usuario administrador: `admin` / Contraseña: `admin123`
  - Usuario vendedor: `vendedor` / Contraseña: `vendedor123`
- La aplicación se instalará con el nombre "Sistema de Gestión de Inventario y POS" y usará el icono configurado en electron-builder.json.
