import { useState } from 'react';
import type { AnalysisResult } from '@/types';
import { regenerateDraft } from '@/lib/api';
import { GatedExportButton } from './PaywallOverlay';
import { Sparkles, Check, RotateCcw, Pencil, Copy, Loader2, AlertCircle, Lock, Crown } from 'lucide-react';

const FREE_DRAFT_PREVIEW = 1;

interface DraftResponseProps {
  result: AnalysisResult;
  onDraftChange: (id: string, text: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

export default function DraftResponse({ result, onDraftChange, isPro, onUpgrade }: DraftResponseProps) {
  const [activeId, setActiveId] = useState(result.drafts[0]?.id ?? null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const visibleDrafts = isPro ? result.drafts : result.drafts.slice(0, FREE_DRAFT_PREVIEW);

  const active = result.drafts.find((d) => d.id === activeId) ?? visibleDrafts[0];
  const isLocked = !isPro && result.drafts.length > FREE_DRAFT_PREVIEW && active && !visibleDrafts.find((d) => d.id === active.id);

  const handleExport = () => {
    const text = result.drafts.map((d) => `## ${d.requirement}\n\n${d.draft}\n\n---\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'draft-response.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (active) navigator.clipboard.writeText(active.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRegenerate = async () => {
    if (!active) return;
    setRegenerating(true);
    setRegenError(null);
    try {
      const { draft } = await regenerateDraft(active.requirement);
      onDraftChange(active.id, draft);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div className="glass rounded-xl p-2 h-fit">
        <p className="px-3 py-2 text-xs uppercase tracking-wider text-ink-400 font-medium">
          Requirements ({result.drafts.length})
        </p>
        <div className="space-y-1 max-h-[420px] overflow-y-auto scrollbar-thin">
          {visibleDrafts.map((d) => (
            <button
              key={d.id}
              onClick={() => { setActiveId(d.id); setRegenError(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start gap-2 ${
                active?.id === d.id
                  ? 'bg-accent/10 border border-accent/30'
                  : 'border border-transparent hover:bg-ink-800/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${d.edited ? 'bg-accent' : 'bg-ink-500'}`} />
              <span className="leading-snug line-clamp-2">{d.requirement}</span>
            </button>
          ))}
          {!isPro && result.drafts.length > FREE_DRAFT_PREVIEW && (
            <div className="px-3 py-2.5 rounded-lg border border-dashed border-accent/30 bg-accent/5 text-center">
              <Lock className="w-4 h-4 text-accent mx-auto mb-1" />
              <p className="text-xs text-ink-400">{result.drafts.length - FREE_DRAFT_PREVIEW} more drafts locked</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-xl flex flex-col">
        {isLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-semibold text-sm mb-1.5">Draft Locked</h3>
            <p className="text-xs text-ink-400 mb-4 max-w-xs">
              You have {FREE_DRAFT_PREVIEW} free draft preview. Upgrade to access all {result.drafts.length} AI-generated draft responses and export them.
            </p>
            <button
              onClick={onUpgrade}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Unlock All Drafts
            </button>
          </div>
        ) : active ? (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-700">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                <p className="text-sm font-medium truncate">{active.requirement}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ink-300 hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
                >
                  {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin-slow" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {regenerating ? 'Generating…' : 'Regenerate'}
                </button>
              </div>
            </div>

            <div className="flex-1 p-5">
              <div className="flex items-center gap-2 mb-3 text-xs text-ink-400">
                <Pencil className="w-3.5 h-3.5" />
                <span>AI-generated draft — edit inline to customize</span>
                {active.edited && <span className="text-accent">· Edited</span>}
              </div>
              <textarea
                value={active.draft}
                onChange={(e) => onDraftChange(active.id, e.target.value)}
                className="w-full h-72 bg-ink-850/60 border border-ink-700 rounded-lg p-4 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent/50 scrollbar-thin transition-colors"
                placeholder="Draft response will appear here…"
              />
              {regenError && (
                <div className="mt-3 flex items-start gap-2 text-xs text-bad">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{regenError}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-ink-700 flex items-center justify-between text-xs text-ink-400">
              <span>{active.draft.split(/\s+/).filter(Boolean).length} words</span>
              <div className="flex items-center gap-3">
                <GatedExportButton
                  onExport={handleExport}
                  onUpgrade={onUpgrade}
                  isPro={isPro}
                  label="Export"
                  format=".txt"
                />
                <span className="font-mono hidden sm:inline">{active.draft.length} chars</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-ink-400">
            Select a requirement to view its draft response.
          </div>
        )}
      </div>
    </div>
  );
}
