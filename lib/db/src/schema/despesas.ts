import { pgTable, text, uuid, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const despesasFixasTable = pgTable("despesas_fixas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull().default("0"),
  categoria: text("categoria"),
  data: date("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDespesaSchema = createInsertSchema(despesasFixasTable).omit({ id: true, userId: true, createdAt: true });
export type InsertDespesa = z.infer<typeof insertDespesaSchema>;
export type Despesa = typeof despesasFixasTable.$inferSelect;
