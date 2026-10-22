import type { AnalysisResult, ComplianceRow, DraftResponseItem, GapItem, Snippet } from '../types';

const COMPLIANCE_SEED: Omit<ComplianceRow, 'id'>[] = [
  { requirement: 'Company registration certificate valid for current fiscal year', category: 'Legal', mandatory: true, status: 'compliant' },
  { requirement: 'ISO 9001 quality management certification', category: 'Quality', mandatory: true, status: 'compliant' },
  { requirement: 'Minimum 5 years of relevant industry experience', category: 'Experience', mandatory: true, status: 'partial' },
  { requirement: 'Annual turnover exceeding $2M for last 3 fiscal years', category: 'Financial', mandatory: true, status: 'missing' },
  { requirement: 'Cybersecurity incident response plan documented', category: 'Security', mandatory: false, status: 'pending' },
  { requirement: 'Key personnel resumes with relevant qualifications', category: 'Personnel', mandatory: true, status: 'compliant' },
  { requirement: 'Proof of professional liability insurance ($5M minimum)', category: 'Insurance', mandatory: true, status: 'missing' },
  { requirement: 'Past performance references from 3 comparable projects', category: 'Experience', mandatory: true, status: 'partial' },
  { requirement: 'Subcontractor management procedure document', category: 'Operations', mandatory: false, status: 'pending' },
  { requirement: 'Environmental compliance policy statement', category: 'Compliance', mandatory: false, status: 'compliant' },
  { requirement: 'Data protection and privacy framework (GDPR/CCPA)', category: 'Security', mandatory: true, status: 'compliant' },
  { requirement: 'Bid bond equivalent to 2% of tender value', category: 'Financial', mandatory: true, status: 'missing' },
  { requirement: 'Project delivery methodology and timeline', category: 'Technical', mandatory: true, status: 'partial' },
  { requirement: 'Diversity and inclusion policy documentation', category: 'HR', mandatory: false, status: 'pending' },
];

const DRAFT_SEED: Omit<DraftResponseItem, 'id' | 'edited'>[] = [
  {
    requirement: 'Company registration certificate valid for current fiscal year',
    draft: 'Bidwell Inc. is a registered corporation (Reg. No. 44-2108831) in good standing under the laws of the State of Delaware, with full fiscal-year validity through December 31, 2026. A certified copy of the registration is attached as Exhibit A.',
  },
  {
    requirement: 'Minimum 5 years of relevant industry experience',
    draft: 'Founded in 2018, Bidwell Inc. has accumulated over 7 years of continuous experience delivering enterprise software procurement solutions. Our portfolio spans 40+ completed engagements across the public and private sector, including three contracts of comparable scope to this tender.',
  },
  {
    requirement: 'Proof of professional liability insurance ($5M minimum)',
    draft: 'Bidwell Inc. maintains a professional liability (Errors & Omissions) insurance policy with Hartford Financial, policy number PR-88210, providing coverage of $5,000,000 per claim and $10,000,000 aggregate. The certificate is attached as Exhibit C.',
  },
  {
    requirement: 'Data protection and privacy framework (GDPR/CCPA)',
    draft: 'Our data protection framework is built on a privacy-by-design architecture compliant with GDPR Article 25 and CCPA requirements. We maintain a documented Data Processing Register, appoint a dedicated Data Protection Officer, and conduct annual DPIA reviews. Full framework documentation is available on request.',
  },
  {
    requirement: 'Project delivery methodology and timeline',
    draft: 'We propose a phased delivery approach: Discovery (Weeks 1-3), Design (Weeks 4-6), Build (Weeks 7-14), UAT (Weeks 15-17), and Cutover (Week 18). Governance includes weekly steering committee reviews and a shared RAID log maintained in our PMO portal.',
  },
];

const GAP_SEED: Omit<GapItem, 'id' | 'uploaded' | 'fileName'>[] = [
  { label: 'Federal Tax Return (2024)', category: 'tax' },
  { label: 'State Tax Return (2024)', category: 'tax' },
  { label: 'Experience Certificate — Project Alpha', category: 'experience' },
  { label: 'Experience Certificate — Project Helios', category: 'experience' },
  { label: 'Business Operating License', category: 'license' },
  { label: 'SOC 2 Type II Certification', category: 'certification' },
  { label: 'Professional Liability Insurance Certificate', category: 'insurance' },
  { label: 'Audited Financial Statements (2023-2024)', category: 'financial' },
  { label: 'Bank Solvency Letter', category: 'financial' },
  { label: 'ISO 27001 Information Security Certificate', category: 'certification' },
];

