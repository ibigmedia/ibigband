import React, { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    // 외부에서 bg- 가 들어오면 내부의 bg-white를 빼서 겹침 방지 (꼬임 해결)
    const baseBg = className.includes('bg-') ? '' : 'bg-white';
    
    return (
      <input 
        ref={ref}
        className={`w-full px-4 py-4 rounded-full ${baseBg} border border-[#78716A]/10 text-sm focus:ring-2 focus:ring-[#E6C79C] outline-none transition-all ${className}`} 
        {...props} 
      />
    );
  }
);

Input.displayName = 'Input';
