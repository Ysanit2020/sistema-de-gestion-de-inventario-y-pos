
import Dexie from "dexie";

// Definición de la base de datos
export class AppDatabase extends Dexie {
  productos: Dexie.Table<ProductoInterface, number>;
  ventas: Dexie.Table<VentaInterface, number>;
  usuarios: Dexie.Table<UsuarioInterface, number>;

  constructor() {
    super("gestorDB");
    
    // Definir esquemas de tablas
    this.version(1).stores({
      productos: "++id, codigo, nombre, categoria, precio",
      ventas: "++id, fecha",
      usuarios: "++id, usuario, password, rol"
    });
    
    // Typed tables
    this.productos = this.table("productos");
    this.ventas = this.table("ventas");
    this.usuarios = this.table("usuarios");
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
        nombre: "Administrador"
      },
      {
        usuario: "vendedor",
        password: "vendedor123", // En una aplicación real deberías usar hash
        rol: "trabajador",
        nombre: "Vendedor"
      }
    ]);
  }
};
