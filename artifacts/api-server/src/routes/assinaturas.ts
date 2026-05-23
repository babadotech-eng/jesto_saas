import { Router } from "express";
import { requireAuth, getUserId } from "../middlewares/auth";

const router = Router();

router.get("/assinaturas/current", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  res.json({
    id: userId,
    plano: "gratis",
    status: "ativo",
    valido_ate: null,
  });
});

export default router;
