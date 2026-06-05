import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, despesasFixasTable } from "@workspace/db";
import { requireAuth, requirePlan, getUserId } from "../middlewares/auth";
import { CreateDespesaBody, UpdateDespesaBody, UpdateDespesaParams, DeleteDespesaParams } from "@workspace/api-zod";

const router = Router();
const premiumOnly = requirePlan("premium");

router.get("/despesas", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select()
    .from(despesasFixasTable)
    .where(eq(despesasFixasTable.userId, userId))
    .orderBy(desc(despesasFixasTable.createdAt));

  res.json(rows.map(r => ({
    id: r.id,
    descricao: r.descricao,
    valor: Number(r.valor),
    categoria: r.categoria,
    data: r.data ?? null,
    created_at: r.createdAt?.toISOString() ?? null,
  })));
});

router.post("/despesas", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateDespesaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db.insert(despesasFixasTable).values({
    userId,
    descricao: b.descricao,
    valor: String(b.valor),
    categoria: b.categoria ?? null,
    data: b.data ?? null,
  }).returning();

  res.status(201).json({
    id: row.id,
    descricao: row.descricao,
    valor: Number(row.valor),
    categoria: row.categoria,
    data: row.data ?? null,
    created_at: row.createdAt?.toISOString() ?? null,
  });
});

router.put("/despesas/:id", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = UpdateDespesaParams.parse(req.params);
  const parsed = UpdateDespesaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db
    .update(despesasFixasTable)
    .set({ descricao: b.descricao, valor: String(b.valor), categoria: b.categoria ?? null, data: b.data ?? null })
    .where(and(eq(despesasFixasTable.id, id), eq(despesasFixasTable.userId, userId)))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: row.id,
    descricao: row.descricao,
    valor: Number(row.valor),
    categoria: row.categoria,
    data: row.data ?? null,
    created_at: row.createdAt?.toISOString() ?? null,
  });
});

router.delete("/despesas/:id", requireAuth, premiumOnly, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = DeleteDespesaParams.parse(req.params);
  await db.delete(despesasFixasTable).where(and(eq(despesasFixasTable.id, id), eq(despesasFixasTable.userId, userId)));
  res.status(204).send();
});

export default router;
