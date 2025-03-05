
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Search, Edit, Trash2 } from "lucide-react";
import { dbAPI, ProductoInterface } from "@/services/database-electron";
import { useAuth } from "@/contexts/AuthContext";

const Inventario = () => {
  const [productos, setProductos] = useState<ProductoInterface[]>([]);
  const [busqueda, setBusqueda] = useState("");
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
    
    cargarProductos();
  }, [isAdmin, navigate, toast]);

  const cargarProductos = async () => {
    try {
      const productosGuardados = await dbAPI.getProductos();
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

  const eliminarProducto = async (id: number) => {
    try {
      await dbAPI.deleteProducto(id);
      toast({
        title: "Éxito",
        description: "Producto eliminado correctamente",
      });
      cargarProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
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
        <Link to="/inventario/nuevo">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </Link>
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="py-3 px-4 text-left">Código</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Categoría</th>
              <th className="py-3 px-4 text-right">Precio</th>
              <th className="py-3 px-4 text-right">Stock</th>
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
                        className="p-2 text-destructive hover:text-destructive"
                        onClick={() => eliminarProducto(producto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
