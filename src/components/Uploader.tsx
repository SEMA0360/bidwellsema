import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileText, ShieldCheck, Sparkles, ListChecks, Loader2, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/analysis';
import { analyzeRfp } from '@/lib/api';
import type { AnalysisResult, SavedAnalysis } from '@/types';

interface UploaderProps {
  onAnalyzed: (result: AnalysisResult) => Promise<void>;
  savedAnalyses: SavedAnalysis[];
  savedAnalysesLoading: boolean;
  onOpenAnalysis: (analysis: SavedAnalysis) => void;
}

const MAX_SIZE_MB = 5;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export default function Uploader({ onAnalyzed, savedAnalyses, savedAnalysesLoading, onOpenAnalysis }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ACCEPTED = '.pdf,application/pdf';
  const handleFiles = useCallback(async (newFiles: File[]) => {
    if (newFiles.length !== 1) {
      setError('Upload one PDF at a time.');
      return;
    }

    const selectedFile = newFiles[0];
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Unsupported file type. Upload a PDF document.');
      return;
    }
    if (selectedFile.size > MAX_SIZE) {
      setError(`This PDF exceeds the ${MAX_SIZE_MB} MB upload limit.`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setProcessing(true);

    try {
      const result = await analyzeRfp(selectedFile);
      await onAnalyzed(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setProcessing(false);
    }
  }, [onAnalyzed]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (processing) return;
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length > 0) handleFiles(dropped);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length > 0) handleFiles(selected);
  };

  return (
    <div className="min-h-screen bg-ink-950 bg-grid relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Bidwell</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            RFP & Tender Intelligence
          </h1>
          <p className="text-ink-300 text-lg max-w-xl mx-auto leading-relaxed">
            Upload your RFP or tender document and Bidwell will extract requirements, draft responses, and flag compliance gaps — automatically.
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !processing && inputRef.current?.click()}
          className={`
            relative glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
            ${dragging ? 'border-accent shadow-glow scale-[1.01]' : 'glass-hover'}
            ${processing ? 'cursor-default' : 'hover:border-ink-600'}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={onChange}
          />

          {!processing ? (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-ink-800 border border-ink-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <UploadCloud className="w-8 h-8 text-accent" />
              </div>
              <p className="text-lg font-medium mb-1.5">
                Drop your RFP / Tender documents here
              </p>
              <p className="text-sm text-ink-400">
                or click to browse — one PDF up to {MAX_SIZE_MB}&nbsp;MB
              </p>
            </>
          ) : (
            <div className="py-2">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-accent animate-spin-slow" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm truncate max-w-[220px]">{file?.name}</p>
                  <p className="text-xs text-ink-400">{file && formatFileSize(file.size)}</p>
                </div>
              </div>
              <p className="text-xs text-ink-400 mt-3">Uploading and analyzing PDF…</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 glass rounded-xl p-4 flex items-start gap-3 border-bad/30 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-bad shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-bad">Couldn't analyze this file</p>
              <p className="text-sm leading-5 text-ink-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-10 animate-fade-in">
          {[
            { icon: ListChecks, label: 'Compliance Matrix', desc: 'Structured requirement tracking' },
            { icon: Sparkles, label: 'AI Draft Responses', desc: 'Editable starter answers' },
            { icon: ShieldCheck, label: 'Gap Analysis', desc: 'Missing document checklist' },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-4 text-center">
              <f.icon className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-ink-400 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {(savedAnalysesLoading || savedAnalyses.length > 0) && (
          <section className="mt-10 animate-fade-in">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-400">Recent bids</h2>
            {savedAnalysesLoading ? (
              <p className="text-sm text-ink-400">Loading saved bids…</p>
            ) : (
              <div className="divide-y divide-ink-800 border-y border-ink-800">
                {savedAnalyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-ink-900/50"
                    onClick={() => onOpenAnalysis(analysis)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-100">{analysis.file_name}</span>
                        <span className="block text-xs text-ink-400">{analysis.result.summary.totalRequirements} requirements</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">{new Date(analysis.updated_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
