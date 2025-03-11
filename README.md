
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

La aplicación está configurada como una Progressive Web App (PWA), lo que significa que puede instalarse directamente desde el navegador:

1. Abre la aplicación en Chrome, Edge o cualquier navegador compatible con PWA
2. Busca el icono de instalación en la barra de direcciones (💾 o similar)
3. Haz clic en "Instalar" o "Instalar aplicación"
4. La aplicación se instalará en tu dispositivo y podrás acceder a ella desde el menú de inicio/escritorio

## Características principales

- Gestión completa de inventario
- Sistema de punto de venta (POS)
- Gestión de usuarios y roles
- Reportes y estadísticas
- Subalmacenes y ubicaciones
- Interfaz responsive y moderna
- Instalable como aplicación de escritorio (PWA)

## Tecnologías utilizadas

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- SQLite (para base de datos local)
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

