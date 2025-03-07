
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
        stock INTEGER NOT NULL DEFAULT 0,
        stockMinimo INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        productos TEXT NOT NULL,
        total REAL NOT NULL,
        pagoCon REAL,
        cambio REAL,
        subalmacenId INTEGER,
        vendedorId INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        nombre TEXT,
        subalmacenId INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS subalmacenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        direccion TEXT,
        descripcion TEXT
      );
      
      CREATE TABLE IF NOT EXISTS inventario_subalmacen (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productoId INTEGER NOT NULL,
        subalmacenId INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (productoId) REFERENCES productos (id),
        FOREIGN KEY (subalmacenId) REFERENCES subalmacenes (id)
      );
    `);
    
    // Verificar si ya existen subalmacenes
    const countSubalmacenes = db.prepare('SELECT COUNT(*) as count FROM subalmacenes').get();
    
    if (countSubalmacenes.count === 0) {
      // Agregar subalmacenes por defecto
      const insertSubalmacen = db.prepare(
        'INSERT INTO subalmacenes (nombre, direccion, descripcion) VALUES (?, ?, ?)'
      );
      
      const almacenPrincipalId = insertSubalmacen.run('Almacén Principal', 'Dirección Principal', 'Almacén principal y centro de distribución').lastInsertRowid;
      insertSubalmacen.run('Punto de Venta 1', 'Dirección PDV 1', 'Punto de venta minorista');
    }
    
    // Verificar si ya existen usuarios
    const countUsuarios = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
    
    if (countUsuarios.count === 0) {
      // Agregar usuarios por defecto
      const insertUsuario = db.prepare(
        'INSERT INTO usuarios (usuario, password, rol, nombre, subalmacenId) VALUES (?, ?, ?, ?, ?)'
      );
      
      insertUsuario.run('admin', 'admin123', 'admin', 'Administrador', 1); // Admin asignado al almacén principal
      insertUsuario.run('vendedor', 'vendedor123', 'trabajador', 'Vendedor', 2); // Vendedor asignado al PDV 1
    }
    
    // Verificar si ya existen productos
    const countProductos = db.prepare('SELECT COUNT(*) as count FROM productos').get();
    
    if (countProductos.count === 0) {
      // Agregar productos de ejemplo
      const insertProducto = db.prepare(
        'INSERT INTO productos (codigo, nombre, descripcion, categoria, precio, costo, stock, stockMinimo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      
      // Insertar productos de ejemplo
      const productos = [
        ['P001', 'Arroz Integral 1kg', 'Arroz integral de alta calidad', 'Abarrotes', 28.50, 22.00, 50, 10],
        ['P002', 'Frijol Negro 1kg', 'Frijol negro seleccionado', 'Abarrotes', 32.00, 25.00, 40, 8],
        ['P003', 'Aceite de Oliva 500ml', 'Aceite de oliva extra virgen', 'Aceites', 85.00, 65.00, 25, 5],
        ['P004', 'Azúcar Refinada 1kg', 'Azúcar blanca refinada', 'Abarrotes', 25.00, 20.00, 60, 15],
        ['P005', 'Sal de Mesa 1kg', 'Sal refinada', 'Abarrotes', 15.00, 10.00, 70, 20]
      ];
      
      // Insertar cada producto
      productos.forEach(producto => {
        const productoId = insertProducto.run(...producto).lastInsertRowid;
        
        // Agregar inventario al almacén principal (ID 1)
        db.prepare(
          'INSERT INTO inventario_subalmacen (productoId, subalmacenId, stock) VALUES (?, ?, ?)'
        ).run(productoId, 1, producto[6]); // El stock está en la posición 6
      });
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
      
      // Actualizar o crear inventario en almacén principal
      const inventarioExistente = db.prepare(
        'SELECT id FROM inventario_subalmacen WHERE productoId = ? AND subalmacenId = 1'
      ).get(producto.id);
      
      if (inventarioExistente) {
        db.prepare(
          'UPDATE inventario_subalmacen SET stock = ? WHERE id = ?'
        ).run(producto.stock, inventarioExistente.id);
      } else {
        db.prepare(
          'INSERT INTO inventario_subalmacen (productoId, subalmacenId, stock) VALUES (?, ?, ?)'
        ).run(producto.id, 1, producto.stock);
      }
      
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
      
      const productoId = info.lastInsertRowid;
      
      // Agregar inventario al almacén principal
      db.prepare(
        'INSERT INTO inventario_subalmacen (productoId, subalmacenId, stock) VALUES (?, ?, ?)'
      ).run(productoId, 1, producto.stock);
      
      return { ...producto, id: productoId };
    }
  });
  
  // Eliminar un producto
  ipcMain.handle('delete-producto', async (_, id) => {
    // Primero eliminar inventario relacionado
    db.prepare('DELETE FROM inventario_subalmacen WHERE productoId = ?').run(id);
    
    // Luego eliminar el producto
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
      cambio: venta.cambio || null,
      subalmacenId: venta.subalmacenId || null,
      vendedorId: venta.vendedorId || null
    };
    
    const stmt = db.prepare(`
      INSERT INTO ventas (fecha, productos, total, pagoCon, cambio, subalmacenId, vendedorId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      ventaData.fecha,
      ventaData.productos,
      ventaData.total,
      ventaData.pagoCon,
      ventaData.cambio,
      ventaData.subalmacenId,
      ventaData.vendedorId
    );
    
    if (venta.subalmacenId) {
      // Actualizar stock de productos en el subalmacén correspondiente
      const updateStock = db.prepare('UPDATE inventario_subalmacen SET stock = stock - ? WHERE productoId = ? AND subalmacenId = ?');
      for (const item of venta.productos) {
        updateStock.run(item.cantidad, item.id, venta.subalmacenId);
      }
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
  
  // Obtener todos los subalmacenes
  ipcMain.handle('get-subalmacenes', async () => {
    const subalmacenes = db.prepare('SELECT * FROM subalmacenes').all();
    return subalmacenes;
  });
  
  // Crear o actualizar un subalmacén
  ipcMain.handle('save-subalmacen', async (_, subalmacen) => {
    if (subalmacen.id) {
      // Actualizar
      const stmt = db.prepare(`
        UPDATE subalmacenes 
        SET nombre = ?, direccion = ?, descripcion = ?
        WHERE id = ?
      `);
      
      stmt.run(
        subalmacen.nombre, 
        subalmacen.direccion || null, 
        subalmacen.descripcion || null, 
        subalmacen.id
      );
      
      return { ...subalmacen };
    } else {
      // Crear nuevo
      const stmt = db.prepare(`
        INSERT INTO subalmacenes 
        (nombre, direccion, descripcion)
        VALUES (?, ?, ?)
      `);
      
      const info = stmt.run(
        subalmacen.nombre, 
        subalmacen.direccion || null, 
        subalmacen.descripcion || null
      );
      
      return { ...subalmacen, id: info.lastInsertRowid };
    }
  });
  
  // Eliminar un subalmacén
  ipcMain.handle('delete-subalmacen', async (_, id) => {
    // No permitir eliminar el almacén principal (ID 1)
    if (id === 1) {
      return false;
    }
    
    try {
      // Comenzar transacción
      db.prepare('BEGIN TRANSACTION').run();
      
      // Actualizar usuarios que utilizan este subalmacén
      db.prepare(`
        UPDATE usuarios
        SET subalmacenId = NULL
        WHERE subalmacenId = ?
      `).run(id);
      
      // Eliminar inventario de este subalmacén
      db.prepare(`
        DELETE FROM inventario_subalmacen
        WHERE subalmacenId = ?
      `).run(id);
      
      // Eliminar el subalmacén
      db.prepare(`
        DELETE FROM subalmacenes
        WHERE id = ?
      `).run(id);
      
      // Confirmar transacción
      db.prepare('COMMIT').run();
      return true;
    } catch (error) {
      // Revertir cambios en caso de error
      db.prepare('ROLLBACK').run();
      console.error('Error al eliminar subalmacén:', error);
      return false;
    }
  });
  
  // Obtener inventario de un subalmacén
  ipcMain.handle('get-inventario-subalmacen', async (_, subalmacenId) => {
    try {
      // Consulta para obtener productos con su stock en el subalmacén
      const stmt = db.prepare(`
        SELECT p.*, i.stock, p.id as productoId 
        FROM productos p
        INNER JOIN inventario_subalmacen i ON p.id = i.productoId
        WHERE i.subalmacenId = ?
        ORDER BY p.nombre
      `);
      
      const inventario = stmt.all(subalmacenId);
      return inventario;
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      return [];
    }
  });
  
  // Transferir producto entre subalmacenes
  ipcMain.handle('transferir-producto', async (_, productoId, cantidad, origenId, destinoId) => {
    try {
      // Comenzar transacción
      db.prepare('BEGIN TRANSACTION').run();
      
      // Verificar stock en origen
      const inventarioOrigen = db.prepare(`
        SELECT id, stock FROM inventario_subalmacen
        WHERE productoId = ? AND subalmacenId = ?
      `).get(productoId, origenId);
      
      if (!inventarioOrigen || inventarioOrigen.stock < cantidad) {
        db.prepare('ROLLBACK').run();
        return false;
      }
      
      // Restar stock en origen
      db.prepare(`
        UPDATE inventario_subalmacen
        SET stock = stock - ?
        WHERE id = ?
      `).run(cantidad, inventarioOrigen.id);
      
      // Si destino es 0, es una venta, no necesitamos transferir
      if (destinoId > 0) {
        // Verificar si ya existe el producto en el destino
        const inventarioDestino = db.prepare(`
          SELECT id FROM inventario_subalmacen
          WHERE productoId = ? AND subalmacenId = ?
        `).get(productoId, destinoId);
        
        if (inventarioDestino) {
          // Incrementar stock en destino
          db.prepare(`
            UPDATE inventario_subalmacen
            SET stock = stock + ?
            WHERE id = ?
          `).run(cantidad, inventarioDestino.id);
        } else {
          // Crear registro en el destino
          db.prepare(`
            INSERT INTO inventario_subalmacen (productoId, subalmacenId, stock)
            VALUES (?, ?, ?)
          `).run(productoId, destinoId, cantidad);
        }
      }
      
      // Confirmar transacción
      db.prepare('COMMIT').run();
      return true;
    } catch (error) {
      // Revertir cambios en caso de error
      db.prepare('ROLLBACK').run();
      console.error('Error en transferencia:', error);
      return false;
    }
  });
  
  // Obtener usuarios
  ipcMain.handle('get-usuarios', async () => {
    try {
      const usuarios = db.prepare(`
        SELECT u.*, s.nombre as subalmacenNombre
        FROM usuarios u
        LEFT JOIN subalmacenes s ON u.subalmacenId = s.id
      `).all();
      return usuarios;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  });
  
  // Guardar usuario
  ipcMain.handle('save-usuario', async (_, usuario) => {
    try {
      if (usuario.id) {
        // Actualizar
        const stmt = db.prepare(`
          UPDATE usuarios
          SET usuario = ?, password = ?, rol = ?, nombre = ?, subalmacenId = ?
          WHERE id = ?
        `);
        
        stmt.run(
          usuario.usuario,
          usuario.password,
          usuario.rol,
          usuario.nombre || null,
          usuario.subalmacenId || null,
          usuario.id
        );
      } else {
        // Crear nuevo
        const stmt = db.prepare(`
          INSERT INTO usuarios (usuario, password, rol, nombre, subalmacenId)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(
          usuario.usuario,
          usuario.password,
          usuario.rol,
          usuario.nombre || null,
          usuario.subalmacenId || null
        );
        
        usuario.id = info.lastInsertRowid;
      }
      
      return usuario;
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      throw error;
    }
  });
  
  // Eliminar usuario
  ipcMain.handle('delete-usuario', async (_, id) => {
    try {
      db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
      return true;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return false;
    }
  });
  
  // Cambiar contraseña
  ipcMain.handle('change-password', async (_, userId, oldPassword, newPassword) => {
    try {
      // Verificar contraseña actual
      const usuario = db.prepare('SELECT password FROM usuarios WHERE id = ?').get(userId);
      
      if (!usuario || usuario.password !== oldPassword) {
        return false;
      }
      
      // Actualizar contraseña
      db.prepare('UPDATE usuarios SET password = ? WHERE id = ?').run(newPassword, userId);
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return false;
    }
  });
  
  // Guardar tema
  ipcMain.handle('save-theme', async (_, theme) => {
    try {
      const configPath = path.join(userDataPath, 'config.json');
      const config = fs.existsSync(configPath) 
        ? JSON.parse(fs.readFileSync(configPath, 'utf8')) 
        : {};
      
      config.theme = theme;
      fs.writeFileSync(configPath, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Error al guardar tema:', error);
      return false;
    }
  });
  
  // Obtener tema
  ipcMain.handle('get-theme', async () => {
    try {
      const configPath = path.join(userDataPath, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.theme || 'light';
      }
      return 'light';
    } catch (error) {
      console.error('Error al obtener tema:', error);
      return 'light';
    }
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
