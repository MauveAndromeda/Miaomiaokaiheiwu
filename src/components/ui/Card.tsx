'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'glass' | 'gradient' | 'premium' | 'elevated' | 'outline' | 'glow';
  hover?: 'none' | 'lift' | 'glow' | 'scale' | 'border';
  rounded?: 'default' | 'lg' | 'xl' | '2xl' | '3xl';
  animate?: boolean;
}

export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
  variant = 'default',
  hover = 'none',
  rounded = 'xl',
  animate = false,
}: CardProps) {
  const paddings = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
    xl: 'p-6',
  };

  const variants = {
    default: 'bg-surface border border-border',
    glass: 'glass',
    gradient: 'glass-card',
    premium: 'card-premium',
    elevated: 'bg-surface shadow-elevated',
    outline: 'bg-transparent border border-border-light',
    glow: 'bg-surface shadow-glow border border-primary/20',
  };

  const hovers = {
    none: '',
    lift: 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
    glow: 'hover:shadow-glow transition-all duration-300',
    scale: 'hover:scale-[1.02] transition-transform duration-300',
    border: 'hover:border-primary/50 transition-colors duration-300',
  };

  const roundedStyles = {
    default: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
    '3xl': 'rounded-[2rem]',
  };

  return (
    <div
      className={`
        ${variants[variant]}
        ${paddings[padding]}
        ${roundedStyles[rounded]}
        ${onClick ? 'cursor-pointer tap-effect' : ''}
        ${hovers[hover]}
        ${animate ? 'animate-scale-in' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// 功能卡片 - 带图标和标题
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  variant?: 'default' | 'gradient' | 'glass';
  iconColor?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  onClick,
  variant = 'default',
  iconColor = 'text-primary',
}: FeatureCardProps) {
  const variants = {
    default: 'bg-surface border border-border',
    gradient: 'bg-gradient-to-br from-surface to-surface-light border border-border',
    glass: 'glass',
  };

  return (
    <div
      className={`
        ${variants[variant]}
        p-4 rounded-2xl
        ${onClick ? 'cursor-pointer tap-effect hover:-translate-y-0.5 hover:shadow-lg' : ''}
        transition-all duration-300
      `}
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center mb-3`}>
        <span className={`text-2xl ${iconColor}`}>{icon}</span>
      </div>
      <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary line-clamp-2">{description}</p>
      )}
    </div>
  );
}

// 统计卡片
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  variant?: 'default' | 'gradient';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className={`
      p-4 rounded-2xl
      ${variant === 'gradient'
        ? 'bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 border border-primary/20'
        : 'bg-surface border border-border'}
    `}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-text-secondary text-sm">{label}</span>
        {icon && <span className="text-primary text-lg">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-text-primary tabular-nums">{value}</span>
        {trend && (
          <span className={`text-sm font-medium ${trend.isUp ? 'text-success' : 'text-error'}`}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

// 骨架屏卡片
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface rounded-2xl p-4 border border-border ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1">
          <div className="h-4 w-24 skeleton rounded-lg mb-2" />
          <div className="h-3 w-16 skeleton rounded-lg" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full skeleton rounded-lg" />
        <div className="h-3 w-3/4 skeleton rounded-lg" />
      </div>
    </div>
  );
}

// 横向滚动卡片列表
interface HorizontalCardListProps {
  children: React.ReactNode;
  title?: string;
  showMore?: () => void;
  className?: string;
}

export function HorizontalCardList({
  children,
  title,
  showMore,
  className = '',
}: HorizontalCardListProps) {
  return (
    <div className={className}>
      {(title || showMore) && (
        <div className="flex items-center justify-between px-4 mb-3">
          {title && <h2 className="text-lg font-bold text-text-primary">{title}</h2>}
          {showMore && (
            <button
              className="text-sm text-primary font-medium hover:text-primary-light transition-colors"
              onClick={showMore}
            >
              查看更多
            </button>
          )}
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
        {children}
      </div>
    </div>
  );
}

// 信息展示卡片
interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subValue?: string;
  onClick?: () => void;
}

export function InfoCard({ icon, label, value, subValue, onClick }: InfoCardProps) {
  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-2xl
        bg-surface border border-border
        ${onClick ? 'cursor-pointer tap-effect hover:border-primary/30' : ''}
        transition-all duration-200
      `}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
        <span className="text-primary">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary mb-0.5">{label}</p>
        <p className="font-semibold text-text-primary truncate">{value}</p>
        {subValue && <p className="text-xs text-text-muted">{subValue}</p>}
      </div>
    </div>
  );
}
