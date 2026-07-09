import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react";

// The beforeinstallprompt event is not standardized in standard TypeScript definitions yet
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    // Offline handling
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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

  if (isStandalone && !isOffline) {
    return null; // Don't show anything if already installed and online
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-8 md:right-8 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {isOffline && (
        <div className="bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg pointer-events-auto flex items-center justify-between animate-fade-in text-sm font-medium">
          <span>You are currently offline. Using cached data.</span>
        </div>
      )}
      
      {deferredPrompt && !isStandalone && (
        <div className="bg-card text-card-foreground p-4 rounded-xl shadow-xl border border-border pointer-events-auto flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex flex-col">
            <span className="font-semibold">Install LeetCode Tracker</span>
            <span className="text-xs text-muted-foreground">Add to home screen for a better experience</span>
          </div>
          <Button onClick={handleInstallClick} size="sm" className="shrink-0 gap-2">
            <DownloadCloud className="w-4 h-4" />
            Install
          </Button>
        </div>
      )}
    </div>
  );
}
