
# Instrucciones para ejecutar y compilar la aplicación

## Requisitos previos
- Node.js (versión 16 o superior, recomendada la versión 18 LTS)
- npm (incluido con Node.js)
- Git (opcional, para clonar el repositorio)

## Ejecutar en modo desarrollo

1. Clona o descarga el repositorio
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias:

```bash
npm install
```

Si encuentras problemas con dependencias obsoletas, usa:

```bash
npm install --legacy-peer-deps
```

4. Inicia la aplicación en modo desarrollo:

```bash
npm run dev
```

## Compilar la aplicación para distribución

### Para Windows

```bash
npm run build
npm run electron:build
```

Los archivos instalables se crearán en la carpeta `release` con el nombre "Sistema de Gestión de Inventario y POS".

### Para macOS

```bash
npm run build
npm run electron:build-mac
```

### Para Linux

```bash
npm run build
npm run electron:build-linux
```

## Notas importantes

- La primera vez que ejecutes la aplicación, se creará una base de datos SQLite en la carpeta de datos de la aplicación.
- Por defecto, se incluirán usuarios de ejemplo:
  - Usuario administrador: `admin` / Contraseña: `admin123`
  - Usuario vendedor: `vendedor` / Contraseña: `vendedor123`
- La aplicación se instalará con el nombre "Sistema de Gestión de Inventario y POS" y usará el icono configurado en electron-builder.json.
- Se creará una versión instalable (.exe) y una versión portable para Windows.
