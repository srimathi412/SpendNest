import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load real initial dataset
const initialJsonPath = path.resolve(__dirname, '../../data/01_initial.json');
const initialEnvelope = JSON.parse(fs.readFileSync(initialJsonPath, 'utf8'));

// Build ProcessedRecords identical to app/src/utils/storage.ts
function buildProcessedRecords(records) {
  return records.map((raw) => {
    const isCall = raw.source_type === 'call';
    const payload = raw.payload || {};

    let personLabel = 'Unknown';
    let personRoleType = 'Unknown';

    if (isCall) {
      personLabel = payload.rep_name || payload.rep_email || 'Unassigned Rep';
      personRoleType = 'Call Rep';
    } else {
      personLabel = payload.organizer_email || 'No Organizer';
      personRoleType = 'Calendar Organizer';
    }

    const hasUsableTranscript = isCall
      ? Boolean(payload.transcript && payload.transcript.trim().length > 0)
      : Boolean(
          raw.transcript_payload?.turns &&
          Array.isArray(raw.transcript_payload.turns) &&
          raw.transcript_payload.turns.length > 0
        );

    const transcriptText = isCall
      ? payload.transcript || ''
      : (raw.transcript_payload?.turns || [])
          .map((t) => `${t.speaker_label || 'Speaker'}: ${t.text}`)
          .join('\n');

    return {
      identityKey: `${raw.source_type}:${raw.source_id}`,
      source_type: raw.source_type,
      source_id: raw.source_id,
      record_ref: raw.record_ref,
      applied_revision: 1,
      activity_timestamp: payload.started_at || payload.starts_at || '2026-08-20T10:00:00Z',
      person_label: personLabel,
      person_role_type: personRoleType,
      has_usable_transcript: hasUsableTranscript,
      transcript_text: transcriptText,
      turns_count: isCall ? 0 : raw.transcript_payload?.turns?.length || 0,
      unavailable_reason: null,
      suggested_route: isCall ? 'Triage / Unqualified' : 'Internal / Operations',
      manual_route: null,
      effective_route: isCall ? 'Triage / Unqualified' : 'Internal / Operations',
      is_manually_overridden: false,
      manual_override_timestamp: null,
      manual_notes: null,
      review_status: 'Intake Logged',
      analysis: {
        suggestedRoute: isCall ? 'Triage / Unqualified' : 'Internal / Operations',
        rationale: 'Initial intake processing.',
        evidenceQuotes: [],
        unsupportedClaims: [],
        actionItems: [],
        freshness: 'current'
      },
      raw_record: raw
    };
  });
}

