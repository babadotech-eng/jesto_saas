import { Router } from "express";

const router = Router();

router.get("/test-asaas", async (req, res): Promise<void> => {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl =
    process.env.ASAAS_ENV === "production"
      ? "https://api.asaas.com/api/v3"
      : "https://sandbox.asaas.com/api/v3";

  if (!apiKey) {
    res.status(503).json({ error: "ASAAS_API_KEY não configurado" });
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/myAccount`, {
      headers: { "access_token": apiKey },
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ asaas_status: response.status, error: data });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Erro desconhecido" });
  }
});

export default router;
