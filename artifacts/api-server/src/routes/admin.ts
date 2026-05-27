import { Router } from "express";
import { eq, ilike, sql, desc, and } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db, perfisTable, assinaturasTable } from "@workspace/db";
import { requireAuth, getUserEmail } from "../middlewares/auth";

const ADMIN_EMAIL = "michelkhodair@gmail.com";
const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const email = getUserEmail(req);
  if (!email || email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }
  next();
}

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const [totalRow] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(perfisTable);

    const planCounts = await db
      .select({
        plano: sql<string>`COALESCE(${assinaturasTable.plano}, 'gratis')`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(perfisTable)
      .leftJoin(assinaturasTable, eq(perfisTable.userId, assinaturasTable.userId))
      .groupBy(sql`COALESCE(${assinaturasTable.plano}, 'gratis')`);

    const [novosMesRow] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(perfisTable)
      .where(sql`${perfisTable.createdAt} >= date_trunc('month', CURRENT_DATE)`);

    const [ativasRow] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(assinaturasTable)
      .where(eq(assinaturasTable.status, "ativo"));

    const atividades = await db
      .select({
        userId: assinaturasTable.userId,
        plano: assinaturasTable.plano,
        status: assinaturasTable.status,
        updatedAt: assinaturasTable.updatedAt,
        email: perfisTable.email,
        nomeCompleto: perfisTable.nomeCompleto,
      })
      .from(assinaturasTable)
      .leftJoin(perfisTable, eq(assinaturasTable.userId, perfisTable.userId))
      .orderBy(desc(assinaturasTable.updatedAt))
      .limit(10);

    const planMap: Record<string, number> = {};
    for (const row of planCounts) planMap[row.plano] = row.count;

    res.json({
      totalUsuarios: totalRow.total,
      porPlano: {
        gratis: planMap["gratis"] ?? 0,
        pro: planMap["pro"] ?? 0,
        premium: planMap["premium"] ?? 0,
      },
      assinaturasAtivas: ativasRow.count,
      novosMes: novosMesRow.count,
      atividades,
    });
  } catch (err) {
    req.log.error({ err }, "admin stats error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  try {
    const conditions: SQL[] = [];
    if (search) conditions.push(ilike(perfisTable.email, `%${search}%`));

    const users = await db
      .select({
        userId: perfisTable.userId,
        email: perfisTable.email,
        nomeCompleto: perfisTable.nomeCompleto,
        nomeNegocio: perfisTable.nomeNegocio,
        createdAt: perfisTable.createdAt,
        plano: sql<string>`COALESCE(${assinaturasTable.plano}, 'gratis')`,
        statusAssinatura: sql<string>`COALESCE(${assinaturasTable.status}, 'ativo')`,
        planoUpdatedAt: assinaturasTable.updatedAt,
      })
      .from(perfisTable)
      .leftJoin(assinaturasTable, eq(perfisTable.userId, assinaturasTable.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(perfisTable.createdAt));

    res.json(users);
  } catch (err) {
    req.log.error({ err }, "admin list users error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/users/:userId/plano", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const userId = String(req.params.userId);
  const { plano } = req.body as { plano?: string };

  if (!plano || !["gratis", "pro", "premium"].includes(plano)) {
    res.status(400).json({ error: "Plano inválido" });
    return;
  }

  try {
    await db
      .insert(assinaturasTable)
      .values({ userId, plano: plano as "gratis" | "pro" | "premium", status: "ativo" })
      .onConflictDoUpdate({
        target: assinaturasTable.userId,
        set: { plano: plano as "gratis" | "pro" | "premium", status: "ativo", updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin change plan error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/users/:userId/status", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const userId = String(req.params.userId);
  const { status } = req.body as { status?: string };

  if (!status || !["ativo", "cancelado"].includes(status)) {
    res.status(400).json({ error: "Status inválido" });
    return;
  }

  try {
    await db
      .insert(assinaturasTable)
      .values({ userId, plano: "gratis", status: status as "ativo" | "cancelado" })
      .onConflictDoUpdate({
        target: assinaturasTable.userId,
        set: { status: status as "ativo" | "cancelado", updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin change status error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/users/:userId", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const userId = String(req.params.userId);
  try {
    await db.delete(assinaturasTable).where(eq(assinaturasTable.userId, userId));
    await db.delete(perfisTable).where(eq(perfisTable.userId, userId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin delete user error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
