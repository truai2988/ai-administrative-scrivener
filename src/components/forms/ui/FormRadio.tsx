'use client';

import React from 'react';

interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  inline?: boolean;
}

export function FormRadioGroup({
  name,
  options,
  value,
  onChange,
  error,
  inline = true,
}: FormRadioGroupProps) {
  return (
    <div
      className={`form-radio-group ${inline ? 'form-radio-group--inline' : ''} ${
        error ? 'form-radio-group--error' : ''
      }`}
    >
      {options.map((opt) => (
        <label key={opt.value} className="form-radio-label">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
            className="form-radio-input"
          />
          <span className="form-radio-text">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
