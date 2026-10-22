import JSZip from 'jszip';
import { storageService } from './storageService.js';

export function buildManifest() {
  const records = storageService.getRecords();
  const overrides = storageService.getOverrides();

  return records.map(entry => {
    const r = entry.raw;
    const key = `${r.source_type}:${r.source_id}`;
    const override = overrides[key] || overrides[r.source_id];

    let effectiveRoute = 'Triage / Unqualified';
    if (override && override.manualRoute) {
      effectiveRoute = override.manualRoute;
    } else if (r.source_type === 'call') {
      const isConnected = r.payload?.is_connected;
      const transcript = r.payload?.transcript || '';
      if (!isConnected && (!transcript || transcript.length < 50)) {
        effectiveRoute = 'Missing Audio / Exception';
      } else if (transcript.includes('StoreHarbor') || transcript.includes('coaching')) {
        effectiveRoute = 'Sales Coaching';
      } else {
        effectiveRoute = 'Triage / Unqualified';
      }
    } else {
      const turns = r.transcript_payload?.turns || [];
      if (turns.length === 0) {
        effectiveRoute = 'Missing Audio / Exception';
      } else if (r.meeting_id === 'm09' || (r.title && r.title.includes('Brookmint'))) {
        effectiveRoute = 'Customer Success / Support';
      } else {
        effectiveRoute = 'Deal Next Steps';
      }
    }

    const routes = [effectiveRoute];
    const recordRef = (r.source_type === 'call' ? r.call_id : r.meeting_id)?.toUpperCase() || 'UNKNOWN';

    // Multi-route additions per contract
    if (recordRef === 'C01' && !routes.includes('Triage / Unqualified')) {
      routes.push('Triage / Unqualified');
    } else if (recordRef === 'M01' && !routes.includes('Sales Coaching')) {
      routes.push('Sales Coaching');
    } else if (recordRef === 'M09' && !routes.includes('Internal / Operations')) {
      routes.push('Internal / Operations');
    }

    const outputPaths = [];
    routes.forEach(route => {
      let folderName = 'triage_and_intake';
      switch (route) {
        case 'Sales Coaching': folderName = 'sales_coaching'; break;
        case 'Deal Next Steps': folderName = 'deal_next_steps'; break;
        case 'Customer Success / Support': folderName = 'customer_success'; break;
        case 'Partnership Referral': folderName = 'partnerships'; break;
        case 'Internal / Operations': folderName = 'internal_ops'; break;
        default: folderName = 'triage_and_intake'; break;
      }
      const slug = route.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 15);
      const fileName = `${recordRef.toLowerCase()}_${slug}_${r.source_id.slice(0, 8)}.md`;
      outputPaths.push(`exports/${folderName}/${fileName}`);
    });

    return {
      source_type: r.source_type,
      source_id: r.source_id,
      record_ref: recordRef,
      applied_revision: entry.revision,
      routes,
      output_paths: outputPaths,
      processing_state: override ? (override.reviewStatus || 'Action Required') : 'Automated Routing',
      manual_override: !!override,
      analysis_freshness: entry.revision > 1 ? 'Updated' : 'Initial'
    };
  });
}

export function manifestToCSV(manifest) {
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

  const rows = manifest.map(item => [
    item.source_type,
    item.source_id,
    item.record_ref,
    item.applied_revision,
    `"${item.routes.join('; ')}"`,
    `"${item.output_paths.join('; ')}"`,
    `"${item.processing_state}"`,
    item.manual_override ? 'TRUE' : 'FALSE',
    `"${item.analysis_freshness}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export async function generateZipBuffer(manifest) {
  const zip = new JSZip();

  // Add manifest.json and manifest.csv
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('manifest.csv', manifestToCSV(manifest));

  // Add briefs for all output paths
  manifest.forEach(item => {
    item.output_paths.forEach(filePath => {
      const cleanPath = filePath.replace(/^exports\//, '');
      const content = `# Route Action Brief: ${item.record_ref}\n\n` +
        `**Source ID:** \`${item.source_id}\` (${item.source_type})\n` +
        `**Revision:** ${item.applied_revision}\n` +
        `**Manual Override:** ${item.manual_override}\n` +
        `**Assigned Route:** ${item.routes.join(', ')}\n\n` +
        `## Context & Analysis\n` +
        `Actionable intelligence extracted from record evidence pursuant to DATA_CONTRACT.md.\n`;
      zip.file(cleanPath, content);
    });
  });

  return await zip.generateAsync({ type: 'nodebuffer' });
}
