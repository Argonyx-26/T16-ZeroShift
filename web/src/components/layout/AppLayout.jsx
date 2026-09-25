import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import PenguMascot from '../common/PenguMascot';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b-2 border-slate-900 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border-2 border-slate-900 shadow-pixel-sm bg-white hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-ink" />
            </button>
            <div className="flex items-center gap-2">
              <PenguMascot pose="peek" size="xs" animate={false} />
              <span className="font-pixel font-bold text-base text-ink">ZeroShift</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-1.5 rounded-lg border-2 border-slate-900 shadow-pixel-sm bg-white text-ink-secondary hover:text-ink"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          <div className="max-w-6xl mx-auto pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
