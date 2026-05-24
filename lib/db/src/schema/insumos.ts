import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insumosTable = pgTable("insumos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  unidade: text("unidade").notNull(),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull().default("0"),
  fatorCorrecao: numeric("fator_correcao", { precision: 5, scale: 3 }).notNull().default("1"),
  pesoBruto: numeric("peso_bruto", { precision: 10, scale: 3 }),
  pesoLiquido: numeric("peso_liquido", { precision: 10, scale: 3 }),
  fornecedor: text("fornecedor"),
  embalagem: text("embalagem"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInsumoSchema = createInsertSchema(insumosTable).omit({ id: true, userId: true, createdAt: true });
export type InsertInsumo = z.infer<typeof insertInsumoSchema>;
export type Insumo = typeof insumosTable.$inferSelect;
