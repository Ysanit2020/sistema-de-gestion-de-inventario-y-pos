
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { db } from "@/services/database";
import { useAuth } from "@/contexts/AuthContext";
import { dbAPI } from "@/services/database-electron";

const ProductoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const isEditMode = Boolean(id);
  
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página",
        variant: "destructive"
      });
    }
  }, [isAdmin, navigate, toast]);
  
  const [producto, setProducto] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    categoria: "",
    precio: "",
    costo: "",
    stock: "",
    stockMinimo: ""
  });
  
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode) {
      cargarProducto(Number(id));
    }
  }, [id, isEditMode]);

  const cargarProducto = async (productoId) => {
    try {
      const productoExistente = await db.productos.get(productoId);
      
      if (productoExistente) {
        setProducto({
          codigo: productoExistente.codigo,
          nombre: productoExistente.nombre,
          descripcion: productoExistente.descripcion || "",
          categoria: productoExistente.categoria,
          precio: productoExistente.precio.toString(),
          costo: productoExistente.costo?.toString() || "",
          stock: productoExistente.stock.toString(),
          stockMinimo: productoExistente.stockMinimo?.toString() || "5"
        });
      } else {
        toast({
          title: "Error",
          description: "Producto no encontrado",
          variant: "destructive"
        });
        navigate("/inventario");
      }
    } catch (error) {
      console.error("Error al cargar producto:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el producto",
        variant: "destructive"
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto({
      ...producto,
      [name]: value
    });
  };

  const validarFormulario = () => {
    if (!producto.codigo.trim()) {
      setError("El código es obligatorio");
      return false;
    }
    
    if (!producto.nombre.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    
    if (isNaN(Number(producto.precio)) || Number(producto.precio) <= 0) {
      setError("El precio debe ser un número mayor a 0");
      return false;
    }
    
    if (isNaN(Number(producto.stock))) {
      setError("El stock debe ser un número");
      return false;
    }
    
    setError("");
    return true;
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    try {
      const productoGuardar = {
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        categoria: producto.categoria,
        precio: Number(producto.precio),
        costo: producto.costo ? Number(producto.costo) : 0,
        stock: Number(producto.stock),
        stockMinimo: producto.stockMinimo ? Number(producto.stockMinimo) : 5
      };
      
      if (isEditMode) {
        await db.productos.update(Number(id), productoGuardar);
        toast({
          title: "Éxito",
          description: "Producto actualizado correctamente",
        });
      } else {
        const productoExistente = await db.productos
          .where('codigo')
          .equals(producto.codigo)
          .first();
        
        if (productoExistente) {
          setError("Ya existe un producto con este código");
          return;
        }
        
        // Guardar producto en la tabla principal
        const nuevoProductoId = await db.productos.add(productoGuardar);
        
        // Obtener subalmacén principal (el primero)
        const subalmacenes = await db.subalmacenes.toArray();
        if (subalmacenes.length > 0) {
          const almacenPrincipal = subalmacenes[0];
          
          // Agregar todo el stock al almacén principal
          await db.inventarioSubalmacen.add({
            productoId: nuevoProductoId,
            subalmacenId: almacenPrincipal.id!,
            stock: Number(producto.stock)
          });
        }
        
        toast({
          title: "Éxito",
          description: "Producto añadido correctamente al almacén principal",
        });
      }
      
      navigate("/inventario");
    } catch (error) {
      console.error("Error al guardar producto:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Link to="/inventario">
          <Button variant="ghost" className="mr-2 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold">
          {isEditMode ? "Editar Producto" : "Nuevo Producto"}
        </h1>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={guardarProducto}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="codigo">
                Código *
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={producto.codigo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                disabled={isEditMode}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="nombre">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={producto.nombre}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={producto.descripcion}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="categoria">
                Categoría
              </label>
              <input
                type="text"
                id="categoria"
                name="categoria"
                value={producto.categoria}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="precio">
                Precio *
              </label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={producto.precio}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="costo">
                Costo
              </label>
              <input
                type="number"
                id="costo"
                name="costo"
                value={producto.costo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="stock">
                Stock *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={producto.stock}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="stockMinimo">
                Stock Mínimo
              </label>
              <input
                type="number"
                id="stockMinimo"
                name="stockMinimo"
                value={producto.stockMinimo}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                min="0"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Link to="/inventario">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" className="flex items-center">
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProductoForm;
