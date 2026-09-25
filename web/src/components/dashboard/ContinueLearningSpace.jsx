import React from 'react';
import { Compass, Sparkles, BookOpen, AlertCircle, ArrowRight, Play, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PenguMascot from '../common/PenguMascot';
import PixelBadge from '../common/PixelBadge';

export default function ContinueLearningSpace() {
  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <h3 className="font-pixel text-lg font-bold text-ink">Your Learning Space</h3>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Personalized recommendations, upcoming tests, and adaptive study suggestions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PixelBadge variant="arcade" size="sm" icon={Sparkles}>
            Adaptive AI Ready
          </PixelBadge>
        </div>
      </div>

      {/* Recommended Focus Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Weak topic focus */}
        <div className="p-4 rounded-xl bg-blue-50/50 border-2 border-slate-900 shadow-pixel-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] font-bold text-primary uppercase tracking-wider">
                Recommended Focus
              </span>
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <h4 className="font-bold text-sm text-ink mb-1">Binary Tree Level-Order</h4>
            <p className="text-xs text-ink-secondary mb-3">
              Your last MCQ showed a small slip on queue discovery order. Reinforce with a 5-min practice!
            </p>
          </div>
          <Link
            to="/mcqs"
            className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-primary hover:text-primary-hover group"
          >
            <span>Review Question</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Recommended Video */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border-2 border-slate-900 shadow-pixel-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] font-bold text-learning uppercase tracking-wider">
                Top Video Resource
              </span>
              <Play className="w-3.5 h-3.5 text-learning fill-learning" />
            </div>
            <h4 className="font-bold text-sm text-ink mb-1">Dynamic Programming Memoization</h4>
            <p className="text-xs text-ink-secondary mb-3">
              Curated by TakeUForward & NeetCode for intuitive recursion-to-table transition.
            </p>
          </div>
          <Link
            to="/syllabus"
            className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-learning-hover hover:text-learning group"
          >
            <span>Watch in Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Upcoming Checkpoint */}
        <div className="p-4 rounded-xl bg-amber-50/50 border-2 border-slate-900 shadow-pixel-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] font-bold text-warning uppercase tracking-wider">
                Upcoming Checkpoint
              </span>
              <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">
                20 mins
              </span>
            </div>
            <h4 className="font-bold text-sm text-ink mb-1">Weekly DSA Mastery Quiz</h4>
            <p className="text-xs text-ink-secondary mb-3">
              Scheduled revision test anchored to your forgetting-curve memory decay score.
            </p>
          </div>
          <Link
            to="/mcqs"
            className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-amber-700 hover:text-amber-800 group"
          >
            <span>Start Test</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Spacious Open Area with Friendly Pengu Companion Note */}
      <div className="mt-8 p-6 rounded-2xl bg-slate-50/60 border-2 border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <PenguMascot pose="teacher" size="sm" alt="Pengu Guide" animate={false} />
          <div>
            <h5 className="font-pixel text-xs font-bold text-ink uppercase tracking-wider">
              More Widgets Arriving Here
            </h5>
            <p className="text-xs text-ink-secondary mt-0.5">
              Real-time code submissions, peer group discussion threads, and root-cause prerequisite maps will automatically populate this space.
            </p>
          </div>
        </div>

        <Link
          to="/syllabus"
          className="pixel-btn-secondary text-xs font-bold whitespace-nowrap"
        >
          Explore All Materials
        </Link>
      </div>
    </div>
  );
}
