import express, { type Express } from "express";
import fs from "fs";
import path, { dirname, resolve } from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

// ✅ Fix for ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Optional but useful
const aliasPath = resolve(__dirname, "..", "client", "src");
console.log("Resolved alias path:", aliasPath);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Vite builds the client into dist/public (see vite.config.ts `build.outDir`).
  // In production the server bundle runs from dist/index.js, so __dirname is
  // the dist folder and the client assets live alongside it in ./public.
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // API-only deploy (split frontend on Vercel/Cloudflare Pages): there is no
    // client build to serve. Don't crash — just expose a root marker so the
    // service responds to "/" and let the API routes handle everything else.
    console.warn(
      `No client build at ${distPath}; running API-only (frontend deployed separately).`,
    );
    app.get("/", (_req, res) => {
      res.json({ status: "api", service: "leetcode-tracker" });
    });
    return;
  }

  app.use(express.static(distPath));

  // SPA fallback: send index.html for any non-API route.
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

export default setupVite;