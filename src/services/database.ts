
import Dexie from "dexie";

// Definición de la base de datos
export class AppDatabase extends Dexie {
  productos: Dexie.Table<ProductoInterface, number>;
  ventas: Dexie.Table<VentaInterface, number>;
  usuarios: Dexie.Table<UsuarioInterface, number>;
  subalmacenes: Dexie.Table<SubalmacenInterface, number>;
  inventarioSubalmacen: Dexie.Table<InventarioSubalmacenInterface, number>;
  configuracion: Dexie.Table<ConfiguracionInterface, number>;

  constructor() {
    super("gestorDB");
    
    // Definir esquemas de tablas
    this.version(3).stores({
      productos: "++id, codigo, nombre, categoria, precio",
      ventas: "++id, fecha",
      usuarios: "++id, usuario, password, rol, subalmacenId",
      subalmacenes: "++id, nombre",
      inventarioSubalmacen: "++id, productoId, subalmacenId, [productoId+subalmacenId]",
      configuracion: "++id, clave, valor"
    });
    
    // Typed tables
    this.productos = this.table("productos");
    this.ventas = this.table("ventas");
    this.usuarios = this.table("usuarios");
    this.subalmacenes = this.table("subalmacenes");
    this.inventarioSubalmacen = this.table("inventarioSubalmacen");
    this.configuracion = this.table("configuracion");
  }
}

// Interfaces de datos
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

export interface ConfiguracionInterface {
  id?: number;
  clave: string;
  valor: string;
}

// Instancia de la base de datos
export const db = new AppDatabase();

// Función para inicializar datos de ejemplo
export const inicializarDatos = async () => {
  // Verificar si ya existen productos
  const countProductos = await db.productos.count();
  
  if (countProductos === 0) {
    // Agregar productos de ejemplo
    await db.productos.bulkAdd([
      {
        codigo: "P001",
        nombre: "Arroz Integral 1kg",
        descripcion: "Arroz integral de alta calidad",
        categoria: "Abarrotes",
        precio: 28.50,
        costo: 22.00,
        stock: 50,
        stockMinimo: 10
      },
      {
        codigo: "P002",
        nombre: "Frijol Negro 1kg",
        descripcion: "Frijol negro seleccionado",
        categoria: "Abarrotes",
        precio: 32.00,
        costo: 25.00,
        stock: 40,
        stockMinimo: 8
      },
      {
        codigo: "P003",
        nombre: "Aceite de Oliva 500ml",
        descripcion: "Aceite de oliva extra virgen",
        categoria: "Aceites",
        precio: 85.00,
        costo: 65.00,
        stock: 25,
        stockMinimo: 5
      },
      {
        codigo: "P004",
        nombre: "Azúcar Refinada 1kg",
        descripcion: "Azúcar blanca refinada",
        categoria: "Abarrotes",
        precio: 25.00,
        costo: 20.00,
        stock: 60,
        stockMinimo: 15
      },
      {
        codigo: "P005",
        nombre: "Sal de Mesa 1kg",
        descripcion: "Sal refinada",
        categoria: "Abarrotes",
        precio: 15.00,
        costo: 10.00,
        stock: 70,
        stockMinimo: 20
      }
    ]);
  }

  // Verificar si ya existen usuarios
  const countUsuarios = await db.usuarios.count();
  
  if (countUsuarios === 0) {
    // Agregar usuarios por defecto
    await db.usuarios.bulkAdd([
      {
        usuario: "admin",
        password: "admin123", // En una aplicación real deberías usar hash
        rol: "admin",
        nombre: "Administrador",
        subalmacenId: 1
      },
      {
        usuario: "vendedor",
        password: "vendedor123", // En una aplicación real deberías usar hash
        rol: "trabajador",
        nombre: "Vendedor",
        subalmacenId: 2
      }
    ]);
  }
  
  // Verificar si ya existen subalmacenes
  const countSubalmacenes = await db.subalmacenes.count();
  
  if (countSubalmacenes === 0) {
    // Agregar subalmacén principal por defecto
    const idAlmacenPrincipal = await db.subalmacenes.add({
      nombre: "Almacén Principal",
      descripcion: "Almacén central de todos los productos"
    });
    
    // Agregar subalmacén para vendedores por defecto
    const idAlmacenVendedor = await db.subalmacenes.add({
      nombre: "Punto de Venta",
      descripcion: "Productos disponibles para venta directa"
    });
    
    // Si hay productos, inicializar su inventario en el almacén principal
    if (countProductos > 0) {
      const productos = await db.productos.toArray();
      
      for (const producto of productos) {
        await db.inventarioSubalmacen.add({
          productoId: producto.id!,
          subalmacenId: idAlmacenPrincipal,
          stock: producto.stock
        });
        
        // Inicializar con algunos productos en el almacén de venta
        await db.inventarioSubalmacen.add({
          productoId: producto.id!,
          subalmacenId: idAlmacenVendedor,
          stock: Math.floor(producto.stock / 2) // La mitad del stock principal
        });
      }
    }
    
    // Asignar subalmacén al vendedor
    const vendedor = await db.usuarios.where("usuario").equals("vendedor").first();
    if (vendedor) {
      await db.usuarios.update(vendedor.id!, {
        ...vendedor,
        subalmacenId: idAlmacenVendedor
      });
    }
  }
  
  // Verificar configuración
  const themeConfig = await db.configuracion.where("clave").equals("theme").first();
  if (!themeConfig) {
    await db.configuracion.add({
      clave: "theme",
      valor: "light"
    });
  }
};
