const colors = {
  Draft: 'bg-gray-100 text-gray-700',
  PendingApproval: 'bg-yellow-100 text-yellow-800',
  BiddingOpen: 'bg-blue-100 text-blue-800',
  Assigned: 'bg-purple-100 text-purple-800',
  InProgress: 'bg-indigo-100 text-indigo-800',
  Completed: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-amber-100 text-amber-800',
  Won: 'bg-green-100 text-green-800',
  Active: 'bg-green-100 text-green-800',
  'Not Selected': 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  const cls = colors[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
