import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { usePathname } from "expo-router";
import {
  endVisit,
  flushActivityEvents,
  startVisit,
  trackRoute,
} from "../services/activityTracker";

const FOCUS_THROTTLE_MS = 750;
const FLUSH_INTERVAL_MS = 30_000;

export default function ActivityTrackerSync() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const lastFocusRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = pathname;
    trackRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    void startVisit().then(() => {
      if (mounted) trackRoute(pathnameRef.current);
    });

    const checkFocus = () => {
      const now = Date.now();
      if (now - lastFocusRef.current < FOCUS_THROTTLE_MS) return;
      lastFocusRef.current = now;
      void startVisit();
      void flushActivityEvents();
    };

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") checkFocus();
      if (nextState === "background" || nextState === "inactive") {
        void endVisit().then(() => flushActivityEvents());
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", checkFocus);
    }
    const interval = setInterval(() => {
      void flushActivityEvents();
    }, FLUSH_INTERVAL_MS);

    return () => {
      mounted = false;
      subscription.remove();
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", checkFocus);
      }
      void endVisit().then(() => flushActivityEvents());
    };
  }, []);

  return null;
}
