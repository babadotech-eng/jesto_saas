import { Router } from "express";
import { eq, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { perfisTable } from "@workspace/db";
import { requireAuth, getUserId, getUserEmail } from "../middlewares/auth";

const router = Router();

function serializePerfil(row: typeof perfisTable.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    nome_completo: row.nomeCompleto ?? null,
    nome_negocio: row.nomeNegocio ?? null,
    tipo_negocio: row.tipoNegocio ?? null,
    volume_mensal: row.volumeMensal ?? null,
    cidade_estado: row.cidadeEstado ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    cpf_cnpj: row.cpfCnpj ?? null,
    origem: row.origem ?? null,
    logo_url: row.logoUrl ?? null,
    deleted_at: row.deletedAt?.toISOString() ?? null,
    expires_at: row.expiresAt?.toISOString() ?? null,
    created_at: row.createdAt?.toISOString() ?? null,
    updated_at: row.updatedAt?.toISOString() ?? null,
  };
}

router.get("/perfis/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  try {
    const rows = await db.select().from(perfisTable).where(eq(perfisTable.userId, userId)).limit(1);
    const authEmail = getUserEmail(req);
    if (rows.length === 0) {
      const [created] = await db.insert(perfisTable).values({ userId, email: authEmail }).returning();
      res.json(serializePerfil(created));
      return;
    }
    const row = rows[0];
    // Back-fill auth email if profile email is still null
    if (!row.email && authEmail) {
      await db.update(perfisTable).set({ email: authEmail }).where(eq(perfisTable.userId, userId));
      row.email = authEmail;
    }
    if (row.deletedAt) {
      res.status(410).json({ error: "account_deleted", expires_at: row.expiresAt?.toISOString() ?? null });
      return;
    }
    res.json(serializePerfil(row));
  } catch (err) {
    req.log.error({ err }, "Error fetching perfil");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/perfis/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { nome_completo, nome_negocio, tipo_negocio, volume_mensal, cidade_estado, whatsapp, email, cpf_cnpj, origem, logo_url } = req.body;
  try {
    const rows = await db.select().from(perfisTable).where(eq(perfisTable.userId, userId)).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(perfisTable).values({
        userId,
        nomeCompleto: nome_completo ?? null,
        nomeNegocio: nome_negocio ?? null,
        tipoNegocio: tipo_negocio ?? null,
        volumeMensal: volume_mensal ?? null,
        cidadeEstado: cidade_estado ?? null,
        whatsapp: whatsapp ?? null,
        email: email ?? null,
        cpfCnpj: cpf_cnpj ?? null,
        origem: origem ?? null,
        logoUrl: logo_url ?? null,
      }).returning();
      res.json(serializePerfil(created));
      return;
    }
    if (rows[0].deletedAt) {
      res.status(410).json({ error: "account_deleted" });
      return;
    }
    const [updated] = await db.update(perfisTable)
      .set({
        nomeCompleto: nome_completo ?? rows[0].nomeCompleto,
        nomeNegocio: nome_negocio ?? rows[0].nomeNegocio,
        tipoNegocio: tipo_negocio ?? rows[0].tipoNegocio,
        volumeMensal: volume_mensal ?? rows[0].volumeMensal,
        cidadeEstado: cidade_estado ?? rows[0].cidadeEstado,
        whatsapp: whatsapp ?? rows[0].whatsapp,
        email: email !== undefined ? email : rows[0].email,
        cpfCnpj: cpf_cnpj !== undefined ? cpf_cnpj : rows[0].cpfCnpj,
        origem: origem ?? rows[0].origem,
        logoUrl: logo_url !== undefined ? logo_url : rows[0].logoUrl,
        updatedAt: new Date(),
      })
      .where(eq(perfisTable.userId, userId))
      .returning();
    res.json(serializePerfil(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating perfil");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/conta", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  try {
    const [row] = await db.select({ deletedAt: perfisTable.deletedAt })
      .from(perfisTable)
      .where(eq(perfisTable.userId, userId))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Perfil não encontrado" });
      return;
    }
    if (row.deletedAt) {
      res.status(409).json({ error: "Conta já está desativada" });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    await db.update(perfisTable)
      .set({ deletedAt: now, expiresAt, updatedAt: now })
      .where(eq(perfisTable.userId, userId));

    res.json({ ok: true, expires_at: expiresAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error deleting conta");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
