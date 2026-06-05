import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db, assinaturasTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

interface AuthRequest extends Request {
  userId: string;
  userEmail: string | null;
}

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

  (req as AuthRequest).userId = data.user.id;
  (req as AuthRequest).userEmail = data.user.email ?? null;
  next();
}

export function getUserId(req: Request): string {
  return (req as AuthRequest).userId;
}

export function getUserEmail(req: Request): string | null {
  return (req as AuthRequest).userEmail ?? null;
}

const PLAN_ORDER = ["gratis", "pro", "premium"] as const;
type PlanKey = typeof PLAN_ORDER[number];

/**
 * requirePlan("pro")     — requires pro or premium
 * requirePlan("premium") — requires premium only
 * Must be used after requireAuth.
 */
export function requirePlan(minPlan: PlanKey) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const rows = await db
      .select({ plano: assinaturasTable.plano })
      .from(assinaturasTable)
      .where(eq(assinaturasTable.userId, userId))
      .limit(1);
    const plano = (rows[0]?.plano ?? "gratis") as PlanKey;
    if (PLAN_ORDER.indexOf(plano) < PLAN_ORDER.indexOf(minPlan)) {
      res.status(403).json({ error: "plan_required", minPlan });
      return;
    }
    next();
  };
}
