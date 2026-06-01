import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, funcionariosTable, assinaturasTable } from "@workspace/db";
import { requireAuth, getUserId } from "../middlewares/auth";
import { CreateFuncionarioBody, UpdateFuncionarioBody, UpdateFuncionarioParams, DeleteFuncionarioParams } from "@workspace/api-zod";

const router = Router();

async function isPremium(userId: string): Promise<boolean> {
  const rows = await db.select().from(assinaturasTable).where(eq(assinaturasTable.userId, userId)).limit(1);
  return rows[0]?.plano === "premium";
}

function calcDerived(f: typeof funcionariosTable.$inferSelect) {
  const salario = Number(f.salario);
  const cargaHoraria = Number(f.cargaHorariaMensal) || 220;
  const trabPct = Number(f.provisaoFeriasPct) + Number(f.provisaoTercoFeriasPct) + Number(f.provisaoDecimoTerceiroPct) + Number(f.provisaoDecimoTerceiroFeriasPct);
  const sociaisPct = Number(f.inssPatronalPct) + Number(f.satRatPct) + Number(f.salarioEducacaoPct) + Number(f.sistemaSPct) + Number(f.fgtsPct) + Number(f.fgtsRescisaoPct);
  const totaisPct = trabPct + sociaisPct;
  const valorEncargos = salario * totaisPct / 100;
  const totalMensal = salario + valorEncargos + Number(f.valeTransporte) + Number(f.valeRefeicao) + Number(f.convenioMedico);
  const valorHora = cargaHoraria > 0 ? totalMensal / cargaHoraria : 0;
  return {
    encargos_trabalhistas_pct: trabPct,
    encargos_sociais_pct: sociaisPct,
    encargos_totais_pct: totaisPct,
    valor_encargos: valorEncargos,
    total_mensal: totalMensal,
    valor_hora: valorHora,
  };
}

function serialize(f: typeof funcionariosTable.$inferSelect) {
  const d = calcDerived(f);
  return {
    id: f.id,
    nome: f.nome,
    salario: Number(f.salario),
    setor: f.setor,
    cargo: f.cargo,
    tipo_contratacao: f.tipoContratacao,
    vale_transporte: Number(f.valeTransporte),
    vale_refeicao: Number(f.valeRefeicao),
    convenio_medico: Number(f.convenioMedico),
    carga_horaria_mensal: Number(f.cargaHorariaMensal),
    provisao_ferias_pct: Number(f.provisaoFeriasPct),
    provisao_terco_ferias_pct: Number(f.provisaoTercoFeriasPct),
    provisao_decimo_terceiro_pct: Number(f.provisaoDecimoTerceiroPct),
    provisao_decimo_terceiro_ferias_pct: Number(f.provisaoDecimoTerceiroFeriasPct),
    inss_patronal_pct: Number(f.inssPatronalPct),
    sat_rat_pct: Number(f.satRatPct),
    salario_educacao_pct: Number(f.salarioEducacaoPct),
    sistema_s_pct: Number(f.sistemaSPct),
    fgts_pct: Number(f.fgtsPct),
    fgts_rescisao_pct: Number(f.fgtsRescisaoPct),
    ...d,
    data_inicio: f.dataInicio ?? null,
    created_at: f.createdAt?.toISOString() ?? null,
  };
}

