import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, promoCodesTable } from "@workspace/db";

const router = Router();

router.get("/codigos/validar", async (req, res): Promise<void> => {
  const codigo = req.query["codigo"];

  if (!codigo || typeof codigo !== "string") {
    res.status(400).json({ error: "Parâmetro 'codigo' é obrigatório" });
    return;
  }

  try {
    const [code] = await db
      .select()
      .from(promoCodesTable)
      .where(eq(promoCodesTable.codigo, codigo.trim().toUpperCase()))
      .limit(1);

    if (!code || !code.ativo) {
      res.status(404).json({ error: "Cupom inválido ou inativo" });
      return;
    }

    const now = new Date();

    if (new Date(code.dataInicio) > now) {
      res.status(400).json({ error: "Cupom ainda não está ativo" });
      return;
    }

    if (code.dataExpiracao && new Date(code.dataExpiracao) < now) {
      res.status(400).json({ error: "Cupom expirado" });
      return;
    }

    if (code.limiteUsos !== null && code.usosAtuais >= code.limiteUsos) {
      res.status(400).json({ error: "Cupom esgotado" });
      return;
    }

    res.json({
      valido: true,
      codeId: code.id,
      tipo: code.tipo,
      desconto: Number(code.desconto),
    });
  } catch (err) {
    req.log.error({ err }, "codigos validar error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
