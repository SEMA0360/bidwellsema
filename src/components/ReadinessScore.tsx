import { useMemo } from 'react';
import type { AnalysisResult } from '@/types';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react';

interface ReadinessScoreProps {
  result: AnalysisResult;
}

interface ScoreBreakdown {
  label: string;
  value: number;
  max: number;
  icon: typeof Activity;
  color: string;
  detail: string;
}

export default function ReadinessScore({ result }: ReadinessScoreProps) {
  const { overallScore, grade, breakdown, recommendation } = useMemo(() => {
    const total = result.summary.totalRequirements || 1;
    const mandatoryTotal = result.summary.mandatoryCount || 1;
    const gapsTotal = result.gaps.length || 1;

    const compliancePct = (result.summary.compliantCount / total) * 100;
    const mandatoryMet = result.compliance.filter((c) => c.mandatory && c.status === 'compliant').length;
    const mandatoryPct = (mandatoryMet / mandatoryTotal) * 100;
    const gapsPct = (result.summary.documentsProvided / gapsTotal) * 100;
    const draftsComplete = result.drafts.filter((d) => d.draft.trim().length > 0).length;
    const draftsPct = (draftsComplete / (result.drafts.length || 1)) * 100;
    const missingCritical = result.compliance.filter((c) => c.mandatory && c.status === 'missing').length;
    const partialCount = result.compliance.filter((c) => c.status === 'partial').length;

    const overall = Math.round((compliancePct * 0.3 + mandatoryPct * 0.35 + gapsPct * 0.2 + draftsPct * 0.15));

    const bd: ScoreBreakdown[] = [
      { label: 'Compliance', value: result.summary.compliantCount, max: total, icon: CheckCircle2, color: 'text-ok', detail: `${Math.round(compliancePct)}% requirements met` },
      { label: 'Mandatory', value: mandatoryMet, max: mandatoryTotal, icon: ShieldCheck, color: 'text-accent', detail: `${mandatoryMet} of ${mandatoryTotal} mandatory items compliant` },
      { label: 'Documents', value: result.summary.documentsProvided, max: gapsTotal, icon: FileWarning, color: 'text-warn', detail: `${Math.round(gapsPct)}% documents provided` },
      { label: 'Drafts', value: draftsComplete, max: result.drafts.length || 1, icon: TrendingUp, color: 'text-ink-200', detail: `${draftsComplete} of ${result.drafts.length} drafts ready` },
    ];

    let g = 'F';
    if (overall >= 90) g = 'A';
    else if (overall >= 80) g = 'B';
    else if (overall >= 70) g = 'C';
    else if (overall >= 60) g = 'D';
    else if (overall >= 50) g = 'E';

    let rec = 'Your bid is ready for submission review.';
    if (missingCritical > 0) rec = `${missingCritical} mandatory requirement${missingCritical > 1 ? 's are' : ' is'} still missing — address these before submitting.`;
    else if (partialCount > 2) rec = `${partialCount} requirements are only partially met. Strengthen these responses to improve your score.`;
    else if (gapsPct < 60) rec = `${result.summary.documentsMissing} required documents are still missing. Upload them to improve readiness.`;
    else if (overall < 70) rec = 'Several areas need attention before this bid is submission-ready. Focus on missing and partial items first.';

    return { overallScore: overall, grade: g, breakdown: bd, recommendation: rec };
  }, [result]);

  const gradeColor =
    grade === 'A' ? 'text-ok' :
    grade === 'B' ? 'text-ok' :
    grade === 'C' ? 'text-warn' :
    grade === 'D' ? 'text-warn' :
    grade === 'E' ? 'text-bad' : 'text-bad';

  const ringColor =
    overallScore >= 80 ? 'stroke-ok' :
    overallScore >= 60 ? 'stroke-warn' : 'stroke-bad';

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="font-semibold text-sm">Bid Readiness Score</h3>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="120" height="120" className="-rotate-90">
            <circle cx="60" cy="60" r="52" className="stroke-ink-700" strokeWidth="8" fill="none" />
            <circle
              cx="60" cy="60" r="52"
              className={ringColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${gradeColor}`}>{grade}</span>
            <span className="text-xs text-ink-400 font-mono">{overallScore}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {breakdown.map((b) => {
            const pct = Math.round((b.value / b.max) * 100);
            return (
              <div key={b.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <b.icon className={`w-3.5 h-3.5 ${b.color}`} />
                    <span className="text-xs font-medium">{b.label}</span>
                  </div>
                  <span className="text-xs font-mono text-ink-300">{b.value}/{b.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 75 ? 'bg-ok' : pct >= 50 ? 'bg-warn' : 'bg-bad'
                    } transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-ink-850/60 border border-ink-700 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-warn shrink-0 mt-0.5" />
        <p className="text-xs text-ink-300 leading-relaxed">{recommendation}</p>
      </div>
    </div>
  );
}
