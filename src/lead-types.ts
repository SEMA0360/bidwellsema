export type Portal = 'sam-gov' | 'manual';

export type TenderCategory =
  | 'civil-construction'
  | 'highway-road'
  | 'it-infrastructure'
  | 'defense'
  | 'medical-supply';

export type Region =
  | 'north' | 'south' | 'east' | 'west' | 'pan-india'
  | 'usa' | 'uk' | 'eu' | 'canada' | 'australia' | 'global';

export interface TargetContact {
  id: string;
  tenderId: string;
  tenderRef: string;
  tenderTitle: string;
  companyName: string;
  contactPerson: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  category: TenderCategory;
  portal: Portal;
  sourceType: 'bidder' | 'pre-bid' | 'awardee';
  isSampleData?: boolean;
  mayEmail?: boolean;
}

export type LinkedInTitle = 'bid-manager' | 'proposal-director' | 'director-bd' | 'owner-partner';
export type LinkedInIndustry = 'construction' | 'infrastructure' | 'defense' | 'it-services';

export interface LeadRecord {
  id: string;
  companyName: string;
  contactPerson: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  tenderRef: string;
  tenderTitle: string;
  category: TenderCategory;
  portal: Portal;
  source: 'portal' | 'linkedin' | 'manual';
  sourceType: string;
  addedAt: string;
  isSampleData?: boolean;
  mayEmail?: boolean;
  draftSubject?: string;
  draftBody?: string;
}

export const PORTAL_LABELS: Record<Portal, string> = {
  'sam-gov': 'SAM.gov',
  manual: 'Manually added',
};

export const CATEGORY_LABELS: Record<TenderCategory, string> = {
  'civil-construction': 'Construction',
  'highway-road': 'Highway / Road Works',
  'it-infrastructure': 'IT Infrastructure',
  'defense': 'Defense',
  'medical-supply': 'Medical Supplies',
};

export const REGION_LABELS: Record<Region, string> = {
  'north': 'North India',
  'south': 'South India',
  'east': 'East India',
  'west': 'West India',
  'pan-india': 'Pan India',
  'usa': 'United States',
  'uk': 'United Kingdom',
  'eu': 'European Union',
  'canada': 'Canada',
  'australia': 'Australia',
  'global': 'Global',
};

export const TITLE_LABELS: Record<LinkedInTitle, string> = {
  'bid-manager': 'Bid Manager',
  'proposal-director': 'Proposal Director',
  'director-bd': 'Director of Business Development',
  'owner-partner': 'Owner / Partner',
};

export const INDUSTRY_LABELS: Record<LinkedInIndustry, string> = {
  'construction': 'Construction',
  'infrastructure': 'Infrastructure',
  'defense': 'Defense',
  'it-services': 'IT Services',
};
