# SpendNest — Revenue Intelligence Inbox

A manager workspace built for sales leadership to triage, analyze, and act upon multi-channel revenue communications (calls, calendar meetings, transcripts, and upstream automated tags) according to the data contracts of the Revenue Intelligence Inbox challenge.

## Live Production Deployment

- **Public Production URL:** [https://app-eight-tan-46.vercel.app](https://app-eight-tan-46.vercel.app)
- **Deployment Preview URL:** [https://app-62spwvkq2-srimathi412s-projects.vercel.app](https://app-62spwvkq2-srimathi412s-projects.vercel.app)
- **Access:** Publicly accessible, no authentication or login required.

---

## 1. Quickstart & Setup

### Prerequisites
- Node.js `v20.x` or higher
- npm `v10.x` or higher

### Local Run Instructions
```bash
# 1. Enter the application directory
cd app

# 2. Install dependencies (if running for the first time)
npm install

# 3. Run development server
npm run dev
# -> Local server starts at http://localhost:5173

# 4. Or build and run production preview
npm run build
npm run preview -- --port 4173
# -> Production preview runs at http://localhost:4173

# 5. Run automated test suite (Replay Contract & Export Programmatic Validation)
npm test
```

---

## 2. How to Reproduce the 5-Step Replay Test

The application implements the complete replay contract from `DATA_CONTRACT.md`. You can verify this interactively via the **Import & Replay** screen in the application or by running the automated test suite (`npm test`).

| Step | Action | Expected Behavior & Verification |
| :--- | :--- | :--- |
| **Step 1: Initial Import** | Click **"1. Run Initial Import"** or load `data/01_initial.json`. | Ingests 44 unique records (30 calls, 14 meetings). Exactly 17 records have usable transcripts. M07 transcript is withheld (`turns: []`) with explanation recorded. |
| **Step 2: Repeat Import** | Click **"2. Test Repeat Import"** to re-import the same file with records in shuffled order. | Deduplication verified: Inserted = 0, Updated = 0, Ignored = 44. Total record count strictly remains **44** (no duplicate records or inflated counts). |
| **Step 3: Manual Route Correction** | Click **"3. Set M07 to Deal Next Steps"** or manually edit M07 in the Inbox. | M07 effective route is updated to `"Deal Next Steps"`. Override is saved in `localStorage` with timestamp and audit notes. |
| **Step 4: Update Import** | Click **"4. Apply 02_update.json"** (`update-002`, Revision 2). | M07 advances to Revision 2. Its previous payload is completely replaced (not merged); transcript turns increase from 0 to **27**. Total unique records remains **44**; usable transcripts increases from 17 to **18**. |
| **Step 5: Preserve Judgment** | Refresh the browser (<kbd>F5</kbd>) or restart app, then click **"5. Inspect M07 Record"**. | M07 retains its manual route override (`"Deal Next Steps"`), displays all 27 turns of dialogue, and flags review status. Re-importing Revision 1 is ignored and cannot revert Revision 2. |

---

## 3. Metric Definitions & Safe Denominators

All activity occurs on **21 August 2026** in **Asia/Kolkata (IST)**. Per `DATA_DICTIONARY.md`, headline metrics define their exact denominators to prevent distorted conclusions:

1. **Total Selected Records (Denominator = 44):**
   - Formula: $\text{Count of unique } (source\_type, source\_id) \text{ after applying revisions}$.
   - Result: **44 unique records** (30 phone calls, 14 calendar meetings).
2. **Transcript Coverage Rate (Denominator = 44 total records):**
   - Formula: $\frac{\text{Records with usable supplied transcript}}{\text{Total selected records in filter}} \times 100\%$.
   - Initial State: $17 / 44 = \mathbf{38.6\%}$ (10 calls, 7 meetings).
   - Post-Update State: $18 / 44 = \mathbf{40.9\%}$ (10 calls, 8 meetings after M07 update).
3. **Source-Reported Connection Rate (Denominator = 30 calls with non-null is_connected):**
   - Formula: $\frac{\text{Calls with } is\_connected = true}{\text{Calls with non-null } is\_connected} \times 100\%$.
   - Result: $11 / 30 = \mathbf{36.7\%}$ (Unknown count: 0).
   - *Integrity Note:* This is an upstream machine classification flag, not verified human dialogue. For example, C04 is tagged `is_connected=false` but contains an actionable voicemail message.
4. **Call Reps vs Meeting Organizers:**
   - **Call Reps:** 5 individuals (`Arun`, `Leela`, `Kiran`, `Meera`, `Dev`) identified via `rep_name`.
   - **Meeting Organizers:** 10 email identities (`team06@...` through `team14@...`, `arun@...`) identified via `organizer_email`. Meeting organizers are not assumed to be sales reps or attendees.

---

## 4. The Three Most Important Findings

### Finding 1: Unsubstantiated Upstream Telecom Label Discards Actionable Outreach
- **Source Passage Citation:** Call **C04** (Source ID: `bcdcbf56-d338-5c78-9a97-42c2fc1c9931`, Rep: Arun):
  > *"My understanding is that our information first went to the wrong email address. We subsequently used the corrected address you gave us, and I hope you have now had a chance to see it. Please call me back to let me know where things stand."*
- **Observed Discrepancy:** Stored metadata reports `is_connected=false` and `is_conversation=false`. A naive CRM pipeline would mark this as a "dropped/failed dial".
- **Product Impact:** C04 is routed to **Triage / Voicemail Follow-up** with an automated 48-hour callback task, preventing loss of active sales momentum.

### Finding 2: High-Severity Onboarding Blocker at Multi-Entity Enterprise Account
- **Source Passage Citation:** Meeting **M09** (Source ID: `4b5b9192-f3fc-505a-8e77-4d2ffaa54594`, Brookmint Holdings):
  > *Turn 18 (Customer A): "Three of our subsidiary admins tried to activate accounts today and received token expiration errors."*  
  > *Turn 31 (Team member A): "I will check the expired-token problem for Brookmint Holdings with the team and aim to return with an update today, otherwise Monday."*
- **Observed Discrepancy:** The title was labeled generically as *"Account setup and workflow discussion"*, masking a critical deployment failure.
- **Product Impact:** Multi-routed to **Customer Success / Support** (P0 blocker) and **Internal Operations** (escalation ticket to engineering to lengthen invite token lifespans and provide domain whitelist guidance).

### Finding 3: Cold Outbound Reps Pitching Basic Cards Against Entrenched Incumbent Software
- **Source Passage Citation:** Calls **C05** (Meera) and **C06** (Meera / Ravi):
  > *C05: "Does your current system also execute the vendor payments? Yes, it does... One is StoreHarbor, and we use others too."*  
  > *C06: "We have quite a lot of automation, with a mixed model where needed. The essential processes are automated and connected through our business management system. Head office manages it, and we have full visibility."*
- **Observed Discrepancy:** Reps pitched store expense cards to retail prospects operating 100+ stores who already have dedicated procurement software (StoreHarbor) and central ERP monitoring.
- **Product Impact:** Routed to **Sales Coaching**: provides actionable coaching directives advising reps to pivot outreach toward multi-store accounting reconciliation and ERP sync friction rather than pitching basic card issuance.

---

## 5. One Considered and Rejected Decision

### Rejected Alternative: Synthesizing Automated Pipeline Revenue Totals & Rep Performance Rankings
- **Alternative Considered:** We evaluated computing total pipeline dollar values (e.g. estimating deal sizes from mention of store counts or billing training sums) and ranking reps on a performance leaderboard.
- **Reason for Rejection:** The dataset provides no CRM opportunity table, authoritative deal size, contract duration, win probability, or historical pipeline baseline. In conversation M10, numbers like `INR 6,240` refer to internal super-admin billing dunning training, while store counts in C05/C06 reflect prospect footprint, not contract value. Synthesizing pipeline totals from conversational claims would create ungrounded, fabricated numbers that mislead leadership.
- **Accepted Trade-off:** We deliberately omitted speculative pipeline dollar charts. Instead, we focused on verified qualitative signals: active evaluation next steps, blocker alerts, and coaching opportunities grounded in exact transcript passages.

---

## 6. AI Usage, Pre-Generated vs Dynamic Analysis, and Limitations

1. **AI Tool Usage:** Generative AI was used to draft initial analysis seeds, extract verbatim quotes, and assist with TypeScript boilerplate.
2. **Pre-Generated Content:** Analytical summaries, passage citations, unsupported claim boundaries, and recommended action items for the 18 conversations and 26 non-text records were seeded upfront to eliminate runtime latency and ensure deterministic evaluation.
3. **Dynamic Operations:** The application dynamically executes:
   - Data validation and envelope schema enforcement.
   - Composite identity deduplication and idempotent upserts.
   - Dynamic metric calculations with explicit denominators.
   - Real-time search, multi-dimensional filtering, and sorting.
   - `localStorage` persistence and audit history for manual overrides.
   - Multi-route export compilation and client-side ZIP packaging via JSZip.
4. **Known Limitations & Unfinished Work:**
   - Single-day snapshot: All activity falls on 21 August 2026; multi-day trend forecasting is not possible from this extract.
   - No Live CRM Webhook: Relies on JSON deliveries rather than live bidirectional Salesforce/HubSpot synchronization.
   - Approximate Hours Spent: ~7 hours of architecture, analysis grounding, implementation, and automated testing.

---

## 7. Generated Export & Manifest Hierarchy

Generated analysis files are organized into route-specific folders at [`exports/`](file:///d:/Revenue%20Intelligence%20Inbox/exports/):

```
exports/
├── daily_brief/
│   └── manager_brief_2026_08_21.md
├── customer_success/
│   └── m09_brookmint_holdings_activation.md
├── deal_next_steps/
│   ├── c03_developer_api_pricing.md
│   ├── c08_frontline_people_ops_proposal.md
│   ├── m02_ledgerbridge_multi_entity_erp.md
│   ├── m03_asterloom_two_tier_approval.md
│   ├── m04_cedarwave_driver_fuel_cards.md
│   └── m07_willowfield_trust_wallets.md
├── internal_ops/
│   ├── m09_token_lifespan_escalation.md
│   └── m10_billing_workflow_walkthrough.md
├── partnerships/
│   ├── c07_willowbank_advisory_referral.md
│   └── m01_harborpath_advisory_partnership.md
├── sales_coaching/
│   ├── c01_cold_call_objections.md
│   ├── c05_storeharbor_incumbent_pitch.md
│   ├── c06_retail_cash_advance_pitch.md
│   ├── c09_internal_software_referral.md
│   ├── m01_qualification_boundaries.md
│   └── m06_mapletrail_timeline_pushback.md
├── triage_and_intake/
│   ├── b01_intake_...md through b20_intake_...md
│   ├── c01_contact_compliance_triage.md
│   ├── c02_receptionist_gatekeeper.md
│   ├── c04_lanternpath_voicemail.md
│   ├── c10_departed_contact_manufacturing.md
│   └── m05, m08, m11, m12, m13, m14 intake docs
├── manifest.json
└── manifest.csv
```

---

## 8. Automated Test Verification

Run the comprehensive test suite verifying the replay contract and export integrity:
```bash
cd app
npm test
```

Test Results:
- `DATA_CONTRACT.md Replay Suite`: 6 tests passed (Initial import, Repeat import order-independence, Manual correction, Update import, Override preservation, Malformed payload protection).
- `Export Generation & Manifest Programmatic Validation`: 7 tests passed (Manifest schema, File path resolution, Multi-route handling, CSV escaping, Daily brief findings, No hallucination verification, M07 revision 2 validation).
- **Total: 13 passed, 0 failed.**
