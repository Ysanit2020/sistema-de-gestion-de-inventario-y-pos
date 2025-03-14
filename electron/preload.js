
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProductos: () => ipcRenderer.invoke('getProductos'),
  getProducto: (id) => ipcRenderer.invoke('getProducto', id),
  saveProducto: (producto) => ipcRenderer.invoke('saveProducto', producto),
  deleteProducto: (id) => ipcRenderer.invoke('deleteProducto', id),
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  saveVenta: (venta) => ipcRenderer.invoke('saveVenta', venta),
  getVentas: () => ipcRenderer.invoke('getVentas'),
  getInventarioSubalmacen: (subalmacenId) => ipcRenderer.invoke('getInventarioSubalmacen', subalmacenId),
  transferirProducto: (productoId, cantidad, origenId, destinoId) => 
    ipcRenderer.invoke('transferirProducto', productoId, cantidad, origenId, destinoId),
  getSubalmacenes: () => ipcRenderer.invoke('getSubalmacenes'),
  saveSubalmacen: (subalmacen) => ipcRenderer.invoke('saveSubalmacen', subalmacen),
  deleteSubalmacen: (id) => ipcRenderer.invoke('deleteSubalmacen', id),
  saveUsuario: (usuario) => ipcRenderer.invoke('saveUsuario', usuario),
  getUsuarios: () => ipcRenderer.invoke('getUsuarios'),
  deleteUsuario: (id) => ipcRenderer.invoke('deleteUsuario', id),
  changePassword: (userId, oldPassword, newPassword) => 
    ipcRenderer.invoke('changePassword', userId, oldPassword, newPassword),
  saveTheme: (theme) => ipcRenderer.invoke('saveTheme', theme),
  getTheme: () => ipcRenderer.invoke('getTheme'),
  getMovimientosInventario: () => ipcRenderer.invoke('getMovimientosInventario'),
  saveMovimientoInventario: (movimiento) => ipcRenderer.invoke('saveMovimientoInventario', movimiento),
});
