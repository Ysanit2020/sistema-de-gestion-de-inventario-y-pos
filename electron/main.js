
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Aseguramos que exista el directorio de datos
const userDataPath = app.getPath('userData');
const dbDir = path.join(userDataPath, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sistema.db');
console.log('Base de datos en:', dbPath);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // En desarrollo carga desde localhost, en producción desde el build
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initDatabase() {
  try {
    db = new Database(dbPath);
    
    // Crear tablas si no existen
    db.exec(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT NOT NULL,
        precio REAL NOT NULL,
        costo REAL,
        stock INTEGER NOT NULL,
        stockMinimo INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        productos TEXT NOT NULL,
        total REAL NOT NULL,
        pagoCon REAL,
        cambio REAL
      );
      
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        nombre TEXT
      );
    `);
    
    // Verificar si ya existen usuarios
    const countUsuarios = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
    
    if (countUsuarios.count === 0) {
      // Agregar usuarios por defecto
      const insertUsuario = db.prepare(
        'INSERT INTO usuarios (usuario, password, rol, nombre) VALUES (?, ?, ?, ?)'
      );
      
      insertUsuario.run('admin', 'admin123', 'admin', 'Administrador');
      insertUsuario.run('vendedor', 'vendedor123', 'trabajador', 'Vendedor');
    }
    
    // Verificar si ya existen productos
    const countProductos = db.prepare('SELECT COUNT(*) as count FROM productos').get();
    
    if (countProductos.count === 0) {
      // Agregar productos de ejemplo
      const insertProducto = db.prepare(
        'INSERT INTO productos (codigo, nombre, descripcion, categoria, precio, costo, stock, stockMinimo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      
      insertProducto.run('P001', 'Arroz Integral 1kg', 'Arroz integral de alta calidad', 'Abarrotes', 28.50, 22.00, 50, 10);
      insertProducto.run('P002', 'Frijol Negro 1kg', 'Frijol negro seleccionado', 'Abarrotes', 32.00, 25.00, 40, 8);
      insertProducto.run('P003', 'Aceite de Oliva 500ml', 'Aceite de oliva extra virgen', 'Aceites', 85.00, 65.00, 25, 5);
      insertProducto.run('P004', 'Azúcar Refinada 1kg', 'Azúcar blanca refinada', 'Abarrotes', 25.00, 20.00, 60, 15);
      insertProducto.run('P005', 'Sal de Mesa 1kg', 'Sal refinada', 'Abarrotes', 15.00, 10.00, 70, 20);
    }
    
    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

// Configurar manejadores de eventos IPC para comunicación con el frontend
function setupIpcHandlers() {
  // Obtener todos los productos
  ipcMain.handle('get-productos', async () => {
    const productos = db.prepare('SELECT * FROM productos').all();
    return productos;
  });
  
  // Obtener un producto por ID
  ipcMain.handle('get-producto', async (_, id) => {
    const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    return producto;
  });
  
  // Crear o actualizar un producto
  ipcMain.handle('save-producto', async (_, producto) => {
    if (producto.id) {
      // Actualizar
      const stmt = db.prepare(`
        UPDATE productos 
        SET codigo = ?, nombre = ?, descripcion = ?, categoria = ?, 
            precio = ?, costo = ?, stock = ?, stockMinimo = ?
        WHERE id = ?
      `);
      
      stmt.run(
        producto.codigo, 
        producto.nombre, 
        producto.descripcion || null, 
        producto.categoria, 
        producto.precio, 
        producto.costo || null, 
        producto.stock, 
        producto.stockMinimo || null, 
        producto.id
      );
      
      return { ...producto };
    } else {
      // Crear nuevo
      const stmt = db.prepare(`
        INSERT INTO productos 
        (codigo, nombre, descripcion, categoria, precio, costo, stock, stockMinimo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = stmt.run(
        producto.codigo, 
        producto.nombre, 
        producto.descripcion || null, 
        producto.categoria, 
        producto.precio, 
        producto.costo || null, 
        producto.stock, 
        producto.stockMinimo || null
      );
      
      return { ...producto, id: info.lastInsertRowid };
    }
  });
  
  // Eliminar un producto
  ipcMain.handle('delete-producto', async (_, id) => {
    db.prepare('DELETE FROM productos WHERE id = ?').run(id);
    return true;
  });
  
  // Iniciar sesión
  ipcMain.handle('login', async (_, username, password) => {
    const user = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(username);
    
    if (user && user.password === password) {
      return user;
    } else {
      return null;
    }
  });
  
  // Registrar venta
  ipcMain.handle('save-venta', async (_, venta) => {
    const ventaData = {
      fecha: venta.fecha.toISOString(),
      productos: JSON.stringify(venta.productos),
      total: venta.total,
      pagoCon: venta.pagoCon || null,
      cambio: venta.cambio || null
    };
    
    const stmt = db.prepare(`
      INSERT INTO ventas (fecha, productos, total, pagoCon, cambio)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      ventaData.fecha,
      ventaData.productos,
      ventaData.total,
      ventaData.pagoCon,
      ventaData.cambio
    );
    
    // Actualizar stock de productos
    const updateStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
    for (const item of venta.productos) {
      updateStock.run(item.cantidad, item.id);
    }
    
    return { ...venta, id: info.lastInsertRowid };
  });
  
  // Obtener todas las ventas
  ipcMain.handle('get-ventas', async () => {
    const ventas = db.prepare('SELECT * FROM ventas').all();
    return ventas.map(venta => ({
      ...venta,
      fecha: new Date(venta.fecha),
      productos: JSON.parse(venta.productos)
    }));
  });
}

app.on('ready', () => {
  initDatabase();
  setupIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

