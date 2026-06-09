import { Router } from "express";
import { and, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db, assinaturasTable, promoCodesTable, promoCodeUsesTable, perfisTable } from "@workspace/db";
import { requireAuth, getUserId, getUserEmail } from "../middlewares/auth";
import {
  findOrCreateCustomer,
  createSubscription,
  getSubscriptionPayments,
  isAsaasConfigured,
} from "../lib/asaas";

const router = Router();

const PLANOS_VALIDOS = ["gratis", "pro", "premium"] as const;
type PlanoValido = typeof PLANOS_VALIDOS[number];

const PLAN_PRICES = {
  pro:     { mensal: 24.90, anual: 207.50 },
  premium: { mensal: 49.90, anual: 416.00 },
} as const;

// GET /api/assinaturas/current
router.get("/assinaturas/current", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);

  try {
    const rows = await db.select().from(assinaturasTable).where(eq(assinaturasTable.userId, userId)).limit(1);

    if (rows.length > 0) {
      const row = rows[0]!;

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
        ciclo: row.ciclo ?? null,
        gateway: row.gateway ?? null,
        data_inicio: row.dataInicio ?? null,
        proxima_cobranca: row.proximaCobranca ?? null,
        valido_ate: row.validoAte ?? null,
        promo_code_id: row.promoCodeId ?? null,
        desconto_aplicado: descontoAplicado,
        tipo_desconto: tipoDesconto,
      });
      return;
    }

    res.json({
      id: userId,
      plano: "gratis",
      status: "ativo",
      ciclo: null,
      gateway: null,
      data_inicio: null,
      proxima_cobranca: null,
      valido_ate: null,
      promo_code_id: null,
      desconto_aplicado: null,
      tipo_desconto: null,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching assinatura");
    res.status(500).json({ error: "Erro interno" });
  }
});

// POST /api/assinaturas/checkout — create Asaas subscription, return payment URL
router.post("/assinaturas/checkout", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const email = getUserEmail(req);
  const { plano, ciclo, cupomCode } = req.body as {
    plano?: string;
    ciclo?: string;
    cupomCode?: string;
  };

  if (!plano || !["pro", "premium"].includes(plano)) {
    res.status(400).json({ error: "Plano inválido. Use: pro ou premium" });
    return;
  }

  if (!ciclo || !["mensal", "anual"].includes(ciclo)) {
    res.status(400).json({ error: "Ciclo inválido. Use: mensal ou anual" });
    return;
  }

  if (!email) {
    res.status(400).json({ error: "Email do usuário não encontrado" });
    return;
  }

  if (!isAsaasConfigured()) {
    res.status(503).json({ error: "Gateway de pagamento não configurado. Contate o suporte." });
    return;
  }

  const prices = PLAN_PRICES[plano as "pro" | "premium"];
  let valor: number = prices[ciclo as "mensal" | "anual"];

  // Validate coupon
  let couponId: string | null = null;
  if (cupomCode?.trim()) {
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

    const [alreadyUsed] = await db
      .select({ id: promoCodeUsesTable.id })
      .from(promoCodeUsesTable)
      .where(
        and(
          eq(promoCodeUsesTable.userId, userId),
          eq(promoCodeUsesTable.promoCodeId, code.id),
        ),
      )
      .limit(1);
    if (alreadyUsed) {
      res.status(400).json({ error: "Você já utilizou este cupom" });
      return;
    }

    couponId = code.id;
    if (code.tipo === "percentual") {
      valor = Math.round(valor * (1 - Number(code.desconto) / 100) * 100) / 100;
    } else {
      valor = Math.max(0.01, valor - Number(code.desconto));
    }
  }

  try {
    const [perfil] = await db
      .select({ nome: perfisTable.nomeCompleto, cpfCnpj: perfisTable.cpfCnpj })
      .from(perfisTable)
      .where(eq(perfisTable.userId, userId))
      .limit(1);

    const cpfCnpjRaw = perfil?.cpfCnpj ?? null;
    req.log.info({ hasCpfCnpj: !!cpfCnpjRaw, source: "perfisTable.cpfCnpj" }, "checkout: cpfCnpj check");
    if (!cpfCnpjRaw) {
      res.status(400).json({ error: "CPF ou CNPJ não encontrado. Preencha esse campo em Configurações antes de assinar." });
      return;
    }
    const cpfCnpjClean = cpfCnpjRaw.replace(/\D/g, "");
    req.log.info({ cpfCnpjLen: cpfCnpjClean.length }, "checkout: cpfCnpj sanitized");

    let customer;
    try {
      customer = await findOrCreateCustomer(email, perfil?.nome ?? undefined, cpfCnpjClean);
      req.log.info({ customerId: customer.id, hasAsaasCpfCnpj: !!customer.cpfCnpj }, "checkout: customer resolved");
    } catch (custErr) {
      const msg = custErr instanceof Error ? custErr.message : String(custErr);
      req.log.error({ asaasError: msg }, "checkout: findOrCreateCustomer failed");
      res.status(502).json({ error: `Erro ao criar cliente no gateway: ${msg}` });
      return;
    }

    const today = new Date();
    const nextDueDate = today.toISOString().split("T")[0]!;
    const planLabel = plano === "pro" ? "Pro" : "Premium";
    const cicloLabel = ciclo === "mensal" ? "Mensal" : "Anual";
    const asaasCycle = ciclo === "mensal" ? "MONTHLY" : "YEARLY";

    const subscription = await createSubscription({
      customerId: customer.id,
      value: valor,
      cycle: asaasCycle,
      description: `Jesto ${planLabel} ${cicloLabel}`,
      externalReference: userId,
      nextDueDate,
    });

    let paymentUrl: string | null = null;
    let firstPaymentId: string | null = null;
    try {
      const payments = await getSubscriptionPayments(subscription.id);
      const firstPayment = payments.data?.[0];
      if (firstPayment) {
        paymentUrl = firstPayment.invoiceUrl;
        firstPaymentId = firstPayment.id;
      }
    } catch (payErr) {
      req.log.warn({ payErr }, "Could not fetch subscription first payment");
    }

    if (!paymentUrl) {
      res.status(500).json({ error: "Não foi possível obter o link de pagamento. Tente novamente." });
      return;
    }

    const proximaCobranca = new Date(today);
    if (ciclo === "mensal") {
      proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
    } else {
      proximaCobranca.setFullYear(proximaCobranca.getFullYear() + 1);
    }

    await db
      .insert(assinaturasTable)
      .values({
        userId,
        plano: plano as PlanoValido,
        status: "pendente",
        ciclo: ciclo as "mensal" | "anual",
        gateway: "asaas",
        subscriptionIdGateway: subscription.id,
        transactionId: firstPaymentId,
        dataInicio: today,
        proximaCobranca,
        promoCodeId: couponId,
      })
      .onConflictDoUpdate({
        target: assinaturasTable.userId,
        set: {
          plano: plano as PlanoValido,
          status: "pendente",
          ciclo: ciclo as "mensal" | "anual",
          gateway: "asaas",
          subscriptionIdGateway: subscription.id,
          transactionId: firstPaymentId,
          dataInicio: today,
          proximaCobranca,
          promoCodeId: couponId,
          updatedAt: new Date(),
        },
      });

    res.json({ paymentUrl, subscriptionId: subscription.id, plano, ciclo, valor });
  } catch (err) {
    req.log.error({ err }, "Error creating Asaas checkout");
    const message = err instanceof Error ? err.message : "Erro ao criar pagamento";
    res.status(500).json({ error: message });
  }
});

