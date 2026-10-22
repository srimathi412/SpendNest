/**
 * replayEngine.js
 * Implements DATA_CONTRACT.md rules:
 * 1. Record identity is strictly composite key: (source_type, source_id).
 * 2. Idempotent ingestion: lower or equal revisions are ignored.
 * 3. Atomic replacement: higher revisions replace the entire payload (not merged).
 * 4. Deduplication: duplicate records in the same batch or across deliveries are handled safely.
 */

export function validateEnvelope(data) {
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
  return { isValid: true, envelope: data };
}

export function countUsableTranscripts(store) {
  let count = 0;
  for (const entry of store.values()) {
    const raw = entry.raw;
    if (!raw) continue;
    if (raw.source_type === 'call') {
      if (raw.payload?.transcript && raw.payload.transcript.trim().length > 0) {
        count++;
      }
    } else {
      if (raw.transcript_payload?.turns && Array.isArray(raw.transcript_payload.turns) && raw.transcript_payload.turns.length > 0) {
        count++;
      }
    }
  }
  return count;
}

export function ingestEnvelope(currentStore, envelope) {
  const updatedStore = new Map(currentStore);
  let inserted = 0;
  let updated = 0;
  let ignored = 0;
  let duplicatesInBatch = 0;

  const seenInThisBatch = new Set();

  envelope.records.forEach((record) => {
    // Validate record identity
    if (!record || !record.source_type || !record.source_id) {
      ignored++;
      return;
    }

    const key = `${record.source_type}:${record.source_id}`;

    // Intra-batch duplicate detection
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
        // Lower or equal revision is ignored (idempotent, no duplicate counting, no reversion)
        ignored++;
      }
    }
  });

  const usableTranscriptsAfter = countUsableTranscripts(updatedStore);

  const result = {
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
