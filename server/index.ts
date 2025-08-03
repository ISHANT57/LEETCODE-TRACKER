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
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";

// ------------------- EXPRESS APP SETUP -------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Serve static files from dist/public if exists
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

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
    await db.execute("SELECT 1");
    console.log("PostgreSQL connected successfully");

    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // ✅ Vite for Dev, static for Prod
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app); // handles frontend static dist
    }

    // ✅ Use PORT from .env or default to 5000
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({ port, host: "0.0.0.0" }, () => {
      log(`🚀 Server running on http://localhost:${port}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
