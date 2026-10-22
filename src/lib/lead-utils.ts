import type { LeadRecord, TargetContact } from '@/lead-types';
import { PORTAL_LABELS, CATEGORY_LABELS } from '@/lead-types';

function getAppUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://bidwell.netlify.app';
}

export type OutreachChannel = 'gmail' | 'whatsapp' | 'webform';

export interface OutreachMessage {
  subject?: string;
  body: string;
}

export function buildEmailTemplate(name: string, company: string, tenderTitle: string): OutreachMessage {
  const firstName = name.split(' ')[0];
  const appUrl = getAppUrl();
  return {
    subject: `A faster way to respond to RFPs (without the $10k contract)`,
    body: `Try Bidwell: ${appUrl}

Hi ${firstName},

Quick question: How many hours is your team currently spending on manual compliance matrices and drafting RFP responses for enterprise or government bids?

Legacy tools force you into $10,000+ annual contracts and tedious demo calls just to get started. We built Bidwell to automate the heavy lifting so you can submit faster and win more:

Instant AI Generation: Draft compliant, tailored responses in minutes.
Flexible Pricing: Pay as you go ($49/bid) or $360/mo for active teams.
Zero Friction: Start immediately—no forced demos or long-term lock-ins.

If you have an active RFP on your desk, I'd love to show you how much time Bidwell can save you. Worth a quick test on your next bid?

Best,
Alfa D Sema
${appUrl}`,
  };
}

export function buildWhatsAppTemplate(name: string, company: string, tenderTitle: string): OutreachMessage {
  const firstName = name.split(' ')[0];
  const appUrl = getAppUrl();
  return {
    body: `Hi ${firstName}! I noticed ${company} is competing for ${tenderTitle}. Preparing a 50+ page RFP response usually takes 20-60 hours — Bidwell turns that into a 3-hour review with AI-drafted compliance matrices and proposal responses. Would you be open to a free sample draft for your current bid? Explore here: ${appUrl}`,
  };
}

export function buildWebFormTemplate(name: string, company: string, tenderTitle: string): OutreachMessage {
  const firstName = name.split(' ')[0];
  const appUrl = getAppUrl();
  return {
    body: `Hello ${firstName},

We saw that ${company} is bidding for ${tenderTitle}. Bidwell is an AI proposal copilot that extracts compliance matrices and drafts proposal responses in hours, not days.

We would love to offer you a free compliance matrix and initial response draft for your current submission.

Try our platform: ${appUrl}

Best,
SEMA
Founder & Product Lead | Bidwell AI
${appUrl}`,
  };
}

export function buildOutreachMessage(channel: OutreachChannel, contact: TargetContact): OutreachMessage {
  const name = contact.contactPerson;
  const company = contact.companyName;
  const tenderTitle = contact.tenderTitle || contact.tenderRef;
  switch (channel) {
    case 'gmail': return buildEmailTemplate(name, company, tenderTitle);
    case 'whatsapp': return buildWhatsAppTemplate(name, company, tenderTitle);
    case 'webform': return buildWebFormTemplate(name, company, tenderTitle);
  }
}

export function buildGmailUrl(email: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildWhatsAppUrl(phone: string, body: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(body)}`;
}

export function buildLeadsWithDrafts(leads: LeadRecord[]): LeadRecord[] {
  return leads.map((l) => {
    const contact: TargetContact = {
      id: l.id, tenderId: '', tenderRef: l.tenderRef, tenderTitle: l.tenderTitle || l.tenderRef,
      companyName: l.companyName, contactPerson: l.contactPerson, title: l.title || '',
      email: l.email, phone: l.phone, website: l.website || '',
      category: l.category, portal: l.portal, sourceType: 'bidder',
    };
    const email = buildEmailTemplate(l.contactPerson, l.companyName, l.tenderTitle || l.tenderRef);
    return { ...l, draftSubject: email.subject, draftBody: email.body };
  });
}

export function exportLeadsToCSV(leads: LeadRecord[]): void {
  const enriched = buildLeadsWithDrafts(leads);
  const headers = [
    'Company Name', 'Contact Person', 'Title', 'Email', 'Phone', 'Website',
    'Tender Reference', 'Tender Title', 'Category', 'Portal', 'Source',
    'Added At', 'Draft Subject', 'Draft Body',
  ];
  const rows = enriched.map((l) => [
    l.companyName, l.contactPerson, l.title || '', l.email, l.phone, l.website || '',
    l.tenderRef, l.tenderTitle || '', CATEGORY_LABELS[l.category], PORTAL_LABELS[l.portal], l.source,
    new Date(l.addedAt).toLocaleString(),
    l.draftSubject || '', l.draftBody || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bidwell-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
