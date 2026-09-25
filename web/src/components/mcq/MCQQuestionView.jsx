import React from 'react';
import { Bookmark, BookmarkCheck, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';
import PixelBadge from '../common/PixelBadge';

export default function MCQQuestionView({
  question,
  questionNumber = 1,
  totalQuestions = 10,
  selectedOption = null,
  isMarkedForReview = false,
  onSelectOption,
  onToggleMarkForReview,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
}) {
  if (!question) return null;

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 flex flex-col justify-between min-h-[480px]">
      <div>
        {/* Question Header: Number, Topic, Mark for review */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="font-pixel text-sm font-bold bg-slate-900 text-yellow-300 px-2.5 py-1 rounded-md border border-slate-900 shadow-pixel-sm">
              Q{questionNumber}
            </span>
            <span className="text-xs text-ink-secondary font-pixel uppercase font-bold tracking-wider">
              {question.topic_id || 'Concept'}
            </span>
            <PixelBadge variant={question.difficulty === 'hard' ? 'red' : question.difficulty === 'intermediate' ? 'yellow' : 'blue'} size="sm">
              {question.difficulty || 'Easy'}
            </PixelBadge>
          </div>

          <button
            onClick={onToggleMarkForReview}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-slate-900 font-pixel text-xs transition-all ${
              isMarkedForReview
                ? 'bg-warning-soft text-amber-800 border-amber-600 shadow-pixel-sm font-bold'
                : 'bg-white text-ink-secondary hover:bg-slate-100'
            }`}
          >
            {isMarkedForReview ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-warning fill-warning" />
                <span>Flagged</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Mark for Review</span>
              </>
            )}
          </button>
        </div>

        {/* Question Prompt */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-bold text-ink leading-relaxed font-sans">
            {question.prompt}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Question Options">
          {question.options?.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const isSelected = selectedOption === option.option_id;

            return (
              <button
                key={option.option_id}
                onClick={() => onSelectOption(option.option_id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-150 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-primary-soft border-primary text-primary font-bold shadow-pixel-blue translate-x-1'
                    : 'bg-surface border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-ink'
                }`}
                role="radio"
                aria-checked={isSelected}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-pixel text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-100 text-ink-secondary border-slate-300 group-hover:border-slate-900'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-sans leading-normal">
                    {option.option_text}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 flex-shrink-0 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-300 group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons: Previous & Next */}
      <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`pixel-btn-secondary text-xs inline-flex items-center gap-2 ${
            !canGoPrevious ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`pixel-btn-primary text-xs inline-flex items-center gap-2 ${
            !canGoNext ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
