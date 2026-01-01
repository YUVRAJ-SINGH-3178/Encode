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
    saveLocalAnalysis({
      ...data,
      input_text: validation.text,
      user_id: session.user.id,
    });

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
      saveLocalAnalysis({
        ...fallback,
        input_text: validation.text,
        user_id: session.user.id,
      });
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

// Check if input looks like a valid ingredient list
function looksLikeIngredients(text) {
  const lower = text.toLowerCase();
  // Common ingredient-related words
  const ingredientSignals = [
    "water",
    "salt",
    "sugar",
    "flour",
    "oil",
    "acid",
    "flavor",
    "extract",
    "starch",
    "syrup",
    "milk",
    "cream",
    "butter",
    "egg",
    "wheat",
    "soy",
    "corn",
    "rice",
    "vitamin",
    "sodium",
    "calcium",
    "potassium",
    "natural",
    "artificial",
    "modified",
    "hydrolyzed",
    "concentrate",
    "powder",
    "dried",
  ];
  const matchCount = ingredientSignals.filter((s) => lower.includes(s)).length;
  // Also check for comma-separated structure
  const hasCommas = (text.match(/,/g) || []).length >= 2;
  return matchCount >= 2 || (hasCommas && matchCount >= 1);
}

function buildFallbackAnalysis(text) {
  // Check if input is valid
  if (!looksLikeIngredients(text)) {
    return {
      judgment:
        "This does not appear to be a food ingredient list. Please paste ingredients from actual product packaging.",
      key_factors: [
        {
          factor: "invalid input",
          explanation:
            "The provided text does not match the expected format of a food ingredient list.",
        },
      ],
      tradeoffs: "Unable to analyze non-ingredient text.",
      uncertainty: "Cannot determine if this relates to any food product.",
      confidence: "low",
    };
  }

  const lower = text.toLowerCase();
  const ingredientCount = (text.match(/,/g) || []).length + 1;

  const sweeteners = [
    "sugar",
    "fructose",
    "glucose",
    "corn syrup",
    "dextrose",
    "sucralose",
    "acesulfame",
    "aspartame",
    "honey",
    "molasses",
    "stevia",
  ];
  const preservatives = [
    "benzoate",
    "sorbate",
    "nitrite",
    "nitrate",
    "propionate",
    "sulfite",
    "bht",
    "bha",
    "tbhq",
  ];
  const emulsifiers = [
    "lecithin",
    "gum",
    "carrageenan",
    "polysorbate",
    "mono-",
    "di-",
    "xanthan",
    "gellan",
    "pectin",
  ];
  const colors = [
    "red 40",
    "yellow 5",
    "yellow 6",
    "blue 1",
    "caramel color",
    "annatto",
    "beta carotene",
  ];
  const naturalIndicators = [
    "organic",
    "natural flavor",
    "sea salt",
    "cane sugar",
    "whole grain",
  ];

  const sweetenerMatches = sweeteners.filter((s) => lower.includes(s));
  const preservativeMatches = preservatives.filter((s) => lower.includes(s));
  const emulsifierMatches = emulsifiers.filter((s) => lower.includes(s));
  const colorMatches = colors.filter((s) => lower.includes(s));
  const naturalMatches = naturalIndicators.filter((s) => lower.includes(s));

  const factors = [];

  // Ingredient count analysis
  if (ingredientCount > 15) {
    factors.push({
      factor: "complex formulation",
      explanation: `With approximately ${ingredientCount} ingredients, this suggests a highly processed product with multiple functional additives.`,
    });
  } else if (ingredientCount <= 5) {
    factors.push({
      factor: "simple formulation",
      explanation: `Only about ${ingredientCount} ingredients indicates a relatively straightforward, less processed product.`,
    });
  }

  if (sweetenerMatches.length > 1) {
    factors.push({
      factor: "multiple sweeteners",
      explanation: `Contains ${
        sweetenerMatches.length
      } sweetening agents (${sweetenerMatches
        .slice(0, 3)
        .join(
          ", "
        )}), suggesting taste optimization and possibly cost balancing.`,
    });
  } else if (sweetenerMatches.length === 1) {
    factors.push({
      factor: "sweetener presence",
      explanation: `Contains ${sweetenerMatches[0]}, indicating sweetness is a key product attribute.`,
    });
  }

  if (preservativeMatches.length > 0) {
    factors.push({
      factor: "shelf-life focus",
      explanation: `Preservatives present (${preservativeMatches.join(
        ", "
      )}) point to extended shelf-life as a priority.`,
    });
  }

  if (emulsifierMatches.length > 0) {
    factors.push({
      factor: "texture engineering",
      explanation: `Emulsifiers/stabilizers (${emulsifierMatches
        .slice(0, 2)
        .join(
          ", "
        )}) suggest texture consistency and separation prevention goals.`,
    });
  }

  if (colorMatches.length > 0) {
    factors.push({
      factor: "visual appeal",
      explanation: `Color additives indicate visual appearance is prioritized for consumer appeal.`,
    });
  }

  if (naturalMatches.length >= 2) {
    factors.push({
      factor: "natural positioning",
      explanation: `Terms like ${naturalMatches
        .slice(0, 2)
        .join(", ")} suggest marketing toward natural/clean-label preferences.`,
    });
  }

  // Ensure at least one factor
  if (factors.length === 0) {
    factors.push({
      factor: "standard formulation",
      explanation:
        "No strong distinguishing patterns detected; appears to be a conventional product formulation.",
    });
  }

  // Limit to 4 factors
  const topFactors = factors.slice(0, 4);

  const confidence =
    topFactors.length >= 3 ? "medium" : topFactors.length >= 2 ? "low" : "low";

  // Build specific tradeoffs based on what was found
  let tradeoffs = "Balancing ";
  const tradeoffParts = [];
  if (sweetenerMatches.length > 0) tradeoffParts.push("taste appeal");
  if (preservativeMatches.length > 0) tradeoffParts.push("shelf stability");
  if (emulsifierMatches.length > 0) tradeoffParts.push("texture consistency");
  if (naturalMatches.length > 0) tradeoffParts.push("natural positioning");
  if (tradeoffParts.length === 0) tradeoffParts.push("cost and functionality");
  tradeoffs +=
    tradeoffParts.join(", ") + " against simplicity and minimal processing.";

  return {
    judgment: `This appears to be a ${
      ingredientCount > 10 ? "moderately complex" : "relatively simple"
    } formulation. (Offline analysis — connect to get full AI interpretation.)`,
    key_factors: topFactors,
    tradeoffs,
    uncertainty:
      "Full AI analysis unavailable; this is a pattern-based approximation only. Actual product intent may differ.",
    confidence,
  };
}
