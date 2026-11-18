'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast],
  );

  const toast = {
    success: (msg: string, title?: string) => addToast('success', msg, title),
    error: (msg: string, title?: string) => addToast('error', msg, title),
    info: (msg: string, title?: string) => addToast('info', msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-lg border text-sm transition-all duration-300 animate-in slide-in-from-bottom-5',
              t.type === 'success' && 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
              t.type === 'error' && 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
              t.type === 'info' && 'bg-white border-blue-200 text-slate-800 shadow-blue-500/10',
            )}
          >
            {t.type === 'success' && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-0.5">
              {t.title && (
                <h5 className="font-semibold text-slate-900 leading-tight">
                  {t.title}
                </h5>
              )}
              <p className="text-slate-600 leading-relaxed text-xs">{t.message}</p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
