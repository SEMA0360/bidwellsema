import { useState, type FormEvent } from 'react';
import type { TargetContact, LeadRecord } from '@/lead-types';
import SamOpportunitySearch from './SamOpportunitySearch';
import ProcurementPortalDirectory from './ProcurementPortalDirectory';
import LinkedInProspecting from './LinkedInProspecting';
import ColdEmailModal from './ColdEmailModal';
import AutoMailer from './AutoMailer';
import { exportLeadsToCSV } from '@/lib/lead-utils';
import PaywallOverlay from './PaywallOverlay';
import { Globe, Linkedin, Download, Mail, Trash2, Users, Send } from 'lucide-react';

type Section = 'portal' | 'directory' | 'linkedin' | 'leads' | 'sender';

interface FindLeadsProps {
  leads: LeadRecord[];
  onAddLead: (contact: TargetContact, source: 'portal' | 'linkedin' | 'manual') => void;
  onRemoveLead: (id: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}

export default function FindLeads({ leads, onAddLead, onRemoveLead, isPro, onUpgrade }: FindLeadsProps) {
  const [section, setSection] = useState<Section>('portal');
  const [emailTarget, setEmailTarget] = useState<TargetContact | null>(null);
  const [manualCompany, setManualCompany] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [mayEmailManualContact, setMayEmailManualContact] = useState(false);

  const handleSendEmail = (contact: TargetContact) => {
    setEmailTarget(contact);
  };

  const addManualContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddLead({
      id: `manual-${Date.now()}`,
      tenderId: '',
      tenderRef: 'Manual contact',
      tenderTitle: 'Manually added contact',
      companyName: manualCompany.trim(),
      contactPerson: manualName.trim(),
      title: '',
      email: manualEmail.trim(),
      phone: '',
      website: '',
      category: 'it-infrastructure',
      portal: 'manual',
      sourceType: 'bidder',
      isSampleData: false,
      mayEmail: mayEmailManualContact,
    }, 'manual');
    setManualCompany('');
    setManualName('');
    setManualEmail('');
    setMayEmailManualContact(false);
  };

