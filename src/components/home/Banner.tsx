'use client';

import React, { useState, useEffect, useRef } from 'react';
import { banners } from '@/data/mock';
import { ChevronRight, Sparkles, Gift, Zap, Crown } from 'lucide-react';

export function Banner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // 自动轮播
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50 && !isAnimating) {
      setIsAnimating(true);
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
      }
      setTimeout(() => setIsAnimating(false), 400);
    }

    // 恢复自动轮播
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
  };

  const bannerConfigs = [
    {
      gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
      icon: <Sparkles className="w-8 h-8" />,
      bgPattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    },
    {
      gradient: 'from-blue-600 via-cyan-500 to-teal-500',
      icon: <Gift className="w-8 h-8" />,
      bgPattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    },
    {
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      icon: <Zap className="w-8 h-8" />,
      bgPattern: 'radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    },
    {
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
      icon: <Crown className="w-8 h-8" />,
      bgPattern: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
    },
  ];

  return (
    <div className="relative mb-5">
      {/* 背景光晕 */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${
            currentIndex === 0 ? '#8b5cf6' :
            currentIndex === 1 ? '#06b6d4' :
            currentIndex === 2 ? '#f59e0b' : '#ec4899'
          } 0%, transparent 70%)`
        }}
      />

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl shadow-elevated"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const config = bannerConfigs[index % bannerConfigs.length];
            return (
              <div
                key={banner.id}
                className={`
                  flex-shrink-0 w-full h-44 relative
                  bg-gradient-to-r ${config.gradient}
                  cursor-pointer tap-effect overflow-hidden
                `}
              >
                {/* 装饰背景 */}
                <div
                  className="absolute inset-0"
                  style={{ background: config.bgPattern }}
                />

                {/* 网格装饰 */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* 内容 */}
                <div className="relative h-full flex items-center justify-between px-5 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/90">{config.icon}</span>
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                        限时活动
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                      {banner.title}
                    </h3>
                    <p className="text-white/80 text-sm mb-3 line-clamp-1">
                      {banner.subtitle || '点击了解更多精彩内容'}
                    </p>
                    <button className="inline-flex items-center gap-1 px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all">
                      立即参与
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 装饰圆形 */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute right-12 bottom-12 w-16 h-16 bg-white/10 rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 现代指示器 */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-surface/80 backdrop-blur-lg rounded-full shadow-lg border border-border">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`
              h-1.5 rounded-full transition-all duration-400
              ${index === currentIndex
                ? 'w-6 bg-gradient-to-r from-primary to-secondary'
                : 'w-1.5 bg-text-muted hover:bg-text-secondary'}
            `}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

// 热门活动区
export function HotEvents() {
  const events = [
    { id: 1, title: '新人专享', desc: '首单立减10元', color: 'from-primary to-secondary', icon: '🎁' },
    { id: 2, title: 'VIP特权', desc: '开通享8折', color: 'from-amber-500 to-orange-500', icon: '👑' },
    { id: 3, title: '好友邀请', desc: '邀请得钻石', color: 'from-green-500 to-emerald-500', icon: '💎' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {events.map((event) => (
        <div
          key={event.id}
          className={`
            relative p-3 rounded-2xl overflow-hidden
            bg-gradient-to-br ${event.color}
            cursor-pointer tap-effect hover:-translate-y-0.5
            transition-transform duration-300
          `}
        >
          <div className="relative z-10">
            <span className="text-2xl mb-1 block">{event.icon}</span>
            <h4 className="font-bold text-white text-sm">{event.title}</h4>
            <p className="text-white/80 text-xs">{event.desc}</p>
          </div>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  );
}
