import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Requests arrive through Replit's single reverse-proxy hop. Trusting exactly 1
// proxy hop means Express sets req.ip from the rightmost XFF entry that Replit's
// proxy appended — not from any attacker-controlled leftmost value. Do NOT use
// `true` here (trusts all hops) because that makes req.ip equal to the leftmost
// XFF, which is attacker-controlled and would defeat the per-IP rate limiter.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
