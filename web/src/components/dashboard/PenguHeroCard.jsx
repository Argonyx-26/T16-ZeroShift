import React from 'react';
import PenguMascot from '../common/PenguMascot';
import PenguQuote from './PenguQuote';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PenguHeroCard({
  userName = 'Learner',
  quote = "Small steps each day build giant leaps in understanding. Keep going!",
  author = "Pengu's Learning Compass",
  supportingText = "You're 2 topics away from mastering Data Structures level 1.",
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-slate-900 shadow-pixel bg-gradient-to-br from-white via-blue-50/40 to-emerald-50/40 p-6 sm:p-8">
      {/* Background decorative pixel grid dots */}
      <div className="absolute inset-0 pixel-grid-dots opacity-40 pointer-events-none" />

      {/* Decorative top badge */}
      <div className="relative z-10 flex items-center justify-between gap-4 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-900 shadow-pixel-sm text-xs font-pixel font-bold text-primary">
          <Sparkles className="w-3.5 h-3.5 text-warning" />
          <span>Welcome back, {userName}!</span>
        </div>

        <Link
          to="/syllabus"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover font-pixel transition-colors group"
        >
          <span>Continue Syllabus</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Hero content grid: Pengu mascot on left, Quote on right */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Pengu mascot column */}
        <div className="md:col-span-4 flex justify-center md:justify-start">
          <div className="relative p-2 bg-white/70 rounded-2xl border-2 border-slate-900 shadow-pixel-sm">
            <PenguMascot
              pose="wave"
              size="lg"
              speech="Ready to code today?"
              speechPosition="top"
              alt="Pengu Welcome Mascot"
            />
          </div>
        </div>

        {/* Quote & message column */}
        <div className="md:col-span-8">
          <PenguQuote
            quote={quote}
            author={author}
            supportingText={supportingText}
          />
        </div>
      </div>
    </div>
  );
}
