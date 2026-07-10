import { useEffect } from "react";

interface EdgeSwipeOptions {
  /** How close to the left edge (px) the swipe must start. */
  edgeSize?: number;
  /** Minimum horizontal distance (px) to count as an open gesture. */
  threshold?: number;
  /** Only arm the gesture below this viewport width (px). Default: md breakpoint. */
  maxWidth?: number;
  /** Called when a left-edge swipe-right is detected. */
  onOpen: () => void;
  /** Skip while the drawer is already open. */
  enabled?: boolean;
}

/**
 * Opens something (e.g. the mobile nav drawer) when the user swipes right
 * starting from the very left edge of the screen. Touch-only; no-ops on
 * desktop widths and when the user prefers reduced motion.
 */
export function useEdgeSwipe({
  edgeSize = 24,
  threshold = 45,
  maxWidth = 768,
  onOpen,
  enabled = true,
}: EdgeSwipeOptions) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > maxWidth) return;
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX <= edgeSize) {
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      // Horizontal, rightward, and past the threshold.
      if (dx > threshold && Math.abs(dx) > Math.abs(dy)) {
        tracking = false;
        onOpen();
      }
    };

    const stop = () => {
      tracking = false;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stop, { passive: true });
    window.addEventListener("touchcancel", stop, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stop);
      window.removeEventListener("touchcancel", stop);
    };
  }, [edgeSize, threshold, maxWidth, onOpen, enabled]);
}
