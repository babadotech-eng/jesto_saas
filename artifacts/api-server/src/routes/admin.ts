import { Router } from "express";
import { eq, ilike, sql, desc, and } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { db, perfisTable, assinaturasTable, promoCodesTable } from "@workspace/db";
import { requireAuth, getUserEmail } from "../middlewares/auth";

const ADMIN_EMAIL = "michelkhodair@gmail.com";
const PLAN_PRICES: Record<string, number> = { gratis: 0, pro: 49, premium: 99 };
const router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const email = getUserEmail(req);
  if (!email || email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }
  next();
}

// ── MODULE 1: STATS ──────────────────────────────────────────────────────────

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

// ── MODULE 2: USERS ───────────────────────────────────────────────────────────

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

// ── MODULE 3: ASSINATURAS ─────────────────────────────────────────────────────

router.get("/admin/assinaturas", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const planoFilter = typeof req.query.plano === "string" ? req.query.plano.trim() : "";
  const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "";

  try {
    const conditions: SQL[] = [];
    if (planoFilter && ["gratis", "pro", "premium"].includes(planoFilter)) {
      conditions.push(sql`COALESCE(${assinaturasTable.plano}, 'gratis') = ${planoFilter}`);
    }
    if (statusFilter && ["ativo", "cancelado", "expirado"].includes(statusFilter)) {
      conditions.push(sql`COALESCE(${assinaturasTable.status}, 'ativo') = ${statusFilter}`);
    }

    const rows = await db
      .select({
        userId: perfisTable.userId,
        email: perfisTable.email,
        nomeCompleto: perfisTable.nomeCompleto,
        plano: sql<string>`COALESCE(${assinaturasTable.plano}, 'gratis')`,
        status: sql<string>`COALESCE(${assinaturasTable.status}, 'ativo')`,
        createdAt: perfisTable.createdAt,
        updatedAt: assinaturasTable.updatedAt,
        validoAte: assinaturasTable.validoAte,
      })
      .from(perfisTable)
      .leftJoin(assinaturasTable, eq(perfisTable.userId, assinaturasTable.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(perfisTable.createdAt));

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "admin list assinaturas error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── MODULE 4: FINANCEIRO ──────────────────────────────────────────────────────

router.get("/admin/financeiro", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const porPlano = await db
      .select({
        plano: assinaturasTable.plano,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(assinaturasTable)
      .where(
        and(
          eq(assinaturasTable.status, "ativo"),
          sql`${assinaturasTable.plano} != 'gratis'`,
        ),
      )
      .groupBy(assinaturasTable.plano);

    const planMap: Record<string, number> = {};
    let mrrAtual = 0;
    for (const row of porPlano) {
      planMap[row.plano] = row.count;
      mrrAtual += row.count * (PLAN_PRICES[row.plano] ?? 0);
    }

    const doze = new Date();
    doze.setMonth(doze.getMonth() - 11);
    doze.setDate(1);
    doze.setHours(0, 0, 0, 0);

    const mrrMensalDb = await db
      .select({
        mes: sql<string>`to_char(date_trunc('month', ${assinaturasTable.createdAt}), 'YYYY-MM')`,
        receita: sql<number>`SUM(CASE WHEN ${assinaturasTable.plano} = 'pro' THEN 49 WHEN ${assinaturasTable.plano} = 'premium' THEN 99 ELSE 0 END)::int`,
      })
      .from(assinaturasTable)
      .where(
        and(
          sql`${assinaturasTable.plano} != 'gratis'`,
          sql`${assinaturasTable.createdAt} >= ${doze.toISOString()}`,
        ),
      )
      .groupBy(sql`date_trunc('month', ${assinaturasTable.createdAt})`)
      .orderBy(sql`date_trunc('month', ${assinaturasTable.createdAt})`);

    const mrrByMonth = new Map(mrrMensalDb.map(r => [r.mes, r.receita]));
    const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const mrrMensal: Array<{ mes: string; mesLabel: string; receita: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      mrrMensal.push({ mes: key, mesLabel: label, receita: mrrByMonth.get(key) ?? 0 });
    }

    const historico = await db
      .select({
        userId: assinaturasTable.userId,
        email: perfisTable.email,
        nomeCompleto: perfisTable.nomeCompleto,
        plano: assinaturasTable.plano,
        status: assinaturasTable.status,
        createdAt: assinaturasTable.createdAt,
        valor: sql<number>`CASE WHEN ${assinaturasTable.plano} = 'pro' THEN 49 WHEN ${assinaturasTable.plano} = 'premium' THEN 99 ELSE 0 END`,
      })
      .from(assinaturasTable)
      .leftJoin(perfisTable, eq(assinaturasTable.userId, perfisTable.userId))
      .where(sql`${assinaturasTable.plano} != 'gratis'`)
      .orderBy(desc(assinaturasTable.createdAt))
      .limit(50);

    res.json({
      mrrAtual,
      receitaPorPlano: {
        pro: { count: planMap["pro"] ?? 0, receita: (planMap["pro"] ?? 0) * 49 },
        premium: { count: planMap["premium"] ?? 0, receita: (planMap["premium"] ?? 0) * 99 },
      },
      mrrMensal,
      historico,
    });
  } catch (err) {
    req.log.error({ err }, "admin financeiro error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ── MODULE 5: PROMO CODES ─────────────────────────────────────────────────────

router.get("/admin/codigos", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const codes = await db
      .select()
      .from(promoCodesTable)
      .orderBy(desc(promoCodesTable.createdAt));
    res.json(codes);
  } catch (err) {
    req.log.error({ err }, "admin list codigos error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/codigos", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { codigo, tipo, desconto, dataInicio, dataExpiracao, limiteUsos } = req.body as {
    codigo?: string;
    tipo?: string;
    desconto?: number;
    dataInicio?: string;
    dataExpiracao?: string | null;
    limiteUsos?: number | null;
  };

  if (!codigo || !tipo || !desconto || !dataInicio) {
    res.status(400).json({ error: "Campos obrigatórios: codigo, tipo, desconto, dataInicio" });
    return;
  }
  if (!["percentual", "fixo"].includes(tipo)) {
    res.status(400).json({ error: "Tipo inválido" });
    return;
  }
  const descontoNum = Number(desconto);
  if (isNaN(descontoNum) || descontoNum <= 0) {
    res.status(400).json({ error: "Desconto deve ser positivo" });
    return;
  }

  try {
    const [inserted] = await db
      .insert(promoCodesTable)
      .values({
        codigo: String(codigo).trim().toUpperCase(),
        tipo: tipo as "percentual" | "fixo",
        desconto: String(descontoNum),
        dataInicio: new Date(dataInicio),
        dataExpiracao: dataExpiracao ? new Date(dataExpiracao) : null,
        limiteUsos: limiteUsos ? Number(limiteUsos) : null,
      })
      .returning();
    res.status(201).json(inserted);
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      res.status(409).json({ error: "Código já existe" });
      return;
    }
    req.log.error({ err }, "admin create promo code error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/admin/codigos/:id/ativo", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const { ativo } = req.body as { ativo?: boolean };

  if (typeof ativo !== "boolean") {
    res.status(400).json({ error: "Campo 'ativo' deve ser boolean" });
    return;
  }

  try {
    await db.update(promoCodesTable).set({ ativo }).where(eq(promoCodesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin toggle promo code error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/codigos/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = String(req.params.id);
  try {
    await db.delete(promoCodesTable).where(eq(promoCodesTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "admin delete promo code error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
