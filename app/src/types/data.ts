export type SourceType = 'call' | 'meeting';

export type RouteCategory =
  | 'Sales Coaching'
  | 'Deal Next Steps'
  | 'Customer Success / Support'
  | 'Partnership Referral'
  | 'Internal / Operations'
  | 'Triage / Unqualified'
  | 'Missing Audio / Exception';

export type ReviewStatus =
  | 'Action Required'
  | 'In Review'
  | 'Reviewed'
  | 'Stale / Needs Re-check'
  | 'Intake Logged';

export interface CallPayload {
  id: string;
  external_call_id: string;
  workspace_slug: string;
  rep_email: string | null;
  rep_name: string | null;
  rep_user_id: string | null;
  direction: string;
  direction_raw: string;
  from_number: string | null;
  to_number: string | null;
  started_at: string;
  duration_seconds: number;
  talk_time_seconds: number | null;
  speaker_count: number | null;
  segment_count: number | null;
  is_connected: boolean | null;
  is_conversation: boolean | null;
  observed_outcome: string | null;
  classification_reason: null;
  classification_status: string | null;
  is_campaign_call: boolean | null;
  first_dial_ever: boolean | null;
  first_connect_ever: boolean | null;
  prior_dials_ever: number | null;
  prior_connects_ever: number | null;
  summary: null;
  summary_status: string | null;
  transcript: string | null;
}

export interface MeetingTurn {
  speaker: string;
  starts_at_seconds: number;
  timecode: string;
  text: string;
}

export interface MeetingTranscriptPayload {
  meeting_id: string;
  turns: MeetingTurn[];
  unavailable_reason: string | null;
}

export interface MeetingPayload {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  duration_seconds: number;
  provider: string;
  join_url: string;
  organizer_email: string | null;
  attendee_count: number | null;
  recording_status: string;
  recording_detail: string | null;
  recording_id: string | null;
  has_transcript: boolean;
  has_video: boolean;
  summary: null;
  summary_status: string | null;
  redacted: boolean;
}

export interface SourceRecordRaw {
  record_ref: string;
  source_type: SourceType;
  source_id: string;
  payload: CallPayload | MeetingPayload | any;
  transcript_payload: MeetingTranscriptPayload | null;
}

export interface DeliveryEnvelope {
  batch_id: string;
  revision: number;
  exported_at: string;
  records: SourceRecordRaw[];
}

export interface AnalysisRecord {
  suggestedRoute: RouteCategory;
  rationale: string;
  evidenceQuotes: string[];
  unsupportedClaims: string[];
  actionItems: { text: string; owner: string }[];
  coachingNotes?: string;
  freshness: 'current' | 'stale' | 'not_applicable';
}

export interface ProcessedRecord {
  // Composite identity
  identityKey: string; // `${source_type}:${source_id}`
  source_type: SourceType;
  source_id: string;
  record_ref: string;
  applied_revision: number;
  
  // Temporal & Person
  activity_timestamp: string; // started_at for call, starts_at for meeting
  person_label: string; // Call rep name OR Meeting organizer email (clearly differentiated)
  person_role_type: 'Call Rep' | 'Meeting Organizer';
  
  // Usable text
  has_usable_transcript: boolean;
  transcript_text: string | null;
  turns_count: number;
  unavailable_reason: string | null;
  
  // Routing & Review
  suggested_route: RouteCategory;
  manual_route: RouteCategory | null;
  effective_route: RouteCategory;
  is_manually_overridden: boolean;
  manual_override_timestamp?: string;
  manual_notes?: string;
  review_status: ReviewStatus;
  
  // Differentiated Analysis
  analysis: AnalysisRecord;
  
  // Raw payload for inspection
  raw_record: SourceRecordRaw;
}

export interface DashboardMetrics {
  totalUniqueRecords: number; // 44
  totalCalls: number; // 30
  totalMeetings: number; // 14
  
  // Transcript coverage with denominator
  usableTranscriptCount: number; // 17 initially, 18 post-update
  usableTranscriptDenominator: number; // 44
  usableTranscriptPercentage: number;
  
  // Source-reported connection rate
  sourceReportedConnectedCount: number; // 11
  sourceReportedConnectedDenominator: number; // 30
  sourceReportedUnknownCount: number; // 0
  sourceReportedConnectionRate: number;
  
  // Route breakdown
  routeCounts: Record<RouteCategory, number>;
  
  // Review status breakdown
  reviewCounts: Record<ReviewStatus, number>;
  
  // Distinct people counts
  uniqueCallReps: number;
  uniqueMeetingOrganizers: number;
}
