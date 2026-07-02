// // ESM-compatible __dirname replacement
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Properly resolve client path
// const clientPath = path.join(__dirname, "../client");
// console.log("Resolved client path:", clientPath);

// import dotenv from "dotenv";
// dotenv.config();

// import express, { type Request, Response, NextFunction } from "express";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";
// import { db } from "./db";

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// // ✅ Serve static files from dist/public if exists
// const publicPath = path.join(__dirname, "public");
// app.use(express.static(publicPath));

// // Logging middleware
// app.use((req, res, next) => {
//   const start = Date.now();
//   const reqPath = req.path;
//   let capturedJsonResponse: Record<string, any> | undefined;

//   const originalResJson = res.json;
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson.apply(res, [bodyJson, ...args]);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (reqPath.startsWith("/api")) {
//       let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }

//       if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
//       log(logLine);
//     }
//   });

//   next();
// });

// (async () => {
//   try {
//     // ✅ Test database connection
//     await db.execute("SELECT 1");
//     console.log("✅ PostgreSQL connected successfully");

//     // ✅ Register API routes
//     const server = await registerRoutes(app);

//     // ✅ Error handler middleware
//     app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//       const status = err.status || err.statusCode || 500;
//       const message = err.message || "Internal Server Error";
//       console.error("❌ Error caught:", err);
//       res.status(status).json({ message });
//     });

//     // ✅ Static files serving
//     if (app.get("env") === "development") {
//       await setupVite(app, server);
//     } else {
//       serveStatic(app); // client/dist is served statically
//     }

//     // ✅ Start server — PORT from environment (Render sets it)
//     const port = parseInt(process.env.PORT || "5000", 10);
//     server.listen(port, () => {
//       log(`🚀 Server listening on port ${port}`);
//     });

//   } catch (error) {
//     console.error("❌ Failed to start server:", error);
//     process.exit(1);
//   }
// })();
// ESM-compatible __dirname replacement
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------- ENV and IMPORTS -------------------
import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startKeepAlive } from "./keep-alive";
import { db } from "./db";

// ------------------- EXPRESS APP SETUP -------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ------------------- CORS (split frontend/backend deploys) -------------------
// When the frontend (Vercel/Cloudflare Pages) is served from a different origin
// than this API (Render), browsers block the cross-origin requests unless the
// API returns CORS headers. Set FRONTEND_URL to the deployed frontend origin(s),
// comma-separated (e.g. "https://leetcode-tracker.vercel.app").
// If FRONTEND_URL is unset (local/monolith), CORS is a no-op and same-origin
// requests keep working as before.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  // Answer preflight requests immediately.
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Lightweight health check (used by uptime pingers to keep the free
// Render instance awake and to verify the server is up).
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// ------------------- API LOGGER -------------------
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// ------------------- BOOTSTRAP -------------------
(async () => {
  try {
    // Verify the database connection using a proper SQL template.
    // A failed check is logged but NOT fatal: the server still boots so
    // /health and the frontend stay available and API routes return their
    // own errors instead of the whole process crashing (important on
    // Render, where a transient DB blip would otherwise take the app down).
    try {
      await db.execute(sql`SELECT 1`);
      console.log("PostgreSQL connected successfully");
    } catch (dbError) {
      console.error(
        "⚠️  Database connection check failed - the server will start but " +
        "data endpoints will fail until DATABASE_URL is valid:",
        (dbError as Error).message,
      );
    }

    const server = await registerRoutes(app);

    // ✅ Vite for Dev, static for Prod (must be registered before the
    // catch-all error handler so the SPA fallback works).
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app); // handles frontend static dist
    }

    // Global error handler (registered last).
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("❌ Error caught:", err);
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Use PORT from environment (Render sets it) or default to 5000.
    // Listen on the http.Server returned by registerRoutes so websocket
    // features (e.g. Vite HMR) attach to the same server.
    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running on port ${PORT}`);
      // Keep the free Render instance warm (no-op in development).
      startKeepAlive();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
