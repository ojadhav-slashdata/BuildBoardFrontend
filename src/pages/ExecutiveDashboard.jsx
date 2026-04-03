import { useEffect, useState } from 'react';
import api from '../axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function HorizontalBar({ label, value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-on-surface-variant w-32 shrink-0 truncate font-medium">{label}</span>
      <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-on-surface w-8 text-right">{value}</span>
    </div>
  );
}

function SplitBar({ labelA, valueA, labelB, valueB, colorA = 'bg-primary', colorB = 'bg-secondary' }) {
  const total = valueA + valueB;
  const pctA = total > 0 ? Math.round((valueA / total) * 100) : 50;
  const pctB = 100 - pctA;
  return (
    <div className="space-y-3">
      <div className="flex rounded-xl overflow-hidden h-4">
        <div className={`${colorA} transition-all duration-700`} style={{ width: `${pctA}%` }} />
        <div className={`${colorB} transition-all duration-700`} style={{ width: `${pctB}%` }} />
      </div>
      <div className="flex justify-between text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${colorA}`} />
          <span className="text-on-surface-variant">{labelA}</span>
          <span className="font-bold text-on-surface ml-1">{valueA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-on-surface mr-1">{valueB}</span>
          <span className="text-on-surface-variant">{labelB}</span>
          <span className={`w-2.5 h-2.5 rounded-full ${colorB}`} />
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient, iconColor }) {
  return (
    <div className={`surface-card-elevated p-6 flex flex-col gap-3 relative overflow-hidden`}>
      <div className={`absolute inset-0 opacity-[0.04] ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div className="p-2.5 rounded-2xl bg-surface-container-low">
          <span className={`material-symbols-outlined text-[22px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
      </div>
      <div className="relative">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-1">{label}</p>
        <p className="font-manrope font-extrabold text-3xl text-on-surface tracking-tight leading-none">{value}</p>
        {sub && <p className="text-xs text-on-surface-variant/70 mt-1.5 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function MetricPill({ icon, label, value, color }) {
  return (
    <div className="surface-card p-5 flex items-center gap-4">
      <div className="p-2 rounded-xl bg-surface-container-low">
        <span className={`material-symbols-outlined text-[20px] ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">{label}</p>
        <p className={`font-manrope font-extrabold text-xl ${color}`}>{value}</p>
      </div>
    </div>
  );
}

// Simple inline bar chart for monthly trend
function MonthlyTrendChart({ data }) {
  const maxSubmitted = Math.max(...data.map(d => d.submitted), 1);
  const maxCompleted = Math.max(...data.map(d => d.completed), 1);
  const globalMax = Math.max(maxSubmitted, maxCompleted, 1);

  return (
    <div className="space-y-4">
      {data.map((row) => (
        <div key={row.month} className="grid grid-cols-[48px_1fr] items-center gap-4">
          <span className="text-xs font-bold text-on-surface-variant text-center">{row.month}</span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-container-high rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                  style={{ width: `${Math.round((row.submitted / globalMax) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-primary w-6 text-right">{row.submitted}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface-container-high rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.round((row.completed / globalMax) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 w-6 text-right">{row.completed}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-5 pt-2 border-t border-outline-variant/20">
        <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
          <span className="w-3 h-1.5 rounded-full bg-primary inline-block" /> Submitted
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-medium">
          <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" /> Completed
        </span>
      </div>
    </div>
  );
}

const roleColors = {
  Admin: 'bg-error/10 text-error',
  Manager: 'bg-primary/10 text-primary',
  Employee: 'bg-secondary/10 text-secondary',
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/analytics/executive')
      .then(({ data }) => setData(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 block">error_outline</span>
        <p className="text-on-surface-variant font-medium">Could not load executive data.</p>
      </div>
    );
  }

  const { overview, monthlyTrend, byCategory, byStatus, bySize, byComplexity, byDepartment, topContributors } = data;
  const o = overview;

  const maxCat = Math.max(...(byCategory || []).map(c => c.value), 1);
  const maxStatus = Math.max(...(byStatus || []).map(s => s.value), 1);
  const maxSize = Math.max(...(bySize || []).map(s => s.value), 1);
  const maxComplexity = Math.max(...(byComplexity || []).map(c => c.value), 1);
  const maxDept = Math.max(...(byDepartment || []).map(d => d.points), 1);
  const maxPts = topContributors?.[0]?.points || 1;

  const statusColors = {
    Completed: 'bg-emerald-500',
    InProgress: 'bg-primary',
    BiddingOpen: 'bg-amber-500',
    PendingApproval: 'bg-orange-400',
    Rejected: 'bg-error',
  };

  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Executive View</span>
          </div>
          <h1 className="font-manrope font-extrabold text-3xl text-on-surface tracking-tight">Innovation Dashboard</h1>
          <p className="text-sm text-on-surface-variant/70 mt-1 font-medium">High-level program performance overview for leadership</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-container-low text-xs font-semibold text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── Hero Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="schedule"
          label="Innovation Hours"
          value={o.totalInnovationHours.toLocaleString()}
          sub="Total hours invested"
          gradient="bg-gradient-to-br from-primary to-primary-container"
          iconColor="text-primary"
        />
        <StatCard
          icon="verified"
          label="Ideas Shipped"
          value={o.completedIdeas}
          sub={`of ${o.totalIdeas} submitted`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-400"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon="groups"
          label="Participation Rate"
          value={`${o.participationRate}%`}
          sub={`${o.totalParticipants} of ${o.totalEmployees} employees`}
          gradient="bg-gradient-to-br from-secondary to-secondary-container"
          iconColor="text-secondary"
        />
        <StatCard
          icon="payments"
          label="Est. Business Value"
          value={fmt(o.estimatedBusinessValue)}
          sub={`${o.totalInnovationHours.toLocaleString()} hrs @ $50/hr`}
          gradient="bg-gradient-to-br from-amber-500 to-orange-400"
          iconColor="text-amber-600"
        />
      </div>

      {/* ── Performance Metrics Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricPill icon="timer" label="On-Time Delivery" value={`${o.onTimeDeliveryRate}%`} color="text-emerald-600" />
        <MetricPill icon="star" label="Avg. Rating" value={`${o.averageRating} / 5`} color="text-amber-500" />
        <MetricPill icon="workspace_premium" label="Points Awarded" value={o.totalPointsAwarded.toLocaleString()} color="text-primary" />
        <MetricPill icon="redeem" label="Points Redeemed" value={o.pointsRedeemed.toLocaleString()} color="text-secondary" />
      </div>

      {/* ── Monthly Trend + In-Progress ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="surface-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            <h3 className="font-semibold text-on-surface">Monthly Trend — Last 6 Months</h3>
          </div>
          <MonthlyTrendChart data={monthlyTrend || []} />
        </div>

        <div className="surface-card p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
            <h3 className="font-semibold text-on-surface">Pipeline Status</h3>
          </div>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-surface-container-low">
              <span className="text-sm font-medium text-on-surface-variant">In Progress</span>
              <span className="font-manrope font-extrabold text-xl text-primary">{o.inProgressIdeas}</span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-surface-container-low">
              <span className="text-sm font-medium text-on-surface-variant">Completed</span>
              <span className="font-manrope font-extrabold text-xl text-emerald-600">{o.completedIdeas}</span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-surface-container-low">
              <span className="text-sm font-medium text-on-surface-variant">POC Projects</span>
              <span className="font-manrope font-extrabold text-xl text-secondary">{o.pocCount}</span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-surface-container-low">
              <span className="text-sm font-medium text-on-surface-variant">Full Products</span>
              <span className="font-manrope font-extrabold text-xl text-amber-600">{o.fullProductCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Breakdown Sections 2-col ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Ideas by Category */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
            <h3 className="font-semibold text-on-surface">Ideas by Category</h3>
          </div>
          <div className="space-y-3">
            {(byCategory || []).map((c) => (
              <HorizontalBar key={c.name} label={c.name} value={c.value} max={maxCat} color="bg-primary" />
            ))}
          </div>
        </div>

        {/* Ideas by Status */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>stacked_bar_chart</span>
            <h3 className="font-semibold text-on-surface">Ideas by Status</h3>
          </div>
          <div className="space-y-3">
            {(byStatus || []).map((s) => (
              <HorizontalBar
                key={s.name}
                label={s.name}
                value={s.value}
                max={maxStatus}
                color={statusColors[s.name] || 'bg-secondary'}
              />
            ))}
          </div>
        </div>

        {/* POC vs Full Product */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
            <h3 className="font-semibold text-on-surface">POC vs Full Product</h3>
          </div>
          <SplitBar
            labelA="POC"
            valueA={o.pocCount}
            labelB="Full Product"
            valueB={o.fullProductCount}
            colorA="bg-amber-400"
            colorB="bg-primary"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-amber-50/60 rounded-2xl p-4 text-center border border-amber-100">
              <p className="text-2xl font-manrope font-extrabold text-amber-600">{o.pocCount}</p>
              <p className="text-xs text-amber-700/70 font-medium mt-0.5">POC Projects</p>
            </div>
            <div className="bg-primary/5 rounded-2xl p-4 text-center border border-primary/10">
              <p className="text-2xl font-manrope font-extrabold text-primary">{o.fullProductCount}</p>
              <p className="text-xs text-primary/60 font-medium mt-0.5">Full Products</p>
            </div>
          </div>
        </div>

        {/* Solo vs Team Bids */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group_work</span>
            <h3 className="font-semibold text-on-surface">Solo vs Team Bids</h3>
          </div>
          <SplitBar
            labelA="Solo"
            valueA={o.soloBids}
            labelB="Team"
            valueB={o.teamBids}
            colorA="bg-sky-400"
            colorB="bg-violet-400"
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-sky-50 rounded-2xl p-4 text-center border border-sky-100">
              <p className="text-2xl font-manrope font-extrabold text-sky-600">{o.soloBids}</p>
              <p className="text-xs text-sky-600/60 font-medium mt-0.5">Solo Bids</p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 text-center border border-violet-100">
              <p className="text-2xl font-manrope font-extrabold text-violet-600">{o.teamBids}</p>
              <p className="text-xs text-violet-600/60 font-medium mt-0.5">Team Bids</p>
            </div>
          </div>
        </div>

        {/* Size Distribution */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>straighten</span>
            <h3 className="font-semibold text-on-surface">Size Distribution</h3>
          </div>
          <div className="space-y-3">
            {(bySize || []).map((s) => (
              <HorizontalBar key={s.name} label={s.name} value={s.value} max={maxSize} color="bg-emerald-500" />
            ))}
          </div>
        </div>

        {/* Complexity Distribution */}
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-orange-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
            <h3 className="font-semibold text-on-surface">Complexity Distribution</h3>
          </div>
          <div className="space-y-3">
            {(byComplexity || []).map((c) => (
              <HorizontalBar key={c.name} label={c.name} value={c.value} max={maxComplexity} color="bg-orange-400" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Contributors Leaderboard ── */}
      <div className="surface-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-amber-500 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <h3 className="font-semibold text-on-surface text-lg">Top Contributors</h3>
          <span className="ml-auto text-xs text-on-surface-variant font-medium">Top 10 by points</span>
        </div>
        <div className="space-y-2">
          {(topContributors || []).map((person, i) => {
            const pct = Math.round((person.points / maxPts) * 100);
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
              >
                <span className="w-8 shrink-0 text-center font-manrope font-extrabold text-lg text-primary">
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </span>
                {person.avatar ? (
                  <img src={person.avatar} alt={person.name} className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{(person.name || '?')[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{person.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColors[person.role] || 'bg-surface-container text-on-surface-variant'}`}>
                    {person.role}
                  </span>
                </div>
                <div className="w-28 hidden sm:block">
                  <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-[64px]">
                  <p className="text-sm font-manrope font-extrabold text-primary">{person.points.toLocaleString()}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">pts</p>
                </div>
              </div>
            );
          })}
          {(!topContributors || topContributors.length === 0) && (
            <p className="text-sm text-on-surface-variant/60 text-center py-6">No contributor data yet.</p>
          )}
        </div>
      </div>

      {/* ── Department Innovation ── */}
      {byDepartment && byDepartment.length > 0 && (
        <div className="surface-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
            <h3 className="font-semibold text-on-surface">Department Innovation</h3>
            <span className="ml-auto text-xs text-on-surface-variant font-medium">Points by department</span>
          </div>
          <div className="space-y-3">
            {byDepartment.map((d) => (
              <HorizontalBar key={d.name} label={d.name} value={d.points} max={maxDept} color="bg-gradient-to-r from-primary to-secondary" />
            ))}
          </div>
        </div>
      )}

      {/* ── Business Impact Card ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-tonal-md">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-white/80 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Business Impact Summary</span>
            </div>
            <h2 className="font-manrope font-extrabold text-white text-2xl md:text-3xl leading-tight mb-2">
              {o.totalInnovationHours.toLocaleString()} innovation hours
              <span className="text-white/70"> at $50/hr</span>
            </h2>
            <p className="text-white/70 text-sm font-medium">
              Represents an estimated <strong className="text-white">{fmt(o.estimatedBusinessValue)}</strong> in business value generated
              by <strong className="text-white">{o.totalParticipants} contributors</strong> across the organization.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
              <p className="font-manrope font-extrabold text-white text-2xl">{o.completedIdeas}</p>
              <p className="text-white/60 text-[11px] font-semibold mt-1">Ideas Shipped</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
              <p className="font-manrope font-extrabold text-white text-2xl">{o.participationRate}%</p>
              <p className="text-white/60 text-[11px] font-semibold mt-1">Participation</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
              <p className="font-manrope font-extrabold text-white text-2xl">{o.onTimeDeliveryRate}%</p>
              <p className="text-white/60 text-[11px] font-semibold mt-1">On-Time Rate</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/20">
              <p className="font-manrope font-extrabold text-white text-2xl">{o.averageRating}</p>
              <p className="text-white/60 text-[11px] font-semibold mt-1">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
