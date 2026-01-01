'use client';

import React from 'react';

// 基础骨架屏
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animationStyles = {
    pulse: 'animate-pulse bg-surface-light',
    wave: 'skeleton',
    none: 'bg-surface-light',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );
}

// 教练卡片骨架屏
export function CoachCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3">
        {/* 头像骨架 */}
        <div className="w-16 h-16 rounded-full bg-surface-light" />

        {/* 信息区骨架 */}
        <div className="flex-1">
          <div className="h-5 w-24 bg-surface-light rounded mb-2" />
          <div className="flex gap-1 mb-2">
            <div className="h-4 w-12 bg-surface-light rounded-full" />
            <div className="h-4 w-12 bg-surface-light rounded-full" />
          </div>
          <div className="flex gap-1 mb-2">
            <div className="h-5 w-16 bg-surface-light rounded" />
            <div className="h-5 w-16 bg-surface-light rounded" />
          </div>
          <div className="h-4 w-32 bg-surface-light rounded" />
        </div>

        {/* 价格区骨架 */}
        <div className="flex flex-col items-end">
          <div className="h-6 w-12 bg-surface-light rounded mb-1" />
          <div className="h-3 w-8 bg-surface-light rounded" />
        </div>
      </div>
    </div>
  );
}

// 特色教练卡片骨架屏
export function FeaturedCoachSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-full bg-surface-light" />
        <div className="flex-1">
          <div className="h-6 w-28 bg-surface-light rounded mb-2" />
          <div className="flex gap-1 mb-2">
            <div className="h-5 w-14 bg-surface-light rounded-full" />
            <div className="h-5 w-14 bg-surface-light rounded-full" />
          </div>
          <div className="h-4 w-40 bg-surface-light rounded mb-2" />
          <div className="flex gap-1">
            <div className="h-6 w-20 bg-surface-light rounded" />
            <div className="h-6 w-20 bg-surface-light rounded" />
          </div>
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="h-8 w-14 bg-surface-light rounded" />
          <div className="h-10 w-16 bg-surface-light rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// 消息列表项骨架屏
export function MessageItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-surface-light" />
      <div className="flex-1">
        <div className="h-4 w-24 bg-surface-light rounded mb-2" />
        <div className="h-3 w-40 bg-surface-light rounded" />
      </div>
      <div className="h-3 w-10 bg-surface-light rounded" />
    </div>
  );
}

// 视频卡片骨架屏
export function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[9/16] bg-surface-light" />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-surface-light" />
          <div className="h-4 w-20 bg-surface-light rounded" />
        </div>
        <div className="h-4 w-full bg-surface-light rounded mb-1" />
        <div className="h-3 w-16 bg-surface-light rounded" />
      </div>
    </div>
  );
}

// 订单卡片骨架屏
export function OrderCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-surface-light rounded" />
        <div className="h-5 w-14 bg-surface-light rounded-full" />
      </div>
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-surface-light" />
        <div className="flex-1">
          <div className="h-4 w-20 bg-surface-light rounded mb-2" />
          <div className="h-3 w-32 bg-surface-light rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-5 w-20 bg-surface-light rounded" />
        <div className="h-9 w-20 bg-surface-light rounded-xl" />
      </div>
    </div>
  );
}

// 直播卡片骨架屏
export function LiveCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-surface-light relative">
        <div className="absolute top-2 left-2 h-5 w-16 bg-surface rounded-full" />
        <div className="absolute bottom-2 left-2 h-4 w-12 bg-surface rounded" />
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-light" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-surface-light rounded mb-1" />
            <div className="h-3 w-32 bg-surface-light rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Banner骨架屏
export function BannerSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse">
      <div className="h-44 bg-surface-light" />
    </div>
  );
}

// 游戏图标骨架屏
export function GameIconSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-surface-light" />
      <div className="h-3 w-10 bg-surface-light rounded" />
    </div>
  );
}

// 列表骨架屏包装器
interface SkeletonListProps {
  count?: number;
  children: React.ReactNode;
  className?: string;
}

export function SkeletonList({ count = 3, children, className = '' }: SkeletonListProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{children}</div>
      ))}
    </div>
  );
}
