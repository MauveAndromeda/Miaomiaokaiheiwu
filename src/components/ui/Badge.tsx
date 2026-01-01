'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent' | 'vip' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  glow?: boolean;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  icon,
  glow = false,
  pulse = false,
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary/20 text-primary-light border border-primary/30',
    secondary: 'bg-secondary/20 text-purple-300 border border-secondary/30',
    success: 'bg-success/20 text-success-light border border-success/30',
    warning: 'bg-warning/20 text-amber-300 border border-warning/30',
    error: 'bg-error/20 text-red-300 border border-error/30',
    accent: 'bg-accent/20 text-pink-300 border border-accent/30',
    vip: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-none shadow-lg shadow-amber-500/30',
    outline: 'border border-border text-text-secondary bg-transparent',
    gradient: 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary-light border border-primary/30',
  };

  const glowStyles = {
    primary: 'shadow-lg shadow-primary/30',
    secondary: 'shadow-lg shadow-secondary/30',
    success: 'shadow-lg shadow-success/30',
    warning: 'shadow-lg shadow-warning/30',
    error: 'shadow-lg shadow-error/30',
    accent: 'shadow-lg shadow-accent/30',
    vip: 'shadow-xl shadow-amber-500/40',
    outline: '',
    gradient: 'shadow-lg shadow-primary/25',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${glow ? glowStyles[variant] : ''}
        ${pulse ? 'animate-pulse' : ''}
        transition-all duration-200
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// 数字角标
interface CountBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  variant?: 'error' | 'primary' | 'success';
}

export function CountBadge({
  count,
  maxCount = 99,
  size = 'sm',
  dot = false,
  variant = 'error',
}: CountBadgeProps) {
  if (count === 0 && !dot) return null;

  const variants = {
    error: 'bg-gradient-to-br from-error to-red-600 shadow-error/40',
    primary: 'bg-gradient-to-br from-primary to-primary-dark shadow-primary/40',
    success: 'bg-gradient-to-br from-success to-emerald-600 shadow-success/40',
  };

  if (dot) {
    return (
      <span className={`w-2.5 h-2.5 ${variants[variant]} rounded-full shadow-lg animate-pulse`} />
    );
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  const sizes = {
    xs: 'min-w-[16px] h-[16px] text-[9px] px-1',
    sm: 'min-w-[18px] h-[18px] text-[10px] px-1',
    md: 'min-w-[22px] h-[22px] text-xs px-1.5',
  };

  return (
    <span
      className={`
        ${sizes[size]} ${variants[variant]} text-white rounded-full
        flex items-center justify-center font-bold
        shadow-lg animate-bounce-in
      `}
    >
      {displayCount}
    </span>
  );
}

// 状态标签
interface StatusBadgeProps {
  status: 'online' | 'busy' | 'away' | 'offline';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showLabel = true, size = 'sm' }: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-success', label: '在线', textColor: 'text-success' },
    busy: { color: 'bg-error', label: '忙碌', textColor: 'text-error' },
    away: { color: 'bg-warning', label: '离开', textColor: 'text-warning' },
    offline: { color: 'bg-text-muted', label: '离线', textColor: 'text-text-muted' },
  };

  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} ${config.color} rounded-full ${status === 'online' ? 'animate-pulse shadow-lg shadow-success/50' : ''}`} />
      {showLabel && (
        <span className={`${textSize} ${config.textColor} font-medium`}>{config.label}</span>
      )}
    </span>
  );
}

// 标签组
interface TagProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'pill' | 'rounded';
}

export function Tag({ children, selected = false, onClick, icon, variant = 'default' }: TagProps) {
  const variants = {
    default: 'rounded-lg',
    pill: 'rounded-full',
    rounded: 'rounded-xl',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
        transition-all duration-300 ${variants[variant]}
        ${selected
          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25'
          : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/30'
        }
        ${onClick ? 'cursor-pointer tap-effect hover:-translate-y-0.5' : ''}
      `}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// VIP徽章
interface VIPBadgeProps {
  level?: 1 | 2 | 3 | 4 | 5;
  size?: 'sm' | 'md' | 'lg';
}

export function VIPBadge({ level = 1, size = 'sm' }: VIPBadgeProps) {
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`
      inline-flex items-center gap-1 ${sizes[size]}
      bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500
      text-amber-900 font-bold rounded-full
      shadow-lg shadow-amber-500/40
      border border-amber-300/50
    `}>
      <span className="text-amber-700">👑</span>
      VIP{level}
    </span>
  );
}

// 认证徽章
interface VerifiedBadgeProps {
  type?: 'official' | 'pro' | 'goddess' | 'master';
  size?: 'sm' | 'md';
}

export function VerifiedBadge({ type = 'official', size = 'sm' }: VerifiedBadgeProps) {
  const types = {
    official: { label: '官方认证', gradient: 'from-primary to-secondary', icon: '✓' },
    pro: { label: '大神', gradient: 'from-amber-500 to-orange-500', icon: '🏆' },
    goddess: { label: '女神', gradient: 'from-pink-500 to-rose-500', icon: '👑' },
    master: { label: '王者', gradient: 'from-purple-500 to-violet-500', icon: '⭐' },
  };

  const config = types[type];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`
      inline-flex items-center gap-1 ${sizeStyles}
      bg-gradient-to-r ${config.gradient}
      text-white font-bold rounded-full
      shadow-lg
    `}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
