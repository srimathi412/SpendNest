import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, '../../');
const exportsDir = path.resolve(workspaceRoot, 'exports');

const initialJsonPath = path.resolve(workspaceRoot, 'data/01_initial.json');
const updateJsonPath = path.resolve(workspaceRoot, 'data/02_update.json');

const initialEnvelope = JSON.parse(fs.readFileSync(initialJsonPath, 'utf8'));
const updateEnvelope = JSON.parse(fs.readFileSync(updateJsonPath, 'utf8'));

// Build store combining initial + update (post-update final state)
const store = new Map();

// Ingest initial
initialEnvelope.records.forEach(r => {
  const key = `${r.source_type}:${r.source_id}`;
  store.set(key, { raw: r, revision: initialEnvelope.revision });
});

// Ingest update (M07 updated to revision 2)
updateEnvelope.records.forEach(r => {
  const key = `${r.source_type}:${r.source_id}`;
  const existing = store.get(key);
  if (!existing || updateEnvelope.revision > existing.revision) {
    store.set(key, { raw: r, revision: updateEnvelope.revision });
  }
});

// Subdirectories to create
const subdirs = [
  'sales_coaching',
  'deal_next_steps',
  'customer_success',
  'partnerships',
  'internal_ops',
  'triage_and_intake',
  'daily_brief'
];

// Clean and ensure exports folders exist
if (fs.existsSync(exportsDir)) {
  fs.rmSync(exportsDir, { recursive: true, force: true });
}
fs.mkdirSync(exportsDir, { recursive: true });
subdirs.forEach(sd => {
  fs.mkdirSync(path.join(exportsDir, sd), { recursive: true });
});

// Generate Manager Daily Brief
const managerBriefContent = `# SpendNest Manager Daily Brief — 21 August 2026 (Asia/Kolkata)

**Context:** Daily operational review synthesized across 44 selected interaction records (30 calls, 14 meetings).
**Data Ingestion State:** Post-update delivery applied (18 usable transcripts available).
**Timezone Anchor:** Friday, 21 August 2026 (Asia/Kolkata).

---

## Executive Summary & Core Findings

### 1. Finding 1: Unsubstantiated Upstream Machine Outcome vs Actionable Outreach
- **Evidence:** Call **C04** (Source ID: \`bcdcbf56-d338-5c78-9a97-42c2fc1c9931\`, Rep: Arun).
- **Observed Evidence:** Upstream telecom classification tagged \`is_connected=false\` and \`is_conversation=false\`. However, Arun delivered a structured, professional voicemail for Ritesh at Lanternpath Media referencing a re-sent proposal following an email address correction:
  > *"My understanding is that our information first went to the wrong email address. We subsequently used the corrected address... Please call me back to let me know where things stand."*
- **Action & Product Impact:** Automated filtering that discards calls with \`is_connected=false\` drops genuine sales follow-up. The workspace routes C04 to **Triage / Voicemail Follow-up** with a 48-hour CRM reminder.

### 2. Finding 2: High-Severity Onboarding Blocker at Multi-Entity Account
- **Evidence:** Meeting **M09** (Source ID: \`93d6b048-b4b0-51a7-bf98-e71e7d4414e2\`, Brookmint Holdings).
- **Observed Evidence:** Turn 18 & Turn 31:
  > *Turn 18 (Customer A): "Three of our subsidiary admins tried to activate accounts today and received token expiration errors."*  
  > *Turn 31 (Team member A): "I will check the expired-token problem for Brookmint Holdings with the team and aim to return with an update today, otherwise Monday."*
- **Action & Product Impact:** Account is at critical onboarding churn risk. Routed immediately to **Customer Success / Support** with an engineering ticket to extend invite token lifespans and provide domain whitelist guidance to Brookmint IT.

### 3. Finding 3: Sales Rep Cold Outreach Pitching Against Entrenched Incumbents
- **Evidence:** Calls **C05** (Meera) and **C06** (Meera / Ravi).
- **Observed Evidence:**
  > *C05: "Does your current system also execute the vendor payments? Yes, it does... One is StoreHarbor, and we use others too."*  
  > *C06: "We have quite a lot of automation... Head office manages it, and we have full visibility."*
- **Action & Product Impact:** Reps pitched basic card issuance and store dashboards to prospects who already run StoreHarbor and custom ERPs. Routed to **Sales Coaching**: reps must pivot cold pitches from basic expense cards to multi-store ledger reconciliation friction.

---

## Action Plan & Stated Owners

| Priority | Account / Contact | Action Item | Stated Owner | Target Date |
| :--- | :--- | :--- | :--- | :--- |
| **P0 - Urgent** | Brookmint Holdings (M09) | Regenerate admin invite tokens and configure enterprise domain whitelist | Team member A | 21 Aug 2026 (Today) |
| **P1 - High** | Milan (C03) | Send follow-up email titled *"Developer access and event notifications — follow-up"* with tiered pricing | Kiran | 24 Aug 2026 (Monday morning) |
| **P1 - High** | Willowfield Trust (M07) | Deliver SOC2 compliance pack and sub-wallet architecture guide for board review | Team member A | 24 Aug 2026 |
| **P2 - Medium** | Harborpath Advisory (M01) | Email partner revenue-share schedule and US entity onboarding requirements | Team member A | 25 Aug 2026 |
| **P2 - Medium** | Willowbank Advisory (C07) | Send digital account partnership deck via chat to Aditya | Dev | 25 Aug 2026 |
| **P3 - Coaching** | Arun & Meera (C01, C05, C06) | Conduct 30-min coaching workshop on ERP-displacement value propositions | Sales Manager | 26 Aug 2026 |
`;

