// Interfaces
import { db } from "./database";

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
      try {
        return await db.productos.toArray();
      } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
      }
    }
  },
  
  getProducto: async (id: number): Promise<ProductoInterface | undefined> => {
    if (isElectron()) {
      return window.electronAPI.getProducto(id);
    } else {
      console.warn("Electron no disponible");
      try {
        return await db.productos.get(id);
      } catch (error) {
        console.error("Error al obtener producto:", error);
        return undefined;
      }
    }
  },
  
  saveProducto: async (producto: ProductoInterface): Promise<ProductoInterface> => {
    if (isElectron()) {
      return window.electronAPI.saveProducto(producto);
    } else {
      console.warn("Electron no disponible");
      try {
        if (producto.id) {
          // Actualizar producto existente
          await db.productos.update(producto.id, producto);
          return producto;
        } else {
          // Nuevo producto
          const id = await db.productos.add({
            ...producto,
            id: undefined // Asegurarse de que no enviamos un ID para que Dexie lo genere
          });
          
          // Agregar el stock inicial al almacén principal (primer subalmacén)
          const subalmacenes = await db.subalmacenes.toArray();
          if (subalmacenes.length > 0) {
            const almacenPrincipal = subalmacenes[0];
            console.log("Agregando stock inicial al almacén principal:", {
              productoId: id,
              subalmacenId: almacenPrincipal.id,
              stock: producto.stock
            });
            
            await db.inventarioSubalmacen.add({
              productoId: id,
              subalmacenId: almacenPrincipal.id!,
              stock: producto.stock
            });
          }
          
          return { ...producto, id };
        }
      } catch (error) {
        console.error("Error al guardar producto:", error);
        return producto;
      }
    }
  },
  
  deleteProducto: async (id: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.deleteProducto(id);
    } else {
      console.warn("Electron no disponible");
      try {
        // Eliminar el producto
        await db.productos.delete(id);
        
        // Eliminar registros de inventario relacionados
        await db.inventarioSubalmacen
          .where('productoId')
          .equals(id)
          .delete();
          
        return true;
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        return false;
      }
    }
  },
  
  // Autenticación
  login: async (username: string, password: string): Promise<UsuarioInterface | null> => {
    if (isElectron()) {
      return window.electronAPI.login(username, password);
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      
      // Primero, intentamos obtener el usuario de la base de datos local
      try {
        const usuarios = await db.usuarios.toArray();
        const usuario = usuarios.find(u => 
          u.usuario === username && u.password === password);
          
        if (usuario) {
          console.log("Usuario encontrado en DB:", usuario);
          return usuario;
        }
      } catch (error) {
        console.error("Error al buscar usuario en DB:", error);
      }
      
      // Si no encontramos el usuario en la DB, usamos los datos de ejemplo
      if (username === "admin" && password === "admin123") {
        return {
          id: 1,
          usuario: "admin",
          password: "admin123",
          rol: "admin",
          nombre: "Administrador",
          subalmacenId: 1 // Asignamos el almacén principal al admin
        };
      } else if (username === "vendedor" && password === "vendedor123") {
        return {
          id: 2,
          usuario: "vendedor",
          password: "vendedor123",
          rol: "trabajador",
          nombre: "Vendedor",
          subalmacenId: 2 // Asignamos un punto de venta al vendedor
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
      try {
        const id = await db.ventas.add(venta);
        return { ...venta, id };
      } catch (error) {
        console.error("Error al guardar venta:", error);
        return venta;
      }
    }
  },
  
  getVentas: async (): Promise<VentaInterface[]> => {
    if (isElectron()) {
      return window.electronAPI.getVentas();
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      try {
        return await db.ventas.toArray();
      } catch (error) {
        console.error("Error al obtener ventas:", error);
        return [];
      }
    }
  },
  
  // Subalmacenes
  getSubalmacenes: async (): Promise<SubalmacenInterface[]> => {
    if (isElectron()) {
      return window.electronAPI.getSubalmacenes();
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      try {
        return await db.subalmacenes.toArray();
      } catch (error) {
        console.error("Error al obtener subalmacenes:", error);
        return [];
      }
    }
  },
  
  saveSubalmacen: async (subalmacen: SubalmacenInterface): Promise<SubalmacenInterface> => {
    if (isElectron()) {
      return window.electronAPI.saveSubalmacen(subalmacen);
    } else {
      console.warn("Electron no disponible");
      try {
        if (subalmacen.id) {
          await db.subalmacenes.update(subalmacen.id, subalmacen);
          return subalmacen;
        } else {
          const id = await db.subalmacenes.add(subalmacen);
          return { ...subalmacen, id };
        }
      } catch (error) {
        console.error("Error al guardar subalmacen:", error);
        return subalmacen;
      }
    }
  },
  
  deleteSubalmacen: async (id: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.deleteSubalmacen(id);
    } else {
      console.warn("Electron no disponible");
      try {
        // Eliminar el subalmacén
        await db.subalmacenes.delete(id);
        
        // Eliminar todos los registros de inventario asociados
        await db.inventarioSubalmacen
          .where('subalmacenId')
          .equals(id)
          .delete();
          
        // Actualizar usuarios que tenían asignado este subalmacén
        const usuarios = await db.usuarios
          .where('subalmacenId')
          .equals(id)
          .toArray();
        
        for (const usuario of usuarios) {
          await db.usuarios.update(usuario.id!, {
            ...usuario,
            subalmacenId: undefined
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error al eliminar subalmacen:", error);
        return false;
      }
    }
  },
  
  // Inventario de subalmacenes
  getInventarioSubalmacen: async (subalmacenId: number): Promise<any[]> => {
    if (isElectron()) {
      return window.electronAPI.getInventarioSubalmacen(subalmacenId);
    } else {
      console.warn("Electron no disponible, usando datos de ejemplo");
      
      // Para desarrollo sin Electron, simular inventario de subalmacén
      try {
        console.log("Buscando inventario para subalmacén ID:", subalmacenId);
        // Obtener lista de productos
        const productos = await db.productos.toArray();
        
        // Obtener inventario de este subalmacén
        const inventario = await db.inventarioSubalmacen
          .where('subalmacenId')
          .equals(subalmacenId)
          .toArray();
        
        console.log("Inventario raw encontrado:", inventario);
        
        // Combinar datos para devolver productos completos con su stock
        const resultado = inventario.map(item => {
          const producto = productos.find(p => p.id === item.productoId);
          if (producto) {
            return {
              ...producto,
              stock: item.stock,
              productoId: producto.id
            };
          }
          return null;
        }).filter(Boolean);
        
        console.log("Inventario procesado:", resultado);
        return resultado;
      } catch (error) {
        console.error("Error al obtener inventario:", error);
        return [];
      }
    }
  },
  
  transferirProducto: async (productoId: number, cantidad: number, origenId: number, destinoId: number): Promise<boolean> => {
    if (isElectron()) {
      return window.electronAPI.transferirProducto(productoId, cantidad, origenId, destinoId);
    } else {
      console.warn("Electron no disponible, simulando transferencia");
      
      try {
        console.log("Transferir:", { productoId, cantidad, origenId, destinoId });
        
        // Verificar stock en el origen
        const inventarioOrigenArray = await db.inventarioSubalmacen
          .where('[productoId+subalmacenId]')
          .equals([productoId, origenId])
          .toArray();
        
        if (!inventarioOrigenArray.length) {
          console.error("No se encontró el producto en el subalmacén de origen");
          return false;
        }
        
        const inventarioOrigen = inventarioOrigenArray[0];
        console.log("Inventario origen:", inventarioOrigen);
        
        if (!inventarioOrigen || inventarioOrigen.stock < cantidad) {
          console.error("Stock insuficiente para transferir");
          return false;
        }
        
        // Actualizar stock en origen (siempre necesario)
        await db.inventarioSubalmacen.update(inventarioOrigen.id!, {
          stock: inventarioOrigen.stock - cantidad
        });
        
        // Si destinoId es 0, esto significa una venta y no necesitamos transferir
        if (destinoId > 0) {
          // Buscar si ya existe el producto en el destino
          const inventarioDestinoArray = await db.inventarioSubalmacen
            .where('[productoId+subalmacenId]')
            .equals([productoId, destinoId])
            .toArray();
          
          console.log("Búsqueda de inventario destino:", {productoId, subalmacenId: destinoId});
          console.log("Inventario destino array:", inventarioDestinoArray);
          
          if (inventarioDestinoArray.length > 0) {
            const inventarioDestino = inventarioDestinoArray[0];
            // Actualizar stock existente
            console.log("Actualizando stock en destino:", {
              id: inventarioDestino.id,
              stockActual: inventarioDestino.stock,
              nuevoStock: inventarioDestino.stock + cantidad
            });
            
            await db.inventarioSubalmacen.update(inventarioDestino.id!, {
              stock: inventarioDestino.stock + cantidad
            });
          } else {
            // Crear nuevo registro de inventario
            console.log("Creando nuevo registro en destino:", {
              productoId,
              subalmacenId: destinoId,
              stock: cantidad
            });
            
            await db.inventarioSubalmacen.add({
              productoId,
              subalmacenId: destinoId,
              stock: cantidad
            });
          }
        }
        
        return true;
      } catch (error) {
        console.error("Error en transferencia:", error);
        return false;
      }
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
