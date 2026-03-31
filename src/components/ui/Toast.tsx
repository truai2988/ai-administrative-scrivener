'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// ─── useToast フック ─────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    // 4秒後に自動削除
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
}

// ─── Toastコンテナコンポーネント ─────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── 個別トーストアイテム ────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  // マウント時にアニメーションクラスを追加
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => el.classList.add('toast--visible'));
  }, []);

  return (
    <div
      ref={ref}
      className={`toast toast--${toast.type}`}
      role="alert"
    >
      <span className="toast-icon">
        {toast.type === 'success'
          ? <CheckCircle2 size={18} />
          : <XCircle size={18} />
        }
      </span>
      <span className="toast-message">{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="閉じる"
      >
        <X size={14} />
      </button>
    </div>
  );
}
