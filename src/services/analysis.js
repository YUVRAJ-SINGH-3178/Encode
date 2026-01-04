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
      "observations",
      "tradeoff",
      "limitations",
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
        "This doesn't look like an ingredient list. Paste what you see on the package.",
      observations: [
        {
          observation: "Nothing to go on",
          why: "Without actual ingredients, there's no way to frame what kind of product this is.",
        },
      ],
      tradeoff:
        "Pasting real ingredients gives you clarity; skipping that step leaves you guessing.",
      limitations:
        "Can't determine product type, purpose, or what kind of decision this represents.",
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

  const observations = [];

  // Ingredient count observation
  if (ingredientCount > 15) {
    observations.push({
      observation: "Long ingredient list",
      why: `Around ${ingredientCount} ingredients suggests this is built for convenience and shelf life rather than simplicity.`,
    });
  } else if (ingredientCount <= 5) {
    observations.push({
      observation: "Short, simple list",
      why: `Only about ${ingredientCount} ingredients — this looks like a relatively basic product.`,
    });
  }

  if (sweetenerMatches.length > 1) {
    observations.push({
      observation: "Multiple sweetening agents",
      why: "Using more than one sweetener often points to a product designed around taste and cost balance.",
    });
  } else if (sweetenerMatches.length === 1) {
    observations.push({
      observation: "Sweetness is central",
      why: "A sweetener listed suggests taste is a primary feature of this product.",
    });
  }

  if (preservativeMatches.length > 0) {
    observations.push({
      observation: "Built to last on a shelf",
      why: "Preservatives indicate this is designed for a longer shelf life.",
    });
  }

  if (emulsifierMatches.length > 0) {
    observations.push({
      observation: "Texture is engineered",
      why: "Stabilizers and emulsifiers suggest consistency and texture are priorities.",
    });
  }

  if (colorMatches.length > 0) {
    observations.push({
      observation: "Color is added for appeal",
      why: "Added colors point to visual presentation being part of the product's design.",
    });
  }

  if (naturalMatches.length >= 2) {
    observations.push({
      observation: "Positioned as natural",
      why: "Terms like 'organic' or 'natural' suggest the product is marketed toward simpler preferences.",
    });
  }

  // Ensure at least one observation
  if (observations.length === 0) {
    observations.push({
      observation: "Standard product",
      why: "Nothing stands out — this looks like a conventional product.",
    });
  }

  // Limit to 3 observations
  const topObservations = observations.slice(0, 3);

  const confidence =
    topObservations.length >= 3
      ? "medium"
      : topObservations.length >= 2
      ? "low"
      : "low";

  // Build tradeoff sentence based on what was found
  const gains = [];
  const costs = [];

  if (sweetenerMatches.length > 0) gains.push("taste");
  if (preservativeMatches.length > 0) gains.push("shelf life");
  if (emulsifierMatches.length > 0) gains.push("consistent texture");
  if (ingredientCount <= 5) gains.push("simplicity");
  if (ingredientCount > 10) costs.push("simplicity");
  if (preservativeMatches.length > 0 || emulsifierMatches.length > 0)
    costs.push("minimal ingredients");

  const gainText =
    gains.length > 0 ? gains.slice(0, 2).join(" and ") : "convenience";
  const costText =
    costs.length > 0
      ? costs.slice(0, 2).join(" and ")
      : "a shorter ingredient list";
  const tradeoff = `You get ${gainText}; you give up ${costText}.`;

  const productType =
    ingredientCount > 10
      ? "convenience-oriented product"
      : "relatively straightforward product";

  return {
    judgment: `This looks like a ${productType}. (Offline — limited detail available.)`,
    observations: topObservations,
    tradeoff,
    limitations:
      "Can't determine exact quantities, how often you eat this, or how it fits into your day. This is a rough read based on the ingredient list alone.",
    confidence,
  };
}
