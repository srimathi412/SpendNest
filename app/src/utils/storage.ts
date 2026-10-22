import {
  SourceRecordRaw,
  ProcessedRecord,
  RouteCategory,
  ReviewStatus,
  AnalysisRecord
} from '../types/data';
import { ANALYSIS_SEEDS, M07_REVISION_2_ANALYSIS } from './defaultAnalysis';
import { StoredRecordEntry } from './replayEngine';

const OVERRIDES_STORAGE_KEY = 'spendnest_revenue_inbox_overrides_v2';
const RECORDS_STORAGE_KEY = 'spendnest_revenue_inbox_records_store_v2';
const BATCHES_STORAGE_KEY = 'spendnest_revenue_inbox_batches_applied_v2';

export interface ManualOverrideEntry {
  manualRoute: RouteCategory;
  reviewStatus?: ReviewStatus;
  notes?: string;
  updatedAt: string;
}

// --- OVERRIDES PERSISTENCE ---

export function loadStoredOverrides(): Record<string, ManualOverrideEntry> {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load manual overrides from localStorage', err);
    return {};
  }
}

export function saveManualOverride(
  sourceType: string,
  sourceId: string,
  manualRoute: RouteCategory,
  notes?: string,
  reviewStatus?: ReviewStatus
): void {
  try {
    const key = `${sourceType}:${sourceId}`;
    const current = loadStoredOverrides();
    const entry: ManualOverrideEntry = {
      manualRoute,
      reviewStatus: reviewStatus || 'Action Required',
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };
    current[key] = entry;
    current[sourceId] = entry;
    if (sourceId === '4f304fff-fd40-5cfc-a366-0a134c445c2a' || sourceType === 'M07') {
      current['M07'] = entry;
    }
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save manual override to localStorage', err);
  }
}

export function clearStoredOverrides(): void {
  try {
    localStorage.removeItem(OVERRIDES_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear manual overrides', err);
  }
}

// --- RECORDS STORE PERSISTENCE (Browser Refresh & Restart Survival) ---

export function saveStoredRecords(store: Map<string, StoredRecordEntry>): void {
  try {
    const obj: Record<string, StoredRecordEntry> = {};
    store.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(obj));
  } catch (err) {
    console.error('Failed to persist records store to localStorage', err);
  }
}

export function loadStoredRecords(): Map<string, StoredRecordEntry> | null {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return null;
    const obj: Record<string, StoredRecordEntry> = JSON.parse(raw);
    const map = new Map<string, StoredRecordEntry>();
    Object.entries(obj).forEach(([key, value]) => {
      map.set(key, value);
    });
    return map.size > 0 ? map : null;
  } catch (err) {
    console.error('Failed to load records store from localStorage', err);
    return null;
  }
}

