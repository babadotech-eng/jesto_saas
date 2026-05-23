import { Router } from "express";
import { requireAuth, getUserId } from "../middlewares/auth";
import { GetMeResponse } from "@workspace/api-zod";
import { createClient } from "@supabase/supabase-js";

const router = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const token = req.headers.authorization!.slice(7);
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
  const { data } = await supabase.auth.getUser(token);

  const profile = {
    id: userId,
    email: data.user?.email ?? null,
    nome: data.user?.user_metadata?.nome ?? null,
    created_at: data.user?.created_at ?? null,
  };

  res.json(GetMeResponse.parse(profile));
});

export default router;
