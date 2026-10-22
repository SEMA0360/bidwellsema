import type { AnalysisResult } from '@/types';
import DeadlineTracker from './DeadlineTracker';
import ReadinessScore from './ReadinessScore';
import { GatedExportButton } from './PaywallOverlay';
import { exportFullProposal } from '@/lib/proposal-export';
import { ListChecks, Sparkles, ShieldCheck, FolderOpen, Clock, AlertTriangle, CheckCircle2, Download } from 'lucide-react';

interface OverviewProps {
  result: AnalysisResult;
  isPro: boolean;
  onUpgrade: () => void;
  onNavigate: (tab: string) => void;
}

export default function Overview({ result, isPro, onUpgrade, onNavigate }: OverviewProps) {
  const cards = [
    {
      icon: ListChecks,
      label: 'Compliance Matrix',
      value: `${result.summary.compliantCount}/${result.summary.totalRequirements}`,
      sub: `${result.summary.missingCount} missing`,
      color: 'text-ok',
      tab: 'compliance',
    },
    {
      icon: Sparkles,
      label: 'Draft Responses',
      value: `${result.drafts.filter((d) => d.draft.trim().length > 0).length}/${result.drafts.length}`,
      sub: `${result.drafts.filter((d) => d.edited).length} edited`,
      color: 'text-accent',
      tab: 'drafts',
    },
    {
      icon: ShieldCheck,
      label: 'Gap Analysis',
      value: `${result.summary.documentsProvided}/${result.gaps.length}`,
      sub: `${result.summary.documentsMissing} missing`,
      color: 'text-warn',
      tab: 'gaps',
    },
    {
      icon: FolderOpen,
      label: 'Snippets',
      value: `${result.snippets.length}`,
      sub: 'Reusable blocks',
      color: 'text-ink-200',
      tab: 'snippets',
    },
  ];

  const missingMandatory = result.compliance.filter((c) => c.mandatory && c.status === 'missing');
  const partialItems = result.compliance.filter((c) => c.status === 'partial');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DeadlineTracker deadline={result.submissionDeadline} />
        <ReadinessScore result={result} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.tab)}
            className="glass rounded-xl p-4 text-left hover:border-ink-600 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700 flex items-center justify-center group-hover:border-accent/30 transition-colors">
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{c.label}</p>
            <p className="text-[10px] text-ink-500 mt-0.5">{c.sub}</p>
          </button>
        ))}
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warn" />
            Action Items
          </h3>
          <GatedExportButton
            onExport={() => exportFullProposal(result)}
            onUpgrade={onUpgrade}
            isPro={isPro}
            label="Export Full Proposal"
            format=".txt"
          />
        </div>

        <div className="space-y-2.5">
          {missingMandatory.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-bad/5 border border-bad/20">
              <div className="w-7 h-7 rounded-lg bg-bad/10 border border-bad/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-bad" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-bad mb-0.5">
                  {missingMandatory.length} mandatory requirement{missingMandatory.length > 1 ? 's' : ''} missing
                </p>
                <ul className="text-xs text-ink-300 space-y-0.5">
                  {missingMandatory.slice(0, 3).map((m) => (
                    <li key={m.id} className="truncate">• {m.requirement}</li>
                  ))}
                  {missingMandatory.length > 3 && (
                    <li className="text-ink-400">+ {missingMandatory.length - 3} more…</li>
                  )}
                </ul>
                <button
                  onClick={() => onNavigate('compliance')}
                  className="text-xs text-accent hover:text-accent/80 transition-colors mt-1.5"
                >
                  Review compliance matrix →
                </button>
              </div>
            </div>
          )}

          {partialItems.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-warn/5 border border-warn/20">
              <div className="w-7 h-7 rounded-lg bg-warn/10 border border-warn/30 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-warn" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-warn mb-0.5">
                  {partialItems.length} requirement{partialItems.length > 1 ? 's' : ''} partially met
                </p>
                <ul className="text-xs text-ink-300 space-y-0.5">
                  {partialItems.slice(0, 3).map((p) => (
                    <li key={p.id} className="truncate">• {p.requirement}</li>
                  ))}
                  {partialItems.length > 3 && (
                    <li className="text-ink-400">+ {partialItems.length - 3} more…</li>
                  )}
                </ul>
                <button
                  onClick={() => onNavigate('drafts')}
                  className="text-xs text-accent hover:text-accent/80 transition-colors mt-1.5"
                >
                  Strengthen draft responses →
                </button>
              </div>
            </div>
          )}

          {result.summary.documentsMissing > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                <FolderOpen className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-accent mb-0.5">
                  {result.summary.documentsMissing} documents still missing
                </p>
                <p className="text-xs text-ink-300">
                  Upload remaining documents to complete your gap analysis and improve readiness.
                </p>
                <button
                  onClick={() => onNavigate('gaps')}
                  className="text-xs text-accent hover:text-accent/80 transition-colors mt-1.5"
                >
                  Go to gap analysis →
                </button>
              </div>
            </div>
          )}

          {missingMandatory.length === 0 && partialItems.length === 0 && result.summary.documentsMissing === 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-ok/5 border border-ok/20">
              <div className="w-7 h-7 rounded-lg bg-ok/10 border border-ok/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-ok" />
              </div>
              <div>
                <p className="text-xs font-medium text-ok">All requirements addressed</p>
                <p className="text-xs text-ink-300 mt-0.5">Your bid is ready for final review and submission.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
