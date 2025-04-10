
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { UsuarioInterface, dbAPI } from "@/services/database-electron";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: UsuarioInterface | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  subalmacenId: number | undefined;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UsuarioInterface | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Verificar si hay una sesión guardada en localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoading(false);
  }, []);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Buscar usuario en la base de datos
      const user = await dbAPI.login(username, password);
      
      if (user) {
        console.log("Usuario autenticado:", user);
        setCurrentUser(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
        
        toast({
          title: "Bienvenido",
          description: `Sesión iniciada como ${user.nombre || user.usuario}`,
        });
        
        return true;
      } else {
        toast({
          title: "Error de acceso",
          description: "Usuario o contraseña incorrectos",
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al intentar iniciar sesión",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };
  
  const refreshUser = async () => {
    if (currentUser?.id) {
      try {
        const usuarios = await dbAPI.getUsuarios();
        const updatedUser = usuarios.find(u => u.id === currentUser.id);
        if (updatedUser) {
          console.log("Usuario actualizado:", updatedUser);
          setCurrentUser(updatedUser);
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error("Error al actualizar información del usuario:", error);
      }
    }
  };
  
  // Asegurar que subalmacenId es un número o undefined, nunca null
  // Para que los administradores puedan usar el punto de venta, asignarles el primer subalmacén
  const getSubalmacenId = () => {
    // Si el usuario es administrador y no tiene un subalmacén asignado, pero necesita acceder a funciones de venta,
    // le asignamos por defecto el subalmacén principal (id 1)
    if (currentUser?.rol === "admin" && !currentUser?.subalmacenId) {
      return 1; // Almacén principal por defecto para administradores
    }
    
    if (currentUser?.subalmacenId !== null && currentUser?.subalmacenId !== undefined) {
      return Number(currentUser.subalmacenId);
    }
    
    return undefined;
  };
  
  const subalmacenId = getSubalmacenId();
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        login,
        logout,
        isAdmin: currentUser?.rol === "admin",
        subalmacenId,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
