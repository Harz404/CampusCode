import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { watch } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const watching = process.argv.includes("--watch");
const dist = path.join(root, "dist");

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
    plugins: [{
      name: "tailwind",
      setup(builder) {
        builder.onLoad({ filter: /\.css$/ }, async ({ path: filename }) => {
          const result = await postcss([tailwindcss({ base: root, optimize: !watching })])
            .process(await readFile(filename, "utf8"), { from: filename });
          return { contents: result.css, loader: "css", resolveDir: path.dirname(filename) };
        });
      },
    }],
  });
  await mkdir(dist, { recursive: true });
  await cp(path.join(root, "public"), dist, { recursive: true }).catch(error => {
    if (error.code !== "ENOENT") throw error;
  });
  await writeFile(path.join(dist, "index.html"), await readFile(path.join(root, "index.html")));
  console.log(`Frontend built${watching ? "; refresh your browser to see changes" : " for production"}.`);
}

if (watching) {
  let timer;
  let queue = Promise.resolve();
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(compile).catch(error => console.error("Build failed:", error));
    }, 150);
  };
  // Watch the client directory so newly added files are picked up too.
  const watcher = watch(root, { recursive: true }, (_event, filename) => {
    const relative = filename?.toString().replaceAll("\\", "/");
    if (relative === "index.html" || relative?.startsWith("src/") || relative?.startsWith("public/")) schedule();
  });
  queue = compile().catch(error => console.error("Build failed:", error));
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => { clearTimeout(timer); watcher.close(); process.exit(0); });
  }
} else {
  await compile();
}
