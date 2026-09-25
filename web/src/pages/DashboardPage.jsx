import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';
import PenguHeroCard from '../components/dashboard/PenguHeroCard';
import DailyLoginCalendar from '../components/dashboard/DailyLoginCalendar';
import LearningProgress from '../components/dashboard/LearningProgress';
import ContinueLearningSpace from '../components/dashboard/ContinueLearningSpace';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [coveredTopics, setCoveredTopics] = useState([]);
  const [activeTopics, setActiveTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const studentId = user?.id || 's_1029';
        const [profileData, allMastery, userAttempts] = await Promise.all([
          learningService.getUserLearningProfile(studentId),
          learningService.getAllMastery(studentId),
          learningService.getAttempts(studentId, null, 100),
        ]);

        setProfile(profileData);
        setAttempts(userAttempts || []);

        if (allMastery && allMastery.length > 0) {
          const DOMAIN_LABELS = {
            dsa: 'Data Structures & Algorithms',
            dbms: 'DBMS',
            system_design: 'System Design',
            web_dev: 'Web Development',
          };

          const covered = [];
          const active = [];

          allMastery.forEach((item) => {
            const pct = Math.round(parseFloat(item.p_mastery || 0) * 100);
            const topicObj = {
              topic_id: item.topic_id,
              topic_name: item.display_name,
              subject: DOMAIN_LABELS[item.domain] || item.domain,
              status: pct >= 85 ? 'completed' : 'active',
              progress_percentage: pct,
              last_updated: item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'Curriculum',
              solved_count: item.attempts || 0,
              remaining: `${Math.max(1, 10 - (item.attempts || 0))} questions left`,
              difficulty: item.difficulty <= 2 ? 'Easy' : item.difficulty <= 3 ? 'Intermediate' : 'Hard',
            };

            if (pct >= 85) {
              covered.push(topicObj);
            } else {
              active.push(topicObj);
            }
          });

          setCoveredTopics(covered);
          setActiveTopics(active);
        }
      } catch (err) {
        console.warn('Dashboard data loading notice:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  // Compute distinct active days count from attempts
  const uniqueActiveDays = new Set(
    attempts.map((a) => (a.created_at ? a.created_at.split('T')[0] : ''))
  );
  const totalActiveDays = Math.max(1, uniqueActiveDays.size);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcoming Hero Card with Pengu + Reusable Quote */}
      <PenguHeroCard
        userName={user?.name || 'Learner'}
        quote="Every bug you diagnose today becomes second nature tomorrow. Trust the process!"
        supportingText={
          coveredTopics.length > 0
            ? `${coveredTopics.length} mastered • ${activeTopics.length} in progress`
            : `${activeTopics.length} topics available in curriculum`
        }
      />

      {/* 2. Daily Login Calendar & Learning Progress Grid */}
      <div className="grid grid-cols-1 gap-8">
        <DailyLoginCalendar
          currentStreak={profile?.streakDays ?? 1}
          totalActiveDays={totalActiveDays}
          attempts={attempts}
        />

        <LearningProgress
          coveredTopics={coveredTopics}
          activeTopics={activeTopics}
        />
      </div>

      {/* 3. Spacious Open Learning Space */}
      <ContinueLearningSpace
        recommendedTopic={profile?.lowMasteryTopics?.[0] || activeTopics?.[0]}
      />
    </div>
  );
}
