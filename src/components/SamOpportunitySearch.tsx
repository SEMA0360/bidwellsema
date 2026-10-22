import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Loader2, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  agency: string;
  postedDate: string;
  responseDeadline: string | null;
  noticeType: string;
  naicsCode: string;
  url: string;
}

interface SearchResponse {
  opportunities: SamOpportunity[];
  totalRecords: number;
  offset: number;
}

const PAGE_SIZE = 25;

async function getErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Error) {
    if ('context' in error && error.context instanceof Response) {
      const body: unknown = await error.context.clone().json().catch(() => null);
      if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
        return body.error;
      }
    }
    return error.message;
  }
  return 'SAM.gov search failed. Please try again.';
}

export default function SamOpportunitySearch() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [opportunities, setOpportunities] = useState<SamOpportunity[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchOpportunities = useCallback(async (searchText: string, nextOffset: number) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<SearchResponse>('sam-opportunities', {
        body: { query: searchText, offset: nextOffset },
      });
      if (invokeError) {
        const body = invokeError.context instanceof Response
          ? await invokeError.context.clone().json().catch(() => null) as unknown
          : null;
        const serverMessage = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
          ? body.error
          : invokeError.message;
        throw new Error(serverMessage);
      }
      if (!data || !Array.isArray(data.opportunities) || typeof data.totalRecords !== 'number') {
        throw new Error('SAM.gov returned an invalid search response.');
      }
      setOpportunities(data.opportunities);
      setTotalRecords(data.totalRecords);
      setOffset(nextOffset);
      setSubmittedQuery(searchText);
    } catch (searchError) {
      setError(await getErrorMessage(searchError));
      setOpportunities([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void searchOpportunities('', 0);
  }, [searchOpportunities]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchOpportunities(query.trim(), 0);
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Not listed';
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <section className="glass rounded-xl p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Live U.S. federal opportunities</h3>
          <p className="mt-1 text-xs leading-5 text-ink-400">
            Direct search of SAM.gov notices posted in the last 30 days. Results are opportunities, not bidder contacts; verify deadlines and requirements on SAM.gov.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search opportunity titles</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              maxLength={100}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search opportunity titles (optional)"
              className="w-full rounded-lg border border-ink-700 bg-ink-900/60 py-2 pl-9 pr-3 text-sm placeholder:text-ink-400 focus:border-accent/50 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/30 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search SAM.gov
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void searchOpportunities(submittedQuery, offset)}
            aria-label="Refresh SAM.gov results"
            className="flex items-center justify-center rounded-lg border border-ink-700 px-3 py-2 text-ink-300 hover:bg-ink-800 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </form>
      </section>

      {error && <p className="rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm text-bad" role="alert">{error}</p>}

      <section className="glass overflow-hidden rounded-xl">
        {loading && opportunities.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading live SAM.gov notices…
          </div>
        ) : opportunities.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-400">
            {error ? 'No live results are available until the search succeeds.' : 'No matching SAM.gov opportunities were found in the last 30 days.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-700 text-left">
                    <th className="px-4 py-3 font-medium text-ink-300">Notice</th>
                    <th className="px-4 py-3 font-medium text-ink-300">Opportunity</th>
                    <th className="px-4 py-3 font-medium text-ink-300">Agency</th>
                    <th className="px-4 py-3 font-medium text-ink-300">Posted</th>
                    <th className="px-4 py-3 font-medium text-ink-300">Response deadline</th>
                    <th className="px-4 py-3 font-medium text-ink-300">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opportunity) => (
                    <tr key={opportunity.noticeId} className="border-b border-ink-800 hover:bg-ink-800/40">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-accent">
                        {opportunity.solicitationNumber}
                      </td>
                      <td className="min-w-64 px-4 py-3">
                        <p className="font-medium leading-snug">{opportunity.title}</p>
                        <p className="mt-1 text-xs text-ink-400">
                          {[opportunity.noticeType, opportunity.naicsCode && `NAICS ${opportunity.naicsCode}`].filter(Boolean).join(' · ') || 'Notice type not listed'}
                        </p>
                      </td>
                      <td className="min-w-48 px-4 py-3 text-xs text-ink-300">{opportunity.agency}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-300">{formatDate(opportunity.postedDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-300">{formatDate(opportunity.responseDeadline)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a
                          href={opportunity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          Open notice <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-ink-700 px-4 py-3 text-xs text-ink-400">
              <span>{totalRecords.toLocaleString()} matching SAM.gov notices</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loading || offset === 0}
                  onClick={() => void searchOpportunities(submittedQuery, Math.max(0, offset - PAGE_SIZE))}
                  className="rounded border border-ink-700 px-3 py-1.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={loading || offset + PAGE_SIZE >= totalRecords}
                  onClick={() => void searchOpportunities(submittedQuery, offset + PAGE_SIZE)}
                  className="rounded border border-ink-700 px-3 py-1.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
      <p className="text-xs text-ink-500">
        Data provided by SAM.gov. Bidwell does not receive bidder lists or procurement officer email addresses from this search.
      </p>
    </div>
  );
}
