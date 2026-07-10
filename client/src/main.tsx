import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// In dev, make sure no previously-installed service worker (from a production
// build on the same origin) is left controlling the page — a stale SW serves
// index.html for Vite's module requests and breaks HMR. The SW still runs in
// production, where it's registered by vite-plugin-pwa.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
