import React from 'react';
import { Quote } from 'lucide-react';

/**
 * Reusable PenguQuote component.
 * Allows easy replacement with any user-provided quote.
 */
export default function PenguQuote({
  quote = "Small steps each day build giant leaps in understanding. Keep going!",
  author = "Pengu's Learning Compass",
  supportingText = "You're 2 topics away from mastering Algorithms level 1.",
  className = "",
}) {
  return (
    <div className={`flex flex-col justify-center ${className}`}>
      <div className="flex items-start gap-2 mb-2 text-primary opacity-80">
        <Quote className="w-5 h-5 flex-shrink-0 fill-primary/20 rotate-180" />
        <span className="font-pixel text-[11px] tracking-widest text-primary uppercase font-bold">
          Daily Motivation
        </span>
      </div>

      {/* Quote Text */}
      <blockquote className="text-lg sm:text-xl font-bold text-ink leading-snug font-sans tracking-tight">
        "{quote}"
      </blockquote>

      {/* Author and Supporting context */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
        <span className="font-pixel text-xs font-semibold text-primary">
          — {author}
        </span>
        {supportingText && (
          <>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-ink-secondary">
              {supportingText}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
