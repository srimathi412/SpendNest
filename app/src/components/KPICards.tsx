import React from 'react';
import { DashboardMetrics } from '../types/data';
import { PhoneCall, Video, FileText, CheckCircle2, AlertCircle, Users, HelpCircle } from 'lucide-react';

interface KPICardsProps {
  metrics: DashboardMetrics;
  onFilterReviewNeeded?: () => void;
  onFilterUsableText?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  metrics,
  onFilterReviewNeeded,
  onFilterUsableText
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Activity & Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Selected Records
          </span>
          <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 border border-sky-800/40">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white font-mono">
            {metrics.totalUniqueRecords}
          </span>
          <span className="text-xs text-slate-400">unique items</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-300">
            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
            <span><strong>{metrics.totalCalls}</strong> calls</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span><strong>{metrics.totalMeetings}</strong> meetings</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Keyed strictly by <code className="text-slate-400 font-mono">(source_type, source_id)</code>
        </div>
      </div>

      {/* 2. Usable Transcript Coverage */}
      <div
        onClick={onFilterUsableText}
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-emerald-800/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">
            Transcript Coverage
          </span>
          <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-emerald-400 font-mono">
            {metrics.usableTranscriptPercentage.toFixed(1)}%
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({metrics.usableTranscriptCount} / {metrics.usableTranscriptDenominator})
          </span>
        </div>
        <div className="mt-3 text-xs pt-3 border-t border-slate-800/80 text-slate-400">
          <span className="text-slate-300 font-semibold">Denominator:</span> {metrics.usableTranscriptDenominator} total selected records
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          {metrics.totalUniqueRecords - metrics.usableTranscriptCount} records withheld or silent
        </div>
      </div>

      {/* 3. Source-Reported Connection Rate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Reported Connection
          </span>
          <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40">
            <PhoneCall className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-amber-400 font-mono">
            {metrics.sourceReportedConnectionRate.toFixed(1)}%
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({metrics.sourceReportedConnectedCount} / {metrics.sourceReportedConnectedDenominator})
          </span>
        </div>
        <div className="mt-3 text-xs pt-3 border-t border-slate-800/80 text-slate-400 flex items-center justify-between">
          <span><strong className="text-slate-300">Denominator:</strong> {metrics.sourceReportedConnectedDenominator} calls</span>
          <span className="text-[11px] text-slate-500">Unknown: 0</span>
        </div>
        <div className="mt-2 text-[11px] text-amber-500/80 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>Upstream machine label; not verified dialogue</span>
        </div>
      </div>

      {/* 4. Action / Review Queue */}
      <div
        onClick={onFilterReviewNeeded}
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-sky-800/60 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-sky-400 transition-colors">
            Action Items Queue
          </span>
          <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-indigo-400 font-mono">
            {metrics.reviewCounts['Action Required'] || 0}
          </span>
          <span className="text-xs text-slate-400">active tasks</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80 text-slate-400">
          <span>{metrics.reviewCounts['Reviewed'] || 0} reviewed</span>
          <span className="text-slate-600">•</span>
          <span>{metrics.reviewCounts['Intake Logged'] || 0} intake logged</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 flex-shrink-0" />
          <span>{metrics.uniqueCallReps} Call Reps | {metrics.uniqueMeetingOrganizers} Organizers</span>
        </div>
      </div>
    </div>
  );
};
