import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';
import PenguMascot from '../components/common/PenguMascot';
import PixelBadge from '../components/common/PixelBadge';
import PixelProgressBar from '../components/common/PixelProgressBar';
import {
  LogOut,
  Mail,
  Calendar,
  Flame,
  Award,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Layers,
  Code,
  Database,
  Globe,
  RefreshCw,
} from 'lucide-react';

const TOPIC_ICONS = {
  'Data Structures': Layers,
  'Algorithms': Code,
  'DBMS': Database,
  'Web Development': Globe,
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await learningService.getUserLearningProfile(user?.id);
      setProfileData(data);
    } catch (err) {
      console.error('Failed to load profile learning data:', err);
      setError('Could not retrieve learning progress. Showing offline data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel p-6 sm:p-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-4 w-full md:w-2/3">
            <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded-xl w-1/3" />
          </div>
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-200 border-2 border-slate-300" />
        </div>
        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-surface rounded-2xl border-2 border-slate-200 p-5 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const progressingTopics = profileData?.progressingTopics || [];
  const lowMasteryTopics = profileData?.lowMasteryTopics || [];

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* ============================================================== */}
      {/* 1. PROFILE HEADER                                              */}
      {/* ============================================================== */}
      <section className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative dots */}
        <div className="absolute inset-0 pixel-grid-dots opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col-reverse md:flex-row items-center md:items-start justify-between gap-8">
          {/* Left Column: User details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/30 text-xs font-pixel font-bold text-primary">
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span>{profileData?.learnerStatus || 'Student / Learning Companion'}</span>
            </div>

            {/* User Name */}
            <div>
              <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
                {user?.name || 'Pengu Explorer'}
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1 flex items-center justify-center md:justify-start gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email || 'learner@argonyx.edu'}</span>
              </p>
            </div>

            {/* Streak & Join Date Meta Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border-2 border-slate-900 shadow-pixel-sm text-xs font-pixel font-bold text-ink">
                <Flame className="w-4 h-4 text-warning fill-warning animate-pulse" />
                <span>{profileData?.streakDays || 5} Day Streak</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs text-ink-secondary font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Joined {profileData?.joinDate || 'September 2026'}</span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="pixel-btn-secondary !text-xs !py-2 !px-4 inline-flex items-center gap-2 text-error hover:!border-error hover:bg-error-soft transition-all"
                title="Sign out of your session"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-pixel font-bold">Logout</span>
              </button>
            </div>
          </div>

          {/* Right Column: Profile Image (140-180px desktop, circular, subtle border & shadow) */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-slate-900 shadow-pixel-lg overflow-hidden bg-gradient-to-br from-blue-100 via-white to-emerald-100 flex items-center justify-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-primary-soft">
                  <PenguMascot pose="peek" size="hero" alt="Pengu Avatar" animate={false} />
                </div>
              )}
            </div>
            <span className="mt-2 text-[11px] font-pixel font-bold text-ink-secondary uppercase tracking-wider">
              Learner Avatar
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. CURRENTLY PROGRESSING TOPICS                                */}
      {/* ============================================================== */}
      <section aria-labelledby="progressing-heading" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-soft border-2 border-slate-900 shadow-pixel-sm flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 id="progressing-heading" className="font-pixel text-lg font-bold text-ink uppercase tracking-wide">
                Currently Learning
              </h2>
              <p className="text-xs text-ink-secondary">
                Active concepts you're steadily advancing through across your courses.
              </p>
            </div>
          </div>

          <PixelBadge variant="blue" size="md">
            {progressingTopics.length} Active Topics
          </PixelBadge>
        </div>

        {progressingTopics.length === 0 ? (
          <div className="p-8 text-center bg-surface rounded-2xl border-2 border-dashed border-slate-300">
            <p className="font-pixel text-xs text-ink font-bold">No active topics yet.</p>
            <p className="text-xs text-ink-secondary mt-1">Start learning a topic in Syllabus to see your progress here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {progressingTopics.map((topic) => {
              const IconComponent = TOPIC_ICONS[topic.subject] || BookOpen;
              const isMastered = topic.progress_percentage >= 80;

              return (
                <div
                  key={topic.topic_id}
                  className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel hover:shadow-pixel-lg hover:-translate-y-1 transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Icon, Subject, Difficulty */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center text-primary">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-pixel uppercase font-bold text-ink-secondary">
                          {topic.subject}
                        </span>
                      </div>

                      <PixelBadge
                        variant={topic.difficulty === 'Hard' ? 'red' : topic.difficulty === 'Intermediate' ? 'yellow' : 'blue'}
                        size="sm"
                      >
                        {topic.difficulty || 'Core'}
                      </PixelBadge>
                    </div>

                    {/* Topic Name */}
                    <h3 className="font-bold text-sm text-ink mb-3 leading-snug line-clamp-2">
                      {topic.topic_name}
                    </h3>

                    {/* Progress Bar (Blue for active, Green for mastered) */}
                    <div className="mb-3">
                      <PixelProgressBar
                        progress={topic.progress_percentage}
                        variant={isMastered ? 'green' : 'blue'}
                        showLabel={true}
                      />
                    </div>
                  </div>

                  {/* Card Footer: Last studied & completed resources */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-ink-secondary">
                    <span>Last studied: <strong className="text-ink">{topic.last_studied}</strong></span>
                    {topic.resources_completed && (
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {topic.resources_completed}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 3. LOW MASTERY SECTION (< 50%)                                 */}
      {/* ============================================================== */}
      <section aria-labelledby="attention-heading" className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-warning-soft border-2 border-slate-900 shadow-pixel-sm flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div>
              <h2 id="attention-heading" className="font-pixel text-lg font-bold text-ink uppercase tracking-wide">
                Topics That Need Attention
              </h2>
              <p className="text-xs text-ink-secondary">
                Concepts where estimated Bayesian mastery is currently below 50%. Focus revision here!
              </p>
            </div>
          </div>

          <PixelBadge variant="yellow" size="md">
            {lowMasteryTopics.length} Focus Topics
          </PixelBadge>
        </div>

        {lowMasteryTopics.length === 0 ? (
          /* Positive empty state with Pengu Goal mascot */
          <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-8 text-center space-y-3">
            <div className="flex justify-center">
              <PenguMascot pose="goal" size="md" alt="Pengu Goal Celebration" />
            </div>
            <h3 className="font-pixel text-base font-bold text-learning-hover">
              You're currently above the 50% mastery threshold across your tracked topics!
            </h3>
            <p className="text-xs text-ink-secondary max-w-md mx-auto">
              Superb work! Your prerequisite foundations are solid. Continue taking MCQs to push towards 90%+ mastery!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {lowMasteryTopics.map((topic) => (
              <div
                key={topic.topic_id}
                className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-4 sm:p-5 hover:border-amber-600 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {topic.subject}
                    </span>
                    <span className="text-xs text-ink-secondary">
                      Last attempted: {topic.last_attempted} ({topic.attempt_count} attempts)
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-ink">
                    {topic.topic_name}
                  </h3>

                  <p className="text-xs text-ink-secondary">
                    💡 <strong>Recommended step:</strong> {topic.recommended_action}
                  </p>
                </div>

                {/* Mastery Bar + Action */}
                <div className="w-full md:w-60 flex-shrink-0 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-pixel text-amber-700 font-bold">Mastery Level</span>
                    <span className="font-pixel font-bold text-ink">{topic.mastery_percentage}%</span>
                  </div>
                  <PixelProgressBar
                    progress={topic.mastery_percentage}
                    variant="yellow"
                    showLabel={false}
                    height="h-3"
                  />
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => navigate('/mcqs')}
                      className="pixel-btn-primary !text-[11px] !py-1 !px-3 inline-flex items-center gap-1.5"
                    >
                      <span>Practice Topic</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
