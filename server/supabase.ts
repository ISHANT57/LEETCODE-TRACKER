import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// supabase-js constructs a realtime client that needs a global WebSocket.
// Node < 22 has no native WebSocket, which crashes createClient at import time
// (we only use auth.getUser, never realtime). Polyfill from the `ws` package
// when the runtime doesn't provide one, so it works on Node 18/20 too.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === "undefined") {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

// Server-side Supabase client, used only to verify user access tokens
// (supabase.auth.getUser). Uses the same project URL + anon key as the client.
const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[auth] SUPABASE_URL / SUPABASE_ANON_KEY not set — protected routes will reject all requests.",
  );
}

export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "public-anon-key",
  { auth: { persistSession: false, autoRefreshToken: false } },
);
