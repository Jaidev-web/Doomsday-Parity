'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Global event bus for toasts
const listeners = new Set();

export const toast = {
  notify(message, type = 'info', options = {}) {
    const id = options.id || Math.random().toString(36).substring(2, 9);
    const toastItem = {
      id,
      message,
      type,
      duration: options.duration ?? (type === 'loading' ? 0 : 4000),
      createdAt: Date.now(),
      ...options,
    };
    listeners.forEach((listener) => listener({ action: 'add', toast: toastItem }));
    return id;
  },
  success(message, options) {
    return this.notify(message, 'success', options);
  },
  error(message, options) {
    return this.notify(message, 'error', options);
  },
  info(message, options) {
    return this.notify(message, 'info', options);
  },
  loading(message, options) {
    return this.notify(message, 'loading', options);
  },
  dismiss(id) {
    listeners.forEach((listener) => listener({ action: 'dismiss', id }));
  },
};

export function Toaster({ position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = ({ action, toast: newToast, id }) => {
      if (action === 'add') {
        setToasts((prev) => {
          // If id already exists, replace it (great for loading -> success)
          const filtered = prev.filter((t) => t.id !== newToast.id);
          return [...filtered, newToast];
        });

        if (newToast.duration > 0) {
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
          }, newToast.duration);
        }
      } else if (action === 'dismiss') {
        setToasts((prev) => (id ? prev.filter((t) => t.id !== id) : []));
      }
    };

    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const positionClasses = {
    'top-right': 'top-5 right-5 items-end',
    'top-center': 'top-5 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-5 right-5 items-end',
  };

  return (
    <div
      aria-live="polite"
      className={cn(
        'fixed z-50 pointer-events-none flex flex-col gap-2.5 max-w-sm w-full px-4',
        positionClasses[position] || positionClasses['top-right']
      )}
    >
      {toasts.map((item) => {
        const isSuccess = item.type === 'success';
        const isError = item.type === 'error';
        const isLoading = item.type === 'loading';
        const isInfo = item.type === 'info';

        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 w-full p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-2',
              isSuccess && 'bg-emerald-950/90 text-white border-emerald-500/40 shadow-emerald-950/30',
              isError && 'bg-rose-950/90 text-white border-rose-500/40 shadow-rose-950/30',
              isLoading && 'bg-slate-900/90 text-white border-indigo-500/40 shadow-slate-950/30',
              isInfo && 'bg-indigo-950/90 text-white border-indigo-500/40 shadow-indigo-950/30'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isLoading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
              {isInfo && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-sm leading-snug font-medium">
              {item.message}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors p-0.5 rounded-md focus:outline-none focus:ring-1 focus:ring-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
