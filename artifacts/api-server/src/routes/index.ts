import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import produtosRouter from "./produtos";
import insumosRouter from "./insumos";
import fichasRouter from "./fichas";
import despesasRouter from "./despesas";
import lancamentosRouter from "./lancamentos";
import relatoriosRouter from "./relatorios";
import assinaturasRouter from "./assinaturas";
import perfisRouter from "./perfis";
import funcionariosRouter from "./funcionarios";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(produtosRouter);
router.use(insumosRouter);
router.use(fichasRouter);
router.use(despesasRouter);
router.use(lancamentosRouter);
router.use(relatoriosRouter);
router.use(assinaturasRouter);
router.use(perfisRouter);
router.use(funcionariosRouter);

export default router;
