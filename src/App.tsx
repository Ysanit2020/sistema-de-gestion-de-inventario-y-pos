
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import ProductoForm from "./pages/ProductoForm";
import Ventas from "./pages/Ventas";
import Reportes from "./pages/Reportes";
import { inicializarDatos } from "./services/database";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Inicializar la base de datos con datos de ejemplo
    inicializarDatos();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/inventario/nuevo" element={<ProductoForm />} />
            <Route path="/inventario/editar/:id" element={<ProductoForm />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/landing" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
