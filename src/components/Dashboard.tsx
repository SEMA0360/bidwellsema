import { useState } from 'react';
import type { AnalysisResult, ComplianceStatus } from '@/types';
import type { TargetContact, LeadRecord } from '@/lead-types';
import DashboardHeader from './DashboardHeader';
import ComplianceMatrix from './ComplianceMatrix';
import DraftResponse from './DraftResponse';
import GapAnalysis from './GapAnalysis';
import FindLeads from './FindLeads';
import Overview from './Overview';
import SnippetLibrary from './SnippetLibrary';
import KnowledgeBase from './KnowledgeBase';
import ResponseWorkspace from './ResponseWorkspace';
import ReviewWorkflow from './ReviewWorkflow';
import AuditTrail from './AuditTrail';
import BidCalendar from './BidCalendar';
import CompetitorIntel from './CompetitorIntel';
import WinThemeManager from './WinThemeManager';
import PricingEstimator from './PricingEstimator';
import PaymentModal from './PaymentModal';
import { ListChecks, Sparkles, ShieldCheck, ArrowLeft, Radar, Crown, LayoutDashboard, FileText, Database, Edit3, GitBranch, History, CalendarDays, Swords, Lightbulb, DollarSign } from 'lucide-react';

interface DashboardProps {
  result: AnalysisResult;
  onReset: () => void;
  onResultChange: (r: AnalysisResult) => void;
  isPro: boolean;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'compliance', label: 'Compliance Matrix', icon: ListChecks },
  { id: 'drafts', label: 'Draft Response', icon: Sparkles },
  { id: 'gaps', label: 'Gap Analysis', icon: ShieldCheck },
  { id: 'knowledge', label: 'Knowledge Base', icon: Database },
  { id: 'workspace', label: 'AI Workspace', icon: Edit3 },
  { id: 'review', label: 'Review Workflow', icon: GitBranch },
  { id: 'audit', label: 'Audit Trail', icon: History },
  { id: 'calendar', label: 'Bid Calendar', icon: CalendarDays },
  { id: 'competitors', label: 'Competitors', icon: Swords },
  { id: 'themes', label: 'Win Themes', icon: Lightbulb },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'snippets', label: 'Snippets', icon: FileText },
  { id: 'leads', label: 'Find Leads', icon: Radar },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Dashboard({ result, onReset, onResultChange, isPro }: DashboardProps) {
  const [tab, setTab] = useState<TabId>('overview');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  const handleStatusChange = (rowId: string, status: ComplianceStatus) => {
    onResultChange({
      ...result,
      compliance: result.compliance.map((r) => (r.id === rowId ? { ...r, status } : r)),
      summary: {
        ...result.summary,
        compliantCount: result.compliance.filter((r) => (r.id === rowId ? status === 'compliant' : r.status === 'compliant')).length,
        missingCount: result.compliance.filter((r) => (r.id === rowId ? status === 'missing' : r.status === 'missing')).length,
      },
    });
  };

  const handleDraftChange = (id: string, text: string) => {
    onResultChange({
      ...result,
      drafts: result.drafts.map((d) => (d.id === id ? { ...d, draft: text, edited: true } : d)),
    });
  };

  const handleGapToggle = (id: string, uploaded: boolean, fileName?: string) => {
    const newGaps = result.gaps.map((g) => (g.id === id ? { ...g, uploaded, fileName } : g));
    const provided = newGaps.filter((g) => g.uploaded).length;
    onResultChange({
      ...result,
      gaps: newGaps,
      summary: { ...result.summary, documentsProvided: provided, documentsMissing: newGaps.length - provided },
    });
  };

  const handleAddLead = (contact: TargetContact, source: 'portal' | 'linkedin' | 'manual') => {
    setLeads((prev) => {
      if (prev.some((l) => l.email === contact.email && l.tenderRef === contact.tenderRef)) return prev;
      return [
        ...prev,
        {
          id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          companyName: contact.companyName,
          contactPerson: contact.contactPerson,
          title: contact.title || '',
          email: contact.email,
          phone: contact.phone,
          website: contact.website || '',
          tenderRef: contact.tenderRef,
          tenderTitle: contact.tenderTitle || contact.tenderRef,
          category: contact.category,
          portal: contact.portal,
          source,
          sourceType: contact.sourceType,
          addedAt: new Date().toISOString(),
          isSampleData: contact.isSampleData ?? true,
          mayEmail: contact.mayEmail ?? false,
        },
      ];
    });
  };

  const handleRemoveLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-ink-950 bg-grid relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <header className="relative z-10 border-b border-ink-800 bg-ink-950/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-accent" />
            </div>
            <span className="font-bold tracking-tight">Bidwell</span>
          </div>
          <div className="flex items-center gap-2">
            {!isPro && (
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-ok/15 text-ok border border-ok/30 hover:bg-ok/25 transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Upgrade</span>
              </button>
            )}
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-ink-300 hover:text-ink-100 hover:bg-ink-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">New document</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <DashboardHeader result={result} />
        <div className="grid grid-cols-2 gap-1 p-1 glass rounded-xl md:grid-cols-7">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex min-w-0 items-center justify-center gap-1 px-1.5 py-2 rounded-lg text-xs font-medium transition-all relative whitespace-nowrap ${
                  active ? 'bg-accent/15 text-accent' : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800/60'
                }`}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
                {t.id === 'leads' && leads.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent">
                    {leads.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          {tab === 'overview' && <Overview result={result} isPro={isPro} onUpgrade={() => setShowPayment(true)} onNavigate={(t) => setTab(t as TabId)} />}
          {tab === 'compliance' && <ComplianceMatrix result={result} onStatusChange={handleStatusChange} isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'drafts' && <DraftResponse result={result} onDraftChange={handleDraftChange} isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'gaps' && <GapAnalysis result={result} onToggle={handleGapToggle} isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'knowledge' && <KnowledgeBase isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'workspace' && <ResponseWorkspace result={result} onDraftChange={handleDraftChange} isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'review' && <ReviewWorkflow result={result} isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'audit' && <AuditTrail isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'calendar' && <BidCalendar deadline={result.submissionDeadline} fileName={result.fileName} />}
          {tab === 'competitors' && <CompetitorIntel />}
          {tab === 'themes' && <WinThemeManager />}
          {tab === 'pricing' && <PricingEstimator />}
          {tab === 'snippets' && <SnippetLibrary snippets={result.snippets} isPro={isPro} onUpgrade={() => setShowPayment(true)} />}
          {tab === 'leads' && (
            <FindLeads
                leads={leads}
                onAddLead={handleAddLead}
                onRemoveLead={handleRemoveLead}
                isPro={isPro}
                onUpgrade={() => setShowPayment(true)}
            />
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
