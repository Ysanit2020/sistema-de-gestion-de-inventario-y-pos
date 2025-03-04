
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const About: React.FC = () => {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const elements = [leftRef.current, rightRef.current];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    elements.forEach(el => {
      if (el) observer.observe(el);
    });
    
    return () => {
      elements.forEach(el => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <section id="about" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div 
            ref={leftRef}
            className={cn(
              "reveal",
              "data-direction=left"
            )}
          >
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-muted to-background rounded-2xl overflow-hidden shadow-lg">
                {/* Placeholder for about image */}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="p-8 text-center">
                    <h3 className="text-xl font-medium mb-2">Our Philosophy</h3>
                    <p className="text-muted-foreground">A visual representation of our approach</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-36 h-36 rounded-2xl bg-primary/10 -z-10"></div>
            </div>
          </div>
          
          <div 
            ref={rightRef}
            className={cn(
              "reveal",
              "data-direction=right"
            )}
          >
            <span className="inline-block px-4 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
              About
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Design that elevates the experience
            </h2>
            <p className="text-muted-foreground mb-6">
              We believe that truly great design is born from a deep understanding of the user and their needs. Every element we create is purposeful, stripped of unnecessary complexity, and focused on delivering a seamless experience.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-base font-medium">Simplicity and Clarity</h4>
                  <p className="text-sm text-muted-foreground">
                    We remove everything that doesn't serve a purpose, creating interfaces that are intuitive and focused.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-base font-medium">Thoughtful Interaction</h4>
                  <p className="text-sm text-muted-foreground">
                    Every interaction is designed to feel natural and responsive, enhancing the user's connection to the interface.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-base font-medium">Attention to Detail</h4>
                  <p className="text-sm text-muted-foreground">
                    We obsess over the small details that together create a cohesive, polished experience that feels premium.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