  const tabs = [
    { id: 'portal' as const, label: 'SAM.gov Live', icon: Globe },
    { id: 'directory' as const, label: 'More Portals', icon: Globe },
    { id: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin },
    { id: 'leads' as const, label: 'My Leads', icon: Users, count: leads.length },
    { id: 'sender' as const, label: 'Email Sender', icon: Send },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 glass rounded-xl w-fit overflow-x-auto">
          {tabs.map((t) => {
            const active = section === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSection(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative whitespace-nowrap ${
                  active ? 'bg-accent/15 text-accent' : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/60'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {leads.length > 0 && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={() => exportLeadsToCSV(leads)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-ok/15 text-ok border border-ok/30 hover:bg-ok/25 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {section === 'portal' && (
        isPro ? (
          <SamOpportunitySearch />
        ) : (
          <PaywallOverlay
            title="SAM.gov Search Locked"
            message="Search current U.S. federal contract opportunities from the official SAM.gov feed. Upgrade to access live opportunity search."
            onUpgrade={onUpgrade}
            lockedLabel="Premium Feature"
          />
        )
      )}
      {section === 'directory' && <ProcurementPortalDirectory />}
      {section === 'linkedin' && (
        isPro ? (
          <LinkedInProspecting />
        ) : (
          <PaywallOverlay
            title="LinkedIn Search Builder Locked"
            message="Build Boolean searches and open LinkedIn's official search pages. Profiles and contact details are verified on LinkedIn, not supplied by Bidwell."
            onUpgrade={onUpgrade}
            lockedLabel="Premium Feature"
          />
        )
      )}
      {section === 'sender' && (
        isPro ? (
          <AutoMailer leads={leads} />
        ) : (
          <PaywallOverlay
            title="Gmail Sender Locked"
            message="Send permission-confirmed messages from your Google account. Upgrade to access the Gmail sender."
            onUpgrade={onUpgrade}
            lockedLabel="Premium Feature"
          />
        )
      )}
      {section === 'leads' && (
        <div className="space-y-4">
          <form onSubmit={addManualContact} className="glass rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-100">Add a real contact</h3>
              <p className="mt-1 text-xs text-ink-400">Add a contact whose details you have verified. Email sending is only enabled when you confirm they agreed to receive messages.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input aria-label="Company" required value={manualCompany} onChange={(event) => setManualCompany(event.target.value)} placeholder="Company" className="glass rounded-lg px-3 py-2 text-sm" />
              <input aria-label="Contact name" required value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Contact name" className="glass rounded-lg px-3 py-2 text-sm" />
              <input aria-label="Email address" required type="email" value={manualEmail} onChange={(event) => setManualEmail(event.target.value)} placeholder="Email address" className="glass rounded-lg px-3 py-2 text-sm" />
            </div>
            <label className="flex items-start gap-2 text-xs text-ink-300">
              <input type="checkbox" checked={mayEmailManualContact} onChange={(event) => setMayEmailManualContact(event.target.checked)} required className="mt-0.5" />
              I confirm this person agreed to receive emails from me.
            </label>
            <button type="submit" className="rounded-lg bg-accent/20 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/30">Add contact</button>
          </form>
          <LeadList leads={leads} onRemoveLead={onRemoveLead} onSendEmail={handleSendEmail} />
        </div>
      )}

      {emailTarget && (
        <ColdEmailModal
          contact={emailTarget}
          onClose={() => setEmailTarget(null)}
          onSent={() => setEmailTarget(null)}
        />
      )}
    </div>
  );
}

function LeadList({
  leads,
  onRemoveLead,
  onSendEmail,
}: {
  leads: LeadRecord[];
  onRemoveLead: (id: string) => void;
  onSendEmail: (c: TargetContact) => void;
}) {
  if (leads.length === 0) {
    return (
      <div className="glass rounded-xl py-16 text-center">
        <Users className="w-10 h-10 text-ink-500 mx-auto mb-3" />
        <p className="text-sm text-ink-300 font-medium">No leads collected yet</p>
        <p className="text-xs text-ink-400 mt-1">Add verified contacts here. LinkedIn search can help you find real people; SAM.gov lists opportunities, not bidders.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden scrollbar-thin">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-left">
              <th className="px-4 py-3 font-medium text-ink-300">Company</th>
              <th className="px-4 py-3 font-medium text-ink-300">Contact</th>
              <th className="px-4 py-3 font-medium text-ink-300">Email</th>
              <th className="px-4 py-3 font-medium text-ink-300">Phone</th>
              <th className="px-4 py-3 font-medium text-ink-300">Tender Ref</th>
              <th className="px-4 py-3 font-medium text-ink-300">Source</th>
              <th className="px-4 py-3 font-medium text-ink-300 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-ink-800 hover:bg-ink-800/40 transition-colors">
                <td className="px-4 py-3 font-medium">{l.companyName}</td>
                <td className="px-4 py-3 text-ink-300">{l.contactPerson}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-300">{l.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-300">{l.phone}</td>
                <td className="px-4 py-3 font-mono text-xs text-accent">{l.tenderRef}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    l.source === 'portal' ? 'bg-accent/10 text-accent border-accent/30' : 'bg-ink-700 text-ink-300 border-ink-600'
                  }`}>
                    {l.source === 'manual' ? 'Manual' : l.source === 'portal' ? 'Portal' : 'LinkedIn'}
                  </span>
                  {l.isSampleData && <span className="ml-1 text-[10px] text-warn">Sample</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onSendEmail({
                        id: l.id, tenderId: '', tenderRef: l.tenderRef, tenderTitle: l.tenderTitle || l.tenderRef,
                        companyName: l.companyName, contactPerson: l.contactPerson, title: l.title || '',
                        email: l.email, phone: l.phone, website: l.website || '',
                        category: l.category, portal: l.portal, sourceType: 'bidder',
                      })}
                      disabled={l.isSampleData}
                      title={l.isSampleData ? 'Sample contact — add the verified real contact before sending' : 'Open an email draft'}
                      className="flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/15 px-2.5 py-1.5 text-xs font-medium text-accent transition-all hover:bg-accent/25 disabled:cursor-not-allowed disabled:border-ink-700 disabled:text-ink-500"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{l.isSampleData ? 'Sample only' : 'Email draft'}</span>
                    </button>
                    <button
                      onClick={() => onRemoveLead(l.id)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-bad hover:bg-bad/10 transition-colors"
                      title="Remove lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
