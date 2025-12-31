import { supabase } from "../lib/supabase";
import { saveLocalAnalysis } from "./history";

// Minimum ingredient text length
const MIN_INPUT_LENGTH = 10;
const MAX_INPUT_LENGTH = 5000;

/**
 * Validate ingredient input
 */
function validateInput(ingredients) {
  if (!ingredients || typeof ingredients !== "string") {
    return { valid: false, error: "Please enter ingredient text" };
  }

  const trimmed = ingredients.trim();

  if (trimmed.length < MIN_INPUT_LENGTH) {
    return {
      valid: false,
      error: "Please enter a complete ingredient list (at least 10 characters)",
    };
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: "Ingredient list is too long. Please limit to 5000 characters.",
    };
  }

  return { valid: true, text: trimmed };
}

/**
 * Analyze ingredients by calling the Supabase Edge Function
 * With proper error handling and retry logic
 */
export async function analyzeIngredients(ingredients) {
  // Validate input
  const validation = validateInput(ingredients);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Session error:", sessionError);
    throw new Error("Session error. Please sign in again.");
  }

  if (!session) {
    throw new Error(
      "You must be signed in to analyze ingredients. Please sign in and try again."
    );
  }

  // Call Edge Function with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const { data, error } = await supabase.functions.invoke("analyze_product", {
      body: { input_text: validation.text },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (error) {
      console.error("Analysis error:", error);

      // Handle specific error types
      if (error.message?.includes("FunctionsFetchError")) {
        throw new Error(
          "Unable to reach the analysis service. Please check your connection and try again."
        );
      }
      if (error.message?.includes("non-2xx")) {
        throw new Error(
          "Analysis service error. Please try again in a moment."
        );
      }
      if (error.message?.includes("AuthApiError") || error.status === 401) {
        throw new Error("Session expired. Please sign in again.");
      }
      if (error.status === 400) {
        throw new Error(
          error.message || "Invalid request to analysis service."
        );
      }
      if (
        error.message?.includes("401") ||
        error.message?.includes("unauthorized")
      ) {
        throw new Error("Session expired. Please sign in again.");
      }

      throw new Error(
        error.message || "Failed to analyze ingredients. Please try again."
      );
    }

    // Validate response structure
    if (!data || typeof data !== "object") {
      throw new Error(
        "Invalid response from analysis service. Please try again."
      );
    }

    // Ensure required fields exist
    const requiredFields = [
      "judgment",
      "key_factors",
      "tradeoffs",
      "uncertainty",
      "confidence",
    ];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Missing field in response: ${field}`);
        throw new Error("Incomplete analysis response. Please try again.");
      }
    }

    // Persist a local copy for offline history as well
    saveLocalAnalysis({ ...data, input_text: validation.text });

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new Error(
        "Analysis is taking too long. Please try again with a shorter ingredient list."
      );
    }

    const message = err?.message || "";
    const isNetworkish =
      message.includes("Failed to send a request") ||
      message.includes("Failed to fetch") ||
      message.includes("CORS") ||
      message.includes("ERR_FAILED") ||
      message.includes("FunctionsFetchError");

    if (isNetworkish) {
      console.warn("Falling back to local analysis (service unreachable)");
      const fallback = buildFallbackAnalysis(validation.text);
      saveLocalAnalysis({ ...fallback, input_text: validation.text });
      return fallback;
    }

    // If we already surfaced a user-facing message above, rethrow
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }

    console.error("Unexpected analysis error:", err);
    throw new Error(
      "Unable to analyze ingredients. Please check your connection and try again."
    );
  }
}

function buildFallbackAnalysis(text) {
  const lower = text.toLowerCase();
  const sweeteners = [
    "sugar",
    "fructose",
    "glucose",
    "corn syrup",
    "dextrose",
    "sucralose",
    "acesulfame",
    "aspartame",
  ];
  const preservatives = [
    "benzoate",
    "sorbate",
    "nitrite",
    "nitrate",
    "propionate",
  ];
  const emulsifiers = [
    "lecithin",
    "gum",
    "carrageenan",
    "polysorbate",
    "mono-",
    "di-",
  ];

  const hasSweetener = sweeteners.some((s) => lower.includes(s));
  const hasPreservative = preservatives.some((s) => lower.includes(s));
  const hasEmulsifier = emulsifiers.some((s) => lower.includes(s));

  const factors = [];
  if (hasSweetener)
    factors.push({
      factor: "sweeteners",
      explanation:
        "Multiple sweetening agents suggest sweetness balancing and texture goals.",
    });
  if (hasPreservative)
    factors.push({
      factor: "preservation",
      explanation:
        "Presence of preservatives points to shelf-life and stability priorities.",
    });
  if (hasEmulsifier)
    factors.push({
      factor: "emulsifiers/stabilizers",
      explanation:
        "Stabilizers/emulsifiers hint at texture smoothing and separation control.",
    });
  if (factors.length === 0) {
    factors.push({
      factor: "structure",
      explanation:
        "Label is concise; limited signals beyond basic formulation.",
    });
  }

  const confidence = factors.length >= 2 ? "medium" : "low";

  return {
    judgment:
      "This read is a fallback interpretation while the analysis service is offline.",
    key_factors: factors,
    tradeoffs:
      "Balancing taste, shelf life, and texture while keeping ingredients manageable.",
    uncertainty:
      "No model output available; interpretation inferred from simple label patterns only.",
    confidence,
  };
}
