import { useState, useEffect } from 'react';
import api from '../axiosConfig';

const categories = ['All', 'Gift cards', 'Staycations', 'Meals', 'Swag', 'Learning', 'Experience'];

export default function Marketplace() {
  const [rewards, setRewards] = useState({});
  const [balance, setBalance] = useState(null);
  const [category, setCategory] = useState('All');
  const [redeemModal, setRedeemModal] = useState(null);
  const [platform, setPlatform] = useState('');
  const [email, setEmail] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get('/rewards').then(r => setRewards(r.data.byTier || {})).catch(() => {});
    api.get('/rewards/balance').then(r => { setBalance(r.data); setEmail(r.data?.email || ''); }).catch(() => {});
  }, []);

  // Flatten all tiers into a single list, optionally filtered by category
  const allRewards = Object.values(rewards).flat();
  const filtered = category === 'All' ? allRewards : allRewards.filter(r => r.category === category);

  // Pick the most expensive reward as the featured one
  const featured = allRewards.length > 0
    ? allRewards.reduce((a, b) => b.points_cost > a.points_cost ? b : a, allRewards[0])
    : null;
  const gridRewards = filtered.filter(r => r.id !== featured?.id);

  const redeemable = balance?.redeemable || 0;

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const res = await api.post('/rewards/redeem', {
        rewardId: redeemModal.id, platform, email
      });
      setSuccess(res.data);
      setRedeemModal(null);
      const b = await api.get('/rewards/balance');
      setBalance(b.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to redeem');
    }
    setRedeeming(false);
  };

  const setGoal = async (rewardId) => {
    try {
      await api.post('/rewards/goal', { rewardId });
      const b = await api.get('/rewards/balance');
      setBalance(b.data);
    } catch { alert('Failed to set goal'); }
  };

  const canRedeem = (reward) => redeemable >= reward.points_cost;
  const isGoal = (reward) => balance?.activeGoal?.reward?.id === reward.id;

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ── */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">Rewards Marketplace</h1>
          <p className="text-on-surface-variant text-base max-w-xl font-medium opacity-80">
            Transform your impact into meaningful experiences and exclusive perks.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Lifetime Earned */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 flex flex-col items-start gap-0.5 min-w-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">Lifetime Earned</span>
            <span className="text-2xl font-black text-on-surface tracking-tight">{(balance?.lifetimeEarned || 0).toLocaleString()}</span>
          </div>
          {/* Available Balance */}
          <div className="bg-primary/5 border border-primary/15 p-5 rounded-2xl flex flex-col items-start gap-0.5 min-w-[140px]">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">Available Balance</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary tracking-tight">{redeemable.toLocaleString()}</span>
              <span className="text-on-surface-variant font-bold text-[10px] bg-surface-container px-1.5 py-0.5 rounded-md">PTS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Expiry Warning ── */}
      {balance?.expiringSoon > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <p className="text-sm text-amber-800">
            <strong>{balance.expiringSoon} pts</strong> expiring within 90 days. Use or save toward a reward before then.
          </p>
        </div>
      )}

      {/* ── Active Goal ── */}
      {balance?.activeGoal && (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{balance.activeGoal.reward?.icon || '🎯'}</span>
              <div>
                <p className="font-bold text-on-surface">Saving toward: {balance.activeGoal.reward?.title}</p>
                <p className="text-xs text-on-surface-variant">Tier {balance.activeGoal.reward?.tier} reward</p>
              </div>
            </div>
            <span className="text-sm font-medium text-primary">{balance.activeGoal.remaining} pts to go</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2.5 mb-2">
            <div
              className="bg-primary h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (balance.activeGoal.currentPoints / balance.activeGoal.targetPoints) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>{balance.activeGoal.currentPoints} / {balance.activeGoal.targetPoints} pts</span>
            <span>{Math.round((balance.activeGoal.currentPoints / balance.activeGoal.targetPoints) * 100)}% there</span>
          </div>
        </div>
      )}

      {/* ── Category Filters ── */}
      <div className="mb-8 overflow-x-auto no-scrollbar -mx-2 px-2">
        <div className="flex items-center gap-3 pb-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                category === c
                  ? 'bg-on-surface text-surface shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Reward ── */}
      {featured && category === 'All' && (
        <div className="mb-10 bg-primary/5 rounded-2xl overflow-hidden flex flex-col md:flex-row group border border-primary/10 hover:border-primary/20 transition-colors">
          <div className="md:w-1/2 h-56 md:h-72 bg-gradient-to-br from-primary/10 to-primary-container/20 flex items-center justify-center overflow-hidden">
            <img
              src="https://www.apple.com/v/macbook-air/y/images/meta/macbook_air_mx__ez5y0k5yy7au_og.png?202603021334"
              alt="Featured reward"
              className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="md:w-1/2 flex flex-col justify-center p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-widest">Featured Reward</span>
            </div>
            <h3 className="text-2xl font-extrabold text-on-surface mb-2 tracking-tight">{featured.title}</h3>
            <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">{featured.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-black text-on-surface">
                {featured.points_cost.toLocaleString()} <span className="text-sm font-bold opacity-60">pts</span>
              </div>
              {canRedeem(featured) ? (
                <button
                  onClick={() => setRedeemModal(featured)}
                  className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:shadow-xl hover:shadow-primary/20 transition-all"
                >
                  Redeem Now
                </button>
              ) : (
                <button
                  onClick={() => setGoal(featured.id)}
                  className={`px-8 py-2.5 font-bold rounded-xl transition-all ${
                    isGoal(featured)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary'
                  }`}
                >
                  {isGoal(featured) ? 'Saving' : 'Set as Goal'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rewards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gridRewards.map(reward => (
          <div
            key={reward.id}
            className="bg-surface-container-lowest p-7 rounded-2xl flex flex-col group hover:shadow-2xl hover:shadow-primary/5 transition-all border border-outline-variant/5"
          >
            <div className="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center mb-5 text-3xl group-hover:bg-primary-container/40 transition-colors">
              {reward.icon}
            </div>
            <h4 className="text-lg font-extrabold text-on-surface mb-1.5 tracking-tight">{reward.title}</h4>
            <p className="text-sm text-on-surface-variant mb-6 font-medium leading-snug flex-1">{reward.description}</p>
            <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 pt-5">
              <span className="text-lg font-black text-primary">
                {reward.points_cost.toLocaleString()} <span className="text-xs font-bold opacity-60 uppercase">pts</span>
              </span>
              <div className="flex gap-2">
                {!isGoal(reward) && (
                  <button
                    onClick={() => setGoal(reward.id)}
                    className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-colors"
                    title="Set as savings goal"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>flag</span>
                  </button>
                )}
                {isGoal(reward) ? (
                  <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl">
                    Saving
                  </span>
                ) : canRedeem(reward) ? (
                  <button
                    onClick={() => setRedeemModal(reward)}
                    className="px-4 py-2 bg-on-surface text-surface text-sm font-bold rounded-xl hover:bg-on-surface-variant transition-colors"
                  >
                    Redeem
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-surface-container-high text-on-surface-variant/50 text-sm font-medium rounded-xl cursor-not-allowed"
                  >
                    {reward.points_cost - redeemable > 0 ? `Need ${(reward.points_cost - redeemable).toLocaleString()} more` : 'Redeem'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">redeem</span>
          <p className="text-on-surface-variant font-medium">No rewards in this category yet.</p>
        </div>
      )}

      {/* ── Redeem Modal ── */}
      {redeemModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setRedeemModal(null)}
        >
          <div
            className="bg-surface-bright rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-on-surface mb-2">Confirm redemption</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Instant — no approval needed. HR notified automatically.
            </p>

            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">{redeemModal.icon}</span>
              <div>
                <p className="font-bold text-on-surface">{redeemModal.title}</p>
                <p className="text-xs text-on-surface-variant">{redeemModal.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Cost</p>
                <p className="text-lg font-bold text-error">-{redeemModal.points_cost.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Available</p>
                <p className="text-lg font-bold text-on-surface">{redeemable.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">After</p>
                <p className="text-lg font-bold text-emerald-600">{(redeemable - redeemModal.points_cost).toLocaleString()}</p>
              </div>
            </div>

            {redeemModal.category === 'Learning' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-on-surface-variant mb-2">Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select platform</option>
                  <option>Coursera</option>
                  <option>Udemy</option>
                  <option>LinkedIn Learning</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">Email for voucher</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
              <p className="text-xs text-emerald-700">HR notified automatically. Voucher delivered within 24 hours.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="btn-primary flex-1 py-3 text-sm disabled:opacity-50"
              >
                {redeeming ? 'Redeeming...' : `Redeem now — ${redeemModal.points_cost.toLocaleString()} pts`}
              </button>
              <button
                onClick={() => setRedeemModal(null)}
                className="px-4 py-3 rounded-2xl border border-outline-variant/30 text-sm text-on-surface-variant hover:bg-surface-container-low transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Toast ── */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-2xl p-4 shadow-xl z-50 flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <p className="font-medium">{success.message}</p>
            <p className="text-sm text-emerald-100">Points remaining: {success.pointsAfter}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-3 text-emerald-200 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
