import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { serveClient } from "../dist/client.js";

test("Express serves React routes and assets without masking API errors", async () => {
  const app = express();
  app.get("/api/example", (_req, res) => res.json({ ok: true }));
  serveClient(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ["/", "/dashboard/projects", "/login"]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /id="root"/);
    }
    for (const [asset, type] of [["app.js", /javascript/], ["app.css", /text\/css/]]) {
      const response = await fetch(`${base}/assets/${asset}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), type);
      assert.ok((await response.text()).length > 100);
    }
    assert.deepEqual(await (await fetch(base + "/api/example")).json(), { ok: true });
    const missingApi = await fetch(base + "/api/missing");
    assert.equal(missingApi.status, 404);
    assert.deepEqual(await missingApi.json(), { error: "API route not found" });
    assert.equal((await fetch(base + "/assets/missing.js")).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
