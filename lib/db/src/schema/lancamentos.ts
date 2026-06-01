import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lancamentosTable = pgTable("lancamentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  descricao: text("descricao").notNull(),
  tipo: text("tipo", { enum: ["receita", "despesa"] }).notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull().default("0"),
  data: text("data").notNull(),
  categoria: text("categoria"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLancamentoSchema = createInsertSchema(lancamentosTable).omit({ id: true, userId: true, createdAt: true });
export type InsertLancamento = z.infer<typeof insertLancamentoSchema>;
export type Lancamento = typeof lancamentosTable.$inferSelect;
