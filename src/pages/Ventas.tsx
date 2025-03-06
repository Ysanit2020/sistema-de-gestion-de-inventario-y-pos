
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, DollarSign } from "lucide-react";
import { db } from "@/services/database";
import { useAuth } from "@/contexts/AuthContext";
import { dbAPI, ProductoInterface } from "@/services/database-electron";

interface ProductoEnSubalmacen extends ProductoInterface {
  productoId?: number;
}

const Ventas = () => {
  const [productos, setProductos] = useState<ProductoEnSubalmacen[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<any[]>([]);
  const [pagoCon, setPagoCon] = useState("");
  const [cambio, setCambio] = useState(0);
  const [mostrarCambio, setMostrarCambio] = useState(false);
  const { toast } = useToast();
  const { currentUser, subalmacenId } = useAuth();
  
  useEffect(() => {
    console.log("Punto de venta - Usuario actual:", currentUser);
    console.log("Punto de venta - SubalmacenId:", subalmacenId);
    
    cargarProductos();
  }, [subalmacenId]);

  const cargarProductos = async () => {
    try {
      if (subalmacenId) {
        console.log("Cargando productos del subalmacén:", subalmacenId);
        // Solo mostrar productos del subalmacén asignado al usuario
        const inventario = await dbAPI.getInventarioSubalmacen(subalmacenId);
        
        // Filtrar productos con stock mayor a 0
        const productosConStock = inventario.filter((item: any) => item.stock > 0);
        console.log("Productos con stock en subalmacén:", productosConStock);
        setProductos(productosConStock);
        
        if (productosConStock.length === 0) {
          toast({
            title: "Sin inventario",
            description: "No hay productos en este punto de venta. Contacta al administrador para transferir inventario.",
          });
        }
      } else {
        console.log("Usuario sin subalmacén asignado");
        toast({
          title: "Sin punto de venta",
          description: "No tienes un punto de venta asignado. Contacta al administrador para que te asigne uno.",
          variant: "destructive"
        });
        setProductos([]);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    }
  };

  const agregarAlCarrito = (producto: ProductoEnSubalmacen) => {
    const productoId = producto.productoId || producto.id;
    const itemExistente = carrito.find(item => 
      item.id === productoId
    );
    
    if (itemExistente) {
      if (itemExistente.cantidad + 1 > producto.stock) {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${producto.stock} unidades disponibles de este producto`,
          variant: "destructive"
        });
        return;
      }
      
      const nuevoCarrito = carrito.map(item => 
        item.id === productoId
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      );
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([...carrito, { 
        ...producto, 
        id: productoId,
        cantidad: 1,
        subalmacenId: subalmacenId
      }]);
    }
    
    setPagoCon("");
    setCambio(0);
    setMostrarCambio(false);
    
    toast({
      title: "Añadido",
      description: `${producto.nombre} agregado al carrito`,
    });
  };

  const cambiarCantidad = (id, cambio) => {
    const nuevoCarrito = carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + cambio;
        
        if (cambio > 0) {
          const producto = productos.find(p => (p.productoId || p.id) === id);
          if (producto && nuevaCantidad > producto.stock) {
            toast({
              title: "Stock insuficiente",
              description: `Solo hay ${producto.stock} unidades disponibles de este producto`,
              variant: "destructive"
            });
            return item;
          }
        }
        
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter(Boolean);
    
    setCarrito(nuevoCarrito);
    
    setPagoCon("");
    setCambio(0);
    setMostrarCambio(false);
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
    
    setPagoCon("");
    setCambio(0);
    setMostrarCambio(false);
  };

  const totalVenta = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad, 
    0
  );

  const calcularCambio = () => {
    const montoRecibido = parseFloat(pagoCon);
    
    if (isNaN(montoRecibido) || montoRecibido < totalVenta) {
      toast({
        title: "Error",
        description: "El monto recibido debe ser mayor o igual al total",
        variant: "destructive"
      });
      return;
    }
    
    const cambioCalculado = montoRecibido - totalVenta;
    setCambio(cambioCalculado);
    setMostrarCambio(true);
  };

  const buscarProducto = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && busqueda) {
      try {
        if (!subalmacenId) {
          toast({
            title: "Sin punto de venta",
            description: "No tienes un punto de venta asignado",
            variant: "destructive"
          });
          return;
        }
        
        const producto = await db.productos
          .where('codigo')
          .equals(busqueda)
          .first();
        
        if (producto) {
          const inventario = await db.inventarioSubalmacen
            .where('[productoId+subalmacenId]')
            .equals([producto.id, subalmacenId])
            .first();
          
          if (inventario && inventario.stock > 0) {
            agregarAlCarrito({
              ...producto,
              productoId: producto.id,
              stock: inventario.stock
            });
            setBusqueda("");
          } else {
            toast({
              title: "Sin stock",
              description: "Este producto no tiene stock disponible en tu punto de venta",
              variant: "destructive"
            });
          }
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
    if (!subalmacenId) {
      toast({
        title: "Sin punto de venta",
        description: "No tienes un punto de venta asignado",
        variant: "destructive"
      });
      return;
    }
    
    if (carrito.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregue productos para realizar una venta",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!mostrarCambio) {
        toast({
          title: "Calcule el cambio",
          description: "Ingrese el monto con el que paga el cliente",
          variant: "destructive"
        });
        return;
      }
      
      const nuevaVenta = {
        fecha: new Date(),
        productos: carrito,
        total: totalVenta,
        pagoCon: parseFloat(pagoCon),
        cambio: cambio,
        subalmacenId: subalmacenId,
        vendedorId: currentUser?.id
      };
      
      const ventaId = await db.ventas.add(nuevaVenta);
      
      // Procesar cada producto del carrito
      let todoCorrecto = true;
      
      for (const item of carrito) {
        try {
          console.log("Transferir producto de venta:", {
            id: item.id,
            cantidad: item.cantidad,
            origen: subalmacenId
          });
          
          const transferido = await dbAPI.transferirProducto(
            item.id,
            item.cantidad,
            subalmacenId,
            0 // 0 indica que es una venta
          );
          
          if (!transferido) {
            todoCorrecto = false;
            console.error("Error al transferir producto:", item);
          }
        } catch (err) {
          console.error("Error al actualizar inventario:", err);
          todoCorrecto = false;
        }
      }
      
      if (!todoCorrecto) {
        toast({
          title: "Advertencia",
          description: "La venta se registró pero hubo problemas actualizando el inventario",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Venta realizada",
          description: `Venta #${ventaId} registrada correctamente`,
        });
      }
      
      setCarrito([]);
      setPagoCon("");
      setCambio(0);
      setMostrarCambio(false);
      
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
                  key={producto.productoId || producto.id} 
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
                {subalmacenId ? 
                  "No hay productos disponibles en este punto de venta" : 
                  "No tienes un punto de venta asignado"}
              </div>
            )}
          </div>
        </div>

        <div>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Carrito</h2>
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => {
                  setCarrito([]);
                  setPagoCon("");
                  setCambio(0);
                  setMostrarCambio(false);
                }}
                disabled={carrito.length === 0}
              >
                Limpiar
              </Button>
            </div>

            <div className="min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
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
              
              {carrito.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Pago con:
                      </label>
                      <div className="flex">
                        <div className="bg-muted flex items-center justify-center px-3 border border-r-0 rounded-l-md">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                          type="number"
                          value={pagoCon}
                          onChange={(e) => setPagoCon(e.target.value)}
                          className="flex-1 p-2 border rounded-r-md"
                          min={totalVenta}
                          step="0.50"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={calcularCambio}
                      className="self-end"
                      disabled={!pagoCon || parseFloat(pagoCon) < totalVenta}
                    >
                      Calcular
                    </Button>
                  </div>
                  
                  {mostrarCambio && (
                    <div className="bg-primary/10 p-3 rounded-md mb-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Cambio a devolver:</span>
                        <span className="text-xl font-bold">${cambio.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                className="w-full"
                disabled={carrito.length === 0 || !mostrarCambio}
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
