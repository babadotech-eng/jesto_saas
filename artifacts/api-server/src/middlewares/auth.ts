import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.VITE_SUPABASE_URL!;
const supabaseUrl = (() => {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl;
  }
})();
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  (req as Request & { userId: string }).userId = data.user.id;
  next();
}

export function getUserId(req: Request): string {
  return (req as Request & { userId: string }).userId;
}
