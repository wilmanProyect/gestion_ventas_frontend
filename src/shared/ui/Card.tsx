import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, ...props }) => {
  return (
    <div
      className={`
        bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl 
        transition-all duration-300 ease-out
        ${hoverEffect ? 'hover:scale-[1.01] hover:border-emerald-800/50 hover:shadow-2xl hover:shadow-emerald-950/20' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
