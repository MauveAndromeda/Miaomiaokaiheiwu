'use client';

import React from 'react';
import { ChevronLeft, MoreVertical, MessageCircle, Search, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CountBadge } from '@/components/ui';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
  rightContent?: React.ReactNode;
  onBack?: () => void;
  variant?: 'default' | 'glass' | 'gradient';
}

export function Header({
  title,
  showBack = true,
  transparent = false,
  rightContent,
  onBack,
  variant = 'default',
}: HeaderProps) {
  const { goBack } = useApp();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const variantStyles = {
    default: transparent
      ? 'bg-transparent'
      : 'bg-background/80 backdrop-blur-xl border-b border-white/5',
    glass: 'bg-white/5 backdrop-blur-2xl border-b border-white/10',
    gradient: 'bg-gradient-to-b from-background to-transparent',
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-20
        ${variantStyles[variant]}
        safe-area-top
      `}
    >
      {/* 顶部高光线 */}
      {variant === 'glass' && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}

      <div className="flex items-center justify-between h-14 px-4">
        {/* 左侧 */}
        <div className="w-20 flex items-center">
          {showBack && (
            <button
              className="w-10 h-10 flex items-center justify-center -ml-2 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 tap-effect"
              onClick={handleBack}
            >
              <ChevronLeft size={22} className="text-text-primary" />
            </button>
          )}
        </div>

        {/* 标题 */}
        {title && (
          <h1 className="flex-1 text-center text-base font-bold text-text-primary truncate">
            {title}
          </h1>
        )}

        {/* 右侧 */}
        <div className="w-20 flex items-center justify-end gap-1">
          {rightContent}
        </div>
      </div>
    </header>
  );
}

// 带搜索框的首页头部
interface HomeHeaderProps {
  onSearchClick: () => void;
  onScanClick?: () => void;
  onMessageClick?: () => void;
  unreadCount?: number;
}

export function HomeHeader({
  onSearchClick,
  onScanClick,
  onMessageClick,
  unreadCount = 0,
}: HomeHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 safe-area-top">
      {/* 毛玻璃背景 */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

      {/* 顶部高光线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="relative flex items-center gap-3 h-14 px-4">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-lg">🐱</span>
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:inline">喵喵开黑</span>
        </div>

        {/* 搜索框 */}
        <div
          className="flex-1 flex items-center gap-2.5 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl px-4 py-2.5 cursor-pointer tap-effect transition-all duration-300"
          onClick={onSearchClick}
        >
          <Search size={18} className="text-text-muted" />
          <span className="text-sm text-text-muted">搜索教练、游戏...</span>
        </div>

        {/* 消息图标 */}
        {onMessageClick && (
          <button
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 tap-effect transition-all duration-300"
            onClick={onMessageClick}
          >
            <MessageCircle size={20} className="text-text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1">
                <CountBadge count={unreadCount} size="xs" />
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

// 透明渐变头部 (用于详情页等)
interface TransparentHeaderProps {
  showBack?: boolean;
  rightContent?: React.ReactNode;
  onBack?: () => void;
  scrolled?: boolean;
  title?: string;
}

export function TransparentHeader({
  showBack = true,
  rightContent,
  onBack,
  scrolled = false,
  title,
}: TransparentHeaderProps) {
  const { goBack } = useApp();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-20
        transition-all duration-300
        ${scrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-white/5'
          : 'bg-gradient-to-b from-black/50 to-transparent'}
        safe-area-top
      `}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* 左侧返回 */}
        <div className="w-20 flex items-center">
          {showBack && (
            <button
              className={`
                w-10 h-10 flex items-center justify-center -ml-1 rounded-full
                transition-all duration-300 tap-effect
                ${scrolled ? 'bg-white/5 hover:bg-white/10' : 'bg-black/30 backdrop-blur-sm hover:bg-black/40'}
              `}
              onClick={handleBack}
            >
              <ChevronLeft size={22} className="text-white" />
            </button>
          )}
        </div>

        {/* 标题 (滚动后显示) */}
        <h1 className={`
          flex-1 text-center text-base font-bold text-text-primary truncate
          transition-opacity duration-300
          ${scrolled ? 'opacity-100' : 'opacity-0'}
        `}>
          {title}
        </h1>

        {/* 右侧 */}
        <div className="w-20 flex items-center justify-end gap-2">
          {rightContent}
        </div>
      </div>
    </header>
  );
}
