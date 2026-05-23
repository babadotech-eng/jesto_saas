import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, fichasTecnicasTable, fichaItensTable, produtosTable, insumosTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";
import {
  CreateFichaBody,
  UpdateFichaBody,
  UpdateFichaParams,
  DeleteFichaParams,
  GetFichaParams,
  AddFichaItemBody,
  AddFichaItemParams,
  UpdateFichaItemBody,
  UpdateFichaItemParams,
  DeleteFichaItemParams,
} from "@workspace/api-zod";

const router = Router();

async function getFichaWithCmv(userId: string, fichaId: string) {
  const [ficha] = await db
    .select()
    .from(fichasTecnicasTable)
    .where(and(eq(fichasTecnicasTable.id, fichaId), eq(fichasTecnicasTable.userId, userId)));
  if (!ficha) return null;

  const [produto] = await db
    .select({ nome: produtosTable.nome })
    .from(produtosTable)
    .where(eq(produtosTable.id, ficha.produtoId));

  const itens = await db
    .select({
      id: fichaItensTable.id,
      insumoId: fichaItensTable.insumoId,
      quantidade: fichaItensTable.quantidade,
      nome: insumosTable.nome,
      unidade: insumosTable.unidade,
      precoUnitario: insumosTable.precoUnitario,
      fatorCorrecao: insumosTable.fatorCorrecao,
    })
    .from(fichaItensTable)
    .leftJoin(insumosTable, eq(fichaItensTable.insumoId, insumosTable.id))
    .where(and(eq(fichaItensTable.fichaId, fichaId), eq(fichaItensTable.userId, userId)));

  const cmvTotal = itens.reduce((sum, item) => {
    return sum + Number(item.quantidade) * Number(item.precoUnitario ?? 0) * Number(item.fatorCorrecao ?? 1);
  }, 0);

  return {
    id: ficha.id,
    produto_id: ficha.produtoId,
    produto_nome: produto?.nome ?? null,
    rendimento: ficha.rendimento ? Number(ficha.rendimento) : null,
    unidade_rendimento: ficha.unidadeRendimento,
    cmv_total: cmvTotal,
    itens: itens.map(i => ({
      id: i.id,
      insumo_id: i.insumoId,
      insumo_nome: i.nome ?? null,
      unidade: i.unidade ?? null,
      preco_unitario: i.precoUnitario ? Number(i.precoUnitario) : null,
      fator_correcao: i.fatorCorrecao ? Number(i.fatorCorrecao) : null,
      quantidade: Number(i.quantidade),
      custo_item: Number(i.quantidade) * Number(i.precoUnitario ?? 0) * Number(i.fatorCorrecao ?? 1),
    })),
    created_at: ficha.createdAt?.toISOString() ?? null,
  };
}

router.get("/fichas", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const fichas = await db
    .select()
    .from(fichasTecnicasTable)
    .where(eq(fichasTecnicasTable.userId, userId))
    .orderBy(desc(fichasTecnicasTable.createdAt));

  const result = await Promise.all(fichas.map(async (f) => {
    const [produto] = await db
      .select({ nome: produtosTable.nome })
      .from(produtosTable)
      .where(eq(produtosTable.id, f.produtoId));

    const itens = await db
      .select({
        quantidade: fichaItensTable.quantidade,
        precoUnitario: insumosTable.precoUnitario,
        fatorCorrecao: insumosTable.fatorCorrecao,
      })
      .from(fichaItensTable)
      .leftJoin(insumosTable, eq(fichaItensTable.insumoId, insumosTable.id))
      .where(eq(fichaItensTable.fichaId, f.id));

    const cmvTotal = itens.reduce((sum, item) => {
      return sum + Number(item.quantidade) * Number(item.precoUnitario ?? 0) * Number(item.fatorCorrecao ?? 1);
    }, 0);

    return {
      id: f.id,
      produto_id: f.produtoId,
      produto_nome: produto?.nome ?? null,
      rendimento: f.rendimento ? Number(f.rendimento) : null,
      unidade_rendimento: f.unidadeRendimento,
      cmv_total: cmvTotal,
      created_at: f.createdAt?.toISOString() ?? null,
    };
  }));

  res.json(result);
});

router.post("/fichas", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateFichaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;

  const [row] = await db.insert(fichasTecnicasTable).values({
    userId,
    produtoId: b.produto_id,
    rendimento: b.rendimento ? String(b.rendimento) : null,
    unidadeRendimento: b.unidade_rendimento ?? null,
  }).returning();

  res.status(201).json({
    id: row.id,
    produto_id: row.produtoId,
    produto_nome: null,
    rendimento: row.rendimento ? Number(row.rendimento) : null,
    unidade_rendimento: row.unidadeRendimento,
    cmv_total: 0,
    created_at: row.createdAt?.toISOString() ?? null,
  });
});

router.get("/fichas/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = GetFichaParams.parse(req.params);
  const data = await getFichaWithCmv(userId, id);
  if (!data) { res.status(404).json({ error: "Not found" }); return; }
  res.json(data);
});

router.put("/fichas/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = UpdateFichaParams.parse(req.params);
  const parsed = UpdateFichaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;

  const [row] = await db
    .update(fichasTecnicasTable)
    .set({
      produtoId: b.produto_id,
      rendimento: b.rendimento ? String(b.rendimento) : null,
      unidadeRendimento: b.unidade_rendimento ?? null,
    })
    .where(and(eq(fichasTecnicasTable.id, id), eq(fichasTecnicasTable.userId, userId)))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    id: row.id,
    produto_id: row.produtoId,
    produto_nome: null,
    rendimento: row.rendimento ? Number(row.rendimento) : null,
    unidade_rendimento: row.unidadeRendimento,
    cmv_total: 0,
    created_at: row.createdAt?.toISOString() ?? null,
  });
});

router.delete("/fichas/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = DeleteFichaParams.parse(req.params);
  await db.delete(fichaItensTable).where(and(eq(fichaItensTable.fichaId, id), eq(fichaItensTable.userId, userId)));
  await db.delete(fichasTecnicasTable).where(and(eq(fichasTecnicasTable.id, id), eq(fichasTecnicasTable.userId, userId)));
  res.status(204).send();
});

router.post("/fichas/:id/itens", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = AddFichaItemParams.parse(req.params);
  const parsed = AddFichaItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;

  const [row] = await db.insert(fichaItensTable).values({
    userId,
    fichaId: id,
    insumoId: b.insumo_id,
    quantidade: String(b.quantidade),
  }).returning();

  res.status(201).json({
    id: row.id,
    ficha_id: row.fichaId,
    insumo_id: row.insumoId,
    quantidade: Number(row.quantidade),
  });
});

router.put("/fichas/:id/itens/:itemId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { itemId } = UpdateFichaItemParams.parse(req.params);
  const parsed = UpdateFichaItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;

  const [row] = await db
    .update(fichaItensTable)
    .set({ insumoId: b.insumo_id, quantidade: String(b.quantidade) })
    .where(and(eq(fichaItensTable.id, itemId), eq(fichaItensTable.userId, userId)))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: row.id, ficha_id: row.fichaId, insumo_id: row.insumoId, quantidade: Number(row.quantidade) });
});

router.delete("/fichas/:id/itens/:itemId", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { itemId } = DeleteFichaItemParams.parse(req.params);
  await db.delete(fichaItensTable).where(and(eq(fichaItensTable.id, itemId), eq(fichaItensTable.userId, userId)));
  res.status(204).send();
});

export default router;
