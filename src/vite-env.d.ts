
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
  };
}
