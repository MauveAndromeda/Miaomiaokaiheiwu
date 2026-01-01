'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'glass' | 'glow';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rounded?: 'default' | 'full' | 'none';
  pulse?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  rounded = 'default',
  pulse = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center font-semibold
    transition-all duration-300 ease-out
    tap-effect relative overflow-hidden
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-primary to-primary-dark
      text-white shadow-lg shadow-primary/25
      hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5
      active:translate-y-0 active:shadow-md
      focus:ring-primary/50
      disabled:opacity-50 disabled:shadow-none disabled:translate-y-0
    `,
    secondary: `
      bg-gradient-to-r from-secondary to-purple-600
      text-white shadow-lg shadow-secondary/25
      hover:shadow-xl hover:shadow-secondary/35 hover:-translate-y-0.5
      active:translate-y-0 active:shadow-md
      focus:ring-secondary/50
      disabled:opacity-50 disabled:shadow-none
    `,
    gradient: `
      bg-gradient-to-r from-primary via-secondary to-accent
      text-white shadow-lg
      hover:shadow-xl hover:-translate-y-0.5 hover:saturate-110
      active:translate-y-0 active:shadow-md
      focus:ring-primary/50
      disabled:opacity-50
      animate-gradient bg-[length:200%_200%]
    `,
    glow: `
      bg-gradient-to-r from-primary to-secondary
      text-white
      shadow-[0_0_20px_rgba(99,102,241,0.5),0_0_40px_rgba(139,92,246,0.3)]
      hover:shadow-[0_0_30px_rgba(99,102,241,0.6),0_0_60px_rgba(139,92,246,0.4)]
      hover:-translate-y-0.5
      active:translate-y-0
      focus:ring-primary/50
      disabled:opacity-50 disabled:shadow-none
    `,
    glass: `
      bg-white/10 backdrop-blur-xl
      text-white border border-white/20
      shadow-lg shadow-black/10
      hover:bg-white/15 hover:border-white/30 hover:-translate-y-0.5
      active:translate-y-0 active:bg-white/20
      focus:ring-white/30
      disabled:opacity-50
    `,
    outline: `
      border-2 border-primary/60 text-primary
      bg-transparent
      hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5
      active:bg-primary/20 active:translate-y-0
      focus:ring-primary/50
      disabled:opacity-50 disabled:border-primary/30
    `,
    ghost: `
      text-text-secondary bg-transparent
      hover:text-text-primary hover:bg-white/5
      active:bg-white/10
      focus:ring-white/20
      disabled:opacity-50
    `,
    danger: `
      bg-gradient-to-r from-error to-red-600
      text-white shadow-lg shadow-error/25
      hover:shadow-xl hover:shadow-error/35 hover:-translate-y-0.5
      active:translate-y-0 active:shadow-md
      focus:ring-error/50
      disabled:opacity-50 disabled:shadow-none
    `,
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs min-h-[28px] gap-1',
    sm: 'px-3.5 py-1.5 text-sm min-h-[36px] gap-1.5',
    md: 'px-5 py-2.5 text-base min-h-[44px] gap-2',
    lg: 'px-7 py-3 text-lg min-h-[52px] gap-2.5',
    xl: 'px-8 py-4 text-xl min-h-[60px] gap-3',
  };

  const roundedStyles = {
    none: 'rounded-none',
    default: 'rounded-xl',
    full: 'rounded-full',
  };

  const LoadingSpinner = () => (
    <span className="relative">
      <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin block" />
    </span>
  );

  const iconElement = icon && (
    <span className={`flex-shrink-0 ${size === 'xs' ? 'text-sm' : size === 'sm' ? 'text-base' : 'text-lg'}`}>
      {icon}
    </span>
  );

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${roundedStyles[rounded]}
        ${fullWidth ? 'w-full' : ''}
        ${loading || disabled ? 'pointer-events-none' : ''}
        ${pulse ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect overlay */}
      {(variant === 'primary' || variant === 'gradient' || variant === 'glow') && !disabled && (
        <span className="absolute inset-0 overflow-hidden rounded-inherit">
          <span className="absolute inset-0 -translate-x-full animate-shimmer-once bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </span>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : iconPosition === 'left' && iconElement ? (
        iconElement
      ) : null}

      <span className="relative">{children}</span>

      {!loading && iconPosition === 'right' && iconElement}
    </button>
  );
}

// Icon Button - 圆形图标按钮
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  badge?: number | string;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  badge,
  className = '',
  ...props
}: IconButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40',
    secondary: 'bg-gradient-to-br from-secondary to-purple-600 text-white shadow-lg shadow-secondary/30',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5 active:bg-white/10',
    glass: 'bg-white/10 backdrop-blur-xl text-white border border-white/20 hover:bg-white/15',
    glow: 'bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]',
  };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <button
      className={`
        relative inline-flex items-center justify-center
        rounded-full transition-all duration-300
        tap-effect focus:outline-none focus:ring-2 focus:ring-primary/50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-error text-white text-xs font-bold rounded-full shadow-lg">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// Floating Action Button
interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'gradient' | 'glass';
}

export function FAB({
  icon,
  label,
  variant = 'gradient',
  className = '',
  ...props
}: FABProps) {
  const variants = {
    primary: 'bg-gradient-to-br from-primary to-primary-dark shadow-xl shadow-primary/40',
    gradient: 'bg-gradient-to-br from-primary via-secondary to-accent shadow-xl shadow-primary/30',
    glass: 'bg-white/15 backdrop-blur-xl border border-white/20 shadow-xl',
  };

  return (
    <button
      className={`
        fixed bottom-24 right-4 z-40
        inline-flex items-center justify-center gap-2
        text-white font-semibold
        rounded-full transition-all duration-300
        tap-effect hover:-translate-y-1 hover:shadow-2xl
        focus:outline-none focus:ring-2 focus:ring-primary/50
        ${label ? 'px-5 h-14' : 'w-14 h-14'}
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      <span className="text-xl">{icon}</span>
      {label && <span>{label}</span>}
    </button>
  );
}
