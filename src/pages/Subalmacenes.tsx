import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Warehouse, Save, Plus, Minus, Trash2, ArrowRightLeft, Pencil } from "lucide-react";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { dbAPI, SubalmacenInterface, ProductoInterface } from "@/services/database-electron";

const Subalmacenes = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subalmacenes, setSubalmacenes] = useState<SubalmacenInterface[]>([]);
  const [nuevoSubalmacen, setNuevoSubalmacen] = useState<SubalmacenInterface>({
    nombre: "",
    direccion: "",
    descripcion: ""
  });
  const [editandoSubalmacen, setEditandoSubalmacen] = useState<boolean>(false);
  const [subalmacenSeleccionado, setSubalmacenSeleccionado] = useState<number | null>(null);
  
  const [productos, setProductos] = useState<ProductoInterface[]>([]);
  const [inventarioSubalmacen, setInventarioSubalmacen] = useState<any[]>([]);
  const [origenId, setOrigenId] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  
  const [transferencias, setTransferencias] = useState<{[key: number]: number}>({});
  
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta sección",
        variant: "destructive"
      });
      return;
    }
    
    cargarDatos();
  }, [isAdmin, navigate, toast]);
  
  const cargarDatos = async () => {
    try {
      const subalmacenesData = await dbAPI.getSubalmacenes();
      setSubalmacenes(subalmacenesData);
      
      const productosData = await dbAPI.getProductos();
      setProductos(productosData);
      
      if (subalmacenesData.length > 0 && !origenId) {
        setOrigenId(subalmacenesData[0].id!);
        if (subalmacenesData.length > 1) {
          setDestinoId(subalmacenesData[1].id!);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    }
  };
  
  const cargarInventarioSubalmacen = async (subalmacenId: number) => {
    try {
      const inventario = await dbAPI.getInventarioSubalmacen(subalmacenId);
      setInventarioSubalmacen(inventario);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario del subalmacén",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (origenId) {
      cargarInventarioSubalmacen(origenId);
    }
  }, [origenId]);
  
  const resetSubalmacenForm = () => {
    setNuevoSubalmacen({
      nombre: "",
      direccion: "",
      descripcion: ""
    });
    setEditandoSubalmacen(false);
    setSubalmacenSeleccionado(null);
  };
  
  const handleSubalmacenChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoSubalmacen(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const seleccionarSubalmacenParaEditar = (subalmacen: SubalmacenInterface) => {
    setNuevoSubalmacen({
      ...subalmacen,
    });
    setEditandoSubalmacen(true);
    setSubalmacenSeleccionado(subalmacen.id || null);
  };
  
  const guardarSubalmacen = async () => {
    if (!nuevoSubalmacen.nombre) {
      toast({
        title: "Error",
        description: "El nombre del subalmacén es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const resultado = await dbAPI.saveSubalmacen({
        ...nuevoSubalmacen,
        id: editandoSubalmacen ? subalmacenSeleccionado! : undefined
      });
      
      toast({
        title: "Subalmacén guardado",
        description: `Subalmacén ${editandoSubalmacen ? "actualizado" : "creado"} correctamente`,
      });
      
      resetSubalmacenForm();
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar subalmacén:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el subalmacén",
        variant: "destructive"
      });
    }
  };
  
  const eliminarSubalmacen = async (id: number) => {
    try {
      await dbAPI.deleteSubalmacen(id);
      toast({
        title: "Subalmacén eliminado",
        description: "Subalmacén eliminado correctamente",
      });
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar subalmacén:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el subalmacén",
        variant: "destructive"
      });
    }
  };
  
  const handleTransferirChange = (productoId: number, cantidad: number) => {
    setTransferencias(prev => ({
      ...prev,
      [productoId]: cantidad
    }));
  };
  
  const transferirProductos = async () => {
    if (!origenId || !destinoId) {
      toast({
        title: "Error",
        description: "Selecciona origen y destino para la transferencia",
        variant: "destructive"
      });
      return;
    }
    
    if (origenId === destinoId) {
      toast({
        title: "Error",
        description: "El origen y destino no pueden ser iguales",
        variant: "destructive"
      });
      return;
    }
    
    const transferenciasValidas = Object.entries(transferencias)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([productoId, cantidad]) => ({
        productoId: parseInt(productoId),
        cantidad
      }));
    
    if (transferenciasValidas.length === 0) {
      toast({
        title: "Sin productos",
        description: "No hay productos seleccionados para transferir",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let exito = true;
      for (const { productoId, cantidad } of transferenciasValidas) {
        const resultado = await dbAPI.transferirProducto(
          productoId,
          cantidad,
          origenId,
          destinoId
        );
        
        if (!resultado) {
          exito = false;
          break;
        }
      }
      
      if (exito) {
        toast({
          title: "Transferencia exitosa",
          description: "Los productos han sido transferidos correctamente",
        });
        
        setTransferencias({});
        cargarInventarioSubalmacen(origenId);
      } else {
        toast({
          title: "Error",
          description: "Hubo un problema con algunas transferencias",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al transferir productos:", error);
      toast({
        title: "Error",
        description: "No se pudieron transferir los productos",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="flex items-center mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" className="mr-2 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold">Gestión de Subalmacenes</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editandoSubalmacen ? "Editar subalmacén" : "Nuevo subalmacén"}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={nuevoSubalmacen.nombre}
                onChange={handleSubalmacenChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={nuevoSubalmacen.direccion || ""}
                onChange={handleSubalmacenChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={nuevoSubalmacen.descripcion || ""}
                onChange={handleSubalmacenChange}
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button onClick={guardarSubalmacen}>
                <Save className="mr-2 h-4 w-4" />
                {editandoSubalmacen ? "Actualizar" : "Guardar"} subalmacén
              </Button>
              
              {editandoSubalmacen && (
                <Button variant="outline" onClick={resetSubalmacenForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Subalmacenes registrados</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="py-2 px-3 text-left">Nombre</th>
                  <th className="py-2 px-3 text-left">Dirección</th>
                  <th className="py-2 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subalmacenes.length > 0 ? (
                  subalmacenes.map(subalmacen => (
                    <tr key={subalmacen.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">{subalmacen.nombre}</td>
                      <td className="py-2 px-3">{subalmacen.direccion || '-'}</td>
                      <td className="py-2 px-3">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1"
                            onClick={() => seleccionarSubalmacenParaEditar(subalmacen)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 text-destructive hover:text-destructive"
                            onClick={() => subalmacen.id && eliminarSubalmacen(subalmacen.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      No hay subalmacenes registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Transferir Productos entre Subalmacenes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Origen</label>
            <select
              value={origenId || ""}
              onChange={(e) => setOrigenId(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Seleccionar subalmacén</option>
              {subalmacenes.map(subalmacen => (
                <option key={subalmacen.id} value={subalmacen.id}>
                  {subalmacen.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Destino</label>
            <select
              value={destinoId || ""}
              onChange={(e) => setDestinoId(Number(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Seleccionar subalmacén</option>
              {subalmacenes.map(subalmacen => (
                <option key={subalmacen.id} value={subalmacen.id}>
                  {subalmacen.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="py-2 px-3 text-left">Producto</th>
                <th className="py-2 px-3 text-right">Disponible</th>
                <th className="py-2 px-3 text-center">Cantidad a transferir</th>
              </tr>
            </thead>
            <tbody>
              {inventarioSubalmacen.length > 0 ? (
                inventarioSubalmacen.map(item => (
                  <tr key={item.productoId} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3">
                      <div>
                        <div className="font-medium">{item.nombre}</div>
                        <div className="text-sm text-muted-foreground">Código: {item.codigo}</div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">{item.stock}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const currentValue = transferencias[item.productoId] || 0;
                            if (currentValue > 0) {
                              handleTransferirChange(item.productoId, currentValue - 1);
                            }
                          }}
                          disabled={(transferencias[item.productoId] || 0) <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 min-w-[40px] text-center">
                          {transferencias[item.productoId] || 0}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const currentValue = transferencias[item.productoId] || 0;
                            if (currentValue < item.stock) {
                              handleTransferirChange(item.productoId, currentValue + 1);
                            }
                          }}
                          disabled={(transferencias[item.productoId] || 0) >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-muted-foreground">
                    {origenId ? "No hay productos en este subalmacén" : "Selecciona un subalmacén de origen"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={transferirProductos}
            disabled={!origenId || !destinoId || origenId === destinoId || Object.keys(transferencias).length === 0}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transferir productos
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Subalmacenes;
