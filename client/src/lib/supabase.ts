import { createClient } from "@supabase/supabase-js";

// Supabase project credentials. These are build-time (VITE_) vars exposed to the
// client bundle — the anon key is safe to ship (it only grants what your RLS
// policies allow). Set them in .env (see .env.example / SUPABASE_AUTH_SETUP.md).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Surfaced in the login screen too; this keeps the failure obvious in dev.
  console.warn(
    "[auth] Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
  );
}

// A single shared client. Falls back to harmless placeholder strings when unset
// so importing modules never throw at load time; auth calls will simply fail
// until real credentials are provided.
export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
