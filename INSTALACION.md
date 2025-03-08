
# Instrucciones para ejecutar y compilar la aplicación

## Requisitos previos
- Node.js (versión 18 o superior, probado con Node 22)
- npm (versión 8 o superior, probado con npm 10)
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

### Opción 1: Usando script de electron:build

Para compilar la aplicación y crear los archivos instalables, sigue estos pasos:

1. Asegúrate de tener instaladas las dependencias:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Ejecuta el script de construcción:
   ```bash
   node scripts/build-electron.js
   ```

   Esto compilará tu aplicación React y luego empaquetará la aplicación Electron para tu sistema operativo actual.

3. Para una plataforma específica:
   ```bash
   # Para Windows
   node scripts/build-electron.js windows

   # Para macOS
   node scripts/build-electron.js mac

   # Para Linux
   node scripts/build-electron.js linux
   ```

### Opción 2: Proceso manual paso a paso

Si prefieres ejecutar los comandos manualmente:

1. Instala las dependencias:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Compila la aplicación React:
   ```bash
   npm run build
   ```

3. Empaqueta con electron-builder para tu plataforma:
   ```bash
   # Para Windows
   npx electron-builder --win

   # Para macOS
   npx electron-builder --mac

   # Para Linux
   npx electron-builder --linux
   ```

Los archivos instalables se crearán en la carpeta `release` con el nombre "Sistema de Gestión de Inventario y POS". Se generará tanto una versión instalable (.exe) como una versión portable.

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

5. Si recibes errores sobre "native modules", asegúrate de tener instaladas las herramientas de compilación:
   - En Windows: `npm install --global windows-build-tools`
   - En macOS: Xcode Command Line Tools (`xcode-select --install`)
   - En Linux: `sudo apt-get install build-essential`

## Notas importantes

- La primera vez que ejecutes la aplicación, se creará una base de datos SQLite en la carpeta de datos de la aplicación.
- Por defecto, se incluirán usuarios de ejemplo:
  - Usuario administrador: `admin` / Contraseña: `admin123`
  - Usuario vendedor: `vendedor` / Contraseña: `vendedor123`
- La aplicación se instalará con el nombre "Sistema de Gestión de Inventario y POS" y usará el icono configurado en electron-builder.json.
- Si usas Node.js 22, es posible que encuentres algunas advertencias de compatibilidad. La mayoría deberían ser inofensivas, pero si tienes problemas, considera usar Node.js 18 LTS.
