import React, { useState } from 'react';
import { Calendar, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import PenguMascot from '../common/PenguMascot';

export default function DailyLoginCalendar({
  currentStreak = 5,
  totalActiveDays = 22,
  activityData = null, // Can accept DB array of dates
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Month definition: September 2026 (or dynamic current month)
  const monthName = "September 2026";
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Generate realistic calendar days for September 2026
  // Sept 1 2026 was a Tuesday (index 1 in Mon-start week)
  // Let's create a 4-week grid of recent days leading up to today (day 26)
  const days = [
    // Week 1
    { day: 1, active: true, count: 3, date: 'Sep 1, 2026', dayOfWeek: 'Tue' },
    { day: 2, active: true, count: 2, date: 'Sep 2, 2026', dayOfWeek: 'Wed' },
    { day: 3, active: false, count: 0, date: 'Sep 3, 2026', dayOfWeek: 'Thu' },
    { day: 4, active: true, count: 4, date: 'Sep 4, 2026', dayOfWeek: 'Fri' },
    { day: 5, active: true, count: 5, date: 'Sep 5, 2026', dayOfWeek: 'Sat' },
    { day: 6, active: false, count: 0, date: 'Sep 6, 2026', dayOfWeek: 'Sun' },
    { day: 7, active: true, count: 1, date: 'Sep 7, 2026', dayOfWeek: 'Mon' },
    // Week 2
    { day: 8, active: true, count: 2, date: 'Sep 8, 2026', dayOfWeek: 'Tue' },
    { day: 9, active: true, count: 3, date: 'Sep 9, 2026', dayOfWeek: 'Wed' },
    { day: 10, active: true, count: 4, date: 'Sep 10, 2026', dayOfWeek: 'Thu' },
    { day: 11, active: true, count: 2, date: 'Sep 11, 2026', dayOfWeek: 'Fri' },
    { day: 12, active: false, count: 0, date: 'Sep 12, 2026', dayOfWeek: 'Sat' },
    { day: 13, active: false, count: 0, date: 'Sep 13, 2026', dayOfWeek: 'Sun' },
    { day: 14, active: true, count: 3, date: 'Sep 14, 2026', dayOfWeek: 'Mon' },
    // Week 3
    { day: 15, active: true, count: 4, date: 'Sep 15, 2026', dayOfWeek: 'Tue' },
    { day: 16, active: true, count: 1, date: 'Sep 16, 2026', dayOfWeek: 'Wed' },
    { day: 17, active: true, count: 5, date: 'Sep 17, 2026', dayOfWeek: 'Thu' },
    { day: 18, active: true, count: 2, date: 'Sep 18, 2026', dayOfWeek: 'Fri' },
    { day: 19, active: false, count: 0, date: 'Sep 19, 2026', dayOfWeek: 'Sat' },
    { day: 20, active: true, count: 3, date: 'Sep 20, 2026', dayOfWeek: 'Sun' },
    { day: 21, active: true, count: 4, date: 'Sep 21, 2026', dayOfWeek: 'Mon' },
    // Week 4 (Current active streak)
    { day: 22, active: true, count: 3, date: 'Sep 22, 2026', dayOfWeek: 'Tue' },
    { day: 23, active: true, count: 4, date: 'Sep 23, 2026', dayOfWeek: 'Wed' },
    { day: 24, active: true, count: 2, date: 'Sep 24, 2026', dayOfWeek: 'Thu' },
    { day: 25, active: true, count: 5, date: 'Sep 25, 2026', dayOfWeek: 'Fri' },
    { day: 26, active: true, count: 3, date: 'Sep 26, 2026', dayOfWeek: 'Sat', isToday: true },
    { day: 27, active: false, count: 0, date: 'Sep 27, 2026', dayOfWeek: 'Sun', isFuture: true },
    { day: 28, active: false, count: 0, date: 'Sep 28, 2026', dayOfWeek: 'Mon', isFuture: true },
  ];

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-5 sm:p-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-pixel text-base font-bold text-ink">Daily Login & Streak</h3>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Consistency is the secret to algorithmic mastery.
          </p>
        </div>

        {/* Badges for streak and active count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border-2 border-slate-900 shadow-pixel-sm">
            <Flame className="w-4 h-4 text-warning fill-warning animate-pulse" />
            <div>
              <span className="font-pixel text-xs font-bold text-ink">{currentStreak} Day Streak</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-learning-soft border-2 border-slate-900 shadow-pixel-sm">
            <Trophy className="w-4 h-4 text-learning" />
            <div>
              <span className="font-pixel text-xs font-bold text-learning-hover">{totalActiveDays} Total Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month Label */}
      <div className="flex items-center justify-between mb-3 px-1 text-xs">
        <span className="font-pixel font-bold text-ink uppercase tracking-wider">{monthName}</span>
        <span className="text-[11px] text-ink-secondary font-medium">
          Logged in today: <span className="font-pixel font-bold text-learning">Active ✓</span>
        </span>
      </div>

      {/* Weekday column headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-pixel font-bold text-slate-400">
        {daysOfWeek.map((dow) => (
          <div key={dow} className="py-1">
            {dow}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="relative grid grid-cols-7 gap-2">
        {days.map((item, idx) => {
          let bgClass = "bg-slate-100 text-slate-400 border-slate-300";
          if (item.active) {
            bgClass = "bg-learning-soft text-learning-hover border-learning hover:bg-emerald-100 shadow-[2px_2px_0px_#16A34A]";
          }
          if (item.isToday) {
            bgClass = "bg-primary text-white border-slate-900 shadow-pixel ring-2 ring-primary ring-offset-2";
          }
          if (item.isFuture) {
            bgClass = "bg-slate-50 text-slate-300 border-dashed border-slate-200 opacity-60";
          }

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`relative h-11 sm:h-12 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 select-none ${bgClass}`}
            >
              <span className="text-xs font-pixel font-bold">
                {item.day}
              </span>
              {item.active && !item.isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-learning mt-0.5" />
              )}
              {item.isToday && (
                <span className="text-[9px] font-pixel font-bold text-yellow-300 mt-0.5">
                  TODAY
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Day Detail / Tooltip Banner */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-ink-secondary">
        <div className="flex items-center gap-2">
          {hoveredDay ? (
            <>
              <CheckCircle2 className={`w-4 h-4 ${hoveredDay.active ? 'text-learning' : 'text-slate-400'}`} />
              <span className="font-medium text-ink">
                <strong>{hoveredDay.date}</strong> — {hoveredDay.active ? `${hoveredDay.count} lessons / tests solved` : 'No activity recorded'}
              </span>
            </>
          ) : (
            <span className="text-ink-secondary italic">
              Hover over any day to see study logs and completed challenges.
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-pixel text-ink-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-learning-soft border border-learning" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary border border-slate-900" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
            <span>Rest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
