'use client';

import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  gender?: 'male' | 'female' | 'unknown';
  badge?: React.ReactNode;
  onClick?: () => void;
}

export function Avatar({
  src,
  name = '',
  size = 'md',
  isOnline,
  gender,
  badge,
  onClick,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const onlineSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  // 生成默认头像 emoji
  const getDefaultAvatar = () => {
    if (gender === 'female') return '👩';
    if (gender === 'male') return '👨';
    return name ? name.charAt(0).toUpperCase() : '👤';
  };

  // 生成随机渐变色
  const getGradient = () => {
    const gradients = [
      'from-pink-500 to-rose-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-amber-500',
      'from-red-500 to-pink-500',
    ];
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  return (
    <div
      className={`relative inline-block ${onClick ? 'cursor-pointer tap-effect' : ''}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover border-2 border-surface-light`}
        />
      ) : (
        <div
          className={`
            ${sizes[size]} rounded-full
            bg-gradient-to-br ${getGradient()}
            flex items-center justify-center text-white font-bold
            border-2 border-surface-light
          `}
        >
          {getDefaultAvatar()}
        </div>
      )}

      {/* 在线状态 */}
      {isOnline !== undefined && (
        <span
          className={`
            absolute bottom-0 right-0 ${onlineSizes[size]} rounded-full
            border-2 border-surface
            ${isOnline ? 'bg-success animate-pulse-online' : 'bg-text-secondary'}
          `}
        />
      )}

      {/* 角标 */}
      {badge && (
        <span className="absolute -top-1 -right-1">
          {badge}
        </span>
      )}
    </div>
  );
}

// 头像组
interface AvatarGroupProps {
  avatars: { src?: string; name?: string }[];
  max?: number;
  size?: 'sm' | 'md';
}

export function AvatarGroup({ avatars, max = 3, size = 'sm' }: AvatarGroupProps) {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayed.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm'}
            rounded-full bg-surface-light border-2 border-surface
            flex items-center justify-center text-text-secondary font-medium
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
