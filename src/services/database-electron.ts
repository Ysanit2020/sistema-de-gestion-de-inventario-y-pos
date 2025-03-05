
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
  subalmacenId?: number;
}

export interface VentaInterface {
  id?: number;
  fecha: Date;
  productos: ItemVentaInterface[];
  total: number;
  pagoCon?: number;
  cambio?: number;
  subalmacenId?: number;
  vendedorId?: number;
}

export interface UsuarioInterface {
  id?: number;
  usuario: string;
  password: string;
  rol: "admin" | "trabajador";
  nombre?: string;
  subalmacenId?: number;
}

export interface SubalmacenInterface {
  id?: number;
  nombre: string;
  direccion?: string;
  descripcion?: string;
}

export interface InventarioSubalmacenInterface {
  id?: number;
  productoId: number;
  subalmacenId: number;
  stock: number;
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
          nombre: "Vendedor",
          subalmacenId: 2
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
  },
  
  // Subalmacenes
  getSubalmacenes: async (): Promise<SubalmacenInterface[]> => {
    if (isElectron()) {
      return window.electronAPI.getSubalmacenes();
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      return [
        { id: 1, nombre: "Almacén Principal" },
        { id: 2, nombre: "Punto de Venta" }
      ];
    }
  },
  
  saveSubalmacen: async (subalmacen: SubalmacenInterface): Promise<SubalmacenInterface> => {
    if (isElectron()) {
      return window.electronAPI.saveSubalmacen(subalmacen);
    } else {
      console.warn("Electron no disponible");
      return subalmacen;
    }
  },
  
  deleteSubalmacen: async (id: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.deleteSubalmacen(id);
    } else {
      console.warn("Electron no disponible");
      return true;
    }
  },
  
  // Inventario de subalmacenes
  getInventarioSubalmacen: async (subalmacenId: number): Promise<any[]> => {
    if (isElectron()) {
      return window.electronAPI.getInventarioSubalmacen(subalmacenId);
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      return [];
    }
  },
  
  transferirProducto: async (productoId: number, cantidad: number, origenId: number, destinoId: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.transferirProducto(productoId, cantidad, origenId, destinoId);
    } else {
      console.warn("Electron no disponible");
      return true;
    }
  },
  
  // Gestión de usuarios
  getUsuarios: async (): Promise<UsuarioInterface[]> => {
    if (isElectron()) {
      return window.electronAPI.getUsuarios();
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      return [
        { id: 1, usuario: "admin", password: "admin123", rol: "admin", nombre: "Administrador" },
        { id: 2, usuario: "vendedor", password: "vendedor123", rol: "trabajador", nombre: "Vendedor", subalmacenId: 2 }
      ];
    }
  },
  
  saveUsuario: async (usuario: UsuarioInterface): Promise<UsuarioInterface> => {
    if (isElectron()) {
      return window.electronAPI.saveUsuario(usuario);
    } else {
      console.warn("Electron no disponible");
      return usuario;
    }
  },
  
  deleteUsuario: async (id: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.deleteUsuario(id);
    } else {
      console.warn("Electron no disponible");
      return true;
    }
  },
  
  changePassword: async (userId: number, oldPassword: string, newPassword: string): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.changePassword(userId, oldPassword, newPassword);
    } else {
      console.warn("Electron no disponible");
      return true;
    }
  },
  
  // Configuración
  saveTheme: async (theme: string): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.saveTheme(theme);
    } else {
      console.warn("Electron no disponible");
      localStorage.setItem("theme", theme);
      return true;
    }
  },
  
  getTheme: async (): Promise<string> => {
    if (isElectron()) {
      return window.electronAPI.getTheme();
    } else {
      console.warn("Electron no disponible");
      return localStorage.getItem("theme") || "light";
    }
  }
};
