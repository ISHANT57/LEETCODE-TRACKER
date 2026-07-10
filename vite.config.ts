// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// export default defineConfig({
//   plugins: [
//     react(),
//     runtimeErrorOverlay(),
//     ...(process.env.NODE_ENV !== "production" &&
//     process.env.REPL_ID !== undefined
//       ? [
//           await import("@replit/vite-plugin-cartographer").then((m) =>
//             m.cartographer(),
//           ),
//         ]
//       : []),
//   ],
//   resolve: {
//     alias: {
//       "@": path.resolve(import.meta.dirname, "client", "src"),
//       "@shared": path.resolve(import.meta.dirname, "shared"),
//       "@assets": path.resolve(import.meta.dirname, "attached_assets"),
//     },
//   },
//   root: path.resolve(import.meta.dirname, "client"),
//   build: {
//     outDir: path.resolve(import.meta.dirname, "dist/public"),
//     emptyOutDir: true,
//   },
//   server: {
//     fs: {
//       strict: true,
//       deny: ["**/.*"],
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { VitePWA } from "vite-plugin-pwa";

// 👇 Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Vite config
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "favicon-16.png",
        "favicon-32.png",
        "apple-touch-icon.png",
        "offline.html",
      ],
      manifest: {
        id: "/",
        name: "LeetCode Tracker — Batch Progress Dashboard",
        short_name: "LCT",
        description:
          "Track and compare LeetCode progress across student batches in real-time.",
        lang: "en",
        dir: "ltr",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#0f172a",
        categories: ["education", "productivity"],
        icons: [
          { src: "/icon-72.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/icon-96.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/icon-128.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icon-152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/maskable-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/monochrome-icon.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
        ],
        screenshots: [
          {
            src: "/screenshot-desktop.png",
            sizes: "1440x1024",
            type: "image/png",
            form_factor: "wide",
            label: "LeetCode Tracker dashboard on desktop",
          },
          {
            src: "/screenshot-mobile.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow",
            label: "LeetCode Tracker dashboard on mobile",
          },
        ],
        shortcuts: [
          {
            name: "All Students",
            short_name: "Students",
            description: "Browse the full student directory",
            url: "/?source=pwa-shortcut",
            icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "Leaderboard",
            short_name: "Leaderboard",
            description: "See the top solvers",
            url: "/leaderboard?source=pwa-shortcut",
            icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
          },
          {
            name: "Analytics",
            short_name: "Analytics",
            description: "View batch analytics",
            url: "/analytics?source=pwa-shortcut",
            icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        // Never hijack API calls with the SPA shell — let them hit the network.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Dashboards work offline using the last-known API response.
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith("/api") && request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Keep the service worker OUT of dev — an active SW in dev intercepts
        // Vite's module requests (/src/main.tsx, /@vite/client) and returns
        // index.html, breaking HMR with "Expected a JavaScript module" errors.
        // The SW is still generated and tested via the production build.
        enabled: false,
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  // Load .env from the project root (not the client/ root), so the same file
  // the server reads also feeds VITE_* vars into the client build.
  envDir: __dirname,
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Split heavy vendors out of the main bundle for faster first paint.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "wouter"],
          "chart-vendor": ["recharts"],
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
