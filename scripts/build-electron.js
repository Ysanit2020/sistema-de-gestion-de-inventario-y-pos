
#!/usr/bin/env node
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Función para ejecutar comandos
function ejecutarComando(comando, opciones = {}) {
  console.log(`Ejecutando: ${comando}`);
  try {
    execSync(comando, { stdio: 'inherit', ...opciones });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar: ${comando}`);
    console.error(error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('=== Compilación de aplicación Electron ===');
  console.log(`Node.js: ${process.version}`);
  console.log(`Plataforma: ${os.platform()} (${os.arch()})`);
  
  // Determinar la plataforma
  const plataformaArgumento = process.argv[2];
  const plataforma = plataformaArgumento || os.platform();
  
  // Limpiar carpetas de salida
  console.log('Limpiando carpetas de salida...');
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
  }
  if (fs.existsSync('./release')) {
    fs.rmSync('./release', { recursive: true, force: true });
  }
  
  // Compilar React primero
  console.log('Compilando aplicación React...');
  const exitoCompilacion = ejecutarComando('npm run build');
  
  if (!exitoCompilacion) {
    console.error('Error al compilar la aplicación React. Abortando.');
    process.exit(1);
  }
  
  // Verificar que se ha creado la carpeta dist
  if (!fs.existsSync('./dist')) {
    console.error('No se encontró la carpeta dist después de la compilación. Abortando.');
    process.exit(1);
  }
  
  // Determinar comando de electron-builder
  let comandoElectron = 'npx electron-builder';
  
  switch (plataforma) {
    case 'win32':
    case 'windows':
      console.log('Compilando para Windows...');
      comandoElectron += ' --win';
      break;
    case 'darwin':
    case 'mac':
      console.log('Compilando para macOS...');
      comandoElectron += ' --mac';
      break;
    case 'linux':
      console.log('Compilando para Linux...');
      comandoElectron += ' --linux';
      break;
    default:
      console.log('Compilando para la plataforma actual...');
      break;
  }
  
  // Ejecutar electron-builder
  console.log('Empaquetando aplicación con Electron...');
  const exitoElectron = ejecutarComando(comandoElectron);
  
  if (!exitoElectron) {
    console.error('Error al empaquetar la aplicación con Electron.');
    process.exit(1);
  }
  
  console.log('=== Compilación completada con éxito ===');
  console.log('Los archivos de distribución se encuentran en la carpeta "release".');
}

// Ejecutar la función principal
main().catch(error => {
  console.error('Error inesperado:', error);
  process.exit(1);
});
