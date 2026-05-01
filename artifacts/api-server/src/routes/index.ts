import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkoutRouter from "./checkout";
import webhookRouter from "./webhook";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkoutRouter);
router.use(webhookRouter);
router.use(contactRouter);

export default router;
