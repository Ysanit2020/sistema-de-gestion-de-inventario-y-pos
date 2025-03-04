
// Interfaces
export interface ProductoInterface {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  precio: number;
  costo?: number;
  stock: number;
  stockMinimo?: number;
}

export interface ItemVentaInterface {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
}

export interface VentaInterface {
  id?: number;
  fecha: Date;
  productos: ItemVentaInterface[];
  total: number;
  pagoCon?: number;
  cambio?: number;
}

export interface UsuarioInterface {
  id?: number;
  usuario: string;
  password: string;
  rol: "admin" | "trabajador";
  nombre?: string;
}

// Verificar si estamos en entorno Electron
export const isElectron = () => {
  return window.electronAPI !== undefined;
};

// API para acceder a la base de datos
export const dbAPI = {
  // Productos
  getProductos: async (): Promise<ProductoInterface[]> => {
    if (isElectron()) {
      return window.electronAPI.getProductos();
    } else {
      // Fallback para desarrollo sin Electron
      console.warn("Electron no disponible, usando datos de ejemplo");
      return [];
    }
  },
  
  getProducto: async (id: number): Promise<ProductoInterface | undefined> => {
    if (isElectron()) {
      return window.electronAPI.getProducto(id);
    } else {
      console.warn("Electron no disponible");
      return undefined;
    }
  },
  
  saveProducto: async (producto: ProductoInterface): Promise<ProductoInterface> => {
    if (isElectron()) {
      return window.electronAPI.saveProducto(producto);
    } else {
      console.warn("Electron no disponible");
      return producto;
    }
  },
  
  deleteProducto: async (id: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.deleteProducto(id);
    } else {
      console.warn("Electron no disponible");
      return true;
    }
  },
  
  // Autenticación
  login: async (username: string, password: string): Promise<UsuarioInterface | null> => {
    if (isElectron()) {
      return window.electronAPI.login(username, password);
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      if (username === "admin" && password === "admin123") {
        return {
          id: 1,
          usuario: "admin",
          password: "admin123",
          rol: "admin",
          nombre: "Administrador"
        };
      } else if (username === "vendedor" && password === "vendedor123") {
        return {
          id: 2,
          usuario: "vendedor",
          password: "vendedor123",
          rol: "trabajador",
          nombre: "Vendedor"
        };
      }
      return null;
    }
  },
  
  // Ventas
  saveVenta: async (venta: VentaInterface): Promise<VentaInterface> => {
    if (isElectron()) {
      return window.electronAPI.saveVenta(venta);
    } else {
      console.warn("Electron no disponible");
      return venta;
    }
  },
  
  getVentas: async (): Promise<VentaInterface[]> => {
    if (isElectron()) {
      return window.electronAPI.getVentas();
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      return [];
    }
  }
};

