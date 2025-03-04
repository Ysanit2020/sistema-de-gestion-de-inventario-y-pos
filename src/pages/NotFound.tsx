
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Button from "@/components/ui-custom/Button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center">
        <span className="inline-block px-4 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
          404 Error
        </span>
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">Page not found</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button size="lg">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
