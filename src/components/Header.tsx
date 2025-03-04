
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Button from './ui-custom/Button';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "glass-effect py-3" : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </span>
          <span className="font-display font-semibold text-xl">Minimal</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About</a>
          <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">Contact</a>
          <Button size="sm">Get Started</Button>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <span className={cn(
              "w-full h-0.5 bg-foreground rounded-full transition-transform duration-300",
              mobileMenuOpen && "translate-y-2 rotate-45"
            )}></span>
            <span className={cn(
              "w-full h-0.5 bg-foreground rounded-full transition-opacity duration-300",
              mobileMenuOpen && "opacity-0"
            )}></span>
            <span className={cn(
              "w-full h-0.5 bg-foreground rounded-full transition-transform duration-300",
              mobileMenuOpen && "-translate-y-2 -rotate-45"
            )}></span>
          </div>
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden fixed inset-0 z-40 bg-background transition-transform duration-300 ease-in-out transform pt-24",
        mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      )}>
        <nav className="container mx-auto px-6 flex flex-col items-center gap-6 py-10">
          <a href="#features" 
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a href="#about" 
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </a>
          <a href="#contact" 
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </a>
          <Button onClick={() => setMobileMenuOpen(false)}>Get Started</Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
