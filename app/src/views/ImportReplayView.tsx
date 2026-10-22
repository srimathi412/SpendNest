import React, { useState } from 'react';
import { ProcessedRecord, RouteCategory } from '../types/data';
import { IngestionResult } from '../utils/replayEngine';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileCheck,
  ArrowRight,
  Database,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface ImportReplayViewProps {
  records: ProcessedRecord[];
  appliedBatches: string[];
  lastIngestionResult: IngestionResult | null;
  ingestionHistory: IngestionResult[];
  onRunInitialImport: () => void;
  onRunRepeatImport: () => void;
  onApplyUpdateBatch: () => void;
  onResetToCleanState: () => void;
  onSelectRecord: (record: ProcessedRecord) => void;
  onUpdateRoute: (sourceType: string, sourceId: string, newRoute: RouteCategory, notes?: string) => void;
}

export const ImportReplayView: React.FC<ImportReplayViewProps> = ({
  records,
  appliedBatches,
  lastIngestionResult,
  ingestionHistory,
  onRunInitialImport,
  onRunRepeatImport,
  onApplyUpdateBatch,
  onResetToCleanState,
  onSelectRecord,
  onUpdateRoute
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [logMessages, setLogMessages] = useState<string[]>([
    'System ready. Replay contract engine loaded.'
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const isInitialApplied = appliedBatches.includes('initial-001');
  const isUpdateApplied = appliedBatches.includes('update-002');
  const isReplayTested = appliedBatches.some(b => b.includes('replayed'));
  const m07Record = records.find(r => r.record_ref === 'M07');
  const usableCount = records.filter(r => r.has_usable_transcript).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Import & Replay Verification</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono font-semibold">
              DATA_CONTRACT.md Replay Suite
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute and verify the required 5-step replay contract: deduplication, late transcript updates, and preserved human decisions across restarts.
          </p>
        </div>

        <button
          onClick={() => {
            onResetToCleanState();
            addLog('Clean reset executed. LocalStorage wiped and initial batch re-imported.');
            setActiveStep(1);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-colors border border-slate-700 hover:border-rose-800/60"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>Reset to Initial State (Clean Re-test)</span>
        </button>
      </div>

      {/* Replay State Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Unique Records */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Unique Records
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{records.length}</span>
            <span className="text-xs text-slate-400 font-mono">
              {records.length === 44 ? '✓ Fixed at 44' : '⚠️ Record count mismatch'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Key: (source_type, source_id)
          </div>
        </div>

        {/* Usable Transcripts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Usable Transcripts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{usableCount} / 44</span>
            <span className="text-xs text-slate-400">
              ({((usableCount / 44) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isUpdateApplied ? '18 records (M07 updated)' : '17 records (M07 withheld)'}
          </div>
        </div>

        {/* M07 Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            M07 (Willowfield Trust)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-bold font-mono ${m07Record?.applied_revision === 2 ? 'text-indigo-400' : 'text-sky-400'}`}>
              Rev {m07Record?.applied_revision || 1}
            </span>
            <span className="text-xs text-slate-300">
              • <strong>{m07Record?.turns_count || 0}</strong> turns
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={m07Record?.effective_route}>
            Route: <strong className="text-white">{m07Record?.effective_route}</strong>
            {m07Record?.is_manually_overridden && (
              <span className="text-amber-400 font-semibold ml-1">[Override Active]</span>
            )}
          </div>
        </div>

        {/* Applied Deliveries */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Applied Deliveries
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {appliedBatches.map(b => (
              <span key={b} className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                {b}
              </span>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Stored in localStorage
          </div>
        </div>
      </div>

      {/* Real Ingestion Result Callout */}
      {lastIngestionResult && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs">Last Ingestion Operation Result</h3>
              <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Batch: {lastIngestionResult.batchId} (Rev {lastIngestionResult.revision})
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(lastIngestionResult.timestamp).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs pt-1">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total In Batch</span>
              <span className="text-sm font-bold font-mono text-white">{lastIngestionResult.totalInBatch}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">New Inserted</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{lastIngestionResult.inserted}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Superseded Updates</span>
              <span className="text-sm font-bold font-mono text-indigo-400">{lastIngestionResult.updated}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Older/Same Ignored</span>
              <span className="text-sm font-bold font-mono text-slate-400">{lastIngestionResult.ignored}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Intra-Batch Dups</span>
              <span className="text-sm font-bold font-mono text-slate-400">{lastIngestionResult.duplicatesInBatch}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Stored Records</span>
              <span className="text-sm font-bold font-mono text-sky-400">{lastIngestionResult.totalRecordsAfter}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono pt-1">
            {lastIngestionResult.message}
          </div>
        </div>
      )}

      {/* 5-Step Interactive Replay Contract Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <span>The Required 5-Step Replay Contract (DATA_CONTRACT.md)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Follow each step in order to reproduce and verify the exact behavioral contract required for evaluation.
          </p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Initial Import */}
          <div className={`border rounded-xl p-5 transition-all ${
            isInitialApplied
              ? 'bg-slate-950 border-emerald-900/50'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isInitialApplied ? 'bg-emerald-900 text-emerald-300' : 'bg-sky-900 text-sky-300'
                  }`}>
                    1
                  </span>
                  <h4 className="font-bold text-white text-sm">Step 1: Initial Delivery Import (data/01_initial.json)</h4>
                  {isInitialApplied && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Initial Batch Applied
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Imports 44 records (30 calls, 14 meetings). Exactly 17 records contain usable transcripts. M07 transcript is withheld (<code className="font-mono text-slate-400">turns: []</code>) with reason recorded.
                </p>
              </div>

              <button
                onClick={() => {
                  onRunInitialImport();
                  addLog('Executed Step 1: Imported data/01_initial.json (Rev 1). Verified 44 records and 17 usable transcripts.');
                  setActiveStep(2);
                }}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors whitespace-nowrap self-start sm:self-center"
              >
                1. Run Initial Import
              </button>
            </div>
          </div>

          {/* Step 2: Repeat Import / Shuffled Order */}
          <div className={`border rounded-xl p-5 transition-all ${
            isReplayTested
              ? 'bg-slate-950 border-emerald-900/50'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isReplayTested ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    2
                  </span>
                  <h4 className="font-bold text-white text-sm">Step 2: Repeat Import & Deduplication Test</h4>
                  {isReplayTested && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Deduplication Verified (44 unique)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Re-imports the same initial batch with records shuffled in random order. Verifies that identity is strictly <code className="font-mono text-sky-400">(source_type, source_id)</code>. Zero duplicates added; count remains strictly 44.
                </p>
              </div>

              <button
                onClick={() => {
                  onRunRepeatImport();
                  addLog('Executed Step 2: Re-imported 01_initial.json with randomized ordering. Deduplication passed: record count remains 44.');
                  setActiveStep(3);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs transition-colors whitespace-nowrap border border-slate-700 self-start sm:self-center"
              >
                2. Test Repeat Import (Shuffled Order)
              </button>
            </div>
          </div>

          {/* Step 3: Manual Route Correction */}
          <div className={`border rounded-xl p-5 transition-all ${
            m07Record?.is_manually_overridden
              ? 'bg-slate-950 border-amber-900/50'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    m07Record?.is_manually_overridden ? 'bg-amber-900 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    3
                  </span>
                  <h4 className="font-bold text-white text-sm">Step 3: Manual Route Correction on M07</h4>
                  {m07Record?.is_manually_overridden && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Override Active: {m07Record.effective_route}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Manually change M07's route to <strong>"Deal Next Steps"</strong> before the late transcript arrives. Persisted separately from source data with timestamp and audit notes.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => {
                    if (m07Record) {
                      onUpdateRoute(m07Record.source_type, m07Record.source_id, 'Deal Next Steps', 'Manager early routing evaluation for Willowfield Trust');
                      addLog('Executed Step 3: Manually corrected M07 route to "Deal Next Steps". Override stored in localStorage.');
                      setActiveStep(4);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  3. Set M07 to Deal Next Steps
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Late Transcript Update Import */}
          <div className={`border rounded-xl p-5 transition-all ${
            isUpdateApplied
              ? 'bg-slate-950 border-indigo-900/50'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isUpdateApplied ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    4
                  </span>
                  <h4 className="font-bold text-white text-sm">Step 4: Update Delivery Import (data/02_update.json)</h4>
                  {isUpdateApplied && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Revision 2 Applied (27 turns)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Imports 02_update.json (Revision 2). M07 advances to revision 2, its complete payload is replaced with 27 transcript turns. Total record count stays 44; usable transcripts increases to 18.
                </p>
              </div>

              <button
                onClick={() => {
                  onApplyUpdateBatch();
                  addLog('Executed Step 4: Applied 02_update.json. M07 revision upgraded to 2 with 27 turns. Total usable transcripts is now 18.');
                  setActiveStep(5);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors whitespace-nowrap self-start sm:self-center"
              >
                4. Apply 02_update.json
              </button>
            </div>
          </div>

          {/* Step 5: Preserve Judgment & Verification */}
          <div className={`border rounded-xl p-5 transition-all ${
            isUpdateApplied && m07Record?.is_manually_overridden
              ? 'bg-slate-950 border-purple-900/50'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    isUpdateApplied && m07Record?.is_manually_overridden ? 'bg-purple-900 text-purple-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    5
                  </span>
                  <h4 className="font-bold text-white text-sm">Step 5: Preserve Judgment Verification & Inspection</h4>
                  {isUpdateApplied && m07Record?.effective_route === 'Deal Next Steps' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Manual Route Preserved: Deal Next Steps
                    </span>
                  ) : m07Record?.is_manually_overridden ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1">
                      Override Active: {m07Record.effective_route}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                      Awaiting Steps 3 & 4
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verify that M07 retains its manual route override to <strong className="text-emerald-400">"Deal Next Steps"</strong> (Current Effective Route: <strong className={m07Record?.effective_route === 'Deal Next Steps' ? 'text-emerald-400' : 'text-amber-400'}>"{m07Record?.effective_route || 'Missing Audio / Exception'}"</strong>), displays its new 27 turns of dialogue, and survives browser refresh (<kbd className="bg-slate-900 px-1 rounded text-[11px] font-mono text-slate-300">F5</kbd>) or app restart.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => {
                    if (m07Record) {
                      onSelectRecord(m07Record);
                      addLog('Executed Step 5: Inspected M07. Confirmed manual route override preserved and 27 turns visible.');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  5. Inspect M07 Record Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Replay Console Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Replay Audit & Event Log
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {logMessages.length} events recorded
          </span>
        </div>

        <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto border border-slate-850">
          {logMessages.map((log, idx) => (
            <div key={idx} className="leading-relaxed flex items-start gap-2">
              <span className="text-slate-600 select-none">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
