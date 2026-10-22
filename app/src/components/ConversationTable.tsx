import React, { useState, useMemo } from 'react';
import {
  ProcessedRecord,
  RouteCategory,
  ReviewStatus,
  SourceType
} from '../types/data';
import {
  PhoneCall,
  Video,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Mail,
  Edit3,
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { formatKolkataTimeOnly, formatDuration } from '../utils/formatters';
import { filterConversations } from '../utils/searchFilter';

interface ConversationTableProps {
  records: ProcessedRecord[];
  onSelectRecord: (record: ProcessedRecord) => void;
  selectedRecordId?: string | null;
  initialFilterRoute?: RouteCategory | 'ALL';
  initialFilterStatus?: ReviewStatus | 'ALL';
}

export const ConversationTable: React.FC<ConversationTableProps> = ({
  records,
  onSelectRecord,
  selectedRecordId,
  initialFilterRoute = 'ALL',
  initialFilterStatus = 'ALL'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType | 'ALL'>('ALL');
  const [selectedRoute, setSelectedRoute] = useState<RouteCategory | 'ALL'>(initialFilterRoute);
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | 'ALL'>(initialFilterStatus);
  const [selectedPerson, setSelectedPerson] = useState<string>('ALL');
  const [transcriptFilter, setTranscriptFilter] = useState<'ALL' | 'USABLE' | 'MISSING'>('ALL');

  // Extract distinct call reps and meeting organizers
  const { callReps, meetingOrganizers } = useMemo(() => {
    const reps = new Set<string>();
    const organizers = new Set<string>();

    records.forEach(r => {
      if (r.source_type === 'call') {
        reps.add(r.person_label);
      } else {
        organizers.add(r.person_label);
      }
    });

    return {
      callReps: Array.from(reps).sort(),
      meetingOrganizers: Array.from(organizers).sort()
    };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return filterConversations(records, {
      searchQuery,
      sourceType: selectedSourceType,
      route: selectedRoute,
      reviewStatus: selectedStatus,
      person: selectedPerson,
      transcriptFilter
    });
  }, [
    records,
    searchQuery,
    selectedSourceType,
    selectedRoute,
    selectedStatus,
    selectedPerson,
    transcriptFilter
  ]);

  // Route badge colors
  const getRouteBadge = (route: RouteCategory, isManual: boolean) => {
    let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

    switch (route) {
      case 'Sales Coaching':
        colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
        break;
      case 'Deal Next Steps':
        colorClasses = 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50';
        break;
      case 'Customer Success / Support':
        colorClasses = 'bg-rose-950/60 text-rose-300 border-rose-800/50';
        break;
      case 'Partnership Referral':
        colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
        break;
      case 'Internal / Operations':
        colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-800/50';
        break;
      case 'Triage / Unqualified':
        colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
        break;
      case 'Missing Audio / Exception':
        colorClasses = 'bg-slate-900 text-slate-500 border-slate-800';
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${colorClasses}`}>
        {isManual && (
          <span title="Manual manager override active">
            <Edit3 className="w-3 h-3 text-sky-400" />
          </span>
        )}
        <span>{route}</span>
      </span>
    );
  };

  // Review status badge
  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'Action Required':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950 text-rose-400 border border-rose-800/50">
            <AlertCircle className="w-3 h-3" /> Action Required
          </span>
        );
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" /> Reviewed
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950 text-sky-400 border border-sky-800/50">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case 'Stale / Needs Re-check':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800/50">
            <AlertCircle className="w-3 h-3" /> Stale (Updated)
          </span>
        );
      case 'Intake Logged':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Intake Logged
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Filter Toolbar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        {/* Top search & quick counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, ref (e.g. M09, C04), person, or transcript keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing <strong className="text-white">{filteredRecords.length}</strong> of <strong className="text-white">{records.length}</strong> records</span>
            {(searchQuery || selectedSourceType !== 'ALL' || selectedRoute !== 'ALL' || selectedStatus !== 'ALL' || selectedPerson !== 'ALL' || transcriptFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSourceType('ALL');
                  setSelectedRoute('ALL');
                  setSelectedStatus('ALL');
                  setSelectedPerson('ALL');
                  setTranscriptFilter('ALL');
                }}
                className="text-sky-400 hover:text-sky-300 font-medium underline ml-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          {/* 1. Source Type */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
              Source Type
            </label>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Types (44)</option>
              <option value="call">Calls Only (30)</option>
              <option value="meeting">Meetings Only (14)</option>
            </select>
          </div>

          {/* 2. Route Category */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
              Assigned Route
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Routes</option>
              <option value="Sales Coaching">Sales Coaching</option>
              <option value="Deal Next Steps">Deal Next Steps</option>
              <option value="Customer Success / Support">Customer Success / Support</option>
              <option value="Partnership Referral">Partnership Referral</option>
              <option value="Internal / Operations">Internal / Operations</option>
              <option value="Triage / Unqualified">Triage / Unqualified</option>
              <option value="Missing Audio / Exception">Missing Audio / Exception</option>
            </select>
          </div>

          {/* 3. Person (Distinguishing Reps vs Organizers!) */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
              Rep or Organizer
            </label>
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All People</option>
              <optgroup label="📞 Call Representatives">
                {callReps.map(rep => (
                  <option key={rep} value={rep}>{rep} (Rep)</option>
                ))}
              </optgroup>
              <optgroup label="📅 Meeting Organizers">
                {meetingOrganizers.map(org => (
                  <option key={org} value={org}>{org} (Organizer)</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. Transcript Availability */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
              Transcript
            </label>
            <select
              value={transcriptFilter}
              onChange={(e) => setTranscriptFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Status</option>
              <option value="USABLE">Usable Text Present</option>
              <option value="MISSING">Missing / Withheld</option>
            </select>
          </div>

          {/* 5. Review Status */}
          <div>
            <label className="block text-[11px] uppercase font-semibold text-slate-400 mb-1">
              Review Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All States</option>
              <option value="Action Required">Action Required</option>
              <option value="Reviewed">Reviewed</option>
              <option value="In Review">In Review</option>
              <option value="Stale / Needs Re-check">Stale / Needs Re-check</option>
              <option value="Intake Logged">Intake Logged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
              <th className="py-3 px-4">Ref / ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Person (Rep vs Organizer)</th>
              <th className="py-3 px-4">Time (IST)</th>
              <th className="py-3 px-4">Transcript Evidence</th>
              <th className="py-3 px-4">Assigned Route</th>
              <th className="py-3 px-4">Review State</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-400">No records match the selected filters.</p>
                  <p className="text-xs text-slate-500 mt-1">Try clearing some filter criteria or search keywords.</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isSelected = selectedRecordId === record.identityKey;
                const titleOrRef = record.source_type === 'meeting'
                  ? (record.raw_record.payload?.title || record.record_ref)
                  : `${record.record_ref} - Call with ${record.raw_record.payload?.to_number || 'Prospect'}`;

                return (
                  <tr
                    key={record.identityKey}
                    onClick={() => onSelectRecord(record)}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-sky-950/30 border-l-2 border-sky-400' : ''
                    }`}
                  >
                    {/* 1. Ref & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {record.record_ref}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px] truncate max-w-[90px]" title={record.source_id}>
                          {record.source_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium truncate max-w-[200px] mt-0.5" title={titleOrRef}>
                        {titleOrRef}
                      </div>
                    </td>

                    {/* 2. Source Type */}
                    <td className="py-3 px-4">
                      {record.source_type === 'call' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950 text-sky-400 border border-sky-800/40">
                          <PhoneCall className="w-3 h-3" /> Call
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                          <Video className="w-3 h-3" /> Meeting
                        </span>
                      )}
                    </td>

                    {/* 3. Person (Differentiating Call Rep vs Meeting Organizer) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {record.person_role_type === 'Call Rep' ? (
                          <User className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-200">
                          {record.person_label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {record.person_role_type === 'Call Rep' ? 'Sales Rep' : 'Calendar Organizer'}
                      </div>
                    </td>

                    {/* 4. Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {formatKolkataTimeOnly(record.activity_timestamp)}
                    </td>

                    {/* 5. Transcript Evidence */}
                    <td className="py-3 px-4">
                      {record.has_usable_transcript ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {record.source_type === 'meeting'
                              ? `${record.turns_count} turns`
                              : formatDuration(record.raw_record.payload?.duration_seconds)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                          <span className="truncate max-w-[130px]" title={record.unavailable_reason || 'Withheld'}>
                            {record.record_ref === 'M07' && record.applied_revision === 1
                              ? 'Withheld (Pending Rev 2)'
                              : (record.unavailable_reason || 'No audio')}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 6. Route */}
                    <td className="py-3 px-4">
                      {getRouteBadge(record.effective_route, record.is_manually_overridden)}
                    </td>

                    {/* 7. Review Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(record.review_status)}
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(record);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 font-medium text-xs transition-colors border border-slate-700"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
