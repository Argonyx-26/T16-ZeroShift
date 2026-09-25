import React from 'react';
import { Link } from 'react-router-dom';
import PenguMascot from '../components/common/PenguMascot';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center pixel-grid-dots">
      <div className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-8 sm:p-12 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <PenguMascot
            pose="peek"
            size="lg"
            speech="Oops! Page not found"
            speechPosition="top"
          />
        </div>

        <h1 className="font-pixel text-4xl font-bold text-ink mb-1">404</h1>
        <h2 className="font-pixel text-base font-bold text-ink mb-3">Lost in the Snow?</h2>
        <p className="text-xs text-ink-secondary mb-6">
          The page you requested doesn't exist or has moved. Let's head back home!
        </p>

        <Link to="/dashboard" className="pixel-btn-primary text-xs inline-flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
