'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">出错了</h3>
          <p className="text-text-secondary text-center mb-6 max-w-xs">
            页面加载出现问题，请重试
          </p>
          <Button variant="primary" onClick={this.handleRetry}>
            重新加载
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 函数式包装器
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  resetError,
  title = '出错了',
  description = '页面加载出现问题，请重试',
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-error/20 to-error/10 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-center mb-6 max-w-xs">{description}</p>
      {error && (
        <p className="text-xs text-text-muted bg-surface-light rounded-lg px-3 py-2 mb-4 max-w-xs truncate">
          {error.message}
        </p>
      )}
      {resetError && (
        <Button variant="primary" onClick={resetError}>
          重新加载
        </Button>
      )}
    </div>
  );
}

// 空状态组件
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-surface-light to-surface flex items-center justify-center mb-6">
        {icon || (
          <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-secondary text-center mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// 网络错误状态
interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">网络连接失败</h3>
      <p className="text-text-secondary text-center mb-6 max-w-xs">
        请检查您的网络连接后重试
      </p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          重新连接
        </Button>
      )}
    </div>
  );
}
