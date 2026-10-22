import type { AnalysisResult } from '@/types';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ANALYSIS_ERROR = "We couldn't analyze this file. Make sure it's a readable RFP or tender PDF, then try again. If it still fails, contact support.";

async function headers(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in before using AI features.');

  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: SUPABASE_ANON_KEY,
    'X-Client-Info': 'bidwell-web',
  };
}

export async function analyzeRfp(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  const authHeaders = await headers();

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-rfp`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
  } catch {
    throw new Error(ANALYSIS_ERROR);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Your session has expired. Sign in again and retry.');
    }
    if (response.status === 413) {
      throw new Error('This PDF is too large. Upload a PDF no larger than 5 MB.');
    }
    if (response.status === 415) {
      throw new Error('Unsupported file type. Upload a readable PDF RFP or tender document.');
    }
    throw new Error(ANALYSIS_ERROR);
  }

  try {
    const data = await response.json();
    if (data.error) throw new Error(ANALYSIS_ERROR);
    return data as AnalysisResult;
  } catch {
    throw new Error(ANALYSIS_ERROR);
  }
}

export async function regenerateDraft(requirement: string, context?: string): Promise<{ draft: string }> {
  const authHeaders = await headers();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/draft-response`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirement, context }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `Draft generation failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return { draft: data.draft };
}
