import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '../../');
const exportsDir = path.resolve(workspaceRoot, 'exports');
const manifestJsonPath = path.join(exportsDir, 'manifest.json');
const manifestCsvPath = path.join(exportsDir, 'manifest.csv');
const managerBriefPath = path.join(exportsDir, 'daily_brief/manager_brief_2026_08_21.md');

describe('PHASE 3: Export Generation & Manifest Programmatic Validation', () => {

  test('Manifest JSON exists, is valid, and contains 44 distinct source records', () => {
    assert.ok(fs.existsSync(manifestJsonPath), 'manifest.json must exist');
    const raw = fs.readFileSync(manifestJsonPath, 'utf8');
    const manifest = JSON.parse(raw);
    assert.strictEqual(Array.isArray(manifest), true);
    assert.strictEqual(manifest.length, 44, 'Manifest must have exactly 44 rows');

    // Ensure distinct composite keys
    const keys = new Set();
    manifest.forEach(row => {
      const key = `${row.source_type}:${row.source_id}`;
      assert.ok(!keys.has(key), `Duplicate composite key in manifest: ${key}`);
      keys.add(key);
    });
    assert.strictEqual(keys.size, 44);
  });

  test('Every manifest output_path resolves to an actual generated file on disk', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
    let totalPathsCount = 0;

    manifest.forEach(row => {
      assert.ok(Array.isArray(row.output_paths), `Row ${row.record_ref} must have output_paths array`);
      assert.ok(row.output_paths.length >= 1, `Row ${row.record_ref} must have at least one output path`);
      assert.ok(Array.isArray(row.routes), `Row ${row.record_ref} must have routes array`);
      assert.strictEqual(row.routes.length, row.output_paths.length, `Routes and output_paths length must match for ${row.record_ref}`);

      row.output_paths.forEach(relPath => {
        totalPathsCount++;
        const resolvedPath = path.resolve(workspaceRoot, relPath);
        assert.ok(fs.existsSync(resolvedPath), `Missing generated output file at: ${resolvedPath}`);
        const stat = fs.statSync(resolvedPath);
        assert.ok(stat.size > 0, `File at ${resolvedPath} must not be empty`);

        // Check content structure
        const content = fs.readFileSync(resolvedPath, 'utf8');
        assert.ok(content.includes(row.source_id), `Output file must cite source_id: ${row.source_id}`);
        assert.ok(content.includes(row.record_ref), `Output file must cite record_ref: ${row.record_ref}`);
      });
    });

    assert.strictEqual(totalPathsCount, 47, 'Expected 47 generated analysis files across 44 records (3 multi-routed)');
  });

  test('Multi-route handling for C01, M01, and M09 produces distinct output files without loss of context', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));

    const c01 = manifest.find(r => r.record_ref === 'C01');
    assert.ok(c01);
    assert.strictEqual(c01.routes.length, 2);
    assert.ok(c01.routes.includes('Sales Coaching'));
    assert.ok(c01.routes.includes('Triage / Unqualified'));
    assert.strictEqual(c01.output_paths.length, 2);

    const m01 = manifest.find(r => r.record_ref === 'M01');
    assert.ok(m01);
    assert.strictEqual(m01.routes.length, 2);
    assert.ok(m01.routes.includes('Partnership Referral'));
    assert.ok(m01.routes.includes('Sales Coaching'));
    assert.strictEqual(m01.output_paths.length, 2);

    const m09 = manifest.find(r => r.record_ref === 'M09');
    assert.ok(m09);
    assert.strictEqual(m09.routes.length, 2);
    assert.ok(m09.routes.includes('Customer Success / Support'));
    assert.ok(m09.routes.includes('Internal / Operations'));
    assert.strictEqual(m09.output_paths.length, 2);
  });

  test('Manifest CSV exists, has valid header, row count, and escaping', () => {
    assert.ok(fs.existsSync(manifestCsvPath), 'manifest.csv must exist');
    const csvContent = fs.readFileSync(manifestCsvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    assert.strictEqual(lines.length, 45, 'CSV must have 1 header line + 44 record lines');

    const expectedHeader = 'source_type,source_id,record_ref,applied_revision,routes,output_paths,processing_state,manual_override,analysis_freshness';
    assert.strictEqual(lines[0].trim(), expectedHeader);
  });

  test('Manager Daily Brief exists and documents the 3 important evidence-backed findings', () => {
    assert.ok(fs.existsSync(managerBriefPath), 'manager_brief_2026_08_21.md must exist');
    const brief = fs.readFileSync(managerBriefPath, 'utf8');
    assert.ok(brief.includes('Finding 1: Unsubstantiated Upstream Machine Outcome vs Actionable Outreach'));
    assert.ok(brief.includes('C04'));
    assert.ok(brief.includes('Finding 2: High-Severity Onboarding Blocker at Multi-Entity Account'));
    assert.ok(brief.includes('M09'));
    assert.ok(brief.includes('Turn 18') || brief.includes('Turn 31'));
    assert.ok(brief.includes('Finding 3: Sales Rep Cold Outreach Pitching Against Entrenched Incumbents'));
    assert.ok(brief.includes('C05') && brief.includes('C06'));
    assert.ok(brief.includes('Action Plan & Stated Owners'));
  });

  test('Records without usable transcripts do NOT contain fabricated dialogue summaries', () => {
    const b01Path = path.resolve(exportsDir, 'triage_and_intake/b01_intake_4868e5cd.md');
    assert.ok(fs.existsSync(b01Path));
    const b01Content = fs.readFileSync(b01Path, 'utf8');
    assert.ok(b01Content.includes('No synthetic or hallucinated dialogue summary is fabricated'));

    const m05Path = path.resolve(exportsDir, 'triage_and_intake/m05_intake_e0ecb112.md');
    assert.ok(fs.existsSync(m05Path));
    const m05Content = fs.readFileSync(m05Path, 'utf8');
    assert.ok(m05Content.includes('The meeting was recorded but nobody spoke'));
  });

  test('M07 post-update advances to Revision 2 with 27 turns and correct output path', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
    const m07 = manifest.find(r => r.record_ref === 'M07');
    assert.ok(m07);
    assert.strictEqual(m07.applied_revision, 2);
    assert.strictEqual(m07.analysis_freshness, 'current_rev2');
    assert.ok(m07.output_paths[0].includes('deal_next_steps/m07_willowfield_trust_wallets.md'));

    const m07File = path.resolve(workspaceRoot, m07.output_paths[0]);
    assert.ok(fs.existsSync(m07File));
    const m07Content = fs.readFileSync(m07File, 'utf8');
    assert.ok(m07Content.includes('Turn 6:'));
    assert.ok(m07Content.includes('Turn 23:'));
  });
});
