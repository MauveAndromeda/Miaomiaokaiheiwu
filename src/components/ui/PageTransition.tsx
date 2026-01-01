'use client';

import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// 淡入滑动动画
export function FadeSlideIn({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 缩放淡入动画
export function ScaleIn({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        transition-all duration-400 ease-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 从右侧滑入动画
export function SlideInRight({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        transition-all duration-400 ease-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 从底部弹出动画（用于Modal/Sheet）
export function SlideUpSheet({ children, className = '', isOpen = true }: PageTransitionProps & { isOpen?: boolean }) {
  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// 交错动画容器
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ children, staggerDelay = 50, className = '' }: StaggerContainerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-fade-slide-in"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// 列表项动画
interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  delay?: number;
}

export function AnimatedList({ children, className = '', itemClassName = '', delay = 80 }: AnimatedListProps) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const childCount = React.Children.count(children);
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < childCount; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, i]);
        }, i * delay)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [children, delay]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={`
            transition-all duration-400 ease-out
            ${visibleItems.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            ${itemClassName}
          `}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// 脉冲点击反馈
export function PulseOnClick({ children, className = '' }: PageTransitionProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 200);
  };

  return (
    <div
      className={`
        transition-transform duration-200
        ${isPulsing ? 'scale-95' : 'scale-100'}
        ${className}
      `}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

// 闪烁高亮动画（用于新内容提示）
export function HighlightPulse({ children, active = false, className = '' }: PageTransitionProps & { active?: boolean }) {
  return (
    <div
      className={`
        relative
        ${active ? 'animate-highlight-pulse' : ''}
        ${className}
      `}
    >
      {children}
      {active && (
        <div className="absolute inset-0 rounded-inherit bg-primary/20 animate-ping pointer-events-none" />
      )}
    </div>
  );
}

// 数字滚动动画
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, duration = 1000, className = '' }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      setDisplayValue(Math.round(startValue + (endValue - startValue) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{displayValue.toLocaleString()}</span>;
}

// 进度条动画
interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function AnimatedProgress({ value, max = 100, className = '', barClassName = '' }: AnimatedProgressProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth((value / max) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, max]);

  return (
    <div className={`h-2 bg-surface-light rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out ${barClassName}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
