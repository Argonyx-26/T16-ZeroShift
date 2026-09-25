import { STATMODELS_API_URL, request } from './api';

// Realistic fallback curriculum & question bank
export const MOCK_QUESTIONS = [
  {
    question_id: 'q_trees_001',
    topic_id: 'dsa.trees.traversal',
    domain: 'dsa',
    difficulty: 'easy',
    prompt: 'Which tree traversal visits the root node before its left and right subtrees?',
    options: [
      { option_id: 'a', option_text: 'Inorder Traversal (Left, Root, Right)' },
      { option_id: 'b', option_text: 'Preorder Traversal (Root, Left, Right)' },
      { option_id: 'c', option_text: 'Postorder Traversal (Left, Right, Root)' },
      { option_id: 'd', option_text: 'Level-order Traversal (Breadth-First)' },
    ],
    correct_option_id: 'b',
    explanation: 'Preorder traversal visits the root first, then recursively traverses the left and right subtrees.',
  },
  {
    question_id: 'q_bfs_014',
    topic_id: 'dsa.graphs.bfs',
    domain: 'dsa',
    difficulty: 'easy',
    prompt: 'Which data structure does Breadth-First Search (BFS) use to track nodes to visit next?',
    options: [
      { option_id: 'opt_a', option_text: 'Queue (FIFO - First In First Out)' },
      { option_id: 'opt_b', option_text: 'Priority Queue (Min/Max Heap)' },
      { option_id: 'opt_c', option_text: 'Stack (LIFO - Last In First Out)' },
      { option_id: 'opt_d', option_text: 'Hash Map' },
    ],
    correct_option_id: 'opt_a',
    explanation: 'BFS explores neighbor nodes level by level using a FIFO Queue to preserve discovery order.',
  },
  {
    question_id: 'q_dp_002',
    topic_id: 'dsa.dp.memoization',
    domain: 'dsa',
    difficulty: 'intermediate',
    prompt: 'What are the two core prerequisites necessary for a problem to be solvable via Dynamic Programming?',
    options: [
      { option_id: 'a', option_text: 'Greedy choice property & sorted array' },
      { option_id: 'b', option_text: 'Overlapping subproblems & optimal substructure' },
      { option_id: 'c', option_text: 'Binary tree structure & O(1) space' },
      { option_id: 'd', option_text: 'Divide and conquer without state repetition' },
    ],
    correct_option_id: 'b',
    explanation: 'Dynamic Programming applies when a problem has overlapping subproblems that can be cached and optimal substructure.',
  },
  {
    question_id: 'q_dbms_001',
    topic_id: 'dbms.transactions',
    domain: 'dbms',
    difficulty: 'easy',
    prompt: 'In ACID properties of database transactions, what does the "I" stand for?',
    options: [
      { option_id: 'a', option_text: 'Integrity' },
      { option_id: 'b', option_text: 'Isolation' },
      { option_id: 'c', option_text: 'Immutability' },
      { option_id: 'd', option_text: 'Indexing' },
    ],
    correct_option_id: 'b',
    explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
  },
  {
    question_id: 'q_arrays_003',
    topic_id: 'dsa.arrays.two_pointer',
    domain: 'dsa',
    difficulty: 'easy',
    prompt: 'When searching for a pair with a target sum in a sorted array, what is the optimal two-pointer time complexity?',
    options: [
      { option_id: 'a', option_text: 'O(N^2)' },
      { option_id: 'b', option_text: 'O(N log N)' },
      { option_id: 'c', option_text: 'O(N)' },
      { option_id: 'd', option_text: 'O(1)' },
    ],
    correct_option_id: 'c',
    explanation: 'Using left and right pointers on a sorted array finds the pair in a single O(N) linear pass.',
  },
];