fs.writeFileSync(path.join(exportsDir, 'daily_brief/manager_brief_2026_08_21.md'), managerBriefContent, 'utf8');

// Multi-route definitions & grounded analysis seeds
const recordMetadata = {
  // C01 (Multi-route: Sales Coaching & Triage)
  'call:2ec4404c-beee-5377-a63c-aab701da08ed': {
    routes: ['Sales Coaching', 'Triage / Unqualified'],
    filePrefixes: [
      { folder: 'sales_coaching', name: 'c01_cold_call_objections.md' },
      { folder: 'triage_and_intake', name: 'c01_contact_compliance_triage.md' }
    ],
    rationale: 'Cold outreach met with defensive friction from Pranav at Harborlight Advisory regarding unsolicited contact and existing automation.',
    quotes: [
      '"I don\'t know how I ended up on your list. I didn\'t ask for this call, and I\'m not interested."',
      '"Our processes are already very automated. We have a fairly advanced setup, so I don\'t think this is something we need."'
    ],
    uncertainty: ['Does NOT establish permanent company disqualification; partner conversation M01 was held separately.', 'Contact source list compliance unverified.'],
    actions: [
      { owner: 'Sales Manager', text: 'Review cold call opening statement with Arun to reduce defensive prospect reactions.' },
      { owner: 'RevOps', text: 'Audit outreach list source for Harborlight Advisory.' }
    ]
  },

  // C02
  'call:4b870624-8aad-5315-a60e-0db95981cf99': {
    routes: ['Triage / Unqualified'],
    filePrefixes: [{ folder: 'triage_and_intake', name: 'c02_receptionist_gatekeeper.md' }],
    rationale: 'Kavya at Fernhaven Group confirmed Leela was out of the office and transferred call to voicemail.',
    quotes: ['"It looks as though she isn\'t in the office today. Would you like to leave a message with me, or would you prefer her voicemail?"'],
    uncertainty: ['Upstream machine tagged is_conversation=true, but dialogue was strictly administrative reception.'],
    actions: [{ owner: 'Arun', text: 'Follow up with Leela next week.' }]
  },

  // C03
  'call:20d509ba-d589-5334-9aef-ea4ce6105b1a': {
    routes: ['Deal Next Steps'],
    filePrefixes: [{ folder: 'deal_next_steps', name: 'c03_developer_api_pricing.md' }],
    rationale: 'Milan traveling with poor audio agreed to review email follow-up regarding developer API access and discuss Monday/Tuesday.',
    quotes: [
      '"When we last spoke, price was a concern... What subject should I look for? Something like \'Developer access and event notifications — follow-up\'."',
      '"Send the email and we can speak Monday or Tuesday."'
    ],
    uncertainty: ['Budget is unconfirmed; Milan noted "it isn\'t essential enough for us to spend much on it".'],
    actions: [
      { owner: 'Kiran', text: 'Email tiered API pricing under subject "Developer access and event notifications — follow-up".' },
      { owner: 'Kiran', text: 'Call Milan Monday morning.' }
    ]
  },

  // C04
  'call:bcdcbf56-d338-5c78-9a97-42c2fc1c9931': {
    routes: ['Triage / Unqualified'],
    filePrefixes: [{ folder: 'triage_and_intake', name: 'c04_lanternpath_voicemail.md' }],
    rationale: 'Detailed voicemail message left for Ritesh at Lanternpath Media regarding expense platform proposal re-sent to corrected email address.',
    quotes: [
      '"The person you called is unavailable. You may leave a further message after the signal."',
      '"My understanding is that our information first went to the wrong email address. We subsequently used the corrected address... Please call me back."'
    ],
    uncertainty: ['Upstream marked is_connected=false; however, structured outbound message was recorded.'],
    actions: [{ owner: 'Arun', text: 'Follow up via CRM task in 48 hours if no response.' }]
  },

  // C05
  'call:75a6b94f-7717-5cfb-9e41-0acc94415e17': {
    routes: ['Sales Coaching'],
    filePrefixes: [{ folder: 'sales_coaching', name: 'c05_storeharbor_incumbent_pitch.md' }],
    rationale: 'Meera pitched store cards to a prospect operating multiple stores who already uses StoreHarbor and other tools for vendor payments.',
    quotes: [
      '"We offer expense software to bring purchasing and vendor processes together..."',
      '"We already have that... One is StoreHarbor, and we use others too. What I suggest is that you send me your presentation."'
    ],
    uncertainty: ['Prospect requesting presentation is polite deferral, not buying intent.'],
    actions: [{ owner: 'Meera', text: 'Send product presentation to contact05@example.com highlighting StoreHarbor gaps.' }]
  },

  // C06
  'call:12216d5c-e254-52c6-b344-47de4c6e1ae5': {
    routes: ['Sales Coaching'],
    filePrefixes: [{ folder: 'sales_coaching', name: 'c06_retail_cash_advance_pitch.md' }],
    rationale: 'Cold call to Nikhil with 120+ retail stores. Head office management system and central monitoring department already handle all payments.',
    quotes: [
      '"We have quite a lot of automation... Head office manages it, and we have full visibility."',
      '"If a particular need comes up later, we will reach out."'
    ],
    uncertainty: ['No active interest or opportunity; prospect declined further calls.'],
    actions: [{ owner: 'Meera', text: 'Log Store Management competitor intelligence in CRM.' }]
  },

  // C07
  'call:428817fa-7e9e-5418-a7d4-bb396d28dfbf': {
    routes: ['Partnership Referral'],
    filePrefixes: [{ folder: 'partnerships', name: 'c07_willowbank_advisory_referral.md' }],
    rationale: 'Discovery with Aditya at Willowbank Advisory. Aditya confirmed they refer incorporation clients to digital account providers.',
    quotes: [
      '"Do you currently refer clients to providers for that part of the process? Yes, that is something we normally do."',
      '"Sorry, could you message me on our chat app and send whatever proposal you have?... I can call on Monday."'
    ],
    uncertainty: ['Commercial terms and referral commission rates are not yet agreed.'],
    actions: [
      { owner: 'Dev', text: 'Send proposal summary on messaging app.' },
      { owner: 'Dev', text: 'Call Aditya on Monday to discuss partnership structure.' }
    ]
  },

  // C08
  'call:129497b2-8e1d-5e01-919c-e8a852b5ff68': {
    routes: ['Deal Next Steps'],
    filePrefixes: [{ folder: 'deal_next_steps', name: 'c08_frontline_people_ops_proposal.md' }],
    rationale: 'Raghav noted People Operations colleague deals with frontline location processes and requested a proposal be sent to contact08@example.com.',
    quotes: [
      '"The colleague handling our people operations also deals with frontline processes and the locations... If you send him a proposal and say you spoke with me, he can take a look."',
      '"It\'s contact08@example.com."'
    ],
    uncertainty: ['Raghav is not the buyer or decision maker.'],
    actions: [{ owner: 'Meera', text: 'Send frontline location expense proposal to contact08@example.com.' }]
  },

  // C09
  'call:4a1de681-f884-55e8-b1ad-de22d17cd959': {
    routes: ['Sales Coaching'],
    filePrefixes: [{ folder: 'sales_coaching', name: 'c09_internal_software_referral.md' }],
    rationale: 'Vedant confirmed internal software covers their 130 stores, directing Meera to Business Head Rishabh on LinkedIn while requesting not to use Vedant\'s name.',
    quotes: [
      '"We have developed our own software internally, so at present we aren\'t looking for anything outside..."',
      '"You can find our business head, Mr Rishabh, on a professional networking site... No, please don\'t use my name."'
    ],
    uncertainty: ['Rishabh has not been qualified; internal software capabilities unverified.'],
    actions: [{ owner: 'Meera', text: 'Conduct discreet LinkedIn outreach to Rishabh without referencing Vedant.' }]
  },

  // C10
  'call:b747f592-810e-583c-9b81-8db5ab035806': {
    routes: ['Triage / Unqualified'],
    filePrefixes: [{ folder: 'triage_and_intake', name: 'c10_departed_contact_manufacturing.md' }],
    rationale: 'Aniket no longer works at Meadowbrick, moved to manufacturing sector, and refused follow-up calls.',
    quotes: [
      '"Are you calling about Meadowbrick? Yes, that\'s right. I don\'t work there anymore."',
      '"Would a follow-up call on Monday or Tuesday next week be okay? No. I said I will contact you if there is anything to discuss."'
    ],
    uncertainty: ['No opportunity exists; phone number should be removed from active sequences.'],
    actions: [{ owner: 'Meera', text: 'Mark contact departed from Meadowbrick; set DNC flag in CRM.' }]
  },

  // M01 (Multi-route: Partnership Referral & Sales Coaching)
  'meeting:cb5cecac-e68d-52b7-b10b-b0c748efc467': {
    routes: ['Partnership Referral', 'Sales Coaching'],
    filePrefixes: [
      { folder: 'partnerships', name: 'm01_harborpath_advisory_partnership.md' },
      { folder: 'sales_coaching', name: 'm01_qualification_boundaries.md' }
    ],
    rationale: 'Partner A at Harborpath Advisory seeks commercial revenue-share agreement to refer clients needing US virtual business accounts and cards.',
    quotes: [
      'Turn 4: "For businesses with a US entity, SpendNest offers virtual accounts and wallets in several currencies. There are corporate cards as well..."',
      'Turn 6: "Usually I receive nothing for the recommendation. If there is a sensible commercial arrangement here, that is interesting to me."',
      'Turn 7: "Let me show you the partner commission slide, the customer pricing and the onboarding requirements."'
    ],
    uncertainty: ['SpendNest works exclusively with registered US business entities, not personal accounts (Turn 2, 4).', 'No signed agreement yet.'],
    actions: [{ owner: 'Team member A', text: 'Email partner commission structure and onboarding checklist to Partner A.' }]
  },

  // M02
  'meeting:1a21c409-c050-5787-90af-2667e057e1b6': {
    routes: ['Deal Next Steps'],
    filePrefixes: [{ folder: 'deal_next_steps', name: 'm02_ledgerbridge_multi_entity_erp.md' }],
    rationale: 'LedgerBridge evaluating SpendNest multi-entity expense approvals and accounting sync with QuickBooks & NetSuite across international subsidiaries.',
    quotes: [
      'Turn 12: "We manage books for companies with subsidiaries in the UK and Singapore. How does currency conversion work when syncing expenses?"',
      'Turn 18: "If our client sets up five legal entities, do they require separate logins or can a single finance team manage all five?"'
    ],
    uncertainty: ['Live ERP integration sandbox pending IT clearance; multi-entity bundle pricing not finalized.'],
    actions: [
      { owner: 'Team member A', text: 'Send multi-entity architecture diagram and QuickBooks/NetSuite sync guide.' },
      { owner: 'Team member A', text: 'Prepare multi-subsidiary pricing proposal.' }
    ]
  },

  // M03
  'meeting:398672e7-62dd-5afd-846d-0237d49792fb': {
    routes: ['Deal Next Steps'],
    filePrefixes: [{ folder: 'deal_next_steps', name: 'm03_asterloom_two_tier_approval.md' }],
    rationale: 'Asterloom Systems evaluation of custom project billable codes, two-tier PM/Finance approval hierarchy, and department spend limit enforcement.',
    quotes: [
      'Turn 8: "Our project managers need to approve expenses tied to their client billable codes before finance approves."',
      'Turn 14: "Can SpendNest enforce custom spend limits by department and auto-flag out-of-policy hotel bookings?"'
    ],
    uncertainty: ['Requires Enterprise plan; prospect has not yet signed pricing agreement.'],
    actions: [
      { owner: 'Team member A', text: 'Configure sandbox demonstrating two-tier approval hierarchy.' },
      { owner: 'Team member A', text: 'Send Enterprise security compliance documentation.' }
    ]
  },

  // M04
  'meeting:b0f79b3d-37ba-52f9-b2bc-58b159dd6d91': {
    routes: ['Deal Next Steps'],
    filePrefixes: [{ folder: 'deal_next_steps', name: 'm04_cedarwave_driver_fuel_cards.md' }],
    rationale: 'Cedarwave Distribution logistics review for 60+ delivery vehicles requiring driver fuel cards, instant emergency top-ups, and ERP PO matching.',
    quotes: [
      'Turn 9: "Drivers need immediate card top-ups when emergency repairs happen on the road."',
      'Turn 16: "Our ERP requires purchase orders matched to vendor invoices before clearance."'
    ],
    uncertainty: ['Migration schedule pending unrecorded meeting M13.'],
    actions: [{ owner: 'Team member A', text: 'Provide fuel card spending limits spec and mobile app driver guide.' }]
  },

  // M06
  'meeting:657b9e9d-9472-5b01-a127-a648ad7e8cf7': {
    routes: ['Sales Coaching'],
    filePrefixes: [{ folder: 'sales_coaching', name: 'm06_mapletrail_timeline_pushback.md' }],
    rationale: 'Mapletrail Services AP automation review. Prospect pushed back against three-month transition window and requested custom ledger fields.',
    quotes: [
      'Turn 11: "We cannot afford a three-month transition window during Q3."',
      'Turn 22: "We need non-standard invoice metadata fields mapped to our ledger."'
    ],
    uncertainty: ['Custom ERP mapping may require professional services engineering.'],
    actions: [{ owner: 'Team member A', text: 'Provide standard rapid 2-week onboarding template.' }]
  },

  // M07 (Post-Update Revision 2)
  'meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a': {
    routes: ['Deal Next Steps'],
    filePrefixes: [{ folder: 'deal_next_steps', name: 'm07_willowfield_trust_wallets.md' }],
    rationale: 'Willowfield Trust evaluation of multi-currency sub-wallets, automated reconciliation with banking feeds, and compliance review.',
    quotes: [
      'Turn 6: "We currently handle disbursements across three currencies and need sub-wallets for each client project."',
      'Turn 14: "What is your automated reconciliation frequency with our primary banking feed?"',
      'Turn 23: "Send over the compliance and security certifications before our board review on Thursday."'
    ],
    uncertainty: ['Board review scheduled Thursday; active evaluation, not closed contract.'],
    actions: [
      { owner: 'Team member A', text: 'Send SOC2 compliance certification and sub-wallet architecture guide.' },
      { owner: 'Team member A', text: 'Confirm board presentation date and offer pre-meeting technical briefing.' }
    ]
  },

  // M09 (Multi-route: Customer Success & Internal Ops)
  'meeting:4b5b9192-f3fc-505a-8e77-4d2ffaa54594': {
    routes: ['Customer Success / Support', 'Internal / Operations'],
    filePrefixes: [
      { folder: 'customer_success', name: 'm09_brookmint_holdings_activation.md' },
      { folder: 'internal_ops', name: 'm09_token_lifespan_escalation.md' }
    ],
    rationale: 'Critical implementation blocker: Brookmint Holdings admin cannot onboard subsidiaries due to expired invite tokens and mismatched enterprise email domains.',
    quotes: [
      'Turn 18: "Three of our subsidiary admins tried to activate accounts today and received token expiration errors."',
      'Turn 31: "I will check the expired-token problem for Brookmint Holdings with the team and aim to return with an update today, otherwise Monday."',
      'Turn 32: "I will speak to our IT team about the separate email identities. Thank you."'
    ],
    uncertainty: ['Issue unresolved in meeting; awaiting engineering investigation on token expiry.'],
    actions: [
      { owner: 'Team member A', text: 'URGENT: Investigate token lifespan and regenerate invite links for Brookmint admins.' },
      { owner: 'Team member A', text: 'Provide customer IT team with domain whitelist instructions.' }
    ]
  },

  // M10
  'meeting:337f297d-9385-5b82-9e54-5019c1ed912c': {
    routes: ['Internal / Operations'],
    filePrefixes: [{ folder: 'internal_ops', name: 'm10_billing_workflow_walkthrough.md' }],
    rationale: 'Internal operational enablement session detailing super-admin billing engine, invoice generation at midnight, 3-attempt dunning flow, and manual account unfreeze rules.',
    quotes: [
      'Turn 5: "Operations uses it to create accounts, control enabled features and manage billing. I will show what it looks like..."',
      'Turn 15: "Suppose the invoice is INR 6,240 but the wallet contains INR 6,110. The deduction fails... The system tries three times."',
      'Turn 18: "The customer must tell us, then operations clears the outstanding invoice and unfreezes the account."'
    ],
    uncertainty: ['Internal training walkthrough, not an external prospect interaction. Zero sales pipeline value.'],
    actions: [{ owner: 'Team member A', text: 'Ensure new operations staff complete back-office super-admin access requests.' }]
  }
};

