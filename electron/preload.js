
const { contextBridge, ipcRenderer } = require('electron');

// Exponer la API protegida a través del puente de contexto
contextBridge.exposeInMainWorld('electronAPI', {
  // Productos
  getProductos: () => ipcRenderer.invoke('get-productos'),
  getProducto: (id) => ipcRenderer.invoke('get-producto', id),
  saveProducto: (producto) => ipcRenderer.invoke('save-producto', producto),
  deleteProducto: (id) => ipcRenderer.invoke('delete-producto', id),
  
  // Autenticación
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  
  // Ventas
  saveVenta: (venta) => ipcRenderer.invoke('save-venta', venta),
  getVentas: () => ipcRenderer.invoke('get-ventas'),
});

