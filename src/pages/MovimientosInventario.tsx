import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Plus, Search, Save, 
  ArrowDown, ArrowUp, Calendar, FileText 
} from "lucide-react";
import { 
  db, ProductoInterface, SubalmacenInterface, 
  MovimientoInventarioInterface 
} from "@/services/database";
import { format } from "date-fns";

const MovimientosInventario = () => {
  const { toast } = useToast();
  const [movimientos, setMovimientos] = useState<MovimientoInventarioInterface[]>([]);
  const [productos, setProductos] = useState<ProductoInterface[]>([]);
  const [subalmacenes, setSubalmacenes] = useState<SubalmacenInterface[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida'>('entrada');
  const [fechaActual] = useState(new Date());
  const [documentoRef, setDocumentoRef] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [subalmacenId, setSubalmacenId] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [filtroPorTipo, setFiltroPorTipo] = useState<'todos' | 'entrada' | 'salida' | 'transferencia'>('todos');
  const [filtroPorFecha, setFiltroPorFecha] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('todos');
  const [productosEnFormulario, setProductosEnFormulario] = useState<{
    productoId: number,
    cantidad: number,
    nombre?: string,
    codigo?: string
  }[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [filtroPorTipo, filtroPorFecha]);

  const cargarDatos = async () => {
    try {
      const productosDB = await db.productos.toArray();
      setProductos(productosDB);

      const subalmacenesDB = await db.subalmacenes.toArray();
      setSubalmacenes(subalmacenesDB);
      
      if (subalmacenesDB.length > 0 && !subalmacenId) {
        setSubalmacenId(subalmacenesDB[0].id || null);
      }

      let movimientosCollection = db.movimientosInventario.orderBy('fecha').reverse();
      
      if (filtroPorTipo !== 'todos') {
        movimientosCollection = movimientosCollection.filter(m => m.tipo === filtroPorTipo);
      }
      
      if (filtroPorFecha !== 'todos') {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        let fechaInicio = new Date(hoy);
        
        if (filtroPorFecha === 'semana') {
          fechaInicio.setDate(hoy.getDate() - 7);
        } else if (filtroPorFecha === 'mes') {
          fechaInicio.setMonth(hoy.getMonth() - 1);
        }
        
        movimientosCollection = movimientosCollection.filter(m => m.fecha >= fechaInicio);
      }
      
      const movimientosDB = await movimientosCollection.toArray();
      setMovimientos(movimientosDB);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    }
  };

  const agregarProductoAFormulario = () => {
    if (!productoSeleccionado || cantidad <= 0) {
      toast({
        title: "Error",
        description: "Seleccione un producto y una cantidad válida",
        variant: "destructive"
      });
      return;
    }

    const existente = productosEnFormulario.find(p => p.productoId === productoSeleccionado);
    if (existente) {
      setProductosEnFormulario(productosEnFormulario.map(p => 
        p.productoId === productoSeleccionado 
          ? { ...p, cantidad: p.cantidad + cantidad } 
          : p
      ));
    } else {
      const producto = productos.find(p => p.id === productoSeleccionado);
      setProductosEnFormulario([
        ...productosEnFormulario, 
        { 
          productoId: productoSeleccionado, 
          cantidad,
          nombre: producto?.nombre,
          codigo: producto?.codigo
        }
      ]);
    }

    setProductoSeleccionado(null);
    setCantidad(1);
  };

  const quitarProductoDeFormulario = (index: number) => {
    setProductosEnFormulario(productosEnFormulario.filter((_, i) => i !== index));
  };

  const registrarMovimiento = async () => {
    try {
      if (!subalmacenId) {
        toast({
          title: "Error",
          description: "Seleccione un almacén",
          variant: "destructive"
        });
        return;
      }

      if (productosEnFormulario.length === 0) {
        toast({
          title: "Error",
          description: "Agregue al menos un producto",
          variant: "destructive"
        });
        return;
      }

      for (const item of productosEnFormulario) {
        let inventarioActual = await db.inventarioSubalmacen
          .where('productoId')
          .equals(item.productoId)
          .and(inv => inv.subalmacenId === subalmacenId)
          .first();

        if (tipoMovimiento === 'salida' && (!inventarioActual || inventarioActual.stock < item.cantidad)) {
          toast({
            title: "Error",
            description: `Stock insuficiente para ${item.nombre || 'el producto seleccionado'}`,
            variant: "destructive"
          });
          return;
        }

        await db.movimientosInventario.add({
          fecha: fechaActual,
          productoId: item.productoId,
          subalmacenId: subalmacenId,
          cantidad: item.cantidad,
          tipo: tipoMovimiento,
          descripcion: descripcion,
          documentoRef: documentoRef
        });

        if (inventarioActual) {
          const nuevoStock = tipoMovimiento === 'entrada' 
            ? inventarioActual.stock + item.cantidad 
            : inventarioActual.stock - item.cantidad;
          
          await db.inventarioSubalmacen.update(inventarioActual.id!, {
            stock: nuevoStock
          });
        } else if (tipoMovimiento === 'entrada') {
          await db.inventarioSubalmacen.add({
            productoId: item.productoId,
            subalmacenId: subalmacenId,
            stock: item.cantidad
          });
        }
      }

      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente",
      });

      setProductosEnFormulario([]);
      setDocumentoRef("");
      setDescripcion("");
      setMostrarFormulario(false);
      
      cargarDatos();
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento",
        variant: "destructive"
      });
    }
  };

  const getNombreProducto = (id: number) => {
    const producto = productos.find(p => p.id === id);
    return producto ? producto.nombre : "Producto no encontrado";
  };

  const getNombreSubalmacen = (id: number) => {
    const subalmacen = subalmacenes.find(s => s.id === id);
    return subalmacen ? subalmacen.nombre : "Almacén no encontrado";
  };

  const movimientosFiltrados = movimientos.filter(movimiento => {
    const producto = productos.find(p => p.id === movimiento.productoId);
    const subalmacen = subalmacenes.find(s => s.id === movimiento.subalmacenId);
    
    const textoBusqueda = busqueda.toLowerCase();
    
    return (
      (producto && producto.nombre.toLowerCase().includes(textoBusqueda)) ||
      (producto && producto.codigo.toLowerCase().includes(textoBusqueda)) ||
      (subalmacen && subalmacen.nombre.toLowerCase().includes(textoBusqueda)) ||
      (movimiento.descripcion && movimiento.descripcion.toLowerCase().includes(textoBusqueda)) ||
      (movimiento.documentoRef && movimiento.documentoRef.toLowerCase().includes(textoBusqueda))
    );
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/dashboard">
            <Button variant="ghost" className="mr-2 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-display font-bold">Movimientos de Inventario</h1>
        </div>
        <Button className="flex items-center" onClick={() => setMostrarFormulario(!mostrarFormulario)}>
          <Plus className="mr-2 h-4 w-4" /> 
          {mostrarFormulario ? "Cancelar" : "Nuevo Movimiento"}
        </Button>
      </div>

      {mostrarFormulario && (
        <Card className="mb-6 p-4">
          <h2 className="text-xl font-semibold mb-4">
            {tipoMovimiento === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-3 flex justify-start gap-2 mb-4">
              <Button
                variant={tipoMovimiento === 'entrada' ? 'primary' : 'outline'}
                className="flex items-center"
                onClick={() => setTipoMovimiento('entrada')}
              >
                <ArrowDown className="mr-2 h-4 w-4" /> Entrada
              </Button>
              <Button
                variant={tipoMovimiento === 'salida' ? 'primary' : 'outline'}
                className="flex items-center"
                onClick={() => setTipoMovimiento('salida')}
              >
                <ArrowUp className="mr-2 h-4 w-4" /> Salida
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha
              </label>
              <div className="flex items-center p-2 border rounded-md bg-muted/30">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{format(fechaActual, 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Referencia Documento
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-md bg-background text-foreground"
                value={documentoRef}
                onChange={(e) => setDocumentoRef(e.target.value)}
                placeholder="Factura, Nota, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Almacén
              </label>
              <select
                className="w-full p-2 border rounded-md bg-background text-foreground"
                value={subalmacenId || ""}
                onChange={(e) => setSubalmacenId(Number(e.target.value))}
              >
                {subalmacenes.map(subalmacen => (
                  <option key={subalmacen.id} value={subalmacen.id}>
                    {subalmacen.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">
                Descripción
              </label>
              <textarea
                className="w-full p-2 border rounded-md bg-background text-foreground"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles del movimiento"
                rows={2}
              />
            </div>
          </div>

          <h3 className="font-medium mb-2">Productos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Producto
              </label>
              <select
                className="w-full p-2 border rounded-md bg-background text-foreground"
                value={productoSeleccionado || ""}
                onChange={(e) => setProductoSeleccionado(Number(e.target.value))}
              >
                <option value="">Seleccionar producto</option>
                {productos.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.codigo} - {producto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cantidad
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-md bg-background text-foreground"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={agregarProductoAFormulario}
                className="flex items-center"
                disabled={!productoSeleccionado}
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar
              </Button>
            </div>
          </div>

          {productosEnFormulario.length > 0 && (
            <div className="border rounded-md overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="py-2 px-3 text-left">Código</th>
                    <th className="py-2 px-3 text-left">Producto</th>
                    <th className="py-2 px-3 text-right">Cantidad</th>
                    <th className="py-2 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productosEnFormulario.map((item, index) => (
                    <tr key={`item-${index}`} className="border-t">
                      <td className="py-2 px-3">{item.codigo}</td>
                      <td className="py-2 px-3">{item.nombre}</td>
                      <td className="py-2 px-3 text-right">{item.cantidad}</td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-destructive"
                          onClick={() => quitarProductoDeFormulario(index)}
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              className="flex items-center"
              onClick={registrarMovimiento}
              disabled={productosEnFormulario.length === 0}
            >
              <Save className="mr-2 h-4 w-4" /> Registrar Movimiento
            </Button>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-foreground"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="p-2 border rounded-md bg-background text-foreground"
              value={filtroPorTipo}
              onChange={(e) => setFiltroPorTipo(e.target.value as any)}
            >
              <option value="todos">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="transferencia">Transferencias</option>
            </select>
            <select
              className="p-2 border rounded-md bg-background text-foreground"
              value={filtroPorFecha}
              onChange={(e) => setFiltroPorFecha(e.target.value as any)}
            >
              <option value="todos">Todas las fechas</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="py-3 px-4 text-left">Fecha</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Producto</th>
                <th className="py-3 px-4 text-right">Cantidad</th>
                <th className="py-3 px-4 text-left">Almacén</th>
                <th className="py-3 px-4 text-left">Documento</th>
                <th className="py-3 px-4 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length > 0 ? (
                movimientosFiltrados.map(movimiento => (
                  <tr key={movimiento.id} className="border-t hover:bg-muted/30">
                    <td className="py-2 px-4">
                      {format(new Date(movimiento.fecha), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        movimiento.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : movimiento.tipo === 'salida'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {movimiento.tipo === 'entrada' 
                          ? <ArrowDown className="mr-1 h-3 w-3" /> 
                          : movimiento.tipo === 'salida'
                            ? <ArrowUp className="mr-1 h-3 w-3" />
                            : <ArrowLeft className="mr-1 h-3 w-3" />
                        }
                        {movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-4">{getNombreProducto(movimiento.productoId)}</td>
                    <td className="py-2 px-4 text-right font-medium">
                      {movimiento.cantidad}
                    </td>
                    <td className="py-2 px-4">{getNombreSubalmacen(movimiento.subalmacenId)}</td>
                    <td className="py-2 px-4">{movimiento.documentoRef || '-'}</td>
                    <td className="py-2 px-4">{movimiento.descripcion || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No se encontraron movimientos
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

export default MovimientosInventario;
