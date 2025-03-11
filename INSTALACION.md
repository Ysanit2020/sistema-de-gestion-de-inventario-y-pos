
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
npm install
```

4. Inicia la aplicación en modo desarrollo:

```bash
npm run dev
```

## Instalación como PWA

La aplicación está configurada como una Progressive Web App (PWA), lo que significa que puede instalarse directamente desde el navegador:

1. Abre la aplicación en Chrome, Edge o cualquier navegador compatible con PWA
2. Busca el icono de instalación en la barra de direcciones (💾 o similar)
3. Haz clic en "Instalar" o "Instalar aplicación"
4. La aplicación se instalará en tu dispositivo y podrás acceder a ella desde el menú de inicio/escritorio

## Notas importantes

- La primera vez que ejecutes la aplicación, se creará una base de datos SQLite en la carpeta de datos de la aplicación.
- Por defecto, se incluirán usuarios de ejemplo:
  - Usuario administrador: `admin` / Contraseña: `admin123`
  - Usuario vendedor: `vendedor` / Contraseña: `vendedor123`
- Si usas Node.js 22, es posible que encuentres algunas advertencias de compatibilidad. La mayoría deberían ser inofensivas, pero si tienes problemas, considera usar Node.js 18 LTS.

## Solución de problemas comunes

Si encuentras errores durante la instalación, prueba los siguientes pasos:

1. Limpia la caché de npm:
```bash
npm cache clean --force
```

2. Elimina la carpeta node_modules y el archivo package-lock.json:
```bash
rm -rf node_modules
rm package-lock.json
```

3. Reinstala las dependencias:
```bash
npm install
```

4. Si continúas teniendo problemas, prueba con una versión LTS de Node.js (18 LTS) que es más estable.
