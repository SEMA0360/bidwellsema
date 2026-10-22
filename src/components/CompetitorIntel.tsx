import { useState, useMemo } from 'react';
import { Swords, TrendingUp, TrendingDown, Minus, Plus, Building2, Trophy, Target, X, BarChart3, Percent } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  winRate: number;
  totalBids: number;
  wins: number;
  losses: number;
  avgBidValue: string;
  strengths: string[];
  weaknesses: string[];
  lastEncounter: string;
}

const SEED_COMPETITORS: Competitor[] = [
  {
    id: 'comp-1',
    name: 'Deloitte Consulting',
    winRate: 68,
    totalBids: 45,
    wins: 31,
    losses: 14,
    avgBidValue: '$2.4M',
    strengths: ['Brand recognition', 'Large bench capacity', 'Global delivery'],
    weaknesses: ['Premium pricing', 'Slow mobilization', 'Rigid methodology'],
    lastEncounter: '2026-08-15',
  },
  {
    id: 'comp-2',
    name: 'Accenture Federal',
    winRate: 55,
    totalBids: 38,
    wins: 21,
    losses: 17,
    avgBidValue: '$3.1M',
    strengths: ['Federal expertise', 'Security clearances', 'Existing contracts'],
    weaknesses: ['High overhead', 'Bureaucratic process'],
    lastEncounter: '2026-09-02',
  },
  {
    id: 'comp-3',
    name: 'Booz Allen Hamilton',
    winRate: 61,
    totalBids: 52,
    wins: 32,
    losses: 20,
    avgBidValue: '$1.8M',
    strengths: ['Defense sector depth', 'Cleared workforce', 'Incumbent advantage'],
    weaknesses: ['Limited commercial', 'Aging tech stack'],
    lastEncounter: '2026-07-22',
  },
  {
    id: 'comp-4',
    name: 'Leidos Holdings',
    winRate: 42,
    totalBids: 28,
    wins: 12,
    losses: 16,
    avgBidValue: '$2.9M',
    strengths: ['Systems integration', 'IT modernization'],
    weaknesses: ['Quality issues', 'Staff retention', 'Thin pipeline'],
    lastEncounter: '2026-06-10',
  },
];

export default function CompetitorIntel() {
  const [competitors, setCompetitors] = useState<Competitor[]>(SEED_COMPETITORS);
  const [showAdd, setShowAdd] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', winRate: 0, totalBids: 0, wins: 0 });
  const [selected, setSelected] = useState<Competitor | null>(null);

  const handleAdd = () => {
    if (!newComp.name) return;
    const id = `comp-${Date.now()}`;
    const losses = newComp.totalBids - newComp.wins;
    setCompetitors((prev) => [...prev, {
      id,
      name: newComp.name,
      winRate: newComp.totalBids > 0 ? Math.round((newComp.wins / newComp.totalBids) * 100) : 0,
      totalBids: newComp.totalBids,
      wins: newComp.wins,
      losses,
      avgBidValue: '—',
      strengths: [],
      weaknesses: [],
      lastEncounter: new Date().toISOString().split('T')[0],
    }]);
    setNewComp({ name: '', winRate: 0, totalBids: 0, wins: 0 });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const sorted = useMemo(() => [...competitors].sort((a, b) => b.winRate - a.winRate), [competitors]);
  const avgWinRate = competitors.length > 0 ? Math.round(competitors.reduce((s, c) => s + c.winRate, 0) / competitors.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-accent" />
            <span className="text-xs text-ink-400">Tracked</span>
          </div>
          <p className="text-2xl font-bold">{competitors.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-4 h-4 text-warn" />
            <span className="text-xs text-ink-400">Avg Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-warn">{avgWinRate}%</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-ok" />
            <span className="text-xs text-ink-400">Total Wins</span>
          </div>
          <p className="text-2xl font-bold text-ok">{competitors.reduce((s, c) => s + c.wins, 0)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-bad" />
            <span className="text-xs text-ink-400">Total Losses</span>
          </div>
          <p className="text-2xl font-bold text-bad">{competitors.reduce((s, c) => s + c.losses, 0)}</p>
        </div>
      </div>

      {/* Add competitor */}
      {showAdd && (
        <div className="glass rounded-xl p-4 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Add Competitor</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded text-ink-400 hover:text-ink-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={newComp.name} onChange={(e) => setNewComp({ ...newComp, name: e.target.value })} placeholder="Company name" className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" />
            <input type="number" value={newComp.totalBids || ''} onChange={(e) => setNewComp({ ...newComp, totalBids: +e.target.value })} placeholder="Total bids" className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" />
            <input type="number" value={newComp.wins || ''} onChange={(e) => setNewComp({ ...newComp, wins: +e.target.value })} placeholder="Wins" className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" />
          </div>
          <button onClick={handleAdd} disabled={!newComp.name} className="w-full py-2 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50">Add Competitor</button>
        </div>
      )}

      {/* Competitor list */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Swords className="w-4 h-4 text-accent" />
            Competitive Landscape
          </h3>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        <div className="space-y-2">
          {sorted.map((c, rank) => {
            const trendIcon = c.winRate >= 60 ? TrendingUp : c.winRate >= 40 ? Minus : TrendingDown;
            const TrendIcon = trendIcon;
            const trendColor = c.winRate >= 60 ? 'text-ok' : c.winRate >= 40 ? 'text-warn' : 'text-bad';
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-ink-850/60 border border-ink-700 hover:border-ink-600 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-ink-300">#{rank + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <TrendIcon className={`w-3.5 h-3.5 ${trendColor} shrink-0`} />
                  </div>
                  <p className="text-xs text-ink-400">
                    {c.wins}W / {c.losses}L · Avg {c.avgBidValue} · Last seen {new Date(c.lastEncounter).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${trendColor}`}>{c.winRate}%</p>
                  <p className="text-[10px] text-ink-400">win rate</p>
                </div>
                <button onClick={() => setSelected(selected?.id === c.id ? null : c)} className="p-1.5 rounded-lg text-ink-400 hover:text-accent hover:bg-accent/10 transition-colors shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="glass rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              {selected.name} — Intelligence Brief
            </h3>
            <button onClick={() => setSelected(null)} className="p-1 rounded text-ink-400 hover:text-ink-100"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-ok font-medium mb-2">Strengths</p>
              {selected.strengths.length > 0 ? (
                <ul className="space-y-1.5">
                  {selected.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-300">
                      <TrendingUp className="w-3.5 h-3.5 text-ok shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-ink-400">No data yet.</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-bad font-medium mb-2">Weaknesses</p>
              {selected.weaknesses.length > 0 ? (
                <ul className="space-y-1.5">
                  {selected.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-300">
                      <TrendingDown className="w-3.5 h-3.5 text-bad shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-ink-400">No data yet.</p>}
            </div>
          </div>

          {/* Win rate bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ink-400">Win Rate</span>
              <span className="text-xs font-mono text-ink-200">{selected.winRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${selected.winRate >= 60 ? 'bg-ok' : selected.winRate >= 40 ? 'bg-warn' : 'bg-bad'} transition-all duration-700`}
                style={{ width: `${selected.winRate}%` }}
              />
            </div>
          </div>

          <button onClick={() => handleDelete(selected.id)} className="mt-4 text-xs text-bad hover:text-bad/80 transition-colors">Remove competitor</button>
        </div>
      )}
    </div>
  );
}
