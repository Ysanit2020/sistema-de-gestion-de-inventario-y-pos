
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Search, Edit, Trash2, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { dbAPI, ProductoInterface, SubalmacenInterface } from "@/services/database-electron";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/services/database";

// Definimos el umbral de stock bajo
const STOCK_BAJO_UMBRAL = 10;

const Inventario = () => {
  const [productos, setProductos] = useState<ProductoInterface[]>([]);
  const [subalmacenes, setSubalmacenes] = useState<SubalmacenInterface[]>([]);
  const [inventarioSubalmacen, setInventarioSubalmacen] = useState<{ [key: number]: { [key: number]: number } }>({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInterface | null>(null);
  const [origen, setOrigen] = useState<number | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [productosStockBajo, setProductosStockBajo] = useState<ProductoInterface[]>([]);
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState<boolean>(false);
  
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redireccionar si no es administrador
    if (!isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página",
        variant: "destructive"
      });
      return;
    }
    
    cargarDatos();
  }, [isAdmin, navigate, toast]);

  const cargarDatos = async () => {
    try {
      // Cargar productos del almacén principal
      const productosGuardados = await dbAPI.getProductos();
      console.log("Productos cargados:", productosGuardados);
      setProductos(productosGuardados);
      
      // Cargar subalmacenes
      const subalmacenesGuardados = await dbAPI.getSubalmacenes();
      console.log("Subalmacenes cargados:", subalmacenesGuardados);
      setSubalmacenes(subalmacenesGuardados);
      
      // Cargar inventario de cada subalmacén
      const inventarioTemp: { [key: number]: { [key: number]: number } } = {};
      
      for (const subalmacen of subalmacenesGuardados) {
        if (subalmacen.id) {
          const inventario = await dbAPI.getInventarioSubalmacen(subalmacen.id);
          console.log(`Inventario subalmacén ${subalmacen.id}:`, inventario);
          inventarioTemp[subalmacen.id] = {};
          
          // Organizar el inventario por producto
          inventario.forEach(item => {
            if (item.productoId) {
              inventarioTemp[subalmacen.id][item.productoId] = item.stock;
            }
          });
        }
      }
      
      console.log("Inventario organizado:", inventarioTemp);
      setInventarioSubalmacen(inventarioTemp);
      
      // Verificar productos con stock bajo
      verificarStockBajo(productosGuardados, inventarioTemp, subalmacenesGuardados);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    }
  };
  
  const verificarStockBajo = (productos: ProductoInterface[], inventario: any, subalmacenes: SubalmacenInterface[]) => {
    const productosBajoStock: ProductoInterface[] = [];
    
    productos.forEach(producto => {
      if (producto.id) {
        let stockTotal = 0;
        subalmacenes.forEach(subalmacen => {
          if (subalmacen.id && inventario[subalmacen.id] && inventario[subalmacen.id][producto.id!] !== undefined) {
            stockTotal += inventario[subalmacen.id][producto.id!];
          }
        });
        
        if (stockTotal < STOCK_BAJO_UMBRAL) {
          productosBajoStock.push({...producto, stockTotal});
        }
      }
    });
    
    console.log("Productos con bajo stock:", productosBajoStock);
    setProductosStockBajo(productosBajoStock);
    
    // Mostrar alerta si hay productos con bajo stock
    if (productosBajoStock.length > 0) {
      toast({
        title: "Alerta de Stock",
        description: `Hay ${productosBajoStock.length} producto(s) con stock bajo`,
        variant: "destructive"
      });
    }
  };

  const eliminarProducto = async (id: number) => {
    try {
      await dbAPI.deleteProducto(id);
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  };
  
  const abrirTransferencia = (producto: ProductoInterface) => {
    setProductoSeleccionado(producto);
    // Por defecto, el origen es el almacén principal (el primer subalmacén)
    setOrigen(subalmacenes[0]?.id || null);
    // Por defecto, el destino es el segundo subalmacén si existe
    setDestino(subalmacenes.length > 1 ? subalmacenes[1]?.id : null);
    setCantidad(1);
    setMostrarTransferencia(true);
  };
  
  const getStockEnSubalmacen = (productoId: number, subalmacenId: number): number => {
    if (inventarioSubalmacen[subalmacenId] && inventarioSubalmacen[subalmacenId][productoId] !== undefined) {
      return inventarioSubalmacen[subalmacenId][productoId];
    }
    return 0;
  };
  
  const getStockTotal = (productoId: number): number => {
    let total = 0;
    subalmacenes.forEach(subalmacen => {
      if (subalmacen.id) {
        total += getStockEnSubalmacen(productoId, subalmacen.id);
      }
    });
    return total;
  };
  
  const transferirProducto = async () => {
    if (!productoSeleccionado || !origen || !destino || cantidad <= 0) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive"
      });
      return;
    }
    
    if (origen === destino) {
      toast({
        title: "Error",
        description: "El origen y destino no pueden ser iguales",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar stock disponible
    const stockOrigen = getStockEnSubalmacen(productoSeleccionado.id!, origen);
    console.log("Stock origen:", stockOrigen, "Cantidad a transferir:", cantidad);
    
    if (stockOrigen < cantidad) {
      toast({
        title: "Error",
        description: `Stock insuficiente. Solo hay ${stockOrigen} unidades disponibles`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Intentando transferir:", {
        productoId: productoSeleccionado.id!,
        cantidad,
        origen,
        destino
      });
      
      const resultado = await dbAPI.transferirProducto(
        productoSeleccionado.id!,
        cantidad,
        origen,
        destino
      );
      
      console.log("Resultado transferencia:", resultado);
      
      if (resultado) {
        toast({
          title: "Éxito",
          description: `Se transfirieron ${cantidad} unidades correctamente`,
        });
        setMostrarTransferencia(false);
        cargarDatos();
      } else {
        toast({
          title: "Error",
          description: "No se pudo completar la transferencia",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al transferir producto:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al transferir el producto",
        variant: "destructive"
      });
    }
  };

  const productosFiltrados = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/dashboard">
            <Button variant="ghost" className="mr-2 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Inventario</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/inventario/nuevo">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Button>
          </Link>
          <Link to="/subalmacenes">
            <Button variant="outline" className="flex items-center">
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Gestionar Subalmacenes
            </Button>
          </Link>
          <Button 
            variant={productosStockBajo.length > 0 ? "destructive" : "outline"} 
            className="flex items-center"
            onClick={() => setMostrarAlertaStock(!mostrarAlertaStock)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> 
            Productos con Stock Bajo ({productosStockBajo.length})
          </Button>
        </div>
      </div>
      
      {mostrarAlertaStock && productosStockBajo.length > 0 && (
        <Card className="mb-6 p-4 border-destructive">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" /> 
            Productos con Stock Bajo
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="py-2 px-3 text-left">Código</th>
                  <th className="py-2 px-3 text-left">Nombre</th>
                  <th className="py-2 px-3 text-right">Stock Total</th>
                  <th className="py-2 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosStockBajo.map(producto => (
                  <tr key={`bajo-${producto.id}`} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">{producto.codigo}</td>
                    <td className="py-2 px-3">{producto.nombre}</td>
                    <td className="py-2 px-3 text-right text-destructive font-medium">
                      {getStockTotal(producto.id!)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex justify-center gap-2">
                        <Link to={`/inventario/editar/${producto.id}`}>
                          <Button variant="ghost" size="sm" className="p-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2 text-blue-600 hover:text-blue-800"
                          onClick={() => abrirTransferencia(producto)}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      
      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o categoría..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </Card>

      {mostrarTransferencia && productoSeleccionado && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Transferir Producto</h2>
          <div className="mb-4">
            <div className="font-medium">{productoSeleccionado.nombre}</div>
            <div className="text-sm text-muted-foreground">Código: {productoSeleccionado.codigo}</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Desde</label>
              <select
                className="w-full p-2 border rounded-md"
                value={origen || ""}
                onChange={(e) => setOrigen(Number(e.target.value))}
              >
                <option value="">Seleccionar origen</option>
                {subalmacenes.map(subalmacen => (
                  <option 
                    key={`origen-${subalmacen.id}`} 
                    value={subalmacen.id}
                    disabled={subalmacen.id === destino}
                  >
                    {subalmacen.nombre} (Stock: {getStockEnSubalmacen(productoSeleccionado.id!, subalmacen.id!)})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Hacia</label>
              <select
                className="w-full p-2 border rounded-md"
                value={destino || ""}
                onChange={(e) => setDestino(Number(e.target.value))}
              >
                <option value="">Seleccionar destino</option>
                {subalmacenes.map(subalmacen => (
                  <option 
                    key={`destino-${subalmacen.id}`} 
                    value={subalmacen.id}
                    disabled={subalmacen.id === origen}
                  >
                    {subalmacen.nombre} (Stock: {getStockEnSubalmacen(productoSeleccionado.id!, subalmacen.id!)})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
                max={origen ? getStockEnSubalmacen(productoSeleccionado.id!, origen) : 999}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMostrarTransferencia(false)}>
              Cancelar
            </Button>
            <Button onClick={transferirProducto}>
              Transferir Producto
            </Button>
          </div>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="py-3 px-4 text-left">Código</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Categoría</th>
              <th className="py-3 px-4 text-right">Precio</th>
              <th className="py-3 px-4 text-right">Stock Total</th>
              {subalmacenes.map(subalmacen => (
                <th key={subalmacen.id} className="py-3 px-4 text-right">
                  {subalmacen.nombre}
                </th>
              ))}
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <tr key={producto.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{producto.codigo}</td>
                  <td className="py-3 px-4">{producto.nombre}</td>
                  <td className="py-3 px-4">{producto.categoria}</td>
                  <td className="py-3 px-4 text-right">${producto.precio.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={getStockTotal(producto.id!) < STOCK_BAJO_UMBRAL ? "text-destructive font-medium" : ""}>
                      {getStockTotal(producto.id!)}
                    </span>
                  </td>
                  {subalmacenes.map(subalmacen => (
                    <td key={`${producto.id}-${subalmacen.id}`} className="py-3 px-4 text-right">
                      {getStockEnSubalmacen(producto.id!, subalmacen.id!)}
                    </td>
                  ))}
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-2">
                      <Link to={`/inventario/editar/${producto.id}`}>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 text-blue-600 hover:text-blue-800"
                        onClick={() => abrirTransferencia(producto)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 text-destructive hover:text-destructive"
                        onClick={() => eliminarProducto(producto.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7 + subalmacenes.length} className="py-8 text-center text-muted-foreground">
                  No se encontraron productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventario;
