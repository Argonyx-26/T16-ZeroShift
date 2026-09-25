import React from 'react';
import { Bookmark, Check, Circle } from 'lucide-react';

export default function QuestionNavigator({
  totalQuestions = 10,
  currentIndex = 0,
  answers = {}, // { 0: 'a', 1: 'c' }
  markedForReview = {}, // { 2: true }
  onSelectQuestion,
}) {
  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-4 sm:p-5 select-none">
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 mb-3">
        <h4 className="font-pixel text-xs font-bold text-ink uppercase tracking-wider">
          Question Palette
        </h4>
        <span className="text-[11px] font-mono text-ink-secondary">
          {Object.keys(answers).length}/{totalQuestions} Answered
        </span>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-5 gap-2 mb-4">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = answers[idx] !== undefined && answers[idx] !== null;
          const isMarked = !!markedForReview[idx];

          let btnClass = "bg-slate-100 text-ink-secondary border-slate-300 hover:bg-slate-200";

          if (isAnswered) {
            btnClass = "bg-learning-soft text-learning-hover border-learning font-bold shadow-[1px_1px_0px_#16A34A]";
          }
          if (isMarked) {
            btnClass = "bg-warning-soft text-amber-800 border-warning font-bold shadow-[1px_1px_0px_#D97706]";
          }
          if (isCurrent) {
            btnClass = "bg-primary text-white border-slate-900 shadow-pixel ring-2 ring-primary ring-offset-1 font-bold";
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(idx)}
              className={`relative h-9 rounded-lg border-2 flex items-center justify-center font-pixel text-xs transition-all ${btnClass}`}
              title={`Question ${idx + 1}`}
            >
              <span>{idx + 1}</span>
              {isMarked && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning border border-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 text-[10px] font-pixel text-ink-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-learning-soft border border-learning" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-primary border border-slate-900" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-warning-soft border border-warning" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
}
