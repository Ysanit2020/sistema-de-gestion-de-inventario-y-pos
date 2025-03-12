
/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getProductos: () => Promise<any[]>;
    getProducto: (id: number) => Promise<any>;
    saveProducto: (producto: any) => Promise<any>;
    deleteProducto: (id: number) => Promise<boolean>;
    login: (username: string, password: string) => Promise<any>;
    saveVenta: (venta: any) => Promise<any>;
    getVentas: () => Promise<any[]>;
    getInventarioSubalmacen: (subalmacenId: number) => Promise<any[]>;
    transferirProducto: (productoId: number, cantidad: number, origenId: number, destinoId: number) => Promise<boolean>;
    getSubalmacenes: () => Promise<any[]>;
    saveSubalmacen: (subalmacen: any) => Promise<any>;
    deleteSubalmacen: (id: number) => Promise<boolean>;
    saveUsuario: (usuario: any) => Promise<any>;
    getUsuarios: () => Promise<any[]>;
    deleteUsuario: (id: number) => Promise<boolean>;
    changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<boolean>;
    saveTheme: (theme: string) => Promise<boolean>;
    getTheme: () => Promise<string>;
    getMovimientosInventario: () => Promise<any[]>;
    saveMovimientoInventario: (movimiento: any) => Promise<any>;
  };
}
