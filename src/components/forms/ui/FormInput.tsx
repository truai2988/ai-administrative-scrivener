'use client';

/**
 * FormInput.tsx
 *
 * 共通テキスト入力コンポーネント。
 * ClickToFillContext が存在する場合、フィルモード時にハイライト表示し、
 * onMouseDown で保持データを代入する。Context がなければ通常動作。
 */

import React, { forwardRef } from 'react';
import { useClickToFillContext } from '@/contexts/ClickToFillContext';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className = '', onMouseDown, ...props }, ref) => {
    const ctf = useClickToFillContext();
    const isInFillMode = ctf?.isInFillMode ?? false;

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
      if (isInFillMode && props.name) {
        ctf?.fillField(e, props.name);
        return; // fillField 内で preventDefault 済み
      }
      // フィルモードでない場合は元の onMouseDown を透過
      onMouseDown?.(e);
    };

    return (
      <input
        ref={ref}
        className={`form-input ${error ? 'form-input--error' : ''} ${isInFillMode ? 'form-input--fill-target' : ''} ${className}`}
        onMouseDown={handleMouseDown}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
