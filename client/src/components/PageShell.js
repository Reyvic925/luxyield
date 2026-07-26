import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function PageShell({ title, imageSrc, imageAlt, children }) {
  const { isDark } = useTheme();
  
  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)'
      }}
    >
      <div className="relative w-full h-64 md:h-80 overflow-hidden flex items-center justify-center">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={imageAlt || title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
          />
        )}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-accent drop-shadow-lg mb-2">{title}</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        {children}
      </div>
    </div>
  );
}

