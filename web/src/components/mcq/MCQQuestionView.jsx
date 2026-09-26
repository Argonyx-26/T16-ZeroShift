import React from 'react';
import { Bookmark, BookmarkCheck, ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
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
  isReviewMode = false,
}) {
  if (!question) return null;

  const correctOptionId = question.correct_option_id;

  const getOptionStyle = (optionId) => {
    if (!isReviewMode) {
      const isSelected = selectedOption === optionId;
      return isSelected
        ? 'bg-primary-soft border-primary text-primary font-bold shadow-pixel-blue translate-x-1'
        : 'bg-surface border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-ink';
    }
    // Review mode: colour-code correct / wrong
    const isCorrect = optionId === correctOptionId;
    const isChosen = optionId === selectedOption;

    if (isCorrect) return 'bg-learning-soft border-learning text-learning-hover font-bold';
    if (isChosen && !isCorrect) return 'bg-error-soft border-error text-error font-bold';
    return 'bg-surface border-slate-200 text-ink-secondary opacity-60';
  };

  const getLetterStyle = (optionId) => {
    if (!isReviewMode) {
      return selectedOption === optionId
        ? 'bg-primary text-white border-primary'
        : 'bg-slate-100 text-ink-secondary border-slate-300 group-hover:border-slate-900';
    }
    const isCorrect = optionId === correctOptionId;
    const isChosen = optionId === selectedOption;
    if (isCorrect) return 'bg-learning text-white border-learning';
    if (isChosen && !isCorrect) return 'bg-error text-white border-error';
    return 'bg-slate-100 text-ink-secondary border-slate-300';
  };

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

          {!isReviewMode && (
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
          )}

          {isReviewMode && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-pixel text-xs font-bold ${
              selectedOption === correctOptionId
                ? 'bg-learning-soft border-learning text-learning-hover'
                : 'bg-error-soft border-error text-error'
            }`}>
              {selectedOption === correctOptionId ? (
                <><CheckCircle className="w-3.5 h-3.5" /><span>Correct</span></>
              ) : selectedOption ? (
                <><XCircle className="w-3.5 h-3.5" /><span>Incorrect</span></>
              ) : (
                <><XCircle className="w-3.5 h-3.5" /><span>Skipped</span></>
              )}
            </div>
          )}
        </div>

        {/* Question Prompt */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-bold text-ink leading-relaxed font-sans">
            {question.prompt}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3 mb-4" role="radiogroup" aria-label="Question Options">
          {question.options?.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const isChosen = selectedOption === option.option_id;
            const isCorrect = option.option_id === correctOptionId;

            return (
              <button
                key={option.option_id}
                onClick={() => !isReviewMode && onSelectOption(option.option_id)}
                disabled={isReviewMode}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-150 flex items-center justify-between group ${getOptionStyle(option.option_id)} ${isReviewMode ? 'cursor-default' : ''}`}
                role="radio"
                aria-checked={isChosen}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-pixel text-xs font-bold transition-colors ${getLetterStyle(option.option_id)}`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-sans leading-normal">
                    {option.option_text}
                  </span>
                </div>

                <div className="ml-3 flex-shrink-0">
                  {isReviewMode ? (
                    isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-learning" />
                    ) : isChosen ? (
                      <XCircle className="w-5 h-5 text-error" />
                    ) : null
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChosen
                          ? 'border-primary bg-primary text-white'
                          : 'border-slate-300 group-hover:border-slate-400'
                      }`}
                    >
                      {isChosen && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Review Mode Legend */}
        {isReviewMode && (
          <div className="flex items-center gap-4 text-xs text-ink-secondary mb-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-learning inline-block" />
              Correct answer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-error inline-block" />
              Your wrong pick
            </span>
          </div>
        )}
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
