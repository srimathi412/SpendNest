import { ProcessedRecord, DashboardMetrics, RouteCategory, ReviewStatus } from '../types/data';

export function calculateMetrics(records: ProcessedRecord[]): DashboardMetrics {
  const totalUniqueRecords = records.length;
  
  const calls = records.filter(r => r.source_type === 'call');
  const meetings = records.filter(r => r.source_type === 'meeting');
  
  const totalCalls = calls.length;
  const totalMeetings = meetings.length;
  
  // Usable transcript coverage
  const usableTranscripts = records.filter(r => r.has_usable_transcript);
  const usableTranscriptCount = usableTranscripts.length;
  const usableTranscriptDenominator = totalUniqueRecords;
  const usableTranscriptPercentage = totalUniqueRecords > 0
    ? (usableTranscriptCount / usableTranscriptDenominator) * 100
    : 0;

  // Source-reported connection rate
  // Only defined over calls where is_connected is non-null
  let connectedCount = 0;
  let nonNullConnectedCallsCount = 0;
  let unknownConnectedCount = 0;

  calls.forEach(c => {
    const isConn = c.raw_record.payload?.is_connected;
    if (isConn === true) {
      connectedCount++;
      nonNullConnectedCallsCount++;
    } else if (isConn === false) {
      nonNullConnectedCallsCount++;
    } else {
      unknownConnectedCount++;
    }
  });

  const sourceReportedConnectionRate = nonNullConnectedCallsCount > 0
    ? (connectedCount / nonNullConnectedCallsCount) * 100
    : 0;

  // Route breakdown
  const routeCounts: Record<RouteCategory, number> = {
    'Sales Coaching': 0,
    'Deal Next Steps': 0,
    'Customer Success / Support': 0,
    'Partnership Referral': 0,
    'Internal / Operations': 0,
    'Triage / Unqualified': 0,
    'Missing Audio / Exception': 0
  };

  records.forEach(r => {
    if (routeCounts[r.effective_route] !== undefined) {
      routeCounts[r.effective_route]++;
    } else {
      routeCounts[r.effective_route] = 1;
    }
  });

  // Review status breakdown
  const reviewCounts: Record<ReviewStatus, number> = {
    'Action Required': 0,
    'In Review': 0,
    'Reviewed': 0,
    'Stale / Needs Re-check': 0,
    'Intake Logged': 0
  };

  records.forEach(r => {
    if (reviewCounts[r.review_status] !== undefined) {
      reviewCounts[r.review_status]++;
    } else {
      reviewCounts[r.review_status] = 1;
    }
  });

  // Distinct people counts
  const reps = new Set<string>();
  const organizers = new Set<string>();

  calls.forEach(c => {
    const name = c.raw_record.payload?.rep_name;
    if (name) reps.add(name);
  });

  meetings.forEach(m => {
    const email = m.raw_record.payload?.organizer_email;
    if (email) organizers.add(email);
  });

  return {
    totalUniqueRecords,
    totalCalls,
    totalMeetings,
    usableTranscriptCount,
    usableTranscriptDenominator,
    usableTranscriptPercentage,
    sourceReportedConnectedCount: connectedCount,
    sourceReportedConnectedDenominator: nonNullConnectedCallsCount,
    sourceReportedUnknownCount: unknownConnectedCount,
    sourceReportedConnectionRate,
    routeCounts,
    reviewCounts,
    uniqueCallReps: reps.size,
    uniqueMeetingOrganizers: organizers.size
  };
}
