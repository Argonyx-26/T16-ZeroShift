import React, { useRef, useState } from 'react';
import { Play, ChevronLeft, ChevronRight, Video, ExternalLink, Sparkles } from 'lucide-react';
import PixelBadge from '../common/PixelBadge';
import Modal from '../common/Modal';

export default function YouTubeCarousel({
  videos = [],
  onSelectVideo = null,
}) {
  const scrollRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Manual scroll buttons
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Enable mouse wheel horizontal scrolling
  const handleWheel = (e) => {
    if (scrollRef.current && e.deltaY !== 0) {
      // If user scrolls vertical wheel over carousel, scroll horizontally
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleCardClick = (video) => {
    if (onSelectVideo) {
      onSelectVideo(video);
    } else {
      setSelectedVideo(video);
    }
  };

  const displayVideos = videos && videos.length > 0 ? videos : [];

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-5 sm:p-6 mb-8">
      {/* Header and manual navigation buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white border border-slate-900">
              <Play className="w-3.5 h-3.5 fill-white" />
            </div>
            <h3 className="font-pixel text-base font-bold text-ink">
              Featured YouTube Video Lessons
            </h3>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Streaming curriculum lectures. Scroll horizontally with your mouse wheel or arrows, click to play.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg border-2 border-slate-900 shadow-pixel-sm bg-white hover:bg-slate-100 transition-colors active:translate-y-0.5"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-ink" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg border-2 border-slate-900 shadow-pixel-sm bg-white hover:bg-slate-100 transition-colors active:translate-y-0.5"
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-ink" />
          </button>
        </div>
      </div>

      {/* Horizontally scrolling container - removed jumpy marquee on hover */}
      <div className="relative">
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth select-none cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayVideos.map((video, idx) => (
            <div
              key={`${video.material_id || video.id || 'vid'}-${idx}`}
              onClick={() => handleCardClick(video)}
              className="w-72 sm:w-80 flex-shrink-0 bg-slate-50 rounded-xl border-2 border-slate-900 shadow-pixel-sm hover:shadow-pixel hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-slate-800 overflow-hidden border-b-2 border-slate-900">
                <img
                  src={
                    video.thumbnail ||
                    `https://images.unsplash.com/photo-1516116211227-bbc13c72e616?w=600&auto=format&fit=crop&q=80`
                  }
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600 border-2 border-slate-900 shadow-pixel-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[10px] font-bold">
                    {video.duration}
                  </div>
                )}

                {/* YouTube Tag */}
                <div className="absolute top-2 left-2">
                  <PixelBadge variant="arcade" size="sm">
                    YouTube
                  </PixelBadge>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-pixel font-bold text-primary mb-1 uppercase tracking-wide">
                    <span>{video.domain || 'DSA'}</span>
                    <span>•</span>
                    <span className="truncate">{video.topic_id || video.topic || 'Curriculum'}</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-ink line-clamp-2 leading-snug">
                    {video.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-[11px] text-ink-secondary">
                  <span className="font-medium truncate">{video.channel || 'Educational Partner'}</span>
                  <span className="font-pixel text-primary font-bold text-[10px]">Play Video →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* In-app YouTube Video Embed Modal */}
      {selectedVideo && (
        <Modal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-slate-900 shadow-pixel bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${
                  selectedVideo.url?.includes('youtu.be/')
                    ? selectedVideo.url.split('youtu.be/')[1]?.split('?')[0]
                    : selectedVideo.url?.includes('v=')
                    ? new URL(selectedVideo.url).searchParams.get('v')
                    : '3_x_Fb31NLE'
                }?autoplay=1`}
                title={selectedVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-ink-secondary font-medium">
                Domain: <strong className="text-ink uppercase">{selectedVideo.domain}</strong> | Duration: {selectedVideo.duration}
              </div>
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-pixel font-bold text-primary hover:underline"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
