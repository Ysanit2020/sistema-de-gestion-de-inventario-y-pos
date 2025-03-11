
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui-custom/Button";
import Card from "@/components/ui-custom/Card";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("Por favor complete todos los campos");
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold mb-2 text-foreground">Sistema de Gestión</h1>
          <p className="text-muted-foreground">Inventario y Punto de Ventas</p>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground" htmlFor="username">
                Usuario
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground" htmlFor="password">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
                autoComplete="current-password"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Iniciar Sesión
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
