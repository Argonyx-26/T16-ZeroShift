import React from 'react';
import { useAuth } from '../context/AuthContext';
import PenguHeroCard from '../components/dashboard/PenguHeroCard';
import DailyLoginCalendar from '../components/dashboard/DailyLoginCalendar';
import LearningProgress from '../components/dashboard/LearningProgress';
import ContinueLearningSpace from '../components/dashboard/ContinueLearningSpace';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcoming Hero Card with Pengu + Reusable Quote */}
      <PenguHeroCard
        userName={user?.name || 'Learner'}
        quote="Every bug you diagnose today becomes second nature tomorrow. Trust the process!"
        author="Pengu's Learning Compass"
        supportingText="Targeting SDE Readiness • 12 Week Adaptive Roadmap"
      />

      {/* 2. Daily Login Calendar & Learning Progress Grid */}
      <div className="grid grid-cols-1 gap-8">
        <DailyLoginCalendar
          currentStreak={5}
          totalActiveDays={22}
        />

        <LearningProgress />
      </div>

      {/* 3. Spacious Open Learning Space */}
      <ContinueLearningSpace />
    </div>
  );
}
