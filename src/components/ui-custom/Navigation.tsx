
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Package, BarChart3, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!currentUser) return null;

  return (
    <div className="bg-background shadow-md">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold mr-8">Sistema de Gestión</h1>
            <nav className="flex space-x-1">
              <Link
                to="/ventas"
                className={`px-3 py-2 rounded-md flex items-center ${
                  isActive("/ventas") 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>Ventas</span>
              </Link>
              
              {isAdmin && (
                <Link
                  to="/inventario"
                  className={`px-3 py-2 rounded-md flex items-center ${
                    isActive("/inventario") 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Package className="mr-2 h-4 w-4" />
                  <span>Inventario</span>
                </Link>
              )}
              
              <Link
                to="/reportes"
                className={`px-3 py-2 rounded-md flex items-center ${
                  isActive("/reportes") 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                }`}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>Reportes</span>
              </Link>
              
              {isAdmin && (
                <Link
                  to="/configuracion"
                  className={`px-3 py-2 rounded-md flex items-center ${
                    isActive("/configuracion") 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4" />
              <span className="mr-1">{currentUser.nombre || currentUser.usuario}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {currentUser.rol === "admin" ? "Admin" : "Vendedor"}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-muted"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
