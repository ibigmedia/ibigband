import React, { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input 
        ref={ref}
        className={`w-full px-4 py-4 rounded-full bg-white border border-[#78716A]/10 text-sm focus:ring-2 focus:ring-[#E6C79C] outline-none transition-all ${className}`} 
        {...props} 
      />
    );
  }
);

Input.displayName = 'Input';
