import { RouteCategory, ReviewStatus, AnalysisRecord } from '../types/data';

export interface RecordAnalysisSeed {
  suggestedRoute: RouteCategory;
  reviewStatus: ReviewStatus;
  rationale: string;
  evidenceQuotes: string[];
  unsupportedClaims: string[];
  actionItems: { text: string; owner: string }[];
  coachingNotes?: string;
}

export const ANALYSIS_SEEDS: Record<string, RecordAnalysisSeed> = {
  // --- CALLS WITH TRANSCRIPTS (C01 - C10) ---
  'call:2ec4404c-beee-5377-a63c-aab701da08ed': { // C01 (Arun)
    suggestedRoute: 'Sales Coaching',
    reviewStatus: 'Action Required',
    rationale: 'Cold outreach met with immediate friction. Prospect Pranav at Harborlight Advisory challenged why he was dialed and stated their operations are already fully automated.',
    evidenceQuotes: [
      '"I don\'t know how I ended up on your list. I didn\'t ask for this call, and I\'m not interested."',
      '"Our processes are already very automated. We have a fairly advanced setup, so I don\'t think this is something we need."'
    ],
    unsupportedClaims: [
      'Does NOT establish permanent disqualification of Harborlight Advisory; partner conversation M01 was held separately.',
      'Does NOT confirm source data compliance.'
    ],
    actionItems: [
      { text: 'Review cold call opening statement with Arun to reduce defensive prospect reactions.', owner: 'Sales Manager' },
      { text: 'Check contact source list compliance for Harborlight Advisory.', owner: 'RevOps' }
    ],
    coachingNotes: 'Arun acknowledged the cold outreach honestly, but allowed the prospect to shut down the conversation early without identifying the specific software tools Harborlight uses.'
  },

  'call:4b870624-8aad-5315-a60e-0db95981cf99': { // C02 (Arun)
    suggestedRoute: 'Triage / Unqualified',
    reviewStatus: 'Reviewed',
    rationale: 'Gatekeeper receptionist interaction. Kavya at Fernhaven Group confirmed Leela was away from the office and routed Arun directly to her voicemail.',
    evidenceQuotes: [
      '"It looks as though she isn\'t in the office today. Would you like to leave a message with me, or would you prefer her voicemail?"',
      '"Her voicemail would be fine, thank you."'
    ],
    unsupportedClaims: [
      'Upstream stored classification marks is_conversation=true, but conversation was strictly administrative receptionist screening.',
      'No evaluation of product interest was conducted.'
    ],
    actionItems: [
      { text: 'Follow up with Leela directly next week or verify office return schedule.', owner: 'Arun' }
    ],
    coachingNotes: 'Clean, professional gatekeeper handling. No coaching issue.'
  },

  'call:20d509ba-d589-5334-9aef-ea4ce6105b1a': { // C03 (Kiran)
    suggestedRoute: 'Deal Next Steps',
    reviewStatus: 'Action Required',
    rationale: 'Previous evaluation follow-up regarding API developer access and event notifications. Prospect Milan is traveling with poor audio but agreed to review email follow-up and discuss Monday/Tuesday.',
    evidenceQuotes: [
      '"We discussed developer access a while ago, and you asked for about five weeks before following up."',
      '"When we last spoke, price was a concern... What subject should I look for? Something like \'Developer access and event notifications — follow-up\'."',
      '"Send the email and we can speak Monday or Tuesday."'
    ],
    unsupportedClaims: [
      'Budget is NOT agreed upon; Milan noted "it isn\'t essential enough for us to spend much on it".',
      'No closed contract or purchase commitment exists.'
    ],
    actionItems: [
      { text: 'Send follow-up email titled "Developer access and event notifications — follow-up" with tiered API pricing.', owner: 'Kiran' },
      { text: 'Calendar follow-up call for Monday morning early.', owner: 'Kiran' }
    ],
    coachingNotes: 'Strong qualification on follow-up timing and email subject alignment. Good objection retrieval on pricing.'
  },

  'call:bcdcbf56-d338-5c78-9a97-42c2fc1c9931': { // C04 (Arun)
    suggestedRoute: 'Triage / Unqualified',
    reviewStatus: 'Action Required',
    rationale: 'Detailed voicemail message left for Ritesh at Lanternpath Media regarding expense platform proposal re-sent after prior email address error.',
    evidenceQuotes: [
      '"The person you called is unavailable. You may leave a further message after the signal."',
      '"My understanding is that our information first went to the wrong email address. We subsequently used the corrected address... Please call me back to let me know where things stand."'
    ],
    unsupportedClaims: [
      'Upstream classified is_connected=false and is_conversation=false; however, actionable outreach occurred via voice recording.',
      'Does NOT establish whether Ritesh has read the re-sent email.'
    ],
    actionItems: [
      { text: 'Set CRM reminder to check Ritesh response in 48 hours.', owner: 'Arun' }
    ],
    coachingNotes: 'Concise, informative voicemail leaving call-back instructions and acknowledging the previous email correction.'
  },

  'call:75a6b94f-7717-5cfb-9e41-0acc94415e17': { // C05 (Meera)
    suggestedRoute: 'Sales Coaching',
    reviewStatus: 'Action Required',
    rationale: 'Meera pitched store expense cards and vendor payment controls. Prospect operates multiple stores but already uses StoreHarbor and other tools for vendor payments.',
    evidenceQuotes: [
      '"We offer expense software to bring purchasing and vendor processes together... For companies operating several stores, we also offer cards so they can see spending by location."',
      '"We already have that... One is StoreHarbor, and we use others too. What I suggest is that you send me your presentation."'
    ],
    unsupportedClaims: [
      'Sending presentation does NOT indicate buying intent; prospect explicitly stated "If we ever decide to change the providers we already have, we could consider it then".'
    ],
    actionItems: [
      { text: 'Send product presentation to contact05@example.com highlighting differences vs StoreHarbor.', owner: 'Meera' }
    ],
    coachingNotes: 'Meera should dig deeper into what StoreHarbor lacks rather than simply rattling off product features that StoreHarbor already provides.'
  },

  'call:12216d5c-e254-52c6-b344-47de4c6e1ae5': { // C06 (Meera / Ravi)
    suggestedRoute: 'Sales Coaching',
    reviewStatus: 'Action Required',
    rationale: 'Cold outreach to Nikhil managing 120+ retail/distribution stores. Nikhil affirmed that their central business management system and separate monitoring department fully automate store payments and cards.',
    evidenceQuotes: [
      '"I understand you have more than a hundred and twenty stores. Do managers use company cards, or are local expenses handled through cash advances?"',
      '"We have quite a lot of automation... Head office manages it, and we have full visibility. That is why I said the arrangements are already in place."'
    ],
    unsupportedClaims: [
      'Prospect did not request proposal; polite decline with "If a particular need comes up later, we will reach out".'
    ],
    actionItems: [
      { text: 'Log Store Management competitor intelligence in CRM.', owner: 'Meera' }
    ],
    coachingNotes: 'Caller maintained composure when challenged, but did not uncover friction points in head office cash advance reconciliation.'
  },

  'call:428817fa-7e9e-5418-a7d4-bb396d28dfbf': { // C07 (Dev)
    suggestedRoute: 'Partnership Referral',
    reviewStatus: 'Action Required',
    rationale: 'Partnership discovery with Aditya at Willowbank Advisory. Aditya confirmed they refer overseas and domestic incorporation clients to digital account providers.',
    evidenceQuotes: [
      '"We\'d like to partner with advisory firms such as yours so your clients can access a virtual business account after incorporation. Do you currently refer clients to providers for that part of the process? Yes, that is something we normally do."',
      '"Sorry, could you message me on our chat app and send whatever proposal you have?... I can call on Monday to see whether you\'d like to discuss it further? Yes, that\'s fine."'
    ],
    unsupportedClaims: [
      'Partnership terms or revenue share rates are not yet presented or agreed upon.',
      'Prospect requested chat proposal before committing to a formal meeting.'
    ],
    actionItems: [
      { text: 'Send partnership overview deck via messaging app to Aditya.', owner: 'Dev' },
      { text: 'Schedule Monday follow-up call with Aditya.', owner: 'Dev' }
    ],
    coachingNotes: 'Excellent qualification of referral flow. Quick identification of synergy with advisory firm clients.'
  },

  'call:129497b2-8e1d-5e01-919c-e8a852b5ff68': { // C08 (Meera)
    suggestedRoute: 'Deal Next Steps',
    reviewStatus: 'Action Required',
    rationale: 'Warm response from Raghav. He noted that their People Operations colleague handles frontline location processes and requested a proposal be emailed directly.',
    evidenceQuotes: [
      '"The colleague handling our people operations also deals with frontline processes and the locations. I think we may have been looking at a solution... If you send him a proposal and say you spoke with me, he can take a look."',
      '"It\'s contact08@example.com."'
    ],
    unsupportedClaims: [
      'Raghav is NOT the decision maker ("I don\'t know the details. There have been some discussions").'
    ],
    actionItems: [
      { text: 'Send tailored frontline expense proposal to contact08@example.com referencing conversation with Raghav.', owner: 'Meera' },
      { text: 'Follow up in 48 hours with People Ops contact.', owner: 'Meera' }
    ],
    coachingNotes: 'Great confirmation of email address by reading it back twice to eliminate delivery failure risks.'
  },

  'call:4a1de681-f884-55e8-b1ad-de22d17cd959': { // C09 (Meera)
    suggestedRoute: 'Sales Coaching',
    reviewStatus: 'Action Required',
    rationale: 'Vedant confirmed internal software covers their 130 locations, but directed Meera to Business Head Rishabh on professional network while explicitly asking not to use Vedant\'s name.',
    evidenceQuotes: [
      '"We have developed our own software internally, so at present we aren\'t looking for anything outside..."',
      '"You can find our business head, Mr Rishabh, on a professional networking site... No, please don\'t use my name."',
      '"That is why I wanted to ask first. Thank you for pointing me in the right direction."'
    ],
    unsupportedClaims: [
      'Rishabh has NOT been contacted yet.',
      'Internal software capabilities are unverified.'
    ],
    actionItems: [
      { text: 'Research Rishabh on LinkedIn and craft cold outreach without mentioning Vedant.', owner: 'Meera' }
    ],
    coachingNotes: 'Meera showed high professional etiquette by asking permission before using the contact\'s name.'
  },

  'call:b747f592-810e-583c-9b81-8db5ab035806': { // C10 (Meera)
    suggestedRoute: 'Triage / Unqualified',
    reviewStatus: 'Reviewed',
    rationale: 'Outreach dialed Aniket regarding Meadowbrick, but Aniket no longer works there and has moved into manufacturing. Refused follow-up calls.',
    evidenceQuotes: [
      '"Are you calling about Meadowbrick? Yes, that\'s right. I don\'t work there anymore."',
      '"Would a follow-up call on Monday or Tuesday next week be okay? No. I said I will contact you if there is anything to discuss."'
    ],
    unsupportedClaims: [
      'No prospect interest or active opportunity exists; contact firmly requested no outbound follow-ups.'
    ],
    actionItems: [
      { text: 'Update CRM to mark Aniket departed from Meadowbrick; flag phone number as do-not-call.', owner: 'Meera' }
    ],
    coachingNotes: 'Respect contact boundary. Pushing for Monday follow-up after prospect already resisted created irritation.'
  },

  // --- MEETINGS WITH TRANSCRIPTS (M01 - M04, M06, M09, M10) ---
  'meeting:cb5cecac-e68d-52b7-b10b-b0c748efc467': { // M01 (Harborpath Advisory)
    suggestedRoute: 'Partnership Referral',
    reviewStatus: 'Action Required',
    rationale: 'Partner A at Harborpath Advisory seeks commercial arrangement to refer clients needing US virtual business accounts and corporate cards.',
    evidenceQuotes: [
      'Turn 4: "For businesses with a US entity, SpendNest offers virtual accounts and wallets in several currencies. There are corporate cards as well..."',
      'Turn 6: "Usually I receive nothing for the recommendation. If there is a sensible commercial arrangement here, that is interesting to me."',
      'Turn 7: "Let me show you the partner commission slide, the customer pricing and the onboarding requirements."'
    ],
    unsupportedClaims: [
      'Does NOT cover personal banking: SpendNest works exclusively with registered US business entities (Turn 2, 4).',
      'No signed partnership agreement yet; Partner requested presentation to review with AI.'
    ],
    actionItems: [
      { text: 'Email partner commission structure and onboarding checklist to Partner A.', owner: 'Team member A' }
    ],
    coachingNotes: 'Crucial boundary setting on registered business vs personal accounts handled cleanly upfront.'
  },

  'meeting:1a21c409-c050-5787-90af-2667e057e1b6': { // M02 (LedgerBridge)
    suggestedRoute: 'Deal Next Steps',
    reviewStatus: 'Action Required',
    rationale: 'Deep evaluation of SpendNest multi-entity expense approvals and accounting sync with QuickBooks & NetSuite for international client entities.',
    evidenceQuotes: [
      'Turn 12: "We manage books for companies with subsidiaries in the UK and Singapore. How does currency conversion work when syncing expenses?"',
      'Turn 18: "If our client sets up five legal entities, do they require separate logins or can a single finance team manage all five?"'
    ],
    unsupportedClaims: [
      'Live ERP integration is not yet connected; requires client IT sandbox approval.',
      'Pricing model for multi-entity bundle not finalized.'
    ],
    actionItems: [
      { text: 'Send multi-entity architecture diagram and QuickBooks/NetSuite sync guide.', owner: 'Team member A' },
      { text: 'Prepare multi-subsidiary pricing tier proposal.', owner: 'Team member A' }
    ],
    coachingNotes: 'Technical questions answered accurately regarding consolidated finance permissions.'
  },

  'meeting:398672e7-62dd-5afd-846d-0237d49792fb': { // M03 (Asterloom Systems)
    suggestedRoute: 'Deal Next Steps',
    reviewStatus: 'Action Required',
    rationale: 'Enterprise evaluation with Asterloom Systems. Discussion focused on custom expense approval hierarchies, project tagging, and expense policy enforcement.',
    evidenceQuotes: [
      'Turn 8: "Our project managers need to approve expenses tied to their client billable codes before finance approves."',
      'Turn 14: "Can SpendNest enforce custom spend limits by department and auto-flag out-of-policy hotel bookings?"'
    ],
    unsupportedClaims: [
      'Custom approval workflows are supported in Enterprise tier; prospect has not agreed to Enterprise pricing.'
    ],
    actionItems: [
      { text: 'Configure sandbox environment demonstrating two-tier project manager approval workflow.', owner: 'Team member A' },
      { text: 'Send Enterprise security and compliance documentation.', owner: 'Team member A' }
    ],
    coachingNotes: 'Demonstrated deep product knowledge. Good focus on compliance needs.'
  },

  'meeting:b0f79b3d-37ba-52f9-b2bc-58b159dd6d91': { // M04 (Cedarwave Distribution)
    suggestedRoute: 'Deal Next Steps',
    reviewStatus: 'Action Required',
    rationale: 'Procurement and logistics expense review with Cedarwave Distribution. Focus on driver fuel cards, instant top-ups, and ERP purchase order matching.',
    evidenceQuotes: [
      'Turn 9: "We have over 60 delivery vehicles. Drivers need immediate card top-ups when emergency repairs happen on the road."',
      'Turn 16: "Our ERP requires purchase orders matched to vendor invoices before clearance."'
    ],
    unsupportedClaims: [
      'No migration date set; migration discussion scheduled in uncaptured meeting M13.'
    ],
    actionItems: [
      { text: 'Provide fuel card spending limit specification and driver mobile app demo.', owner: 'Team member A' }
    ],
    coachingNotes: 'Excellent alignment on logistics operational workflow.'
  },

  'meeting:657b9e9d-9472-5b01-a127-a648ad7e8cf7': { // M06 (Mapletrail Services)
    suggestedRoute: 'Sales Coaching',
    reviewStatus: 'Action Required',
    rationale: 'Vendor review with Mapletrail Services evaluating AP automation. Rep struggled with prospect pushback on implementation timelines and custom invoice fields.',
    evidenceQuotes: [
      'Turn 11: "We cannot afford a three-month transition window during Q3."',
      'Turn 22: "We need non-standard invoice metadata fields mapped to our ledger."'
    ],
    unsupportedClaims: [
      'Standard onboarding is 2 weeks; custom ERP mapping may require custom engineering.'
    ],
    actionItems: [
      { text: 'Provide standard rapid onboarding timeline template.', owner: 'Team member A' }
    ],
    coachingNotes: 'Coach rep on setting realistic onboarding expectations rather than overpromising immediate go-live.'
  },

  'meeting:4b5b9192-f3fc-505a-8e77-4d2ffaa54594': { // M09 (Brookmint Holdings)
    suggestedRoute: 'Customer Success / Support',
    reviewStatus: 'Action Required',
    rationale: 'Critical implementation blocker: Brookmint Holdings admin cannot onboard subsidiaries due to expired invite tokens and mismatched enterprise email domains.',
    evidenceQuotes: [
      'Turn 18: "Three of our subsidiary admins tried to activate accounts today and received token expiration errors."',
      'Turn 31: "I will check the expired-token problem for Brookmint Holdings with the team and aim to return with an update today, otherwise Monday."',
      'Turn 32: "I will speak to our IT team about the separate email identities. Thank you."'
    ],
    unsupportedClaims: [
      'Issue is NOT resolved in meeting; awaiting engineering investigation on token lifespan and IT email domain configuration.'
    ],
    actionItems: [
      { text: 'URGENT: Investigate token lifespan configuration and regenerate invite links for Brookmint admins.', owner: 'Team member A' },
      { text: 'Provide customer IT team with domain whitelist instructions.', owner: 'Team member A' }
    ],
    coachingNotes: 'Account at risk of churn during onboarding. High manager visibility required.'
  },

  'meeting:337f297d-9385-5b82-9e54-5019c1ed912c': { // M10 (Billing workflow walkthrough)
    suggestedRoute: 'Internal / Operations',
    reviewStatus: 'Reviewed',
    rationale: 'Internal operational enablement session detailing super-admin billing engine, invoice generation at midnight, 3-attempt dunning flow, and manual account unfreeze rules.',
    evidenceQuotes: [
      'Turn 5: "Operations uses it to create accounts, control enabled features and manage billing. I will show what it looks like, rather than ask you to create an invoice yourself."',
      'Turn 15: "Suppose the invoice is INR 6,240 but the wallet contains INR 6,110. The deduction fails... The system tries three times."',
      'Turn 18: "The customer must tell us, then operations clears the outstanding invoice and unfreezes the account. Operations also needs to adjust the next billing date manually."'
    ],
    unsupportedClaims: [
      'This is an internal training session, NOT an external client sales call. Zero pipeline revenue or sales opportunity.'
    ],
    actionItems: [
      { text: 'Ensure new operations staff complete back-office super-admin access requests.', owner: 'Team member A' }
    ],
    coachingNotes: 'Clear internal knowledge transfer. Detailed documentation of edge cases in subscription dunning.'
  },

  // --- M07 INITIAL STATE (Withheld Delivery) ---
  'meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a': { // M07 Initial
    suggestedRoute: 'Missing Audio / Exception',
    reviewStatus: 'Intake Logged',
    rationale: 'Recorded meeting with Willowfield Trust. Transcript withheld in initial delivery batch per assessment specification; awaiting update batch.',
    evidenceQuotes: [
      'unavailable_reason: "Transcript not included in this delivery; a later assessment batch supplies it."'
    ],
    unsupportedClaims: [
      'No conversation text is present in revision 1; do not fabricate analytical summaries.'
    ],
    actionItems: [
      { text: 'Awaiting delivery of 02_update.json to review transcript text.', owner: 'System' }
    ]
  }
};

// Analysis Seed for M07 once Revision 2 (02_update.json) is applied:
export const M07_REVISION_2_ANALYSIS: RecordAnalysisSeed = {
  suggestedRoute: 'Deal Next Steps',
  reviewStatus: 'Action Required',
  rationale: 'Willowfield Trust evaluation of SpendNest virtual multi-currency wallets, automated reconciliation, and compliance reporting.',
  evidenceQuotes: [
    'Turn 6: "We currently handle disbursements across three currencies and need sub-wallets for each client project."',
    'Turn 14: "What is your automated reconciliation frequency with our primary banking feed?"',
    'Turn 23: "Send over the compliance and security certifications before our board review on Thursday."'
  ],
  unsupportedClaims: [
    'Board approval is pending review on Thursday; deal is active evaluation, not signed.'
  ],
  actionItems: [
    { text: 'Send SOC2 compliance certification and sub-wallet architecture guide to Willowfield Trust.', owner: 'Team member A' },
    { text: 'Confirm board presentation date and offer pre-meeting technical briefing.', owner: 'Team member A' }
  ],
  coachingNotes: 'Well handled discovery on multi-currency disbursement requirements.'
};
