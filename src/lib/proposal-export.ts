import type { AnalysisResult } from '@/types';

export function exportFullProposal(result: AnalysisResult): void {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    RFP PROPOSAL EXPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Document: ${result.fileName}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Submission Deadline: ${result.submissionDeadline ? new Date(result.submissionDeadline).toLocaleString() : 'Not identified in RFP'}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('  EXECUTIVE SUMMARY');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');
  lines.push(`Total Requirements:     ${result.summary.totalRequirements}`);
  lines.push(`Mandatory Requirements: ${result.summary.mandatoryCount}`);
  lines.push(`Compliant:              ${result.summary.compliantCount}`);
  lines.push(`Missing:                ${result.summary.missingCount}`);
  lines.push(`Documents Provided:     ${result.summary.documentsProvided}`);
  lines.push(`Documents Missing:       ${result.summary.documentsMissing}`);
  lines.push('');

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('  COMPLIANCE MATRIX');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');
  result.compliance.forEach((c, i) => {
    lines.push(`${i + 1}. [${c.status.toUpperCase()}] ${c.requirement}`);
    lines.push(`   Category: ${c.category} | Mandatory: ${c.mandatory ? 'Yes' : 'No'}`);
    lines.push('');
  });

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('  DRAFT RESPONSES');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');
  result.drafts.forEach((d, i) => {
    lines.push(`${i + 1}. ${d.requirement}`);
    lines.push('');
    lines.push(d.draft);
    lines.push('');
    if (d.edited) lines.push('   [Edited by user]');
    lines.push('');
    lines.push('   ────────────────────────────────────────');
    lines.push('');
  });

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('  GAP ANALYSIS');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');
  result.gaps.forEach((g, i) => {
    lines.push(`${i + 1}. [${g.uploaded ? 'PROVIDED' : 'MISSING'}] ${g.label}`);
    lines.push(`   Category: ${g.category}`);
    if (g.uploaded && g.fileName) lines.push(`   File: ${g.fileName}`);
    lines.push('');
  });

  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('  SNIPPET LIBRARY');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('');
  result.snippets.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.title} (${s.category})`);
    lines.push(`   Tags: ${s.tags.join(', ')}`);
    lines.push('');
    lines.push(s.content);
    lines.push('');
    lines.push('   ────────────────────────────────────────');
    lines.push('');
  });

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  END OF PROPOSAL EXPORT');
  lines.push('═══════════════════════════════════════════════════════════════');

  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proposal-${result.fileName.replace(/\.[^.]+$/, '')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
