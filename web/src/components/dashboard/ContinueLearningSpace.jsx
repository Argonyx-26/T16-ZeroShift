import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, BookOpen, AlertCircle, ArrowRight, Play, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PenguMascot from '../common/PenguMascot';
import PixelBadge from '../common/PixelBadge';
import { learningService } from '../../services/learningService';

export default function ContinueLearningSpace({
  recommendedTopic = null,
  featuredMaterial = null,
}) {
  const [topic, setTopic] = useState(recommendedTopic);
  const [material, setMaterial] = useState(featuredMaterial);

  useEffect(() => {
    async function loadSpaceData() {
      try {
        if (!topic) {
          const topics = await learningService.getTopics();
          if (topics && topics.length > 0) {
            setTopic(topics[0]);
          }
        }
        if (!material) {
          const mats = await learningService.getStudyMaterials(null, 'video');
          if (mats && mats.length > 0) {
            setMaterial(mats[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load learning space resources:', err);
      }
    }
    loadSpaceData();
  }, []);

  const focusTitle = topic?.display_name || 'Core Fundamentals';
  const focusDomain = (topic?.domain || 'DSA').toUpperCase();
  const videoTitle = material?.title || 'Data Structures & Algorithms Overview';
  const videoDomain = (material?.domain || 'DSA').toUpperCase();

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <h3 className="font-pixel text-lg font-bold text-ink">Your Learning Space</h3>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Personalized recommendations, upcoming tests, and adaptive study suggestions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PixelBadge variant="arcade" size="sm" icon={Sparkles}>
            Adaptive AI Ready
          </PixelBadge>
        </div>
      </div>

      {/* Recommended Focus Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Live Weak / Current Topic focus */}
        <div className="p-4 rounded-xl bg-blue-50/50 border-2 border-slate-900 shadow-pixel-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] font-bold text-primary uppercase tracking-wider">
                Recommended Focus
              </span>
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <h4 className="font-bold text-sm text-ink mb-1">{focusTitle}</h4>
            <p className="text-xs text-ink-secondary mb-3">
              Curriculum topic in {focusDomain}. Practice MCQs to boost Bayesian mastery score.
            </p>
          </div>
          <Link
            to={topic ? `/mcqs/test/test_${topic.topic_id}` : '/mcqs'}
            className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-primary hover:text-primary-hover group"
          >
            <span>Practice Topic</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Live Recommended Video from DB */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border-2 border-slate-900 shadow-pixel-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] font-bold text-learning uppercase tracking-wider">
                Top Video Resource
              </span>
              <Play className="w-3.5 h-3.5 text-learning fill-learning" />
            </div>
            <h4 className="font-bold text-sm text-ink mb-1 line-clamp-1">{videoTitle}</h4>
            <p className="text-xs text-ink-secondary mb-3">
              Curated lecture for {videoDomain} students with verified in-site embedding.
            </p>
          </div>
          <Link
            to="/syllabus"
            className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-learning-hover hover:text-learning group"
          >
            <span>Watch in Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Adaptive Revision Checkpoint */}
        <div className="p-4 rounded-xl bg-amber-50/50 border-2 border-slate-900 shadow-pixel-sm hover:translate-y-[-2px] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[11px] font-bold text-warning uppercase tracking-wider">
                Adaptive Checkpoint
              </span>
              <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">
                10 mins
              </span>
            </div>
            <h4 className="font-bold text-sm text-ink mb-1">Knowledge Retention Quiz</h4>
            <p className="text-xs text-ink-secondary mb-3">
              Adaptive diagnostic test calibrated by forgetting-curve memory decay.
            </p>
          </div>
          <Link
            to="/mcqs"
            className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-amber-700 hover:text-amber-800 group"
          >
            <span>Start Test</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Spacious Open Area with Friendly Pengu Companion Note */}
      <div className="mt-8 p-6 rounded-2xl bg-slate-50/60 border-2 border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <PenguMascot pose="teacher" size="sm" alt="Pengu Guide" animate={false} />
          <div>
            <h5 className="font-pixel text-xs font-bold text-ink uppercase tracking-wider">
              Study Companion Online
            </h5>
            <p className="text-xs text-ink-secondary mt-0.5">
              Bayesian knowledge tracing is actively monitoring your learning curve across all 12 curriculum topics.
            </p>
          </div>
        </div>

        <Link
          to="/syllabus"
          className="pixel-btn-secondary text-xs font-bold whitespace-nowrap"
        >
          Explore All Materials
        </Link>
      </div>
    </div>
  );
}
