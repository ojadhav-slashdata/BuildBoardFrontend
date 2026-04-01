import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!profile) return <p className="text-center text-gray-500 py-12">Could not load profile.</p>;

  const milestone = 2000;
  const pts = profile.totalPoints || 0;
  const pct = Math.min(100, Math.round((pts / milestone) * 100));

  const metricCards = [
    { label: 'Total Points', value: pts, color: 'text-indigo-600' },
    { label: 'Ideas Built', value: profile.ideasBuilt ?? 0, color: 'text-blue-600' },
    { label: 'On-Time %', value: `${profile.onTimePercent ?? 0}%`, color: 'text-green-600' },
    { label: 'Avg Rating', value: profile.avgRating?.toFixed(1) ?? '—', color: 'text-amber-600' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Avatar + Name */}
      <div className="flex items-center gap-5 mb-8">
        <img src={profile.pictureUrl} alt={profile.name} className="h-20 w-20 rounded-full" referrerPolicy="no-referrer" />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.role}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metricCards.map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Milestone */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Milestone Progress</span>
          <span className="text-gray-500">{pts} / {milestone} ({pct}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
