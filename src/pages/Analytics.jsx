import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../axiosConfig';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const medals = ['🥇', '🥈', '🥉'];

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-center text-on-surface-variant py-12">Could not load analytics.</p>;

  const metricCards = [
    { label: 'Total Ideas', value: data.totalIdeas ?? 0, color: 'text-primary', icon: 'lightbulb' },
    { label: 'Completed', value: data.completed ?? 0, color: 'text-emerald-600', icon: 'verified' },
    { label: 'On-Time %', value: `${data.onTimePercent ?? 0}%`, color: 'text-primary-container', icon: 'schedule' },
    { label: 'Active Builders', value: data.activeBuilders ?? 0, color: 'text-secondary', icon: 'group' },
  ];

  return (
    <div>
      <h1 className="section-heading text-2xl mb-8">Analytics</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {metricCards.map((m) => (
          <div key={m.label} className="surface-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <span className={`material-symbols-outlined ${m.color}`}>{m.icon}</span>
              </div>
            </div>
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-3xl font-bold font-manrope tracking-tight ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="surface-card p-6">
          <h3 className="font-semibold text-on-surface mb-5">Ideas by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.ideasByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f8" />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#464555' }} />
              <YAxis allowDecimals={false} tick={{ fill: '#464555' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(21,28,39,0.08)' }} />
              <Bar dataKey="count" fill="#3525cd" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="surface-card p-6">
          <h3 className="font-semibold text-on-surface mb-5">Innovation Hours This Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.hoursThisMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f8" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#464555' }} />
              <YAxis allowDecimals={false} tick={{ fill: '#464555' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(21,28,39,0.08)' }} />
              <Bar dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delivery Health */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="surface-card p-6">
          <h3 className="font-semibold text-on-surface mb-5">Avg Hours by Size Tier</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.avgHoursBySize || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f8" />
              <XAxis dataKey="size" tick={{ fontSize: 12, fill: '#464555' }} />
              <YAxis allowDecimals={false} tick={{ fill: '#464555' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(21,28,39,0.08)' }} />
              <Bar dataKey="hours" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="surface-card p-6">
          <h3 className="font-semibold text-on-surface mb-5">Delivery & Project Breakdown</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant/60 font-medium">POC / Full Product</p>
              <p className="text-xl font-bold text-primary mt-1">{data.pocCount ?? 0} / {data.fullProductCount ?? 0}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant/60 font-medium">Team / Solo</p>
              <p className="text-xl font-bold text-secondary mt-1">{data.teamBids ?? 0} / {data.soloBids ?? 0}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant/60 font-medium">Early Deliveries</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{data.earlyDeliveries ?? 0}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant/60 font-medium">Late Deliveries</p>
              <p className="text-xl font-bold text-error mt-1">{data.lateDeliveries ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="surface-card p-6">
        <h3 className="font-semibold text-on-surface mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          Leaderboard
        </h3>
        <div className="space-y-3">
          {(data.leaderboard || []).map((entry, i) => (
            <div key={i} className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-2xl hover:translate-x-0.5 transition-transform">
              <span className="w-8 text-center font-bold text-primary italic text-lg">{i < 3 ? medals[i] : i + 1}</span>
              <div className="flex-grow">
                <p className="text-sm font-bold text-on-surface">{entry.name}</p>
              </div>
              <div className="w-32">
                <div className="w-full bg-surface-container-high rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-primary to-primary-container h-1.5 rounded-full" style={{ width: `${Math.min(100, (entry.points / 2000) * 100)}%` }} />
                </div>
              </div>
              <div className="text-right min-w-[60px]">
                <p className="text-sm font-bold text-primary">{entry.points}</p>
                <p className="text-[10px] text-on-surface-variant">pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Ready — Admin Only */}
      {user?.role === 'Admin' && (() => {
        const milestoneReady = (data.leaderboard || []).filter((e) => e.points >= 2000);
        if (milestoneReady.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 rounded-2xl shadow-tonal p-6 mt-10">
            <h3 className="font-semibold mb-3 text-amber-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Milestone Ready — HR Notification
            </h3>
            <p className="text-sm text-amber-700 mb-4">These employees have reached 2000+ points and are eligible for rewards.</p>
            <div className="space-y-2">
              {milestoneReady.map((entry, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-4 py-3 shadow-tonal">
                  <span className="font-medium text-on-surface">{entry.name}</span>
                  <span className="font-bold text-primary">{entry.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
