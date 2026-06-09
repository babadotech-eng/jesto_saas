import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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

// Serve the Vite frontend whenever the build folder is found.
// Try candidate paths to handle different CWDs (monorepo root vs api-server dir).
const candidateDirs = [
  path.resolve(process.cwd(), "artifacts/precifica/dist/public"),
  path.resolve(process.cwd(), "../precifica/dist/public"),
  path.resolve(process.cwd(), "../../artifacts/precifica/dist/public"),
];

const publicDir = candidateDirs.find(existsSync) ?? null;

if (publicDir) {
  logger.info({ publicDir }, "Serving frontend static files");
  app.use(express.static(publicDir));

  // SPA fallback: let React/Vite handle routes like /login, /dashboard, etc.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  logger.warn({ candidateDirs }, "Frontend static build not found — API-only mode");
  app.get("/", (_req, res) => {
    res.send("Precifica API online. Frontend static build not found.");
  });
}

export default app;
