import { Router, type IRouter } from "express";
import { runCartRecovery } from "../lib/cartRecovery.js";

const router: IRouter = Router();

// Vercel Cron (configured in vercel.json) hits this once a day and
// automatically sends `Authorization: Bearer <CRON_SECRET>` when the
// CRON_SECRET env var is set on the project — that's the only thing that's
// allowed to trigger this route. Anyone else gets 401.
router.get("/cron/cart-recovery", async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const auth = req.headers.authorization;

  if (!expected || auth !== `Bearer ${expected}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const summary = await runCartRecovery();
    req.log.info({ summary }, "Cart recovery cron run complete");
    res.json({ ok: true, summary });
  } catch (err: any) {
    req.log.error({ err: err?.message }, "Cart recovery cron error");
    res.status(500).json({ error: err?.message ?? "Cart recovery failed" });
  }
});

export default router;
