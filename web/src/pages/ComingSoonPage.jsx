import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PenguMascot from '../components/common/PenguMascot';
import PixelBadge from '../components/common/PixelBadge';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';

export default function ComingSoonPage() {
  const location = useLocation();

  const isProfile = location.pathname.includes('profile');
  const title = isProfile ? 'Learner Profile & Stats' : 'VS-Code Extension Docs & Socratic Companion';
  const description = isProfile
    ? 'Comprehensive knowledge mastery radar, historical diagnostic charts, and skill badges are under active development.'
    : 'Detailed documentation, hotkey cheat-sheets, and Ollama Socratic companion setup guides are arriving in the next milestone release.';

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center animate-fade-in">
      <div className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-8 sm:p-12">
        <div className="flex justify-center mb-4">
          <PenguMascot
            pose="teacher"
            size="lg"
            speech="Under Construction!"
            speechPosition="top"
            alt="Pengu Working"
          />
        </div>

        <PixelBadge variant="arcade" size="md" className="mb-3">
          Coming Soon
        </PixelBadge>

        <h1 className="font-pixel text-2xl font-bold text-ink mb-2">
          {title}
        </h1>

        <p className="text-xs sm:text-sm text-ink-secondary mb-6 leading-relaxed">
          {description}
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-ink-secondary mb-6 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>Scheduled for release in Platform Sprint 3.</span>
        </div>

        <Link
          to="/dashboard"
          className="pixel-btn-primary text-xs inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
