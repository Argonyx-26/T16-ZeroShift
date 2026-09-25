import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { learningService } from '../services/learningService';
import { Sparkles, ArrowRight, CheckCircle, HelpCircle, Brain, RefreshCw } from 'lucide-react';
import PenguMascot from '../components/common/PenguMascot';
import PixelBadge from '../components/common/PixelBadge';

export default function QuestionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadFirstQuestion() {
      setLoading(true);
      try {
        const questions = await learningService.getQuestions('dsa', 'easy', 1);
        if (questions && questions.length > 0) {
          setQuestion(questions[0]);
        }
      } catch (err) {
        console.warn('Failed to load initial question:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFirstQuestion();
  }, []);

  const handleSelectOption = (optId) => {
    if (diagnosisResult) return; // already evaluated
    setSelectedOption(optId);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption || !question) return;

    setIsSubmitting(true);
    try {
      const studentId = user?.id || 's_new_learner';
      const diag = await learningService.diagnoseMCQ(
        studentId,
        question.question_id,
        question.topic_id,
        selectedOption,
        question.correct_option_id
      );
      setDiagnosisResult(diag);
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center pixel-grid-dots">
      <div className="w-full max-w-2xl">
        {/* Onboarding Welcome Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border-2 border-slate-900 shadow-pixel-sm mb-4">
            <Sparkles className="w-4 h-4 text-warning" />
            <span className="font-pixel text-xs font-bold text-primary uppercase">
              Onboarding Diagnostic Checkpoint
            </span>
          </div>

          <h1 className="font-pixel text-2xl sm:text-3xl font-bold text-ink">
            Welcome to PenguLearn, {user?.name || 'Explorer'}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-secondary max-w-md mx-auto">
            Let's establish your baseline knowledge with your very first adaptive challenge.
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel-lg p-6 sm:p-8">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="font-pixel text-xs text-ink font-bold">Pengu is preparing your question...</p>
            </div>
          ) : question ? (
            <div className="space-y-6">
              {/* Question metadata */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs font-bold bg-primary text-white px-2 py-0.5 rounded border border-slate-900">
                    Question #1
                  </span>
                  <span className="text-xs font-pixel font-bold text-ink-secondary">
                    {question.topic_id || 'Data Structures'}
                  </span>
                </div>
                <PixelBadge variant="green" size="sm">
                  Diagnostic
                </PixelBadge>
              </div>

              {/* Prompt */}
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink leading-relaxed">
                  {question.prompt}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {question.options?.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === opt.option_id;
                  const isSubmitted = !!diagnosisResult;
                  const isCorrect = question.correct_option_id === opt.option_id;

                  let borderClass = "border-slate-300 hover:border-slate-900 bg-white text-ink";
                  if (isSelected) {
                    borderClass = "border-primary bg-primary-soft text-primary font-bold shadow-pixel-blue";
                  }
                  if (isSubmitted) {
                    if (isCorrect) {
                      borderClass = "border-learning bg-learning-soft text-learning-hover font-bold shadow-pixel-green";
                    } else if (isSelected && !isCorrect) {
                      borderClass = "border-error bg-error-soft text-error font-bold shadow-[2px_2px_0px_#DC2626]";
                    }
                  }

                  return (
                    <button
                      key={opt.option_id}
                      onClick={() => handleSelectOption(opt.option_id)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-between ${borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg border-2 border-current flex items-center justify-center font-pixel text-xs font-bold">
                          {letter}
                        </span>
                        <span className="text-sm font-sans">{opt.option_text}</span>
                      </div>
                      {isSubmitted && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-learning" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Diagnostic Feedback Banner */}
              {diagnosisResult && (
                <div
                  className={`p-4 rounded-2xl border-2 animate-fade-in ${
                    diagnosisResult.diagnosis?.is_correct
                      ? 'bg-learning-soft border-learning text-learning-hover'
                      : 'bg-amber-50 border-warning text-amber-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <PenguMascot
                      pose={diagnosisResult.diagnosis?.is_correct ? 'goal' : 'teacher'}
                      size="sm"
                      animate={false}
                    />
                    <div>
                      <h4 className="font-pixel text-xs font-bold uppercase mb-1">
                        {diagnosisResult.diagnosis?.is_correct
                          ? 'Spot On! Bayesian Mastery Increased'
                          : 'Insight Detected: Misconception Identified'}
                      </h4>
                      <p className="text-xs leading-relaxed font-sans">
                        {diagnosisResult.diagnosis?.is_correct
                          ? 'You clearly understand the fundamentals for this topic! Your BKT baseline has been calibrated.'
                          : question.explanation || 'We recorded your conceptual approach. The adaptive engine will tailor upcoming lessons to reinforce this edge case.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between">
                {!diagnosisResult ? (
                  <>
                    <button
                      onClick={handleProceedToDashboard}
                      className="text-xs font-pixel font-bold text-ink-secondary hover:text-ink underline"
                    >
                      Skip to Dashboard →
                    </button>
                    <button
                      onClick={handleCheckAnswer}
                      disabled={!selectedOption || isSubmitting}
                      className="pixel-btn-primary text-xs inline-flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      <span>{isSubmitting ? 'Evaluating...' : 'Check Answer'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleProceedToDashboard}
                    className="w-full pixel-btn-primary !py-3 inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Enter Your Personalized Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-pixel text-xs text-ink font-bold mb-4">No diagnostic questions available</p>
              <button onClick={handleProceedToDashboard} className="pixel-btn-primary text-xs">
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
