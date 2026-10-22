import { useState } from 'react';
import { Sparkles, Plus, X, Tag, CheckCircle2, Target, TrendingUp, Edit3, Trash2, Lightbulb } from 'lucide-react';

interface WinTheme {
  id: string;
  title: string;
  description: string;
  evidence: string[];
  discriminator: 'strength' | 'neutral' | 'weakness';
  usageCount: number;
  status: 'draft' | 'validated' | 'integrated';
  tags: string[];
}

const SEED_THEMES: WinTheme[] = [
  {
    id: 'theme-1',
    title: 'Proven Delivery Velocity',
    description: 'We consistently deliver projects 15-20% ahead of schedule through our accelerated sprint methodology and dedicated mobilization team.',
    evidence: ['Project Alpha: 3 weeks early', 'Project Helios: 18% ahead of schedule', 'Average overrun: -12% across portfolio'],
    discriminator: 'strength',
    usageCount: 4,
    status: 'validated',
    tags: ['delivery', 'speed', 'track-record'],
  },
  {
    id: 'theme-2',
    title: 'Deep Domain Expertise',
    description: 'Our team holds 7+ years of specialized experience in this sector with 40+ completed engagements of comparable scope.',
    evidence: ['7 years sector experience', '40+ comparable projects', '4 senior SMEs on staff'],
    discriminator: 'strength',
    usageCount: 6,
    status: 'integrated',
    tags: ['expertise', 'experience', 'personnel'],
  },
  {
    id: 'theme-3',
    title: 'Cost-Effective Pricing Model',
    description: 'Our lean overhead structure allows us to deliver at 10-15% below competitor pricing without sacrificing quality.',
    evidence: ['15% lower than Deloitte on last 3 bids', 'Lean delivery model', 'Offshore capability'],
    discriminator: 'strength',
    usageCount: 3,
    status: 'draft',
    tags: ['pricing', 'value', 'competitive'],
  },
  {
    id: 'theme-4',
    title: 'Security-First Architecture',
    description: 'SOC 2 Type II certified with zero security incidents across 40+ engagements over 5 years.',
    evidence: ['SOC 2 Type II certified', 'Zero incidents in 5 years', '24/7 SOC operations'],
    discriminator: 'strength',
    usageCount: 2,
    status: 'validated',
    tags: ['security', 'compliance', 'soc2'],
  },
];

