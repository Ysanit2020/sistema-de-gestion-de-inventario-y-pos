
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { db, UsuarioInterface } from "@/services/database";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: UsuarioInterface | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
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
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);
  
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Buscar usuario en la base de datos
      const user = await db.usuarios
        .where("usuario")
        .equals(username)
        .first();
      
      if (user && user.password === password) {
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
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        login,
        logout,
        isAdmin: currentUser?.rol === "admin"
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
