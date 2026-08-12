// src/app/components/ui/Card.tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cardUtils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md'
}: CardProps) {
  const variantClasses = {
    default: 'bg-gray-800/50 border border-gray-700',
    dark: 'bg-gray-900 border border-gray-800',
    glass: 'bg-gray-800/30 backdrop-blur-sm border border-gray-700/50',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={cn(
      'rounded-xl shadow-lg',
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}