
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-12 h-12 text-xl rounded-xl',
    lg: 'w-16 h-16 text-2xl rounded-2xl',
  };

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/20 ${sizeClasses[size]} ${className}`}>
      <i className="fas fa-check-double text-white"></i>
    </div>
  );
};
