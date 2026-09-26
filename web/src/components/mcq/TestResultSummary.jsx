import React from 'react';
import { Trophy, CheckCircle, XCircle, Clock, RotateCcw, ArrowLeft, Award, Sparkles, Check, X } from 'lucide-react';
import PenguMascot from '../common/PenguMascot';
import PixelBadge from '../common/PixelBadge';

export default function TestResultSummary({
  testTitle = 'Data Structures - Trees',
  score = 16,
  total = 20,
  timeTaken = '14:32',
  questions = [],
  answers = {},
  onBackToMCQs,
  onReviewAnswers,
}) {
  const accuracy = Math.round((score / total) * 100);
  const correct = score;
  const incorrect = total - score;

  const isGreat = accuracy >= 80;

  return (
    <div className="max-w-2xl mx-auto bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-6 sm:p-10 text-center animate-fade-in">
      {/* Pengu with Goal Flag */}
      <div className="flex justify-center mb-4">
        <PenguMascot
          pose="goal"
          size="lg"
          speech={isGreat ? "Outstanding work!" : "Great practice run!"}
          speechPosition="top"
          alt="Pengu Goal Milestone"
        />
      </div>

      <PixelBadge variant={isGreat ? "green" : "yellow"} size="md" className="mb-2">
        {isGreat ? "Mastery Threshold Met" : "Practice Completed"}
      </PixelBadge>

      <h2 className="font-pixel text-2xl sm:text-3xl font-bold text-ink mb-1">
        Test Completed!
      </h2>
      <p className="text-xs sm:text-sm text-ink-secondary mb-8">
        Your test results and knowledge scores have been updated for <strong>{testTitle}</strong>.
      </p>

      {/* Primary Score Spotlight */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-slate-900 shadow-pixel mb-8">
        <div className="flex items-center justify-center gap-2 text-primary font-pixel text-xs font-bold uppercase mb-2">
          <Award className="w-4 h-4 text-warning" /> Final Score
        </div>
        <div className="font-pixel text-4xl sm:text-5xl font-bold text-ink tracking-tight">
          {score} <span className="text-2xl text-slate-400">/ {total}</span>
        </div>
        <p className="text-xs font-bold text-primary font-pixel mt-2">
          {accuracy}% Overall Accuracy
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="p-3.5 rounded-xl bg-learning-soft border-2 border-slate-900 shadow-pixel-sm">
          <CheckCircle className="w-5 h-5 text-learning mx-auto mb-1" />
          <p className="font-pixel text-lg font-bold text-learning-hover">{correct}</p>
          <p className="text-[10px] font-pixel text-ink-secondary uppercase">Correct</p>
        </div>

        <div className="p-3.5 rounded-xl bg-error-soft border-2 border-slate-900 shadow-pixel-sm">
          <XCircle className="w-5 h-5 text-error mx-auto mb-1" />
          <p className="font-pixel text-lg font-bold text-error">{incorrect}</p>
          <p className="text-[10px] font-pixel text-ink-secondary uppercase">Incorrect</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-100 border-2 border-slate-900 shadow-pixel-sm">
          <Clock className="w-5 h-5 text-slate-600 mx-auto mb-1" />
          <p className="font-pixel text-lg font-bold text-ink">{timeTaken}</p>
          <p className="text-[10px] font-pixel text-ink-secondary uppercase">Time Taken</p>
        </div>
      </div>

      {/* Question Breakdown - Marks wrong questions in RED and correct in GREEN */}
      {questions && questions.length > 0 && (
        <div className="mb-8 p-4 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-pixel-sm text-left">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <h4 className="font-pixel text-xs font-bold text-ink uppercase tracking-wider">
              Question-by-Question Result
            </h4>
            <div className="flex items-center gap-3 text-[10px] font-pixel">
              <span className="flex items-center gap-1 text-learning-hover">
                <span className="w-2.5 h-2.5 rounded-full bg-learning inline-block" /> Correct ({correct})
              </span>
              <span className="flex items-center gap-1 text-error">
                <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" /> Wrong ({incorrect})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.correct_option_id;
              return (
                <button
                  key={idx}
                  onClick={() => onReviewAnswers(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-pixel text-xs transition-transform hover:scale-105 ${
                    isCorrect
                      ? 'bg-learning-soft text-learning-hover border-learning shadow-[1.5px_1.5px_0px_#16A34A]'
                      : 'bg-error-soft text-error border-error shadow-[1.5px_1.5px_0px_#EF4444]'
                  }`}
                  title={isCorrect ? `Question ${idx + 1}: Correct` : `Question ${idx + 1}: Wrong - Click to review`}
                >
                  {isCorrect ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                  <span>Q{idx + 1}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-ink-secondary mt-3 text-center">
            Click <strong>Review Answers</strong> below to see detailed explanations and right choices.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onBackToMCQs}
          className="pixel-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to MCQs</span>
        </button>

        <button
          onClick={onReviewAnswers}
          className="pixel-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Review Answers</span>
        </button>
      </div>
    </div>
  );
}
