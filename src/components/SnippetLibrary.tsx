import { useState, useMemo } from 'react';
import type { Snippet } from '@/types';
import { GatedExportButton } from './PaywallOverlay';
import { Search, Copy, Check, Plus, FileText, Tag, Crown, Lock } from 'lucide-react';

interface SnippetLibraryProps {
  snippets: Snippet[];
  isPro: boolean;
  onUpgrade: () => void;
}

const FREE_SNIPPET_LIMIT = 3;

export default function SnippetLibrary({ snippets, isPro, onUpgrade }: SnippetLibraryProps) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(snippets.map((s) => s.category)))],
    [snippets]
  );

  const visibleSnippets = isPro ? snippets : snippets.slice(0, FREE_SNIPPET_LIMIT);

  const filtered = useMemo(() => {
    return visibleSnippets.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchCat = filterCat === 'all' || s.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [visibleSnippets, search, filterCat]);

  const handleCopy = (snippet: Snippet) => {
    navigator.clipboard.writeText(snippet.content);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExport = () => {
    const text = snippets.map((s) =>
      `## ${s.title}\nCategory: ${s.category}\nTags: ${s.tags.join(', ')}\n\n${s.content}\n\n---\n`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snippet-library.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets by title, content, or tag…"
            className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:border-accent/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="glass rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-ink-850">{c === 'all' ? 'All categories' : c}</option>
            ))}
          </select>
          <GatedExportButton onExport={handleExport} onUpgrade={onUpgrade} isPro={isPro} label="Export Library" format=".txt" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((s) => {
          const expanded = expandedId === s.id;
          return (
            <div key={s.id} className="glass rounded-xl p-4 border border-ink-700 hover:border-ink-600 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-ink-400">{s.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(s)}
                  className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-ink-300 hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === s.id ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className={`text-xs text-ink-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                {s.content}
              </p>
              {s.content.length > 150 && (
                <button
                  onClick={() => setExpandedId(expanded ? null : s.id)}
                  className="text-xs text-accent hover:text-accent/80 transition-colors mt-1.5"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {s.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-ink-800 text-ink-300 border border-ink-700">
                    <Tag className="w-2.5 h-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!isPro && snippets.length > FREE_SNIPPET_LIMIT && (
        <div className="glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-accent/20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent shrink-0" />
            <p className="text-xs text-ink-300">
              <span className="font-medium text-ink-100">{snippets.length - FREE_SNIPPET_LIMIT} more snippets</span> are locked. Upgrade to access the full library and export it.
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

      {filtered.length === 0 && (
        <div className="glass rounded-xl py-12 text-center">
          <FileText className="w-8 h-8 text-ink-500 mx-auto mb-2" />
          <p className="text-sm text-ink-400">{snippets.length === 0 ? 'No reusable snippets are available yet.' : 'No snippets match your search.'}</p>
        </div>
      )}
    </div>
  );
}
