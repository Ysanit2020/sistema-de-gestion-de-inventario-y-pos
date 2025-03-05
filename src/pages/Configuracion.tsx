
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Moon, Sun, Save, Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { dbAPI, UsuarioInterface, SubalmacenInterface } from "@/services/database-electron";

const Configuracion = () => {
  const { isAdmin, currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState<string>("light");
  
  // Estados para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Estados para gestión de usuarios
  const [usuarios, setUsuarios] = useState<UsuarioInterface[]>([]);
  const [subalmacenes, setSubalmacenes] = useState<SubalmacenInterface[]>([]);
  const [nuevoUsuario, setNuevoUsuario] = useState<UsuarioInterface>({
    usuario: "",
    password: "",
    rol: "trabajador",
    nombre: ""
  });
  const [editandoUsuario, setEditandoUsuario] = useState<boolean>(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  
  useEffect(() => {
    if (!isAdmin && !currentUser) {
      navigate("/dashboard");
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta sección",
        variant: "destructive"
      });
      return;
    }
    
    cargarDatos();
  }, [isAdmin, navigate, toast, currentUser]);
  
  const cargarDatos = async () => {
    try {
      // Cargar usuarios si es admin
      if (isAdmin) {
        const usuariosData = await dbAPI.getUsuarios();
        setUsuarios(usuariosData);
        
        const subalmacenesData = await dbAPI.getSubalmacenes();
        setSubalmacenes(subalmacenesData);
      }
      
      // Cargar tema actual
      const temaActual = await dbAPI.getTheme();
      setTheme(temaActual);
      aplicarTema(temaActual);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };
  
  const aplicarTema = (nuevoTema: string) => {
    if (nuevoTema === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  
  const cambiarTema = async () => {
    const nuevoTema = theme === "light" ? "dark" : "light";
    try {
      await dbAPI.saveTheme(nuevoTema);
      setTheme(nuevoTema);
      aplicarTema(nuevoTema);
      
      toast({
        title: "Tema actualizado",
        description: `El tema se ha cambiado a ${nuevoTema === "light" ? "claro" : "oscuro"}`,
      });
    } catch (error) {
      console.error("Error al cambiar tema:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el tema",
        variant: "destructive"
      });
    }
  };
  
  const cambiarPassword = async () => {
    if (!currentUser?.id) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const resultado = await dbAPI.changePassword(
        currentUser.id,
        passwordForm.oldPassword,
        passwordForm.newPassword
      );
      
      if (resultado) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada correctamente",
        });
        
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        
        // Actualizar usuario en contexto
        await refreshUser();
      } else {
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
        variant: "destructive"
      });
    }
  };
  
  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNuevoUsuario(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetUsuarioForm = () => {
    setNuevoUsuario({
      usuario: "",
      password: "",
      rol: "trabajador",
      nombre: ""
    });
    setEditandoUsuario(false);
    setUsuarioSeleccionado(null);
  };
  
  const seleccionarUsuarioParaEditar = (usuario: UsuarioInterface) => {
    setNuevoUsuario({
      ...usuario,
      password: "" // No enviamos la contraseña actual por seguridad
    });
    setEditandoUsuario(true);
    setUsuarioSeleccionado(usuario.id || null);
  };
  
  const guardarUsuario = async () => {
    if (!nuevoUsuario.usuario || (!editandoUsuario && !nuevoUsuario.password)) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const resultado = await dbAPI.saveUsuario({
        ...nuevoUsuario,
        id: editandoUsuario ? usuarioSeleccionado! : undefined
      });
      
      toast({
        title: "Usuario guardado",
        description: `Usuario ${editandoUsuario ? "actualizado" : "creado"} correctamente`,
      });
      
      resetUsuarioForm();
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el usuario",
        variant: "destructive"
      });
    }
  };
  
  const eliminarUsuario = async (id: number) => {
    try {
      await dbAPI.deleteUsuario(id);
      toast({
        title: "Usuario eliminado",
        description: "Usuario eliminado correctamente",
      });
      cargarDatos();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
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
        <h1 className="text-3xl font-display font-bold">Configuración</h1>
      </div>
      
      <Tabs defaultValue="tema">
        <TabsList className="mb-6">
          <TabsTrigger value="tema">Apariencia</TabsTrigger>
          <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
          {isAdmin && <TabsTrigger value="usuarios">Gestión de Usuarios</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="tema">
          <Card className="p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Tema de la aplicación</h2>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {theme === "light" ? (
                  <Sun className="h-6 w-6 mr-2" />
                ) : (
                  <Moon className="h-6 w-6 mr-2" />
                )}
                <span>Tema actual: {theme === "light" ? "Claro" : "Oscuro"}</span>
              </div>
              <Button onClick={cambiarTema}>
                Cambiar a tema {theme === "light" ? "oscuro" : "claro"}
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="password">
          <Card className="p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Cambiar contraseña</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordFormChange}
                    className="w-full p-2 border rounded-md pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                    className="w-full p-2 border rounded-md pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={cambiarPassword}
                  disabled={!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  Cambiar contraseña
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="usuarios">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {editandoUsuario ? "Editar usuario" : "Nuevo usuario"}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoUsuario.nombre || ""}
                      onChange={handleUsuarioChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Usuario *</label>
                    <input
                      type="text"
                      name="usuario"
                      value={nuevoUsuario.usuario}
                      onChange={handleUsuarioChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {editandoUsuario ? "Nueva contraseña (dejar en blanco para mantener)" : "Contraseña *"}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={nuevoUsuario.password}
                      onChange={handleUsuarioChange}
                      className="w-full p-2 border rounded-md"
                      required={!editandoUsuario}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol</label>
                    <select
                      name="rol"
                      value={nuevoUsuario.rol}
                      onChange={handleUsuarioChange}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="admin">Administrador</option>
                      <option value="trabajador">Vendedor</option>
                    </select>
                  </div>
                  
                  {nuevoUsuario.rol === "trabajador" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Subalmacén asignado</label>
                      <select
                        name="subalmacenId"
                        value={nuevoUsuario.subalmacenId || ""}
                        onChange={handleUsuarioChange}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">No asignado</option>
                        {subalmacenes.map(subalmacen => (
                          <option key={subalmacen.id} value={subalmacen.id}>
                            {subalmacen.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <Button onClick={guardarUsuario}>
                      <Save className="mr-2 h-4 w-4" />
                      {editandoUsuario ? "Actualizar" : "Guardar"} usuario
                    </Button>
                    
                    {editandoUsuario && (
                      <Button variant="outline" onClick={resetUsuarioForm}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Usuarios registrados</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="py-2 px-3 text-left">Nombre</th>
                        <th className="py-2 px-3 text-left">Usuario</th>
                        <th className="py-2 px-3 text-left">Rol</th>
                        <th className="py-2 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.length > 0 ? (
                        usuarios.map(usuario => (
                          <tr key={usuario.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3">{usuario.nombre || '-'}</td>
                            <td className="py-2 px-3">{usuario.usuario}</td>
                            <td className="py-2 px-3">
                              {usuario.rol === "admin" ? "Administrador" : "Vendedor"}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1"
                                  onClick={() => seleccionarUsuarioParaEditar(usuario)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1 text-destructive hover:text-destructive"
                                  onClick={() => usuario.id && eliminarUsuario(usuario.id)}
                                  disabled={usuario.id === currentUser?.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">
                            No hay usuarios registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Configuracion;