// GET /api/assinaturas/pending-payment-url — recover invoiceUrl for a pending subscription
router.get("/assinaturas/pending-payment-url", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  try {
    const [row] = await db
      .select({ subscriptionIdGateway: assinaturasTable.subscriptionIdGateway })
      .from(assinaturasTable)
      .where(and(eq(assinaturasTable.userId, userId), eq(assinaturasTable.status, "pendente")))
      .limit(1);

    if (!row?.subscriptionIdGateway) {
      res.json({ url: null });
      return;
    }

    const payments = await getSubscriptionPayments(row.subscriptionIdGateway);
    const url = payments.data?.[0]?.invoiceUrl ?? null;
    res.json({ url });
  } catch (err) {
    req.log.warn({ err }, "pending-payment-url: could not fetch from Asaas");
    res.json({ url: null });
  }
});

// POST /api/assinaturas/webhook — Asaas payment events
// Secured via ASAAS_WEBHOOK_TOKEN: set this env var to the token configured
// in the Asaas dashboard (Configurações → Notificações → Token).
// Asaas sends the token in the "asaas-access-token" header.
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

router.post("/assinaturas/webhook", async (req, res): Promise<void> => {
  // Reject if token env var is configured but header is missing or wrong
  if (ASAAS_WEBHOOK_TOKEN) {
    const incomingToken = req.headers["asaas-access-token"];
    if (!incomingToken || incomingToken !== ASAAS_WEBHOOK_TOKEN) {
      req.log.warn({ hasHeader: !!incomingToken }, "Webhook: invalid or missing asaas-access-token — rejected");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } else {
    req.log.warn("Webhook: ASAAS_WEBHOOK_TOKEN not set — accepting without auth (configure it in Asaas dashboard)");
  }

  const body = req.body as {
    event?: string;
    payment?: {
      id?: string;
      externalReference?: string;
      status?: string;
      confirmedDate?: string;
      value?: number;
    };
    subscription?: {
      id?: string;
      externalReference?: string;
      status?: string;
    };
    checkout?: {
      id?: string;
      externalReference?: string;
      status?: string;
      value?: number;
      payment?: {
        id?: string;
        confirmedDate?: string;
      };
    };
  };

  const { event } = body;

  // Payment events
  if (body.payment?.externalReference) {
    const userId = body.payment.externalReference;
    try {
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        await db
          .update(assinaturasTable)
          .set({
            status: "ativo",
            transactionId: body.payment.id ?? null,
            dataInicio: body.payment.confirmedDate
              ? new Date(body.payment.confirmedDate)
              : new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(assinaturasTable.userId, userId),
              eq(assinaturasTable.gateway, "asaas"),
            ),
          );
      } else if (event === "PAYMENT_OVERDUE") {
        // Keep pending — let admin decide
      }
    } catch (err) {
      req.log.error({ err }, "Webhook payment processing error");
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }
  }

  // Checkout events (CHECKOUT_PAID / CHECKOUT_CANCELED / CHECKOUT_EXPIRED)
  if (body.checkout?.externalReference) {
    const userId = body.checkout.externalReference;
    try {
      if (event === "CHECKOUT_PAID") {
        // Idempotency: only update while pending — prevents duplicate activation
        await db
          .update(assinaturasTable)
          .set({
            status: "ativo",
            transactionId: body.checkout.payment?.id ?? body.checkout.id ?? null,
            dataInicio: body.checkout.payment?.confirmedDate
              ? new Date(body.checkout.payment.confirmedDate)
              : new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(assinaturasTable.userId, userId),
              eq(assinaturasTable.gateway, "asaas"),
              eq(assinaturasTable.status, "pendente"),
            ),
          );
        req.log.info({ userId, event }, "Webhook CHECKOUT_PAID: plan activated");
      } else if (event === "CHECKOUT_CANCELED") {
        await db
          .update(assinaturasTable)
          .set({ status: "cancelado", updatedAt: new Date() })
          .where(
            and(
              eq(assinaturasTable.userId, userId),
              eq(assinaturasTable.gateway, "asaas"),
            ),
          );
        req.log.info({ userId, event }, "Webhook CHECKOUT_CANCELED: plan not activated");
      } else if (event === "CHECKOUT_EXPIRED") {
        await db
          .update(assinaturasTable)
          .set({ status: "expirado", updatedAt: new Date() })
          .where(
            and(
              eq(assinaturasTable.userId, userId),
              eq(assinaturasTable.gateway, "asaas"),
            ),
          );
        req.log.info({ userId, event }, "Webhook CHECKOUT_EXPIRED: plan expired");
      }
    } catch (err) {
      req.log.error({ err }, "Webhook checkout processing error");
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }
  }

  // Subscription events
  if (body.subscription?.externalReference) {
    const userId = body.subscription.externalReference;
    try {
      if (event === "SUBSCRIPTION_INACTIVATED" || event === "SUBSCRIPTION_DELETED") {
        await db
          .update(assinaturasTable)
          .set({ status: "cancelado", updatedAt: new Date() })
          .where(
            and(
              eq(assinaturasTable.userId, userId),
              eq(assinaturasTable.gateway, "asaas"),
            ),
          );
      }
    } catch (err) {
      req.log.error({ err }, "Webhook subscription processing error");
      res.status(500).json({ error: "Webhook processing failed" });
      return;
    }
  }

  res.json({ received: true });
});

