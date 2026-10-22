import { useState, useEffect } from 'react';
import type { AnalysisResult, ReviewAssignment, ReviewStage, ReviewStatus, Collaborator, CollaboratorRole } from '@/types';
import { GatedExportButton } from './PaywallOverlay';
import { supabase } from '@/lib/supabase';
import {
  UserPlus, Users, CheckCircle2, Clock, XCircle, AlertCircle,
  ArrowRight, Trash2, Mail, Bell, ShieldCheck, FileCheck2,
  Loader2, UserCog, Crown, Lock
} from 'lucide-react';

interface ReviewWorkflowProps {
  result: AnalysisResult;
  isPro: boolean;
  onUpgrade: () => void;
}

const STAGES: { id: ReviewStage; label: string; icon: typeof FileCheck2; color: string }[] = [
  { id: 'drafted', label: 'Drafted', icon: FileCheck2, color: 'text-ink-300' },
  { id: 'sme_review', label: 'SME Review', icon: UserCog, color: 'text-warn' },
  { id: 'red_team', label: 'Red Team', icon: ShieldCheck, color: 'text-accent' },
  { id: 'final_signoff', label: 'Final Sign-off', icon: CheckCircle2, color: 'text-ok' },
];

const STATUS_CONFIG: Record<ReviewStatus, { label: string; icon: typeof Clock; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-ink-300', bg: 'bg-ink-800', border: 'border-ink-600' },
  in_progress: { label: 'In Progress', icon: Loader2, color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-ok', bg: 'bg-ok/10', border: 'border-ok/30' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30' },
  changes_requested: { label: 'Changes Requested', icon: AlertCircle, color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30' },
};

const ROLE_LABELS: Record<CollaboratorRole, string> = {
  admin: 'Admin',
  bid_manager: 'Bid Manager',
  reviewer: 'Reviewer',
  sme: 'Subject Matter Expert',
};

const FREE_REVIEW_LIMIT = 3;

export default function ReviewWorkflow({ result, isPro, onUpgrade }: ReviewWorkflowProps) {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [newCollab, setNewCollab] = useState({ name: '', email: '', role: 'sme' as CollaboratorRole, department: '' });
  const [assignModal, setAssignModal] = useState<{ requirementId: string; requirementText: string } | null>(null);
  const [selectedCollab, setSelectedCollab] = useState('');
  const [selectedStage, setSelectedStage] = useState<ReviewStage>('sme_review');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [collabRes, assignRes] = await Promise.all([
        supabase.from('collaborators').select('*').eq('active', true),
        supabase.from('review_assignments').select('*'),
      ]);

      if (collabRes.data) setCollaborators(collabRes.data as Collaborator[]);
      if (assignRes.data) setAssignments(assignRes.data as ReviewAssignment[]);
    } catch {
      // tables exist but may be empty
    }
    setLoading(false);
  };

  const handleAddCollab = async () => {
    if (!newCollab.name || !newCollab.email) return;
    const id = `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const collab: Collaborator = {
      id,
      name: newCollab.name,
      email: newCollab.email,
      role: newCollab.role,
      department: newCollab.department || undefined,
      active: true,
      created_at: new Date().toISOString(),
    };
    setCollaborators((prev) => [...prev, collab]);
    setNewCollab({ name: '', email: '', role: 'sme', department: '' });
    setShowAddCollab(false);
    try {
      await supabase.from('collaborators').insert(collab);
    } catch { /* offline mode */ }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedCollab) return;
    const collab = collaborators.find((c) => c.id === selectedCollab);
    if (!collab) return;
    const assignment: ReviewAssignment = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requirement_id: assignModal.requirementId,
      requirement_text: assignModal.requirementText,
      assigned_to: collab.name,
      assignee_role: collab.role,
      stage: selectedStage,
      status: 'pending',
      assigned_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    setAssignments((prev) => [...prev, assignment]);
    setAssignModal(null);
    setSelectedCollab('');
    try {
      await supabase.from('review_assignments').insert(assignment);
    } catch { /* offline mode */ }
  };

  const handleStatusChange = async (id: string, status: ReviewStatus) => {
    setAssignments((prev) => prev.map((a) =>
      a.id === id ? { ...a, status, completed_at: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : undefined } : a
    ));
    try {
      await supabase.from('review_assignments').update({
        status,
        completed_at: ['approved', 'rejected'].includes(status) ? new Date().toISOString() : null,
      }).eq('id', id);
    } catch { /* offline mode */ }
  };

  const handleDelete = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    try { await supabase.from('review_assignments').delete().eq('id', id); } catch { /* offline */ }
  };

  const handleRemoveCollab = async (id: string) => {
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    try { await supabase.from('collaborators').delete().eq('id', id); } catch { /* offline */ }
  };

  const stageProgress = STAGES.map((s) => {
    const stageAssignments = assignments.filter((a) => a.stage === s.id);
    const approved = stageAssignments.filter((a) => a.status === 'approved').length;
    return { ...s, total: stageAssignments.length, approved };
  });

  const visibleAssignments = isPro ? assignments : assignments.slice(0, FREE_REVIEW_LIMIT);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-accent animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stage Progress Bar */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          Review Pipeline
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stageProgress.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                s.total > 0 ? 'bg-ink-850/60 border-ink-600' : 'bg-ink-900/40 border-ink-800'
              }`}>
                <s.icon className={`w-4 h-4 ${s.total > 0 ? s.color : 'text-ink-600'}`} />
                <div>
                  <p className="text-xs font-medium">{s.label}</p>
                  <p className="text-[10px] text-ink-400">
                    {s.approved}/{s.total} approved
                  </p>
                </div>
              </div>
              {i < stageProgress.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-ink-600 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Collaborators */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Team Members ({collaborators.length})
          </h3>
          <button
            onClick={() => setShowAddCollab(!showAddCollab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </button>
        </div>

        {showAddCollab && (
          <div className="mb-4 p-3 rounded-lg bg-ink-850/60 border border-ink-700 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={newCollab.name}
                onChange={(e) => setNewCollab({ ...newCollab, name: e.target.value })}
                placeholder="Full name"
                className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              />
              <input
                value={newCollab.email}
                onChange={(e) => setNewCollab({ ...newCollab, email: e.target.value })}
                placeholder="email@company.com"
                className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={newCollab.role}
                onChange={(e) => setNewCollab({ ...newCollab, role: e.target.value as CollaboratorRole })}
                className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
              >
                {(Object.keys(ROLE_LABELS) as CollaboratorRole[]).map((r) => (
                  <option key={r} value={r} className="bg-ink-850">{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <input
                value={newCollab.department}
                onChange={(e) => setNewCollab({ ...newCollab, department: e.target.value })}
                placeholder="Department (optional)"
                className="bg-ink-900/60 border border-ink-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <button
              onClick={handleAddCollab}
              disabled={!newCollab.name || !newCollab.email}
              className="w-full py-2 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50"
            >
              Add Team Member
            </button>
          </div>
        )}

        {collaborators.length === 0 ? (
          <p className="text-xs text-ink-400 text-center py-4">No team members yet. Add collaborators to assign review tasks.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-850/60 border border-ink-700">
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-accent">{c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-ink-400 truncate">{ROLE_LABELS[c.role]}{c.department ? ` · ${c.department}` : ''}</p>
                </div>
                <button
                  onClick={() => handleRemoveCollab(c.id)}
                  className="p-1 rounded text-ink-400 hover:text-bad transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-accent" />
            Review Assignments ({assignments.length})
          </h3>
          <GatedExportButton
            onExport={() => {
              const csv = ['Requirement,Assigned To,Role,Stage,Status,Due Date'];
              assignments.forEach((a) => csv.push(`"${a.requirement_text.replace(/"/g, '""')}",${a.assigned_to},${a.assignee_role},${a.stage},${a.status},${a.due_date || ''}`));
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url; link.download = 'review-assignments.csv'; link.click();
              URL.revokeObjectURL(url);
            }}
            onUpgrade={onUpgrade}
            isPro={isPro}
            label="Export"
            format=".csv"
          />
        </div>

        {/* Unassigned requirements */}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-ink-400 font-medium mb-2">Unassigned Requirements</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {result.compliance.filter((c) => !assignments.some((a) => a.requirement_id === c.id)).slice(0, 10).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setAssignModal({ requirementId: c.id, requirementText: c.requirement });
                  setSelectedStage('sme_review');
                }}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg bg-ink-850/40 border border-ink-700 hover:border-accent/30 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-ink-500 shrink-0" />
                <span className="text-xs text-ink-300 truncate flex-1">{c.requirement}</span>
                <UserPlus className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Active assignments */}
        {visibleAssignments.length === 0 ? (
          <p className="text-xs text-ink-400 text-center py-4">No review assignments yet. Click an unassigned requirement to assign it.</p>
        ) : (
          <div className="space-y-2">
            {visibleAssignments.map((a) => {
              const sc = STATUS_CONFIG[a.status];
              const stage = STAGES.find((s) => s.id === a.stage);
              return (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-ink-850/60 border border-ink-700">
                  <div className={`w-8 h-8 rounded-lg ${sc.bg} border ${sc.border} flex items-center justify-center shrink-0`}>
                    <sc.icon className={`w-4 h-4 ${sc.color} ${a.status === 'in_progress' ? 'animate-spin-slow' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{a.requirement_text}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {a.assigned_to}
                      </span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.5 rounded-md ${stage?.color || 'text-ink-400'}`}>{stage?.label}</span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.5 rounded-md ${sc.color}`}>{sc.label}</span>
                      {a.due_date && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            Due {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(a.id, 'approved')}
                        className="p-1.5 rounded-md text-ok hover:bg-ok/10 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {a.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(a.id, 'rejected')}
                        className="p-1.5 rounded-md text-bad hover:bg-bad/10 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    {a.status !== 'changes_requested' && (
                      <button
                        onClick={() => handleStatusChange(a.id, 'changes_requested')}
                        className="p-1.5 rounded-md text-warn hover:bg-warn/10 transition-colors"
                        title="Request changes"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 rounded-md text-ink-400 hover:text-bad transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isPro && assignments.length > FREE_REVIEW_LIMIT && (
          <div className="mt-3 glass rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-accent/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs text-ink-300">
                <span className="font-medium text-ink-100">{assignments.length - FREE_REVIEW_LIMIT} more assignments</span> are locked. Upgrade for unlimited review tracking.
              </p>
            </div>
            <button onClick={onUpgrade} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-ink-950 hover:bg-accent/90 transition-colors whitespace-nowrap">
              <Crown className="w-3.5 h-3.5" /> Unlock All
            </button>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative glass rounded-2xl w-full max-w-md p-5 shadow-card animate-slide-up">
            <h3 className="font-semibold text-sm mb-1">Assign for Review</h3>
            <p className="text-xs text-ink-400 mb-4 line-clamp-2">{assignModal.requirementText}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-ink-400 font-medium block mb-1.5">Assign To</label>
                <select
                  value={selectedCollab}
                  onChange={(e) => setSelectedCollab(e.target.value)}
                  className="w-full bg-ink-850/60 border border-ink-700 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent/50"
                >
                  <option value="" className="bg-ink-850">Select team member…</option>
                  {collaborators.map((c) => (
                    <option key={c.id} value={c.id} className="bg-ink-850">{c.name} — {ROLE_LABELS[c.role]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-ink-400 font-medium block mb-1.5">Review Stage</label>
                <div className="flex gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStage(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedStage === s.id ? 'bg-accent/15 text-accent border border-accent/30' : 'text-ink-300 border border-ink-700 hover:border-ink-600'
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAssignModal(null)} className="flex-1 py-2.5 rounded-lg text-sm text-ink-300 border border-ink-700 hover:bg-ink-800 transition-colors">Cancel</button>
              <button
                onClick={handleAssign}
                disabled={!selectedCollab}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors disabled:opacity-50"
              >
                Assign & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
