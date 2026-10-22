import { useEffect, useRef, useState } from 'react';
import type { LeadRecord } from '@/lead-types';
import { buildEmailTemplate } from '@/lib/lead-utils';
import { loadGoogleIdentityServices, requestGmailAccessToken, sendGmailMessage } from '@/lib/gmail';
import { Activity, AlertTriangle, Clock, Loader2, Mail, Send, Square, Zap } from 'lucide-react';

interface AutoMailerProps {
  leads: LeadRecord[];
}

const MAX_EMAILS_PER_RUN = 100;
const SEND_INTERVAL = 2000;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type MailerStatus = 'idle' | 'sending' | 'complete' | 'error';

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function AutoMailer({ leads }: AutoMailerProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [status, setStatus] = useState<MailerStatus>('idle');
  const [error, setError] = useState('');
  const stopRequested = useRef(false);

  const eligibleLeads = leads.filter((lead) =>
    !lead.isSampleData &&
    lead.mayEmail === true &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email),
  );
  const queuedCount = Math.min(eligibleLeads.length, MAX_EMAILS_PER_RUN);

  useEffect(() => {
    let active = true;
    void loadGoogleIdentityServices()
      .then(() => { if (active) setGoogleReady(true); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load Google sign-in.');
      });
    return () => { active = false; };
  }, []);

  async function start() {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google setup is not finished. Add VITE_GOOGLE_CLIENT_ID to the app hosting settings, then rebuild.');
      return;
    }
    if (queuedCount === 0) {
      setError('There are no real contacts approved for email. Add verified contacts and confirm they agreed to receive your emails.');
      return;
    }

    stopRequested.current = false;
    setError('');
    setSentCount(0);
    setStatus('sending');

    try {
      const accessToken = await requestGmailAccessToken(GOOGLE_CLIENT_ID);
      for (const lead of eligibleLeads.slice(0, MAX_EMAILS_PER_RUN)) {
        if (stopRequested.current) break;
        const message = buildEmailTemplate(lead.contactPerson, lead.companyName, lead.tenderTitle || lead.tenderRef);
        await sendGmailMessage(
          accessToken,
          lead.email,
          message.subject ?? 'A faster way to respond to RFPs',
          `${message.body}\n\nIf you do not want further emails from me, reply and tell me and I will remove you from my list.`,
        );
        setSentCount((count) => count + 1);
        if (!stopRequested.current) await wait(SEND_INTERVAL);
      }
      if (stopRequested.current) {
        setStatus('idle');
      } else {
        setStatus('complete');
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Gmail could not send the email.');
      setStatus('error');
    }
  }

  function stop() {
    stopRequested.current = true;
    setStatus('idle');
  }

  const isSending = status === 'sending';
  const progress = queuedCount === 0 ? 0 : Math.min(100, (sentCount / queuedCount) * 100);
  const remaining = Math.max(0, queuedCount - sentCount);

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="flex flex-col gap-4 border-b border-ink-700 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isSending ? 'border-ok/30 bg-ok/10' : 'border-ink-600 bg-ink-700'}`}>
            {isSending ? <Zap className="h-5 w-5 animate-pulse text-ok" /> : <Mail className="h-5 w-5 text-ink-300" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Gmail Auto Sender</h3>
            <p className={`mt-0.5 text-xs ${isSending ? 'text-ok' : 'text-ink-300'}`}>
              {isSending ? 'Sending approved emails' : status === 'complete' ? 'Sending complete' : status === 'error' ? 'Stopped — check the error below' : googleReady ? 'Ready when Google is configured' : 'Loading Google sign-in…'}
            </p>
          </div>
        </div>
        {isSending ? (
          <button onClick={stop} type="button" className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/15 px-4 py-2 text-sm font-medium text-bad hover:bg-bad/25">
            <Square className="h-4 w-4" /> Stop
          </button>
        ) : (
          <button
            onClick={() => void start()}
            disabled={!GOOGLE_CLIENT_ID || !googleReady || queuedCount === 0}
            type="button"
            className="flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/15 px-4 py-2 text-sm font-medium text-ok hover:bg-ok/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'error' ? <AlertTriangle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {status === 'error' ? 'Try again' : 'Start Gmail sending'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px bg-ink-800">
        <div className="bg-ink-900 px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5"><Send className="h-3.5 w-3.5 text-ok" /><span className="text-xs text-ink-400">Sent this run</span></div>
          <p className="text-xl font-bold text-ok">{sentCount}</p>
        </div>
        <div className="bg-ink-900 px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warn" /><span className="text-xs text-ink-400">Approved queue</span></div>
          <p className="text-xl font-bold text-warn">{remaining}</p>
        </div>
        <div className="bg-ink-900 px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-accent" /><span className="text-xs text-ink-400">Status</span></div>
          <p className="text-sm font-bold text-ink-100">{isSending ? 'Sending' : status === 'complete' ? 'Complete' : status === 'error' ? 'Error' : 'Idle'}</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-ink-700 px-5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink-300">Progress (up to {MAX_EMAILS_PER_RUN} per run)</span>
          <span className="font-mono text-ink-400">{sentCount} / {queuedCount}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${progress}%` }} />
        </div>
        {error && <p className="text-sm text-bad" role="alert">{error}</p>}
        <p className="text-xs leading-5 text-ink-400">
          Sends one message every two seconds from the Google account you approve. This page must stay open. Only verified contacts whose recipients have agreed to receive emails are included; Google OAuth setup is required.
        </p>
      </div>
      {isSending && <Loader2 className="sr-only" aria-label="Sending emails" />}
    </div>
  );
}
