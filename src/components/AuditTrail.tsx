import { useState, useEffect } from 'react';
import type { AuditEntry } from '@/types';
import { GatedExportButton } from './PaywallOverlay';
import { supabase } from '@/lib/supabase';
import {
  History, GitCommit, User, Clock, FileText,
  Sparkles, Pencil, Check, X, Download, Loader2, Crown, Lock
} from 'lucide-react';

interface AuditTrailProps {
  isPro: boolean;
  onUpgrade: () => void;
}

const ACTION_ICONS: Record<string, typeof Pencil> = {
  created: FileText,
  edited: Pencil,
  ai_generated: Sparkles,
  ai_regenerated: Sparkles,
  approved: Check,
  rejected: X,
  status_changed: GitCommit,
};

const FREE_AUDIT_LIMIT = 5;

export default function AuditTrail({ isPro, onUpgrade }: AuditTrailProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  useEffect(() => {
    loadAuditTrail();
  }, []);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setEntries(data as AuditEntry[]);
    } catch { /* offline mode */ }
    setLoading(false);
  };

  const handleExport = () => {
    const csv = ['Timestamp,Entity Type,Entity ID,Action,Author,Version,Change Summary,AI Prompt Version'];
    entries.forEach((e) => {
      csv.push([
        new Date(e.created_at).toISOString(),
        e.entity_type, e.entity_id, e.action, e.author,
        e.version.toString(), `"${(e.change_summary || '').replace(/"/g, '""')}"`,
        e.ai_prompt_version || '',
      ].join(','));
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-trail.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const actions = ['all', ...Array.from(new Set(entries.map((e) => e.action)))];
  const entities = ['all', ...Array.from(new Set(entries.map((e) => e.entity_type)))];

  const filtered = entries.filter((e) => {
    const matchAction = filterAction === 'all' || e.action === filterAction;
    const matchEntity = filterEntity === 'all' || e.entity_type === filterEntity;
    return matchAction && matchEntity;
  });

  const visibleEntries = isPro ? filtered : filtered.slice(0, FREE_AUDIT_LIMIT);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-accent animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            Audit Trail & Version History
          </h3>
          <GatedExportButton onExport={handleExport} onUpgrade={onUpgrade} isPro={isPro} label="Export Log" format=".csv" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="glass rounded-lg px-3 py-1.5 text-xs appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
          >
            {entities.map((t) => (
              <option key={t} value={t} className="bg-ink-850">{t === 'all' ? 'All entities' : t}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="glass rounded-lg px-3 py-1.5 text-xs appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
          >
            {actions.map((a) => (
              <option key={a} value={a} className="bg-ink-850">{a === 'all' ? 'All actions' : a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-8 h-8 text-ink-500 mx-auto mb-2" />
            <p className="text-sm text-ink-400">No audit entries yet.</p>
            <p className="text-xs text-ink-500 mt-1">As you edit drafts, assign reviews, and generate AI responses, a versioned history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-ink-700" />
              {visibleEntries.map((entry, i) => {
                const Icon = ACTION_ICONS[entry.action] || GitCommit;
                return (
                  <div key={entry.id} className="relative flex items-start gap-3 pl-0 pb-4">
                    <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      entry.action.startsWith('ai') ? 'bg-accent/10 border-accent/30'
                      : entry.action === 'approved' ? 'bg-ok/10 border-ok/30'
                      : entry.action === 'rejected' ? 'bg-bad/10 border-bad/30'
                      : 'bg-ink-800 border-ink-600'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        entry.action.startsWith('ai') ? 'text-accent'
                        : entry.action === 'approved' ? 'text-ok'
                        : entry.action === 'rejected' ? 'text-bad'
                        : 'text-ink-300'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-ink-400">·</span>
                        <span className="text-xs text-ink-300">{entry.entity_type}</span>
                        <span className="text-xs text-ink-400">·</span>
                        <span className="text-xs font-mono text-accent">v{entry.version}</span>
                      </div>
                      {entry.change_summary && (
                        <p className="text-xs text-ink-300 mt-0.5 leading-relaxed">{entry.change_summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {entry.ai_prompt_version && (
                          <span className="flex items-center gap-1 text-accent">
                            <Sparkles className="w-3 h-3" />
                            {entry.ai_prompt_version}
                          </span>
                        )}
                      </div>
                      {entry.before_value && entry.after_value && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-bad/5 border border-bad/20">
                            <p className="text-[10px] uppercase tracking-wider text-bad font-medium mb-1">Before</p>
                            <pre className="text-xs text-ink-300 overflow-x-auto scrollbar-thin whitespace-pre-wrap">
                              {JSON.stringify(entry.before_value, null, 2).slice(0, 200)}
                            </pre>
                          </div>
                          <div className="p-2 rounded-lg bg-ok/5 border border-ok/20">
                            <p className="text-[10px] uppercase tracking-wider text-ok font-medium mb-1">After</p>
                            <pre className="text-xs text-ink-300 overflow-x-auto scrollbar-thin whitespace-pre-wrap">
                              {JSON.stringify(entry.after_value, null, 2).slice(0, 200)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isPro && entries.length > FREE_AUDIT_LIMIT && (
          <div className="mt-4 glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-accent/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs text-ink-300">
                <span className="font-medium text-ink-100">{entries.length - FREE_AUDIT_LIMIT} more entries</span> are locked. Upgrade for full audit trail access.
              </p>
            </div>
            <button onClick={onUpgrade} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-ink-950 hover:bg-accent/90 transition-colors whitespace-nowrap">
              <Crown className="w-3.5 h-3.5" /> Unlock All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
