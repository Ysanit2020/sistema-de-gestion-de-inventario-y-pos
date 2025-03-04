
import Dexie from 'dexie';

// Definir la base de datos
class InventarioDB extends Dexie {
  productos: Dexie.Table<ProductoType, number>;
  ventas: Dexie.Table<VentaType, number>;
  
  constructor() {
    super('inventarioDB');
    this.version(1).stores({
      productos: '++id, codigo, nombre, categoria, stock',
      ventas: '++id, fecha'
    });
    
    this.productos = this.table('productos');
    this.ventas = this.table('ventas');
  }
}

// Tipos
export interface ProductoType {
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

export interface ItemVentaType extends ProductoType {
  cantidad: number;
}

export interface VentaType {
  id?: number;
  fecha: Date;
  productos: ItemVentaType[];
  total: number;
  cliente?: string;
  metodoPago?: string;
}

// Crear y exportar la instancia de la base de datos
export const db = new InventarioDB();

// Inicializar datos de ejemplo si la base de datos está vacía
export const inicializarDatos = async () => {
  const count = await db.productos.count();
  
  if (count === 0) {
    // Insertar productos de ejemplo
    const productosEjemplo = [
      {
        codigo: "A001",
        nombre: "Arroz",
        descripcion: "Arroz blanco de grano largo",
        categoria: "Granos",
        precio: 2.50,
        costo: 1.80,
        stock: 50,
        stockMinimo: 10
      },
      {
        codigo: "A002",
        nombre: "Frijoles",
        descripcion: "Frijoles negros",
        categoria: "Granos",
        precio: 1.75,
        costo: 1.20,
        stock: 40,
        stockMinimo: 8
      },
      {
        codigo: "B001",
        nombre: "Azúcar",
        descripcion: "Azúcar refinada",
        categoria: "Básicos",
        precio: 2.25,
        costo: 1.70,
        stock: 30,
        stockMinimo: 15
      },
      {
        codigo: "B002",
        nombre: "Aceite",
        descripcion: "Aceite vegetal",
        categoria: "Básicos",
        precio: 4.50,
        costo: 3.20,
        stock: 25,
        stockMinimo: 10
      },
      {
        codigo: "C001",
        nombre: "Leche",
        descripcion: "Leche entera",
        categoria: "Lácteos",
        precio: 3.25,
        costo: 2.50,
        stock: 20,
        stockMinimo: 8
      },
      {
        codigo: "C002",
        nombre: "Queso",
        descripcion: "Queso fresco",
        categoria: "Lácteos",
        precio: 5.75,
        costo: 4.50,
        stock: 15,
        stockMinimo: 5
      },
      {
        codigo: "D001",
        nombre: "Jabón",
        descripcion: "Jabón de baño",
        categoria: "Limpieza",
        precio: 1.50,
        costo: 0.90,
        stock: 35,
        stockMinimo: 10
      },
      {
        codigo: "D002",
        nombre: "Detergente",
        descripcion: "Detergente en polvo",
        categoria: "Limpieza",
        precio: 6.25,
        costo: 4.80,
        stock: 20,
        stockMinimo: 7
      }
    ];
    
    await db.productos.bulkAdd(productosEjemplo);
    console.log("Datos de ejemplo añadidos a la base de datos");
  }
};

// Función para obtener estadísticas rápidas
export const obtenerEstadisticas = async () => {
  const totalProductos = await db.productos.count();
  const valorInventario = await db.productos
    .toArray()
    .then(productos => 
      productos.reduce((total, producto) => 
        total + (producto.precio * producto.stock), 0)
    );
  
  const productosPocoStock = await db.productos
    .where('stock')
    .below(10)
    .count();
  
  return {
    totalProductos,
    valorInventario,
    productosPocoStock
  };
};
