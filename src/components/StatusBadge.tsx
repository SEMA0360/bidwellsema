import type { ComplianceStatus } from '@/types';

const CONFIG: Record<ComplianceStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  compliant: { label: 'Compliant', dot: 'bg-ok', text: 'text-ok', bg: 'bg-ok/10', border: 'border-ok/30' },
  partial: { label: 'Partial', dot: 'bg-warn', text: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30' },
  missing: { label: 'Missing', dot: 'bg-bad', text: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30' },
  pending: { label: 'Pending', dot: 'bg-ink-400', text: 'text-ink-300', bg: 'bg-ink-700/50', border: 'border-ink-600' },
};

interface StatusBadgeProps {
  status: ComplianceStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