const SNIPPET_SEED: Omit<Snippet, 'id'>[] = [
  {
    title: 'Company Overview & Registration',
    category: 'Company',
    tags: ['legal', 'registration', 'corporate'],
    content: 'Bidwell Inc. is a registered corporation (Reg. No. 44-2108831) in good standing under the laws of the State of Delaware, with full fiscal-year validity through December 31, 2026. A certified copy of the registration is attached as Exhibit A.',
  },
  {
    title: 'ISO 9001 Quality Management',
    category: 'Certification',
    tags: ['iso', 'quality', 'certification'],
    content: 'Our organization maintains ISO 9001:2015 certification (Certificate No. QMS-2024-1187), audited annually by Bureau Veritas. The certificate covers design, development, delivery, and maintenance of enterprise software solutions. Copy attached as Exhibit B.',
  },
  {
    title: 'Cybersecurity Incident Response',
    category: 'Security',
    tags: ['security', 'incident', 'soc2'],
    content: 'We maintain a documented Cybersecurity Incident Response Plan aligned with NIST SP 800-61 Rev. 2. Our SOC operates 24/7 with a mean time to detect (MTTD) of under 15 minutes and mean time to respond (MTTR) of under 1 hour for critical incidents. Annual tabletop exercises are conducted with all key stakeholders.',
  },
  {
    title: 'Past Performance Reference',
    category: 'Experience',
    tags: ['reference', 'past-performance', 'project'],
    content: 'We have successfully delivered 40+ engagements of comparable scope over the past 7 years. Three representative projects are detailed below with client contact information for verification: Project Alpha ($4.2M, 2023-2024), Project Helios ($6.8M, 2022-2023), and Project Meridian ($3.1M, 2024-2025).',
  },
  {
    title: 'Data Protection & Privacy Framework',
    category: 'Security',
    tags: ['gdpr', 'ccpa', 'privacy', 'data-protection'],
    content: 'Our data protection framework is built on a privacy-by-design architecture compliant with GDPR Article 25 and CCPA requirements. We maintain a documented Data Processing Register, appoint a dedicated Data Protection Officer, and conduct annual DPIA reviews.',
  },
  {
    title: 'Project Delivery Methodology',
    category: 'Technical',
    tags: ['methodology', 'timeline', 'agile', 'delivery'],
    content: 'We propose a phased delivery approach: Discovery (Weeks 1-3), Design (Weeks 4-6), Build (Weeks 7-14), UAT (Weeks 15-17), and Cutover (Week 18). Governance includes weekly steering committee reviews and a shared RAID log maintained in our PMO portal.',
  },
  {
    title: 'Insurance Coverage Statement',
    category: 'Insurance',
    tags: ['insurance', 'liability', 'coverage'],
    content: 'Bidwell Inc. maintains a professional liability (Errors & Omissions) insurance policy with Hartford Financial, policy number PR-88210, providing coverage of $5,000,000 per claim and $10,000,000 aggregate. The certificate is attached as Exhibit C.',
  },
  {
    title: 'Diversity & Inclusion Policy',
    category: 'HR',
    tags: ['diversity', 'inclusion', 'hr', 'policy'],
    content: 'Our Diversity and Inclusion Policy commits to equitable hiring, promotion, and vendor selection practices. We track workforce composition quarterly and maintain a D&I committee that reports to the executive board. Current workforce diversity: 42% women, 38% underrepresented minorities in technical roles.',
  },
];

function uid(prefix: string, i: number): string {
  return `${prefix}-${i.toString().padStart(3, '0')}`;
}

export function analyzeFile(fileName: string, fileSize: number): AnalysisResult {
  const compliance: ComplianceRow[] = COMPLIANCE_SEED.map((r, i) => ({ ...r, id: uid('cr', i) }));
  const drafts: DraftResponseItem[] = DRAFT_SEED.map((d, i) => ({ ...d, id: uid('dr', i), edited: false }));
  const gaps: GapItem[] = GAP_SEED.map((g, i) => ({
    ...g,
    id: uid('gp', i),
    uploaded: i % 4 === 0,
    fileName: i % 4 === 0 ? `${g.label.replace(/\s+/g, '_').toLowerCase()}.pdf` : undefined,
  }));
  const snippets: Snippet[] = SNIPPET_SEED.map((s, i) => ({ ...s, id: uid('sn', i) }));

  const mandatoryCount = compliance.filter((c) => c.mandatory).length;
  const compliantCount = compliance.filter((c) => c.status === 'compliant').length;
  const missingCount = compliance.filter((c) => c.status === 'missing').length;
  const documentsProvided = gaps.filter((g) => g.uploaded).length;

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 21);
  deadline.setHours(23, 59, 0, 0);

  return {
    fileName,
    fileSize,
    uploadedAt: new Date().toISOString(),
    submissionDeadline: deadline.toISOString(),
    compliance,
    drafts,
    gaps,
    snippets,
    summary: {
      totalRequirements: compliance.length,
      mandatoryCount,
      compliantCount,
      missingCount,
      documentsProvided,
      documentsMissing: gaps.length - documentsProvided,
    },
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
