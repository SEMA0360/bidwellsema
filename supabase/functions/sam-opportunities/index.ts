const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function samDate(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${date.getUTCFullYear()}`;
}

function normalizeOpportunity(value: unknown): SamOpportunity | null {
  if (!isRecord(value)) return null;
  const noticeId = stringValue(value.noticeId);
  const title = stringValue(value.title);
  if (!noticeId || !title) return null;

  return {
    noticeId,
    title,
    solicitationNumber: stringValue(value.solicitationNumber) || noticeId,
    agency: stringValue(value.fullParentPathName) || stringValue(value.departmentName) || "Agency not provided",
    postedDate: stringValue(value.postedDate),
    responseDeadline: stringValue(value.responseDeadLine) || null,
    noticeType: stringValue(value.type),
    naicsCode: stringValue(value.naicsCode),
    url: `https://sam.gov/opp/${encodeURIComponent(noticeId)}/view`,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Use POST to search SAM.gov opportunities." }, 405);

  const apiKey = Deno.env.get("SAM_GOV_API_KEY");
  if (!apiKey) {
    return response({ error: "SAM.gov search is not configured. Add SAM_GOV_API_KEY to the Supabase Edge Function secrets." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response({ error: "The search request must contain valid JSON." }, 400);
  }
  if (!isRecord(body)) return response({ error: "The search request is invalid." }, 400);

  if (body.query !== undefined && typeof body.query !== "string") {
    return response({ error: "Search text must be a string." }, 400);
  }
  if (body.offset !== undefined && (typeof body.offset !== "number" || !Number.isInteger(body.offset))) {
    return response({ error: "The requested page offset must be a whole number." }, 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const offset = typeof body.offset === "number" ? body.offset : 0;
  if (query.length > 100) return response({ error: "Search text must be 100 characters or fewer." }, 400);
  if (offset < 0 || offset > 10000) return response({ error: "The requested page is out of range." }, 400);

  const today = new Date();
  const postedFrom = new Date(today);
  postedFrom.setUTCDate(postedFrom.getUTCDate() - 30);
  const url = new URL("https://api.sam.gov/opportunities/v2/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("postedFrom", samDate(postedFrom));
  url.searchParams.set("postedTo", samDate(today));
  url.searchParams.set("limit", "25");
  url.searchParams.set("offset", String(offset));
  if (query) url.searchParams.set("title", query);

  try {
    const result = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!result.ok) {
      console.error("SAM.gov opportunities request failed:", result.status);
      if (result.status === 429) {
        return response({ error: "SAM.gov rate limit reached. Wait a moment and try again." }, 429);
      }
      if (result.status === 401 || result.status === 403) {
        return response({ error: "SAM.gov rejected the API key. Verify the SAM_GOV_API_KEY Edge Function secret." }, 502);
      }
      return response({ error: "SAM.gov could not complete the search. Try again shortly." }, 502);
    }

    const payload: unknown = await result.json();
    if (!isRecord(payload) || !Array.isArray(payload.opportunitiesData)) {
      console.error("SAM.gov returned an unexpected opportunities response.");
      return response({ error: "SAM.gov returned data in an unexpected format." }, 502);
    }

    const opportunities = payload.opportunitiesData
      .map(normalizeOpportunity)
      .filter((item): item is SamOpportunity => item !== null);
    const totalRecords = Number(payload.totalRecords);
    return response({
      opportunities,
      totalRecords: Number.isFinite(totalRecords) ? totalRecords : opportunities.length,
      offset,
    });
  } catch (error) {
    console.error("SAM.gov opportunities request failed:", error);
    return response({ error: "Could not reach SAM.gov. Check the connection and try again." }, 502);
  }
});
