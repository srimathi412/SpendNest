import React, { useState } from 'react';
import { ProcessedRecord, RouteCategory, ReviewStatus } from '../types/data';
import {
  CheckSquare,
  Edit3,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Video,
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatKolkataTimeOnly } from '../utils/formatters';

interface RoutingReviewViewProps {
  records: ProcessedRecord[];
  onSelectRecord: (record: ProcessedRecord) => void;
  onUpdateRoute: (sourceType: string, sourceId: string, newRoute: RouteCategory, notes?: string, status?: ReviewStatus) => void;
  onResetRoute: (sourceType: string, sourceId: string) => void;
}

export const RoutingReviewView: React.FC<RoutingReviewViewProps> = ({
  records,
  onSelectRecord,
  onUpdateRoute,
  onResetRoute
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RouteCategory | 'ALL'>('ALL');

  const manualOverrides = records.filter(r => r.is_manually_overridden);

  const filteredRecords = selectedCategory === 'ALL'
    ? records
    : records.filter(r => r.effective_route === selectedCategory);

  const categories: RouteCategory[] = [
    'Sales Coaching',
    'Deal Next Steps',
    'Customer Success / Support',
    'Partnership Referral',
    'Internal / Operations',
    'Triage / Unqualified',
    'Missing Audio / Exception'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-white">Routing & Manager Review</h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-semibold">
            {manualOverrides.length} Manual Overrides Active
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review automated category assignments, apply human judgment overrides, and verify that decisions persist through data replays and restarts.
        </p>
      </div>

      {/* Manual Overrides Callout Card */}
      {manualOverrides.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Edit3 className="w-4 h-4" />
              <h3 className="font-bold text-sm">Active Manual Overrides ({manualOverrides.length})</h3>
            </div>
            <span className="text-xs text-amber-500/80">
              Guaranteed to survive re-imports and batch updates per DATA_CONTRACT.md
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {manualOverrides.map(r => (
              <div
                key={r.identityKey}
                className="bg-slate-900 border border-amber-900/40 rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {r.record_ref}
                    </span>
                    <span className="font-medium text-slate-200 truncate">
                      {r.source_type === 'meeting' ? r.raw_record.payload?.title : `Call with ${r.person_label}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Overridden to: <strong className="text-amber-300">{r.effective_route}</strong> (was <em>{r.suggested_route}</em>)
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onSelectRecord(r)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                    title="Inspect details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onResetRoute(r.source_type, r.source_id)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Reset to automated route"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Categories ({records.length})
        </button>
        {categories.map(cat => {
          const count = records.filter(r => r.effective_route === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Filtered Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.map(record => (
          <div
            key={record.identityKey}
            onClick={() => onSelectRecord(record)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all cursor-pointer space-y-3 shadow-sm group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
                  {record.record_ref}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                  record.source_type === 'call' ? 'bg-sky-950 text-sky-400 border border-sky-800/40' : 'bg-indigo-950 text-indigo-400 border border-indigo-800/40'
                }`}>
                  {record.source_type === 'call' ? <PhoneCall className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                  {record.source_type.toUpperCase()}
                </span>
                {record.is_manually_overridden && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                    <Edit3 className="w-2.5 h-2.5" /> Overridden
                  </span>
                )}
              </div>

              <span className="text-slate-400 font-mono text-[11px]">
                {formatKolkataTimeOnly(record.activity_timestamp)}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs group-hover:text-sky-300 transition-colors">
                {record.source_type === 'meeting' ? (record.raw_record.payload?.title || record.record_ref) : `Call with ${record.person_label}`}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {record.analysis.rationale}
              </p>
            </div>

            {record.analysis.evidenceQuotes && record.analysis.evidenceQuotes.length > 0 && (
              <div className="bg-slate-950 border-l-2 border-emerald-500 rounded p-2 text-[11px] font-mono text-slate-300 truncate">
                {record.analysis.evidenceQuotes[0]}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                <strong>{record.person_role_type}:</strong> {record.person_label}
              </span>
              <span className="text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                Change Route / Review <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
