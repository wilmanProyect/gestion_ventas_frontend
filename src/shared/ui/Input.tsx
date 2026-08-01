import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          className={`
            bg-slate-950 border text-slate-100 rounded-xl px-4 py-2 text-sm
            placeholder-slate-500 focus:outline-none transition-all duration-200
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}
            ${className}
          `}
          {...props}
        />
        {error ? (
          <span className="text-xs text-rose-500 font-medium mt-0.5">{error}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
