import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';

interface DeadlineTrackerProps {
  deadline: string | null;
}

function getRemaining(deadline: string) {
  const now = new Date().getTime();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true, totalMs: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, overdue: false, totalMs: diff };
}

function getUrgency(totalMs: number, overdue: boolean) {
  if (overdue) return { label: 'Overdue', color: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30', icon: AlertTriangle };
  const days = totalMs / (1000 * 60 * 60 * 24);
  if (days <= 3) return { label: 'Critical', color: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30', icon: AlertTriangle };
  if (days <= 7) return { label: 'Urgent', color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', icon: Clock };
  if (days <= 14) return { label: 'On Track', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', icon: Timer };
  return { label: 'Comfortable', color: 'text-ok', bg: 'bg-ok/10', border: 'border-ok/30', icon: CheckCircle2 };
}

export default function DeadlineTracker({ deadline }: DeadlineTrackerProps) {
  const [remaining, setRemaining] = useState(() => deadline ? getRemaining(deadline) : null);

  useEffect(() => {
    if (!deadline) {
      setRemaining(null);
      return;
    }
    const timer = setInterval(() => setRemaining(getRemaining(deadline)), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline || !remaining) {
    return (
      <div className="glass rounded-xl p-5 border border-ink-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ink-400" />
          <h3 className="font-semibold text-sm">Submission Deadline</h3>
        </div>
        <p className="mt-3 text-sm text-ink-400">No deadline was identified in this document.</p>
      </div>
    );
  }

  const urgency = getUrgency(remaining.totalMs, remaining.overdue);
  const Icon = urgency.icon;
  const deadlineDate = new Date(deadline);

  const units = [
    { value: remaining.days, label: 'Days' },
    { value: remaining.hours, label: 'Hours' },
    { value: remaining.minutes, label: 'Min' },
    { value: remaining.seconds, label: 'Sec' },
  ];

  return (
    <div className={`glass rounded-xl p-5 border ${urgency.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${urgency.bg} flex items-center justify-center`}>
            <Calendar className={`w-4 h-4 ${urgency.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Submission Deadline</h3>
            <p className="text-xs text-ink-400">
              {deadlineDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
              {deadlineDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${urgency.bg} ${urgency.color} ${urgency.border} border`}>
          <Icon className="w-3.5 h-3.5" />
          {urgency.label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.label} className="text-center bg-ink-850/60 rounded-lg py-3 border border-ink-700">
            <p className={`text-2xl font-bold font-mono ${urgency.color}`}>
              {String(u.value).padStart(2, '0')}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">{u.label}</p>
          </div>
        ))}
      </div>

      {remaining.overdue && (
        <div className="mt-3 flex items-center gap-2 text-xs text-bad">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>The submission deadline has passed. Contact the issuing authority for extension eligibility.</span>
        </div>
      )}
    </div>
  );
}
