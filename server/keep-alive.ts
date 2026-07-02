/**
 * Free keep-alive for Render's free tier.
 *
 * Render free web services spin down after ~15 minutes without inbound
 * HTTP traffic, so the next visitor waits ~50s for a cold start. This
 * pings the service's own public /health URL on an interval (< 15 min),
 * which counts as inbound traffic and keeps the instance warm — no
 * external uptime service required.
 *
 * Render automatically provides RENDER_EXTERNAL_URL. You can also set
 * KEEP_ALIVE_URL manually (any host) or KEEP_ALIVE_INTERVAL_MS to tune
 * the cadence. The pinger only runs in production and only when a URL
 * is available, so local development is unaffected.
 */

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (< Render's 15m idle window)

export function startKeepAlive(): void {
  if (process.env.NODE_ENV !== "production") return;

  const baseUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) {
    console.log(
      "Keep-alive disabled: set RENDER_EXTERNAL_URL or KEEP_ALIVE_URL to enable.",
    );
    return;
  }

  const healthUrl = `${baseUrl.replace(/\/$/, "")}/health`;
  const intervalMs = parseInt(
    process.env.KEEP_ALIVE_INTERVAL_MS || String(DEFAULT_INTERVAL_MS),
    10,
  );

  const ping = async () => {
    try {
      const res = await fetch(healthUrl, { method: "GET" });
      if (!res.ok) {
        console.warn(`Keep-alive ping got HTTP ${res.status} from ${healthUrl}`);
      }
    } catch (error) {
      console.warn(`Keep-alive ping failed: ${(error as Error).message}`);
    }
  };

  const timer = setInterval(ping, intervalMs);
  // Don't let the interval keep the process alive on its own.
  if (typeof timer.unref === "function") timer.unref();

  console.log(
    `Keep-alive enabled: pinging ${healthUrl} every ${Math.round(intervalMs / 60000)} min`,
  );
}
