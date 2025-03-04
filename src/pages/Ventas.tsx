
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { db } from "@/services/database";

const Ventas = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const productosGuardados = await db.productos.toArray();
      setProductos(productosGuardados);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    }
  };

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.id === producto.id);
    
    if (itemExistente) {
      const nuevoCarrito = carrito.map(item => 
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      );
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    
    toast({
      title: "Añadido",
      description: `${producto.nombre} agregado al carrito`,
    });
  };

  const cambiarCantidad = (id, cambio) => {
    const nuevoCarrito = carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + cambio;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter(Boolean);
    
    setCarrito(nuevoCarrito);
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const totalVenta = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad, 
    0
  );

  const buscarProducto = async (e) => {
    if (e.key === 'Enter' && busqueda) {
      try {
        // Buscar por código de barras
        const producto = await db.productos
          .where('codigo')
          .equals(busqueda)
          .first();
        
        if (producto) {
          agregarAlCarrito(producto);
          setBusqueda("");
        } else {
          toast({
            title: "No encontrado",
            description: "Producto no encontrado con ese código",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error al buscar producto:", error);
      }
    }
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregue productos para realizar una venta",
        variant: "destructive"
      });
      return;
    }

    try {
      // Crear nueva venta
      const nuevaVenta = {
        fecha: new Date(),
        productos: carrito,
        total: totalVenta,
      };
      
      // Guardar venta en la base de datos
      const ventaId = await db.ventas.add(nuevaVenta);
      
      // Actualizar inventario
      for (const item of carrito) {
        await db.productos.update(item.id, {
          stock: item.stock - item.cantidad
        });
      }
      
      toast({
        title: "Venta realizada",
        description: `Venta #${ventaId} registrada correctamente`,
      });
      
      // Limpiar carrito
      setCarrito([]);
      
      // Recargar productos para actualizar stock
      cargarProductos();
      
    } catch (error) {
      console.error("Error al procesar venta:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la venta",
        variant: "destructive"
      });
    }
  };

  const productosFiltrados = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" className="mr-2 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold">Punto de Ventas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Búsqueda y lista de productos */}
        <div className="lg:col-span-2">
          <Card className="mb-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={buscarProducto}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <Card 
                  key={producto.id} 
                  className="p-4 cursor-pointer hover:bg-accent"
                  onClick={() => agregarAlCarrito(producto)}
                >
                  <h3 className="font-semibold mb-1 truncate">{producto.nombre}</h3>
                  <div className="text-sm text-muted-foreground mb-2">Cód: {producto.codigo}</div>
                  <div className="flex justify-between items-center">
                    <div className="font-bold">${producto.precio.toFixed(2)}</div>
                    <div className={`text-sm ${producto.stock < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                      Stock: {producto.stock}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>

        {/* Carrito de compras */}
        <div>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Carrito</h2>
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => setCarrito([])}
                disabled={carrito.length === 0}
              >
                Limpiar
              </Button>
            </div>

            <div className="min-h-[300px] max-h-[500px] overflow-y-auto mb-4">
              {carrito.length > 0 ? (
                carrito.map((item) => (
                  <div key={item.id} className="border-b py-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{item.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.precio.toFixed(2)} x {item.cantidad}
                        </div>
                      </div>
                      <div className="font-bold">
                        ${(item.precio * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => cambiarCantidad(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 min-w-[30px] text-center">{item.cantidad}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => cambiarCantidad(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 text-destructive hover:text-destructive"
                        onClick={() => eliminarDelCarrito(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                  <p>El carrito está vacío</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total:</span>
                <span>${totalVenta.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full"
                disabled={carrito.length === 0}
                onClick={procesarVenta}
              >
                Completar Venta
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Ventas;
