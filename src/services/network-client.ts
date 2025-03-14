
/**
 * Network client for accessing the app from other devices
 * This module detects if it's running in a browser 
 * and if so, makes API calls to the server instead of using Electron IPC
 */

const isElectron = window.electronAPI !== undefined;
const baseUrl = isElectron ? '' : `http://${window.location.hostname}:3000/api`;

// Helper function to make API requests to the server
const apiRequest = async (endpoint: string, method: string = 'GET', data: any = null) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};

// Define the network client with the same interface as electronAPI
export const networkClient = {
  getProductos: async () => {
    if (isElectron) {
      return await window.electronAPI!.getProductos();
    } else {
      return await apiRequest('/productos');
    }
  },
  
  getProducto: async (id: number) => {
    if (isElectron) {
      return await window.electronAPI!.getProducto(id);
    } else {
      return await apiRequest(`/productos/${id}`);
    }
  },
  
  saveProducto: async (producto: any) => {
    if (isElectron) {
      return await window.electronAPI!.saveProducto(producto);
    } else {
      return await apiRequest('/productos', producto.id ? 'PUT' : 'POST', producto);
    }
  },
  
  // Implement other methods following the same pattern
  deleteProducto: async (id: number) => {
    if (isElectron) {
      return await window.electronAPI!.deleteProducto(id);
    } else {
      return await apiRequest(`/productos/${id}`, 'DELETE');
    }
  },
  
  login: async (username: string, password: string) => {
    if (isElectron) {
      return await window.electronAPI!.login(username, password);
    } else {
      return await apiRequest('/login', 'POST', { username, password });
    }
  },
  
  saveVenta: async (venta: any) => {
    if (isElectron) {
      return await window.electronAPI!.saveVenta(venta);
    } else {
      return await apiRequest('/ventas', 'POST', venta);
    }
  },
  
  getVentas: async () => {
    if (isElectron) {
      return await window.electronAPI!.getVentas();
    } else {
      return await apiRequest('/ventas');
    }
  },
  
  getInventarioSubalmacen: async (subalmacenId: number) => {
    if (isElectron) {
      return await window.electronAPI!.getInventarioSubalmacen(subalmacenId);
    } else {
      return await apiRequest(`/inventario/subalmacen/${subalmacenId}`);
    }
  },
  
  transferirProducto: async (productoId: number, cantidad: number, origenId: number, destinoId: number) => {
    if (isElectron) {
      return await window.electronAPI!.transferirProducto(productoId, cantidad, origenId, destinoId);
    } else {
      return await apiRequest('/inventario/transferir', 'POST', { productoId, cantidad, origenId, destinoId });
    }
  },
  
  getSubalmacenes: async () => {
    if (isElectron) {
      return await window.electronAPI!.getSubalmacenes();
    } else {
      return await apiRequest('/subalmacenes');
    }
  },
  
  saveSubalmacen: async (subalmacen: any) => {
    if (isElectron) {
      return await window.electronAPI!.saveSubalmacen(subalmacen);
    } else {
      return await apiRequest('/subalmacenes', subalmacen.id ? 'PUT' : 'POST', subalmacen);
    }
  },
  
  deleteSubalmacen: async (id: number) => {
    if (isElectron) {
      return await window.electronAPI!.deleteSubalmacen(id);
    } else {
      return await apiRequest(`/subalmacenes/${id}`, 'DELETE');
    }
  },
  
  saveUsuario: async (usuario: any) => {
    if (isElectron) {
      return await window.electronAPI!.saveUsuario(usuario);
    } else {
      return await apiRequest('/usuarios', usuario.id ? 'PUT' : 'POST', usuario);
    }
  },
  
  getUsuarios: async () => {
    if (isElectron) {
      return await window.electronAPI!.getUsuarios();
    } else {
      return await apiRequest('/usuarios');
    }
  },
  
  deleteUsuario: async (id: number) => {
    if (isElectron) {
      return await window.electronAPI!.deleteUsuario(id);
    } else {
      return await apiRequest(`/usuarios/${id}`, 'DELETE');
    }
  },
  
  changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
    if (isElectron) {
      return await window.electronAPI!.changePassword(userId, oldPassword, newPassword);
    } else {
      return await apiRequest('/usuarios/cambiar-password', 'POST', { userId, oldPassword, newPassword });
    }
  },
  
  saveTheme: async (theme: string) => {
    if (isElectron) {
      return await window.electronAPI!.saveTheme(theme);
    } else {
      return await apiRequest('/theme', 'POST', { theme });
    }
  },
  
  getTheme: async () => {
    if (isElectron) {
      return await window.electronAPI!.getTheme();
    } else {
      return await apiRequest('/theme');
    }
  },
  
  getMovimientosInventario: async () => {
    if (isElectron) {
      return await window.electronAPI!.getMovimientosInventario();
    } else {
      return await apiRequest('/movimientos-inventario');
    }
  },
  
  saveMovimientoInventario: async (movimiento: any) => {
    if (isElectron) {
      return await window.electronAPI!.saveMovimientoInventario(movimiento);
    } else {
      return await apiRequest('/movimientos-inventario', 'POST', movimiento);
    }
  }
};
