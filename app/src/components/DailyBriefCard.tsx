import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Sparkles, AlertTriangle, ArrowRightCircle, Target, Award } from 'lucide-react';

interface DailyBriefCardProps {
  onSelectConversation?: (recordRef: string) => void;
}

export const DailyBriefCard: React.FC<DailyBriefCardProps> = ({ onSelectConversation }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-xl p-6 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Manager Daily Brief</h2>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Friday, 21 August 2026 (Asia/Kolkata) • Synthesized across 44 selected records</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors self-start sm:self-center"
        >
          <span>{isExpanded ? 'Collapse Brief' : 'Expand Brief'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Urgent CS Blocker */}
          <div className="bg-slate-950/70 border border-rose-900/40 rounded-lg p-4 hover:border-rose-700/60 transition-colors">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Urgent CS Blocker</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Brookmint Holdings Activation Failure
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Subsidiary admins received invite token expiration errors. IT email domain mismatch requires immediate whitelisting.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">M09 Turn 31</span>
              {onSelectConversation && (
                <button
                  onClick={() => onSelectConversation('M09')}
                  className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  Inspect M09 <ArrowRightCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Deal Evaluations */}
          <div className="bg-slate-950/70 border border-indigo-900/40 rounded-lg p-4 hover:border-indigo-700/60 transition-colors">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Target className="w-4 h-4 flex-shrink-0" />
              <span>Active Deal Next Steps</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Asterloom, LedgerBridge & Milan
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              LedgerBridge requires QuickBooks/NetSuite sync; Asterloom evaluating two-tier approval; Milan requested API pricing email on Monday.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">M02, M03, C03</span>
              {onSelectConversation && (
                <button
                  onClick={() => onSelectConversation('M03')}
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  Inspect M03 <ArrowRightCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Coaching Priority */}
          <div className="bg-slate-950/70 border border-amber-900/40 rounded-lg p-4 hover:border-amber-700/60 transition-colors">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Award className="w-4 h-4 flex-shrink-0" />
              <span>Rep Coaching Directives</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Pitching Against Incumbent ERPs
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Arun & Meera pitched basic store expense cards to prospects already satisfied with StoreHarbor & custom ERPs (C05, C06). Must pivot pitch to reconciliation gaps.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">C05, C06</span>
              {onSelectConversation && (
                <button
                  onClick={() => onSelectConversation('C05')}
                  className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  Inspect C05 <ArrowRightCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Card 4: Partnership Channels */}
          <div className="bg-slate-950/70 border border-emerald-900/40 rounded-lg p-4 hover:border-emerald-700/60 transition-colors">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Partnership Channels</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Advisory Firm Referral Pipeline
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Harborpath Advisory (M01) and Willowbank Advisory (C07) refer incorporation clients needing US virtual business accounts and commission splits.
            </p>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">M01 Turn 7, C07</span>
              {onSelectConversation && (
                <button
                  onClick={() => onSelectConversation('M01')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 text-[11px]"
                >
                  Inspect M01 <ArrowRightCircle className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
