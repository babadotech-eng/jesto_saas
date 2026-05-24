import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const funcionariosTable = pgTable("funcionarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  nome: text("nome").notNull(),
  salario: numeric("salario", { precision: 10, scale: 2 }).notNull().default("0"),
  setor: text("setor"),
  cargo: text("cargo"),
  tipoContratacao: text("tipo_contratacao").notNull().default("CLT"),
  valeTransporte: numeric("vale_transporte", { precision: 10, scale: 2 }).notNull().default("0"),
  valeRefeicao: numeric("vale_refeicao", { precision: 10, scale: 2 }).notNull().default("0"),
  convenioMedico: numeric("convenio_medico", { precision: 10, scale: 2 }).notNull().default("0"),
  cargaHorariaMensal: numeric("carga_horaria_mensal", { precision: 6, scale: 2 }).notNull().default("220"),
  provisaoFeriasPct: numeric("provisao_ferias_pct", { precision: 6, scale: 3 }).notNull().default("11.11"),
  provisaoTercoFeriasPct: numeric("provisao_terco_ferias_pct", { precision: 6, scale: 3 }).notNull().default("3.70"),
  provisaoDecimoTerceiroPct: numeric("provisao_decimo_terceiro_pct", { precision: 6, scale: 3 }).notNull().default("8.33"),
  provisaoDecimoTerceiroFeriasPct: numeric("provisao_decimo_terceiro_ferias_pct", { precision: 6, scale: 3 }).notNull().default("1.03"),
  inssPatronalPct: numeric("inss_patronal_pct", { precision: 6, scale: 3 }).notNull().default("20"),
  satRatPct: numeric("sat_rat_pct", { precision: 6, scale: 3 }).notNull().default("1"),
  salarioEducacaoPct: numeric("salario_educacao_pct", { precision: 6, scale: 3 }).notNull().default("2.5"),
  sistemaSPct: numeric("sistema_s_pct", { precision: 6, scale: 3 }).notNull().default("3.3"),
  fgtsPct: numeric("fgts_pct", { precision: 6, scale: 3 }).notNull().default("8"),
  fgtsRescisaoPct: numeric("fgts_rescisao_pct", { precision: 6, scale: 3 }).notNull().default("4"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFuncionarioSchema = createInsertSchema(funcionariosTable).omit({ id: true, userId: true, createdAt: true });
export type InsertFuncionario = z.infer<typeof insertFuncionarioSchema>;
export type Funcionario = typeof funcionariosTable.$inferSelect;
