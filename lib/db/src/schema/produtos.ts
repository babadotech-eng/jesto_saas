import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const produtosTable = pgTable("produtos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  categoria: text("categoria"),
  precoVenda: numeric("preco_venda", { precision: 10, scale: 2 }).notNull().default("0"),
  custoMaoObra: numeric("custo_mao_obra", { precision: 10, scale: 2 }).notNull().default("0"),
  frete: numeric("frete", { precision: 10, scale: 2 }).notNull().default("0"),
  impostoPct: numeric("imposto_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  taxaCartaoPct: numeric("taxa_cartao_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  taxaAppPct: numeric("taxa_app_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  comissaoPct: numeric("comissao_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  taxaVrPct: numeric("taxa_vr_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProdutoSchema = createInsertSchema(produtosTable).omit({ id: true, userId: true, createdAt: true });
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Produto = typeof produtosTable.$inferSelect;
