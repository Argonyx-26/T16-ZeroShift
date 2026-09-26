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
        const [profileData, allMastery, userAttempts, topics] = await Promise.all([
          learningService.getUserLearningProfile(studentId),
          learningService.getAllMastery(studentId),
          learningService.getAttempts(studentId, null, 100),
          learningService.getTopics(),
        ]);

        setProfile(profileData);
        setAttempts(userAttempts || []);

        const DOMAIN_LABELS = {
          dsa: 'Data Structures & Algorithms',
          dbms: 'DBMS',
          system_design: 'System Design',
          web_dev: 'Web Development',
        };

        const completedTests = JSON.parse(localStorage.getItem('pengu_completed_tests') || '{}');

        // Group attempts by topic
        const attemptsByTopic = {};
        (userAttempts || []).forEach((a) => {
          if (!attemptsByTopic[a.topic_id]) attemptsByTopic[a.topic_id] = [];
          attemptsByTopic[a.topic_id].push(a);
        });

        // Use topics list (from DB or fallback)
        const topicList = (allMastery && allMastery.length > 0) ? allMastery : topics;

        const covered = [];
        const active = [];

        topicList.forEach((item) => {
          const topicId = item.topic_id;
          const topicAttempts = attemptsByTopic[topicId] || [];
          const completedRecord = completedTests[`test_${topicId}`] || completedTests[topicId];

          let progressPct = 0;
          let isMastered = false;
          let solvedCount = topicAttempts.length;

          if (completedRecord) {
            // Paper has been given/submitted
            progressPct = completedRecord.accuracy ?? completedRecord.progress_percentage ?? 80;
            solvedCount = Math.max(solvedCount, completedRecord.attempted_questions || 10);
            isMastered = progressPct >= 80;
          } else if (solvedCount > 0) {
            // In-progress attempts: natural distribution based on work done (Item 7)
            const correctCount = topicAttempts.filter((a) => a.is_correct).length;
            const workRatio = Math.min(1, solvedCount / 10);
            const accRatio = correctCount / solvedCount;
            progressPct = Math.min(100, Math.round(workRatio * 70 + accRatio * 30));
            isMastered = progressPct >= 85;
          } else if (item.attempts > 0) {
            const workRatio = Math.min(1, item.attempts / 10);
            const pM = parseFloat(item.p_mastery || 0.3);
            progressPct = Math.min(100, Math.round(workRatio * 60 + pM * 40));
            isMastered = progressPct >= 85;
          } else {
            // Zero work done = 0% (Item 7: fix 16% bug for untouched topics)
            progressPct = 0;
            isMastered = false;
          }

          const diffVal = typeof item.difficulty === 'number' ? item.difficulty : 2;
          const topicObj = {
            topic_id: topicId,
            topic_name: item.display_name,
            subject: DOMAIN_LABELS[item.domain] || item.domain || 'Curriculum',
            status: isMastered ? 'completed' : 'active',
            progress_percentage: progressPct,
            last_updated: completedRecord?.date || (item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'Curriculum'),
            solved_count: solvedCount,
            remaining: `${Math.max(0, 10 - solvedCount)} questions left`,
            difficulty: diffVal <= 2 ? 'Easy' : diffVal <= 3 ? 'Intermediate' : 'Hard',
          };

          if (isMastered) {
            covered.push(topicObj);
          } else {
            active.push(topicObj);
          }
        });

        setCoveredTopics(covered);
        setActiveTopics(active);
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
