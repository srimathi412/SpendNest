import React, { useState } from 'react';
import {
  ProcessedRecord,
  RouteCategory,
  ReviewStatus
} from '../types/data';
import {
  X,
  PhoneCall,
  Video,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Mail,
  Edit3,
  RotateCcw,
  ShieldAlert,
  Code,
  Sparkles,
  Quote
} from 'lucide-react';
import { formatKolkataDateTime, formatDuration } from '../utils/formatters';

interface ConversationDetailModalProps {
  record: ProcessedRecord | null;
  onClose: () => void;
  onUpdateRoute: (sourceType: string, sourceId: string, newRoute: RouteCategory, notes?: string, status?: ReviewStatus) => void;
  onResetRoute?: (sourceType: string, sourceId: string) => void;
}

export const ConversationDetailModal: React.FC<ConversationDetailModalProps> = ({
  record,
  onClose,
  onUpdateRoute,
  onResetRoute
}) => {
  if (!record) return null;

  const [activeTab, setActiveTab] = useState<'analysis' | 'transcript' | 'raw'>('analysis');
  const [selectedRoute, setSelectedRoute] = useState<RouteCategory>(record.effective_route);
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(record.review_status);
  const [manualNote, setManualNote] = useState<string>(record.manual_notes || '');

  const handleRouteSave = (newRoute: RouteCategory) => {
    setSelectedRoute(newRoute);
    onUpdateRoute(record.source_type, record.source_id, newRoute, manualNote, selectedStatus);
  };

  const handleStatusChange = (newStatus: ReviewStatus) => {
    setSelectedStatus(newStatus);
    onUpdateRoute(record.source_type, record.source_id, selectedRoute, manualNote, newStatus);
  };

  const title = record.source_type === 'meeting'
    ? (record.raw_record.payload?.title || `Meeting ${record.record_ref}`)
    : `Phone Call ${record.record_ref} - Rep: ${record.person_label}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-2.5 py-0.5 rounded text-sm">
                {record.record_ref}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                record.source_type === 'call' ? 'bg-sky-950 text-sky-400 border border-sky-800/50' : 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
              }`}>
                {record.source_type === 'call' ? <PhoneCall className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                {record.source_type.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Rev {record.applied_revision}
              </span>
              {record.is_manually_overridden && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded">
                  <Edit3 className="w-3 h-3" /> Manual Override
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
              <span className="flex items-center gap-1 text-slate-300">
                {record.person_role_type === 'Call Rep' ? <User className="w-3.5 h-3.5 text-sky-400" /> : <Mail className="w-3.5 h-3.5 text-indigo-400" />}
                <strong>{record.person_role_type}:</strong> {record.person_label}
              </span>
              <span>•</span>
              <span className="font-mono">{formatKolkataDateTime(record.activity_timestamp)}</span>
              <span>•</span>
              <span>Duration: {formatDuration(record.raw_record.payload?.duration_seconds)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manager Action & Route Override Bar */}
        <div className="px-6 py-3 bg-slate-850/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Assigned Route:
            </span>
            <select
              value={selectedRoute}
              onChange={(e) => handleRouteSave(e.target.value as RouteCategory)}
              className="bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="Sales Coaching">Sales Coaching</option>
              <option value="Deal Next Steps">Deal Next Steps</option>
              <option value="Customer Success / Support">Customer Success / Support</option>
              <option value="Partnership Referral">Partnership Referral</option>
              <option value="Internal / Operations">Internal / Operations</option>
              <option value="Triage / Unqualified">Triage / Unqualified</option>
              <option value="Missing Audio / Exception">Missing Audio / Exception</option>
            </select>

            {record.is_manually_overridden && onResetRoute && (
              <button
                onClick={() => {
                  onResetRoute(record.source_type, record.source_id);
                  setSelectedRoute(record.suggested_route);
                }}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-medium underline"
                title="Reset to automated suggestion"
              >
                <RotateCcw className="w-3 h-3" /> Reset to Suggestion ({record.suggested_route})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Review State:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as ReviewStatus)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="Action Required">Action Required</option>
              <option value="In Review">In Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Stale / Needs Re-check">Stale / Needs Re-check</option>
              <option value="Intake Logged">Intake Logged</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex gap-6 text-xs bg-slate-900">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'analysis' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Analysis & Grounded Evidence
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'transcript' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Quote className="w-4 h-4" />
            Transcript Dialogue ({record.has_usable_transcript ? (record.source_type === 'meeting' ? `${record.turns_count} turns` : 'Full Text') : 'None'})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Raw Source Envelope
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'analysis' && (
            <div className="space-y-5 text-xs">
              {/* Rationale */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  What Happened & Why It Matters
                </h4>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {record.analysis.rationale}
                </p>
              </div>

              {/* Citations & Evidence Quotes */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-emerald-400" />
                  Passage Citations & Evidence Statements
                </h4>
                <div className="space-y-2">
                  {record.analysis.evidenceQuotes.map((quote, idx) => (
                    <div key={idx} className="bg-slate-900 border-l-2 border-emerald-500 rounded p-2.5 text-slate-300 font-mono text-xs">
                      {quote}
                    </div>
                  ))}
                </div>
              </div>

              {/* Unsupported Claims & Honest Uncertainty */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  What Evidence Does NOT Establish (Honest Uncertainty)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {record.analysis.unsupportedClaims.map((claim, idx) => (
                    <li key={idx} className="leading-relaxed">{claim}</li>
                  ))}
                </ul>
              </div>

              {/* Action items */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  Follow-up Action Items & Stated Owners
                </h4>
                <div className="space-y-2">
                  {record.analysis.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-200">{item.text}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 text-[11px] font-semibold whitespace-nowrap ml-3">
                        Owner: {item.owner}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coaching notes */}
              {record.analysis.coachingNotes && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                    Manager Coaching Directive
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {record.analysis.coachingNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              {record.has_usable_transcript ? (
                record.source_type === 'meeting' && record.raw_record.transcript_payload?.turns ? (
                  <div className="space-y-3">
                    {record.raw_record.transcript_payload.turns.map((turn, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1 pb-1 border-b border-slate-850">
                          <span className="font-semibold text-sky-400">
                            Turn {idx + 1} • {turn.speaker}
                          </span>
                          <span className="font-mono text-slate-500">{turn.timecode}</span>
                        </div>
                        <p className="text-slate-200 text-xs leading-relaxed">{turn.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {record.transcript_text}
                  </div>
                )
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-200">No Usable Transcript Supplied</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {record.unavailable_reason || 'Audio or turns were withheld in this delivery per contract.'}
                  </p>
                  <p className="text-[11px] text-slate-500 pt-2">
                    Contract rule: All records receive an intake/review state without fabricating synthetic conversations.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
                {JSON.stringify(record.raw_record, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            Identity Key: <strong className="text-slate-200">{record.identityKey}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
          >
            Done Inspecting
          </button>
        </div>
      </div>
    </div>
  );
};