export const MOCK_STUDY_MATERIALS = [
  {
    material_id: 'mat_yt_dsa_01',
    domain: 'dsa',
    topic_id: 'dsa.fundamentals',
    title: 'Data Structures and Algorithms Introduction',
    material_type: 'video',
    display_mode: 'video',
    level: 'beginner',
    duration: '10 min',
    channel: 'CS Dojo',
    url: 'https://youtu.be/3_x_Fb31NLE',
    youtube_url: 'https://youtu.be/3_x_Fb31NLE',
    thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc13c72e616?w=600&auto=format&fit=crop&q=80',
    can_embed: true,
  },
  {
    material_id: 'mat_yt_dbms_01',
    domain: 'dbms',
    topic_id: 'dbms.fundamentals',
    title: 'DBMS Full Course — Relational Databases Explained',
    material_type: 'video',
    display_mode: 'video',
    level: 'beginner',
    duration: '5 hours',
    channel: 'freeCodeCamp',
    url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    youtube_url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
    can_embed: true,
  },
  {
    material_id: 'mat_yt_sys_01',
    domain: 'system_design',
    topic_id: 'system-design.fundamentals',
    title: 'System Design Fundamentals for Scalable Architecture',
    material_type: 'video',
    display_mode: 'video',
    level: 'intermediate',
    duration: '1.5 hours',
    channel: 'ByteByteGo',
    url: 'https://www.youtube.com/watch?v=bUHFg8CZFws',
    youtube_url: 'https://www.youtube.com/watch?v=bUHFg8CZFws',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    can_embed: true,
  },
  {
    material_id: 'mat_yt_web_01',
    domain: 'web_dev',
    topic_id: 'web.javascript',
    title: 'JavaScript Modern Event Loop & Execution Context',
    material_type: 'video',
    display_mode: 'video',
    level: 'beginner',
    duration: '3 hours',
    channel: 'Traversy Media',
    url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    youtube_url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80',
    can_embed: true,
  },
  {
    material_id: 'mat_yt_acid_01',
    domain: 'dbms',
    topic_id: 'dbms.transactions',
    title: 'ACID Properties in 5 Minutes with Visual Examples',
    material_type: 'video',
    display_mode: 'video',
    level: 'beginner',
    duration: '5 min',
    channel: 'Hussein Nasser',
    url: 'https://www.youtube.com/watch?v=GAe5oB742dw',
    youtube_url: 'https://www.youtube.com/watch?v=GAe5oB742dw',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    can_embed: true,
  },
  // Reading materials
  {
    material_id: 'read_dp_01',
    domain: 'dsa',
    topic_id: 'dsa.dynamic-programming',
    title: 'Dynamic Programming: Step-by-Step Memoization Pattern',
    material_type: 'article',
    display_mode: 'file',
    level: 'intermediate',
    duration: '15 min read',
    description: 'Master the transition from brute force recursion to state table memoization with common interview patterns.',
    url: 'https://www.geeksforgeeks.org/dsa/dynamic-programming/',
    can_embed: false,
  },
  {
    material_id: 'read_recursion_01',
    domain: 'dsa',
    topic_id: 'dsa.recursion',
    title: 'The Mental Model of Recursion & Call Stacks',
    material_type: 'tutorial',
    display_mode: 'file',
    level: 'beginner',
    duration: '10 min read',
    description: 'Learn to identify edge case termination, base cases, and how the call stack executes recursive frames.',
    url: 'https://www.geeksforgeeks.org/dsa/recursion/',
    can_embed: false,
  },
  {
    material_id: 'read_norm_01',
    domain: 'dbms',
    topic_id: 'dbms.normalization',
    title: 'Database Normalization: 1NF, 2NF, 3NF & BCNF Cheat Sheet',
    material_type: 'article',
    display_mode: 'file',
    level: 'intermediate',
    duration: '12 min read',
    description: 'Clear rules for decomposing relations without data redundancy or anomaly hazards.',
    url: 'https://www.geeksforgeeks.org/dbms/introduction-of-database-normalization/',
    can_embed: false,
  },
  {
    material_id: 'read_sys_scaling_01',
    domain: 'system_design',
    topic_id: 'system-design.scalability',
    title: 'Horizontal vs Vertical Scaling & Load Balancing 101',
    material_type: 'article',
    display_mode: 'file',
    level: 'intermediate',
    duration: '20 min read',
    description: 'Architecting for high availability: round robin, least connections, sticky sessions, and reverse proxies.',
    url: 'https://www.geeksforgeeks.org/system-design/system-design-scalability/',
    can_embed: false,
  },
  // External websites
  {
    material_id: 'ext_visualgo',
    domain: 'dsa',
    topic_id: 'dsa.visualization',
    title: 'VisuAlgo — Visualising Data Structures & Algorithms',
    material_type: 'visualization',
    display_mode: 'external_link',
    level: 'all-levels',
    description: 'Interactive animated step-through of sorting, trees, graphs, and dynamic programming.',
    url: 'https://visualgo.net/',
    can_embed: false,
  },
  {
    material_id: 'ext_neetcode',
    domain: 'dsa',
    topic_id: 'dsa.roadmap',
    title: 'NeetCode Practice Roadmap',
    material_type: 'roadmap',
    display_mode: 'external_link',
    level: 'intermediate',
    description: 'Structured topic-by-topic progression covering the top 150 tech interview problems.',
    url: 'https://neetcode.io/roadmap',
    can_embed: false,
  },
  {
    material_id: 'ext_sys_primer',
    domain: 'system_design',
    topic_id: 'system-design.roadmap',
    title: 'The System Design Primer (GitHub)',
    material_type: 'reference',
    display_mode: 'external_link',
    level: 'advanced',
    description: 'Comprehensive open-source repository on large-scale distributed systems and interview prep.',
    url: 'https://github.com/donnemartin/system-design-primer',
    can_embed: false,
  },
  {
    material_id: 'ext_mdn_js',
    domain: 'web_dev',
    topic_id: 'web.javascript',
    title: 'MDN Web Docs: JavaScript Reference',
    material_type: 'documentation',
    display_mode: 'external_link',
    level: 'all-levels',
    description: 'The authoritative reference manual for JavaScript semantics, promises, and modern ECMAScript standards.',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    can_embed: false,
  },
];

