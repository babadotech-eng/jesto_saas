import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const assinaturasTable = pgTable("assinaturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  plano: text("plano", { enum: ["gratis", "pro", "premium"] }).notNull().default("gratis"),
  status: text("status", { enum: ["ativo", "cancelado", "expirado", "pendente"] }).notNull().default("ativo"),
  ciclo: text("ciclo", { enum: ["mensal", "anual"] }),
  gateway: text("gateway"),
  transactionId: text("transaction_id"),
  subscriptionIdGateway: text("subscription_id_gateway"),
  dataInicio: timestamp("data_inicio", { withTimezone: true }),
  proximaCobranca: timestamp("proxima_cobranca", { withTimezone: true }),
  validoAte: timestamp("valido_ate", { withTimezone: true }),
  promoCodeId: uuid("promo_code_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Assinatura = typeof assinaturasTable.$inferSelect;
