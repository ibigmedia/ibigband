import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center font-bold transition-all rounded-ibig";
  const variants = {
    primary: "bg-[#121110] text-white hover:bg-[#2A2826] shadow-md hover:scale-105 transform",
    secondary: "bg-[#E8481C] text-black hover:bg-[#D4A373] hover:shadow-lg",
    outline: "bg-white border-2 border-[#78716A]/10 text-t-muted hover:bg-[#2A2826]/5"
  };
  const sizes = {
    sm: "px-5 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-10 py-5 text-sm"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
