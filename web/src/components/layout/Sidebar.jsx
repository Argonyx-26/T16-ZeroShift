import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  FileCode,
  User,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PenguMascot from '../common/PenguMascot';
import PixelBadge from '../common/PixelBadge';

export default function Sidebar({ onCloseMobile = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      disabled: false,
    },
    {
      to: '/syllabus',
      label: 'Syllabus',
      icon: BookOpen,
      disabled: false,
    },
    {
      to: '/mcqs',
      label: 'MCQs',
      icon: CheckSquare,
      disabled: false,
    },
    {
      to: '/vscode-docs',
      label: 'VS-Code Docs',
      icon: FileCode,
      disabled: false,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      disabled: false,
    },
  ];

  return (
    <aside className="w-64 h-full bg-surface border-r-2 border-slate-900 flex flex-col justify-between select-none">
      {/* Top Logo & Pengu Header */}
      <div>
        <div className="p-5 border-b-2 border-slate-900 bg-slate-50 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={onCloseMobile}>
            <div className="w-10 h-10 rounded-xl bg-primary-soft border-2 border-slate-900 shadow-pixel-sm flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              <PenguMascot pose="peek" size="xs" alt="Logo Pengu" animate={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-pixel font-bold text-lg text-ink tracking-tight">ZeroShift</span>
                <span className="w-2 h-2 rounded-full bg-learning animate-pulse" />
              </div>
              <p className="text-[10px] font-pixel text-primary font-bold uppercase tracking-wider">
                Pengu Academy
              </p>
            </div>
          </NavLink>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5 mt-2" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-ink-muted cursor-not-allowed opacity-60 border border-transparent font-medium text-sm"
                  title="Coming soon"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  <PixelBadge variant="neutral" size="sm">
                    {item.badge}
                  </PixelBadge>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-primary-soft text-primary font-bold border-2 border-slate-900 shadow-pixel-sm'
                      : 'text-ink-secondary hover:bg-slate-100 hover:text-ink border-2 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-primary' : 'text-ink-secondary'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile & Settings Area */}
      <div className="p-4 border-t-2 border-slate-900 bg-slate-50 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border-2 border-slate-900 shadow-pixel-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-soft border border-slate-900 flex items-center justify-center font-pixel font-bold text-primary text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink truncate">
                {user?.name || 'Pengu Student'}
              </p>
              <p className="text-[10px] text-ink-secondary font-mono truncate">
                {user?.email || 'student@argonyx.edu'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-ink-secondary hover:text-error hover:bg-error-soft rounded-lg transition-colors border border-transparent hover:border-error"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Small motivational Pengu note */}
        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-ink-secondary font-pixel">
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="w-3 h-3 text-warning" /> Ready to learn
          </span>
          <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
            v2.0
          </span>
        </div>
      </div>
    </aside>
  );
}
