import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct";

interface DraftRequest {
  requirement: string;
  context?: string;
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

async function callGroq(requirement: string, context?: string): Promise<string> {
  const apiKey = await getApiKey("groq");

  const contextStr = context ? `\n\nAdditional context from the RFP document:\n${context}` : "";

  const prompt = `You are a professional bid writer. Write a professional, persuasive draft response for the following requirement. Do not invent company names, credentials, certifications, clients, metrics, or capabilities. Use clear bracketed placeholders for bidder-specific facts that were not provided. Write 3-5 sentences.

Requirement: ${requirement}${contextStr}

Return ONLY the draft response text, no JSON or markdown.`;

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: "You are an expert bid writer. Write professional, persuasive draft responses." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
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
  return content.trim();
}

async function callOpenRouter(requirement: string, context?: string): Promise<string> {
  const apiKey = await getApiKey("openrouter");

  const contextStr = context ? `\n\nAdditional context from the RFP document:\n${context}` : "";

  const prompt = `You are a professional bid writer. Write a draft response for the following requirement that a company would submit in their bid. Make it specific, professional, and persuasive — referencing company capabilities, processes, and compliance measures. Write 3-5 sentences.

Requirement: ${requirement}${contextStr}

Return ONLY the draft response text, no JSON or markdown.`;

  const url = "https://openrouter.ai/api/v1/chat/completions";

  const body = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: "You are an expert bid writer. Write professional, persuasive draft responses." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://bidwell.app",
      "X-Title": "Bidwell",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenRouter API error (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content");
  return content.trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { requirement, context } = await req.json() as DraftRequest;

    if (!requirement) {
      return new Response(JSON.stringify({ error: "No requirement provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let draft: string;

    // Try Groq first
    try {
      draft = await callGroq(requirement, context);
    } catch (groqErr) {
      // Fallback to OpenRouter
      try {
        draft = await callOpenRouter(requirement, context);
      } catch (orErr) {
        console.error("Draft generation providers failed:", { groqErr, orErr });
        return new Response(JSON.stringify({
          error: "We couldn't generate a draft right now. Please try again later.",
        }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ draft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Draft generation request failed:", err);
    return new Response(JSON.stringify({ error: "We couldn't generate a draft right now. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
