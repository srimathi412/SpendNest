import React from 'react';
import { ProcessedRecord, RouteCategory, ReviewStatus } from '../types/data';
import { ConversationTable } from '../components/ConversationTable';
import { Inbox, Layers } from 'lucide-react';

interface InboxViewProps {
  records: ProcessedRecord[];
  onSelectRecord: (record: ProcessedRecord) => void;
  selectedRecordId?: string | null;
  initialFilterRoute?: RouteCategory | 'ALL';
  initialFilterStatus?: ReviewStatus | 'ALL';
}

export const InboxView: React.FC<InboxViewProps> = ({
  records,
  onSelectRecord,
  selectedRecordId,
  initialFilterRoute = 'ALL',
  initialFilterStatus = 'ALL'
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Conversation Inbox</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-semibold">
              {records.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect incoming phone calls and video meetings. Click any row to view transcript evidence and manual routing controls.
          </p>
        </div>
      </div>

      {/* Main Conversation Table */}
      <ConversationTable
        records={records}
        onSelectRecord={onSelectRecord}
        selectedRecordId={selectedRecordId}
        initialFilterRoute={initialFilterRoute}
        initialFilterStatus={initialFilterStatus}
      />
    </div>
  );
};
