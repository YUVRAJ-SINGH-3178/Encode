// EnCode AI Analysis Edge Function
// Calls LLM with strict reasoning constraints and validates output

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const OPENAI_API_KEY = Deno.env.get("LLM_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Input validation constants
const MIN_INPUT_LENGTH = 10;
const MAX_INPUT_LENGTH = 5000;
const ALLOWED_METHODS = ["POST", "OPTIONS"];

// Validate environment variables at startup
if (!OPENAI_API_KEY) {
  console.error("CRITICAL: LLM_API_KEY is not configured");
}
if (!SUPABASE_URL) {
  console.error("CRITICAL: SUPABASE_URL is not configured");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not configured");
}

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Strict AI system prompt — NON-NEGOTIABLE
const SYSTEM_PROMPT = `You help people make decisions about food products without overthinking.

Your job is to look at an ingredient list as a whole and answer one simple question: what kind of product does this seem to be, and what kind of decision does that imply?

You do NOT analyze nutrition.
You do NOT explain ingredients one by one.
You do NOT make health claims.
You do NOT label products as "good" or "bad."
You do NOT give advice.

You reduce decision fatigue.

────────────────────────
ABSOLUTE LANGUAGE RULES
────────────────────────
You must NOT use the following words or phrases:

- analyze / analysis
- signal / signals / cue / cues
- pattern / patterns
- orient / orientation
- interpret / interpretation
- structural / formulation
- system / model
- highly processed
- unhealthy / healthy
- toxic / inflammatory
- causes / damages
- beneficial / harmful
- recommend / avoid
- should / shouldn't

If any appear in your draft, rewrite before responding.

────────────────────────
INPUT VALIDATION
────────────────────────
FIRST: Validate the input. If the text is NOT a plausible food ingredient list, respond with:
{
  "judgment": "This doesn't look like an ingredient list. Paste what you see on the package.",
  "observations": [{ "observation": "Nothing to go on", "why": "Without actual ingredients, there's no way to frame what kind of product this is." }],
  "tradeoff": "Pasting real ingredients gives you clarity; skipping that step leaves you guessing.",
  "limitations": "Can't determine product type, purpose, or what kind of decision this represents.",
  "confidence": "low"
}

────────────────────────
YOUR APPROACH
────────────────────────
Look at the ingredient list as a whole. Ask yourself:
- Does this seem convenience-driven, indulgent, or relatively simple?
- Is it built for speed and shelf life, or does it suggest something more basic?
- Does the length and complexity tell a story about what kind of product this is?

Then write a calm, neutral framing that helps the user anchor their thinking.

────────────────────────
MANDATORY OUTPUT STRUCTURE
────────────────────────
Return exactly this JSON:

{
  "judgment": "A short, calm sentence or two that frames what kind of product this appears to be. Not a verdict—just a mental anchor. Examples: 'This looks like a convenience-driven snack built for portability and long shelf life.' or 'This appears to be a relatively simple product with a short, recognizable ingredient list.'",
  "observations": [
    {
      "observation": "A plain-language observation about the ingredient list as a whole",
      "why": "Why this observation helps frame the decision"
    }
  ],
  "tradeoff": "One sentence stating what you gain and what you give up by choosing this product. Be neutral—no judgment about which side is better.",
  "limitations": "What cannot be known from the label alone: quantities, how often someone eats this, their intent, how it fits into their overall eating. Always mention these limits.",
  "confidence": "low | medium | high"
}

────────────────────────
OBSERVATIONS GUIDANCE
────────────────────────
Provide 2-3 observations. Keep them plain and human:
- "Short ingredient list with familiar names" — not technical analysis
- "Multiple sweetening agents listed near the top" — not nutrition advice  
- "Built to stay fresh on a shelf for a while" — not a judgment
- "Designed for quick consumption on the go" — not a verdict

Each observation should help the user understand what KIND of product this is, not whether it's "good."

────────────────────────
TRADEOFF GUIDANCE
────────────────────────
State the tradeoff neutrally in one sentence:
- "You get convenience and consistent taste; you give up simplicity."
- "You get a treat that's built to satisfy; you give up something you'd eat every day."
- "You get familiar ingredients and quick prep; you give up variety."

Never imply one choice is better than another.

────────────────────────
LIMITATIONS GUIDANCE
────────────────────────
Always acknowledge what the label cannot tell you:
- How much of each ingredient is in the product
- How often the person eats this kind of thing
- What else they're eating today
- Whether this is a treat, a staple, or a fallback
- Their personal goals or context

This reminds the user that judgment has limits.

────────────────────────
CONFIDENCE RULES
────────────────────────
- High: Product type is obvious (clearly a candy, a basic staple, a sports drink)
- Medium: Most products — the framing is reasonable but not certain
- Low: Ambiguous or unusual ingredient lists

Confidence reflects how clearly the product can be framed, not how "good" or "bad" it is.

────────────────────────
FINAL CHECK (MANDATORY)
────────────────────────
Before responding, verify:
- No banned words are present
- The text sounds like a human, not a machine
- The response helps the user decide what to do next

If any condition fails, rewrite.

Return ONLY valid JSON. No markdown, no code blocks.`;

interface AnalysisRequest {
  input_text: string;
}

interface LLMResponse {
  judgment: string;
  observations: Array<{ observation: string; why: string }>;
  tradeoff: string;
  limitations: string;
  confidence: "low" | "medium" | "high";
}

// Validate LLM response against contract
function validateResponse(data: unknown): data is LLMResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.judgment !== "string") return false;
  if (typeof obj.tradeoff !== "string") return false;
  if (typeof obj.limitations !== "string") return false;
  if (!["low", "medium", "high"].includes(obj.confidence as string))
    return false;

  if (!Array.isArray(obj.observations)) return false;
  for (const obs of obj.observations) {
    if (typeof obs !== "object" || obs === null) return false;
    if (typeof obs.observation !== "string") return false;
    if (typeof obs.why !== "string") return false;
  }

  return true;
}

