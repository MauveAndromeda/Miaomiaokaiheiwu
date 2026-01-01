'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showClose = true,
  size = 'md',
}: ModalProps) {
  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* 弹窗内容 */}
      <div
        className={`
          relative bg-surface rounded-2xl w-full ${sizes[size]} mx-4
          animate-scale-in shadow-lg
        `}
      >
        {/* 标题栏 */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            {showClose && (
              <button
                className="p-2 rounded-full hover:bg-surface-light tap-effect"
                onClick={onClose}
              >
                <X size={20} className="text-text-secondary" />
              </button>
            )}
          </div>
        )}
        {/* 内容 */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// 确认弹窗
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-surface rounded-2xl w-full max-w-sm mx-4 animate-scale-in shadow-lg">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
          <p className="text-text-secondary">{message}</p>
        </div>
        <div className="flex border-t border-border">
          <button
            className="flex-1 py-4 text-text-secondary font-medium tap-effect border-r border-border"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`flex-1 py-4 font-medium tap-effect ${danger ? 'text-error' : 'text-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// 底部弹出抽屉
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const heights = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`
          absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl
          slide-up-enter ${heights[height]} overflow-hidden
          safe-area-inset-bottom
        `}
      >
        {/* 拖动指示器 */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-surface-light rounded-full" />
        </div>
        {/* 标题 */}
        {title && (
          <div className="px-4 pb-3 border-b border-border">
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          </div>
        )}
        {/* 内容 */}
        <div className="overflow-y-auto h-full pb-8">{children}</div>
      </div>
    </div>
  );
}
