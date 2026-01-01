'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const colors = {
    primary: 'border-primary/30 border-t-primary',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div
      className={`
        ${sizes[size]} ${colors[color]}
        rounded-full animate-spin
      `}
    />
  );
}

// 全屏loading
export function FullScreenLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <span className="text-text-secondary">加载中...</span>
      </div>
    </div>
  );
}

// 下拉刷新loading
export function PullToRefreshLoading({ progress = 0 }: { progress?: number }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div
        className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
        style={{
          transform: `rotate(${progress * 360}deg)`,
          animation: progress >= 1 ? 'spin 1s linear infinite' : 'none',
        }}
      />
    </div>
  );
}

// 骨架屏
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rect',
  width,
  height,
}: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  return (
    <div
      className={`skeleton ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

// 空状态
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary text-center mb-4">{description}</p>
      )}
      {action && (
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg tap-effect"
          onClick={action.onClick}
        >
          {action.text}
        </button>
      )}
    </div>
  );
}

// 加载更多
interface LoadMoreProps {
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function LoadMore({ loading, hasMore, onLoadMore }: LoadMoreProps) {
  if (!hasMore && !loading) {
    return (
      <div className="py-4 text-center text-sm text-text-secondary">
        没有更多了
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center py-4 gap-2 cursor-pointer"
      onClick={() => !loading && onLoadMore?.()}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span className="text-sm text-text-secondary">加载中...</span>
        </>
      ) : (
        <span className="text-sm text-text-secondary">上拉加载更多</span>
      )}
    </div>
  );
}
