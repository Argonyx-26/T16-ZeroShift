import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';
import MCQTestCard from '../components/mcq/MCQTestCard';
import { CheckSquare, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import PenguMascot from '../components/common/PenguMascot';
import PixelBadge from '../components/common/PixelBadge';

export default function MCQsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const allTests = await learningService.getTests(user?.id);
        setTests(allTests);
      } catch (err) {
        console.warn('Failed to load tests:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTests();
  }, [user]);

  // Split EXACTLY into two major sections: Attempted and Completed
  const attemptedTests = tests.filter((t) => t.status === 'ongoing' || t.status === 'attempted');
  const completedTests = tests.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Banner with Pengu */}
      <div className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning-soft border border-warning/30 text-xs font-pixel font-bold text-warning mb-3">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Interactive Diagnostic Exams</span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl font-bold text-ink">
            MCQ Practice & Mastery Tests
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-secondary max-w-xl">
            Each quiz feeds directly into the Bayesian Knowledge Tracing engine to pinpoint root-cause misconceptions and schedule retention revisions.
          </p>
        </div>

        <div className="flex-shrink-0">
          <PenguMascot
            pose="point"
            size="md"
            speech="Test your skills!"
            speechPosition="top"
            alt="Pengu MCQ Mascot"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="font-pixel text-xs text-ink font-bold">Loading your test history...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: ATTEMPTED */}
          <section aria-labelledby="attempted-heading" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-warning-soft border-2 border-slate-900 shadow-pixel-sm flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h2 id="attempted-heading" className="font-pixel text-lg font-bold text-ink uppercase tracking-wide">
                    Attempted Tests
                  </h2>
                  <p className="text-xs text-ink-secondary">
                    Ongoing quizzes awaiting completion. Resume right where you paused.
                  </p>
                </div>
              </div>

              <PixelBadge variant="yellow" size="md">
                {attemptedTests.length} Active
              </PixelBadge>
            </div>

            {attemptedTests.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-2xl border-2 border-dashed border-slate-300">
                <p className="font-pixel text-xs text-ink font-bold">No tests currently in progress.</p>
                <p className="text-xs text-ink-secondary mt-1">Start a topic quiz from the Syllabus page to see your progress here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attemptedTests.map((test) => (
                  <MCQTestCard key={test.test_id} test={test} />
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: COMPLETED */}
          <section aria-labelledby="completed-heading" className="space-y-4 pt-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-learning-soft border-2 border-slate-900 shadow-pixel-sm flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-learning" />
                </div>
                <div>
                  <h2 id="completed-heading" className="font-pixel text-lg font-bold text-ink uppercase tracking-wide">
                    Completed Tests
                  </h2>
                  <p className="text-xs text-ink-secondary">
                    Evaluated quizzes with saved BKT scores and accuracy records.
                  </p>
                </div>
              </div>

              <PixelBadge variant="green" size="md">
                {completedTests.length} Passed
              </PixelBadge>
            </div>

            {completedTests.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-2xl border-2 border-dashed border-slate-300">
                <p className="font-pixel text-xs text-ink font-bold">No completed tests yet.</p>
                <p className="text-xs text-ink-secondary mt-1">Reach 85% mastery on a topic to mark it complete.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedTests.map((test) => (
                  <MCQTestCard key={test.test_id} test={test} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
