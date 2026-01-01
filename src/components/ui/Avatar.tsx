'use client';

import React from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  isOnline?: boolean;
  gender?: 'male' | 'female' | 'unknown';
  badge?: React.ReactNode;
  ring?: 'none' | 'primary' | 'gradient' | 'gold' | 'online';
  verified?: boolean;
  onClick?: () => void;
}

export function Avatar({
  src,
  name = '',
  size = 'md',
  isOnline,
  gender,
  badge,
  ring = 'none',
  verified = false,
  onClick,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-24 h-24 text-xl',
    '3xl': 'w-32 h-32 text-2xl',
  };

  const onlineSizes = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
    '2xl': 'w-5 h-5 border-2',
    '3xl': 'w-6 h-6 border-2',
  };

  const ringStyles = {
    none: '',
    primary: 'ring-2 ring-primary ring-offset-2 ring-offset-background',
    gradient: 'ring-2 ring-transparent bg-gradient-to-r from-primary via-secondary to-accent p-0.5',
    gold: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-lg shadow-amber-400/30',
    online: 'ring-2 ring-success ring-offset-2 ring-offset-background animate-online',
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
      'from-pink-500 via-rose-400 to-pink-600',
      'from-purple-500 via-violet-400 to-indigo-600',
      'from-blue-500 via-cyan-400 to-blue-600',
      'from-green-500 via-emerald-400 to-teal-600',
      'from-orange-500 via-amber-400 to-yellow-600',
      'from-red-500 via-rose-400 to-pink-600',
      'from-indigo-500 via-purple-400 to-pink-500',
    ];
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  const avatarContent = src ? (
    <img
      src={src}
      alt={name}
      className={`${sizes[size]} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`
        ${sizes[size]} rounded-full
        bg-gradient-to-br ${getGradient()}
        flex items-center justify-center text-white font-bold
        shadow-inner
      `}
    >
      {getDefaultAvatar()}
    </div>
  );

  return (
    <div
      className={`
        relative inline-flex flex-shrink-0
        ${onClick ? 'cursor-pointer tap-effect' : ''}
        ${ring === 'gradient' ? 'rounded-full' : ''}
      `}
      onClick={onClick}
    >
      {/* Avatar with ring */}
      <div className={`rounded-full ${ringStyles[ring]}`}>
        {ring === 'gradient' ? (
          <div className="rounded-full bg-background p-0.5">
            {avatarContent}
          </div>
        ) : (
          avatarContent
        )}
      </div>

      {/* 在线状态指示器 */}
      {isOnline !== undefined && (
        <span
          className={`
            absolute bottom-0 right-0 ${onlineSizes[size]} rounded-full
            border-background
            ${isOnline
              ? 'bg-success shadow-lg shadow-success/50'
              : 'bg-text-muted'}
            ${isOnline ? 'animate-pulse' : ''}
          `}
        />
      )}

      {/* 认证徽章 */}
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-[10px] shadow-lg shadow-primary/30 border-2 border-background">
          ✓
        </span>
      )}

      {/* 自定义角标 */}
      {badge && !verified && (
        <span className="absolute -top-1 -right-1 animate-bounce-in">
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
  size?: 'xs' | 'sm' | 'md';
  showCount?: boolean;
}

export function AvatarGroup({ avatars, max = 4, size = 'sm', showCount = true }: AvatarGroupProps) {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapSizes = {
    xs: '-space-x-1.5',
    sm: '-space-x-2',
    md: '-space-x-3',
  };

  const countSizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
  };

  return (
    <div className={`flex items-center ${overlapSizes[size]}`}>
      {displayed.map((avatar, index) => (
        <div
          key={index}
          className="relative rounded-full ring-2 ring-background"
          style={{ zIndex: displayed.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}
      {remaining > 0 && showCount && (
        <div
          className={`
            ${countSizes[size]}
            rounded-full bg-gradient-to-br from-surface-light to-surface
            border-2 border-background
            flex items-center justify-center
            text-text-secondary font-semibold
            relative z-0
          `}
        >
          +{remaining > 99 ? '99' : remaining}
        </div>
      )}
    </div>
  );
}

// 可编辑头像
interface EditableAvatarProps extends AvatarProps {
  onEdit?: () => void;
}

export function EditableAvatar({
  onEdit,
  ...props
}: EditableAvatarProps) {
  return (
    <div className="relative inline-block">
      <Avatar {...props} />
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary-light transition-colors border-2 border-background"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}

// 带状态的头像卡片
interface AvatarCardProps {
  src?: string;
  name: string;
  subtitle?: string;
  status?: 'online' | 'busy' | 'away' | 'offline';
  badge?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
}

export function AvatarCard({
  src,
  name,
  subtitle,
  status,
  badge,
  action,
  onClick,
}: AvatarCardProps) {
  const statusColors = {
    online: 'bg-success',
    busy: 'bg-error',
    away: 'bg-warning',
    offline: 'bg-text-muted',
  };

  const statusLabels = {
    online: '在线',
    busy: '忙碌',
    away: '离开',
    offline: '离线',
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-2xl
        bg-surface border border-border
        ${onClick ? 'cursor-pointer tap-effect hover:bg-surface-light' : ''}
        transition-all duration-200
      `}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar src={src} name={name} size="md" badge={badge} />
        {status && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusColors[status]} border-2 border-background`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-text-primary truncate">{name}</h4>
        <p className="text-sm text-text-secondary truncate">
          {status ? statusLabels[status] : subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}
