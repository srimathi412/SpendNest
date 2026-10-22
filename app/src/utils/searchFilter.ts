import {
  ProcessedRecord,
  RouteCategory,
  ReviewStatus,
  SourceType
} from '../types/data';

export interface FilterOptions {
  searchQuery?: string;
  sourceType?: SourceType | 'ALL';
  route?: RouteCategory | 'ALL';
  reviewStatus?: ReviewStatus | 'ALL';
  person?: string;
  transcriptFilter?: 'ALL' | 'USABLE' | 'MISSING';
}

/**
 * Filters a list of ProcessedRecords based on search query and metadata filters.
 *
 * Search rules:
 * 1. Exact ID Search:
 *    If the query exactly matches a record reference (e.g. "M09", "C01")
 *    or matches an exact source_id in the dataset, ONLY records with that exact
 *    record_ref or source_id are matched.
 *
 * 2. General Text Search:
 *    If the query is not an exact ID, partial substring matching is performed across:
 *    - Account names & meeting titles (e.g. "Cedarwave", "Willowfield")
 *    - Record references and source IDs
 *    - Person labels, roles, and emails (e.g. "team09@example.com")
 *    - Call phone numbers and rep names
 *    - Route names
 *    - Transcript content
 *    - Grounded analysis summaries, rationales, and coaching notes
 *
 * 3. Multi-Filter Combination:
 *    Search operates cleanly alongside source-type, route, review-status, person,
 *    and transcript availability filters.
 */
export function filterConversations(
  records: ProcessedRecord[],
  options: FilterOptions
): ProcessedRecord[] {
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

    // Check if query is an exact record reference pattern (e.g. "M09", "C01")
    const isRecordRefPattern = /^[cm]\d{2}$/i.test(normalizedQuery);

    // Check if query matches any record's exact record_ref or source_id
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

        // Call specific payload fields
        const matchesToNumber = (record.raw_record.payload?.to_number || '').toLowerCase().includes(query);
        const matchesFromNumber = (record.raw_record.payload?.from_number || '').toLowerCase().includes(query);
        const matchesRepName = (record.raw_record.payload?.rep_name || '').toLowerCase().includes(query);
        const matchesRepEmail = (record.raw_record.payload?.rep_email || '').toLowerCase().includes(query);
        const matchesOrgEmail = (record.raw_record.payload?.organizer_email || '').toLowerCase().includes(query);

        // Grounded analysis fields
        const matchesAnalysisRationale = (record.analysis?.rationale || '').toLowerCase().includes(query);
        const matchesAnalysisNotes = (record.analysis?.coachingNotes || '').toLowerCase().includes(query);

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
          matchesOrgEmail ||
          matchesAnalysisRationale ||
          matchesAnalysisNotes;

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
