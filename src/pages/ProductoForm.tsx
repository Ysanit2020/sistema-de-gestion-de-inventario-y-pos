
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
  const [stockActual, setStockActual] = useState(0);
  const [subalmacenId, setSubalmacenId] = useState<number | null>(null);
  const [modoEntrada, setModoEntrada] = useState(true);

  useEffect(() => {
    if (isEditMode) {
      cargarProducto(Number(id));
    }
  }, [id, isEditMode]);

  const cargarProducto = async (productoId) => {
    try {
      const productoExistente = await db.productos.get(productoId);
      
      if (productoExistente) {
        // Obtener subalmacén principal (el primero)
        const subalmacenes = await db.subalmacenes.toArray();
        if (subalmacenes.length > 0) {
          const almacenPrincipal = subalmacenes[0];
          setSubalmacenId(almacenPrincipal.id!);
          
          // Obtener stock actual en el subalmacén principal
          const inventario = await db.inventarioSubalmacen
            .where('productoId')
            .equals(productoId)
            .and(item => item.subalmacenId === almacenPrincipal.id)
            .first();
          
          if (inventario) {
            setStockActual(inventario.stock);
          }
        }
        
        setProducto({
          codigo: productoExistente.codigo,
          nombre: productoExistente.nombre,
          descripcion: productoExistente.descripcion || "",
          categoria: productoExistente.categoria,
          precio: productoExistente.precio.toString(),
          costo: productoExistente.costo?.toString() || "",
          stock: "0", // Inicializamos en 0 para que el usuario agregue solo la cantidad a incrementar
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
        stock: Number(producto.stock), // Esto se usará para nuevo producto
        stockMinimo: producto.stockMinimo ? Number(producto.stockMinimo) : 5
      };
      
      if (isEditMode) {
        // Obtener el producto actual para guardar los datos correctos
        const productoActual = await db.productos.get(Number(id));
        
        if (productoActual) {
          // Actualizar el producto en la tabla de productos (sin cambiar stock aquí)
          await db.productos.update(Number(id), {
            ...productoActual,
            nombre: productoGuardar.nombre,
            descripcion: productoGuardar.descripcion,
            categoria: productoGuardar.categoria,
            precio: productoGuardar.precio,
            costo: productoGuardar.costo,
            stockMinimo: productoGuardar.stockMinimo
          });
          
          // Calcular la cantidad a agregar o restar al inventario
          const cantidadCambio = Number(producto.stock); // La cantidad ingresada es el cambio
          
          if (cantidadCambio !== 0 && subalmacenId) {
            // Obtener el registro de inventario actual
            const inventarioActual = await db.inventarioSubalmacen
              .where('productoId')
              .equals(Number(id))
              .and(item => item.subalmacenId === subalmacenId)
              .first();
            
            if (inventarioActual) {
              // Determinar el tipo de movimiento (entrada o salida)
              const tipoMovimiento = modoEntrada ? 'entrada' : 'salida';
              const cantidadAjustada = modoEntrada ? cantidadCambio : -cantidadCambio;
              
              // Actualizar el stock en el inventario
              const nuevoStock = inventarioActual.stock + cantidadAjustada;
              
              // Verificar que el stock no quede negativo
              if (!modoEntrada && nuevoStock < 0) {
                toast({
                  title: "Error",
                  description: `No se puede retirar más de lo que hay en stock (${inventarioActual.stock} unidades)`,
                  variant: "destructive"
                });
                return;
              }
              
              await db.inventarioSubalmacen.update(inventarioActual.id!, {
                stock: nuevoStock
              });
              
              // Registrar el movimiento en el historial
              const fechaActual = new Date();
              await db.movimientosInventario.add({
                fecha: fechaActual,
                productoId: Number(id),
                subalmacenId: subalmacenId,
                cantidad: Math.abs(cantidadCambio),
                tipo: tipoMovimiento,
                descripcion: `${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} de producto - ${fechaActual.toLocaleString()}`
              });
              
              console.log(`Stock actualizado: ${inventarioActual.stock} → ${nuevoStock}`);
            }
          }
          
          toast({
            title: "Éxito",
            description: modoEntrada 
                ? `Producto actualizado y se agregaron ${producto.stock} unidades` 
                : `Producto actualizado y se retiraron ${producto.stock} unidades`,
          });
        }
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
          
          // Registrar el movimiento en el historial
          await db.movimientosInventario.add({
            fecha: new Date(),
            productoId: nuevoProductoId,
            subalmacenId: almacenPrincipal.id!,
            cantidad: Number(producto.stock),
            tipo: 'entrada',
            descripcion: 'Creación inicial de producto'
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              {isEditMode ? (
                <>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium mb-1" htmlFor="stock">
                      Stock Actual: <span className="font-bold">{stockActual}</span>
                    </label>
                    <div className="space-x-2">
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded ${modoEntrada ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                        onClick={() => setModoEntrada(true)}
                      >
                        Entrada
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded ${!modoEntrada ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                        onClick={() => setModoEntrada(false)}
                      >
                        Salida
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={producto.stock}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md bg-background text-foreground"
                      min="0"
                      placeholder={modoEntrada ? "Cantidad a agregar" : "Cantidad a retirar"}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {modoEntrada 
                      ? `Se agregarán ${Number(producto.stock) || 0} unidades al inventario (Total: ${stockActual + (Number(producto.stock) || 0)})` 
                      : `Se retirarán ${Number(producto.stock) || 0} unidades del inventario (Total: ${stockActual - (Number(producto.stock) || 0)})`}
                  </p>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium mb-1" htmlFor="stock">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={producto.stock}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md bg-background text-foreground"
                    min="0"
                    required
                  />
                </>
              )}
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
                className="w-full p-2 border rounded-md bg-background text-foreground"
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
