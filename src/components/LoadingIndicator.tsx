import React from 'react';

type LoadingIndicatorProps = {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
};

const LoadingIndicator = ({ 
  size = 'medium', 
  color = 'text-blue-500',
  className = ''
}: LoadingIndicatorProps) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizeClasses[size]} ${color} border-t-transparent border-solid rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingIndicator; 