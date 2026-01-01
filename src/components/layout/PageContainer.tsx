'use client';

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  hasTabBar?: boolean;
  hasHeader?: boolean;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({
  children,
  hasTabBar = true,
  hasHeader = false,
  className = '',
  noPadding = false,
}: PageContainerProps) {
  return (
    <main
      className={`
        min-h-screen bg-background
        ${hasHeader ? 'pt-12' : ''}
        ${hasTabBar ? 'pb-14' : ''}
        ${noPadding ? '' : 'px-4'}
        ${className}
      `}
    >
      {children}
    </main>
  );
}

// 带下拉刷新的滚动容器
interface ScrollContainerProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function ScrollContainer({
  children,
  onRefresh,
  className = '',
}: ScrollContainerProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !refreshing) {
      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY > 0) {
        setPullDistance(Math.min(deltaY * 0.5, 80));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= 60 && onRefresh && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto no-scrollbar ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center py-2 transition-all duration-150"
          style={{ height: refreshing ? 40 : pullDistance }}
        >
          <div
            className={`w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full ${refreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
