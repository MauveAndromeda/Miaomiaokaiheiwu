'use client';

import React from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
  rightContent?: React.ReactNode;
  onBack?: () => void;
}

export function Header({
  title,
  showBack = true,
  transparent = false,
  rightContent,
  onBack,
}: HeaderProps) {
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
        ${transparent ? 'bg-transparent' : 'bg-background/95 backdrop-blur-lg border-b border-border'}
        safe-area-inset-top
      `}
    >
      <div className="flex items-center justify-between h-12 px-4">
        {/* 左侧 */}
        <div className="w-20 flex items-center">
          {showBack && (
            <button
              className="p-2 -ml-2 rounded-full hover:bg-surface-light tap-effect"
              onClick={handleBack}
            >
              <ChevronLeft size={24} className="text-text-primary" />
            </button>
          )}
        </div>

        {/* 标题 */}
        {title && (
          <h1 className="flex-1 text-center text-base font-semibold text-text-primary truncate">
            {title}
          </h1>
        )}

        {/* 右侧 */}
        <div className="w-20 flex items-center justify-end">
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
    <header className="fixed top-0 left-0 right-0 z-20 bg-background safe-area-inset-top">
      <div className="flex items-center gap-3 h-14 px-4">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <span className="text-xl">🐱</span>
          <span className="text-lg font-bold gradient-text">喵喵开黑</span>
        </div>

        {/* 搜索框 */}
        <div
          className="flex-1 flex items-center gap-2 bg-surface rounded-full px-4 py-2 tap-effect"
          onClick={onSearchClick}
        >
          <span className="text-text-secondary">🔍</span>
          <span className="text-sm text-text-secondary">搜索教练、游戏...</span>
        </div>

        {/* 消息图标 */}
        {onMessageClick && (
          <button className="relative p-2 tap-effect" onClick={onMessageClick}>
            <MessageCircle size={22} className="text-text-primary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            )}
          </button>
        )}
      </div>
    </header>
  );
}

import { MessageCircle } from 'lucide-react';
