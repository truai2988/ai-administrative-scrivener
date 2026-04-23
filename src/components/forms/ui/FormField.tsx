'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  /** 必須マークを表示するか */
  required?: boolean;
  /** エラーメッセージ */
  error?: string;
  /** フィールドのヒントテキスト */
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`form-field ${className}`}>
      <div className="flex items-center gap-2">
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
        {hint && <p className="form-hint">{hint}</p>}
      </div>
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
