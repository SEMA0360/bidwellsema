import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-3.8-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

interface ExtractedRequirement {
  requirement: string;
  category: string;
  mandatory: boolean;
}

interface DraftItem {
  requirement: string;
  draft: string;
}

interface GapItem {
  label: string;
  category: string;
}

interface AnalysisResult {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  submissionDeadline: string | null;
  compliance: ExtractedRequirement[];
  drafts: DraftItem[];
  gaps: GapItem[];
  snippets: [];
  summary: {
    totalRequirements: number;
    mandatoryCount: number;
    compliantCount: number;
    missingCount: number;
    documentsProvided: number;
    documentsMissing: number;
  };
}

function getSupabaseClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Supabase credentials not configured");
  return createClient(url, serviceKey);
}

async function getApiKey(provider: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ai_provider_keys")
    .select("api_key")
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch ${provider} API key: ${error.message}`);
  if (!data) throw new Error(`${provider.toUpperCase()}_API_KEY is not configured`);
  return data.api_key;
}

async function callGemini(base64Content: string, mimeType: string, fileName: string): Promise<{ compliance: ExtractedRequirement[]; gaps: GapItem[]; submissionDeadline: string | null }> {
  const apiKey = await getApiKey("gemini");

  const prompt = `You are an expert RFP/Tender analyst. Analyze this RFP/tender document and extract:
1. A compliance matrix — list every requirement found. For each, provide:
   - requirement: the exact requirement text
   - category: one of Legal, Financial, Technical, Experience, Quality, Security, Insurance, Personnel, Operations, Compliance, HR
   - mandatory: true if it's a mandatory requirement, false if optional/preferred
  Do not assess bidder readiness; the RFP does not contain the bidder's company qualifications.
2. A gap analysis — list all supporting documents the bidder needs to provide. For each:
   - label: document name (e.g. "Federal Tax Return (2024)")
   - category: one of tax, experience, license, certification, insurance, financial, other
3. The submission deadline as an ISO 8601 date/time, or null if no deadline is clearly stated.

Return ONLY valid JSON in this exact shape:
{"compliance":[{"requirement":"","category":"","mandatory":true}],"gaps":[{"label":"","category":"tax"}],"submissionDeadline":null}

Document: ${fileName}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64Content } },
      ],
    }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const parsed = JSON.parse(text);
  const submissionDeadline = typeof parsed.submissionDeadline === "string" && !Number.isNaN(Date.parse(parsed.submissionDeadline))
    ? new Date(parsed.submissionDeadline).toISOString()
    : null;
  return {
    compliance: Array.isArray(parsed.compliance) ? parsed.compliance : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    submissionDeadline,
  };
}

async function callGroqDrafts(compliance: ExtractedRequirement[]): Promise<DraftItem[]> {
  const apiKey = await getApiKey("groq");

  const requirementsList = compliance.map((c, i) => `${i + 1}. ${c.requirement}`).join("\n");

  const prompt = `You are a professional bid writer. For each requirement below, write a draft response paragraph that a company could adapt for its bid. Do not invent company names, credentials, certifications, clients, metrics, or capabilities. Use clear bracketed placeholders wherever bidder-specific evidence is required. Each response should be 2-4 sentences.

Requirements:
${requirementsList}

Return ONLY valid JSON: an array of objects with "requirement" (the original requirement text) and "draft" (your draft response).`;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are an expert bid writer. Always respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Groq API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no content");

  const parsed = JSON.parse(content);
  const drafts = Array.isArray(parsed) ? parsed : (parsed.drafts ?? parsed.responses ?? []);
  return drafts;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return new Response(JSON.stringify({ error: "Only PDF RFP documents are supported." }), {
        status: 415,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (file.size === 0 || file.size > MAX_UPLOAD_SIZE) {
      return new Response(JSON.stringify({ error: "The PDF must be between 1 byte and 5 MB." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);

    const mimeType = file.type || "application/pdf";

    // Step 1: Gemini — extract compliance matrix and gaps from PDF
    let geminiResult;
    try {
      geminiResult = await callGemini(base64, mimeType, file.name);
    } catch (err) {
      console.error("RFP analysis provider failed:", err);
      return new Response(JSON.stringify({
        error: "We couldn't analyze this PDF right now. Please try again later. If the problem continues, contact support.",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Groq — generate draft responses for extracted requirements
    let drafts: DraftItem[] = [];
    try {
      drafts = await callGroqDrafts(geminiResult.compliance);
    } catch (err) {
      console.error("Draft generation failed during RFP analysis:", err);
    }

    const compliance = geminiResult.compliance.map((c, i) => ({
      id: `cr-${i.toString().padStart(3, "0")}`,
      ...c,
      mandatory: Boolean(c.mandatory),
      status: "pending",
    }));

    const gaps = geminiResult.gaps.map((g, i) => ({
      id: `gp-${i.toString().padStart(3, "0")}`,
      label: g.label,
      category: g.category || "other",
      uploaded: false,
    }));

    const mandatoryCount = compliance.filter((c) => c.mandatory).length;
    const compliantCount = compliance.filter((c) => c.status === "compliant").length;
    const missingCount = compliance.filter((c) => c.status === "missing").length;

    const result: AnalysisResult = {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      submissionDeadline: geminiResult.submissionDeadline,
      compliance,
      drafts: drafts.map((d, i) => ({
        id: `dr-${i.toString().padStart(3, "0")}`,
        requirement: d.requirement,
        draft: d.draft,
        edited: false,
      })),
      gaps,
      snippets: [],
      summary: {
        totalRequirements: compliance.length,
        mandatoryCount,
        compliantCount,
        missingCount,
        documentsProvided: 0,
        documentsMissing: gaps.length,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RFP analysis request failed:", err);
    return new Response(JSON.stringify({ error: "We couldn't process this PDF. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
