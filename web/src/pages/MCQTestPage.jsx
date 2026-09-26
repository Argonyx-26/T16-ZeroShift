import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';
import MCQQuestionView from '../components/mcq/MCQQuestionView';
import QuestionNavigator from '../components/mcq/QuestionNavigator';
import TestResultSummary from '../components/mcq/TestResultSummary';
import Modal from '../components/common/Modal';
import PixelProgressBar from '../components/common/PixelProgressBar';
import PixelBadge from '../components/common/PixelBadge';
import { Clock, ArrowLeft, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MCQTestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { 0: 'opt_a', 1: 'b' }
  const [markedForReview, setMarkedForReview] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(1200); // 20 mins default
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize test data and questions from backend (or fallback)
  useEffect(() => {
    async function loadTestAndQuestions() {
      try {
        const cleanTopicId = testId?.replace(/^test_/, '');
        const topics = await learningService.getTopics();
        const matchedTopic = topics.find(
          (t) => t.topic_id === cleanTopicId || t.topic_id.includes(cleanTopicId)
        );

        const domain = matchedTopic?.domain || null;
        let qList = await learningService.getQuestions(domain, null, 10);
        
        // If domain filter returned 0, get all questions from bank
        if (!qList || qList.length === 0) {
          qList = await learningService.getQuestions(null, null, 10);
        }

        setTestData({
          test_id: testId,
          title: matchedTopic?.display_name || 'Adaptive Assessment Quiz',
          topic_id: matchedTopic?.topic_id || cleanTopicId || 'dsa.general',
          topic_name: matchedTopic?.display_name || 'Core Fundamentals',
          domain: matchedTopic?.domain || 'dsa',
          duration_seconds: Math.max(300, (qList?.length || 5) * 120),
        });

        if (qList && qList.length > 0) {
          setQuestions(qList);
          setSecondsRemaining(Math.max(300, qList.length * 120));
        }
      } catch (err) {
        console.warn('Failed to load test questions:', err);
      }
    }
    loadTestAndQuestions();
  }, [testId]);

  // Countdown Timer
  useEffect(() => {
    if (isCompleted || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true); // auto submit on time expiration
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, secondsRemaining]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optId) => {
    if (isReviewMode) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optId,
    }));
  };

  const handleToggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Handle user wanting to leave midway - item 2
  const handleBackButtonClick = () => {
    if (isCompleted || isReviewMode) {
      navigate('/mcqs');
      return;
    }
    const answeredCount = Object.keys(answers).length;
    if (answeredCount > 0) {
      setIsLeaveModalOpen(true);
    } else {
      navigate('/mcqs');
    }
  };

  const handleConfirmLeave = () => {
    setIsLeaveModalOpen(false);
    navigate('/mcqs');
  };

  const handleSubmitTest = async (autoSubmit = false) => {
    setIsSubmitModalOpen(false);
    setIsSubmitting(true);

    // Calculate score
    let correctCount = 0;
    const studentId = user?.id || 's_1029';

    questions.forEach((q, idx) => {
      const chosen = answers[idx];
      if (chosen === q.correct_option_id) {
        correctCount += 1;
      }
    });

    const totalSeconds = testData?.duration_seconds || 1200;
    const timeSpentSeconds = Math.max(1, totalSeconds - secondsRemaining);
    const formattedTime = `${Math.floor(timeSpentSeconds / 60)}:${(timeSpentSeconds % 60)
      .toString()
      .padStart(2, '0')}`;

    const finalResult = {
      score: correctCount,
      total: questions.length,
      timeTaken: formattedTime,
      accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
    };

    setResultData(finalResult);
    setIsCompleted(true);

    // CRITICAL for item 3: Save test completion to localStorage cache so MCQsPage
    // and Dashboard immediately reflect that the paper was given with accurate % done!
    try {
      const completedRecord = {
        test_id: testId,
        topic_id: testData?.topic_id,
        topic_name: testData?.topic_name,
        domain: testData?.domain,
        title: testData?.title,
        score: `${correctCount} / ${questions.length}`,
        total_questions: questions.length,
        attempted_questions: questions.length,
        completed_questions: questions.length,
        accuracy: finalResult.accuracy,
        progress_percentage: finalResult.accuracy,
        status: 'completed',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        completed_at: new Date().toISOString(),
      };

      const existingCompleted = JSON.parse(localStorage.getItem('pengu_completed_tests') || '{}');
      existingCompleted[testId] = completedRecord;
      if (testData?.topic_id) {
        existingCompleted[`test_${testData.topic_id}`] = completedRecord;
      }
      localStorage.setItem('pengu_completed_tests', JSON.stringify(existingCompleted));

      // Also save completed attempts locally
      const storedAttempts = JSON.parse(localStorage.getItem('pengu_local_attempts') || '[]');
      questions.forEach((q, idx) => {
        const chosen = answers[idx];
        if (chosen) {
          storedAttempts.unshift({
            student_id: studentId,
            topic_id: q.topic_id || testData?.topic_id,
            question_id: q.question_id,
            is_correct: chosen === q.correct_option_id,
            created_at: new Date().toISOString(),
          });
        }
      });
      localStorage.setItem('pengu_local_attempts', JSON.stringify(storedAttempts.slice(0, 100)));
    } catch (saveErr) {
      console.warn('Local result cache save:', saveErr);
    }

    // Submit diagnoses to backend for all answered questions in parallel
    const diagnosePromises = questions.map((q, idx) => {
      const chosen = answers[idx];
      if (chosen) {
        return learningService.diagnoseMCQ(
          studentId,
          q.question_id,
          q.topic_id || testData?.topic_id || 'dsa.general',
          chosen,
          q.correct_option_id
        ).catch(() => null);
      }
      return Promise.resolve(null);
    });

    try {
      await Promise.all(diagnosePromises);
    } catch (err) {
      console.warn('Diagnosis submission notice:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  if (!testData || questions.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-pixel text-sm text-ink font-bold">Loading test questions...</p>
      </div>
    );
  }

  // If completed and not reviewing, show TestResultSummary
  if (isCompleted && !isReviewMode) {
    return (
      <TestResultSummary
        testTitle={testData.title}
        score={resultData.score}
        total={resultData.total}
        timeTaken={resultData.timeTaken}
        questions={questions}
        answers={answers}
        onBackToMCQs={() => navigate('/mcqs')}
        onReviewAnswers={(targetIndex = 0) => {
          setIsReviewMode(true);
          setCurrentIndex(typeof targetIndex === 'number' ? targetIndex : 0);
        }}
      />
    );
  }

  const answeredCount = Object.keys(answers).length;
  // Item 3: Progress percentage shows proportion of test questions answered
  const progressPercent = isCompleted ? 100 : (questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0);
  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Test Header Bar */}
      <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Test title & topic */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackButtonClick}
            className="p-1.5 rounded-lg border-2 border-slate-900 shadow-pixel-sm bg-white hover:bg-slate-100"
            title="Leave test"
          >
            <ArrowLeft className="w-4 h-4 text-ink" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-ink font-sans">
                {testData.title}
              </h1>
              {isReviewMode && (
                <PixelBadge variant="green" size="sm">
                  Review Mode
                </PixelBadge>
              )}
            </div>
            <p className="text-xs text-ink-secondary">
              Topic: <strong>{testData.topic_name || testData.topic_id}</strong>
            </p>
          </div>
        </div>

        {/* Progress & Countdown Timer */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Question progress */}
          <div className="min-w-[160px] text-right">
            <span className="font-pixel text-xs font-bold text-ink">
              {isReviewMode
                ? `Review Q${currentIndex + 1} of ${questions.length}`
                : `${answeredCount} / ${questions.length} answered (${progressPercent}%)`}
            </span>
            <div className="w-full mt-1">
              <PixelProgressBar
                progress={progressPercent}
                variant={isReviewMode ? 'green' : 'blue'}
                showLabel={false}
                height="h-2"
              />
            </div>
          </div>

          {/* Timer Display */}
          {!isReviewMode && (
            <div
              className={`px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-pixel-sm flex items-center gap-2 ${
                secondsRemaining < 180
                  ? 'bg-red-50 text-error animate-pulse border-error'
                  : 'bg-slate-50 text-ink'
              }`}
            >
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm font-bold tracking-wider">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
          )}

          {/* Submit Test Button */}
          {!isReviewMode && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="pixel-btn-primary text-xs !py-1.5 !px-3.5 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          )}

          {isReviewMode && (
            <button
              onClick={() => navigate('/mcqs')}
              className="pixel-btn-secondary text-xs !py-1.5 !px-3.5"
            >
              Exit Review
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Question on Left, Navigator on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Question View Column (8 cols) */}
        <div className="md:col-span-8">
          <MCQQuestionView
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOption={answers[currentIndex]}
            isMarkedForReview={!!markedForReview[currentIndex]}
            onSelectOption={handleSelectOption}
            onToggleMarkForReview={handleToggleMarkForReview}
            onPrevious={handlePrevious}
            onNext={handleNext}
            canGoPrevious={currentIndex > 0}
            canGoNext={currentIndex < questions.length - 1}
            isReviewMode={isReviewMode}
          />
        </div>

        {/* Question Palette Column (4 cols) */}
        <div className="md:col-span-4">
          <QuestionNavigator
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            onSelectQuestion={(idx) => setCurrentIndex(idx)}
            isReviewMode={isReviewMode}
            questions={questions}
          />

          {/* Help box */}
          {!isReviewMode && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border-2 border-slate-900 shadow-pixel-sm text-xs text-ink-secondary">
              <div className="flex items-center gap-1.5 font-pixel font-bold text-primary mb-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Single Sitting Test</span>
              </div>
              <p>
                Complete your test in one session. Leaving midway discards answers so you can start fresh next time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Ready to submit test?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-ink space-y-2">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <strong className="font-mono">{questions.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Answered:</span>
              <strong className="font-mono text-learning">{answeredCount}</strong>
            </div>
            <div className="flex justify-between">
              <span>Unanswered:</span>
              <strong className="font-mono text-error">
                {questions.length - answeredCount}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Marked for Review:</span>
              <strong className="font-mono text-warning">
                {Object.values(markedForReview).filter(Boolean).length}
              </strong>
            </div>
          </div>

          {questions.length - answeredCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-warning rounded-xl text-xs text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <span>
                You still have {questions.length - answeredCount} unanswered questions. Unanswered items are counted as incorrect.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="pixel-btn-secondary text-xs"
            >
              Cancel &amp; Continue Test
            </button>
            <button
              onClick={() => handleSubmitTest(false)}
              className="pixel-btn-primary text-xs !bg-learning hover:!bg-learning-hover"
            >
              Confirm &amp; Submit
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal When Leaving Midway - item 2 */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Leave test midway?"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-warning rounded-xl text-xs text-amber-900 font-medium flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <span>
              If you leave now, your current answers will be discarded. You will need to take the test again from the start.
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="pixel-btn-primary text-xs"
            >
              Stay in Test
            </button>
            <button
              onClick={handleConfirmLeave}
              className="pixel-btn-secondary text-xs text-error hover:!border-error"
            >
              Leave &amp; Reset Test
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
