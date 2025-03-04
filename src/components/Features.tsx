
import React, { useEffect, useRef } from 'react';
import Card from './ui-custom/Card';
import { cn } from '@/lib/utils';

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const Feature: React.FC<FeatureProps> = ({ title, description, icon, delay = 0 }) => {
  const featureRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const featureElement = featureRef.current;
    if (!featureElement) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('active');
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(featureElement);
    
    return () => {
      if (featureElement) observer.unobserve(featureElement);
    };
  }, [delay]);

  return (
    <div 
      ref={featureRef}
      className={cn(
        "reveal",
        "data-direction=up"
      )}
    >
      <Card variant="glass" className="p-6 h-full">
        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-medium mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </Card>
    </div>
  );
};

const Features: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(sectionElement);
    
    return () => {
      if (sectionElement) observer.unobserve(sectionElement);
    };
  }, []);

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-6">
        <div 
          ref={sectionRef}
          className="reveal data-direction=up text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Designed for Excellence
          </h2>
          <p className="text-lg text-muted-foreground">
            Our approach combines beauty and functionality, creating an experience
            that is both intuitive and delightful.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Feature 
            title="Minimalist Design"
            description="Clean, focused interfaces that eliminate clutter and help users focus on what matters."
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 9h6" /><path d="M9 15h6" /></svg>}
            delay={0}
          />
          <Feature 
            title="Thoughtful Details"
            description="Careful attention to every aspect of the design, creating a polished and refined experience."
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10" /><path d="M9 4v16" /><path d="M12 9l-3 3 3 3" /><path d="M22 12h-3" /><path d="M19 19v-1" /><path d="M19 6v-1" /></svg>}
            delay={100}
          />
          <Feature 
            title="Intuitive Experience"
            description="User interfaces that feel natural and easy to use, requiring minimal learning."
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2" /><path d="M8.5 2h7" /><path d="M14.5 16h-5" /></svg>}
            delay={200}
          />
          <Feature 
            title="Responsive Design"
            description="Seamlessly adapts to any screen size or device, maintaining both beauty and functionality."
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="3" rx="2" /><path d="M7 21h10" /><path d="M12 17v4" /></svg>}
            delay={300}
          />
          <Feature 
            title="Fluid Animations"
            description="Subtle, purposeful animations that enhance the user experience without being distracting."
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3a2 2 0 0 0-2 2" /><path d="M19 3a2 2 0 0 1 2 2" /><path d="M21 19a2 2 0 0 1-2 2" /><path d="M5 21a2 2 0 0 1-2-2" /><path d="M9 3h1" /><path d="M9 21h1" /><path d="M14 3h1" /><path d="M14 21h1" /><path d="M3 9v1" /><path d="M21 9v1" /><path d="M3 14v1" /><path d="M21 14v1" /></svg>}
            delay={400}
          />
          <Feature 
            title="Premium Experience"
            description="Every interaction is crafted to create a feeling of quality and attention to detail."
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>}
            delay={500}
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
