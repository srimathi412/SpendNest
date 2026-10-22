import {
  SourceRecordRaw,
  DeliveryEnvelope,
  ProcessedRecord,
  RouteCategory,
  ReviewStatus
} from '../types/data';

export interface IngestionResult {
  batchId: string;
  revision: number;
  totalInBatch: number;
  inserted: number;
  updated: number;
  ignored: number;
  duplicatesInBatch: number;
  totalRecordsAfter: number;
  usableTranscriptsAfter: number;
  timestamp: string;
  success: boolean;
  message: string;
}

export interface StoredRecordEntry {
  raw: SourceRecordRaw;
  revision: number;
}

/**
 * Validates envelope structure and handles malformed data gracefully.
 */
export function validateEnvelope(data: any): { isValid: boolean; error?: string; envelope?: DeliveryEnvelope } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Malformed payload: Not a valid JSON object.' };
  }
  if (typeof data.batch_id !== 'string' || !data.batch_id.trim()) {
    return { isValid: false, error: 'Malformed payload: Missing or invalid batch_id.' };
  }
  if (typeof data.revision !== 'number' || isNaN(data.revision) || data.revision < 1) {
    return { isValid: false, error: 'Malformed payload: Missing or invalid delivery revision number.' };
  }
  if (!Array.isArray(data.records)) {
    return { isValid: false, error: 'Malformed payload: records field must be an array.' };
  }
  return { isValid: true, envelope: data as DeliveryEnvelope };
}

/**
 * Executes idempotent ingestion according to DATA_CONTRACT.md rules.
 * Identity is composite key: (source_type, source_id).
 * Replaces entire payload if incoming.revision > stored.revision.
 * Ignores incoming record if incoming.revision <= stored.revision.
 */
export function ingestEnvelope(
  currentStore: Map<string, StoredRecordEntry>,
  envelope: DeliveryEnvelope
): { updatedStore: Map<string, StoredRecordEntry>; result: IngestionResult } {
  const updatedStore = new Map(currentStore);
  
  let inserted = 0;
  let updated = 0;
  let ignored = 0;
  let duplicatesInBatch = 0;

  const seenInThisBatch = new Set<string>();

  envelope.records.forEach((record) => {
    // Validate record identity
    if (!record || !record.source_type || !record.source_id) {
      ignored++;
      return;
    }

    const key = `${record.source_type}:${record.source_id}`;

    // Detect intra-batch duplicate
    if (seenInThisBatch.has(key)) {
      duplicatesInBatch++;
    } else {
      seenInThisBatch.add(key);
    }

    const existing = updatedStore.get(key);

    if (!existing) {
      // New record insertion
      updatedStore.set(key, { raw: record, revision: envelope.revision });
      inserted++;
    } else {
      // Existing record check
      if (envelope.revision > existing.revision) {
        // Higher revision supersedes and replaces entire payload
        updatedStore.set(key, { raw: record, revision: envelope.revision });
        updated++;
      } else {
        // Lower or equal revision is ignored (no duplicate counting, no reversion)
        ignored++;
      }
    }
  });

  // Calculate usable transcripts after import
  let usableTranscriptsAfter = 0;
  updatedStore.forEach(({ raw }) => {
    if (raw.source_type === 'call') {
      if (raw.payload?.transcript && raw.payload.transcript.trim().length > 0) {
        usableTranscriptsAfter++;
      }
    } else {
      if (raw.transcript_payload?.turns && Array.isArray(raw.transcript_payload.turns) && raw.transcript_payload.turns.length > 0) {
        usableTranscriptsAfter++;
      }
    }
  });

  const result: IngestionResult = {
    batchId: envelope.batch_id,
    revision: envelope.revision,
    totalInBatch: envelope.records.length,
    inserted,
    updated,
    ignored,
    duplicatesInBatch,
    totalRecordsAfter: updatedStore.size,
    usableTranscriptsAfter,
    timestamp: new Date().toISOString(),
    success: true,
    message: `Batch "${envelope.batch_id}" (Rev ${envelope.revision}) processed: ${inserted} inserted, ${updated} updated, ${ignored} ignored.`
  };

  return { updatedStore, result };
}
