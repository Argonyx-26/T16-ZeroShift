import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, HelpCircle, CheckCircle, ArrowRight, Play, Award, RotateCcw } from 'lucide-react';
import PixelBadge from '../common/PixelBadge';
import PixelProgressBar from '../common/PixelProgressBar';

export default function MCQTestCard({ test }) {
  const navigate = useNavigate();

  const isCompleted = test.status === 'completed';

  const handleStartOrReview = () => {
    // Navigate in the SAME browser tab — always start fresh (no resume)
    navigate(`/mcqs/test/${test.test_id}`);
  };

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel hover:shadow-pixel-lg hover:-translate-y-0.5 transition-all p-5 sm:p-6 flex flex-col justify-between">
      <div>
        {/* Header badges: Domain, Difficulty, Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs font-bold text-primary uppercase tracking-wide">
              {test.domain || 'DSA'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-ink-secondary font-medium truncate max-w-[200px]">
              {test.topic_name || test.topic_id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PixelBadge variant={test.difficulty === 'hard' ? 'red' : test.difficulty === 'intermediate' ? 'yellow' : 'blue'} size="sm">
              {test.difficulty || 'Normal'}
            </PixelBadge>

            <PixelBadge
              variant={isCompleted ? 'green' : 'blue'}
              size="sm"
              icon={isCompleted ? CheckCircle : Play}
            >
              {isCompleted ? 'Completed' : 'Available'}
            </PixelBadge>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg text-ink mb-3 leading-snug">
          {test.title}
        </h3>

        {/* Date and Time Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-slate-200 text-xs mb-4 bg-slate-50/50 rounded-xl px-3">
          <div className="flex items-center gap-2 text-ink-secondary">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-ink">{test.day}</p>
              <p className="text-[10px] text-slate-400">{test.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-ink-secondary">
            <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-ink">{test.total_questions} Questions</p>
              <p className="text-[10px] text-slate-400">
                {isCompleted ? `${test.attempted_questions || test.total_questions} Completed` : 'Not Started'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-ink-secondary">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-ink">Duration</p>
              <p className="text-[10px] text-slate-400">{test.duration}</p>
            </div>
          </div>
        </div>

        {/* Progress or Score */}
        <div className="mb-4">
          {isCompleted ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-learning-soft border border-learning text-xs">
              <span className="font-pixel font-bold text-learning-hover flex items-center gap-1.5">
                <Award className="w-4 h-4 text-learning" /> Final Score: {test.score}
              </span>
              <span className="font-pixel font-bold text-learning-hover">
                {test.progress_percentage}% Accuracy
              </span>
            </div>
          ) : (
            <PixelProgressBar
              progress={test.progress_percentage || 0}
              variant="blue"
              showLabel={true}
            />
          )}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-[11px] text-ink-secondary font-medium">
          {isCompleted ? 'Completed quiz. Retake anytime.' : 'Takes a fresh attempt each time'}
        </span>

        <button
          onClick={handleStartOrReview}
          className={`${
            isCompleted ? 'pixel-btn-secondary' : 'pixel-btn-primary'
          } text-xs !py-1.5 !px-3.5 inline-flex items-center gap-1.5`}
        >
          {isCompleted ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Test</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
