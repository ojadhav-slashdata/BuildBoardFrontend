import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../axiosConfig';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

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
  if (!data) return <p className="text-center text-gray-500 py-12">Could not load analytics.</p>;

  const metricCards = [
    { label: 'Total Ideas', value: data.totalIdeas ?? 0, color: 'text-blue-600' },
    { label: 'Completed', value: data.completed ?? 0, color: 'text-green-600' },
    { label: 'On-Time %', value: `${data.onTimePercent ?? 0}%`, color: 'text-indigo-600' },
    { label: 'Active Builders', value: data.activeBuilders ?? 0, color: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metricCards.map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Ideas by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.ideasByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Innovation Hours This Month</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.hoursThisMonth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Delivery Health & Ratios */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Avg Hours by Size Tier</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.avgHoursBySize || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="hours" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Delivery & Project Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">POC vs Full Product</p>
              <p className="text-lg font-bold text-indigo-600">{data.pocCount ?? 0} / {data.fullProductCount ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Team vs Solo</p>
              <p className="text-lg font-bold text-purple-600">{data.teamBids ?? 0} / {data.soloBids ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Early Deliveries</p>
              <p className="text-lg font-bold text-green-600">{data.earlyDeliveries ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Late Deliveries</p>
              <p className="text-lg font-bold text-red-600">{data.lateDeliveries ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold mb-4">Leaderboard</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 w-12">#</th>
              <th className="pb-2">Name</th>
              <th className="pb-2 text-right">Points</th>
              <th className="pb-2 w-48">Progress</th>
            </tr>
          </thead>
          <tbody>
            {(data.leaderboard || []).map((entry, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3 font-medium text-gray-600">{i + 1}</td>
                <td className="py-3 text-gray-800">{entry.name}</td>
                <td className="py-3 text-right font-semibold text-indigo-600">{entry.points}</td>
                <td className="py-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (entry.points / 2000) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Milestone Ready — Admin Only */}
      {user?.role === 'Admin' && (() => {
        const milestoneReady = (data.leaderboard || []).filter((e) => e.points >= 2000);
        if (milestoneReady.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-5 mt-8">
            <h3 className="font-semibold mb-3 text-amber-800">Milestone Ready — HR Notification</h3>
            <p className="text-sm text-amber-700 mb-3">These employees have reached 2000+ points and are eligible for rewards.</p>
            <div className="space-y-2">
              {milestoneReady.map((entry, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-amber-100">
                  <span className="font-medium text-gray-800">{entry.name}</span>
                  <span className="font-semibold text-indigo-600">{entry.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
