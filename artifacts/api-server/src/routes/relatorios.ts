import { Router } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, produtosTable, despesasFixasTable, lancamentosTable, fichasTecnicasTable, fichaItensTable, insumosTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";
import { calcTotalFolhaMensal } from "./funcionarios";

const router = Router();

async function calcMargemForProduto(userId: string, row: typeof produtosTable.$inferSelect) {
  const ficha = await db
    .select()
    .from(fichasTecnicasTable)
    .where(and(eq(fichasTecnicasTable.userId, userId), eq(fichasTecnicasTable.produtoId, row.id)))
    .limit(1);

  let cmv = 0;
  if (ficha.length) {
    const itens = await db
      .select({
        quantidade: fichaItensTable.quantidade,
        precoUnitario: insumosTable.precoUnitario,
        fatorCorrecao: insumosTable.fatorCorrecao,
      })
      .from(fichaItensTable)
      .leftJoin(insumosTable, eq(fichaItensTable.insumoId, insumosTable.id))
      .where(and(eq(fichaItensTable.fichaId, ficha[0].id), eq(fichaItensTable.userId, userId)));

    cmv = itens.reduce((sum, i) => sum + Number(i.quantidade) * Number(i.precoUnitario ?? 0) * Number(i.fatorCorrecao ?? 1), 0);
  }

  const preco = Number(row.precoVenda);
  const imposto = preco * Number(row.impostoPct) / 100;
  const taxaCartao = preco * Number(row.taxaCartaoPct) / 100;
  const taxaApp = preco * Number(row.taxaAppPct) / 100;
  const comissao = preco * Number(row.comissaoPct) / 100;
  const margem = preco - cmv - imposto - taxaCartao - taxaApp - comissao;
  const margemPct = preco > 0 ? (margem / preco) * 100 : 0;
  return { cmv, margem, margemPct };
}

router.get("/relatorios/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const [produtos, despesas, lancamentos, fichas, insumos] = await Promise.all([
    db.select().from(produtosTable).where(eq(produtosTable.userId, userId)),
    db.select().from(despesasFixasTable).where(eq(despesasFixasTable.userId, userId)),
    db.select().from(lancamentosTable).where(
      and(eq(lancamentosTable.userId, userId), gte(lancamentosTable.data, firstOfMonth), lte(lancamentosTable.data, today))
    ),
    db.select().from(fichasTecnicasTable).where(eq(fichasTecnicasTable.userId, userId)),
    db.select().from(insumosTable).where(eq(insumosTable.userId, userId)),
  ]);

  const receitaTotal = lancamentos.filter(l => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
  const custoLancamentos = lancamentos.filter(l => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
  const folhaTotal = await calcTotalFolhaMensal(userId);
  const custosTotais = custoLancamentos + despesas.reduce((s, d) => s + Number(d.valor), 0) + folhaTotal;

  const margens = await Promise.all(produtos.map(p => calcMargemForProduto(userId, p)));
  const margemMedia = margens.length > 0 ? margens.reduce((s, m) => s + m.margemPct, 0) / margens.length : 0;
  const resultadoMes = receitaTotal - custosTotais;

  res.json({
    receita_total: receitaTotal,
    custos_totais: custosTotais,
    margem_media: margemMedia,
    resultado_mes: resultadoMes,
    total_produtos: produtos.length,
    total_insumos: insumos.length,
    total_fichas: fichas.length,
  });
});

router.get("/relatorios/top-produtos", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const produtos = await db.select().from(produtosTable).where(eq(produtosTable.userId, userId));
  const withMargens = await Promise.all(produtos.map(async (p) => {
    const { margem, margemPct } = await calcMargemForProduto(userId, p);
    return {
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      preco_venda: Number(p.precoVenda),
      margem_contribuicao: margem,
      margem_pct: margemPct,
    };
  }));
  withMargens.sort((a, b) => b.margem_pct - a.margem_pct);
  res.json(withMargens.slice(0, 10));
});

router.get("/relatorios/alertas-margem", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const produtos = await db.select().from(produtosTable).where(eq(produtosTable.userId, userId));
  const withMargens = await Promise.all(produtos.map(async (p) => {
    const { margemPct } = await calcMargemForProduto(userId, p);
    return { id: p.id, nome: p.nome, margem_pct: margemPct };
  }));
  const alertas = withMargens
    .filter(p => p.margem_pct < 30)
    .map(p => ({
      id: p.id,
      nome: p.nome,
      margem_pct: p.margem_pct,
      nivel: p.margem_pct < 15 ? "critico" : "atencao",
    }))
    .sort((a, b) => a.margem_pct - b.margem_pct);
  res.json(alertas);
});

router.get("/relatorios/fluxo-semanal", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const days: { data: string; receita: number; despesa: number; resultado: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const lancsDia = await db
      .select()
      .from(lancamentosTable)
      .where(and(eq(lancamentosTable.userId, userId), eq(lancamentosTable.data, dateStr)));

    const receita = lancsDia.filter(l => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
    const despesa = lancsDia.filter(l => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
    days.push({ data: dateStr, receita, despesa, resultado: receita - despesa });
  }

  res.json(days);
});

router.get("/relatorios/ponto-equilibrio", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const [despesas, produtos] = await Promise.all([
    db.select().from(despesasFixasTable).where(eq(despesasFixasTable.userId, userId)),
    db.select().from(produtosTable).where(eq(produtosTable.userId, userId)),
  ]);

  const folhaTotal = await calcTotalFolhaMensal(userId);
  const despesasTotal = despesas.reduce((s, d) => s + Number(d.valor), 0) + folhaTotal;
  const margens = await Promise.all(produtos.map(p => calcMargemForProduto(userId, p)));
  const margemMedia = margens.length > 0 ? margens.reduce((s, m) => s + m.margemPct, 0) / margens.length : 0;
  const margemMediaDecimal = margemMedia / 100;
  const lucroDesejado = despesasTotal * 0.2;
  const pontoContabil = margemMediaDecimal > 0 ? despesasTotal / margemMediaDecimal : 0;
  const pontoEconomico = margemMediaDecimal > 0 ? (despesasTotal + lucroDesejado) / margemMediaDecimal : 0;

  const avgPreco = produtos.length > 0
    ? produtos.reduce((s, p) => s + Number(p.precoVenda), 0) / produtos.length
    : 0;
  const unidadesNecessarias = avgPreco > 0 ? pontoContabil / avgPreco : 0;

  res.json({
    despesas_fixas_total: despesasTotal,
    margem_media: margemMedia,
    ponto_contabil: pontoContabil,
    ponto_economico: pontoEconomico,
    unidades_necessarias: unidadesNecessarias,
  });
});

export default router;
