'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function Rating({
  value,
  max = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
}: RatingProps) {
  const sizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < Math.floor(value);
        const partial = index === Math.floor(value) && value % 1 > 0;
        const percentage = partial ? (value % 1) * 100 : 0;

        return (
          <span
            key={index}
            className={`relative ${interactive ? 'cursor-pointer tap-effect' : ''}`}
            onClick={() => handleClick(index)}
          >
            {/* 空星 */}
            <Star
              size={sizes[size]}
              className="text-surface-light"
              fill="currentColor"
            />
            {/* 满星或部分星 */}
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${percentage}%` }}
              >
                <Star
                  size={sizes[size]}
                  className="text-warning"
                  fill="currentColor"
                />
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-warning font-medium">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

// 简单评分显示
interface SimpleRatingProps {
  value: number;
  size?: 'sm' | 'md';
}

export function SimpleRating({ value, size = 'sm' }: SimpleRatingProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
  };

  return (
    <div className="flex items-center gap-1">
      <Star size={size === 'sm' ? 14 : 18} className="text-warning" fill="currentColor" />
      <span className={`${textSizes[size]} text-warning font-medium`}>{value.toFixed(1)}</span>
    </div>
  );
}