// Call OpenAI API (can be swapped with Gemini)
async function callLLM(inputText: string): Promise<LLMResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Ingredient list:\n${inputText}` },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  const parsed = JSON.parse(content);

  if (!validateResponse(parsed)) {
    throw new Error("LLM response does not match required schema");
  }

  return parsed;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Method check
  if (!ALLOWED_METHODS.includes(req.method)) {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Environment validation
  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse and validate request body
    let body: AnalysisRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { input_text } = body;

    if (!input_text || typeof input_text !== "string") {
      return new Response(
        JSON.stringify({
          error: "input_text is required and must be a string",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trimmedInput = input_text.trim();

    if (trimmedInput.length < MIN_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Input must be at least ${MIN_INPUT_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: `Input must not exceed ${MAX_INPUT_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Call LLM with retry logic
    let llmResponse: LLMResponse;
    let retries = 0;
    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    while (retries <= MAX_RETRIES) {
      try {
        llmResponse = await callLLM(trimmedInput);
        break;
      } catch (error) {
        lastError = error as Error;
        retries++;
        console.error(`LLM attempt ${retries} failed:`, error);
        if (retries > MAX_RETRIES) {
          return new Response(
            JSON.stringify({
              error:
                "Analysis service temporarily unavailable. Please try again.",
            }),
            {
              status: 503,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retries - 1))
        );
      }
    }

    // 4. Store in database (map new response fields to old column names)
    const { data: savedAnalysis, error: dbError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        input_text: trimmedInput,
        judgment: llmResponse!.judgment,
        key_factors: llmResponse!.observations.map((obs) => ({
          factor: obs.observation,
          explanation: obs.why,
        })),
        tradeoffs: llmResponse!.tradeoff,
        uncertainty: llmResponse!.limitations,
        confidence: llmResponse!.confidence,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Still return the analysis even if storage fails
      return new Response(
        JSON.stringify({
          ...llmResponse!,
          id: null,
          warning: "Analysis generated but could not be saved to history",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Return result with new field names
    const responseData = {
      id: savedAnalysis.id,
      input_text: savedAnalysis.input_text,
      judgment: savedAnalysis.judgment,
      observations: llmResponse!.observations,
      tradeoff: llmResponse!.tradeoff,
      limitations: llmResponse!.limitations,
      confidence: savedAnalysis.confidence,
      created_at: savedAnalysis.created_at,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
