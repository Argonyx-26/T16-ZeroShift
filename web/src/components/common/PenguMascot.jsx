import React from 'react';

const MASCOT_MAP = {
  wave: '/assets/pengu/pengu-wave.png',
  teacher: '/assets/pengu/pengu-teacher.png',
  point: '/assets/pengu/pengu-point.png',
  goal: '/assets/pengu/pengu-goal.png',
  peek: '/assets/pengu/pengu-peek.png',
};

const SIZES = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-44 h-44',
  hero: 'w-52 h-52 sm:w-60 sm:h-60',
};

export default function PenguMascot({
  pose = 'wave',
  size = 'md',
  speech = null,
  speechPosition = 'top', // 'top' | 'right'
  className = '',
  animate = true,
  alt = 'Pengu Companion',
}) {
  const imgSrc = MASCOT_MAP[pose] || MASCOT_MAP.wave;

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Speech bubble */}
      {speech && (
        <div
          className={`absolute z-10 px-3 py-1.5 bg-surface border-2 border-slate-900 shadow-pixel-sm rounded-xl text-xs font-pixel text-ink whitespace-nowrap animate-float ${
            speechPosition === 'top'
              ? '-top-9 left-1/2 -translate-x-1/2'
              : '-right-32 top-2'
          }`}
        >
          {speech}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-surface border-b-2 border-r-2 border-slate-900 transform rotate-45 ${
              speechPosition === 'top'
                ? '-bottom-1.5 left-1/2 -translate-x-1/2'
                : 'top-3 -left-1.5 border-t-2 border-l-2 border-b-0 border-r-0'
            }`}
          />
        </div>
      )}

      {/* Mascot Image with pixel-art rendering */}
      <img
        src={imgSrc}
        alt={alt}
        className={`${SIZES[size] || SIZES.md} object-contain transition-transform duration-200 ${
          animate ? 'hover:scale-105' : ''
        }`}
        style={{
          imageRendering: 'pixelated',
        }}
        draggable="false"
      />
    </div>
  );
}
