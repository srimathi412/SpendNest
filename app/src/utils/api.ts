import {
  DeliveryEnvelope,
  RouteCategory,
  ReviewStatus,
  SourceRecordRaw
} from '../types/data';
import {
  StoredRecordEntry,
  IngestionResult,
  ingestEnvelope as localIngestEnvelope,
  validateEnvelope
} from './replayEngine';
import {
  ManualOverrideEntry,
  loadStoredOverrides,
  saveManualOverride as localSaveManualOverride,
  clearStoredOverrides as localClearStoredOverrides,
  loadStoredRecords,
  saveStoredRecords,
  clearStoredRecords as localClearStoredRecords,
  loadAppliedBatches,
  saveAppliedBatches
} from './storage';

export interface BackendStatus {
  isConfigured: boolean;
  connected: boolean;
  message?: string;
  url?: string;
}

export function getApiBaseUrl(): string {
  let url = '';
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      url = import.meta.env.VITE_API_URL;
    } else if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
      url = process.env.VITE_API_URL;
    }
  } catch {
    url = '';
  }
  if (!url || typeof url !== 'string' || !url.trim()) {
    return '';
  }
  return url.trim().replace(/\/+$/, '');
}

export function isBackendConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

/**
 * Checks connection to backend /api/health
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; message: string; data?: any }> {
  const base = getApiBaseUrl();
  if (!base) {
    return { ok: false, message: 'Backend URL not configured. Running in client-local mode.' };
  }

  try {
    const res = await fetch(`${base}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      return { ok: false, message: `Backend responded with HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return { ok: true, message: 'Backend connected', data };
  } catch (err: any) {
    return { ok: false, message: `Could not reach backend at ${base}: ${err.message || 'Network error'}` };
  }
}

/**
 * Loads records, applied batches, and overrides either from backend or local storage.
 */
export async function fetchAllRecords(fallbackFetchDataset: (file: string) => Promise<Response>): Promise<{
  recordsMap: Map<string, StoredRecordEntry>;
  appliedBatches: string[];
  overrides: Record<string, ManualOverrideEntry>;
  fromBackend: boolean;
}> {
  const base = getApiBaseUrl();

  if (base) {
    // Backend is configured: fetch from REST API
    const res = await fetch(`${base}/api/records`);
    if (!res.ok) {
      throw new Error(`Failed to fetch records from backend (${res.status} ${res.statusText})`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Backend failed to return records.');
    }

    const recordsMap = new Map<string, StoredRecordEntry>();
    (data.records || []).forEach((entry: { raw: SourceRecordRaw; revision: number }) => {
      const key = `${entry.raw.source_type}:${entry.raw.source_id}`;
      recordsMap.set(key, entry);
    });

    const overrides: Record<string, ManualOverrideEntry> = data.overrides || {};
    const appliedBatches: string[] = data.appliedBatches || ['initial-001'];

    return { recordsMap, appliedBatches, overrides, fromBackend: true };
  }

  // Local-only mode: check localStorage or fetch static 01_initial.json
  const storedRecords = loadStoredRecords();
  const storedBatches = loadAppliedBatches();
  const storedOverrides = loadStoredOverrides();

  if (storedRecords && storedRecords.size > 0) {
    return {
      recordsMap: storedRecords,
      appliedBatches: storedBatches.length > 0 ? storedBatches : ['initial-001'],
      overrides: storedOverrides,
      fromBackend: false
    };
  }

  // Seed from static json file
  const res = await fallbackFetchDataset('01_initial.json');
  if (!res.ok) throw new Error(`Failed to fetch 01_initial.json: ${res.statusText}`);
  const rawJson = await res.json();
  const validation = validateEnvelope(rawJson);
  if (!validation.isValid || !validation.envelope) {
    throw new Error(validation.error || 'Invalid envelope format in 01_initial.json');
  }

  const { updatedStore } = localIngestEnvelope(new Map(), validation.envelope);
  saveStoredRecords(updatedStore);
  const batches = [validation.envelope.batch_id];
  saveAppliedBatches(batches);

  return {
    recordsMap: updatedStore,
    appliedBatches: batches,
    overrides: storedOverrides,
    fromBackend: false
  };
}

/**
 * Ingests an envelope.
 * STRICT ERROR CONTRACT: When backend is configured and write fails, throws error.
 * Does NOT silently fall back to localStorage.
 */
export async function ingestEnvelopeApi(
  currentStore: Map<string, StoredRecordEntry>,
  envelope: DeliveryEnvelope
): Promise<{ updatedStore: Map<string, StoredRecordEntry>; result: IngestionResult; appliedBatches?: string[] }> {
  const base = getApiBaseUrl();

  if (base) {
    const res = await fetch(`${base}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Backend ingestion failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Backend ingestion failed.');
    }

    // Refresh store from backend to maintain absolute parity
    const recordsRes = await fetch(`${base}/api/records`);
    const recordsData = await recordsRes.json();
    const updatedStore = new Map<string, StoredRecordEntry>();
    (recordsData.records || []).forEach((entry: { raw: SourceRecordRaw; revision: number }) => {
      const key = `${entry.raw.source_type}:${entry.raw.source_id}`;
      updatedStore.set(key, entry);
    });

    return {
      updatedStore,
      result: data.result,
      appliedBatches: recordsData.appliedBatches
    };
  }

  // Local-only mode
  const { updatedStore, result } = localIngestEnvelope(currentStore, envelope);
  saveStoredRecords(updatedStore);
  return { updatedStore, result };
}

/**
 * Saves manual route override.
 * STRICT ERROR CONTRACT: When backend is configured and write fails, throws error.
 * Does NOT silently fall back to localStorage.
 */
export async function saveOverrideApi(
  sourceType: string,
  sourceId: string,
  manualRoute: RouteCategory,
  notes?: string,
  reviewStatus?: ReviewStatus
): Promise<void> {
  const base = getApiBaseUrl();

  if (base) {
    const res = await fetch(`${base}/api/overrides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceType,
        sourceId,
        manualRoute,
        notes: notes || '',
        reviewStatus: reviewStatus || 'Action Required'
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Backend failed to save override (${res.status} ${res.statusText})`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save override.');
    }
    return;
  }

  // Local-only mode
  localSaveManualOverride(sourceType, sourceId, manualRoute, notes, reviewStatus);
}

/**
 * Resets a single override back to automated.
 */
export async function resetOverrideApi(sourceType: string, sourceId: string): Promise<void> {
  const base = getApiBaseUrl();

  if (base) {
    const res = await fetch(`${base}/api/overrides/${sourceType}/${sourceId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Backend failed to reset override (${res.status})`);
    }
    return;
  }

  // Local-only mode
  const key = `${sourceType}:${sourceId}`;
  const overrides = loadStoredOverrides();
  delete overrides[key];
  delete overrides[sourceId];
  localStorage.setItem('spendnest_revenue_inbox_overrides_v2', JSON.stringify(overrides));
}

/**
 * Resets application state back to clean initial state.
 */
export async function resetAllStateApi(): Promise<void> {
  const base = getApiBaseUrl();

  if (base) {
    const res = await fetch(`${base}/api/reset`, { method: 'POST' });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Backend failed to reset state (${res.status})`);
    }
    return;
  }

  // Local-only mode
  localClearStoredOverrides();
  localClearStoredRecords();
}