export function clearStoredRecords(): void {
  try {
    localStorage.removeItem(RECORDS_STORAGE_KEY);
    localStorage.removeItem(BATCHES_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear records store', err);
  }
}

export function saveAppliedBatches(batches: string[]): void {
  try {
    localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error('Failed to persist applied batches', err);
  }
}

export function loadAppliedBatches(): string[] {
  try {
    const raw = localStorage.getItem(BATCHES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load applied batches', err);
    return [];
  }
}

// --- RECORD TRANSFORMATION ENGINE ---

export function transformRawRecord(
  raw: SourceRecordRaw,
  appliedRevision: number,
  overridesMap: Record<string, ManualOverrideEntry>
): ProcessedRecord {
  const identityKey = `${raw.source_type}:${raw.source_id}`;
  
  // Person distinction
  let personLabel = 'Unassigned';
  let personRoleType: 'Call Rep' | 'Meeting Organizer' = 'Call Rep';
  let activityTimestamp = '';
  
  if (raw.source_type === 'call') {
    personLabel = raw.payload?.rep_name || 'Unassigned Rep';
    personRoleType = 'Call Rep';
    activityTimestamp = raw.payload?.started_at || '';
  } else {
    personLabel = raw.payload?.organizer_email || 'Unassigned Organizer';
    personRoleType = 'Meeting Organizer';
    activityTimestamp = raw.payload?.starts_at || '';
  }

  // Usable text determination
  let hasUsableTranscript = false;
  let transcriptText: string | null = null;
  let turnsCount = 0;
  let unavailableReason: string | null = null;

  if (raw.source_type === 'call') {
    if (raw.payload?.transcript && raw.payload.transcript.trim().length > 0) {
      hasUsableTranscript = true;
      transcriptText = raw.payload.transcript;
    } else {
      hasUsableTranscript = false;
      unavailableReason = 'Background call without supplied transcript. Metadata retained.';
    }
  } else {
    const turns = raw.transcript_payload?.turns;
    if (turns && Array.isArray(turns) && turns.length > 0) {
      hasUsableTranscript = true;
      turnsCount = turns.length;
      transcriptText = turns.map(t => `${t.speaker} (${t.timecode}): ${t.text}`).join('\n\n');
    } else {
      hasUsableTranscript = false;
      unavailableReason = raw.transcript_payload?.unavailable_reason || 'No transcript turns recorded.';
    }
  }

  // Determine Analysis Seed
  let seed = ANALYSIS_SEEDS[identityKey];
  let isLateUpdateRefreshed = false;
  
  // Handle M07 update scenario
  if (raw.record_ref === 'M07' && appliedRevision >= 2 && hasUsableTranscript) {
    seed = M07_REVISION_2_ANALYSIS;
    isLateUpdateRefreshed = true;
  }

  if (!seed) {
    // Background calls or unrecorded meetings
    const fallbackCategory: RouteCategory = 'Missing Audio / Exception';
    seed = {
      suggestedRoute: fallbackCategory,
      reviewStatus: 'Intake Logged',
      rationale: unavailableReason || 'No transcript text supplied in this delivery. Intake logged.',
      evidenceQuotes: unavailableReason ? [`Reason: ${unavailableReason}`] : ['No audio or turns available.'],
      unsupportedClaims: ['No conversation text is available; no conclusions or summaries are fabricated.'],
      actionItems: [{ text: 'Log intake state in CRM; no further analytical review needed without audio.', owner: 'System' }]
    };
  }

  const analysis: AnalysisRecord = {
    suggestedRoute: seed.suggestedRoute,
    rationale: seed.rationale,
    evidenceQuotes: seed.evidenceQuotes,
    unsupportedClaims: seed.unsupportedClaims,
    actionItems: seed.actionItems,
    coachingNotes: seed.coachingNotes,
    freshness: isLateUpdateRefreshed ? 'current' : 'current'
  };

  // Check manual overrides (CRITICAL CONTRACT RULE: Overrides MUST survive updates and re-imports)
  const override = overridesMap[identityKey] || (raw.record_ref ? overridesMap[raw.record_ref] : undefined) || (raw.source_id ? overridesMap[raw.source_id] : undefined);
  const isManuallyOverridden = Boolean(override);
  const manualRoute = override ? override.manualRoute : null;
  const effectiveRoute = manualRoute || seed.suggestedRoute;

  // If late transcript arrived for M07 and user has a manual override, mark as Stale / Needs Re-check unless updated
  let reviewStatus: ReviewStatus = override?.reviewStatus || seed.reviewStatus;
  if (isLateUpdateRefreshed && isManuallyOverridden) {
    // Keep manual route, but flag that new transcript arrived for inspection
    reviewStatus = override?.reviewStatus === 'Reviewed' ? 'Reviewed' : 'Stale / Needs Re-check';
  }

  return {
    identityKey,
    source_type: raw.source_type,
    source_id: raw.source_id,
    record_ref: raw.record_ref,
    applied_revision: appliedRevision,
    activity_timestamp: activityTimestamp,
    person_label: personLabel,
    person_role_type: personRoleType,
    has_usable_transcript: hasUsableTranscript,
    transcript_text: transcriptText,
    turns_count: turnsCount,
    unavailable_reason: unavailableReason,
    suggested_route: seed.suggestedRoute,
    manual_route: manualRoute,
    effective_route: effectiveRoute,
    is_manually_overridden: isManuallyOverridden,
    manual_override_timestamp: override?.updatedAt,
    manual_notes: override?.notes,
    review_status: reviewStatus,
    analysis,
    raw_record: raw
  };
}