const DISCRIMINATOR_STYLES = {
  strength: { color: 'text-ok', bg: 'bg-ok/10', border: 'border-ok/30', label: 'Differentiator' },
  neutral: { color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', label: 'Parity' },
  weakness: { color: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30', label: 'Risk Area' },
};

const STATUS_STYLES = {
  draft: { color: 'text-ink-300', bg: 'bg-ink-800', border: 'border-ink-600', label: 'Draft' },
  validated: { color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', label: 'Validated' },
  integrated: { color: 'text-ok', bg: 'bg-ok/10', border: 'border-ok/30', label: 'Integrated' },
};

export default function WinThemeManager() {
  const [themes, setThemes] = useState<WinTheme[]>(SEED_THEMES);
  const [showAdd, setShowAdd] = useState(false);
  const [newTheme, setNewTheme] = useState({ title: '', description: '', discriminator: 'strength' as WinTheme['discriminator'] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEvidence, setEditEvidence] = useState('');

  const handleAdd = () => {
    if (!newTheme.title) return;
    const id = `theme-${Date.now()}`;
    setThemes((prev) => [...prev, {
      id,
      title: newTheme.title,
      description: newTheme.description,
      evidence: [],
      discriminator: newTheme.discriminator,
      usageCount: 0,
      status: 'draft',
      tags: [],
    }]);
    setNewTheme({ title: '', description: '', discriminator: 'strength' });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (id: string, status: WinTheme['status']) => {
    setThemes((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const handleAddEvidence = (id: string) => {
    if (!editEvidence.trim()) return;
    setThemes((prev) => prev.map((t) => t.id === id ? { ...t, evidence: [...t.evidence, editEvidence.trim()] } : t));
    setEditEvidence('');
  };

  const handleRemoveEvidence = (themeId: string, idx: number) => {
    setThemes((prev) => prev.map((t) => t.id === themeId ? { ...t, evidence: t.evidence.filter((_, i) => i !== idx) } : t));
  };

  const stats = {
    total: themes.length,
    strengths: themes.filter((t) => t.discriminator === 'strength').length,
    integrated: themes.filter((t) => t.status === 'integrated').length,
    avgUsage: themes.length > 0 ? Math.round(themes.reduce((s, t) => s + t.usageCount, 0) / themes.length) : 0,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-accent" /><span className="text-xs text-ink-400">Themes</span></div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Target className="w-4 h-4 text-ok" /><span className="text-xs text-ink-400">Differentiators</span></div>
          <p className="text-2xl font-bold text-ok">{stats.strengths}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-ok" /><span className="text-xs text-ink-400">Integrated</span></div>
          <p className="text-2xl font-bold text-ok">{stats.integrated}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-warn" /><span className="text-xs text-ink-400">Avg Usage</span></div>
          <p className="text-2xl font-bold text-warn">{stats.avgUsage}x</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass rounded-xl p-4 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">New Win Theme</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded text-ink-400 hover:text-ink-100"><X className="w-4 h-4" /></button>
          </div>
          <input value={newTheme.title} onChange={(e) => setNewTheme({ ...newTheme, title: e.target.value })} placeholder="Theme title (e.g., 'Proven Delivery Velocity')" className="w-full bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50" />
          <textarea value={newTheme.description} onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })} placeholder="Describe the win theme and how it differentiates your bid…" rows={2} className="w-full bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 resize-y" />
          <div className="flex gap-2">
            <select value={newTheme.discriminator} onChange={(e) => setNewTheme({ ...newTheme, discriminator: e.target.value as WinTheme['discriminator'] })} className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50">
              {(Object.keys(DISCRIMINATOR_STYLES) as WinTheme['discriminator'][]).map((d) => (
                <option key={d} value={d} className="bg-ink-850">{DISCRIMINATOR_STYLES[d].label}</option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={!newTheme.title} className="flex-1 py-2 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50">Add Theme</button>
          </div>
        </div>
      )}

      {/* Themes list */}
      <div className="space-y-3">
        {themes.map((theme) => {
          const discStyle = DISCRIMINATOR_STYLES[theme.discriminator];
          const statusStyle = STATUS_STYLES[theme.status];
          const isEditing = editingId === theme.id;
          return (
            <div key={theme.id} className="glass rounded-xl p-4 border border-ink-700 hover:border-ink-600 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg ${discStyle.bg} border ${discStyle.border} flex items-center justify-center shrink-0`}>
                    <Lightbulb className={`w-4 h-4 ${discStyle.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{theme.title}</p>
                    <p className="text-xs text-ink-400 leading-relaxed mt-0.5">{theme.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${discStyle.bg} ${discStyle.color} ${discStyle.border} border`}>{discStyle.label}</span>
                  <button onClick={() => handleDelete(theme.id)} className="p-1 rounded text-ink-400 hover:text-bad transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Evidence */}
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wider text-ink-400 font-medium mb-1.5">Supporting Evidence</p>
                {theme.evidence.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {theme.evidence.map((ev, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-ink-300">
                        <CheckCircle2 className="w-3 h-3 text-ok shrink-0" />
                        <span>{ev}</span>
                        <button onClick={() => handleRemoveEvidence(theme.id, i)} className="ml-auto p-0.5 rounded text-ink-500 hover:text-bad transition-colors"><X className="w-3 h-3" /></button>
                      </li>
                    ))}
                  </ul>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      value={editEvidence}
                      onChange={(e) => setEditEvidence(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddEvidence(theme.id)}
                      placeholder="Add evidence (e.g., 'Project Alpha: 3 weeks early')"
                      className="flex-1 bg-ink-900/60 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent/50"
                      autoFocus
                    />
                    <button onClick={() => handleAddEvidence(theme.id)} className="px-2.5 py-1.5 rounded-lg text-xs bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors">Add</button>
                  </div>
                )}
                {!isEditing && (
                  <button onClick={() => setEditingId(theme.id)} className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add evidence
                  </button>
                )}
                {isEditing && (
                  <button onClick={() => setEditingId(null)} className="text-xs text-ink-400 hover:text-ink-200 transition-colors mt-1">Done</button>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-700">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} border`}>{statusStyle.label}</span>
                  <span className="text-xs text-ink-400">Used {theme.usageCount}x</span>
                  {theme.tags.length > 0 && (
                    <div className="flex gap-1">
                      {theme.tags.map((t) => (
                        <span key={t} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-ink-800 text-ink-300 border border-ink-700">
                          <Tag className="w-2 h-2" />{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {theme.status !== 'validated' && (
                    <button onClick={() => handleStatusChange(theme.id, 'validated')} className="text-xs px-2 py-1 rounded-md text-warn hover:bg-warn/10 transition-colors">Validate</button>
                  )}
                  {theme.status !== 'integrated' && (
                    <button onClick={() => handleStatusChange(theme.id, 'integrated')} className="text-xs px-2 py-1 rounded-md text-ok hover:bg-ok/10 transition-colors">Integrate</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={() => setShowAdd(!showAdd)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors">
        <Plus className="w-4 h-4" /> Add Win Theme
      </button>
    </div>
  );
}
