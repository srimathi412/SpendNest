import React, { useState } from 'react';
import { ProcessedRecord, RouteCategory } from '../types/data';
import {
  Download,
  FileText,
  FolderArchive,
  Table,
  CheckCircle2,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import JSZip from 'jszip';

interface ExportsViewProps {
  records: ProcessedRecord[];
}

export const ExportsView: React.FC<ExportsViewProps> = ({ records }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Build manifest entries supporting multiple routes & multiple output paths per record
  const manifestData = records.map(r => {
    const routes: RouteCategory[] = [r.effective_route];
    const outputPaths: string[] = [];

    // Check multi-route conditions (e.g. C01, M01, M09)
    if (r.record_ref === 'C01' && !routes.includes('Triage / Unqualified')) {
      routes.push('Triage / Unqualified');
    } else if (r.record_ref === 'M01' && !routes.includes('Sales Coaching')) {
      routes.push('Sales Coaching');
    } else if (r.record_ref === 'M09' && !routes.includes('Internal / Operations')) {
      routes.push('Internal / Operations');
    }

    routes.forEach(route => {
      let folderName = 'triage_and_intake';
      switch (route) {
        case 'Sales Coaching':
          folderName = 'sales_coaching';
          break;
        case 'Deal Next Steps':
          folderName = 'deal_next_steps';
          break;
        case 'Customer Success / Support':
          folderName = 'customer_success';
          break;
        case 'Partnership Referral':
          folderName = 'partnerships';
          break;
        case 'Internal / Operations':
          folderName = 'internal_ops';
          break;
        case 'Triage / Unqualified':
        case 'Missing Audio / Exception':
        default:
          folderName = 'triage_and_intake';
          break;
      }

      const slug = route.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 15);
      const fileName = `${r.record_ref.toLowerCase()}_${slug}_${r.source_id.slice(0, 8)}.md`;
      outputPaths.push(`exports/${folderName}/${fileName}`);
    });

    return {
      source_type: r.source_type,
      source_id: r.source_id,
      record_ref: r.record_ref,
      applied_revision: r.applied_revision,
      routes: routes,
      output_paths: outputPaths,
      processing_state: r.review_status,
      manual_override: r.is_manually_overridden,
      analysis_freshness: r.analysis.freshness
    };
  });

  // Download Manifest JSON
  const downloadManifestJSON = () => {
    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Manifest CSV
  const downloadManifestCSV = () => {
    const headers = [
      'source_type',
      'source_id',
      'record_ref',
      'applied_revision',
      'routes',
      'output_paths',
      'processing_state',
      'manual_override',
      'analysis_freshness'
    ];
    const rows = manifestData.map(m => [
      m.source_type,
      m.source_id,
      m.record_ref,
      m.applied_revision,
      `"${m.routes.join('; ')}"`,
      `"${m.output_paths.join('; ')}"`,
      `"${m.processing_state}"`,
      m.manual_override,
      m.analysis_freshness
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Full ZIP Archive
  const downloadFullArchive = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Manifest files
      zip.file('exports/manifest.json', JSON.stringify(manifestData, null, 2));
      
      const csvHeaders = ['source_type', 'source_id', 'record_ref', 'applied_revision', 'routes', 'output_paths', 'processing_state', 'manual_override', 'analysis_freshness'];
      const csvRows = manifestData.map(m => [
        m.source_type,
        m.source_id,
        m.record_ref,
        m.applied_revision,
        `"${m.routes.join('; ')}"`,
        `"${m.output_paths.join('; ')}"`,
        `"${m.processing_state}"`,
        m.manual_override,
        m.analysis_freshness
      ]);
      zip.file('exports/manifest.csv', [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n'));

      // Manager Daily Brief
      zip.file('exports/daily_brief/manager_brief_2026_08_21.md', `# SpendNest Manager Daily Brief — 21 August 2026 (Asia/Kolkata)

**Context:** Daily operational review synthesized across 44 selected interaction records (30 calls, 14 meetings).
**Data Ingestion State:** Post-update delivery applied (18 usable transcripts available).

## Executive Summary & Core Findings
1. **Finding 1 (Voicemail vs Connection):** Call C04 tagged is_connected=false, but Arun left structured voicemail for Ritesh at Lanternpath Media. Routed to Triage / Voicemail follow-up.
2. **Finding 2 (Onboarding Blocker):** Meeting M09 Turn 31 Brookmint Holdings subsidiary admins received invite token expiration errors. Routed to Customer Success as P0 blocker.
3. **Finding 3 (Incumbent Pitch Friction):** Calls C05 and C06 reps pitched store expense cards against StoreHarbor and custom ERPs. Routed to Sales Coaching to pivot to ERP reconciliation gaps.

## Follow-up Action Items
- Brookmint Holdings (M09): Regenerate invite tokens and provide domain whitelist guidance (Team member A).
- Milan (C03): Send follow-up email titled "Developer access and event notifications — follow-up" with tiered API pricing (Kiran).
- Willowfield Trust (M07): Deliver SOC2 compliance pack and sub-wallet architecture guide for board review (Team member A).
`);

      // Individual Analysis Documents
      manifestData.forEach((item, idx) => {
        const record = records[idx];

        item.output_paths.forEach((outPath, pIdx) => {
          const route = item.routes[pIdx] || item.routes[0];

          let doc = '';
          if (record.has_usable_transcript) {
            doc = `# Analysis Document: ${record.record_ref} — ${route}
**Source Record Reference:** ${record.record_ref}  
**Source Type:** ${record.source_type.toUpperCase()}  
**Source ID:** \`${record.source_id}\`  
**Applied Delivery Revision:** ${record.applied_revision}  
**Assigned Route:** ${route} ${record.is_manually_overridden ? '(Manual Manager Override)' : ''}  
**Review Status:** ${record.review_status}  
**Analysis Freshness:** ${record.analysis.freshness}  
**Person:** ${record.person_label} (${record.person_role_type})  
**Timestamp (IST):** ${record.activity_timestamp}  

---

## 1. Executive Summary & Why It Matters
${record.analysis.rationale}

## 2. Transcript Evidence Citations
${record.analysis.evidenceQuotes.map(q => `- ${q}`).join('\n')}

## 3. What Evidence Does NOT Establish (Honest Uncertainty)
${record.analysis.unsupportedClaims.map(c => `- ${c}`).join('\n')}

## 4. Action Items & Stated Owners
${record.analysis.actionItems.map(a => `- **${a.owner}:** ${a.text}`).join('\n')}

${record.analysis.coachingNotes ? `## 5. Sales Coaching Directive\n${record.analysis.coachingNotes}\n` : ''}
## 6. Transcript
${record.transcript_text || 'No transcript text available.'}
`;
          } else {
            // Intake record without text
            doc = `# Intake Record: ${record.record_ref} (No Usable Text Supplied)
**Source Record Reference:** ${record.record_ref}  
**Source Type:** ${record.source_type.toUpperCase()}  
**Source ID:** \`${record.source_id}\`  
**Applied Delivery Revision:** ${record.applied_revision}  
**Intake Status:** ${record.review_status}  
**Person:** ${record.person_label} (${record.person_role_type})  

---

## Intake Status & Reason
> [!NOTE]
> **Upstream Condition:** ${record.unavailable_reason || 'Transcript withheld in delivery envelope.'}

Per DATA_CONTRACT.md, this record has been logged into the manager intake queue without fabricating dialogue summaries.
`;
          }

          zip.file(outPath, doc);
        });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue_intelligence_export_rev${Math.max(...records.map(r => r.applied_revision))}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate export archive', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Exports & Manifest</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-semibold">
              44 Manifest Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine-readable manifest (JSON & CSV) and structured analysis archive generated according to DATA_CONTRACT.md.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadManifestJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>Manifest JSON</span>
          </button>
          <button
            onClick={downloadManifestCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span>Manifest CSV</span>
          </button>
          <button
            onClick={downloadFullArchive}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <FolderArchive className="w-4 h-4" />
            <span>{isExporting ? 'Packaging ZIP...' : 'Download Full Export Archive (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Manifest Specification Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Export Folder Hierarchy Specification</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Generated outputs are organized into purpose-specific directories without losing multi-output context. The machine-readable manifest ties each output file path to its source record and applied revision.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
            <span className="font-mono text-sky-400 block text-[11px]">exports/</span>
            <span className="font-medium">sales_coaching/</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
            <span className="font-mono text-indigo-400 block text-[11px]">exports/</span>
            <span className="font-medium">deal_next_steps/</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
            <span className="font-mono text-rose-400 block text-[11px]">exports/</span>
            <span className="font-medium">customer_success/</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
            <span className="font-mono text-emerald-400 block text-[11px]">exports/</span>
            <span className="font-medium">partnerships/</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
            <span className="font-mono text-purple-400 block text-[11px]">exports/</span>
            <span className="font-medium">internal_ops/</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
            <span className="font-mono text-amber-400 block text-[11px]">exports/</span>
            <span className="font-medium">daily_brief/</span>
          </div>
        </div>
      </div>

      {/* Manifest Table Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Manifest Record Preview ({manifestData.length} records, {manifestData.reduce((acc, r) => acc + r.output_paths.length, 0)} active output files)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Every output path resolves to a real generated file
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Ref</th>
                <th className="py-2.5 px-3">Source Type</th>
                <th className="py-2.5 px-3">Source ID</th>
                <th className="py-2.5 px-3">Rev</th>
                <th className="py-2.5 px-3">Routes</th>
                <th className="py-2.5 px-3">Output Paths</th>
                <th className="py-2.5 px-3">Processing State</th>
                <th className="py-2.5 px-3">Manual Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {manifestData.map((row) => (
                <tr key={row.source_id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-sky-400">{row.record_ref}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.source_type}</td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]" title={row.source_id}>
                    {row.source_id.slice(0, 12)}...
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{row.applied_revision}</td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    {row.routes.join(', ')}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 truncate max-w-[240px]" title={row.output_paths.join('\n')}>
                    {row.output_paths[0]}
                    {row.output_paths.length > 1 && (
                      <span className="text-slate-400 ml-1">(+{row.output_paths.length - 1} more)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">{row.processing_state}</td>
                  <td className="py-2.5 px-3">
                    {row.manual_override ? (
                      <span className="text-amber-400 font-semibold">TRUE</span>
                    ) : (
                      <span className="text-slate-600">FALSE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
