import { useState, useEffect } from 'react';
import api from '../axiosConfig';

const categories = ['All', 'Gift cards', 'Staycations', 'Meals', 'Swag', 'Learning', 'Experience'];
const tierLabels = {
  1: 'Tier 1 · Reachable after 1–2 small ideas',
  2: 'Tier 2 · Medium idea or 2–3 small ones',
  3: 'Tier 3 · Large idea or sustained contribution',
  4: 'Tier 4 · Aspirational · Save toward these'
};

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

  const filteredRewards = (tier) => {
    const items = rewards[tier] || [];
    if (category === 'All') return items;
    return items.filter(r => r.category === category);
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const res = await api.post('/rewards/redeem', {
        rewardId: redeemModal.id, platform, email
      });
      setSuccess(res.data);
      setRedeemModal(null);
      // Refresh balance
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

  const redeemable = balance?.redeemable || 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-heading text-4xl lg:text-5xl mb-4">Rewards marketplace</h1>
        <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
          Redeem your points or save toward a bigger reward. Your points are yours — no approvals needed.
        </p>
      </div>

      {/* Balance Hero */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="surface-card-elevated p-6 text-center">
          <p className="text-sm text-on-surface-variant mb-1">Lifetime earned</p>
          <p className="text-4xl font-bold text-primary">{balance?.lifetimeEarned || 0}</p>
          <p className="text-xs text-on-surface-variant/50 mt-1">Always visible to management</p>
        </div>
        <div className="surface-card-elevated p-6 text-center" style={{ background: 'linear-gradient(135deg, #E1F5EE, #f0faf6)' }}>
          <p className="text-sm text-on-surface-variant mb-1">Available to redeem</p>
          <p className="text-4xl font-bold text-emerald-600">{redeemable}</p>
          <p className="text-xs text-on-surface-variant/50 mt-1">Use within 12 months of earning</p>
        </div>
      </div>

      {/* Expiry Warning */}
      {balance?.expiringSoon > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <p className="text-sm text-amber-800">
            <strong>{balance.expiringSoon} pts</strong> expiring within 90 days. Use or save toward a reward before then.
          </p>
        </div>
      )}

      {/* Active Goal */}
      {balance?.activeGoal && (
        <div className="surface-card-elevated p-6 mb-8 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{balance.activeGoal.reward?.icon || '🎯'}</span>
              <div>
                <p className="font-bold text-on-surface">Saving toward: {balance.activeGoal.reward?.title}</p>
                <p className="text-xs text-on-surface-variant">Tier {balance.activeGoal.reward?.tier} reward</p>
              </div>
            </div>
            <span className="text-sm font-medium text-emerald-600">{balance.activeGoal.remaining} pts to go</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-3 mb-2">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, (balance.activeGoal.currentPoints / balance.activeGoal.targetPoints) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>{balance.activeGoal.currentPoints} / {balance.activeGoal.targetPoints} pts</span>
            <span>{Math.round((balance.activeGoal.currentPoints / balance.activeGoal.targetPoints) * 100)}% there</span>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === c
                ? 'bg-primary text-on-primary shadow-tonal'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Reward Tiers */}
      {[1, 2, 3, 4].map(tier => {
        const items = filteredRewards(tier);
        if (items.length === 0) return null;
        return (
          <div key={tier} className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60 mb-4">
              {tierLabels[tier]}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(reward => {
                const canRedeem = redeemable >= reward.points_cost;
                const isGoal = balance?.activeGoal?.reward?.id === reward.id;
                return (
                  <div
                    key={reward.id}
                    className="surface-card-elevated p-5 flex gap-4 items-start hover:shadow-tonal-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-2xl flex-shrink-0">
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-on-surface">{reward.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{reward.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-primary">{reward.points_cost} pts</span>
                        {tier <= 3 ? (
                          <button
                            onClick={() => canRedeem ? setRedeemModal(reward) : null}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                              canRedeem
                                ? 'bg-primary text-on-primary hover:opacity-90'
                                : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
                            }`}
                          >
                            {canRedeem ? 'Redeem now' : `Need ${reward.points_cost - redeemable} more`}
                          </button>
                        ) : isGoal ? (
                          <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                            Saving
                          </span>
                        ) : (
                          <button
                            onClick={() => setGoal(reward.id)}
                            className="text-xs px-3 py-1.5 rounded-full font-medium bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary transition"
                          >
                            Set as goal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Redeem Modal */}
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

            <div className="surface-card-elevated p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">{redeemModal.icon}</span>
              <div>
                <p className="font-bold text-on-surface">{redeemModal.title}</p>
                <p className="text-xs text-on-surface-variant">{redeemModal.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Cost</p>
                <p className="text-lg font-bold text-error">−{redeemModal.points_cost}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">Available</p>
                <p className="text-lg font-bold text-on-surface">{redeemable}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-on-surface-variant">After</p>
                <p className="text-lg font-bold text-emerald-600">{redeemable - redeemModal.points_cost}</p>
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
                {redeeming ? 'Redeeming...' : `Redeem now — ${redeemModal.points_cost} pts`}
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

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-2xl p-4 shadow-xl z-50 flex items-center gap-3 animate-pulse">
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
