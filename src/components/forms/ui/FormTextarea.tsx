'use client';

/**
 * FormTextarea.tsx
 *
 * 共通テキストエリアコンポーネント。
 * ClickToFillContext が存在する場合、フィルモード時にハイライト表示し、
 * onMouseDown で保持データを代入する。Context がなければ通常動作。
 */

import React, { forwardRef } from 'react';
import { useClickToFillContext } from '@/contexts/ClickToFillContext';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, className = '', rows = 4, onMouseDown, ...props }, ref) => {
    const ctf = useClickToFillContext();
    const isInFillMode = ctf?.isInFillMode ?? false;

    const handleMouseDown = (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (isInFillMode && props.name) {
        ctf?.fillField(e, props.name);
        return;
      }
      onMouseDown?.(e);
    };

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`form-input form-textarea ${error ? 'form-input--error' : ''} ${isInFillMode ? 'form-input--fill-target' : ''} ${className}`}
        onMouseDown={handleMouseDown}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
