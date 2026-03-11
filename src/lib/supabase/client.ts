import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing!");
}

// Determine platform to use separate storage keys for Tauri vs Web.
// This prevents sessions from overwriting each other when both are used simultaneously.
const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
const storageKey = isTauri
  ? "sb-pensionsmanager-tauri-auth"
  : "sb-pensionsmanager-web-auth";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey,
    autoRefreshToken: true,
    persistSession: true,
  },
});
