'use client';

import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={20} className="text-success" />,
    error: <XCircle size={20} className="text-error" />,
    info: <Info size={20} className="text-primary" />,
  };

  const bgColors = {
    success: 'bg-success/10 border-success/20',
    error: 'bg-error/10 border-error/20',
    info: 'bg-primary/10 border-primary/20',
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
      <div
        className={`
          flex items-center gap-2 px-4 py-3 rounded-xl border
          ${bgColors[toast.type]} backdrop-blur-lg shadow-lg
        `}
      >
        {icons[toast.type]}
        <span className="text-text-primary text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
