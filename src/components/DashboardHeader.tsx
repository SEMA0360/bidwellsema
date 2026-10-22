import type { AnalysisResult } from '@/types';
import { formatFileSize } from '@/lib/analysis';
import { ShieldCheck, FileText, Clock, CheckCircle2, AlertTriangle, XCircle, FolderOpen } from 'lucide-react';

interface DashboardHeaderProps {
  result: AnalysisResult;
}

export default function DashboardHeader({ result }: DashboardHeaderProps) {
  const stats = [
    { icon: FileText, label: 'Requirements', value: result.summary.totalRequirements, color: 'text-ink-100' },
    { icon: CheckCircle2, label: 'Compliant', value: result.summary.compliantCount, color: 'text-ok' },
    { icon: AlertTriangle, label: 'Missing', value: result.summary.missingCount, color: 'text-bad' },
    { icon: FolderOpen, label: 'Docs Provided', value: result.summary.documentsProvided, color: 'text-accent' },
  ];

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <h2 className="font-semibold truncate">{result.fileName}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
            <span>{formatFileSize(result.fileSize)}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(result.uploadedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-right">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
