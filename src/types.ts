export type ComplianceStatus = 'compliant' | 'partial' | 'missing' | 'pending';

export interface ComplianceRow {
  id: string;
  requirement: string;
  category: string;
  mandatory: boolean;
  status: ComplianceStatus;
}

export interface DraftResponseItem {
  id: string;
  requirement: string;
  draft: string;
  edited: boolean;
}

export type GapCategory = 'tax' | 'experience' | 'license' | 'certification' | 'insurance' | 'financial' | 'other';

export interface GapItem {
  id: string;
  label: string;
  category: GapCategory;
  uploaded: boolean;
  fileName?: string;
}

export interface Snippet {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  lastUsed?: string;
}

// Knowledge Base / Context Vault
export type KBDocumentType = 'past_bid' | 'accreditation' | 'case_study' | 'policy' | 'cv' | 'other';

export interface KBDocument {
  id: string;
  title: string;
  document_type: KBDocumentType;
  file_name: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  status: 'processing' | 'processed' | 'failed';
  uploaded_at: string;
  chunks?: KBChunk[];
}

export interface KBChunk {
  id: string;
  kb_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
}

// Review Workflow
export type ReviewStage = 'drafted' | 'sme_review' | 'red_team' | 'final_signoff';
export type ReviewStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'changes_requested';

export interface ReviewAssignment {
  id: string;
  requirement_id: string;
  requirement_text: string;
  assigned_to: string;
  assignee_role: string;
  stage: ReviewStage;
  status: ReviewStatus;
  assigned_at: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
}

// Audit Trail
export interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  author: string;
  version: number;
  change_summary: string;
  before_value?: Record<string, unknown>;
  after_value?: Record<string, unknown>;
  ai_prompt_version?: string;
  created_at: string;
}

// Collaboration / RBAC
export type CollaboratorRole = 'admin' | 'bid_manager' | 'reviewer' | 'sme';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
  department?: string;
  active: boolean;
  created_at: string;
}

// Source Attribution for RAG
export interface SourceCitation {
  kb_document_id: string;
  kb_document_title: string;
  chunk_index: number;
  content_snippet: string;
  relevance_score: number;
}

export interface AnalysisResult {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  submissionDeadline: string | null;
  compliance: ComplianceRow[];
  drafts: DraftResponseItem[];
  gaps: GapItem[];
  snippets: Snippet[];
  summary: {
    totalRequirements: number;
    mandatoryCount: number;
    compliantCount: number;
    missingCount: number;
    documentsProvided: number;
    documentsMissing: number;
  };
}

export interface SavedAnalysis {
  id: string;
  file_name: string;
  updated_at: string;
  result: AnalysisResult;
}
