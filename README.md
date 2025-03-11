
# Sistema de Gestión de Inventario y POS

Sistema de gestión de inventario y punto de venta construido con React + Vite y empaquetado como PWA (Progressive Web App).

## Requisitos previos

- Node.js (versión 18 o superior)
- npm (versión 8 o superior)
- Git (opcional, para clonar el repositorio)

## Desarrollo local

1. Clona o descarga el repositorio
2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Instalación como PWA

La aplicación está configurada como una Progressive Web App (PWA), lo que significa que puede instalarse directamente desde cualquier navegador compatible:

### Instalar en PC/Mac:
1. Abre la aplicación en Chrome, Edge o cualquier navegador compatible con PWA
2. Busca el icono de instalación en la barra de direcciones (💾 o similar)
3. Haz clic en "Instalar" o "Instalar aplicación"
4. La aplicación se instalará en tu dispositivo y podrás acceder a ella desde el menú de inicio/escritorio

### Instalar en dispositivos móviles:
1. Abre la aplicación en Chrome (Android) o Safari (iOS)
2. En Android: Aparecerá un mensaje "Añadir a pantalla de inicio"
3. En iOS: Toca el icono de compartir y selecciona "Añadir a pantalla de inicio"
4. La aplicación se instalará sin la barra de direcciones del navegador

### Instalación desde GitHub:
1. Visita la URL del repositorio en GitHub
2. Descarga o clona el repositorio
3. Sigue los pasos de "Desarrollo local" para ejecutarlo
4. Accede desde el navegador a la URL local (http://localhost:8080)
5. Sigue los pasos de instalación como PWA

## Base de datos local

Esta aplicación utiliza Dexie.js (IndexedDB) para almacenar los datos localmente en el navegador. Los datos se guardan en:

- **PC/Mac**: Dentro del almacenamiento del navegador donde se instaló
- **Dispositivos móviles**: En el almacenamiento de la aplicación PWA

Los datos son persistentes entre sesiones, pero están vinculados al navegador/dispositivo específico donde se instaló. No hay sincronización entre dispositivos.

## Características principales

- Gestión completa de inventario
- Sistema de punto de venta (POS)
- Gestión de usuarios y roles
- Reportes y estadísticas
- Subalmacenes y ubicaciones
- Interfaz responsive y moderna
- Instalable como aplicación de escritorio/móvil (PWA)
- Funciona sin conexión a internet

## Tecnologías utilizadas

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Dexie.js (IndexedDB para base de datos local)
- PWA para instalación nativa

## Usuarios por defecto

- Administrador: `admin` / Contraseña: `admin123`
- Vendedor: `vendedor` / Contraseña: `vendedor123`

## Solución de problemas

Si encuentras problemas durante la instalación:

1. Limpia la caché de npm:
```bash
npm cache clean --force
```

2. Elimina node_modules y package-lock.json:
```bash
rm -rf node_modules
rm package-lock.json
```

3. Reinstala las dependencias:
```bash
npm install
```
