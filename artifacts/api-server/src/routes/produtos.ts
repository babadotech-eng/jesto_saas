import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, produtosTable, fichaItensTable, insumosTable, fichasTecnicasTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";
import {
  CreateProdutoBody,
  UpdateProdutoBody,
  UpdateProdutoParams,
  DeleteProdutoParams,
  GetProdutoParams,
} from "@workspace/api-zod";

const router = Router();

function calcMargem(row: typeof produtosTable.$inferSelect, cmv: number) {
  const preco = Number(row.precoVenda);
  const imposto = preco * Number(row.impostoPct) / 100;
  const taxaCartao = preco * Number(row.taxaCartaoPct) / 100;
  const taxaApp = preco * Number(row.taxaAppPct) / 100;
  const comissao = preco * Number(row.comissaoPct) / 100;
  const taxaVr = preco * Number(row.taxaVrPct) / 100;
  const maoObra = Number(row.custoMaoObra);
  const frete = Number(row.frete);
  const margem = preco - cmv - maoObra - frete - imposto - taxaCartao - taxaApp - comissao - taxaVr;
  const margemPct = preco > 0 ? (margem / preco) * 100 : 0;
  return { margem, margemPct };
}

async function getCmvForProduto(userId: string, produtoId: string): Promise<number> {
  const ficha = await db
    .select()
    .from(fichasTecnicasTable)
    .where(and(eq(fichasTecnicasTable.userId, userId), eq(fichasTecnicasTable.produtoId, produtoId)))
    .limit(1);

  if (!ficha.length) return 0;

  const itens = await db
    .select({
      quantidade: fichaItensTable.quantidade,
      precoUnitario: insumosTable.precoUnitario,
      fatorCorrecao: insumosTable.fatorCorrecao,
    })
    .from(fichaItensTable)
    .leftJoin(insumosTable, eq(fichaItensTable.insumoId, insumosTable.id))
    .where(and(eq(fichaItensTable.userId, userId), eq(fichaItensTable.fichaId, ficha[0].id)));

  return itens.reduce((sum, item) => {
    return sum + Number(item.quantidade) * Number(item.precoUnitario ?? 0) * Number(item.fatorCorrecao ?? 1);
  }, 0);
}

function serializeProduto(row: typeof produtosTable.$inferSelect, cmv: number) {
  const { margem, margemPct } = calcMargem(row, cmv);
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    preco_venda: Number(row.precoVenda),
    custo_mao_obra: Number(row.custoMaoObra),
    frete: Number(row.frete),
    imposto_pct: Number(row.impostoPct),
    taxa_cartao_pct: Number(row.taxaCartaoPct),
    taxa_app_pct: Number(row.taxaAppPct),
    comissao_pct: Number(row.comissaoPct),
    taxa_vr_pct: Number(row.taxaVrPct),
    cmv,
    margem_contribuicao: margem,
    margem_pct: margemPct,
    created_at: row.createdAt?.toISOString() ?? null,
  };
}

router.get("/produtos", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const rows = await db
    .select()
    .from(produtosTable)
    .where(eq(produtosTable.userId, userId))
    .orderBy(desc(produtosTable.createdAt));

  const result = await Promise.all(rows.map(async (row) => {
    const cmv = await getCmvForProduto(userId, row.id);
    return serializeProduto(row, cmv);
  }));

  res.json(result);
});

router.post("/produtos", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = CreateProdutoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const b = parsed.data;
  const [row] = await db.insert(produtosTable).values({
    userId,
    nome: b.nome,
    categoria: b.categoria ?? null,
    precoVenda: String(b.preco_venda),
    custoMaoObra: String(b.custo_mao_obra),
    frete: String(b.frete),
    impostoPct: String(b.imposto_pct),
    taxaCartaoPct: String(b.taxa_cartao_pct),
    taxaAppPct: String(b.taxa_app_pct),
    comissaoPct: String(b.comissao_pct),
    taxaVrPct: String(b.taxa_vr_pct),
  }).returning();

  res.status(201).json(serializeProduto(row, 0));
});

router.get("/produtos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = GetProdutoParams.parse(req.params);
  const [row] = await db
    .select()
    .from(produtosTable)
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const cmv = await getCmvForProduto(userId, row.id);
  res.json(serializeProduto(row, cmv));
});

router.put("/produtos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = UpdateProdutoParams.parse(req.params);
  const parsed = UpdateProdutoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const b = parsed.data;
  const [row] = await db
    .update(produtosTable)
    .set({
      nome: b.nome,
      categoria: b.categoria ?? null,
      precoVenda: String(b.preco_venda),
      custoMaoObra: String(b.custo_mao_obra),
      frete: String(b.frete),
      impostoPct: String(b.imposto_pct),
      taxaCartaoPct: String(b.taxa_cartao_pct),
      taxaAppPct: String(b.taxa_app_pct),
      comissaoPct: String(b.comissao_pct),
      taxaVrPct: String(b.taxa_vr_pct),
    })
    .where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)))
    .returning();

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const cmv = await getCmvForProduto(userId, row.id);
  res.json(serializeProduto(row, cmv));
});

router.delete("/produtos/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { id } = DeleteProdutoParams.parse(req.params);
  await db.delete(produtosTable).where(and(eq(produtosTable.id, id), eq(produtosTable.userId, userId)));
  res.status(204).send();
});

export default router;
