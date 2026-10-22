import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import server app
process.env.NODE_ENV = 'test';
process.env.NO_LISTEN = 'true';
const { default: app } = await import('../index.js');
const { storageService } = await import('../services/storageService.js');

let server;
let baseUrl;

before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Running at ${baseUrl}`);
      resolve();
    });
  });
});

after(() => {
  if (server) server.close();
});

describe('SpendNest Backend API Test Suite', () => {

  test('1. GET /api/health returns 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.storage);
    assert.strictEqual(data.storage.totalRecords, 44);
    assert.strictEqual(data.storage.usableTranscripts, 17);
  });

  test('2. GET /api/records returns initial 44 records and correct breakdown', async () => {
    const res = await fetch(`${baseUrl}/api/records`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.records.length, 44);
    assert.strictEqual(data.summary.totalRecords, 44);
    assert.strictEqual(data.summary.usableTranscripts, 17);

    // Verify calls and meetings breakdown
    const calls = data.records.filter(r => r.raw.source_type === 'call');
    const meetings = data.records.filter(r => r.raw.source_type === 'meeting');
    assert.strictEqual(calls.length, 30);
    assert.strictEqual(meetings.length, 14);

    // Verify M07 in initial revision 1 has 0 turns
    const m07 = meetings.find(m => m.raw.source_id === '4f304fff-fd40-5cfc-a366-0a134c445c2a');
    assert.ok(m07);
    assert.strictEqual(m07.revision, 1);
    assert.strictEqual(m07.raw.transcript_payload.turns.length, 0);
  });

  test('3. POST /api/ingest duplicate replay (idempotence & deduplication)', async () => {
    // Replay initial batch with shuffled order
    const initialRaw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/01_initial.json'), 'utf8'));
    const shuffledRecords = [...initialRaw.records].reverse();
    const shuffledEnvelope = { ...initialRaw, records: shuffledRecords };

    const res = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shuffledEnvelope)
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    // Deduplication check: 0 inserted, 0 updated, 44 ignored
    assert.strictEqual(data.result.inserted, 0);
    assert.strictEqual(data.result.updated, 0);
    assert.strictEqual(data.result.ignored, 44);
    assert.strictEqual(data.result.totalRecordsAfter, 44);
    assert.strictEqual(data.result.usableTranscriptsAfter, 17);
  });

  test('4. POST /api/overrides saves manual route override for M07', async () => {
    const overridePayload = {
      sourceType: 'meeting',
      sourceId: '4f304fff-fd40-5cfc-a366-0a134c445c2a',
      manualRoute: 'Deal Next Steps',
      notes: 'Manager manual routing for Willowfield Trust',
      reviewStatus: 'Action Required'
    };

    const res = await fetch(`${baseUrl}/api/overrides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overridePayload)
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.entry.manualRoute, 'Deal Next Steps');

    // Verify GET /api/overrides returns the override
    const getRes = await fetch(`${baseUrl}/api/overrides`);
    const getData = await getRes.json();
    assert.strictEqual(getData.success, true);
    assert.ok(getData.overrides['meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a']);
    assert.strictEqual(getData.overrides['meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a'].manualRoute, 'Deal Next Steps');
  });

  test('5. POST /api/ingest applies 02_update.json (Revision 2 replacement)', async () => {
    const res = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: '02_update.json' })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.result.batchId, 'update-002');
    assert.strictEqual(data.result.revision, 2);
    assert.strictEqual(data.result.inserted, 0);
    assert.strictEqual(data.result.updated, 1);
    assert.strictEqual(data.result.totalRecordsAfter, 44);
    assert.strictEqual(data.result.usableTranscriptsAfter, 18);

    // Verify M07 record now has 27 turns
    const m07Res = await fetch(`${baseUrl}/api/records/meeting/4f304fff-fd40-5cfc-a366-0a134c445c2a`);
    const m07Data = await m07Res.json();
    assert.strictEqual(m07Data.success, true);
    assert.strictEqual(m07Data.record.revision, 2);
    assert.strictEqual(m07Data.record.raw.transcript_payload.turns.length, 27);
  });

  test('6. Manual override on M07 is preserved after update import', async () => {
    const getRes = await fetch(`${baseUrl}/api/overrides`);
    const getData = await getRes.json();
    const override = getData.overrides['meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a'];
    assert.ok(override, 'Manual override must be preserved');
    assert.strictEqual(override.manualRoute, 'Deal Next Steps');
  });

  test('7. Re-importing Revision 1 after Revision 2 is ignored and does not revert M07', async () => {
    const res = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: '01_initial.json' })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.result.inserted, 0);
    assert.strictEqual(data.result.updated, 0);
    assert.strictEqual(data.result.ignored, 44);

    // Verify M07 still has 27 turns and revision 2
    const m07Res = await fetch(`${baseUrl}/api/records/meeting/4f304fff-fd40-5cfc-a366-0a134c445c2a`);
    const m07Data = await m07Res.json();
    assert.strictEqual(m07Data.record.revision, 2);
    assert.strictEqual(m07Data.record.raw.transcript_payload.turns.length, 27);
  });

  test('8. Malformed payloads are rejected with 400 Bad Request', async () => {
    const badRes1 = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: 'bad', revision: 'not-a-number' })
    });
    assert.strictEqual(badRes1.status, 400);

    const badRes2 = await fetch(`${baseUrl}/api/overrides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceType: 'call' }) // missing sourceId and manualRoute
    });
    assert.strictEqual(badRes2.status, 400);
  });

  test('9. POST /api/reset resets state back to 01_initial.json and clears overrides', async () => {
    const res = await fetch(`${baseUrl}/api/reset`, { method: 'POST' });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.summary.totalRecords, 44);
    assert.strictEqual(data.summary.usableTranscripts, 17);
    assert.strictEqual(data.summary.totalOverrides, 0);

    // Confirm M07 is back to revision 1 with 0 turns
    const m07Res = await fetch(`${baseUrl}/api/records/meeting/4f304fff-fd40-5cfc-a366-0a134c445c2a`);
    const m07Data = await m07Res.json();
    assert.strictEqual(m07Data.record.revision, 1);
    assert.strictEqual(m07Data.record.raw.transcript_payload.turns.length, 0);
  });

  test('10. GET /api/exports/manifest.json and download return valid content', async () => {
    const manifestRes = await fetch(`${baseUrl}/api/exports/manifest.json`);
    assert.strictEqual(manifestRes.status, 200);
    const manifest = await manifestRes.json();
    assert.strictEqual(manifest.length, 44);
    assert.ok(manifest[0].source_id);
    assert.ok(manifest[0].routes);
    assert.ok(manifest[0].output_paths);

    const zipRes = await fetch(`${baseUrl}/api/exports/download`);
    assert.strictEqual(zipRes.status, 200);
    assert.strictEqual(zipRes.headers.get('content-type'), 'application/zip');
    const buffer = await zipRes.arrayBuffer();
    assert.ok(buffer.byteLength > 1000);
  });

});
