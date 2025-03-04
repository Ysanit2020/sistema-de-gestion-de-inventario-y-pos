
import React, { useEffect, useRef } from 'react';
import Button from './ui-custom/Button';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(heroElement);
    
    return () => {
      if (heroElement) observer.unobserve(heroElement);
    };
  }, []);

  return (
    <section 
      ref={heroRef}
      className="min-h-screen flex items-center justify-center pt-20 opacity-0 transition-opacity duration-1000"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-block mb-6 animate-slide-down">
            <span className="inline-flex items-center rounded-full px-4 py-1 text-xs font-medium bg-primary/10 text-primary">
              Beautifully Designed
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 animate-slide-down" style={{ animationDelay: '100ms' }}>
            Crafted with Precision <br /> and 
            <span className="text-primary"> Purpose</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-down" style={{ animationDelay: '200ms' }}>
            A minimal and elegant design approach inspired by the principles of 
            great design — where form follows function and every detail serves a purpose.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-down" style={{ animationDelay: '300ms' }}>
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
          
          <div className="w-full max-w-5xl mt-16 relative animate-slide-down" style={{ animationDelay: '400ms' }}>
            <div className="aspect-video bg-gradient-to-tr from-primary/5 to-secondary rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
              {/* Placeholder for hero image */}
              <div className="glass-effect p-8 rounded-xl text-center">
                <h3 className="text-xl font-medium mb-2">Interface Preview</h3>
                <p className="text-muted-foreground">Elegant and intuitive design</p>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute -bottom-4 -left-8 w-16 h-16 rounded-full bg-secondary animate-float" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
