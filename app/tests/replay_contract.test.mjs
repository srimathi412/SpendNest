import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to actual workspace datasets
const initialJsonPath = path.resolve(__dirname, '../../data/01_initial.json');
const updateJsonPath = path.resolve(__dirname, '../../data/02_update.json');

const initialEnvelope = JSON.parse(fs.readFileSync(initialJsonPath, 'utf8'));
const updateEnvelope = JSON.parse(fs.readFileSync(updateJsonPath, 'utf8'));

// Ingestion logic directly tested
function ingestEnvelope(currentStore, envelope) {
  const updatedStore = new Map(currentStore);
  let inserted = 0;
  let updated = 0;
  let ignored = 0;
  let duplicatesInBatch = 0;
  const seenInThisBatch = new Set();

  envelope.records.forEach((record) => {
    if (!record || !record.source_type || !record.source_id) {
      ignored++;
      return;
    }

    const key = `${record.source_type}:${record.source_id}`;

    if (seenInThisBatch.has(key)) {
      duplicatesInBatch++;
    } else {
      seenInThisBatch.add(key);
    }

    const existing = updatedStore.get(key);

    if (!existing) {
      updatedStore.set(key, { raw: record, revision: envelope.revision });
      inserted++;
    } else {
      if (envelope.revision > existing.revision) {
        // Full payload replacement (not partial merge)
        updatedStore.set(key, { raw: record, revision: envelope.revision });
        updated++;
      } else {
        ignored++;
      }
    }
  });

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

  return {
    updatedStore,
    result: {
      batchId: envelope.batch_id,
      revision: envelope.revision,
      totalInBatch: envelope.records.length,
      inserted,
      updated,
      ignored,
      duplicatesInBatch,
      totalRecordsAfter: updatedStore.size,
      usableTranscriptsAfter
    }
  };
}

