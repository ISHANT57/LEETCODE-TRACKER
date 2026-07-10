import type { Request, Response, NextFunction } from "express";
import { supabase, isSupabaseConfigured } from "../supabase";

// Minimal shape we attach to the request after verifying the token.
export interface AuthedUser {
  id: string;
  email?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

/**
 * Verifies the Supabase access token from the `Authorization: Bearer <token>`
 * header. Rejects with 401 when missing/invalid. Attach to any route (or the
 * whole `/api` router) that should require a signed-in user.
 *
 * Reads currently stay public; to lock the entire API, apply this middleware
 * once with `app.use("/api", requireAuth)` in server/index.ts.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: "Authentication is not configured on the server." });
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }

  req.user = { id: data.user.id, email: data.user.email ?? undefined };
  next();
}
