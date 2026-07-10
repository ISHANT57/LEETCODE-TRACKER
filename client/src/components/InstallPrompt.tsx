import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, Share, X } from "lucide-react";

// The beforeinstallprompt event is not standardized in standard TypeScript definitions yet
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const SNOOZE_KEY = "lct-install-dismissed";
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isSnoozed(): boolean {
  try {
    const ts = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    return ts > 0 && Date.now() - ts < SNOOZE_MS;
  } catch {
    return false;
  }
}

function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !(window.navigator as unknown as { MSStream?: unknown }).MSStream
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(isSnoozed());
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    setIsStandalone(detectStandalone());

    // iOS never fires beforeinstallprompt — offer manual "Add to Home Screen".
    if (isIos() && !detectStandalone() && !isSnoozed()) {
      setShowIosHint(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowIosHint(false);
    };

    // React to the app being launched/switched into standalone mode.
    const displayModeMql = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    displayModeMql.addEventListener?.("change", handleDisplayModeChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeMql.removeEventListener?.("change", handleDisplayModeChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissed(true);
    setShowIosHint(false);
    setDeferredPrompt(null);
  };

  const showInstallCard = !dismissed && !isStandalone && !!deferredPrompt;
  const showIosCard = !dismissed && !isStandalone && showIosHint;

  // Nothing to show when installed and online.
  if (isStandalone && !isOffline) return null;

  return (
    <div className="safe-inset-bottom fixed bottom-4 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {isOffline && (
        <div className="bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg pointer-events-auto flex items-center justify-between animate-fade-in text-sm font-medium">
          <span>You are currently offline. Using cached data.</span>
        </div>
      )}

      {showInstallCard && (
        <div className="bg-card text-card-foreground p-4 rounded-xl shadow-xl border border-border pointer-events-auto flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex flex-col">
            <span className="font-semibold">Install LeetCode Tracker</span>
            <span className="text-xs text-muted-foreground">Add to home screen for a better experience</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button onClick={handleInstallClick} size="sm" className="gap-2">
              <DownloadCloud className="w-4 h-4" />
              Install
            </Button>
            <Button onClick={snooze} size="icon" variant="ghost" aria-label="Dismiss install prompt" className="min-touch">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {showIosCard && (
        <div className="bg-card text-card-foreground p-4 rounded-xl shadow-xl border border-border pointer-events-auto flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex flex-col text-sm">
            <span className="font-semibold">Install LeetCode Tracker</span>
            <span className="text-xs text-muted-foreground">
              Tap the Share icon <Share className="inline w-3.5 h-3.5 -mt-0.5" /> then
              “Add to Home Screen”.
            </span>
          </div>
          <Button onClick={snooze} size="icon" variant="ghost" aria-label="Dismiss install prompt" className="min-touch shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
