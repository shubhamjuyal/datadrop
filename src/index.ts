import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { config } from "./config.js";
import { connect, disconnect } from "./db.js";
import { companiesRouter } from "./routes/companies.js";

async function main() {
  await connect();
  console.log("Connected to Mongo");

  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(companiesRouter);

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error("[unhandled]", err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);

  const server = app.listen(config.port, () => {
    console.log(`Listening on :${config.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down`);
    server.close();
    await disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
