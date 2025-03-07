
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');

// Determinar scripts basados en el sistema operativo
console.log('Preparando compilación para Electron...');

// Asegurarse de que se ha ejecutado el build de React
if (!fs.existsSync('./dist')) {
  console.log('Ejecutando build de React primero...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Determinar la plataforma
const platform = process.argv[2] || os.platform();

let buildCommand = 'npx electron-builder';

switch (platform) {
  case 'win32':
  case 'windows':
    console.log('Compilando para Windows...');
    buildCommand += ' --win';
    break;
  case 'darwin':
  case 'mac':
    console.log('Compilando para macOS...');
    buildCommand += ' --mac';
    break;
  case 'linux':
    console.log('Compilando para Linux...');
    buildCommand += ' --linux';
    break;
  default:
    console.log('Compilando para la plataforma actual...');
    break;
}

// Ejecutar el comando de compilación
try {
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('¡Compilación completada con éxito!');
  console.log('Los archivos instalables se encuentran en la carpeta "release"');
} catch (error) {
  console.error('Error durante la compilación:', error);
  process.exit(1);
}
