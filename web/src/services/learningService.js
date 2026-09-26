import { STATMODELS_API_URL, request } from './api';

// Curated offline fallback questions so tests can always be taken even without backend
const FALLBACK_QUESTIONS = [
  {
    question_id: 'q_dsa_001',
    topic_id: 'dsa.arrays',
    prompt: 'What is the average-case time complexity of accessing an element in an array by its index?',
    difficulty: 'easy',
    correct_option_id: 'opt_a',
    options: [
      { option_id: 'opt_a', option_text: 'O(1) - Constant Time' },
      { option_id: 'opt_b', option_text: 'O(n) - Linear Time' },
      { option_id: 'opt_c', option_text: 'O(log n) - Logarithmic Time' },
      { option_id: 'opt_d', option_text: 'O(n²) - Quadratic Time' },
    ],
  },
  {
    question_id: 'q_dsa_002',
    topic_id: 'dsa.arrays',
    prompt: 'Which technique is ideal for finding a pair of elements with a given sum in a sorted array?',
    difficulty: 'easy',
    correct_option_id: 'opt_b',
    options: [
      { option_id: 'opt_a', option_text: 'Floyd\'s Tortoise and Hare' },
      { option_id: 'opt_b', option_text: 'Two-Pointer Technique' },
      { option_id: 'opt_c', option_text: 'Depth First Search' },
      { option_id: 'opt_d', option_text: 'Sliding Window with Monotonic Queue' },
    ],
  },
  {
    question_id: 'q_dsa_003',
    topic_id: 'dsa.trees',
    prompt: 'In a Binary Search Tree (BST), which traversal produces elements in strictly ascending order?',
    difficulty: 'intermediate',
    correct_option_id: 'opt_c',
    options: [
      { option_id: 'opt_a', option_text: 'Pre-order Traversal (Root, Left, Right)' },
      { option_id: 'opt_b', option_text: 'Post-order Traversal (Left, Right, Root)' },
      { option_id: 'opt_c', option_text: 'In-order Traversal (Left, Root, Right)' },
      { option_id: 'opt_d', option_text: 'Level-order Traversal (BFS)' },
    ],
  },
  {
    question_id: 'q_dsa_004',
    topic_id: 'dsa.trees',
    prompt: 'What is the maximum number of nodes at level L in a binary tree (root at level 0)?',
    difficulty: 'easy',
    correct_option_id: 'opt_b',
    options: [
      { option_id: 'opt_a', option_text: '2L' },
      { option_id: 'opt_b', option_text: '2^L' },
      { option_id: 'opt_c', option_text: '2^(L+1) - 1' },
      { option_id: 'opt_d', option_text: 'L²' },
    ],
  },
  {
    question_id: 'q_dsa_005',
    topic_id: 'dsa.dp',
    prompt: 'Which property is essential for a problem to be solved using Dynamic Programming?',
    difficulty: 'intermediate',
    correct_option_id: 'opt_a',
    options: [
      { option_id: 'opt_a', option_text: 'Overlapping Subproblems & Optimal Substructure' },
      { option_id: 'opt_b', option_text: 'Greedy Choice Property only' },
      { option_id: 'opt_c', option_text: 'Strict Divide and Conquer with Disjoint Subproblems' },
      { option_id: 'opt_d', option_text: 'Monotonic Stack structure' },
    ],
  },
  {
    question_id: 'q_dbms_001',
    topic_id: 'dbms.sql',
    prompt: 'What does the ACID property "Isolation" guarantee in a relational database?',
    difficulty: 'intermediate',
    correct_option_id: 'opt_c',
    options: [
      { option_id: 'opt_a', option_text: 'All transactions are written directly to magnetic storage' },
      { option_id: 'opt_b', option_text: 'Data matches all table foreign key constraints' },
      { option_id: 'opt_c', option_text: 'Concurrent execution of transactions results in a state as if executed serially' },
      { option_id: 'opt_d', option_text: 'The database system is isolated on a dedicated server' },
    ],
  },
  {
    question_id: 'q_dbms_002',
    topic_id: 'dbms.sql',
    prompt: 'Which SQL clause is used to filter aggregated grouped rows?',
    difficulty: 'easy',
    correct_option_id: 'opt_b',
    options: [
      { option_id: 'opt_a', option_text: 'WHERE' },
      { option_id: 'opt_b', option_text: 'HAVING' },
      { option_id: 'opt_c', option_text: 'ORDER BY' },
      { option_id: 'opt_d', option_text: 'GROUP FILTER' },
    ],
  },
  {
    question_id: 'q_sys_001',
    topic_id: 'system_design.fundamentals',
    prompt: 'Which load balancing algorithm distributes incoming requests sequentially across a list of servers?',
    difficulty: 'easy',
    correct_option_id: 'opt_a',
    options: [
      { option_id: 'opt_a', option_text: 'Round Robin' },
      { option_id: 'opt_b', option_text: 'Least Connections' },
      { option_id: 'opt_c', option_text: 'IP Hash' },
      { option_id: 'opt_d', option_text: 'Consistent Hashing' },
    ],
  },
  {
    question_id: 'q_web_001',
    topic_id: 'web_dev.javascript',
    prompt: 'In the JavaScript event loop, which queue has higher priority to execute after the current call stack clears?',
    difficulty: 'intermediate',
    correct_option_id: 'opt_a',
    options: [
      { option_id: 'opt_a', option_text: 'Microtask Queue (Promises, queueMicrotask)' },
      { option_id: 'opt_b', option_text: 'Macrotask Queue (setTimeout, setInterval)' },
      { option_id: 'opt_c', option_text: 'Rendering Pipeline' },
      { option_id: 'opt_d', option_text: 'I/O Polling Queue' },
    ],
  },
  {
    question_id: 'q_dsa_006',
    topic_id: 'dsa.binary_search',
    prompt: 'In binary search on an array of length N, what is the maximum number of comparisons?',
    difficulty: 'easy',
    correct_option_id: 'opt_b',
    options: [
      { option_id: 'opt_a', option_text: 'N' },
      { option_id: 'opt_b', option_text: '⌊log₂(N)⌋ + 1' },
      { option_id: 'opt_c', option_text: 'N / 2' },
      { option_id: 'opt_d', option_text: '2 * log₂(N)' },
    ],
  }
];

