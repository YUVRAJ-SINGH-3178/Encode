import { supabase } from "../lib/supabase";

// Maximum history items to fetch
const MAX_HISTORY_ITEMS = 50;

// Local fallback storage key
const LOCAL_HISTORY_KEY = "encode_local_history_v1";

function readLocalHistory() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_HISTORY_ITEMS);
    return [];
  } catch (err) {
    console.error("Local history read error:", err);
    return [];
  }
}

function writeLocalHistory(items) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      LOCAL_HISTORY_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS))
    );
  } catch (err) {
    console.error("Local history write error:", err);
  }
}

export function saveLocalAnalysis(entry) {
  if (!entry) return;
  const existing = readLocalHistory();
  const withId = {
    id: entry.id || crypto.randomUUID?.() || `${Date.now()}`,
    created_at: entry.created_at || new Date().toISOString(),
    ...entry,
  };
  writeLocalHistory([withId, ...existing]);
}

/**
 * Get the user's analysis history with pagination support
 */
export async function getHistory(limit = MAX_HISTORY_ITEMS) {
  try {
    const { data, error } = await supabase
      .from("analyses")
      .select(
        "id, input_text, judgment, key_factors, tradeoffs, uncertainty, confidence, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching history:", error);

      // Handle specific errors
      if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        return { data: [], error: "Session expired. Please sign in again." };
      }
      if (error.code === "42P01") {
        const local = readLocalHistory();
        return { data: local, error: "Using local history (missing table)." };
      }

      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error("Unexpected history error:", err);
    const local = readLocalHistory();
    return { data: local, error: "Using local history (offline)." };
  }
}

/**
 * Delete a single analysis from history
 */
export async function deleteAnalysis(id) {
  if (!id) {
    throw new Error("Invalid analysis ID");
  }

  try {
    const { error } = await supabase.from("analyses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting analysis:", error);

      if (error.code === "42501") {
        throw new Error("You don't have permission to delete this analysis.");
      }

      throw new Error(error.message || "Failed to delete analysis");
    }

    return { success: true };
  } catch (err) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    console.error("Unexpected delete error:", err);
    // Try local fallback
    const local = readLocalHistory();
    const next = local.filter((item) => item.id !== id);
    writeLocalHistory(next);
    throw new Error("Unable to delete remote analysis; local history updated.");
  }
}

/**
 * Get a single analysis by ID
 */
export async function getAnalysisById(id) {
  if (!id) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching analysis:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Unexpected fetch error:", err);
    const local = readLocalHistory();
    return local.find((item) => item.id === id) || null;
  }
}

/**
 * Clear all history for the current user
 */
export async function clearHistory() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be signed in to clear history.");
    }

    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error clearing history:", error);

      if (error.code === "42501") {
        throw new Error("You don't have permission to clear history.");
      }

      throw new Error(error.message || "Failed to clear history");
    }

    return { success: true };
  } catch (err) {
    if (err.message && !err.message.includes("fetch")) {
      throw err;
    }
    console.error("Unexpected clear error:", err);
    // Clear local fallback
    writeLocalHistory([]);
    throw new Error("Unable to clear remote history; local history cleared.");
  }
}

/**
 * Get history count for the current user
 */
export async function getHistoryCount() {
  try {
    const { count, error } = await supabase
      .from("analyses")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error getting history count:", error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error("Unexpected count error:", err);
    return readLocalHistory().length;
  }
}
