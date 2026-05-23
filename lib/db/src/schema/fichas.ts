import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fichasTecnicasTable = pgTable("fichas_tecnicas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  produtoId: uuid("produto_id").notNull(),
  rendimento: numeric("rendimento", { precision: 10, scale: 3 }),
  unidadeRendimento: text("unidade_rendimento"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fichaItensTable = pgTable("ficha_tecnica_itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  fichaId: uuid("ficha_id").notNull(),
  insumoId: uuid("insumo_id").notNull(),
  quantidade: numeric("quantidade", { precision: 10, scale: 3 }).notNull().default("0"),
});

export const insertFichaSchema = createInsertSchema(fichasTecnicasTable).omit({ id: true, userId: true, createdAt: true });
export const insertFichaItemSchema = createInsertSchema(fichaItensTable).omit({ id: true, userId: true });
export type InsertFicha = z.infer<typeof insertFichaSchema>;
export type InsertFichaItem = z.infer<typeof insertFichaItemSchema>;
export type FichaTecnica = typeof fichasTecnicasTable.$inferSelect;
export type FichaItem = typeof fichaItensTable.$inferSelect;
