import { useState } from 'react';
import type { TargetContact } from '@/lead-types';
import type { OutreachChannel } from '@/lib/lead-utils';
import { buildOutreachMessage, buildGmailUrl, buildWhatsAppUrl } from '@/lib/lead-utils';
import { X, Mail, Copy, Check, Send, MessageCircle, Globe, ExternalLink } from 'lucide-react';

interface OutreachModalProps {
  contact: TargetContact;
  onClose: () => void;
  onSent: () => void;
}

const CHANNELS: { id: OutreachChannel; label: string; icon: typeof Mail; color: string }[] = [
  { id: 'gmail', label: 'Send Gmail', icon: Mail, color: 'text-accent' },
  { id: 'whatsapp', label: 'WhatsApp / SMS', icon: MessageCircle, color: 'text-ok' },
  { id: 'webform', label: 'Web Form Auto-Fill', icon: Globe, color: 'text-warn' },
];

export default function OutreachModal({ contact, onClose, onSent }: OutreachModalProps) {
  const [channel, setChannel] = useState<OutreachChannel>('gmail');
  const template = buildOutreachMessage(channel, contact);
  const [subject, setSubject] = useState(template.subject || '');
  const [body, setBody] = useState(template.body);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChannelChange = (ch: OutreachChannel) => {
    setChannel(ch);
    const msg = buildOutreachMessage(ch, contact);
    setSubject(msg.subject || '');
    setBody(msg.body);
  };

  const handleCopy = () => {
    const text = subject ? `Subject: ${subject}\n\n${body}` : body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSend = () => {
    setSent(true);
    if (channel === 'gmail') {
      window.open(buildGmailUrl(contact.email, subject, body), '_blank');
    } else if (channel === 'whatsapp') {
      window.open(buildWhatsAppUrl(contact.phone, body), '_blank');
    }
    setTimeout(onSent, 600);
  };

  const handleWebFormOpen = () => {
    if (contact.website) {
      window.open(`https://${contact.website}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-card animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Mail className="w-4.5 h-4.5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Multi-Channel Outreach</h3>
              <p className="text-xs text-ink-400">To: {contact.contactPerson} ({contact.companyName})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="flex gap-1.5 px-5 pt-4">
          {CHANNELS.map((ch) => {
            const active = channel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => handleChannelChange(ch.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-ink-300 border border-ink-700 hover:border-ink-600'
                }`}
              >
                <ch.icon className="w-3.5 h-3.5" />
                {ch.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {channel === 'gmail' && (
            <div>
              <label className="text-xs uppercase tracking-wider text-ink-400 font-medium block mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-ink-850/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-400 font-medium block mb-1.5">
              {channel === 'gmail' ? 'Email Body' : channel === 'whatsapp' ? 'WhatsApp Message' : 'Web Form Message'}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-56 bg-ink-850/60 border border-ink-700 rounded-lg px-3 py-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent/50 scrollbar-thin transition-colors"
            />
          </div>

          {/* Personalization tokens */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { token: '[First_Name]', value: contact.contactPerson.split(' ')[0] },
              { token: '[Company_Name]', value: contact.companyName },
              { token: '[Tender_Title]', value: contact.tenderTitle || contact.tenderRef },
              { token: '[App_URL]', value: window.location.origin },
            ].map((p) => (
              <span key={p.token} className="text-[10px] font-mono px-2 py-1 rounded-md bg-ink-800 text-ink-300 border border-ink-700">
                {p.token} → <span className="text-accent">{p.value.length > 30 ? p.value.slice(0, 30) + '…' : p.value}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-ink-700">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {channel === 'webform' && contact.website && (
              <button
                onClick={handleWebFormOpen}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-warn hover:bg-warn/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Contact Form
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={sent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-60"
          >
            {sent ? <Check className="w-4 h-4 text-ok" /> : <Send className="w-4 h-4" />}
            {sent ? 'Sent' : channel === 'gmail' ? 'Open in Gmail' : channel === 'whatsapp' ? 'Open in WhatsApp' : 'Copy & Open Form'}
          </button>
        </div>
      </div>
    </div>
  );
}
