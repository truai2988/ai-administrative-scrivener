'use client';

import React, { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`form-input ${error ? 'form-input--error' : ''} ${className}`}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
