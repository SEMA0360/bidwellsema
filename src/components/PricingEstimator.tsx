import { useState, useMemo } from 'react';
import { DollarSign, Calculator, TrendingUp, Percent, Plus, X, Trash2, PieChart, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CostLine {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
}

const SEED_LINES: CostLine[] = [
  { id: 'cl-1', category: 'Labor', description: 'Project Manager (1 FTE, 18 weeks)', quantity: 18, unitCost: 12000 },
  { id: 'cl-2', category: 'Labor', description: 'Senior Developer (2 FTE, 14 weeks)', quantity: 28, unitCost: 8500 },
  { id: 'cl-3', category: 'Labor', description: 'QA Engineer (1 FTE, 6 weeks)', quantity: 6, unitCost: 6500 },
  { id: 'cl-4', category: 'Infrastructure', description: 'Cloud hosting & infrastructure', quantity: 1, unitCost: 45000 },
  { id: 'cl-5', category: 'Infrastructure', description: 'Software licenses & tools', quantity: 1, unitCost: 18000 },
  { id: 'cl-6', category: 'Overhead', description: 'Project management overhead (15%)', quantity: 1, unitCost: 22000 },
  { id: 'cl-7', category: 'Compliance', description: 'Security audit & certification', quantity: 1, unitCost: 15000 },
  { id: 'cl-8', category: 'Contingency', description: 'Risk contingency (8%)', quantity: 1, unitCost: 12000 },
];

const CATEGORY_COLORS: Record<string, string> = {
  Labor: 'text-accent',
  Infrastructure: 'text-ok',
  Overhead: 'text-warn',
  Compliance: 'text-ink-200',
  Contingency: 'text-bad',
  Other: 'text-ink-300',
};

export default function PricingEstimator() {
  const [lines, setLines] = useState<CostLine[]>(SEED_LINES);
  const [showAdd, setShowAdd] = useState(false);
  const [newLine, setNewLine] = useState({ category: 'Labor', description: '', quantity: 1, unitCost: 0 });
  const [marginPct, setMarginPct] = useState(22);
  const [competitorLow, setCompetitorLow] = useState(380000);
  const [competitorHigh, setCompetitorHigh] = useState(520000);

  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let subtotal = 0;
    lines.forEach((l) => {
      const total = l.quantity * l.unitCost;
      byCategory[l.category] = (byCategory[l.category] || 0) + total;
      subtotal += total;
    });
    const margin = Math.round(subtotal * (marginPct / 100));
    const finalPrice = subtotal + margin;
    return { byCategory, subtotal, margin, finalPrice };
  }, [lines, marginPct]);

  const competitorMid = (competitorLow + competitorHigh) / 2;
  const priceVsCompetitor = competitorMid > 0 ? Math.round(((totals.finalPrice - competitorMid) / competitorMid) * 100) : 0;
  const isCompetitive = priceVsCompetitor <= 5 && priceVsCompetitor >= -15;

  const handleAdd = () => {
    if (!newLine.description) return;
    const id = `cl-${Date.now()}`;
    setLines((prev) => [...prev, { ...newLine, id }]);
    setNewLine({ category: 'Labor', description: '', quantity: 1, unitCost: 0 });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdate = (id: string, field: keyof CostLine, value: string | number) => {
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, [field]: field === 'description' || field === 'category' ? String(value) : Number(value) } : l));
  };

  const formatCurrency = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${n.toLocaleString()}`;

  const pieSegments = useMemo(() => {
    const entries = Object.entries(totals.byCategory);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    let cumulative = 0;
    return entries.map(([cat, val]) => {
      const pct = (val / total) * 100;
      const segment = { cat, val, pct, offset: (cumulative / total) * 360 };
      cumulative += val;
      return segment;
    });
  }, [totals.byCategory]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Price summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Calculator className="w-4 h-4 text-ink-300" /><span className="text-xs text-ink-400">Cost Subtotal</span></div>
          <p className="text-2xl font-bold">{formatCurrency(totals.subtotal)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Percent className="w-4 h-4 text-warn" /><span className="text-xs text-ink-400">Margin ({marginPct}%)</span></div>
          <p className="text-2xl font-bold text-warn">{formatCurrency(totals.margin)}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-accent/30">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-accent" /><span className="text-xs text-ink-400">Bid Price</span></div>
          <p className="text-2xl font-bold text-accent">{formatCurrency(totals.finalPrice)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className={`w-4 h-4 ${isCompetitive ? 'text-ok' : 'text-bad'}`} /><span className="text-xs text-ink-400">vs Competitor</span></div>
          <p className={`text-2xl font-bold ${isCompetitive ? 'text-ok' : 'text-bad'}`}>{priceVsCompetitor > 0 ? '+' : ''}{priceVsCompetitor}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cost breakdown table */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-accent" />
              Cost Breakdown
            </h3>
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          {showAdd && (
            <div className="mb-3 p-3 rounded-lg bg-ink-850/60 border border-ink-700 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select value={newLine.category} onChange={(e) => setNewLine({ ...newLine, category: e.target.value })} className="bg-ink-900/60 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs appearance-none cursor-pointer focus:outline-none focus:border-accent/50">
                  {Object.keys(CATEGORY_COLORS).map((c) => <option key={c} value={c} className="bg-ink-850">{c}</option>)}
                </select>
                <input value={newLine.description} onChange={(e) => setNewLine({ ...newLine, description: e.target.value })} placeholder="Description" className="sm:col-span-2 bg-ink-900/60 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent/50" />
                <div className="flex gap-2">
                  <input type="number" value={newLine.quantity || ''} onChange={(e) => setNewLine({ ...newLine, quantity: +e.target.value })} placeholder="Qty" className="w-16 bg-ink-900/60 border border-ink-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent/50" />
                  <input type="number" value={newLine.unitCost || ''} onChange={(e) => setNewLine({ ...newLine, unitCost: +e.target.value })} placeholder="Unit $" className="flex-1 bg-ink-900/60 border border-ink-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent/50" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-1.5 rounded-lg text-xs text-ink-300 border border-ink-700 hover:bg-ink-800 transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={!newLine.description} className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50">Add</button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-850/40 border border-ink-700 hover:border-ink-600 transition-colors">
                <span className={`text-xs font-medium ${CATEGORY_COLORS[l.category] || 'text-ink-300'} shrink-0 w-20`}>{l.category}</span>
                <input
                  value={l.description}
                  onChange={(e) => handleUpdate(l.id, 'description', e.target.value)}
                  className="flex-1 bg-transparent text-xs text-ink-200 focus:outline-none focus:bg-ink-900/40 rounded px-1.5 py-0.5"
                />
                <input
                  type="number"
                  value={l.quantity}
                  onChange={(e) => handleUpdate(l.id, 'quantity', e.target.value)}
                  className="w-14 bg-transparent text-xs text-ink-300 font-mono text-right focus:outline-none focus:bg-ink-900/40 rounded px-1.5 py-0.5"
                />
                <span className="text-xs text-ink-500">×</span>
                <input
                  type="number"
                  value={l.unitCost}
                  onChange={(e) => handleUpdate(l.id, 'unitCost', e.target.value)}
                  className="w-24 bg-transparent text-xs text-ink-300 font-mono text-right focus:outline-none focus:bg-ink-900/40 rounded px-1.5 py-0.5"
                />
                <span className="text-xs font-mono text-ink-200 w-20 text-right shrink-0">{formatCurrency(l.quantity * l.unitCost)}</span>
                <button onClick={() => handleDelete(l.id)} className="p-1 rounded text-ink-400 hover:text-bad transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-ink-700 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-300">Cost Subtotal</span>
            <span className="text-lg font-bold font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
        </div>

        {/* Pricing controls + pie chart */}
        <div className="space-y-5">
          {/* Margin slider */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3">Margin & Competitor Analysis</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-ink-400">Profit Margin</label>
                <span className="text-sm font-bold text-warn">{marginPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={marginPct}
                onChange={(e) => setMarginPct(+e.target.value)}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[10px] text-ink-500 mt-0.5">
                <span>0%</span><span>25%</span><span>50%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-ink-400 block mb-1">Competitor Price Range</label>
                <div className="flex gap-2">
                  <input type="number" value={competitorLow} onChange={(e) => setCompetitorLow(+e.target.value)} className="w-full bg-ink-900/60 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-accent/50" />
                  <input type="number" value={competitorHigh} onChange={(e) => setCompetitorHigh(+e.target.value)} className="w-full bg-ink-900/60 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-accent/50" />
                </div>
              </div>
            </div>
            <div className={`mt-3 p-2.5 rounded-lg border flex items-center gap-2 ${isCompetitive ? 'bg-ok/5 border-ok/20' : 'bg-bad/5 border-bad/20'}`}>
              {isCompetitive ? <CheckCircle2 className="w-4 h-4 text-ok shrink-0" /> : <AlertTriangle className="w-4 h-4 text-bad shrink-0" />}
              <p className={`text-xs ${isCompetitive ? 'text-ok' : 'text-bad'}`}>
                {isCompetitive
                  ? `Your bid is ${Math.abs(priceVsCompetitor)}% ${priceVsCompetitor >= 0 ? 'above' : 'below'} competitor midpoint — competitive range.`
                  : `Your bid is ${Math.abs(priceVsCompetitor)}% ${priceVsCompetitor > 0 ? 'above' : 'below'} competitor midpoint — consider adjusting margin.`}
              </p>
            </div>
          </div>

          {/* Cost distribution pie */}
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-accent" />
              Cost Distribution
            </h3>
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                {pieSegments.map((seg, i) => {
                  const radius = 54;
                  const circumference = 2 * Math.PI * radius;
                  const dashLength = (seg.pct / 100) * circumference;
                  const dashOffset = -(seg.offset / 360) * circumference;
                  const colors = ['var(--color-accent)', 'var(--color-ok)', 'var(--color-warn)', 'var(--color-ink-200)', 'var(--color-bad)', 'var(--color-ink-400)'];
                  return (
                    <circle
                      key={i}
                      cx="64" cy="64" r={radius}
                      fill="none"
                      stroke={colors[i % colors.length]}
                      strokeWidth="16"
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={dashOffset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-ink-400">Total</span>
                <span className="text-sm font-bold font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {pieSegments.map((seg, i) => {
                const colors = ['text-accent', 'text-ok', 'text-warn', 'text-ink-200', 'text-bad', 'text-ink-400'];
                return (
                  <div key={seg.cat} className="flex items-center gap-2 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-sm ${colors[i % colors.length].replace('text-', 'bg-')}`} />
                    <span className="flex-1 text-ink-300">{seg.cat}</span>
                    <span className="font-mono text-ink-400">{seg.pct.toFixed(0)}%</span>
                    <span className="font-mono text-ink-200 w-16 text-right">{formatCurrency(seg.val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
