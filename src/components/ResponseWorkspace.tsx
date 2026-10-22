import { useState, useMemo } from 'react';
import type { AnalysisResult, SourceCitation } from '@/types';
import { supabase } from '@/lib/supabase';
import { GatedExportButton } from './PaywallOverlay';
import { exportFullProposal } from '@/lib/proposal-export';
import {
  Bold, Italic, List, ListOrdered, Quote, Undo2, Redo2,
  Link2, Sparkles, FileText, BookOpen, ChevronRight, Loader2,
  Check, AlertCircle, Download
} from 'lucide-react';

interface ResponseWorkspaceProps {
  result: AnalysisResult;
  onDraftChange: (id: string, text: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

const FREE_DRAFT_LIMIT = 1;

export default function ResponseWorkspace({ result, onDraftChange, isPro, onUpgrade }: ResponseWorkspaceProps) {
  const [activeId, setActiveId] = useState(result.drafts[0]?.id || '');
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [historyIndex, setHistoryIndex] = useState<Record<string, number>>({});
  const [citations, setCitations] = useState<Record<string, SourceCitation[]>>({});
  const [searching, setSearching] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [showCitations, setShowCitations] = useState<Record<string, boolean>>({});

  const visibleDrafts = isPro ? result.drafts : result.drafts.slice(0, FREE_DRAFT_LIMIT);
  const active = result.drafts.find((d) => d.id === activeId) ?? visibleDrafts[0];

  const pushHistory = (id: string, text: string) => {
    setHistory((prev) => {
      const h = prev[id] || [];
      const idx = historyIndex[id] ?? -1;
      const newHist = [...h.slice(0, idx + 1), text];
      return { ...prev, [id]: newHist };
    });
    setHistoryIndex((prev) => ({ ...prev, [id]: (prev[id] ?? -1) + 1 }));
  };

  const handleEdit = (id: string, text: string) => {
    onDraftChange(id, text);
  };

  const handleUndo = () => {
    if (!active) return;
    const h = history[active.id] || [];
    const idx = historyIndex[active.id] ?? -1;
    if (idx > 0) {
      const prevText = h[idx - 1];
      onDraftChange(active.id, prevText);
      setHistoryIndex((prev) => ({ ...prev, [active.id]: idx - 1 }));
    }
  };

  const handleRedo = () => {
    if (!active) return;
    const h = history[active.id] || [];
    const idx = historyIndex[active.id] ?? -1;
    if (idx < h.length - 1) {
      const nextText = h[idx + 1];
      onDraftChange(active.id, nextText);
      setHistoryIndex((prev) => ({ ...prev, [active.id]: idx + 1 }));
    }
  };

  const insertFormatting = (tag: string) => {
    if (!active) return;
    const textarea = document.getElementById(`draft-editor-${active.id}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = active.draft.substring(start, end);
    const insert = tag === 'bold' ? `**${selected}**`
      : tag === 'italic' ? `*${selected}*`
      : tag === 'quote' ? `> ${selected}`
      : tag === 'list' ? `- ${selected}`
      : tag === 'ordered' ? `1. ${selected}`
      : selected;
    const newText = active.draft.substring(0, start) + insert + active.draft.substring(end);
    handleEdit(active.id, newText);
    pushHistory(active.id, newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insert.length, start + insert.length);
    }, 0);
  };

  const handleRagRetrieve = async () => {
    if (!active) return;
    setSearching(true);
    setSourceError(null);
    setShowCitations((prev) => ({ ...prev, [active.id]: true }));
    try {
      const terms = active.requirement.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).slice(0, 8);
      if (terms.length === 0) throw new Error('This requirement does not contain searchable terms.');
      const { data, error } = await supabase
        .from('kb_chunks')
        .select('kb_id, chunk_index, content, knowledge_base!inner(title)')
        .or(terms.map((term) => `content.ilike.%${term}%`).join(','))
        .limit(20);

      if (error) throw error;
      const matches: SourceCitation[] = (data ?? []).map((chunk) => ({
        kb_document_id: chunk.kb_id,
        kb_document_title: chunk.knowledge_base[0]?.title ?? 'Untitled document',
        chunk_index: chunk.chunk_index,
        content_snippet: chunk.content.slice(0, 240),
        relevance_score: terms.filter((term) => chunk.content.toLowerCase().includes(term)).length / terms.length,
      })).sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 5);
      setCitations((prev) => ({ ...prev, [active.id]: matches }));
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : 'Knowledge base search failed.');
      setCitations((prev) => ({ ...prev, [active.id]: [] }));
    } finally {
      setSearching(false);
    }
  };

  const wordCount = useMemo(() => {
    if (!active) return 0;
    return active.draft.split(/\s+/).filter(Boolean).length;
  }, [active]);

  const canUndo = active ? (historyIndex[active.id] ?? -1) > 0 : false;
  const canRedo = active ? (historyIndex[active.id] ?? -1) < (history[active.id]?.length ?? 0) - 1 : false;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Draft selector sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="glass rounded-xl p-3">
            <p className="text-xs uppercase tracking-wider text-ink-400 font-medium mb-2 px-1">Requirements</p>
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {visibleDrafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setActiveId(d.id); setShowCitations((prev) => ({ ...prev, [d.id]: false })); }}
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
            </div>
            {!isPro && result.drafts.length > FREE_DRAFT_LIMIT && (
              <div className="mt-2 px-3 py-2.5 rounded-lg border border-dashed border-accent/30 bg-accent/5 text-center">
                <p className="text-xs text-ink-400">{result.drafts.length - FREE_DRAFT_LIMIT} more locked</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 min-w-0">
          {active ? (
            <div className="glass rounded-xl flex flex-col">
              {/* Requirement header */}
              <div className="px-5 py-3 border-b border-ink-700">
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium leading-snug">{active.requirement}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {wordCount} words · {active.draft.length} chars
                      {active.edited && <span className="text-accent ml-2">· Edited</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-ink-700 flex-wrap">
                <button onClick={() => insertFormatting('bold')} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors" title="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button onClick={() => insertFormatting('italic')} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors" title="Italic">
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-ink-700 mx-1" />
                <button onClick={() => insertFormatting('list')} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors" title="Bullet list">
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => insertFormatting('ordered')} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors" title="Numbered list">
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button onClick={() => insertFormatting('quote')} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors" title="Block quote">
                  <Quote className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-ink-700 mx-1" />
                <button onClick={handleUndo} disabled={!canUndo} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors disabled:opacity-30" title="Undo">
                  <Undo2 className="w-4 h-4" />
                </button>
                <button onClick={handleRedo} disabled={!canRedo} className="p-1.5 rounded-md hover:bg-ink-800 text-ink-300 transition-colors disabled:opacity-30" title="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={handleRagRetrieve}
                  disabled={searching}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors disabled:opacity-50"
                  title="Search knowledge base for relevant content"
                >
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin-slow" /> : <BookOpen className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Find Sources</span>
                </button>
              </div>

              {/* Editor textarea */}
              <textarea
                id={`draft-editor-${active.id}`}
                value={active.draft}
                onChange={(e) => handleEdit(active.id, e.target.value)}
                onBlur={(e) => pushHistory(active.id, e.target.value)}
                className="flex-1 min-h-[300px] bg-transparent px-5 py-4 text-sm leading-relaxed resize-y focus:outline-none scrollbar-thin"
                placeholder="Draft your response here…"
              />

              {/* Source citations panel */}
              {showCitations[active.id] && (
                <div className="border-t border-ink-700 px-5 py-3 bg-ink-850/40">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    <p className="text-xs font-medium text-ink-300">Source Matches</p>
                    <span className="text-[10px] text-ink-500">Click to insert into response</span>
                  </div>
                  {searching ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-ink-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin-slow" />
                      Searching knowledge base…
                    </div>
                  ) : citations[active.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {citations[active.id].map((c, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const newText = active.draft + '\n\n---\nSource: ' + c.kb_document_title + ' (Chunk ' + (c.chunk_index + 1) + ', ' + (c.relevance_score * 100).toFixed(0) + '% keyword overlap)\n"' + c.content_snippet + '"\n';
                            handleEdit(active.id, newText);
                            pushHistory(active.id, newText);
                          }}
                          className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg bg-ink-850/60 border border-ink-700 hover:border-accent/30 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                            <FileText className="w-3 h-3 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-medium truncate">{c.kb_document_title}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ok/10 text-ok border border-ok/30 font-mono shrink-0">
                                {(c.relevance_score * 100).toFixed(0)}% keyword overlap
                              </span>
                            </div>
                            <p className="text-xs text-ink-300 leading-snug line-clamp-2">{c.content_snippet}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-400 py-2">{sourceError || 'No keyword matches. Add TXT or Markdown documents to your knowledge base.'}</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-3 border-t border-ink-700 flex items-center justify-between text-xs text-ink-400">
                <span>{wordCount} words</span>
                <div className="flex items-center gap-3">
                  <GatedExportButton
                    onExport={() => exportFullProposal(result)}
                    onUpgrade={onUpgrade}
                    isPro={isPro}
                    label="Export Proposal"
                    format=".txt"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl flex items-center justify-center py-16 text-sm text-ink-400">
              Select a requirement to draft your response.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