// Inline filter implementation mirroring app/src/utils/searchFilter.ts
function filterConversations(records, options = {}) {
  const {
    searchQuery = '',
    sourceType = 'ALL',
    route = 'ALL',
    reviewStatus = 'ALL',
    person = 'ALL',
    transcriptFilter = 'ALL'
  } = options;

  const rawQuery = searchQuery.trim();
  let exactMatchActive = false;
  let normalizedQuery = '';

  if (rawQuery) {
    normalizedQuery = rawQuery.toLowerCase().replace(/^#/, '').trim();

    const isRecordRefPattern = /^[cm]\d{2}$/i.test(normalizedQuery);
    const hasExactMatchInDataset = records.some(
      (r) =>
        r.record_ref.toLowerCase() === normalizedQuery ||
        r.source_id.toLowerCase() === normalizedQuery
    );

    if (isRecordRefPattern || hasExactMatchInDataset) {
      exactMatchActive = true;
    }
  }

  return records.filter((record) => {
    // 1. Search Query
    if (rawQuery) {
      if (exactMatchActive) {
        const matchesExactRef = record.record_ref.toLowerCase() === normalizedQuery;
        const matchesExactSourceId = record.source_id.toLowerCase() === normalizedQuery;

        if (!matchesExactRef && !matchesExactSourceId) {
          return false;
        }
      } else {
        const query = normalizedQuery;

        const matchesRef = record.record_ref.toLowerCase().includes(query);
        const matchesId = record.source_id.toLowerCase().includes(query);
        const matchesPerson = record.person_label.toLowerCase().includes(query);
        const matchesRole = record.person_role_type.toLowerCase().includes(query);
        const matchesRoute = record.effective_route.toLowerCase().includes(query);
        const matchesTitle = (record.raw_record.payload?.title || '').toLowerCase().includes(query);
        const matchesSummary = (record.raw_record.payload?.summary || '').toLowerCase().includes(query);
        const matchesTranscript = (record.transcript_text || '').toLowerCase().includes(query);

        const matchesToNumber = (record.raw_record.payload?.to_number || '').toLowerCase().includes(query);
        const matchesFromNumber = (record.raw_record.payload?.from_number || '').toLowerCase().includes(query);
        const matchesRepName = (record.raw_record.payload?.rep_name || '').toLowerCase().includes(query);
        const matchesRepEmail = (record.raw_record.payload?.rep_email || '').toLowerCase().includes(query);
        const matchesOrgEmail = (record.raw_record.payload?.organizer_email || '').toLowerCase().includes(query);

        const anyFieldMatched =
          matchesRef ||
          matchesId ||
          matchesPerson ||
          matchesRole ||
          matchesRoute ||
          matchesTitle ||
          matchesSummary ||
          matchesTranscript ||
          matchesToNumber ||
          matchesFromNumber ||
          matchesRepName ||
          matchesRepEmail ||
          matchesOrgEmail;

        if (!anyFieldMatched) {
          return false;
        }
      }
    }

    // 2. Source Type Filter
    if (sourceType !== 'ALL' && record.source_type !== sourceType) {
      return false;
    }

    // 3. Route Filter
    if (route !== 'ALL' && record.effective_route !== route) {
      return false;
    }

    // 4. Review Status Filter
    if (reviewStatus !== 'ALL' && record.review_status !== reviewStatus) {
      return false;
    }

    // 5. Person Filter
    if (person !== 'ALL' && record.person_label !== person) {
      return false;
    }

    // 6. Transcript Availability Filter
    if (transcriptFilter === 'USABLE' && !record.has_usable_transcript) return false;
    if (transcriptFilter === 'MISSING' && record.has_usable_transcript) return false;

    return true;
  });
}

describe('Conversation Inbox Search & Filtering Suite', () => {
  const allRecords = buildProcessedRecords(initialEnvelope.records);

  test('Dataset baseline verification: 44 records loaded', () => {
    assert.strictEqual(allRecords.length, 44);
  });

  test('Exact ID search: searching "M09" returns only the M09 record', () => {
    const results = filterConversations(allRecords, { searchQuery: 'M09' });
    assert.strictEqual(results.length, 1, `Expected exactly 1 record for "M09", but got ${results.length}`);
    assert.strictEqual(results[0].record_ref, 'M09');
    assert.strictEqual(results[0].source_id, '4b5b9192-f3fc-505a-8e77-4d2ffaa54594');
  });

  test('Case-insensitivity: searching "m09" returns only the M09 record', () => {
    const results = filterConversations(allRecords, { searchQuery: 'm09' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].record_ref, 'M09');
  });

  test('Trimming whitespace: searching "  M09  " returns only the M09 record', () => {
    const results = filterConversations(allRecords, { searchQuery: '  M09  ' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].record_ref, 'M09');
  });

  test('Call exact ID search: searching "C01" returns only the C01 record', () => {
    const results = filterConversations(allRecords, { searchQuery: 'C01' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].record_ref, 'C01');
    assert.strictEqual(results[0].source_type, 'call');
  });

  test('Exact source UUID search: searching M09 source_id returns only M09', () => {
    const results = filterConversations(allRecords, { searchQuery: '4b5b9192-f3fc-505a-8e77-4d2ffaa54594' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].record_ref, 'M09');
  });

  test('Non-existent ID search: searching "M99" returns 0 records', () => {
    const results = filterConversations(allRecords, { searchQuery: 'M99' });
    assert.strictEqual(results.length, 0);
  });

  test('Partial text search: searching "team09" correctly matches organizer email in M04, M07, and M13', () => {
    const results = filterConversations(allRecords, { searchQuery: 'team09' });
    assert.strictEqual(results.length, 3);
    const refs = results.map((r) => r.record_ref).sort();
    assert.deepStrictEqual(refs, ['M04', 'M07', 'M13']);
  });

  test('Account name search: searching "Cedarwave" matches Cedarwave meetings (M04, M13)', () => {
    const results = filterConversations(allRecords, { searchQuery: 'Cedarwave' });
    assert.strictEqual(results.length, 2);
    const refs = results.map((r) => r.record_ref).sort();
    assert.deepStrictEqual(refs, ['M04', 'M13']);
  });

  test('Combined filters: searching "M09" with Source Type filters', () => {
    // When matching source type
    const meetingResults = filterConversations(allRecords, { searchQuery: 'M09', sourceType: 'meeting' });
    assert.strictEqual(meetingResults.length, 1);
    assert.strictEqual(meetingResults[0].record_ref, 'M09');

    // When conflicting source type
    const callResults = filterConversations(allRecords, { searchQuery: 'M09', sourceType: 'call' });
    assert.strictEqual(callResults.length, 0);
  });

  test('Prefix search: searching "M0" matches multiple records (M01 to M09)', () => {
    const results = filterConversations(allRecords, { searchQuery: 'M0' });
    assert.ok(results.length >= 9, `Expected at least 9 records matching prefix M0, got ${results.length}`);
    const refs = results.map((r) => r.record_ref);
    assert.ok(refs.includes('M09'));
    assert.ok(refs.includes('M04'));
  });
});
