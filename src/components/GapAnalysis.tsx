import { useMemo, useState } from 'react';
import type { AnalysisResult, GapCategory } from '@/types';
import { GatedExportButton } from './PaywallOverlay';
import { Upload, CheckCircle2, FileText, X, FolderOpen, FileCheck2, Crown, Lock } from 'lucide-react';

const FREE_GAP_PREVIEW = 3;

interface GapAnalysisProps {
  result: AnalysisResult;
  onToggle: (id: string, uploaded: boolean, fileName?: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

const CATEGORY_META: Record<GapCategory, { label: string; color: string }> = {
  tax: { label: 'Tax', color: 'text-warn' },
  experience: { label: 'Experience', color: 'text-sky-400' },
  license: { label: 'License', color: 'text-violet-400' },
  certification: { label: 'Certification', color: 'text-teal-400' },
  insurance: { label: 'Insurance', color: 'text-rose-400' },
  financial: { label: 'Financial', color: 'text-emerald-400' },
  other: { label: 'Other', color: 'text-ink-300' },
};

export default function GapAnalysis({ result, onToggle, isPro, onUpgrade }: GapAnalysisProps) {
  const [filter, setFilter] = useState<'all' | 'missing' | 'provided'>('all');

  const visibleGaps = isPro ? result.gaps : result.gaps.slice(0, FREE_GAP_PREVIEW);
  const lockedGapsCount = result.gaps.length - visibleGaps.length;

  const grouped = useMemo(() => {
    const filtered = visibleGaps.filter((g) => {
      if (filter === 'missing') return !g.uploaded;
      if (filter === 'provided') return g.uploaded;
      return true;
    });
    const map = new Map<GapCategory, typeof filtered>();
    filtered.forEach((g) => {
      const arr = map.get(g.category) ?? [];
      arr.push(g);
      map.set(g.category, arr);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleGaps, filter]);

  const provided = result.gaps.filter((g) => g.uploaded).length;
  const pct = result.gaps.length > 0 ? Math.round((provided / result.gaps.length) * 100) : 0;

  const handleExport = () => {
    const csv = ['Document,Category,Status'];
    result.gaps.forEach((g) => {
      csv.push(`"${g.label.replace(/"/g, '""')}",${g.category},${g.uploaded ? 'Provided' : 'Missing'}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gap-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="glass rounded-xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Document Completeness</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-ink-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-deep to-ok transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-ok">{provided}</p>
              <p className="text-xs text-ink-400">Provided</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-bad">{result.summary.documentsMissing}</p>
              <p className="text-xs text-ink-400">Missing</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-100">{pct}%</p>
              <p className="text-xs text-ink-400">Complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {(['all', 'missing', 'provided'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-accent/15 text-accent border border-accent/30' : 'text-ink-300 border border-ink-700 hover:border-ink-600'
              }`}
            >
              {f === 'all' ? 'All documents' : f === 'missing' ? 'Missing only' : 'Provided only'}
            </button>
          ))}
        </div>
        <GatedExportButton
          onExport={handleExport}
          onUpgrade={onUpgrade}
          isPro={isPro}
          label="Export Report"
          format=".csv"
        />
      </div>

      <div className="space-y-5">
        {grouped.map(([cat, items]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <FileCheck2 className={`w-4 h-4 ${CATEGORY_META[cat].color}`} />
              <h3 className="text-sm font-semibold">{CATEGORY_META[cat].label}</h3>
              <span className="text-xs text-ink-400">({items.filter((i) => i.uploaded).length}/{items.length})</span>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`glass rounded-lg p-3.5 flex items-center gap-3 transition-all ${
                    item.uploaded ? 'border-ok/20' : 'border-bad/20'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    item.uploaded ? 'bg-ok/10 border border-ok/30' : 'bg-bad/10 border border-bad/30'
                  }`}>
                    {item.uploaded ? <CheckCircle2 className="w-5 h-5 text-ok" /> : <X className="w-5 h-5 text-bad" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    {item.uploaded && item.fileName && (
                      <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5 truncate">
                        <FileText className="w-3 h-3 shrink-0" />
                        {item.fileName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onToggle(item.id, !item.uploaded, item.uploaded ? undefined : `${item.label.replace(/\s+/g, '_').toLowerCase()}.pdf`)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      item.uploaded
                        ? 'text-ink-300 hover:bg-ink-800'
                        : 'bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30'
                    }`}
                  >
                    {item.uploaded ? (
                      <>Mark missing</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Mark provided</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!isPro && lockedGapsCount > 0 && (
        <div className="mt-5 glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-accent/20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent shrink-0" />
            <p className="text-xs text-ink-300">
              <span className="font-medium text-ink-100">{lockedGapsCount} more gap items</span> are locked. Upgrade to see the full gap analysis and export it.
            </p>
          </div>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-ink-950 hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            <Crown className="w-3.5 h-3.5" />
            Unlock All
          </button>
        </div>
      )}
    </div>
  );
}
