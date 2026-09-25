import React from 'react';
import { Globe, ExternalLink, Compass } from 'lucide-react';
import PixelBadge from '../common/PixelBadge';

export default function ExternalWebsites({ websites = [] }) {
  if (!websites || websites.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="font-pixel text-xs text-ink font-bold">No external platforms found</p>
        <p className="text-xs text-ink-secondary mt-1">Try selecting a different domain tab above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-learning" />
          <h3 className="font-pixel text-base font-bold text-ink">External Websites & Roadmaps</h3>
        </div>
        <span className="text-xs font-pixel text-slate-500 font-bold">
          {websites.length} Portals
        </span>
      </div>

      <div className="space-y-3.5">
        {websites.map((item) => (
          <div
            key={item.material_id || item.id}
            className="p-4 rounded-xl bg-surface border-2 border-slate-900 shadow-pixel-sm hover:shadow-pixel hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-pixel text-[10px] font-bold text-learning uppercase tracking-wider">
                  {item.topic_id || item.domain || 'External Resource'}
                </span>
                <PixelBadge variant="green" size="sm">
                  {item.material_type || 'Portal'}
                </PixelBadge>
              </div>

              <h4 className="font-bold text-sm text-ink mb-1.5 leading-snug">
                {item.title}
              </h4>

              {item.description && (
                <p className="text-xs text-ink-secondary line-clamp-2 mb-3">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                {item.url.replace(/^https?:\/\//, '').split('/')[0]}
              </span>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="pixel-btn-secondary text-xs !py-1 !px-2.5 inline-flex items-center gap-1.5"
              >
                <span>Visit Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
