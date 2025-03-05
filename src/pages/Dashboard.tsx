
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui-custom/Card";
import Button from "@/components/ui-custom/Button";
import { ShoppingCart, Package, BarChart3, Settings, Warehouse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { dbAPI } from "@/services/database-electron";

const Dashboard = () => {
  const { isAdmin, currentUser, subalmacenId } = useAuth();
  const [theme, setTheme] = useState("light");
  
  useEffect(() => {
    const cargarTema = async () => {
      try {
        const temaGuardado = await dbAPI.getTheme();
        setTheme(temaGuardado);
        
        if (temaGuardado === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (error) {
        console.error("Error al cargar tema:", error);
      }
    };
    
    cargarTema();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Bienvenido, {currentUser?.nombre || currentUser?.usuario}</h1>
        <p className="text-muted-foreground">Sistema de Gestión de Inventario y Punto de Ventas</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/ventas" className="block">
          <Card variant="glass" hover className="p-6 h-full">
            <div className="flex flex-col items-center text-center">
              <ShoppingCart size={48} className="text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">Punto de Ventas</h2>
              <p className="text-muted-foreground mb-4">Registrar ventas y emitir facturas</p>
              <Button variant="primary" className="mt-auto">
                Acceder
              </Button>
            </div>
          </Card>
        </Link>

        {isAdmin && (
          <Link to="/inventario" className="block">
            <Card variant="glass" hover className="p-6 h-full">
              <div className="flex flex-col items-center text-center">
                <Package size={48} className="text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Inventario</h2>
                <p className="text-muted-foreground mb-4">Gestionar productos y existencias</p>
                <Button variant="primary" className="mt-auto">
                  Acceder
                </Button>
              </div>
            </Card>
          </Link>
        )}

        <Link to="/reportes" className="block">
          <Card variant="glass" hover className="p-6 h-full">
            <div className="flex flex-col items-center text-center">
              <BarChart3 size={48} className="text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">Reportes</h2>
              <p className="text-muted-foreground mb-4">Analizar ventas e inventario</p>
              <Button variant="primary" className="mt-auto">
                Acceder
              </Button>
            </div>
          </Card>
        </Link>

        {isAdmin && (
          <Link to="/subalmacenes" className="block">
            <Card variant="glass" hover className="p-6 h-full">
              <div className="flex flex-col items-center text-center">
                <Warehouse size={48} className="text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Subalmacenes</h2>
                <p className="text-muted-foreground mb-4">Gestionar subalmacenes y transferencias</p>
                <Button variant="primary" className="mt-auto">
                  Acceder
                </Button>
              </div>
            </Card>
          </Link>
        )}

        <Link to="/configuracion" className="block">
          <Card variant="glass" hover className="p-6 h-full">
            <div className="flex flex-col items-center text-center">
              <Settings size={48} className="text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">Configuración</h2>
              <p className="text-muted-foreground mb-4">Ajustes del sistema{isAdmin ? " y usuarios" : ""}</p>
              <Button variant="primary" className="mt-auto">
                Acceder
              </Button>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
