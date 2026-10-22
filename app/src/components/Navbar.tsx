import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  RefreshCw,
  Download,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';
import { BackendStatus } from '../utils/api';

export type ActiveTab = 'dashboard' | 'inbox' | 'routing' | 'replay' | 'exports' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  recordCount: number;
  usableCount: number;
  appliedBatch: string;
  backendStatus?: BackendStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  recordCount,
  usableCount,
  appliedBatch: _appliedBatch,
  backendStatus
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
    { id: 'inbox', label: 'Conversation Inbox', icon: <Inbox className="w-4 h-4 flex-shrink-0" /> },
    { id: 'routing', label: 'Routing & Review', icon: <CheckSquare className="w-4 h-4 flex-shrink-0" /> },
    { id: 'replay', label: 'Import & Replay', icon: <RefreshCw className="w-4 h-4 flex-shrink-0" /> },
    { id: 'exports', label: 'Exports & Manifest', icon: <Download className="w-4 h-4 flex-shrink-0" /> },
    { id: 'settings', label: 'Dictionary & Rules', icon: <BookOpen className="w-4 h-4 flex-shrink-0" /> }
  ];

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main single-row desktop navbar: consistent 80px (h-20) height with vertically centered items */}
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* 1. Left: Brand & Logo Grouped Cleanly */}
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-lg flex-shrink-0 select-none">
              S
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base whitespace-nowrap leading-none">
                  SpendNest
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 whitespace-nowrap leading-normal">
                  Revenue Intelligence
                </span>
              </div>
              <p className="text-[11px] text-slate-400 whitespace-nowrap mt-1 leading-none hidden lg:block">
                Manager Workspace & Conversation Triage
              </p>
            </div>
          </div>

          {/* 2. Middle: Navigation Links Evenly Spaced with Icons & whitespace-nowrap */}
          <nav className="hidden lg:flex items-center space-x-1.5 flex-shrink-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-10 flex items-center gap-2 px-3 xl:px-3.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. Right: Date Badge & Record Counter with Consistent Height (h-10) and Vertical Alignment */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Activity Date Badge */}
            <div className="hidden xl:flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs whitespace-nowrap flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-400">Activity:</span>
              <span className="font-semibold text-slate-200">21 Aug 2026 (IST)</span>
            </div>

            {/* Records / Transcripts Metric Counter */}
            <div className="flex items-center gap-2 h-10 px-3.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs whitespace-nowrap flex-shrink-0 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span className="font-mono text-slate-200 font-semibold">{recordCount}</span>
              <span className="text-slate-400">records</span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-emerald-400 font-semibold">{usableCount}</span>
              <span className="text-slate-400">transcripts</span>
            </div>

            {/* Backend Connection Indicator (when configured) */}
            {backendStatus?.isConfigured && (
              <div
                className={`hidden md:flex items-center gap-1.5 h-10 px-3 rounded-lg border text-xs whitespace-nowrap flex-shrink-0 transition-colors ${
                  backendStatus.connected
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800/70 text-rose-300'
                }`}
                title={backendStatus.message || (backendStatus.connected ? 'Connected to backend REST API' : 'Disconnected from backend')}
              >
                <span className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{backendStatus.connected ? 'API Connected' : 'API Disconnected'}</span>
              </div>
            )}
          </div>

        </div>

        {/* Responsive Mobile / Tablet Navigation (< lg screens) */}
        <div className="lg:hidden flex items-center space-x-1.5 overflow-x-auto py-2.5 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`h-9 flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
