import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { perfisTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";

const router = Router();

router.get("/perfis/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  try {
    const rows = await db.select().from(perfisTable).where(eq(perfisTable.userId, userId)).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(perfisTable).values({ userId }).returning();
      res.json(created);
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Error fetching perfil");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/perfis/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { nome_completo, nome_negocio, tipo_negocio, cidade_estado, whatsapp, origem } = req.body;
  try {
    const rows = await db.select().from(perfisTable).where(eq(perfisTable.userId, userId)).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(perfisTable).values({
        userId,
        nomeCompleto: nome_completo ?? null,
        nomeNegocio: nome_negocio ?? null,
        tipoNegocio: tipo_negocio ?? null,
        cidadeEstado: cidade_estado ?? null,
        whatsapp: whatsapp ?? null,
        origem: origem ?? null,
      }).returning();
      res.json(created);
      return;
    }
    const [updated] = await db.update(perfisTable)
      .set({
        nomeCompleto: nome_completo ?? rows[0].nomeCompleto,
        nomeNegocio: nome_negocio ?? rows[0].nomeNegocio,
        tipoNegocio: tipo_negocio ?? rows[0].tipoNegocio,
        cidadeEstado: cidade_estado ?? rows[0].cidadeEstado,
        whatsapp: whatsapp ?? rows[0].whatsapp,
        origem: origem ?? rows[0].origem,
        updatedAt: new Date(),
      })
      .where(eq(perfisTable.userId, userId))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating perfil");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
