import { useState } from 'react';
import type { LinkedInTitle, LinkedInIndustry } from '@/lead-types';
import { TITLE_LABELS, INDUSTRY_LABELS } from '@/lead-types';
import { Search, Linkedin, Copy, Check, ExternalLink } from 'lucide-react';

const TITLE_ALIASES: Record<LinkedInTitle, string[]> = {
  'bid-manager': ['Bid Manager', 'Bids Manager', 'Tender Manager'],
  'proposal-director': ['Proposal Director', 'Director of Proposals', 'Head of Proposals'],
  'director-bd': ['Director of Business Development', 'BD Director', 'VP Business Development'],
  'owner-partner': ['Owner', 'Partner', 'Managing Partner', 'Founder'],
};

export default function LinkedInProspecting() {
  const [title, setTitle] = useState<LinkedInTitle>('bid-manager');
  const [industry, setIndustry] = useState<LinkedInIndustry>('construction');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const aliases = TITLE_ALIASES[title].map((a) => `"${a}"`).join(' OR ');
  const booleanString = `(${aliases}) AND ("${INDUSTRY_LABELS[industry]}")`;
  const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(booleanString)}`;
  const salesNavUrl = `https://www.linkedin.com/sales/search/people?keywords=${encodeURIComponent(booleanString)}`;

  const handleCopy = async () => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(booleanString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError('Copy is unavailable in this browser. Select the search string and copy it manually.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs uppercase tracking-wider text-ink-400 font-medium block mb-1.5">Target Title</label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value as LinkedInTitle)}
              className="w-full glass rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
            >
              {(Object.keys(TITLE_LABELS) as LinkedInTitle[]).map((t) => (
                <option key={t} value={t} className="bg-ink-850">{TITLE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs uppercase tracking-wider text-ink-400 font-medium block mb-1.5">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value as LinkedInIndustry)}
              className="w-full glass rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
            >
              {(Object.keys(INDUSTRY_LABELS) as LinkedInIndustry[]).map((i) => (
                <option key={i} value={i} className="bg-ink-850">{INDUSTRY_LABELS[i]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Boolean Search String */}
        <div className="bg-ink-850/60 border border-ink-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-ink-300">Boolean Search String</span>
            </div>
            <button
              onClick={() => void handleCopy()}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-ok" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <code className="block text-xs font-mono text-accent-glow leading-relaxed break-all">{booleanString}</code>
          {copyError && <p className="mt-2 text-xs text-warn" role="alert">{copyError}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ink-700 text-ink-100 hover:bg-ink-600 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 text-accent" />
              Open in LinkedIn Search
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
            <a
              href={salesNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
              Open in Sales Navigator
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          </div>
        </div>
      </div>

      <p className="rounded-lg border border-ink-700 bg-ink-900/50 p-4 text-xs leading-5 text-ink-400">
        LinkedIn does not provide profile data to this app. Open the official LinkedIn search, verify the people and contact details there, then add verified contacts under My Leads.
      </p>
    </div>
  );
}
