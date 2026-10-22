import { useState, useCallback, useEffect } from 'react';
import type { KBDocument, KBDocumentType } from '@/types';
import { GatedExportButton } from './PaywallOverlay';
import { supabase } from '@/lib/supabase';
import { Search, Upload, FileText, FileCheck2, Trash2, Loader2, Tag, Database, Plus, X, Crown, Lock, BookOpen } from 'lucide-react';

interface KnowledgeBaseProps {
  isPro: boolean;
  onUpgrade: () => void;
}

const DOC_TYPE_LABELS: Record<KBDocumentType, string> = {
  'past_bid': 'Past Winning Bid',
  'accreditation': 'Accreditation / Certification',
  'case_study': 'Case Study',
  'policy': 'Policy Document',
  'cv': 'Employee CV',
  'other': 'Other',
};

const ACCEPTED_TYPES = '.txt,.md,text/plain,text/markdown';

const FREE_KB_LIMIT = 3;

export default function KnowledgeBase({ isPro, onUpgrade }: KnowledgeBaseProps) {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<KBDocumentType | 'all'>('all');
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<{ doc: KBDocument; snippet: string; score: number }[]>([]);
  const [ragSearching, setRagSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.from('knowledge_base').select('*').order('uploaded_at', { ascending: false }).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message);
      else setDocuments((data ?? []) as KBDocument[]);
    });
    return () => { active = false; };
  }, []);

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of fileArr) {
      if (!/\.(txt|md)$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
        setError(`${file.name}: upload a TXT or Markdown file under 10 MB.`);
        continue;
      }

      const docType: KBDocumentType = file.name.match(/cv|resume/i) ? 'cv'
        : file.name.match(/cert|accredit|iso|soc/i) ? 'accreditation'
        : file.name.match(/case|study/i) ? 'case_study'
        : file.name.match(/policy|handbook/i) ? 'policy'
        : file.name.match(/bid|proposal|rfp/i) ? 'past_bid'
        : 'other';

      const newDoc: KBDocument = {
        id: '',
        title: file.name.replace(/\.[^.]+$/, ''),
        document_type: docType,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        tags: [DOC_TYPE_LABELS[docType]],
        status: 'processing',
        uploaded_at: new Date().toISOString(),
      };

      try {
        const content = (await file.text()).replace(/\r/g, '').trim();
        if (!content) throw new Error('The file does not contain searchable text.');

        const { data: savedDoc, error: insertError } = await supabase.from('knowledge_base').insert({
          title: newDoc.title,
          document_type: newDoc.document_type,
          file_name: newDoc.file_name,
          file_size: newDoc.file_size,
          mime_type: newDoc.mime_type,
          tags: newDoc.tags,
          status: 'processed',
        }).select('*').single();

        if (insertError) throw insertError;

        const paragraphs = content.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
        const chunks: string[] = [];
        let current = '';
        for (const paragraph of paragraphs) {
          if (current && current.length + paragraph.length > 1200) {
            chunks.push(current);
            current = '';
          }
          for (let offset = 0; offset < paragraph.length; offset += 1200) {
            const part = paragraph.slice(offset, offset + 1200);
            if (current && current.length + part.length > 1200) {
              chunks.push(current);
              current = '';
            }
            current += `${current ? '\n\n' : ''}${part}`;
          }
        }
        if (current) chunks.push(current);

        const { error: chunkError } = await supabase.from('kb_chunks').insert(chunks.map((chunk, index) => ({
          kb_id: savedDoc.id,
          chunk_index: index,
          content: chunk,
          metadata: { source: newDoc.file_name },
        })));
        if (chunkError) {
          await supabase.from('knowledge_base').delete().eq('id', savedDoc.id);
          throw chunkError;
        }

        setDocuments((prev) => [savedDoc as KBDocument, ...prev]);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : `Could not index ${file.name}.`);
      }
    }
    setUploading(false);
  }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('kb_chunks').delete().eq('kb_id', id);
    await supabase.from('knowledge_base').delete().eq('id', id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleRagSearch = async () => {
    if (!ragQuery.trim()) return;
    setRagSearching(true);
    setRagResults([]);

    try {
      const terms = ragQuery.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2).slice(0, 8);
      if (terms.length === 0) throw new Error('Enter at least one search term with three or more characters.');
      const { data: chunks, error: searchError } = await supabase
        .from('kb_chunks')
        .select('*, knowledge_base!inner(*)')
        .or(terms.map((term) => `content.ilike.%${term}%`).join(','))
        .limit(20);

      if (searchError) throw searchError;

      if (chunks && chunks.length > 0) {
        const results = chunks.map((c) => ({
          doc: {
            id: c.kb_id,
            title: c.knowledge_base?.title || 'Unknown',
            document_type: c.knowledge_base?.document_type || 'other',
            file_name: c.knowledge_base?.file_name || '',
            file_size: c.knowledge_base?.file_size || 0,
            mime_type: c.knowledge_base?.mime_type || '',
            tags: c.knowledge_base?.tags || [],
            status: 'processed',
            uploaded_at: c.knowledge_base?.uploaded_at || '',
          } as KBDocument,
          snippet: c.content.slice(0, 200),
          score: terms.filter((term) => c.content.toLowerCase().includes(term)).length / terms.length,
        })).sort((a, b) => b.score - a.score).slice(0, 5);
        setRagResults(results);
      } else {
        setRagResults([]);
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Knowledge base search failed.');
      setRagResults([]);
    }
    setRagSearching(false);
  };

  const filteredDocs = documents.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || d.document_type === filterType;
    return matchSearch && matchType;
  });

  const visibleDocs = isPro ? filteredDocs : filteredDocs.slice(0, FREE_KB_LIMIT);

  return (
    <div className="space-y-5">
      {/* RAG Search Bar */}
      <div className="glass rounded-xl p-5 border border-accent/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Database className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Semantic Search (RAG)</h3>
            <p className="text-xs text-ink-400">Search your knowledge base for relevant past answers and documentation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRagSearch()}
              placeholder="Search: 'past performance in highway construction' or 'ISO 9001 certification'…"
              className="w-full bg-ink-850/60 border border-ink-700 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <button
            onClick={handleRagSearch}
            disabled={ragSearching || !ragQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            {ragSearching ? <Loader2 className="w-4 h-4 animate-spin-slow" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
        {ragResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {ragResults.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-ink-850/60 border border-ink-700 hover:border-accent/30 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{r.doc.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ok/10 text-ok border border-ok/30 font-mono">
                      {(r.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-xs text-ink-300 leading-relaxed">{r.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {ragQuery && !ragSearching && ragResults.length === 0 && (
          <p className="mt-3 text-xs text-ink-400 text-center py-3">No matching content found. Upload documents to build your knowledge base.</p>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        className={`glass rounded-xl p-8 border-2 border-dashed transition-all ${
          dragOver ? 'border-accent/50 bg-accent/5' : 'border-ink-600 hover:border-ink-500'
        }`}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center mx-auto mb-3">
            {uploading ? <Loader2 className="w-6 h-6 text-accent animate-spin-slow" /> : <Upload className="w-6 h-6 text-ink-300" />}
          </div>
          <p className="text-sm font-medium mb-1">Drop files here or click to upload</p>
          <p className="text-xs text-ink-400 mb-3">Searchable text files only: TXT or Markdown, up to 10 MB</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            Select Files
            <input
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </label>
        </div>
      </div>
      {error && <p className="text-xs text-bad" role="alert">{error}</p>}

      {/* Document List */}
      <div>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or tag…"
              className="w-full glass rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:border-accent/50"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as KBDocumentType | 'all')}
            className="glass rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
          >
            <option value="all" className="bg-ink-850">All types</option>
            {(Object.keys(DOC_TYPE_LABELS) as KBDocumentType[]).map((t) => (
              <option key={t} value={t} className="bg-ink-850">{DOC_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {visibleDocs.length === 0 ? (
          <div className="glass rounded-xl py-12 text-center">
            <BookOpen className="w-8 h-8 text-ink-500 mx-auto mb-2" />
            <p className="text-sm text-ink-400">No documents in your knowledge base yet.</p>
            <p className="text-xs text-ink-500 mt-1">Upload past bids, certifications, and case studies to power AI-assisted drafting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleDocs.map((doc) => (
              <div key={doc.id} className="glass rounded-xl p-4 border border-ink-700 hover:border-ink-600 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-ink-400">{DOC_TYPE_LABELS[doc.document_type]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-bad hover:bg-bad/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                  <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                  <span>·</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  {doc.status === 'processing' && (
                    <span className="flex items-center gap-1 text-warn">
                      <Loader2 className="w-3 h-3 animate-spin-slow" /> Processing
                    </span>
                  )}
                  {doc.status === 'processed' && (
                    <span className="flex items-center gap-1 text-ok">
                      <FileCheck2 className="w-3 h-3" /> Indexed
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-ink-800 text-ink-300 border border-ink-700">
                      <Tag className="w-2.5 h-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isPro && documents.length > FREE_KB_LIMIT && (
          <div className="mt-3 glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-accent/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs text-ink-300">
                <span className="font-medium text-ink-100">{documents.length - FREE_KB_LIMIT} more documents</span> are locked. Upgrade for unlimited knowledge base storage.
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
    </div>
  );
}
