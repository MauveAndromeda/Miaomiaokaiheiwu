'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, onRightIconClick, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-text-secondary mb-2">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary
              placeholder:text-text-secondary
              focus:border-primary focus:ring-1 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-error focus:border-error focus:ring-error' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary ${onRightIconClick ? 'cursor-pointer tap-effect' : ''}`}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, maxLength, showCount = false, className = '', value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-text-secondary mb-2">{label}</label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={`
              w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary
              placeholder:text-text-secondary
              focus:border-primary focus:ring-1 focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150 resize-none
              ${error ? 'border-error focus:border-error focus:ring-error' : ''}
              ${className}
            `}
            {...props}
          />
          {showCount && maxLength && (
            <span className="absolute right-3 bottom-3 text-xs text-text-secondary">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
