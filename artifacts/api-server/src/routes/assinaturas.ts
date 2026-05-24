import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, assinaturasTable } from "@workspace/db";
import { requireAuth, getUserId, getUserEmail } from "../middlewares/auth";

const router = Router();

// Emails with permanent premium access (dev/manual grants)
const PREMIUM_EMAILS = new Set(["michelkhodair@gmail.com"]);

router.get("/assinaturas/current", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const email = getUserEmail(req);

  try {
    // Check DB for a stored subscription
    const rows = await db.select().from(assinaturasTable).where(eq(assinaturasTable.userId, userId)).limit(1);

    if (rows.length > 0) {
      const row = rows[0];
      res.json({
        id: row.id,
        plano: row.plano,
        status: row.status,
        valido_ate: row.validoAte,
      });
      return;
    }

    // Fallback: grant premium to whitelisted emails
    if (email && PREMIUM_EMAILS.has(email.toLowerCase())) {
      // Upsert into DB so subsequent calls hit the DB path
      const [inserted] = await db
        .insert(assinaturasTable)
        .values({ userId, plano: "premium", status: "ativo" })
        .onConflictDoUpdate({ target: assinaturasTable.userId, set: { plano: "premium", status: "ativo" } })
        .returning();
      res.json({
        id: inserted.id,
        plano: inserted.plano,
        status: inserted.status,
        valido_ate: inserted.validoAte,
      });
      return;
    }

    res.json({ id: userId, plano: "gratis", status: "ativo", valido_ate: null });
  } catch (err) {
    req.log.error({ err }, "Error fetching assinatura");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
