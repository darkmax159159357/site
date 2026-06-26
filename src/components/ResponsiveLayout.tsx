"use client";
import React, { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 mx-auto max-w-7xl ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveLayout; 