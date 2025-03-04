
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, FileText, TrendingUp, Package } from "lucide-react";
import { db, ItemVentaInterface } from "@/services/database";

interface ProductoPopular {
  id: number;
  nombre: string;
  cantidad: number;
  total: number;
}

const Reportes = () => {
  const [ventasPorDia, setVentasPorDia] = useState<{fecha: string, total: number}[]>([]);
  const [productosPopulares, setProductosPopulares] = useState<ProductoPopular[]>([]);
  const [inventarioBajo, setInventarioBajo] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [numTransacciones, setNumTransacciones] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar todas las ventas
      const ventas = await db.ventas.toArray();
      setNumTransacciones(ventas.length);
      
      // Calcular total de ventas
      const total = ventas.reduce((sum, venta) => sum + venta.total, 0);
      setTotalVentas(total);
      
      // Agrupar ventas por día
      const ventasAgrupadas = agruparVentasPorDia(ventas);
      setVentasPorDia(ventasAgrupadas);
      
      // Productos populares
      const populares = calcularProductosPopulares(ventas);
      setProductosPopulares(populares);
      
      // Productos con inventario bajo
      const productos = await db.productos.toArray();
      const productosConBajoStock = productos
        .filter(producto => producto.stock < 10)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);
      
      setInventarioBajo(productosConBajoStock);
      
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const agruparVentasPorDia = (ventas) => {
    const ventasPorDia: {[key: string]: number} = {};
    
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha).toLocaleDateString();
      if (!ventasPorDia[fecha]) {
        ventasPorDia[fecha] = 0;
      }
      ventasPorDia[fecha] += venta.total;
    });
    
    return Object.keys(ventasPorDia).map(fecha => ({
      fecha,
      total: ventasPorDia[fecha]
    })).slice(-7); // Últimos 7 días
  };

  const calcularProductosPopulares = (ventas): ProductoPopular[] => {
    const contadorProductos: {[key: number]: ProductoPopular} = {};
    
    ventas.forEach(venta => {
      venta.productos.forEach((producto: ItemVentaInterface) => {
        if (!contadorProductos[producto.id]) {
          contadorProductos[producto.id] = {
            id: producto.id,
            nombre: producto.nombre,
            cantidad: 0,
            total: 0
          };
        }
        contadorProductos[producto.id].cantidad += producto.cantidad;
        contadorProductos[producto.id].total += producto.precio * producto.cantidad;
      });
    });
    
    return Object.values(contadorProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" className="mr-2 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold">Reportes</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">Total de Ventas</p>
              <h2 className="text-2xl font-bold">${totalVentas.toFixed(2)}</h2>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">Transacciones</p>
              <h2 className="text-2xl font-bold">{numTransacciones}</h2>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground">Productos en Inventario</p>
              <h2 className="text-2xl font-bold">{inventarioBajo.length} bajos</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Ventas por Día</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ventasPorDia}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Ventas ($)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">Productos Más Vendidos</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Producto</th>
                  <th className="py-2 px-3 text-right">Cantidad</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {productosPopulares.map((producto) => (
                  <tr key={producto.id} className="border-b">
                    <td className="py-2 px-3">{producto.nombre}</td>
                    <td className="py-2 px-3 text-right">{producto.cantidad}</td>
                    <td className="py-2 px-3 text-right">${producto.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Productos con Bajo Stock</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-3 text-left">Código</th>
                <th className="py-2 px-3 text-left">Producto</th>
                <th className="py-2 px-3 text-right">Stock Actual</th>
                <th className="py-2 px-3 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {inventarioBajo.map((producto) => (
                <tr key={producto.id} className="border-b">
                  <td className="py-2 px-3">{producto.codigo}</td>
                  <td className="py-2 px-3">{producto.nombre}</td>
                  <td className="py-2 px-3 text-right text-destructive font-medium">{producto.stock}</td>
                  <td className="py-2 px-3 text-right">${producto.precio.toFixed(2)}</td>
                </tr>
              ))}
              {inventarioBajo.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">
                    No hay productos con bajo stock
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Reportes;
