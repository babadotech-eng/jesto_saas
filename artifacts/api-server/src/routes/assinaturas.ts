import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, assinaturasTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";

const router = Router();

router.get("/assinaturas/current", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);

  try {
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

    res.json({ id: userId, plano: "gratis", status: "ativo", valido_ate: null });
  } catch (err) {
    req.log.error({ err }, "Error fetching assinatura");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
