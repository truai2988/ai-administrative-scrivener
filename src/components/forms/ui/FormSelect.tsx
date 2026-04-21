'use client';

import React, { forwardRef } from 'react';

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
  ({ options, placeholder = '選択してください', error, className = '', value, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`form-input form-select ${error ? 'form-input--error' : ''} ${className}`}
        value={value === null ? '' : value}
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
