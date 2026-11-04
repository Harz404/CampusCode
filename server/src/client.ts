import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function serveClient(app: Express) {
  const clientDist = fileURLToPath(new URL("../../client/dist/", import.meta.url));

  // Unknown API requests must return JSON, never the React page.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    // Missing assets should remain 404s; browser routes receive the SPA shell.
    if (req.path.startsWith("/assets/") || path.extname(req.path) || !req.accepts("html")) {
      res.sendStatus(404);
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"), error => {
      if (!error) return;
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        res.status(503).send("Frontend is not built yet. Run npm run build in the client directory.");
        return;
      }
      next(error);
    });
  });
}
