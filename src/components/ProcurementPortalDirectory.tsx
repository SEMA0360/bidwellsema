import { ExternalLink, Globe2 } from 'lucide-react';

const PORTALS = [
  {
    name: 'India — Central Public Procurement',
    region: 'India',
    kind: 'Government tenders',
    url: 'https://eprocure.gov.in/eprocure/app',
    note: 'Central government e-tenders and tender notices.',
  },
  {
    name: 'India — GeM bids',
    region: 'India',
    kind: 'Government marketplace',
    url: 'https://bidplus.gem.gov.in/all-bids',
    note: 'Government e-Marketplace bid and reverse-auction listings.',
  },
  {
    name: 'United Kingdom — Find a Tender',
    region: 'United Kingdom',
    kind: 'Government tenders',
    url: 'https://www.find-tender.service.gov.uk/Search',
    note: 'UK public procurement notices. Some lower-value notices are published on other UK services.',
  },
  {
    name: 'European Union — TED',
    region: 'European Union',
    kind: 'Government tenders',
    url: 'https://ted.europa.eu/en/search/result',
    note: 'Official EU public procurement notices.',
  },
  {
    name: 'CanadaBuys',
    region: 'Canada',
    kind: 'Government tenders',
    url: 'https://canadabuys.canada.ca/en/tender-opportunities',
    note: 'Canadian federal procurement opportunities.',
  },
  {
    name: 'Australia — AusTender',
    region: 'Australia',
    kind: 'Government tenders',
    url: 'https://www.tenders.gov.au/',
    note: 'Australian Government tender opportunities and awarded contracts.',
  },
  {
    name: 'United Nations — UNGM',
    region: 'International',
    kind: 'Multilateral tenders',
    url: 'https://www.ungm.org/Public/Notice',
    note: 'Procurement notices from participating UN organizations.',
  },
  {
    name: 'World Bank',
    region: 'International',
    kind: 'Development projects',
    url: 'https://projects.worldbank.org/en/projects-operations/procurement',
    note: 'Procurement opportunities associated with World Bank-financed projects.',
  },
  {
    name: 'Asian Development Bank',
    region: 'International',
    kind: 'Development projects',
    url: 'https://www.adb.org/business/main',
    note: 'Business opportunities and procurement information for ADB projects.',
  },
  {
    name: 'SAP Business Network',
    region: 'Commercial',
    kind: 'Supplier network',
    url: 'https://www.sap.com/products/spend-management/business-network.html',
    note: 'Commercial buyer-supplier network. Account and buyer invitations may be required.',
  },
  {
    name: 'Dodge Construction Network',
    region: 'Commercial',
    kind: 'Construction intelligence',
    url: 'https://www.construction.com/',
    note: 'Commercial construction project intelligence; search access may require a subscription.',
  },
] as const;

export default function ProcurementPortalDirectory() {
  return (
    <div className="space-y-4">
      <section className="glass rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
            <Globe2 className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Official procurement portals</h3>
            <p className="mt-1 text-xs leading-5 text-ink-400">
              Open each source to search and verify current opportunities. These portals have different coverage and account requirements; Bidwell does not scrape or combine their results here.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {PORTALS.map((portal) => (
          <article key={portal.name} className="glass flex flex-col rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-100">{portal.name}</p>
                <p className="mt-1 text-xs text-accent">{portal.region} · {portal.kind}</p>
              </div>
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/20"
              >
                Open portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-400">{portal.note}</p>
          </article>
        ))}
      </div>

      <p className="text-xs leading-5 text-ink-500">
        State and local opportunities are published on separate government systems and vary by jurisdiction. Always confirm eligibility, deadlines, and notice details on the original portal.
      </p>
    </div>
  );
}
