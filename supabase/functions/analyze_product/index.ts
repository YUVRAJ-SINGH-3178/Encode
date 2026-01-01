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
const SYSTEM_PROMPT = `You are an AI reasoning system that interprets food ingredient labels. Each analysis MUST be unique and specific to the exact ingredients provided.

FIRST: Validate the input. If the text is NOT a plausible food ingredient list (random words, gibberish, unrelated text, code, sentences, questions, etc.), respond with:
{
  "judgment": "This does not appear to be a food ingredient list. Please paste ingredients from actual product packaging.",
  "key_factors": [{ "factor": "invalid input", "explanation": "The provided text does not match the expected format of a food ingredient list. Valid ingredient lists are typically comma-separated items found on product packaging." }],
  "tradeoffs": "Unable to analyze non-ingredient text.",
  "uncertainty": "Cannot determine if this relates to any food product.",
  "confidence": "low"
}

FOR VALID INGREDIENT LISTS — MAKE EACH ANALYSIS UNIQUE:

CRITICAL RULES:
- You provide ORIENTATION, not truth
- You are NOT giving medical advice
- You are NOT explaining ingredients individually
- You are NOT claiming biological effects
- You are NOT authoritative
- EVERY response must be DIFFERENT — reference SPECIFIC ingredients by name
- Mention actual ingredient names from the list in your analysis

LANGUAGE CONSTRAINTS:
- Use varied conditional phrasing: "suggests", "may indicate", "tends to", "points toward", "hints at", "appears to prioritize", "seems oriented toward", "leans toward"
- Avoid medical, nutritional, or causal claims
- Never use words: cause, damage, toxic, inflammatory, disrupt, harm, bad for, unhealthy, healthy
- Focus on structural patterns specific to THIS list

ANALYSIS APPROACH — Examine and comment on:
1. FIRST INGREDIENT: What's the base? (Water? Flour? Meat? Fruit?)
2. LIST LENGTH: Count ingredients — short (≤5) vs long (15+)
3. SWEETENER POSITION: Where do sugars appear? First few = dominant
4. SPECIFIC INGREDIENTS: Name 2-3 notable ones and what they suggest
5. PRESERVATIVES: Which specific ones? (sodium benzoate, potassium sorbate, etc.)
6. ADDITIVES PATTERN: Colors (Red 40, Yellow 5), emulsifiers (lecithin, xanthan gum)
7. NATURAL SIGNALS: "organic", "natural flavor", "sea salt" vs synthetic
8. WHAT'S MISSING: No preservatives? No colors? Short list?

OUTPUT FORMAT (JSON):
{
  "judgment": "ONE specific sentence about THIS product mentioning 1-2 actual ingredients by name. Example: 'With water and high fructose corn syrup leading, this appears to be a sweetened beverage prioritizing...'",
  "key_factors": [
    { "factor": "specific descriptive name", "explanation": "Reference actual ingredients: 'The presence of [specific ingredient] alongside [another ingredient] suggests...'" }
  ],
  "tradeoffs": "Name specific tradeoffs: 'Using [ingredient X] over [alternative] suggests prioritizing [goal] at the expense of [other goal]'",
  "uncertainty": "What specific questions remain: 'The [specific ingredient] source is unclear...' or 'Processing method for [ingredient] unknown...'",
  "confidence": "low" | "medium" | "high"
}

EXAMPLES OF GOOD vs BAD:
BAD (generic): "This formulation suggests processed food characteristics."
GOOD (specific): "Led by enriched wheat flour and sugar, with sodium stearoyl lactylate for texture, this appears to be a commercial baked good prioritizing shelf stability."

BAD: "Contains sweeteners suggesting taste optimization."
GOOD: "The combination of high fructose corn syrup, sucralose, and acesulfame potassium suggests aggressive sweetness engineering at multiple price points."

Provide 2-4 key_factors. Reference ACTUAL ingredient names. Be SPECIFIC.

Confidence levels:
- "high": Clear patterns, 10+ ingredients, recognizable product type
- "medium": Some patterns visible, 5-10 ingredients
- "low": Ambiguous, very short list, or unusual combinations

Return ONLY valid JSON. No markdown.`;

interface AnalysisRequest {
  input_text: string;
}

interface LLMResponse {
  judgment: string;
  key_factors: Array<{ factor: string; explanation: string }>;
  tradeoffs: string;
  uncertainty: string;
  confidence: "low" | "medium" | "high";
}

// Validate LLM response against contract
function validateResponse(data: unknown): data is LLMResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.judgment !== "string") return false;
  if (typeof obj.tradeoffs !== "string") return false;
  if (typeof obj.uncertainty !== "string") return false;
  if (!["low", "medium", "high"].includes(obj.confidence as string))
    return false;

  if (!Array.isArray(obj.key_factors)) return false;
  for (const factor of obj.key_factors) {
    if (typeof factor !== "object" || factor === null) return false;
    if (typeof factor.factor !== "string") return false;
    if (typeof factor.explanation !== "string") return false;
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

    // 4. Store in database
    const { data: savedAnalysis, error: dbError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        input_text: trimmedInput,
        judgment: llmResponse!.judgment,
        key_factors: llmResponse!.key_factors,
        tradeoffs: llmResponse!.tradeoffs,
        uncertainty: llmResponse!.uncertainty,
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

    // 5. Return result
    return new Response(JSON.stringify(savedAnalysis), {
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
