const config = {
  Draft:           { cls: 'bg-surface-container-high text-on-surface-variant' },
  PendingApproval: { cls: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
  BiddingOpen:     { cls: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' },
  BiddingClosed:   { cls: 'bg-surface-container-high text-on-surface-variant' },
  Assigned:        { cls: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' },
  InProgress:      { cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
  Completed:       { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  Archived:        { cls: 'bg-surface-container-high text-on-surface-variant/60' },
  Rejected:        { cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
  Pending:         { cls: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' },
  Won:             { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  Active:          { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' },
  'Not Selected':  { cls: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
};

const labels = {
  BiddingOpen: 'Open for Bidding',
  InProgress: 'In Progress',
  PendingApproval: 'Pending Review',
  BiddingClosed: 'Bidding Closed',
  'Not Selected': 'Not Selected',
};

const fallback = { cls: 'bg-surface-container-high text-on-surface-variant' };

export default function StatusBadge({ status }) {
  const c = config[status] || fallback;
  const label = labels[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.cls}`}>
      {label}
    </span>
  );
}
