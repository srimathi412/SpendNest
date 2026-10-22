import React from 'react';
import { ProcessedRecord, DashboardMetrics } from '../types/data';
import { KPICards } from '../components/KPICards';
import { DailyBriefCard } from '../components/DailyBriefCard';
import {
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileCheck,
  PhoneCall,
  Video
} from 'lucide-react';

interface DashboardViewProps {
  records: ProcessedRecord[];
  metrics: DashboardMetrics;
  onSelectRecord: (record: ProcessedRecord) => void;
  onNavigateToInboxWithFilter: (route?: any, status?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  metrics,
  onSelectRecord,
  onNavigateToInboxWithFilter
}) => {
  // Urgent Action items (Action Required)
  const actionRequiredRecords = records.filter(r => r.review_status === 'Action Required');

  // Activity breakdown by Call Rep
  const callRepBreakdown = React.useMemo(() => {
    const map = new Map<string, { total: number; connected: number; withText: number }>();
    records.filter(r => r.source_type === 'call').forEach(c => {
      const rep = c.person_label;
      const current = map.get(rep) || { total: 0, connected: 0, withText: 0 };
      current.total++;
      if (c.raw_record.payload?.is_connected) current.connected++;
      if (c.has_usable_transcript) current.withText++;
      map.set(rep, current);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [records]);

  // Activity breakdown by Meeting Organizer
  const meetingOrganizerBreakdown = React.useMemo(() => {
    const map = new Map<string, { total: number; withTurns: number }>();
    records.filter(r => r.source_type === 'meeting').forEach(m => {
      const org = m.person_label;
      const current = map.get(org) || { total: 0, withTurns: 0 };
      current.total++;
      if (m.has_usable_transcript) current.withTurns++;
      map.set(org, current);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [records]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Headline Bar */}
      <KPICards
        metrics={metrics}
        onFilterReviewNeeded={() => onNavigateToInboxWithFilter(undefined, 'Action Required')}
        onFilterUsableText={() => onNavigateToInboxWithFilter()}
      />

      {/* 21 August 2026 Manager Daily Brief */}
      <DailyBriefCard
        onSelectConversation={(ref) => {
          const target = records.find(r => r.record_ref === ref);
          if (target) onSelectRecord(target);
        }}
      />

      {/* Two Column Grid: Urgent Tasks & Route Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Action Queue */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white text-sm">Action Items Requiring Manager Decision</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                {actionRequiredRecords.length} Active
              </span>
            </div>
            <button
              onClick={() => onNavigateToInboxWithFilter(undefined, 'Action Required')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all in inbox <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {actionRequiredRecords.slice(0, 6).map((record) => (
              <div
                key={record.identityKey}
                onClick={() => onSelectRecord(record)}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {record.record_ref}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {record.source_type === 'meeting'
                        ? (record.raw_record.payload?.title || record.record_ref)
                        : `Call with ${record.raw_record.payload?.to_number || 'Prospect'}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({record.person_label})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {record.analysis.rationale}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 group-hover:border-sky-500/50 transition-colors">
                    {record.effective_route}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Route Taxonomy Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">Routing Taxonomy Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500">{metrics.totalUniqueRecords} items</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(metrics.routeCounts).map(([route, count]) => {
              const percentage = metrics.totalUniqueRecords > 0
                ? ((count / metrics.totalUniqueRecords) * 100).toFixed(0)
                : '0';

              return (
                <div
                  key={route}
                  onClick={() => onNavigateToInboxWithFilter(route)}
                  className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-lg p-2.5 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-200">{route}</span>
                    <div className="w-32 bg-slate-850 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-500 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-xs">{count}</span>
                    <span className="text-[10px] text-slate-500 block">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80">
            Click any category to filter the conversation inbox.
          </div>
        </div>
      </div>

      {/* People Activity Breakdown: Reps vs Organizers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Call Reps Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-sky-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Call Representatives Activity</h3>
                <p className="text-[11px] text-slate-400">Caller accounts assigned to 30 selected calls</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">{callRepBreakdown.length} Reps</span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {callRepBreakdown.map(([rep, stats]) => (
              <div key={rep} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{rep}</span>
                  <span className="text-[11px] text-slate-500">(Sales Rep)</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span><strong>{stats.total}</strong> calls</span>
                  <span><strong>{stats.connected}</strong> conn</span>
                  <span className="text-emerald-400"><strong>{stats.withText}</strong> texts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Organizers Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Meeting Calendar Organizers</h3>
                <p className="text-[11px] text-slate-400">Organizers are not sales reps or attendees</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">{meetingOrganizerBreakdown.length} Organizers</span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs max-h-48 overflow-y-auto pr-1">
            {meetingOrganizerBreakdown.map(([org, stats]) => (
              <div key={org} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate max-w-[200px]" title={org}>
                  <span className="font-mono text-slate-300 truncate">{org}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 flex-shrink-0">
                  <span><strong>{stats.total}</strong> meetings</span>
                  <span className="text-emerald-400"><strong>{stats.withTurns}</strong> with turns</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
