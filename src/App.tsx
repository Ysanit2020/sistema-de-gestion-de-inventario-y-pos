
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navigation from "./components/ui-custom/Navigation";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import ProductoForm from "./pages/ProductoForm";
import Ventas from "./pages/Ventas";
import Reportes from "./pages/Reportes";
import Login from "./pages/Login";
import Configuracion from "./pages/Configuracion";
import Subalmacenes from "./pages/Subalmacenes";
import { inicializarDatos } from "./services/database";

const queryClient = new QueryClient();

// Componente para rutas protegidas
const ProtectedRoute = ({ element, adminOnly = false }: { element: JSX.Element, adminOnly?: boolean }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return element;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/inventario" element={<ProtectedRoute element={<Inventario />} adminOnly={true} />} />
      <Route path="/inventario/nuevo" element={<ProtectedRoute element={<ProductoForm />} adminOnly={true} />} />
      <Route path="/inventario/editar/:id" element={<ProtectedRoute element={<ProductoForm />} adminOnly={true} />} />
      <Route path="/ventas" element={<ProtectedRoute element={<Ventas />} />} />
      <Route path="/reportes" element={<ProtectedRoute element={<Reportes />} />} />
      <Route path="/configuracion" element={<ProtectedRoute element={<Configuracion />} />} />
      <Route path="/subalmacenes" element={<ProtectedRoute element={<Subalmacenes />} adminOnly={true} />} />
      <Route path="/landing" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Inicializar la base de datos con datos de ejemplo
    const init = async () => {
      console.log("Inicializando aplicación...");
      try {
        await inicializarDatos();
        setInitialized(true);
        console.log("Aplicación inicializada correctamente");
      } catch (error) {
        console.error("Error al inicializar la aplicación:", error);
      }
    };
    
    init();
  }, []);

  if (!initialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Cargando Sistema...</h2>
          <p className="text-muted-foreground">Inicializando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1">
                <AppRoutes />
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
