import { useState, useMemo } from 'react';
import type { AnalysisResult, ComplianceStatus } from '@/types';
import StatusBadge from './StatusBadge';
import { GatedExportButton } from './PaywallOverlay';
import { Search, Filter, ArrowUpDown, Check, X, Minus, Crown } from 'lucide-react';

const FREE_PREVIEW_LIMIT = 5;

interface ComplianceMatrixProps {
  result: AnalysisResult;
  onStatusChange: (rowId: string, status: ComplianceStatus) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

type SortKey = 'requirement' | 'category' | 'mandatory' | 'status';

export default function ComplianceMatrix({ result, onStatusChange, isPro, onUpgrade }: ComplianceMatrixProps) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('requirement');
  const [sortAsc, setSortAsc] = useState(true);
  const [editingRow, setEditingRow] = useState<string | null>(null);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(result.compliance.map((r) => r.category)))],
    [result.compliance]
  );

  const visibleCompliance = isPro ? result.compliance : result.compliance.slice(0, FREE_PREVIEW_LIMIT);

  const filtered = useMemo(() => {
    let rows = visibleCompliance.filter((r) => {
      const matchSearch = r.requirement.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === 'all' || r.category === filterCat;
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'mandatory') cmp = Number(a.mandatory) - Number(b.mandatory);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [visibleCompliance, search, filterCat, filterStatus, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const statusOptions: ComplianceStatus[] = ['compliant', 'partial', 'missing', 'pending'];

  const handleExport = () => {
    const csv = ['Requirement,Category,Mandatory,Status'];
    result.compliance.forEach((r) => {
      csv.push(`"${r.requirement.replace(/"/g, '""')}",${r.category},${r.mandatory ? 'Yes' : 'No'},${r.status}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compliance-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requirements…"
            className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:border-accent/50"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="glass rounded-lg pl-8 pr-7 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
            >
              {categories.map((c) => <option key={c} value={c} className="bg-ink-850">{c === 'all' ? 'All categories' : c}</option>)}
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
          >
            <option value="all" className="bg-ink-850">All statuses</option>
            {statusOptions.map((s) => <option key={s} value={s} className="bg-ink-850 capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden scrollbar-thin">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left">
                <th className="px-4 py-3 font-medium text-ink-300">
                  <button onClick={() => toggleSort('requirement')} className="flex items-center gap-1 hover:text-ink-100">
                    Requirement <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-ink-300">
                  <button onClick={() => toggleSort('category')} className="flex items-center gap-1 hover:text-ink-100">
                    Category <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-ink-300">
                  <button onClick={() => toggleSort('mandatory')} className="flex items-center gap-1 hover:text-ink-100">
                    Mandatory <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-ink-300">
                  <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-ink-100">
                    Status <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-ink-800 hover:bg-ink-800/40 transition-colors">
                  <td className="px-4 py-3 max-w-md">
                    <p className="leading-relaxed">{row.requirement}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-ink-300 bg-ink-800 px-2 py-1 rounded">{row.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.mandatory ? (
                      <span className="inline-flex items-center gap-1 text-ok text-xs font-medium">
                        <Check className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-ink-400 text-xs">
                        <Minus className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingRow === row.id ? (
                      <div className="flex items-center gap-1">
                        {statusOptions.map((s) => (
                          <button
                            key={s}
                            onClick={() => { onStatusChange(row.id, s); setEditingRow(null); }}
                            className={`px-2 py-1 rounded text-[10px] capitalize border transition-colors ${
                              row.status === s ? 'bg-accent/20 border-accent/50 text-accent' : 'border-ink-600 text-ink-300 hover:border-ink-500'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                        <button onClick={() => setEditingRow(null)} className="p-1 text-ink-400 hover:text-ink-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingRow(row.id)} className="transition-transform hover:scale-105">
                        <StatusBadge status={row.status} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-ink-400 text-sm">
            No requirements match your filters.
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
        <p className="text-xs text-ink-400">
          {isPro
            ? `Showing ${filtered.length} of ${result.compliance.length} requirements. Click a status badge to update it.`
            : `Showing ${Math.min(filtered.length, FREE_PREVIEW_LIMIT)} of ${result.compliance.length} requirements.`
          }
        </p>
        <div className="flex items-center gap-2">
          <GatedExportButton
            onExport={handleExport}
            onUpgrade={onUpgrade}
            isPro={isPro}
            label="Export Matrix"
            format=".csv"
          />
        </div>
      </div>

      {!isPro && result.compliance.length > FREE_PREVIEW_LIMIT && (
        <div className="mt-3 glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-accent/20">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent shrink-0" />
            <p className="text-xs text-ink-300">
              <span className="font-medium text-ink-100">{result.compliance.length - FREE_PREVIEW_LIMIT} more requirements</span> are locked. Upgrade to see the full compliance matrix and export it.
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
