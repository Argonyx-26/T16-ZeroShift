import { STATMODELS_API_URL, request } from './api';

export const learningService = {
  /**
   * Fetch randomized MCQ questions from the backend.
   * GET /questions?domain=&difficulty=&count=
   */
  async getQuestions(domain = null, difficulty = null, count = 10) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('count', count.toString());

      const res = await request(STATMODELS_API_URL, `/questions?${params.toString()}`);
      return res?.data?.questions || [];
    } catch (err) {
      console.warn('[learningService] getQuestions failed:', err.message);
      return [];
    }
  },

  /**
   * Fetch study materials from the SQL-backed table.
   * GET /study-materials?domain=&material_type=&display_mode=
   */
  async getStudyMaterials(domain = null, displayMode = null) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (displayMode) params.append('display_mode', displayMode);

      const res = await request(STATMODELS_API_URL, `/study-materials?${params.toString()}`);
      return res?.data?.materials || [];
    } catch (err) {
      console.warn('[learningService] getStudyMaterials failed:', err.message);
      return [];
    }
  },

  /**
   * Fetch learning resources (alternative resource endpoint).
   * GET /resources?domain=&topic_id=&level=&resource_type=&limit=
   */
  async getResources(domain = null, topicId = null, limit = 20) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (topicId) params.append('topic_id', topicId);
      params.append('limit', limit.toString());

      const res = await request(STATMODELS_API_URL, `/resources?${params.toString()}`);
      return res?.data?.resources || [];
    } catch (err) {
      console.warn('[learningService] getResources failed:', err.message);
      return [];
    }
  },

  /**
   * Diagnose an MCQ answer — updates BKT mastery in the backend.
   * POST /diagnose/mcq
   */
  async diagnoseMCQ(studentId, questionId, topicId, selectedOptionId, correctOptionId = null) {
    try {
      const res = await request(STATMODELS_API_URL, '/diagnose/mcq', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          topic_id: topicId,
          selected_option_id: selectedOptionId,
          correct_option_id: correctOptionId,
        }),
      });
      return res?.data;
    } catch (err) {
      console.warn('[learningService] diagnoseMCQ failed:', err.message);
      // Minimal client-side fallback so the UI doesn't crash
      const isCorrect = selectedOptionId === correctOptionId;
      return {
        diagnosis: {
          is_correct: isCorrect,
          topic_id: topicId,
          misconception_id: null,
          error_type: null,
          confidence: 0,
          evidence: isCorrect ? 'Correct' : 'Incorrect (offline)',
        },
        mastery: {
          p_mastery_prev: 0.3,
          p_mastery: isCorrect ? 0.45 : 0.25,
          mastered: false,
          attempts: 1,
        },
      };
    }
  },

  /**
   * YouTube embed URL converter.
   * POST /youtube/embed
   */
  async convertYouTubeEmbed(url) {
    try {
      const res = await request(STATMODELS_API_URL, '/youtube/embed', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      if (res?.data?.embed_url) {
        return res.data.embed_url;
      }
    } catch {}
    // Client-side fallback
    const id = url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : (() => { try { return new URL(url).searchParams.get('v'); } catch { return null; } })();
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
  },

  /**
   * Fetch all curriculum topics.
   * GET /topics?domain=
   */
  async getTopics(domain = null) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);

      const res = await request(STATMODELS_API_URL, `/topics?${params.toString()}`);
      return res?.data?.topics || [];
    } catch (err) {
      console.warn('[learningService] getTopics failed:', err.message);
      return [];
    }
  },

  /**
   * Fetch all BKT mastery records for a student.
   * GET /bkt/mastery-all?student_id=
   */
  async getAllMastery(studentId) {
    try {
      const res = await request(STATMODELS_API_URL, `/bkt/mastery-all?student_id=${encodeURIComponent(studentId)}`);
      return res?.data?.mastery || [];
    } catch (err) {
      console.warn('[learningService] getAllMastery failed:', err.message);
      return [];
    }
  },

  /**
   * Fetch single topic mastery.
   * GET /bkt/mastery?student_id=&topic_id=
   */
  async getMastery(studentId, topicId) {
    try {
      const res = await request(STATMODELS_API_URL, `/bkt/mastery?student_id=${encodeURIComponent(studentId)}&topic_id=${encodeURIComponent(topicId)}`);
      return res?.data || null;
    } catch (err) {
      console.warn('[learningService] getMastery failed:', err.message);
      return null;
    }
  },

  /**
   * Fetch attempt history for a student.
   * GET /attempts?student_id=&topic_id=&limit=
   */
  async getAttempts(studentId, topicId = null, limit = 50) {
    try {
      const params = new URLSearchParams();
      params.append('student_id', studentId);
      if (topicId) params.append('topic_id', topicId);
      params.append('limit', limit.toString());

      const res = await request(STATMODELS_API_URL, `/attempts?${params.toString()}`);
      return res?.data?.attempts || [];
    } catch (err) {
      console.warn('[learningService] getAttempts failed:', err.message);
      return [];
    }
  },

  /**
   * Run the onboarding diagnostic.
   * POST /onboarding/diagnostic
   */
  async runOnboarding(studentId, targetRole, timelineWeeks, responses) {
    try {
      const res = await request(STATMODELS_API_URL, '/onboarding/diagnostic', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          target_role: targetRole,
          timeline_weeks: timelineWeeks,
          responses,
        }),
      });
      return res?.data;
    } catch (err) {
      console.warn('[learningService] runOnboarding failed:', err.message);
      return null;
    }
  },

  /**
   * Get topics due for forgetting-curve revision.
   * GET /forgetting-curve/run?student_id=
   */
  async getRevisionTopics(studentId) {
    try {
      const res = await request(STATMODELS_API_URL, `/forgetting-curve/run?student_id=${encodeURIComponent(studentId)}`);
      return res?.data;
    } catch (err) {
      console.warn('[learningService] getRevisionTopics failed:', err.message);
      return null;
    }
  },

  /**
   * Build tests list from real topic data + student's mastery/attempts.
   * This replaces the old MOCK_TESTS array.
   */
  async getTests(studentId) {
    try {
      const [topics, mastery, attempts] = await Promise.all([
        this.getTopics(),
        this.getAllMastery(studentId),
        this.getAttempts(studentId, null, 200),
      ]);

      // Create a mastery lookup
      const masteryMap = {};
      for (const m of mastery) {
        masteryMap[m.topic_id] = m;
      }

      // Group attempts by topic
      const attemptsByTopic = {};
      for (const a of attempts) {
        if (!attemptsByTopic[a.topic_id]) attemptsByTopic[a.topic_id] = [];
        attemptsByTopic[a.topic_id].push(a);
      }

      // Build test entries for all topics in the curriculum
      const tests = [];
      for (const topic of topics) {
        const topicAttempts = attemptsByTopic[topic.topic_id] || [];
        const topicMastery = masteryMap[topic.topic_id];

        const totalAttempts = topicAttempts.length;
        const correctCount = topicAttempts.filter((a) => a.is_correct).length;
        const pMastery = topicMastery ? parseFloat(topicMastery.p_mastery || 0) : 0;
        const progressPct = Math.round(pMastery * 100);
        const isMastered = pMastery >= 0.85;

        const lastAttemptDate = topicAttempts[0]?.created_at
          ? new Date(topicAttempts[0].created_at)
          : null;

        tests.push({
          test_id: `test_${topic.topic_id}`,
          title: topic.display_name,
          topic_id: topic.topic_id,
          topic_name: topic.display_name,
          domain: topic.domain,
          total_questions: Math.max(5, totalAttempts),
          attempted_questions: totalAttempts,
          completed_questions: isMastered ? totalAttempts : 0,
          score: totalAttempts > 0 ? `${correctCount} / ${totalAttempts}` : '0 / 5',
          progress_percentage: progressPct,
          duration: `${Math.max(5, Math.ceil(Math.max(5, totalAttempts) * 1.5))} mins`,
          duration_seconds: Math.max(5, totalAttempts) * 90,
          status: isMastered ? 'completed' : 'ongoing',
          difficulty: topic.difficulty <= 2 ? 'easy' : topic.difficulty <= 3 ? 'intermediate' : 'hard',
          date: lastAttemptDate
            ? lastAttemptDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Available Now',
          day: lastAttemptDate
            ? lastAttemptDate.toLocaleDateString('en-US', { weekday: 'long' })
            : 'Anytime',
        });
      }

      return tests;
    } catch (err) {
      console.warn('[learningService] getTests failed:', err.message);
      return [];
    }
  },

  /**
   * Learning profile: real data from BKT mastery + attempts.
   * Replaces old hardcoded getUserLearningProfile.
   */
  async getUserLearningProfile(studentId) {
    try {
      const [mastery, attempts] = await Promise.all([
        this.getAllMastery(studentId),
        this.getAttempts(studentId, null, 200),
      ]);

      const DOMAIN_LABELS = {
        dsa: 'Data Structures & Algorithms',
        dbms: 'DBMS',
        system_design: 'System Design',
        web_dev: 'Web Development',
      };

      const DIFFICULTY_MAP = { 1: 'Easy', 2: 'Easy', 3: 'Intermediate', 4: 'Hard', 5: 'Hard' };

      // Group attempts by topic for last-studied dates
      const attemptsByTopic = {};
      for (const a of attempts) {
        if (!attemptsByTopic[a.topic_id]) attemptsByTopic[a.topic_id] = [];
        attemptsByTopic[a.topic_id].push(a);
      }

      // Build progressing topics from mastery records
      const allTopics = mastery.map((m) => {
        const pMastery = parseFloat(m.p_mastery);
        const progressPct = Math.round(pMastery * 100);
        const topicAttempts = attemptsByTopic[m.topic_id] || [];
        const lastAttempt = topicAttempts[0]; // already sorted desc

        let lastStudied = 'Not started';
        if (lastAttempt?.created_at) {
          const diff = Date.now() - new Date(lastAttempt.created_at).getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (days === 0) lastStudied = 'Today';
          else if (days === 1) lastStudied = 'Yesterday';
          else if (days < 7) lastStudied = `${days} days ago`;
          else lastStudied = `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
        }

        return {
          topic_id: m.topic_id,
          topic_name: m.display_name,
          subject: DOMAIN_LABELS[m.domain] || m.domain,
          progress_percentage: progressPct,
          mastery_percentage: progressPct,
          last_studied: lastStudied,
          resources_completed: `${m.attempts || 0} attempts`,
          difficulty: DIFFICULTY_MAP[m.difficulty] || 'Intermediate',
        };
      });

      // Filter topics below 50% mastery
      const lowMastery = allTopics
        .filter((t) => t.mastery_percentage < 50 && t.mastery_percentage > 0)
        .map((t) => ({
          ...t,
          last_attempted: t.last_studied,
          attempt_count: parseInt(t.resources_completed) || 0,
          recommended_action: 'Practice MCQs on this topic to build stronger foundations.',
        }));

      // Calculate streak from attempts
      let streakDays = 0;
      if (attempts.length > 0) {
        const uniqueDays = new Set(
          attempts.map((a) => new Date(a.created_at).toISOString().split('T')[0])
        );
        const sorted = [...uniqueDays].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (sorted[0] === today || sorted[0] === yesterday) {
          streakDays = 1;
          for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1]);
            const curr = new Date(sorted[i]);
            const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1) streakDays++;
            else break;
          }
        }
      }

      const activeTopics = allTopics.filter((t) => t.mastery_percentage > 0);
      const fallbackLowMastery = allTopics
        .slice(0, 3)
        .map((t) => ({
          ...t,
          last_attempted: t.last_studied === 'Not started' ? 'Curriculum' : t.last_studied,
          attempt_count: parseInt(t.resources_completed) || 0,
          recommended_action: 'Take your first MCQ on this topic to calibrate your baseline.',
        }));

      return {
        streakDays: Math.max(1, streakDays),
        joinDate: 'September 2026',
        learnerStatus: 'Student / SDE Track',
        progressingTopics: activeTopics.length > 0 ? activeTopics : allTopics.slice(0, 6),
        lowMasteryTopics: lowMastery.length > 0 ? lowMastery : fallbackLowMastery,
      };
    } catch (err) {
      console.warn('[learningService] getUserLearningProfile failed:', err.message);
      return {
        streakDays: 0,
        joinDate: 'September 2026',
        learnerStatus: 'Student / SDE Track',
        progressingTopics: [],
        lowMasteryTopics: [],
      };
    }
  },
};
