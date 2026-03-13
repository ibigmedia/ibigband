import React from 'react';

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white p-8 rounded-ibig shadow-sm border border-[#78716A]/5 hover:shadow-xl transition-all ${className}`} {...props}>
      {children}
    </div>
  );
}
