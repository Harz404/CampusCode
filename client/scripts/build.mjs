import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { watch, createReadStream } from "node:fs";
import { cp, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { createServer, request as httpRequest } from "node:http";
import { exec } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const watching = process.argv.includes("--watch");
const dist = path.join(root, "dist");
const liveClients = new Set();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

function openBrowser(url) {
  try {
    const cmd =
      process.platform === "win32"
        ? `cmd /c start "" "${url}"`
        : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
    exec(cmd, () => {});
  } catch {
    // Non-fatal if browser cannot be automatically launched
  }
}

async function compile() {
  await build({
    absWorkingDir: root,
    entryPoints: ["src/main.jsx"],
    bundle: true,
    outdir: "dist/assets",
    entryNames: "app",
    format: "esm",
    platform: "browser",
    target: ["es2020"],
    jsx: "automatic",
    alias: { "@": path.join(root, "src") },
    define: { "process.env.NODE_ENV": JSON.stringify(watching ? "development" : "production") },
    minify: !watching,
    sourcemap: watching,
    plugins: [
      {
        name: "tailwind",
        setup(builder) {
          builder.onLoad({ filter: /\.css$/ }, async ({ path: filename }) => {
            const result = await postcss([tailwindcss({ base: root, optimize: !watching })]).process(
              await readFile(filename, "utf8"),
              { from: filename }
            );
            return { contents: result.css, loader: "css", resolveDir: path.dirname(filename) };
          });
        },
      },
    ],
  });

  await mkdir(dist, { recursive: true });
  await cp(path.join(root, "public"), dist, { recursive: true }).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });

  let indexHtml = await readFile(path.join(root, "index.html"), "utf8");
  if (watching) {
    // Inject live reload client script
    const liveReloadScript = `
    <script>
      (function() {
        const source = new EventSource('/__livereload');
        source.onmessage = function(e) {
          if (e.data === 'reload') {
            window.location.reload();
          }
        };
      })();
    </script>
    `;
    indexHtml = indexHtml.replace("</body>", `${liveReloadScript}</body>`);
  }

  await writeFile(path.join(dist, "index.html"), indexHtml);

  // Notify any connected browser tabs to reload
  if (watching && liveClients.size > 0) {
    for (const client of liveClients) {
      try {
        client.write("data: reload\n\n");
      } catch {
        liveClients.delete(client);
      }
    }
  }

  console.log(`[Frontend] Built successfully${watching ? " (watching for changes)" : " for production"}.`);
}

function startDevServer(preferredPort = 5173) {
  const server = createServer(async (req, res) => {
    // Live Reload SSE endpoint
    if (req.url === "/__livereload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write("\n");
      liveClients.add(res);
      req.on("close", () => liveClients.delete(res));
      return;
    }

    // Proxy API requests to backend Express server on port 5000
    if (req.url?.startsWith("/api")) {
      const proxyReq = httpRequest(
        {
          hostname: "127.0.0.1",
          port: 5000,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: "127.0.0.1:5000",
          },
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      );

      proxyReq.on("error", () => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Backend Server Offline",
            message: "Ensure your server is running on port 5000 (cd server && npm run dev)",
          })
        );
      });

      req.pipe(proxyReq, { end: true });
      return;
    }

    // Serve static files from dist/
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const filePath = path.join(dist, decodeURIComponent(parsedUrl.pathname));

      const fileStat = await stat(filePath).catch(() => null);
      if (fileStat && fileStat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        createReadStream(filePath).pipe(res);
        return;
      }
    } catch {
      // Fall through to index.html
    }

    // SPA Fallback: serve index.html for all client routes
    try {
      const htmlContent = await readFile(path.join(dist, "index.html"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(htmlContent);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Frontend build not ready yet. Please wait...");
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Port ${preferredPort} in use, trying ${preferredPort + 1}...]`);
      startDevServer(preferredPort + 1);
    } else {
      console.error("[Dev Server Error]:", err);
    }
  });

  server.listen(preferredPort, () => {
    const localUrl = `http://localhost:${preferredPort}`;
    console.log(`\n======================================================`);
    console.log(`🚀 CampusCode Frontend running at:  ${localUrl}`);
    console.log(`📡 API Proxy connected to:        http://localhost:5000`);
    console.log(`======================================================\n`);

    openBrowser(localUrl);
  });
}

if (watching) {
  let timer;
  let queue = Promise.resolve();
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(compile).catch((error) => console.error("Build failed:", error));
    }, 150);
  };

  // Watch the client directory for changes
  const watcher = watch(root, { recursive: true }, (_event, filename) => {
    const relative = filename?.toString().replaceAll("\\", "/");
    if (relative === "index.html" || relative?.startsWith("src/") || relative?.startsWith("public/")) {
      schedule();
    }
  });

  queue = compile()
    .then(() => {
      startDevServer(Number(process.env.PORT) || 5173);
    })
    .catch((error) => console.error("Initial build failed:", error));

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      clearTimeout(timer);
      watcher.close();
      process.exit(0);
    });
  }
} else {
  await compile();
}
