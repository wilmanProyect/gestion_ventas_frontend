import React, { forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          className={`
            bg-slate-950 border text-slate-100 rounded-xl px-4 py-2 text-sm
            focus:outline-none transition-all duration-200 cursor-pointer
            ${error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-emerald-500'}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-950 text-slate-200">
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-xs text-rose-500 font-medium mt-0.5">{error}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
