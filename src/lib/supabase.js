import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

// Validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (supabaseUrl && !isValidUrl(supabaseUrl)) {
  console.error("⚠️ Invalid VITE_SUPABASE_URL format");
}

// Create Supabase client with production-ready config
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
    global: {
      headers: {
        "x-client-info": "encode-app/1.0.0",
      },
    },
    db: {
      schema: "public",
    },
  }
);

// Health check function
export async function checkConnection() {
  try {
    const { error } = await supabase
      .from("analyses")
      .select("count", { count: "exact", head: true });
    if (error && !error.message.includes("permission denied")) {
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

// Check if Supabase is properly configured
export function isConfigured() {
  return supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl);
}
