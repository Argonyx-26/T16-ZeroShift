import React, { useState, useEffect } from 'react';
import { learningService } from '../services/learningService';
import YouTubeCarousel from '../components/syllabus/YouTubeCarousel';
import ReadingMaterials from '../components/syllabus/ReadingMaterials';
import ExternalWebsites from '../components/syllabus/ExternalWebsites';
import { Search, Filter, RefreshCw, BookOpen, Sparkles } from 'lucide-react';
import PenguMascot from '../components/common/PenguMascot';

const DOMAINS = [
  { id: 'all', label: 'All Curricula' },
  { id: 'dsa', label: 'DSA' },
  { id: 'dbms', label: 'DBMS' },
  { id: 'system_design', label: 'System Design' },
  { id: 'web_dev', label: 'Web Dev' },
];

export default function SyllabusPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await learningService.getStudyMaterials();
      setMaterials(data || []);
    } catch (err) {
      setError('Could not load learning resources. Showing offline catalog.');
      setMaterials(learningService.getStudyMaterials());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Filter materials by domain & search
  const filteredMaterials = materials.filter((m) => {
    const matchesDomain = selectedDomain === 'all' || m.domain === selectedDomain;
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topic_id && m.topic_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const videoMaterials = filteredMaterials.filter(
    (m) => m.display_mode === 'video' || m.can_embed || m.material_type === 'video'
  );
  const readingMaterials = filteredMaterials.filter(
    (m) => m.display_mode === 'file' || m.material_type === 'article' || m.material_type === 'tutorial'
  );
  const externalMaterials = filteredMaterials.filter(
    (m) => m.display_mode === 'external_link' || m.material_type === 'practice' || m.material_type === 'roadmap' || m.material_type === 'reference'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner with Pengu Teacher */}
      <div className="bg-surface rounded-3xl border-2 border-slate-900 shadow-pixel p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/30 text-xs font-pixel font-bold text-primary mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curated Curriculum & Media</span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl font-bold text-ink">
            Syllabus & Learning Resources
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink-secondary max-w-xl">
            Stream high-yield video lectures, study deep-dive reading guides, and launch external practice roadmaps.
          </p>
        </div>

        <div className="flex-shrink-0">
          <PenguMascot
            pose="teacher"
            size="md"
            speech="Study smartly today!"
            speechPosition="top"
            alt="Pengu Teacher Mascot"
          />
        </div>
      </div>

      {/* 1. TOP: Continuous YouTube Video Carousel */}
      <section aria-label="Video Lectures">
        <YouTubeCarousel videos={videoMaterials.length > 0 ? videoMaterials : materials.filter((m) => m.url?.includes('youtu'))} />
      </section>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border-2 border-slate-900 shadow-pixel-sm">
        {/* Domain Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {DOMAINS.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className={`px-3 py-1.5 rounded-xl font-pixel text-xs font-bold whitespace-nowrap transition-all ${
                selectedDomain === domain.id
                  ? 'bg-primary text-white border-2 border-slate-900 shadow-pixel-sm'
                  : 'bg-slate-100 text-ink-secondary hover:bg-slate-200 border-2 border-transparent'
              }`}
            >
              {domain.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search topic or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-hidden bg-white"
          />
        </div>
      </div>

      {/* 2. BELOW: Main Resource Area (Two columns on desktop, stacked on mobile) */}
      <section aria-label="Main Resources">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="font-pixel text-xs text-ink font-bold">Loading syllabus resources...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border-2 border-dashed border-slate-300">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-pixel text-base font-bold text-ink mb-1">
              No learning resources available yet.
            </h3>
            <p className="text-xs text-ink-secondary mb-4">
              Try adjusting your search terms or filter domain above.
            </p>
            <button
              onClick={() => {
                setSelectedDomain('all');
                setSearchQuery('');
              }}
              className="pixel-btn-secondary text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Column 1: Reading Materials */}
            <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-5 sm:p-6">
              <ReadingMaterials materials={readingMaterials} />
            </div>

            {/* Column 2: External Websites */}
            <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-5 sm:p-6">
              <ExternalWebsites websites={externalMaterials} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
