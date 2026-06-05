import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const perfisTable = pgTable("perfis", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  nomeCompleto: text("nome_completo"),
  nomeNegocio: text("nome_negocio"),
  tipoNegocio: text("tipo_negocio"),
  volumeMensal: text("volume_mensal"),
  cidadeEstado: text("cidade_estado"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  cpfCnpj: text("cpf_cnpj"),
  origem: text("origem"),
  logoUrl: text("logo_url"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPerfilSchema = createInsertSchema(perfisTable).omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export type InsertPerfil = z.infer<typeof insertPerfilSchema>;
export type Perfil = typeof perfisTable.$inferSelect;
