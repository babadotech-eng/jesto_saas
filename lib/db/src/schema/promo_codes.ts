import { pgTable, text, uuid, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";

export const promoCodesTable = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull().unique(),
  tipo: text("tipo", { enum: ["percentual", "fixo"] }).notNull(),
  desconto: numeric("desconto", { precision: 10, scale: 2 }).notNull(),
  dataInicio: timestamp("data_inicio", { withTimezone: true }).notNull(),
  dataExpiracao: timestamp("data_expiracao", { withTimezone: true }),
  limiteUsos: integer("limite_usos"),
  usosAtuais: integer("usos_atuais").notNull().default(0),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PromoCode = typeof promoCodesTable.$inferSelect;
