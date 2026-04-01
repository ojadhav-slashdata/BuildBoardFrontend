import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const statusColor = {
  Pending: 'bg-amber-100 text-amber-800',
  Won: 'bg-green-100 text-green-800',
  Active: 'bg-green-100 text-green-800',
  'Not Selected': 'bg-red-100 text-red-700',
};

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bids/mine')
      .then(({ data }) => setBids(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (bids.length === 0) return <EmptyState message="You haven't placed any bids yet." icon="🎯" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bids</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {bids.map((bid) => (
          <div key={bid._id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-gray-800">{bid.ideaTitle || bid.idea?.title || 'Idea'}</p>
              <p className="text-xs text-gray-500 mt-1">
                Committed: {new Date(bid.committedDeliveryDate).toLocaleDateString()} &middot;{' '}
                {bid.mode === 'team' ? 'Team' : 'Solo'}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor[bid.status] || 'bg-gray-100 text-gray-700'}`}>
              {bid.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
