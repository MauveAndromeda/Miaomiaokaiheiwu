'use client';

import React, { useState, useEffect, useRef } from 'react';
import { banners } from '@/data/mock';

export function Banner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // 自动轮播
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

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

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // 向左滑 - 下一张
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      } else {
        // 向右滑 - 上一张
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
      }
    }

    // 恢复自动轮播
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
  };

  const gradients = [
    'from-purple-600 to-pink-600',
    'from-blue-600 to-cyan-600',
    'from-green-600 to-emerald-600',
    'from-orange-600 to-amber-600',
  ];

  return (
    <div className="relative mb-4">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`
                flex-shrink-0 w-full h-36 rounded-xl
                bg-gradient-to-r ${gradients[index % gradients.length]}
                flex items-center justify-center
                cursor-pointer tap-effect
              `}
            >
              <span className="text-white text-lg font-bold px-4 text-center">
                {banner.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 指示点 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${index === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}
            `}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
