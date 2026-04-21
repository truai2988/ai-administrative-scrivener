'use client';

import React, { forwardRef } from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, className = '', rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`form-input form-textarea ${error ? 'form-input--error' : ''} ${className}`}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
