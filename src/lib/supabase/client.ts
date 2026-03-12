import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables!");
}

// Determine platform to use separate storage keys for Tauri vs Web.
// This prevents sessions from overwriting each other when both are used simultaneously.
const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;

// Extract project ref for environment isolation
const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1] || "unknown";

const storageKey = isTauri
  ? `sb-pensionsmanager-tauri-auth-${projectRef}`
  : `sb-pensionsmanager-web-auth-${projectRef}`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey,
    autoRefreshToken: true,
    persistSession: true,
  },
});