function mapBody(b: any) {
  return {
    nome: b.nome,
    salario: String(b.salario ?? 0),
    setor: b.setor ?? null,
    cargo: b.cargo ?? null,
    tipoContratacao: b.tipo_contratacao ?? "CLT",
    valeTransporte: String(b.vale_transporte ?? 0),
    valeRefeicao: String(b.vale_refeicao ?? 0),
    convenioMedico: String(b.convenio_medico ?? 0),
    cargaHorariaMensal: String(b.carga_horaria_mensal && Number(b.carga_horaria_mensal) > 0 ? b.carga_horaria_mensal : 220),
    provisaoFeriasPct: String(b.provisao_ferias_pct ?? 11.11),
    provisaoTercoFeriasPct: String(b.provisao_terco_ferias_pct ?? 3.70),
    provisaoDecimoTerceiroPct: String(b.provisao_decimo_terceiro_pct ?? 8.33),
    provisaoDecimoTerceiroFeriasPct: String(b.provisao_decimo_terceiro_ferias_pct ?? 1.03),
    inssPatronalPct: String(b.inss_patronal_pct ?? 20),
    satRatPct: String(b.sat_rat_pct ?? 1),
    salarioEducacaoPct: String(b.salario_educacao_pct ?? 2.5),
    sistemaSPct: String(b.sistema_s_pct ?? 3.3),
    fgtsPct: String(b.fgts_pct ?? 8),
    fgtsRescisaoPct: String(b.fgts_rescisao_pct ?? 4),
    dataInicio: b.data_inicio ?? null,
  };
}

router.get("/funcionarios", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!await isPremium(userId)) { res.status(403).json({ error: "Premium required" }); return; }
  const rows = await db.select().from(funcionariosTable).where(eq(funcionariosTable.userId, userId)).orderBy(desc(funcionariosTable.createdAt));
  res.json(rows.map(serialize));
});

router.post("/funcionarios", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!await isPremium(userId)) { res.status(403).json({ error: "Premium required" }); return; }
  const parsed = CreateFuncionarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(funcionariosTable).values({ userId, ...mapBody(parsed.data) }).returning();
  res.status(201).json(serialize(row));
});

router.put("/funcionarios/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!await isPremium(userId)) { res.status(403).json({ error: "Premium required" }); return; }
  const { id } = UpdateFuncionarioParams.parse(req.params);
  const parsed = UpdateFuncionarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [existing] = await db.select().from(funcionariosTable)
    .where(and(eq(funcionariosTable.id, id), eq(funcionariosTable.userId, userId))).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  // Merge incoming body with existing row so unspecified fields are preserved
  const existingAsBody = {
    nome: existing.nome,
    salario: Number(existing.salario),
    setor: existing.setor,
    cargo: existing.cargo,
    tipo_contratacao: existing.tipoContratacao,
    vale_transporte: Number(existing.valeTransporte),
    vale_refeicao: Number(existing.valeRefeicao),
    convenio_medico: Number(existing.convenioMedico),
    carga_horaria_mensal: Number(existing.cargaHorariaMensal),
    provisao_ferias_pct: Number(existing.provisaoFeriasPct),
    provisao_terco_ferias_pct: Number(existing.provisaoTercoFeriasPct),
    provisao_decimo_terceiro_pct: Number(existing.provisaoDecimoTerceiroPct),
    provisao_decimo_terceiro_ferias_pct: Number(existing.provisaoDecimoTerceiroFeriasPct),
    inss_patronal_pct: Number(existing.inssPatronalPct),
    sat_rat_pct: Number(existing.satRatPct),
    salario_educacao_pct: Number(existing.salarioEducacaoPct),
    sistema_s_pct: Number(existing.sistemaSPct),
    fgts_pct: Number(existing.fgtsPct),
    fgts_rescisao_pct: Number(existing.fgtsRescisaoPct),
  };
  const merged = { ...existingAsBody, ...parsed.data };
  const [row] = await db.update(funcionariosTable).set(mapBody(merged))
    .where(and(eq(funcionariosTable.id, id), eq(funcionariosTable.userId, userId))).returning();
  res.json(serialize(row));
});

router.delete("/funcionarios/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!await isPremium(userId)) { res.status(403).json({ error: "Premium required" }); return; }
  const { id } = DeleteFuncionarioParams.parse(req.params);
  await db.delete(funcionariosTable).where(and(eq(funcionariosTable.id, id), eq(funcionariosTable.userId, userId)));
  res.status(204).send();
});

export default router;

export async function calcTotalFolhaMensal(userId: string): Promise<number> {
  const rows = await db.select().from(funcionariosTable).where(eq(funcionariosTable.userId, userId));
  return rows.reduce((sum, f) => sum + calcDerived(f).total_mensal, 0);
}
