'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
  gradient = false,
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        bg-surface rounded-xl
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer tap-effect' : ''}
        ${gradient ? 'gradient-border' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// 骨架屏卡片
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1">
          <div className="h-4 w-24 skeleton rounded mb-2" />
          <div className="h-3 w-16 skeleton rounded" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full skeleton rounded" />
        <div className="h-3 w-3/4 skeleton rounded" />
      </div>
    </div>
  );
}