// POST /api/assinaturas — activate gratis or direct plan (no payment gateway)
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

      const [alreadyUsed] = await db
        .select({ id: promoCodeUsesTable.id })
        .from(promoCodeUsesTable)
        .where(
          and(
            eq(promoCodeUsesTable.userId, userId),
            eq(promoCodeUsesTable.promoCodeId, code.id),
          ),
        )
        .limit(1);

      if (alreadyUsed) {
        res.status(400).json({ error: "Você já utilizou este cupom" });
        return;
      }
    }

    const now = new Date();

    const row = await db.transaction(async (tx) => {
      const [assinatura] = await tx
        .insert(assinaturasTable)
        .values({
          userId,
          plano: plano as PlanoValido,
          status: "ativo",
          ciclo: null,
          gateway: null,
          dataInicio: now,
          promoCodeId: couponId,
        })
        .onConflictDoUpdate({
          target: assinaturasTable.userId,
          set: {
            plano: plano as PlanoValido,
            status: "ativo",
            ciclo: null,
            gateway: null,
            dataInicio: now,
            promoCodeId: couponId,
            updatedAt: now,
          },
        })
        .returning();

      if (couponId) {
        const [existingUse] = await tx
          .select({ id: promoCodeUsesTable.id })
          .from(promoCodeUsesTable)
          .where(
            and(
              eq(promoCodeUsesTable.userId, userId),
              eq(promoCodeUsesTable.promoCodeId, couponId),
            ),
          )
          .limit(1);

        if (!existingUse) {
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

          await tx.insert(promoCodeUsesTable).values({ userId, promoCodeId: couponId });
        }
      }

      return assinatura;
    });

    res.status(201).json({
      id: row!.id,
      plano: row!.plano,
      status: row!.status,
      ciclo: row!.ciclo ?? null,
      gateway: row!.gateway ?? null,
      data_inicio: row!.dataInicio ?? null,
      valido_ate: row!.validoAte ?? null,
      promo_code_id: row!.promoCodeId ?? null,
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