export const learningService = {
  /**
   * Fetch randomized MCQ questions from the backend, with fallback bank.
   */
  async getQuestions(domain = null, difficulty = null, count = 10) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('count', count.toString());

      const res = await request(STATMODELS_API_URL, `/questions?${params.toString()}`);
      if (res?.data?.questions && res.data.questions.length > 0) {
        return res.data.questions;
      }
    } catch (err) {
      console.warn('[learningService] getQuestions fallback to local bank:', err.message);
    }

    // Filter fallback questions if domain or difficulty is specified
    let filtered = FALLBACK_QUESTIONS;
    if (domain) {
      filtered = filtered.filter((q) => q.topic_id.startsWith(domain));
    }
    if (difficulty) {
      filtered = filtered.filter((q) => q.difficulty === difficulty);
    }
    return (filtered.length > 0 ? filtered : FALLBACK_QUESTIONS).slice(0, count);
  },

  /**
   * Fetch study materials from SQL-backed table or fallback.
   */
  async getStudyMaterials(domain = null, displayMode = null) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (displayMode) params.append('display_mode', displayMode);

      const res = await request(STATMODELS_API_URL, `/study-materials?${params.toString()}`);
      if (res?.data?.materials && res.data.materials.length > 0) {
        return res.data.materials;
      }
    } catch (err) {
      console.warn('[learningService] getStudyMaterials fallback:', err.message);
    }

    return [
      {
        material_id: 'sm_01',
        title: 'Mastering Binary Search & Edge Cases',
        domain: 'dsa',
        topic_id: 'dsa.binary_search',
        duration: '18 mins',
        can_embed: true,
        url: 'https://www.youtube.com/watch?v=fDKIpRe8GW4',
      },
      {
        material_id: 'sm_02',
        title: 'Dynamic Programming: Memoization vs Tabulation',
        domain: 'dsa',
        topic_id: 'dsa.dp',
        duration: '24 mins',
        can_embed: true,
        url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
      },
      {
        material_id: 'sm_03',
        title: 'System Design Interview Crash Course',
        domain: 'system_design',
        topic_id: 'system_design.fundamentals',
        duration: '35 mins',
        can_embed: true,
        url: 'https://www.youtube.com/watch?v=i53Gi_K3o7I',
      },
      {
        material_id: 'sm_04',
        title: 'SQL Indexing & Query Optimization Deep Dive',
        domain: 'dbms',
        topic_id: 'dbms.sql',
        duration: '22 mins',
        can_embed: true,
        url: 'https://www.youtube.com/watch?v=HubezKbFL7E',
      },
    ];
  },

  /**
   * Diagnose an MCQ answer — updates BKT mastery in backend with local storage fallback.
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
      const isCorrect = selectedOptionId === correctOptionId;
      return {
        diagnosis: {
          is_correct: isCorrect,
          topic_id: topicId,
          misconception_id: null,
          error_type: null,
          confidence: 0,
          evidence: isCorrect ? 'Correct' : 'Incorrect',
        },
        mastery: {
          p_mastery_prev: 0.3,
          p_mastery: isCorrect ? 0.65 : 0.25,
          mastered: isCorrect,
          attempts: 1,
        },
      };
    }
  },

  /**
   * Fetch all curriculum topics.
   */
  async getTopics(domain = null) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);

      const res = await request(STATMODELS_API_URL, `/topics?${params.toString()}`);
      if (res?.data?.topics && res.data.topics.length > 0) {
        return res.data.topics;
      }
    } catch (err) {
      console.warn('[learningService] getTopics fallback:', err.message);
    }

    return [
      { topic_id: 'dsa.arrays', domain: 'dsa', display_name: 'Arrays & Two-Pointer', difficulty: 1, p_init: 0.3 },
      { topic_id: 'dsa.binary_search', domain: 'dsa', display_name: 'Binary Search & Bounds', difficulty: 2, p_init: 0.25 },
      { topic_id: 'dsa.trees', domain: 'dsa', display_name: 'Binary Trees & Traversals', difficulty: 3, p_init: 0.2 },
      { topic_id: 'dsa.dp', domain: 'dsa', display_name: 'Dynamic Programming', difficulty: 4, p_init: 0.15 },
      { topic_id: 'dbms.sql', domain: 'dbms', display_name: 'SQL Joins & Indexing', difficulty: 2, p_init: 0.3 },
      { topic_id: 'system_design.fundamentals', domain: 'system_design', display_name: 'Load Balancing & Caching', difficulty: 3, p_init: 0.25 },
      { topic_id: 'web_dev.javascript', domain: 'web_dev', display_name: 'JavaScript Async & Event Loop', difficulty: 2, p_init: 0.35 },
    ];
  },

  /**
   * Fetch all BKT mastery records for a student.
   */
  async getAllMastery(studentId) {
    if (!studentId) return [];
    try {
      const res = await request(STATMODELS_API_URL, `/bkt/mastery-all?student_id=${encodeURIComponent(studentId)}`);
      return res?.data?.mastery || [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Fetch attempt history for a student.
   */
  async getAttempts(studentId, topicId = null, limit = 50) {
    let serverAttempts = [];
    if (studentId) {
      try {
        const params = new URLSearchParams();
        params.append('student_id', studentId);
        if (topicId) params.append('topic_id', topicId);
        params.append('limit', limit.toString());

        const res = await request(STATMODELS_API_URL, `/attempts?${params.toString()}`);
        serverAttempts = res?.data?.attempts || [];
      } catch {}
    }

    // Merge with local storage cached attempts
    const localAttempts = JSON.parse(localStorage.getItem('pengu_local_attempts') || '[]');
    const combined = [...serverAttempts, ...localAttempts];
    return combined.slice(0, limit);
  },

  /**
   * Build tests list: merges backend data with local storage completed tests
   * Solves Item 2 ("Start Test") and Item 3 (progress bar not showing 0% once given).
   */
  async getTests(studentId) {
    try {
      const [topics, mastery, attempts] = await Promise.all([
        this.getTopics(),
        this.getAllMastery(studentId),
        this.getAttempts(studentId, null, 200),
      ]);

      const masteryMap = {};
      for (const m of mastery) {
        masteryMap[m.topic_id] = m;
      }

      const attemptsByTopic = {};
      for (const a of attempts) {
        if (!attemptsByTopic[a.topic_id]) attemptsByTopic[a.topic_id] = [];
        attemptsByTopic[a.topic_id].push(a);
      }

      // Read completed tests from local cache
      const completedTests = JSON.parse(localStorage.getItem('pengu_completed_tests') || '{}');

      const tests = [];
      for (const topic of topics) {
        const topicAttempts = attemptsByTopic[topic.topic_id] || [];
        const topicMastery = masteryMap[topic.topic_id];
        const completedRecord = completedTests[`test_${topic.topic_id}`] || completedTests[topic.topic_id];

        let isCompleted = Boolean(completedRecord);
        let progressPct = 0;
        let scoreText = '0 / 10';
        let totalQ = 10;
        let attemptedQ = 0;

        if (completedRecord) {
          isCompleted = true;
          progressPct = completedRecord.accuracy ?? completedRecord.progress_percentage ?? 80;
          scoreText = completedRecord.score || `${Math.round((progressPct / 100) * 10)} / 10`;
          totalQ = completedRecord.total_questions || 10;
          attemptedQ = completedRecord.attempted_questions || totalQ;
        } else if (topicAttempts.length > 0) {
          attemptedQ = topicAttempts.length;
          const correctCount = topicAttempts.filter((a) => a.is_correct).length;
          scoreText = `${correctCount} / ${attemptedQ}`;
          // Better number distribution based on work done (Item 7)
          const workRatio = Math.min(1, attemptedQ / 10);
          const accRatio = correctCount / attemptedQ;
          progressPct = Math.min(100, Math.round(workRatio * 70 + accRatio * 30));
          if (progressPct >= 85 || (topicMastery && parseFloat(topicMastery.p_mastery) >= 0.85)) {
            isCompleted = true;
          }
        } else {
          // Zero work done = strictly 0%
          progressPct = 0;
          scoreText = 'Not taken';
          attemptedQ = 0;
        }

        const lastAttemptDate = completedRecord?.date
          ? completedRecord.date
          : (topicAttempts[0]?.created_at
            ? new Date(topicAttempts[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Available Now');

        const lastAttemptDay = completedRecord?.day
          ? completedRecord.day
          : (topicAttempts[0]?.created_at
            ? new Date(topicAttempts[0].created_at).toLocaleDateString('en-US', { weekday: 'long' })
            : 'Anytime');

        tests.push({
          test_id: `test_${topic.topic_id}`,
          title: topic.display_name,
          topic_id: topic.topic_id,
          topic_name: topic.display_name,
          domain: topic.domain,
          total_questions: totalQ,
          attempted_questions: attemptedQ,
          completed_questions: isCompleted ? attemptedQ : 0,
          score: scoreText,
          progress_percentage: progressPct,
          duration: `${Math.max(10, Math.ceil(totalQ * 1.5))} mins`,
          duration_seconds: totalQ * 90,
          status: isCompleted ? 'completed' : 'available',
          difficulty: topic.difficulty <= 2 ? 'easy' : topic.difficulty <= 3 ? 'intermediate' : 'hard',
          date: lastAttemptDate,
          day: lastAttemptDay,
        });
      }

      return tests;
    } catch (err) {
      console.warn('[learningService] getTests error:', err.message);
      return [];
    }
  },

  /**
   * User learning profile with realistic percentage distribution (Item 7).
   */
  async getUserLearningProfile(studentId) {
    try {
      const [topics, mastery, attempts] = await Promise.all([
        this.getTopics(),
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

      const attemptsByTopic = {};
      for (const a of attempts) {
        if (!attemptsByTopic[a.topic_id]) attemptsByTopic[a.topic_id] = [];
        attemptsByTopic[a.topic_id].push(a);
      }

      const completedTests = JSON.parse(localStorage.getItem('pengu_completed_tests') || '{}');

      // Build clean list of topics with realistic progress distribution
      const allTopics = topics.map((t) => {
        const topicAttempts = attemptsByTopic[t.topic_id] || [];
        const completedRecord = completedTests[`test_${t.topic_id}`] || completedTests[t.topic_id];

        let progressPct = 0;
        let attemptCount = topicAttempts.length;

        if (completedRecord) {
          progressPct = completedRecord.accuracy ?? completedRecord.progress_percentage ?? 80;
          attemptCount = Math.max(attemptCount, completedRecord.attempted_questions || 10);
        } else if (attemptCount > 0) {
          const correctCount = topicAttempts.filter((a) => a.is_correct).length;
          const workRatio = Math.min(1, attemptCount / 10);
          const accRatio = correctCount / attemptCount;
          // Smooth distribution reflecting actual questions answered + accuracy
          progressPct = Math.min(100, Math.round(workRatio * 70 + accRatio * 30));
        } else {
          // If no test or questions done yet, progress is strictly 0%
          progressPct = 0;
        }

        const lastAttempt = topicAttempts[0];
        let lastStudied = 'Not started';
        if (completedRecord?.date) {
          lastStudied = completedRecord.date;
        } else if (lastAttempt?.created_at) {
          const diff = Date.now() - new Date(lastAttempt.created_at).getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (days === 0) lastStudied = 'Today';
          else if (days === 1) lastStudied = 'Yesterday';
          else if (days < 7) lastStudied = `${days} days ago`;
          else lastStudied = `${Math.floor(days / 7)}w ago`;
        }

        return {
          topic_id: t.topic_id,
          topic_name: t.display_name,
          subject: DOMAIN_LABELS[t.domain] || t.domain,
          progress_percentage: progressPct,
          mastery_percentage: progressPct,
          last_studied: lastStudied,
          resources_completed: `${attemptCount} questions completed`,
          difficulty: DIFFICULTY_MAP[t.difficulty] || 'Intermediate',
        };
      });

      // Topics needing attention: topics with active attempts below 50%
      const lowMastery = allTopics
        .filter((t) => t.mastery_percentage > 0 && t.mastery_percentage < 50)
        .map((t) => ({
          ...t,
          last_attempted: t.last_studied,
          attempt_count: parseInt(t.resources_completed) || 1,
          recommended_action: 'Practice MCQs on this topic to improve retention.',
        }));

      // Calculate streak
      let streakDays = 1;
      if (attempts.length > 0) {
        const uniqueDays = new Set(
          attempts.map((a) => (a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : ''))
        );
        streakDays = Math.max(1, uniqueDays.size);
      }

      return {
        streakDays,
        joinDate: 'September 2026',
        learnerStatus: 'Student / SDE Track',
        progressingTopics: allTopics,
        lowMasteryTopics: lowMastery,
      };
    } catch (err) {
      console.warn('[learningService] getUserLearningProfile fallback:', err.message);
      return {
        streakDays: 1,
        joinDate: 'September 2026',
        learnerStatus: 'Student / SDE Track',
        progressingTopics: [],
        lowMasteryTopics: [],
      };
    }
  },
};
