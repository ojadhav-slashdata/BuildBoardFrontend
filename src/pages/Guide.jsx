import { useState } from 'react';

const faqs = [
  { q: 'Do I need my manager\'s approval to submit an idea?', a: 'No — anyone can submit an idea at any time. Your manager will review and either approve or reject it, but submission is open to all employees.' },
  { q: 'Can I bid on any idea or only ideas in my department?', a: 'Any idea — there are no department restrictions. You\'ll be ranked by your performance score from past deliveries.' },
  { q: 'What happens if I can\'t finish an idea I won?', a: 'Flag it early in comments. You can request a deadline extension. Late delivery forfeits timing bonus but you still earn base + rating points.' },
  { q: 'Do my points expire?', a: 'Yes — each batch expires 12 months after earned. Oldest points used first when you redeem. Your lifetime total never decreases.' },
  { q: 'What does the 20% innovation time mean?', a: 'The company allocates 20% of your working hours for BuildBoard innovation work. That\'s ~8 hrs/week on a 40-hr week. Tracked in your profile.' },
];

const pointsTable = [
  { size: 'Micro', scope: 'POC · quick win', pts: 10, effort: '< 4 hrs' },
  { size: 'Small', scope: 'POC · 1–2 days', pts: 25, effort: '8–16 hrs' },
  { size: 'Medium', scope: 'POC or FP', pts: 50, effort: '16–40 hrs' },
  { size: 'Large', scope: 'Full product · 3–4 weeks', pts: 100, effort: '80–160 hrs' },
  { size: 'XL', scope: 'Full product · 1–2 months', pts: 200, effort: '160–320 hrs' },
  { size: 'Enterprise', scope: 'Full product · 3+ months', pts: 400, effort: '320+ hrs' },
];

export default function Guide() {
  const [openFaq, setOpenFaq] = useState(null);
  const [tab, setTab] = useState('overview');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="bg-inverse-surface text-inverse-on-surface rounded-4xl p-10 mb-10">
        <h1 className="text-4xl font-bold mb-3">BuildBoard — employee guide</h1>
        <p className="text-lg text-primary-light/70">Everything you need to know to earn points and claim rewards</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[['overview', 'Overview'], ['points', 'How to earn points'], ['rewards', 'How rewards work']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '💡', title: 'How to earn points', desc: 'Ideas, building, ratings, milestones', color: 'bg-primary/5', click: () => setTab('points') },
              { icon: '🎁', title: 'How to redeem rewards', desc: 'Tiers, goals, expiry, fulfilment', color: 'bg-emerald-50', click: () => setTab('rewards') },
              { icon: '⏱️', title: 'Innovation time', desc: '20% allocation, tracking, balance', color: 'bg-amber-50', click: undefined },
              { icon: '📋', title: 'Bidding & building', desc: 'How to bid, win, and deliver', color: 'bg-blue-50', click: undefined },
            ].map((card, i) => (
              <button
                key={i}
                onClick={card.click}
                className={`${card.color} surface-card-elevated p-6 rounded-3xl text-left hover:shadow-tonal-md transition-all`}
              >
                <span className="text-3xl block mb-3">{card.icon}</span>
                <p className="font-bold text-on-surface">{card.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{card.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold mb-4">Frequently asked questions</h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="surface-card-elevated rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left p-4 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-on-surface">{faq.q}</span>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {openFaq === i ? 'remove' : 'add'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-on-surface-variant leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Points Guide */}
      {tab === 'points' && (
        <div className="space-y-8">
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <p className="text-sm text-on-surface-variant mb-2">Points formula</p>
            <p className="text-lg font-bold text-primary font-mono">Final = (Base + Complexity) × Delivery + Rating</p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Base points by idea size</h3>
            <div className="surface-card-elevated rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="text-left p-3 font-semibold text-on-surface-variant">Size</th>
                    <th className="text-left p-3 font-semibold text-on-surface-variant">Scope</th>
                    <th className="text-right p-3 font-semibold text-on-surface-variant">Base pts</th>
                    <th className="text-right p-3 font-semibold text-on-surface-variant">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map(r => (
                    <tr key={r.size} className="border-t border-outline-variant/10">
                      <td className="p-3 font-medium text-on-surface">{r.size}</td>
                      <td className="p-3 text-on-surface-variant">{r.scope}</td>
                      <td className="p-3 text-right font-bold text-primary">{r.pts} pts</td>
                      <td className="p-3 text-right text-on-surface-variant">{r.effort}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Bonuses</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Complexity — Low', val: '+0 pts' },
                { label: 'Complexity — Medium', val: '+20 pts' },
                { label: 'Complexity — High', val: '+50 pts' },
                { label: 'Complexity — Innovative', val: '+100 pts' },
                { label: 'Early delivery', val: '×1.25' },
                { label: 'On time', val: '×1.0' },
                { label: 'Late delivery', val: 'Base forfeited' },
                { label: 'Rating — Excellent', val: '+50 pts' },
                { label: 'Rating — Good', val: '+25 pts' },
                { label: 'Rating — Average', val: '+10 pts' },
                { label: 'Idea submission completed', val: '+5 pts' },
              ].map((b, i) => (
                <div key={i} className="surface-card-elevated p-3 rounded-2xl flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">{b.label}</span>
                  <span className="text-sm font-bold text-primary">{b.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5">
            <p className="text-sm font-bold text-on-surface mb-2">Team bids</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Points calculated once, then split equally. Example: Large + High + Early + Excellent = (100+50)×1.25+50 = 237 pts ÷ 3 = 79 pts each.
            </p>
          </div>
        </div>
      )}

      {/* Rewards Guide */}
      {tab === 'rewards' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-inverse-surface text-inverse-on-surface rounded-3xl p-6">
              <p className="text-sm text-primary-light/70 mb-1">Lifetime earned</p>
              <p className="text-sm text-inverse-on-surface/70">Every point earned. Never decreases. Visible to management.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
              <p className="text-sm text-emerald-800 mb-1">Available to redeem</p>
              <p className="text-sm text-emerald-700/70">What you can spend. Decreases on redeem. Expires after 12 months.</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Reward tiers</h3>
            {[
              { tier: 1, range: '250 – 500 pts', examples: 'Course credits, meal vouchers', effort: '1–2 ideas', color: 'bg-emerald-50 text-emerald-800' },
              { tier: 2, range: '500 – 1,000 pts', examples: 'Gift cards, spa day', effort: 'Medium idea', color: 'bg-blue-50 text-blue-800' },
              { tier: 3, range: '1,500 – 2,500 pts', examples: 'Weekend staycation, premium cards', effort: 'Large idea', color: 'bg-primary/5 text-primary' },
              { tier: 4, range: '3,000+ pts', examples: 'Experience packages, travel', effort: 'Save toward', color: 'bg-primary text-on-primary' },
            ].map(t => (
              <div key={t.tier} className="surface-card-elevated p-4 rounded-2xl mb-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${t.color}`}>Tier {t.tier}</span>
                  <div>
                    <p className="text-sm font-medium text-on-surface">{t.range}</p>
                    <p className="text-xs text-on-surface-variant">{t.examples}</p>
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant">{t.effort}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
            <p className="text-sm font-bold text-amber-800 mb-2">Points expiry</p>
            <ul className="text-sm text-amber-700 space-y-1 leading-relaxed">
              <li>• Each batch expires 12 months after earned</li>
              <li>• Oldest points used first when you redeem</li>
              <li>• Reminders sent 60 and 30 days before expiry</li>
              <li>• Lifetime total never expires</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
