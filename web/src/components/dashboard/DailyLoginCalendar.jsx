import React, { useState, useMemo } from 'react';
import { Calendar, Flame, Trophy, CheckCircle2 } from 'lucide-react';

export default function DailyLoginCalendar({
  currentStreak = 0,
  totalActiveDays = 0,
  attempts = [],
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Build a lookup map of attempts per day in current month: { 'YYYY-MM-DD': count }
  const attemptsByDate = useMemo(() => {
    const map = {};
    if (Array.isArray(attempts)) {
      attempts.forEach((att) => {
        if (att.created_at) {
          const dateStr = att.created_at.split('T')[0];
          map[dateStr] = (map[dateStr] || 0) + 1;
        }
      });
    }
    return map;
  }, [attempts]);

  // Compute 28 or full calendar days dynamically
  const days = useMemo(() => {
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const result = [];

    // Calculate start offset (0 = Sunday, 1 = Monday)
    const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

    // Pad beginning of week if month doesn't start on Monday
    for (let p = 0; p < firstDayIndex; p++) {
      result.push({ isPad: true });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const isoDate = dateObj.toISOString().split('T')[0];
      const count = attemptsByDate[isoDate] || 0;
      const isToday = d === todayDate;
      const isFuture = d > todayDate;
      const active = count > 0 || isToday; // Active if logged in/attempted today

      result.push({
        day: d,
        active,
        count,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday,
        isFuture,
      });
    }

    return result;
  }, [currentYear, currentMonth, todayDate, attemptsByDate]);

  return (
    <div className="bg-surface rounded-2xl border-2 border-slate-900 shadow-pixel p-5 sm:p-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-pixel text-base font-bold text-ink">Daily Activity & Streak</h3>
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
          Status: <span className="font-pixel font-bold text-learning">Active Session ✓</span>
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
          if (item.isPad) {
            return <div key={`pad-${idx}`} className="h-11 sm:h-12" />;
          }

          let bgClass = "bg-slate-100 text-slate-400 border-slate-300";
          if (item.active && !item.isFuture) {
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
              key={`day-${item.day}`}
              onMouseEnter={() => setHoveredDay(item)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`relative h-11 sm:h-12 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 select-none ${bgClass}`}
            >
              <span className="text-xs font-pixel font-bold">
                {item.day}
              </span>
              {item.active && !item.isToday && !item.isFuture && (
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
                <strong>{hoveredDay.date}</strong> — {hoveredDay.count > 0 ? `${hoveredDay.count} questions solved` : (hoveredDay.isToday ? 'Logged in today' : 'No activity recorded')}
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