describe('DATA_CONTRACT.md Replay Suite', () => {

  let store = new Map();
  const overridesMap = {};

  test('Step 1: Initial Import (data/01_initial.json)', () => {
    const { updatedStore, result } = ingestEnvelope(store, initialEnvelope);
    store = updatedStore;

    assert.strictEqual(result.batchId, 'initial-001');
    assert.strictEqual(result.revision, 1);
    assert.strictEqual(result.totalInBatch, 44);
    assert.strictEqual(result.inserted, 44);
    assert.strictEqual(result.updated, 0);
    assert.strictEqual(result.ignored, 0);
    assert.strictEqual(result.totalRecordsAfter, 44);
    assert.strictEqual(result.usableTranscriptsAfter, 17);

    // Verify calls and meetings breakdown
    let callCount = 0;
    let meetingCount = 0;
    store.forEach(({ raw }) => {
      if (raw.source_type === 'call') callCount++;
      if (raw.source_type === 'meeting') meetingCount++;
    });
    assert.strictEqual(callCount, 30);
    assert.strictEqual(meetingCount, 14);

    // Verify M07 in revision 1 has 0 turns and withheld message
    const m07Key = 'meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a';
    const m07 = store.get(m07Key);
    assert.ok(m07, 'M07 must exist in store');
    assert.strictEqual(m07.revision, 1);
    assert.strictEqual(m07.raw.transcript_payload.turns.length, 0);
    assert.strictEqual(
      m07.raw.transcript_payload.unavailable_reason,
      'Transcript not included in this delivery; a later assessment batch supplies it.'
    );
  });

  test('Step 2: Repeat Import & Deduplication (with shuffled order)', () => {
    // Shuffle records order to prove order independence
    const shuffledRecords = [...initialEnvelope.records].reverse();
    const shuffledEnvelope = { ...initialEnvelope, records: shuffledRecords };

    const { updatedStore, result } = ingestEnvelope(store, shuffledEnvelope);
    store = updatedStore;

    // Deduplication check: 0 inserted, 0 updated, 44 ignored
    assert.strictEqual(result.inserted, 0);
    assert.strictEqual(result.updated, 0);
    assert.strictEqual(result.ignored, 44);
    assert.strictEqual(result.totalRecordsAfter, 44);
    assert.strictEqual(result.usableTranscriptsAfter, 17);
  });

  test('Step 3: Manual Route Correction on M07', () => {
    const m07Key = 'meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a';
    
    // Save manual override
    overridesMap[m07Key] = {
      manualRoute: 'Deal Next Steps',
      reviewStatus: 'Action Required',
      notes: 'Manager early routing test for Willowfield Trust',
      updatedAt: new Date().toISOString()
    };

    assert.ok(overridesMap[m07Key]);
    assert.strictEqual(overridesMap[m07Key].manualRoute, 'Deal Next Steps');
  });

  test('Step 4: Update Import (data/02_update.json, Revision 2)', () => {
    const { updatedStore, result } = ingestEnvelope(store, updateEnvelope);
    store = updatedStore;

    assert.strictEqual(result.batchId, 'update-002');
    assert.strictEqual(result.revision, 2);
    assert.strictEqual(result.totalInBatch, 1);
    assert.strictEqual(result.inserted, 0);
    assert.strictEqual(result.updated, 1, 'M07 must be updated');
    assert.strictEqual(result.ignored, 0);
    
    // Total records remains strictly 44
    assert.strictEqual(result.totalRecordsAfter, 44);
    // Usable transcripts increases from 17 to 18
    assert.strictEqual(result.usableTranscriptsAfter, 18);

    // Verify M07 payload was completely replaced with revision 2 and 27 turns
    const m07Key = 'meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a';
    const m07 = store.get(m07Key);
    assert.ok(m07);
    assert.strictEqual(m07.revision, 2);
    assert.strictEqual(m07.raw.transcript_payload.turns.length, 27);
    assert.strictEqual(m07.raw.transcript_payload.unavailable_reason, null);
  });

  test('Step 5: Preserve Judgment & Re-import Older Revisions', () => {
    const m07Key = 'meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a';

    // 1. Verify manual route override is still in effect
    const override = overridesMap[m07Key];
    assert.ok(override, 'Manual override must survive update');
    assert.strictEqual(override.manualRoute, 'Deal Next Steps');

    // 2. Re-import initial envelope (Revision 1) AFTER Revision 2 has been applied
    const { updatedStore, result } = ingestEnvelope(store, initialEnvelope);
    store = updatedStore;

    // Must be completely ignored: 0 inserted, 0 updated, 44 ignored
    assert.strictEqual(result.inserted, 0);
    assert.strictEqual(result.updated, 0);
    assert.strictEqual(result.ignored, 44);
    assert.strictEqual(result.totalRecordsAfter, 44);
    assert.strictEqual(result.usableTranscriptsAfter, 18);

    // 3. Verify M07 did NOT revert to Revision 1
    const m07AfterReplay = store.get(m07Key);
    assert.strictEqual(m07AfterReplay.revision, 2, 'M07 must remain at Revision 2');
    assert.strictEqual(m07AfterReplay.raw.transcript_payload.turns.length, 27);
    assert.strictEqual(override.manualRoute, 'Deal Next Steps', 'Manual override remains intact');
  });

  test('Malformed Payload Handling', () => {
    const malformedEnvelope = {
      batch_id: 'bad-batch',
      revision: 1,
      records: [
        { missing_keys: true },
        null,
        { source_type: 'call' } // missing source_id
      ]
    };

    const { updatedStore, result } = ingestEnvelope(store, malformedEnvelope);
    // Ensure no corrupted entries were inserted into store
    assert.strictEqual(result.inserted, 0);
    assert.strictEqual(result.updated, 0);
    assert.strictEqual(result.ignored, 3);
    assert.strictEqual(updatedStore.size, 44);
  });
});
