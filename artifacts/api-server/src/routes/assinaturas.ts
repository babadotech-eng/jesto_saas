import { Router } from "express";
import { and, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db, assinaturasTable, promoCodesTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";

const router = Router();

router.get("/assinaturas/current", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);

  try {
    const rows = await db.select().from(assinaturasTable).where(eq(assinaturasTable.userId, userId)).limit(1);

    if (rows.length > 0) {
      const row = rows[0];

      let descontoAplicado: number | null = null;
      let tipoDesconto: string | null = null;

      if (row.promoCodeId) {
        const [code] = await db
          .select({ desconto: promoCodesTable.desconto, tipo: promoCodesTable.tipo })
          .from(promoCodesTable)
          .where(eq(promoCodesTable.id, row.promoCodeId))
          .limit(1);

        if (code) {
          descontoAplicado = Number(code.desconto);
          tipoDesconto = code.tipo;
        }
      }

      res.json({
        id: row.id,
        plano: row.plano,
        status: row.status,
        valido_ate: row.validoAte,
        promo_code_id: row.promoCodeId ?? null,
        desconto_aplicado: descontoAplicado,
        tipo_desconto: tipoDesconto,
      });
      return;
    }

    res.json({ id: userId, plano: "gratis", status: "ativo", valido_ate: null, promo_code_id: null, desconto_aplicado: null, tipo_desconto: null });
  } catch (err) {
    req.log.error({ err }, "Error fetching assinatura");
    res.status(500).json({ error: "Erro interno" });
  }
});

const PLANOS_VALIDOS = ["gratis", "pro", "premium"] as const;
type PlanoValido = typeof PLANOS_VALIDOS[number];

router.post("/assinaturas", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const { plano, cupomCode } = req.body as { plano?: string; cupomCode?: string };

  if (!plano || !(PLANOS_VALIDOS as readonly string[]).includes(plano)) {
    res.status(400).json({ error: "Plano inválido. Use: gratis, pro ou premium" });
    return;
  }

  try {
    let couponId: string | null = null;
    let couponDesconto: number | null = null;
    let couponTipo: string | null = null;

    if (cupomCode && cupomCode.trim()) {
      const codigo = cupomCode.trim().toUpperCase();
      const [code] = await db
        .select()
        .from(promoCodesTable)
        .where(eq(promoCodesTable.codigo, codigo))
        .limit(1);

      if (!code || !code.ativo) {
        res.status(400).json({ error: "Cupom inválido ou inativo" });
        return;
      }

      const now = new Date();

      if (new Date(code.dataInicio) > now) {
        res.status(400).json({ error: "Cupom ainda não está ativo" });
        return;
      }

      if (code.dataExpiracao && new Date(code.dataExpiracao) < now) {
        res.status(400).json({ error: "Cupom expirado" });
        return;
      }

      if (code.limiteUsos !== null && code.usosAtuais >= code.limiteUsos) {
        res.status(400).json({ error: "Cupom esgotado" });
        return;
      }

      couponId = code.id;
      couponDesconto = Number(code.desconto);
      couponTipo = code.tipo;
    }

    const row = await db.transaction(async (tx) => {
      const [assinatura] = await tx
        .insert(assinaturasTable)
        .values({ userId, plano: plano as PlanoValido, status: "ativo", promoCodeId: couponId })
        .onConflictDoUpdate({
          target: assinaturasTable.userId,
          set: {
            plano: plano as PlanoValido,
            status: "ativo",
            promoCodeId: couponId,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (couponId) {
        const now = new Date();
        const updated = await tx
          .update(promoCodesTable)
          .set({ usosAtuais: sql`${promoCodesTable.usosAtuais} + 1` })
          .where(
            and(
              eq(promoCodesTable.id, couponId),
              eq(promoCodesTable.ativo, true),
              lte(promoCodesTable.dataInicio, now),
              or(
                isNull(promoCodesTable.dataExpiracao),
                gte(promoCodesTable.dataExpiracao, now),
              ),
              or(
                isNull(promoCodesTable.limiteUsos),
                sql`${promoCodesTable.usosAtuais} < ${promoCodesTable.limiteUsos}`,
              ),
            ),
          )
          .returning({ id: promoCodesTable.id });

        if (updated.length === 0) {
          throw new Error("CUPOM_INVALIDO");
        }
      }

      return assinatura;
    });

    res.status(201).json({
      id: row.id,
      plano: row.plano,
      status: row.status,
      valido_ate: row.validoAte,
      promo_code_id: row.promoCodeId ?? null,
      desconto_aplicado: couponDesconto,
      tipo_desconto: couponTipo,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CUPOM_INVALIDO") {
      res.status(400).json({ error: "Cupom inválido, expirado ou esgotado" });
      return;
    }
    req.log.error({ err }, "Error creating assinatura");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
