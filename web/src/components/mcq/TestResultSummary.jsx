import React from 'react';
import { Trophy, CheckCircle, XCircle, Clock, RotateCcw, ArrowLeft, Award, Sparkles } from 'lucide-react';
import PenguMascot from '../common/PenguMascot';
import PixelBadge from '../common/PixelBadge';

export default function TestResultSummary({
  testTitle = 'Data Structures - Trees',
  score = 16,
  total = 20,
  timeTaken = '14:32',
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
        Your Bayesian Knowledge Tracing scores have been updated for <strong>{testTitle}</strong>.
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
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
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
