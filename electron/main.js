
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { database } = require('../src/services/database');

// Initialize Express server for network access
const server = express();
const PORT = 3000;

// Enable CORS
server.use(cors());

// Serve the static files from the build directory
server.use(express.static(path.join(__dirname, '../dist')));
server.use(express.json());

// API endpoints
server.get('/api/productos', async (req, res) => {
  try {
    const productos = await database.getProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add other API endpoints as needed for all database operations
// Example:
server.post('/api/ventas', async (req, res) => {
  try {
    const result = await database.saveVenta(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Default route to serve the React app
server.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Local network access: http://${getLocalIpAddress()}:${PORT}`);
});

// Get local IP address for network access
function getLocalIpAddress() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // In production, load the built app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // In development, load from the dev server
    mainWindow.loadURL('http://localhost:5173');
  }

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Set up IPC handlers for database operations
ipcMain.handle('getProductos', async () => {
  return await database.getProductos();
});

ipcMain.handle('getProducto', async (_, id) => {
  return await database.getProducto(id);
});

ipcMain.handle('saveProducto', async (_, producto) => {
  return await database.saveProducto(producto);
});

// Add handlers for all other database operations
// Example:
ipcMain.handle('deleteProducto', async (_, id) => {
  return await database.deleteProducto(id);
});

ipcMain.handle('login', async (_, username, password) => {
  return await database.login(username, password);
});

ipcMain.handle('saveVenta', async (_, venta) => {
  return await database.saveVenta(venta);
});

ipcMain.handle('getVentas', async () => {
  return await database.getVentas();
});

ipcMain.handle('getInventarioSubalmacen', async (_, subalmacenId) => {
  return await database.getInventarioSubalmacen(subalmacenId);
});

ipcMain.handle('transferirProducto', async (_, productoId, cantidad, origenId, destinoId) => {
  return await database.transferirProducto(productoId, cantidad, origenId, destinoId);
});

ipcMain.handle('getSubalmacenes', async () => {
  return await database.getSubalmacenes();
});

ipcMain.handle('saveSubalmacen', async (_, subalmacen) => {
  return await database.saveSubalmacen(subalmacen);
});

ipcMain.handle('deleteSubalmacen', async (_, id) => {
  return await database.deleteSubalmacen(id);
});

ipcMain.handle('saveUsuario', async (_, usuario) => {
  return await database.saveUsuario(usuario);
});

ipcMain.handle('getUsuarios', async () => {
  return await database.getUsuarios();
});

ipcMain.handle('deleteUsuario', async (_, id) => {
  return await database.deleteUsuario(id);
});

ipcMain.handle('changePassword', async (_, userId, oldPassword, newPassword) => {
  return await database.changePassword(userId, oldPassword, newPassword);
});

ipcMain.handle('saveTheme', async (_, theme) => {
  return await database.saveTheme(theme);
});

ipcMain.handle('getTheme', async () => {
  return await database.getTheme();
});

ipcMain.handle('getMovimientosInventario', async () => {
  return await database.getMovimientosInventario();
});

ipcMain.handle('saveMovimientoInventario', async (_, movimiento) => {
  return await database.saveMovimientoInventario(movimiento);
});
