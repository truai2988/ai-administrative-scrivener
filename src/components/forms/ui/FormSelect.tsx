'use client';

/**
 * FormSelect.tsx
 *
 * 共通セレクトボックスコンポーネント。
 * ClickToFillContext が存在する場合、フィルモード時にハイライト表示し、
 * onMouseDown で保持データを代入する。Context がなければ通常動作。
 */

import React, { forwardRef } from 'react';
import { useClickToFillContext } from '@/contexts/ClickToFillContext';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ options, placeholder = '選択してください', error, className = '', value, onMouseDown, ...props }, ref) => {
    const ctf = useClickToFillContext();
    const isInFillMode = ctf?.isInFillMode ?? false;
    const isFlashing = ctf?.flashField === props.name;

    const handleMouseDown = (e: React.MouseEvent<HTMLSelectElement>) => {
      if (isInFillMode && props.name) {
        ctf?.fillField(e, props.name);
        return;
      }
      onMouseDown?.(e);
    };

    return (
      <select
        ref={ref}
        className={`form-input form-select ${error ? 'form-input--error' : ''} ${isInFillMode ? 'form-input--fill-target' : ''} ${isFlashing ? 'form-input--fill-flash' : ''} ${className}`}
        value={value === null ? '' : value}
        onMouseDown={handleMouseDown}
        suppressHydrationWarning
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

FormSelect.displayName = 'FormSelect';
