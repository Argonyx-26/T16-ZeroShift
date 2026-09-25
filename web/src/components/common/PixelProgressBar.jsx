import React from 'react';

export default function PixelProgressBar({
  progress = 0,
  variant = 'blue', // 'blue' | 'green' | 'yellow'
  showLabel = true,
  height = 'h-3.5',
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const barColors = {
    blue: 'bg-primary border-blue-700',
    green: 'bg-learning border-green-700',
    yellow: 'bg-warning border-amber-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="font-sans font-medium text-ink-secondary">Progress</span>
          <span className="font-pixel font-bold text-ink">{clamped}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-slate-100 rounded-md border-2 border-slate-900 shadow-pixel-sm p-0.5 overflow-hidden flex items-center`}>
        <div
          className={`h-full rounded-sm transition-all duration-300 ${
            barColors[variant] || barColors.blue
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
