import React from 'react';
import { BookOpen, ShieldCheck, Database, FileText, Info } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Data Dictionary & System Rules</h1>
        <p className="text-xs text-slate-400 mt-1">
          Authoritative business definitions, metric denominator specifications, and identity rules derived from DATA_DICTIONARY.md and DATA_CONTRACT.md.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Business Terms */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sky-400">
            <BookOpen className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">Key Business Terminology</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-200">SpendNest:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                The platform name. Software for company spending, corporate cards, vendor payments, AP automation, and accounting reconciliation.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-200">Call Rep vs Meeting Organizer:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Call reps are identified by name/account (<code className="font-mono text-sky-400">rep_name</code>). Calendar organizers (<code className="font-mono text-indigo-400">organizer_email</code>) are NOT automatically sales reps, attendees, or participants.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-200">Routing:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Deciding which operational destination and analysis a conversation requires (e.g. Sales Coaching, Deal Next Steps, CS, Partnerships, Operations).
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-200">Review State:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                A visible indicator that human oversight is required to resolve conflicting evidence, missing transcripts, or new updates.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Safe Metric Calculations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="font-bold text-white text-sm">Metric Denominators & Formula Integrity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-200">Total Unique Records:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Count distinct <code className="font-mono text-slate-300">(source_type, source_id)</code> after applying revisions. Equals <strong>44</strong>. Re-imports never inflate this count.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-200">Transcript Coverage:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Usable texts divided by total selected records in filter. <strong className="text-emerald-400">17 / 44 (38.6%)</strong> initially; <strong className="text-emerald-400">18 / 44 (40.9%)</strong> after M07 update.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-200">Source-Reported Connection Rate:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Calls where <code className="font-mono text-slate-300">is_connected=true</code> (11) divided by calls with non-null <code className="font-mono text-slate-300">is_connected</code> (30) = <strong className="text-amber-400">36.7%</strong>. This is a stored machine label, not verified human dialogue.
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-200">Timezone Anchor:</span>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                All activity falls on <strong>21 August 2026</strong> in <code className="font-mono text-slate-300">Asia/Kolkata</code> (IST). Delivery files arrived on 22 August (delivery metadata, not conversation occurrence).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Replay Rules Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <span>DATA_CONTRACT.md Replay Specifications</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">1. Composite Identity</span>
            <p className="text-slate-400 leading-relaxed">
              Identity is strictly <code className="font-mono text-sky-400">(source_type, source_id)</code>. Titles, phone tokens, and array indexes are not identities.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">2. Revision Upsert</span>
            <p className="text-slate-400 leading-relaxed">
              Revision 2 supersedes revision 1 for matching ID via complete replacement of payload and transcript. Lower/equal revisions are ignored.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="font-bold text-slate-200 block">3. Preserved Judgment</span>
            <p className="text-slate-400 leading-relaxed">
              A newer source delivery must never erase or overwrite an explicit manual manager route. Human judgment survives updates and browser refreshes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
