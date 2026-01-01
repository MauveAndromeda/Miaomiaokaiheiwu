'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent' | 'vip' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  icon,
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-error/20 text-error',
    accent: 'bg-accent/20 text-accent',
    vip: 'vip-gradient text-white',
    outline: 'border border-border text-text-secondary',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {icon}
      {children}
    </span>
  );
}

// 数字角标
interface CountBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function CountBadge({
  count,
  maxCount = 99,
  size = 'sm',
  dot = false,
}: CountBadgeProps) {
  if (count === 0) return null;

  if (dot) {
    return (
      <span className="w-2 h-2 bg-error rounded-full" />
    );
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  const sizes = {
    sm: 'min-w-[18px] h-[18px] text-[10px] px-1',
    md: 'min-w-[22px] h-[22px] text-xs px-1.5',
  };

  return (
    <span
      className={`
        ${sizes[size]} bg-error text-white rounded-full
        flex items-center justify-center font-bold
      `}
    >
      {displayCount}
    </span>
  );
}

// 标签组
interface TagProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function Tag({ children, selected = false, onClick, icon }: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm
        transition-colors duration-150
        ${selected
          ? 'bg-primary text-white'
          : 'bg-surface-light text-text-secondary'
        }
        ${onClick ? 'cursor-pointer tap-effect' : ''}
      `}
      onClick={onClick}
    >
      {icon}
      {children}
    </span>
  );
}
