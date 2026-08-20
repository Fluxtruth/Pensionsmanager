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

// Custom fetch wrapper to catch offline / network errors and prevent unhandled TypeError: Failed to fetch exceptions
const safeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    const errorStr = String(err?.message || err || "");
    if (err?.name === "TypeError" || errorStr.includes("Failed to fetch") || errorStr.includes("NetworkError")) {
      console.warn("[Supabase Network] Network fetch failed (offline or server unreachable):", input);
      return new Response(
        JSON.stringify({ error: "network_error", message: "Network fetch failed" }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    throw err;
  }
};

// Prevent Next.js Dev Overlay from crashing on unhandled network errors during Supabase background initialization
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const errorStr = String(event.reason?.message || event.reason || "");
    if (
      errorStr.includes("Failed to fetch") ||
      errorStr.includes("NetworkError") ||
      errorStr.includes("Lock broken") ||
      errorStr.includes("steal") ||
      errorStr.includes("AuthRetryableFetchError")
    ) {
      console.warn("[Supabase] Suppressed offline unhandled rejection:", errorStr);
      event.preventDefault();
    }
  });

  // Supabase's internal `retryable` function explicitly calls `console.error` when a network error (like 503) occurs,
  // which triggers the Next.js Dev Overlay. We suppress it here at module load time.
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorStr = args.map(a => String(a?.message || a?.name || a)).join(' ');
    if (
      errorStr.includes('Failed to fetch') ||
      errorStr.includes('AuthRetryableFetchError') ||
      errorStr.includes('network_error') ||
      errorStr.includes('Lock broken') ||
      errorStr.includes('steal')
    ) {
      console.warn("[Supabase Network] Suppressed internal Supabase auth retry error:", errorStr);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Global error listener for DOMExceptions (like AbortError)
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const errorStr = String(event.error?.message || event.message || "");
    if (
      errorStr.includes("Lock broken") ||
      errorStr.includes("steal") ||
      errorStr.includes("Failed to fetch") ||
      errorStr.includes("AuthRetryableFetchError")
    ) {
      console.warn("[Supabase] Suppressed offline error event:", errorStr);
      event.preventDefault();
    }
  });
}

// Use a singleton pattern to prevent HMR from creating multiple instances of the Supabase client,
// which causes them to fight for navigator.locks and throw "Lock broken by another request with the 'steal' option"
const globalForSupabase = globalThis as unknown as {
  supabaseClient: ReturnType<typeof createClient> | undefined;
};

export const supabase =
  globalForSupabase.supabaseClient ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey,
      autoRefreshToken: true,
      persistSession: true,
      fetch: safeFetch,
      // Disable Web Locks API in development to prevent "Lock broken" AbortErrors
      // caused by React Strict Mode and HMR fast-refreshing the client instances.
      ...(process.env.NODE_ENV !== "production"
        ? { lock: async (name: string, timeout: number, fn: () => Promise<any>) => fn() }
        : {}),
    },
    global: {
      fetch: safeFetch,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseClient = supabase;
}
