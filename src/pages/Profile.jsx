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
  if (!profile) return <p className="text-center text-on-surface-variant py-12">Could not load profile.</p>;

  const milestone = 2000;
  const pts = profile.totalPoints || 0;
  const pct = Math.min(100, Math.round((pts / milestone) * 100));

  const metricCards = [
    { label: 'Total Points', value: pts, color: 'text-primary', icon: 'stars' },
    { label: 'Ideas Built', value: profile.ideasBuilt ?? 0, color: 'text-blue-600', icon: 'rocket_launch' },
    { label: 'On-Time %', value: `${profile.onTimePercent ?? 0}%`, color: 'text-emerald-600', icon: 'schedule' },
    { label: 'Avg Rating', value: profile.avgRating?.toFixed(1) ?? '—', color: 'text-amber-600', icon: 'grade' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Avatar + Name */}
      <div className="flex items-center gap-6 mb-10">
        {profile.pictureUrl ? (
          <img src={profile.pictureUrl} alt={profile.name} className="h-24 w-24 rounded-2xl shadow-tonal-md" referrerPolicy="no-referrer" />
        ) : (
          <span className="h-24 w-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold shadow-tonal-md">{(profile.name || '?')[0]}</span>
        )}
        <div>
          <h1 className="section-heading text-3xl">{profile.name}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{profile.role}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metricCards.map((m) => (
          <div key={m.label} className="surface-card p-5 text-center">
            <div className="flex justify-center mb-2">
              <span className={`material-symbols-outlined ${m.color}`}>{m.icon}</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Milestone */}
      <div className="surface-card p-6 mb-8">
        <div className="flex justify-between text-sm mb-3">
          <span className="font-semibold text-on-surface">Milestone Progress</span>
          <span className="text-on-surface-variant">{pts} / {milestone} ({pct}%)</span>
        </div>
        <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-container h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Points History */}
      {profile.pointsHistory?.length > 0 && (
        <div className="surface-card overflow-hidden mb-8">
          <div className="px-6 py-4">
            <h3 className="font-semibold text-on-surface">Points History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-on-surface-variant/60 bg-surface-container-low">
                  <th className="px-6 py-3 font-medium">Idea</th>
                  <th className="px-6 py-3 font-medium text-right">Base</th>
                  <th className="px-6 py-3 font-medium text-right">Complexity</th>
                  <th className="px-6 py-3 font-medium text-right">Delivery</th>
                  <th className="px-6 py-3 font-medium text-right">Feedback</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {profile.pointsHistory.map((entry, i) => (
                  <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-3 text-on-surface font-medium">{entry.ideaTitle}</td>
                    <td className="px-6 py-3 text-right text-on-surface-variant">{entry.basePoints}</td>
                    <td className="px-6 py-3 text-right text-on-surface-variant">+{entry.complexityBonus}</td>
                    <td className="px-6 py-3 text-right text-on-surface-variant">&times;{entry.deliveryMultiplier}</td>
                    <td className="px-6 py-3 text-right text-on-surface-variant">+{entry.feedbackBonus}</td>
                    <td className="px-6 py-3 text-right font-bold text-primary">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div className="surface-card p-6">
          <h3 className="font-semibold text-on-surface mb-4">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((badge, i) => (
              <span key={i} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