export const MOCK_TESTS = [
  {
    test_id: 'test_trees_01',
    title: 'Data Structures - Trees & Traversals',
    topic_id: 'dsa.trees',
    topic_name: 'Binary Trees & BST',
    domain: 'dsa',
    day: 'Monday',
    date: '28 September 2026',
    total_questions: 10,
    attempted_questions: 7,
    completed_questions: 0,
    score: null,
    progress_percentage: 70,
    duration: '20 mins',
    duration_seconds: 1200,
    status: 'ongoing', // ongoing | completed
    difficulty: 'intermediate',
  },
  {
    test_id: 'test_dp_02',
    title: 'Dynamic Programming Fundamentals',
    topic_id: 'dsa.dp',
    topic_name: 'Memoization & 0/1 Knapsack',
    domain: 'dsa',
    day: 'Wednesday',
    date: '23 September 2026',
    total_questions: 15,
    attempted_questions: 15,
    completed_questions: 15,
    score: '13 / 15',
    progress_percentage: 86,
    duration: '25 mins',
    duration_seconds: 1500,
    status: 'completed',
    difficulty: 'hard',
  },
  {
    test_id: 'test_arrays_03',
    title: 'Arrays & Two-Pointer Strategy',
    topic_id: 'dsa.arrays',
    topic_name: 'Sliding Window & Pointers',
    domain: 'dsa',
    day: 'Saturday',
    date: '19 September 2026',
    total_questions: 12,
    attempted_questions: 12,
    completed_questions: 12,
    score: '11 / 12',
    progress_percentage: 91,
    duration: '15 mins',
    duration_seconds: 900,
    status: 'completed',
    difficulty: 'easy',
  },
  {
    test_id: 'test_dbms_04',
    title: 'Database Transactions & ACID Properties',
    topic_id: 'dbms.transactions',
    topic_name: 'Concurrency & Joins',
    domain: 'dbms',
    day: 'Friday',
    date: '26 September 2026',
    total_questions: 8,
    attempted_questions: 3,
    completed_questions: 0,
    score: null,
    progress_percentage: 37,
    duration: '15 mins',
    duration_seconds: 900,
    status: 'ongoing',
    difficulty: 'intermediate',
  }
];

