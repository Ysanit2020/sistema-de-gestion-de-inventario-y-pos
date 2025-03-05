
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Search, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import { dbAPI, ProductoInterface, SubalmacenInterface } from "@/services/database-electron";
import { useAuth } from "@/contexts/AuthContext";

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
      setProductos(productosGuardados);
      
      // Cargar subalmacenes
      const subalmacenesGuardados = await dbAPI.getSubalmacenes();
      setSubalmacenes(subalmacenesGuardados);
      
      // Cargar inventario de cada subalmacén
      const inventarioTemp: { [key: number]: { [key: number]: number } } = {};
      
      for (const subalmacen of subalmacenesGuardados) {
        if (subalmacen.id) {
          const inventario = await dbAPI.getInventarioSubalmacen(subalmacen.id);
          inventarioTemp[subalmacen.id] = {};
          
          // Organizar el inventario por producto
          inventario.forEach(item => {
            if (item.productoId) {
              inventarioTemp[subalmacen.id][item.productoId] = item.stock;
            }
          });
        }
      }
      
      setInventarioSubalmacen(inventarioTemp);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
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
  
  const transferirProducto = async () => {
    if (!productoSeleccionado || !origen || !destino || cantidad <= 0) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar stock disponible
    const stockOrigen = getStockEnSubalmacen(productoSeleccionado.id!, origen);
    if (stockOrigen < cantidad) {
      toast({
        title: "Error",
        description: `Stock insuficiente. Solo hay ${stockOrigen} unidades disponibles`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      const resultado = await dbAPI.transferirProducto(
        productoSeleccionado.id!,
        cantidad,
        origen,
        destino
      );
      
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
        </div>
      </div>
      
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
                    <span className={producto.stock < 10 ? "text-destructive font-medium" : ""}>
                      {producto.stock}
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
