'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  /** 触发刷新的距离阈值 */
  threshold?: number;
  /** 最大下拉距离 */
  maxPullDistance?: number;
  /** 自定义刷新指示器 */
  refreshingContent?: React.ReactNode;
  /** 自定义下拉提示 */
  pullingContent?: React.ReactNode;
  /** 自定义释放提示 */
  releaseContent?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

type PullState = 'idle' | 'pulling' | 'canRelease' | 'refreshing';

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 60,
  maxPullDistance = 120,
  refreshingContent,
  pullingContent,
  releaseContent,
  className = '',
  disabled = false,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const [pullState, setPullState] = useState<PullState>('idle');
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || pullState === 'refreshing') return;

    const container = containerRef.current;
    if (!container) return;

    // 只有滚动到顶部时才能下拉刷新
    if (container.scrollTop > 0) return;

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
  }, [disabled, pullState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || pullState === 'refreshing') return;
    if (startYRef.current === 0) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      startYRef.current = 0;
      return;
    }

    currentYRef.current = e.touches[0].clientY;
    const distance = Math.max(0, currentYRef.current - startYRef.current);

    if (distance > 0) {
      e.preventDefault();

      // 阻尼效果
      const dampedDistance = Math.min(
        maxPullDistance,
        distance * 0.5
      );

      setPullDistance(dampedDistance);
      setPullState(dampedDistance >= threshold ? 'canRelease' : 'pulling');
    }
  }, [disabled, pullState, threshold, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return;

    if (pullState === 'canRelease') {
      setPullState('refreshing');
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setPullState('idle');
        setPullDistance(0);
      }
    } else {
      setPullState('idle');
      setPullDistance(0);
    }

    startYRef.current = 0;
  }, [disabled, pullState, threshold, onRefresh]);

  const getIndicatorContent = () => {
    switch (pullState) {
      case 'pulling':
        return pullingContent || (
          <div className="flex items-center gap-2 text-text-secondary">
            <svg
              className="w-5 h-5 transition-transform"
              style={{ transform: `rotate(${(pullDistance / threshold) * 180}deg)` }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm">下拉刷新</span>
          </div>
        );

      case 'canRelease':
        return releaseContent || (
          <div className="flex items-center gap-2 text-primary">
            <svg
              className="w-5 h-5 transform rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-medium">释放刷新</span>
          </div>
        );

      case 'refreshing':
        return refreshingContent || (
          <div className="flex items-center gap-2 text-primary">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium">刷新中...</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* 刷新指示器 */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          top: 0,
          height: pullDistance,
          opacity: pullDistance / threshold,
          transform: `translateY(-100%)`,
        }}
      >
        {pullState !== 'idle' && getIndicatorContent()}
      </div>

      {/* 内容容器 */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 无限滚动加载组件
 */
interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  /** 触发加载的距离阈值 */
  threshold?: number;
  /** 加载中内容 */
  loadingContent?: React.ReactNode;
  /** 没有更多内容 */
  endContent?: React.ReactNode;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 100,
  loadingContent,
  endContent,
  className = '',
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}

      {/* 加载触发点 */}
      <div ref={sentinelRef} className="h-1" />

      {/* 加载中指示器 */}
      {isLoading && (
        loadingContent || (
          <div className="flex items-center justify-center py-4">
            <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2 text-sm text-text-secondary">加载中...</span>
          </div>
        )
      )}

      {/* 无更多数据 */}
      {!hasMore && !isLoading && (
        endContent || (
          <div className="flex items-center justify-center py-4 text-sm text-text-muted">
            — 已经到底啦 —
          </div>
        )
      )}
    </div>
  );
}
