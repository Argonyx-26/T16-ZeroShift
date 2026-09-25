import React from 'react';
import { CheckCircle, Clock, BookMarked, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import PixelProgressBar from '../common/PixelProgressBar';
import PixelBadge from '../common/PixelBadge';
import { Link } from 'react-router-dom';

export default function LearningProgress({
  coveredTopics = [],
  activeTopics = [],
}) {
  const covered = Array.isArray(coveredTopics) ? coveredTopics : [];
  const active = Array.isArray(activeTopics) ? activeTopics : [];

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-pixel text-base font-bold text-ink">Learning Progress</h3>
        </div>
        <Link
          to="/syllabus"
          className="inline-flex items-center gap-1 text-xs font-pixel font-bold text-primary hover:text-primary-hover transition-colors"
        >
          <span>View Curriculum</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Two Halves: Left = Covered, Right = Currently Covering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Covered Topics */}
        <div className="bg-slate-50/70 rounded-xl p-4 border-2 border-slate-900 shadow-pixel-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 mb-3">
              <span className="font-pixel text-xs font-bold uppercase tracking-wider text-learning-hover flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-learning" /> Covered Topics
              </span>
              <span className="text-[11px] font-pixel font-bold text-slate-500">
                {covered.length} Mastered
              </span>
            </div>

            {covered.length === 0 ? (
              <div className="py-8 text-center px-4">
                <p className="font-pixel text-xs text-ink-secondary">
                  No topics mastered yet. Reach 85% Bayesian mastery in a topic to complete it!
                </p>
                <Link
                  to="/mcqs"
                  className="mt-3 inline-block font-pixel text-xs font-bold text-primary hover:underline"
                >
                  Start Practice →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {covered.map((item) => (
                  <div
                    key={item.topic_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-slate-300 hover:border-learning transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-learning-soft text-learning flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                      <div>
                        <p className="font-bold text-xs text-ink">{item.topic_name}</p>
                        <p className="text-[10px] text-ink-secondary">{item.subject}</p>
                      </div>
                    </div>
                    <PixelBadge variant="green" size="sm">
                      Done
                    </PixelBadge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <span className="text-[11px] text-ink-secondary font-medium">
              Reinforced through spaced forgetting-curve review.
            </span>
          </div>
        </div>

        {/* RIGHT: Currently Covering */}
        <div className="bg-slate-50/70 rounded-xl p-4 border-2 border-slate-900 shadow-pixel-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 mb-3">
              <span className="font-pixel text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" /> Currently Covering
              </span>
              <span className="text-[11px] font-pixel font-bold text-slate-500">
                {active.length} In Progress
              </span>
            </div>

            {active.length === 0 ? (
              <div className="py-8 text-center px-4">
                <p className="font-pixel text-xs text-ink-secondary">
                  No active topics. Pick a topic from the curriculum to begin learning!
                </p>
                <Link
                  to="/syllabus"
                  className="mt-3 inline-block font-pixel text-xs font-bold text-primary hover:underline"
                >
                  Browse Topics →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {active.map((item) => {
                  const variant =
                    item.progress_percentage >= 60
                      ? 'blue'
                      : item.progress_percentage >= 40
                      ? 'yellow'
                      : 'yellow';

                  return (
                    <div
                      key={item.topic_id}
                      className="p-3 rounded-lg bg-surface border border-slate-300 hover:border-primary transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-ink">{item.topic_name}</span>
                        <PixelBadge variant={variant} size="sm">
                          {item.difficulty || 'Active'}
                        </PixelBadge>
                      </div>

                      <PixelProgressBar
                        progress={item.progress_percentage}
                        variant={variant}
                        showLabel={true}
                      />

                      <div className="flex items-center justify-between mt-2 text-[10px] text-ink-secondary">
                        <span>{item.subject}</span>
                        <span className="font-medium text-slate-500">{item.remaining}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-ink-secondary font-medium">Adaptive mastery goal: 85%</span>
            <Link to="/mcqs" className="font-pixel text-primary hover:underline font-bold">
              Practice Now →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