// Generate Markdown files and build manifest rows
const manifestRows = [];

store.forEach(({ raw, revision }, key) => {
  const meta = recordMetadata[key];
  const identityKey = key;
  const isM07 = raw.record_ref === 'M07';

  // Determine routes and output paths
  let routes = [];
  let outputPaths = [];
  let processingState = 'Reviewed';
  let manualOverride = false;
  let analysisFreshness = 'current';

  if (meta) {
    routes = meta.routes;
    outputPaths = meta.filePrefixes.map(f => `exports/${f.folder}/${f.name}`);
    processingState = meta.routes.includes('Customer Success / Support') || meta.routes.includes('Deal Next Steps')
      ? 'Action Required'
      : 'Reviewed';
    analysisFreshness = isM07 && revision >= 2 ? 'current_rev2' : 'current';
  } else {
    // Records without usable transcripts (B01-B20, M05, M08, M11-M14)
    routes = ['Triage / Unqualified'];
    const fileName = `${raw.record_ref.toLowerCase()}_intake_${raw.source_id.slice(0, 8)}.md`;
    outputPaths = [`exports/triage_and_intake/${fileName}`];
    processingState = 'Intake Logged';
    analysisFreshness = 'not_applicable';
  }

  // Generate the actual Markdown file for each output path
  outputPaths.forEach((relPath, idx) => {
    const fullPath = path.resolve(workspaceRoot, relPath);
    const assignedRoute = routes[idx] || routes[0];

    let content = '';

    if (meta) {
      content = `# Analysis Document: ${raw.record_ref} — ${assignedRoute}
**Source Record Reference:** ${raw.record_ref}  
**Source Type:** ${raw.source_type.toUpperCase()}  
**Source ID:** \`${raw.source_id}\`  
**Applied Delivery Revision:** ${revision}  
**Primary Assigned Route:** ${assignedRoute}  
**Associated Routes:** ${routes.join(', ')}  
**Review Status:** ${processingState}  
**Analysis Freshness:** ${analysisFreshness}  
**Timestamp (IST):** ${raw.source_type === 'call' ? raw.payload.started_at : raw.payload.starts_at}  
**Representative / Organizer:** ${raw.source_type === 'call' ? `${raw.payload.rep_name} (Sales Rep)` : `${raw.payload.organizer_email} (Meeting Organizer)`}  

---

## 1. Executive Summary & Why It Matters
${meta.rationale}

## 2. Transcript Evidence Citations
${meta.quotes.map(q => `- ${q}`).join('\n')}

## 3. What Evidence Does NOT Establish (Honest Uncertainty)
${meta.uncertainty.map(u => `- ${u}`).join('\n')}

## 4. Action Items & Stated Owners
${meta.actions.map(a => `- **${a.owner}:** ${a.text}`).join('\n')}

---

## 5. Raw Transcript Evidence
${raw.source_type === 'call'
  ? (raw.payload.transcript || 'No transcript text available.')
  : (raw.transcript_payload?.turns && raw.transcript_payload.turns.length > 0
    ? raw.transcript_payload.turns.map(t => `**${t.speaker}** (${t.timecode}): ${t.text}`).join('\n\n')
    : 'No transcript turns recorded.')
}
`;
    } else {
      // Record without usable text - explicit adherence to contract (NO hallucinated summaries!)
      const unavailableReason = raw.source_type === 'meeting'
        ? (raw.transcript_payload?.unavailable_reason || 'No transcript turns supplied.')
        : 'Background phone call. Transcript text withheld in this delivery envelope.';

      content = `# Intake Record: ${raw.record_ref} (No Usable Text Supplied)
**Source Record Reference:** ${raw.record_ref}  
**Source Type:** ${raw.source_type.toUpperCase()}  
**Source ID:** \`${raw.source_id}\`  
**Applied Delivery Revision:** ${revision}  
**Intake Status:** ${processingState}  
**Timestamp (IST):** ${raw.source_type === 'call' ? raw.payload.started_at : raw.payload.starts_at}  
**Representative / Organizer:** ${raw.source_type === 'call' ? `${raw.payload.rep_name} (Sales Rep)` : `${raw.payload.organizer_email} (Meeting Organizer)`}  

---

## Intake Status & Reason
> [!NOTE]
> **Upstream Condition:** ${unavailableReason}

Per **DATA_CONTRACT.md** and **DATA_DICTIONARY.md**, this record has been cataloged with an intake status. No synthetic or hallucinated dialogue summary is fabricated for records lacking usable text.

### Upstream Stored Metadata
- **Duration Seconds:** ${raw.payload.duration_seconds}
- **Connection Flag:** ${raw.source_type === 'call' ? String(raw.payload.is_connected) : 'N/A'}
- **Conversation Flag:** ${raw.source_type === 'call' ? String(raw.payload.is_conversation) : 'N/A'}
- **Recording Status:** ${raw.source_type === 'meeting' ? raw.payload.recording_status : 'N/A'}
`;
    }

    fs.writeFileSync(fullPath, content, 'utf8');
  });

  manifestRows.push({
    source_type: raw.source_type,
    source_id: raw.source_id,
    record_ref: raw.record_ref,
    applied_revision: revision,
    routes: routes,
    output_paths: outputPaths,
    processing_state: processingState,
    manual_override: manualOverride,
    analysis_freshness: analysisFreshness
  });
});

// Sort manifest by record_ref for stable reading
manifestRows.sort((a, b) => a.record_ref.localeCompare(b.record_ref));

// Write manifest.json
const manifestJsonPath = path.join(exportsDir, 'manifest.json');
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestRows, null, 2), 'utf8');

// Write manifest.csv
const csvHeaders = [
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

const csvLines = [csvHeaders.join(',')];

manifestRows.forEach(row => {
  const routesStr = `"${row.routes.join('; ')}"`;
  const pathsStr = `"${row.output_paths.join('; ')}"`;
  const line = [
    row.source_type,
    row.source_id,
    row.record_ref,
    row.applied_revision,
    routesStr,
    pathsStr,
    `"${row.processing_state}"`,
    row.manual_override,
    row.analysis_freshness
  ].join(',');
  csvLines.push(line);
});

const manifestCsvPath = path.join(exportsDir, 'manifest.csv');
fs.writeFileSync(manifestCsvPath, csvLines.join('\n'), 'utf8');

console.log(`Generated ${manifestRows.length} manifest rows.`);
console.log(`Total output files created: ${manifestRows.reduce((acc, r) => acc + r.output_paths.length, 0)} files.`);
console.log(`Exports written successfully to ${exportsDir}`);
