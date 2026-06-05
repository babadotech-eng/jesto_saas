import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, lancamentosTable } from "@workspace/db";
import { requireAuth, requirePlan, getUserId } from "../middlewares/auth";
import { CreateLancamentoBody, UpdateLancamentoBody, UpdateLancamentoParams, DeleteLancamentoParams } from "@workspace/api-zod";

const router = Router();
const premiumOnly = requirePlan("premium");

router.get("/lancamentos", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select()
    .from(lancamentosTable)
    .where(eq(lancamentosTable.userId, userId))
    .orderBy(desc(lancamentosTable.data));

  res.json(rows.map(r => ({
    id: r.id,
    descricao: r.descricao,
    tipo: r.tipo,
    valor: Number(r.valor),
    data: r.data,
    categoria: r.categoria ?? null,
    created_at: r.createdAt?.toISOString() ?? null,
  })));
});

router.post("/lancamentos", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateLancamentoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db.insert(lancamentosTable).values({
    userId,
    descricao: b.descricao,
    tipo: b.tipo,
    valor: String(b.valor),
    data: b.data,
    categoria: b.categoria ?? null,
  }).returning();

  res.status(201).json({
    id: row.id,
    descricao: row.descricao,
    tipo: row.tipo,
    valor: Number(row.valor),
    data: row.data,
    categoria: row.categoria ?? null,
    created_at: row.createdAt?.toISOString() ?? null,
  });
});

router.put("/lancamentos/:id", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = UpdateLancamentoParams.parse(req.params);
  const parsed = UpdateLancamentoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db
    .update(lancamentosTable)
    .set({ descricao: b.descricao, tipo: b.tipo, valor: String(b.valor), data: b.data, categoria: b.categoria ?? null })
    .where(and(eq(lancamentosTable.id, id), eq(lancamentosTable.userId, userId)))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: row.id,
    descricao: row.descricao,
    tipo: row.tipo,
    valor: Number(row.valor),
    data: row.data,
    categoria: row.categoria ?? null,
    created_at: row.createdAt?.toISOString() ?? null,
  });
});

router.delete("/lancamentos/:id", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = DeleteLancamentoParams.parse(req.params);
  await db.delete(lancamentosTable).where(and(eq(lancamentosTable.id, id), eq(lancamentosTable.userId, userId)));
  res.status(204).send();
});

export default router;
