import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ProcessedRecord,
  RouteCategory,
  ReviewStatus
} from './types/data';
import {
  loadStoredOverrides,
  transformRawRecord
} from './utils/storage';
import {
  validateEnvelope,
  IngestionResult,
  StoredRecordEntry
} from './utils/replayEngine';
import {
  isBackendConfigured,
  checkBackendHealth,
  fetchAllRecords,
  ingestEnvelopeApi,
  saveOverrideApi,
  resetOverrideApi,
  resetAllStateApi,
  BackendStatus
} from './utils/api';
import { calculateMetrics } from './utils/metrics';
import { Navbar, ActiveTab } from './components/Navbar';
import { ConversationDetailModal } from './components/ConversationDetailModal';
import { DashboardView } from './views/DashboardView';
import { InboxView } from './views/InboxView';
import { RoutingReviewView } from './views/RoutingReviewView';
import { ImportReplayView } from './views/ImportReplayView';
import { ExportsView } from './views/ExportsView';
import { SettingsView } from './views/SettingsView';
import { Loader2, AlertTriangle, RefreshCw, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    isConfigured: isBackendConfigured(),
    connected: false
  });

  // Store raw records by composite key: `${source_type}:${source_id}`
  const [recordsMap, setRecordsMap] = useState<Map<string, StoredRecordEntry>>(new Map());
  const [appliedBatches, setAppliedBatches] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ProcessedRecord | null>(null);

  // Replay results history
  const [lastIngestionResult, setLastIngestionResult] = useState<IngestionResult | null>(null);
  const [ingestionHistory, setIngestionHistory] = useState<IngestionResult[]>([]);

  // Pre-filter state for navigating from dashboard to inbox
  const [inboxFilterRoute, setInboxFilterRoute] = useState<RouteCategory | 'ALL'>('ALL');
  const [inboxFilterStatus, setInboxFilterStatus] = useState<ReviewStatus | 'ALL'>('ALL');

  // Trigger state to re-evaluate processed records when overrides change
  const [overrideVersion, setOverrideVersion] = useState<number>(0);

  // Safe Dataset Fetch Helper supporting root, relative base, and subfolder hosting
  const fetchDataset = useCallback(async (filename: string): Promise<Response> => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const primaryUrl = `${base}/data/${filename}`;
    let res = await fetch(primaryUrl).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`./data/${filename}`).catch(() => null);
    }
    if (!res || !res.ok) {
      res = await fetch(`/data/${filename}`);
    }
    return res;
  }, []);

  // Check backend health on mount if configured
  useEffect(() => {
    if (isBackendConfigured()) {
      checkBackendHealth().then(res => {
        setBackendStatus({
          isConfigured: true,
          connected: res.ok,
          message: res.message
        });
      });
    }
  }, []);

  // Load records on mount or reset
  const loadInitialBatch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { recordsMap: loadedRecords, appliedBatches: loadedBatches } = await fetchAllRecords(fetchDataset);
      setRecordsMap(loadedRecords);
      setAppliedBatches(loadedBatches);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error loading SpendNest records.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDataset]);

  // Initial mount trigger
  useEffect(() => {
    loadInitialBatch();
  }, [loadInitialBatch]);

  // Transform raw records into processed records applying stored overrides
  const processedRecords = useMemo(() => {
    const overrides = loadStoredOverrides();
    const list: ProcessedRecord[] = [];

    recordsMap.forEach(({ raw, revision }) => {
      const processed = transformRawRecord(raw, revision, overrides);
      list.push(processed);
    });

    // Stable sort: Meetings first, then calls, by record_ref
    return list.sort((a, b) => a.record_ref.localeCompare(b.record_ref));
  }, [recordsMap, overrideVersion]);

  // Sync selected record when records update
  useEffect(() => {
    if (selectedRecord) {
      const updated = processedRecords.find(r => r.identityKey === selectedRecord.identityKey);
      if (updated) setSelectedRecord(updated);
    }
  }, [processedRecords, selectedRecord?.identityKey]);

  // Compute live dashboard metrics
  const metrics = useMemo(() => {
    return calculateMetrics(processedRecords);
  }, [processedRecords]);

  // Step 2: Repeat Import (Deduplication Check)
  const handleRepeatImport = useCallback(async () => {
    setWriteError(null);
    try {
      const res = await fetchDataset('01_initial.json');
      if (!res.ok) throw new Error(`Failed to fetch 01_initial.json: ${res.statusText}`);
      const rawJson = await res.json();
      const validation = validateEnvelope(rawJson);
      if (!validation.isValid || !validation.envelope) {
        throw new Error(validation.error || 'Invalid envelope format in 01_initial.json');
      }

      // Shuffle array to explicitly prove order independence
      const shuffledRecords = [...validation.envelope.records].sort(() => Math.random() - 0.5);
      const shuffledEnvelope = { ...validation.envelope, records: shuffledRecords };

      const { updatedStore, result, appliedBatches: serverBatches } = await ingestEnvelopeApi(recordsMap, shuffledEnvelope);

      setRecordsMap(updatedStore);

      const repeatLabel = `${validation.envelope.batch_id}-replayed`;
      if (serverBatches) {
        setAppliedBatches(serverBatches);
      } else if (!appliedBatches.includes(repeatLabel)) {
        setAppliedBatches([...appliedBatches, repeatLabel]);
      }

      setLastIngestionResult(result);
      setIngestionHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error('Failed to run repeat import', err);
      setWriteError(err.message || 'Failed to complete repeat import.');
    }
  }, [recordsMap, appliedBatches, fetchDataset]);

  // Step 4: Apply Update Batch (02_update.json)
  const handleApplyUpdateBatch = useCallback(async () => {
    setWriteError(null);
    try {
      const res = await fetchDataset('02_update.json');
      if (!res.ok) throw new Error(`Failed to fetch 02_update.json: ${res.statusText}`);
      const rawJson = await res.json();
      const validation = validateEnvelope(rawJson);
      if (!validation.isValid || !validation.envelope) {
        throw new Error(validation.error || 'Invalid envelope format in 02_update.json');
      }

      const { updatedStore, result, appliedBatches: serverBatches } = await ingestEnvelopeApi(recordsMap, validation.envelope);

      setRecordsMap(updatedStore);

      if (serverBatches) {
        setAppliedBatches(serverBatches);
      } else if (!appliedBatches.includes(validation.envelope.batch_id)) {
        setAppliedBatches([...appliedBatches, validation.envelope.batch_id]);
      }

      setLastIngestionResult(result);
      setIngestionHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error('Failed to apply update batch', err);
      setWriteError(err.message || 'Failed to apply update batch.');
    }
  }, [recordsMap, appliedBatches, fetchDataset]);

  // Step 3: Update Route / Manual Override
  const handleUpdateRoute = useCallback(async (
    sourceType: string,
    sourceId: string,
    newRoute: RouteCategory,
    notes?: string,
    status?: ReviewStatus
  ) => {
    setWriteError(null);
    try {
      await saveOverrideApi(sourceType, sourceId, newRoute, notes, status);
      setOverrideVersion(v => v + 1);
    } catch (err: any) {
      console.error('Failed to save manual override', err);
      // Strictly do not silently fall back to localStorage if backend is configured
      setWriteError(err.message || 'Backend rejected manual override write.');
    }
  }, []);

  // Reset Route to Automated Suggestion
  const handleResetRoute = useCallback(async (sourceType: string, sourceId: string) => {
    setWriteError(null);
    try {
      await resetOverrideApi(sourceType, sourceId);
      setOverrideVersion(v => v + 1);
    } catch (err: any) {
      console.error('Failed to reset route', err);
      setWriteError(err.message || 'Backend rejected route reset.');
    }
  }, []);

  // Clean Reset to Initial State
  const handleResetToCleanState = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the application? This will clear all stored data, manual overrides, and re-import data/01_initial.json from scratch.'
    );
    if (!confirmed) return;

    setWriteError(null);
    try {
      await resetAllStateApi();
      setOverrideVersion(v => v + 1);
      loadInitialBatch();
    } catch (err: any) {
      console.error('Failed to reset state', err);
      setWriteError(err.message || 'Failed to reset application state.');
    }
  }, [loadInitialBatch]);

  // Navigate to inbox with specific filters pre-set
  const handleNavigateToInboxWithFilter = (route?: RouteCategory, status?: ReviewStatus) => {
    setInboxFilterRoute(route || 'ALL');
    setInboxFilterStatus(status || 'ALL');
    setActiveTab('inbox');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recordCount={metrics.totalUniqueRecords}
        usableCount={metrics.usableTranscriptCount}
        appliedBatch={appliedBatches[appliedBatches.length - 1] || 'None'}
        backendStatus={backendStatus}
      />

      {/* Backend Write Error Banner (if any write operation fails) */}
      {writeError && (
        <div className="bg-rose-950 border-b border-rose-800 text-rose-200 px-4 py-2.5 flex items-center justify-between text-xs sticky top-20 z-30 shadow-md">
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong className="text-rose-100 font-semibold">Write Error:</strong> {writeError}
            </span>
          </div>
          <button
            onClick={() => setWriteError(null)}
            className="p-1 rounded hover:bg-rose-900 text-rose-300 hover:text-white transition-colors ml-4 flex-shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-screen-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Loading SpendNest delivery datasets...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Dataset Load Error</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto">{errorMessage}</p>
            <button
              onClick={loadInitialBatch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Load</span>
            </button>
          </div>
        )}

        {/* Loaded Views */}
        {!isLoading && !errorMessage && (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                records={processedRecords}
                metrics={metrics}
                onSelectRecord={setSelectedRecord}
                onNavigateToInboxWithFilter={handleNavigateToInboxWithFilter}
              />
            )}

            {activeTab === 'inbox' && (
              <InboxView
                records={processedRecords}
                onSelectRecord={setSelectedRecord}
                selectedRecordId={selectedRecord?.identityKey}
                initialFilterRoute={inboxFilterRoute}
                initialFilterStatus={inboxFilterStatus}
              />
            )}

            {activeTab === 'routing' && (
              <RoutingReviewView
                records={processedRecords}
                onSelectRecord={setSelectedRecord}
                onUpdateRoute={handleUpdateRoute}
                onResetRoute={handleResetRoute}
              />
            )}

            {activeTab === 'replay' && (
              <ImportReplayView
                records={processedRecords}
                appliedBatches={appliedBatches}
                lastIngestionResult={lastIngestionResult}
                ingestionHistory={ingestionHistory}
                onRunInitialImport={loadInitialBatch}
                onRunRepeatImport={handleRepeatImport}
                onApplyUpdateBatch={handleApplyUpdateBatch}
                onResetToCleanState={handleResetToCleanState}
                onSelectRecord={setSelectedRecord}
                onUpdateRoute={handleUpdateRoute}
              />
            )}

            {activeTab === 'exports' && (
              <ExportsView records={processedRecords} />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </>
        )}
      </main>

      {/* Conversation Detail Drawer / Modal */}
      <ConversationDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onUpdateRoute={handleUpdateRoute}
        onResetRoute={handleResetRoute}
      />
    </div>
  );
};

export default App;
