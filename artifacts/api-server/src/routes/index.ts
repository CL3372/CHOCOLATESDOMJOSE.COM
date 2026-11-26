import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkoutRouter from "./checkout";
import webhookRouter from "./webhook";
import contactRouter from "./contact";
import cronRouter from "./cron";

const router: IRouter = Router();

router.use(healthRouter);
router.use(checkoutRouter);
router.use(webhookRouter);
router.use(contactRouter);
router.use(cronRouter);

export default router;
