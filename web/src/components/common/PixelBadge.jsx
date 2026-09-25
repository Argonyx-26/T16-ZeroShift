import React from 'react';

const VARIANTS = {
  blue: 'bg-primary-soft text-primary border-primary-light shadow-[1.5px_1.5px_0px_#2563EB]',
  green: 'bg-learning-soft text-learning-hover border-learning shadow-[1.5px_1.5px_0px_#16A34A]',
  yellow: 'bg-warning-soft text-warning border-warning shadow-[1.5px_1.5px_0px_#D97706]',
  red: 'bg-error-soft text-error border-error shadow-[1.5px_1.5px_0px_#DC2626]',
  neutral: 'bg-slate-100 text-ink-secondary border-slate-300 shadow-[1.5px_1.5px_0px_#94A3B8]',
  arcade: 'bg-slate-900 text-yellow-300 border-yellow-400 shadow-[1.5px_1.5px_0px_#F59E0B]',
};

export default function PixelBadge({
  children,
  variant = 'blue',
  className = '',
  size = 'md',
  icon: Icon = null,
}) {
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-pixel font-bold uppercase tracking-wider rounded-md border-[1.5px] select-none ${
        VARIANTS[variant] || VARIANTS.blue
      } ${sizeClass} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{children}</span>
    </span>
  );
}
