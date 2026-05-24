import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, insumosTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";
import { CreateInsumoBody, UpdateInsumoBody, UpdateInsumoParams, DeleteInsumoParams } from "@workspace/api-zod";

const router = Router();

function serializeInsumo(r: typeof insumosTable.$inferSelect) {
  return {
    id: r.id,
    nome: r.nome,
    unidade: r.unidade,
    preco_unitario: Number(r.precoUnitario),
    fator_correcao: Number(r.fatorCorrecao),
    peso_bruto: r.pesoBruto !== null ? Number(r.pesoBruto) : null,
    peso_liquido: r.pesoLiquido !== null ? Number(r.pesoLiquido) : null,
    fornecedor: r.fornecedor ?? null,
    embalagem: r.embalagem ?? null,
    created_at: r.createdAt?.toISOString() ?? null,
  };
}

router.get("/insumos", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select()
    .from(insumosTable)
    .where(eq(insumosTable.userId, userId))
    .orderBy(desc(insumosTable.createdAt));

  res.json(rows.map(serializeInsumo));
});

router.post("/insumos", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateInsumoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db.insert(insumosTable).values({
    userId,
    nome: b.nome,
    unidade: b.unidade,
    precoUnitario: String(b.preco_unitario),
    fatorCorrecao: String(b.fator_correcao),
    pesoBruto: b.peso_bruto !== undefined && b.peso_bruto !== null ? String(b.peso_bruto) : null,
    pesoLiquido: b.peso_liquido !== undefined && b.peso_liquido !== null ? String(b.peso_liquido) : null,
    fornecedor: b.fornecedor ?? null,
    embalagem: b.embalagem ?? null,
  }).returning();

  res.status(201).json(serializeInsumo(row));
});

router.put("/insumos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = UpdateInsumoParams.parse(req.params);
  const parsed = UpdateInsumoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db
    .update(insumosTable)
    .set({
      nome: b.nome,
      unidade: b.unidade,
      precoUnitario: String(b.preco_unitario),
      fatorCorrecao: String(b.fator_correcao),
      pesoBruto: b.peso_bruto !== undefined && b.peso_bruto !== null ? String(b.peso_bruto) : null,
      pesoLiquido: b.peso_liquido !== undefined && b.peso_liquido !== null ? String(b.peso_liquido) : null,
      fornecedor: b.fornecedor ?? null,
      embalagem: b.embalagem ?? null,
    })
    .where(and(eq(insumosTable.id, id), eq(insumosTable.userId, userId)))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  res.json(serializeInsumo(row));
});

router.delete("/insumos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = DeleteInsumoParams.parse(req.params);
  await db.delete(insumosTable).where(and(eq(insumosTable.id, id), eq(insumosTable.userId, userId)));
  res.status(204).send();
});

export default router;
