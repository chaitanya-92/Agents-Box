import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/error-handler";
import { notFoundHandler } from "@/middleware/not-found";
import { apiRouter } from "@/routes";
import { passport } from "@/modules/auth/google.strategy";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true
    })
  );
  app.use(cookieParser());
  app.use(
    express.json({
      limit: "2mb",
      verify: (req, _res, buffer) => {
        req.rawBody = buffer.toString();
      }
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());

  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