export const learningService = {
  // Fetch randomized questions or batch
  async getQuestions(domain = null, difficulty = null, count = 10) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('count', count.toString());

      const res = await request(STATMODELS_API_URL, `/questions?${params.toString()}`);
      if (res?.data?.questions?.length > 0) {
        return res.data.questions;
      }
    } catch {
      // fallback to mock
    }
    return MOCK_QUESTIONS.slice(0, count);
  },

  // Fetch study materials from SQL-backed table
  async getStudyMaterials(domain = null, displayMode = null) {
    try {
      const params = new URLSearchParams();
      if (domain) params.append('domain', domain);
      if (displayMode) params.append('display_mode', displayMode);

      const res = await request(STATMODELS_API_URL, `/study-materials?${params.toString()}`);
      if (res?.data?.materials?.length > 0) {
        return res.data.materials;
      }
    } catch {
      // fallback to mock
    }
    let list = MOCK_STUDY_MATERIALS;
    if (domain) list = list.filter((m) => m.domain === domain);
    if (displayMode) list = list.filter((m) => m.display_mode === displayMode);
    return list;
  },

  // Diagnose MCQ answer + updates BKT
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
      console.warn('Backend diagnose failed, using client diagnosis:', err.message);
      const isCorrect = selectedOptionId === correctOptionId;
      return {
        diagnosis: {
          is_correct: isCorrect,
          misconception_id: isCorrect ? null : 'general.distractor_selected',
          error_type: isCorrect ? null : 'conceptual_gap',
          evidence: isCorrect ? 'Correct choice' : 'Review concept fundamentals',
        },
        mastery: {
          p_mastery_prev: 0.3,
          p_mastery: isCorrect ? 0.45 : 0.25,
          mastered: false,
        },
      };
    }
  },

  // YouTube embed converter
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
    // Standard client-side fallback
    const id = url.includes('youtu.be/')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : new URL(url).searchParams.get('v');
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : url;
  },

  // Tests list
  getTests() {
    return MOCK_TESTS;
  },

  getTestById(testId) {
    return MOCK_TESTS.find((t) => t.test_id === testId) || MOCK_TESTS[0];
  },

  // Learning profile progress and mastery data
  async getUserLearningProfile(studentId) {
    try {
      // If statmodels backend is active, we can fetch real BKT state
      const res = await request(STATMODELS_API_URL, `/bkt/mastery?student_id=${studentId || 's_1029'}&topic_id=dsa.dp.lis`).catch(() => null);
    } catch {}

    const allTopics = [
      {
        topic_id: 'dsa.trees',
        topic_name: 'Binary Trees & Traversals',
        subject: 'Data Structures',
        progress_percentage: 72,
        mastery_percentage: 74,
        last_studied: 'Yesterday',
        resources_completed: '6 / 8',
        difficulty: 'Intermediate',
      },
      {
        topic_id: 'dsa.dp',
        topic_name: 'Dynamic Programming Memoization',
        subject: 'Algorithms',
        progress_percentage: 42,
        mastery_percentage: 41,
        last_studied: '2 days ago',
        resources_completed: '4 / 10',
        difficulty: 'Hard',
      },
      {
        topic_id: 'dsa.graphs',
        topic_name: 'Graph Traversal (BFS & DFS)',
        subject: 'Algorithms',
        progress_percentage: 35,
        mastery_percentage: 32,
        last_studied: '3 days ago',
        resources_completed: '3 / 9',
        difficulty: 'Intermediate',
      },
      {
        topic_id: 'dsa.recursion',
        topic_name: 'Recursion Base Cases & Call Stacks',
        subject: 'Algorithms',
        progress_percentage: 28,
        mastery_percentage: 27,
        last_studied: '5 days ago',
        resources_completed: '2 / 7',
        difficulty: 'Intermediate',
      },
      {
        topic_id: 'dbms.transactions',
        topic_name: 'ACID Properties & Concurrency',
        subject: 'DBMS',
        progress_percentage: 65,
        mastery_percentage: 68,
        last_studied: '4 days ago',
        resources_completed: '5 / 7',
        difficulty: 'Easy',
      },
      {
        topic_id: 'web.javascript',
        topic_name: 'Event Loop & Async Promises',
        subject: 'Web Development',
        progress_percentage: 84,
        mastery_percentage: 82,
        last_studied: '1 week ago',
        resources_completed: '7 / 8',
        difficulty: 'Intermediate',
      },
    ];

    // Filter strictly mastery_percentage < 50
    const lowMastery = allTopics
      .filter((t) => t.mastery_percentage < 50)
      .map((t) => ({
        ...t,
        last_attempted: t.last_studied,
        attempt_count: t.difficulty === 'Hard' ? 6 : 4,
        recommended_action:
          t.topic_id.includes('recursion')
            ? 'Review terminating return conditions & stack overflow guards.'
            : t.topic_id.includes('graph')
            ? 'Practice queue vs stack node exploration order with VisuAlgo.'
            : 'Trace overlapping subproblems on 0/1 knapsack & memoization tables.',
      }));

    return {
      streakDays: 5,
      joinDate: 'September 2026',
      learnerStatus: 'Student / SDE Track',
      progressingTopics: allTopics,
      lowMasteryTopics: lowMastery,
    };
  }
};
