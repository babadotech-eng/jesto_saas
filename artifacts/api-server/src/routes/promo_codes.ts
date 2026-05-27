import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, promoCodesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const PLAN_PRICES: Record<string, number> = { gratis: 0, pro: 49, premium: 99 };

router.post("/promo-codes/validar", async (req, res): Promise<void> => {
  const { codigo, plano, pagamento } = req.body as {
    codigo?: string;
    plano?: string;
    pagamento?: string;
  };

  if (!codigo || !plano) {
    res.status(400).json({ error: "Campos obrigatórios: codigo, plano" });
    return;
  }

  const precoOriginal = PLAN_PRICES[plano] ?? 0;

  try {
    const [code] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.codigo, codigo.trim().toUpperCase()))
      .limit(1);

    if (!code || !code.ativo) {
      res.status(404).json({ error: "Cupom inválido ou inativo" });
      return;
    }

    const now = new Date();
    if (new Date(code.dataInicio) > now) {
      res.status(400).json({ error: "Este cupom ainda não está ativo" });
      return;
    }
    if (code.dataExpiracao && new Date(code.dataExpiracao) < now) {
      res.status(400).json({ error: "Este cupom expirou" });
      return;
    }
    if (code.limiteUsos !== null && code.usosAtuais >= code.limiteUsos) {
      res.status(400).json({ error: "Este cupom já foi totalmente utilizado" });
      return;
    }

    if (code.planosAplicaveis !== "ambos" && code.planosAplicaveis !== plano) {
      const planLabel = code.planosAplicaveis === "pro" ? "Pro" : "Premium";
      res.status(400).json({ error: `Este cupom é válido somente para o plano ${planLabel}` });
      return;
    }

    if (pagamento && code.pagamentoAplicavel !== "ambos" && code.pagamentoAplicavel !== pagamento) {
      const label = code.pagamentoAplicavel === "mensal" ? "mensal" : "anual";
      res.status(400).json({ error: `Este cupom é válido somente para pagamento ${label}` });
      return;
    }

    const desconto = Number(code.desconto);
    let descontoAplicado: number;
    let valorFinal: number;

    if (code.tipo === "percentual") {
      descontoAplicado = precoOriginal * (desconto / 100);
      valorFinal = precoOriginal - descontoAplicado;
    } else {
      descontoAplicado = Math.min(desconto, precoOriginal);
      valorFinal = Math.max(0, precoOriginal - desconto);
    }

    res.json({
      valido: true,
      codeId: code.id,
      desconto,
      tipo: code.tipo,
      descontoAplicado: Math.round(descontoAplicado * 100) / 100,
      valorOriginal: precoOriginal,
      valorFinal: Math.round(valorFinal * 100) / 100,
    });
  } catch (err) {
    req.log.error({ err }, "promo code validate error");
    res.status(500).json({ error: "Erro interno ao validar cupom" });
  }
});

router.post("/promo-codes/aplicar", requireAuth, async (req, res): Promise<void> => {
  const { codeId } = req.body as { codeId?: string };
  if (!codeId) {
    res.status(400).json({ error: "codeId é obrigatório" });
    return;
  }
  try {
    await db
      .update(promoCodesTable)
      .set({ usosAtuais: sql`${promoCodesTable.usosAtuais} + 1` })
      .where(eq(promoCodesTable.id, codeId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "promo code apply error");
    res.status(500).json({ error: "Erro interno ao aplicar cupom" });
  }
});

export default router;
