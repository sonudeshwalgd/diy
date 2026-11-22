import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import { useCart } from "../context/CartContext";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import { flushApiLogs, setApiLogContext } from "../services/apiLogStore";
import { flushAppErrorLogs } from "../services/appErrorStore";
import { CUSTOMER_MOBILE_KEY, LAST_ORDER_ID_KEY } from "../utils/orderId";

const FOCUS_THROTTLE_MS = 750;

export default function ApiLogSync() {
  const pathname = usePathname();
  const { itemCount, total } = useCart();
  const { orderIds, activeOrders, isSyncing, lastSyncedAt } = useActiveOrders();
  const lastCheckRef = useRef(0);

  useEffect(() => {
    setApiLogContext({ route: pathname });
  }, [pathname]);

  useEffect(() => {
    setApiLogContext({ cart: { itemCount, total } });
  }, [itemCount, total]);

  useEffect(() => {
    setApiLogContext({
      activeOrders: {
        ids: orderIds,
        count: activeOrders.length,
        isSyncing,
        lastSyncedAt,
      },
    });
  }, [orderIds, activeOrders, isSyncing, lastSyncedAt]);

  useEffect(() => {
    let mounted = true;

    void AsyncStorage.multiGet([CUSTOMER_MOBILE_KEY, LAST_ORDER_ID_KEY]).then(
      (entries) => {
        if (!mounted) return;
        setApiLogContext({
          customerMobile: entries[0]?.[1] ?? null,
          lastOrderId: entries[1]?.[1] ?? null,
        });
      }
    );

    const checkLogs = () => {
      const now = Date.now();
      if (now - lastCheckRef.current < FOCUS_THROTTLE_MS) return;
      lastCheckRef.current = now;
      const nav = globalThis.navigator as { onLine?: boolean } | undefined;
      setApiLogContext({
        appState: AppState.currentState,
        isOnline: nav?.onLine ?? null,
      });
      void flushApiLogs();
      void flushAppErrorLogs();
    };

    const handleAppState = (nextState: AppStateStatus) => {
      setApiLogContext({ appState: nextState });
      if (nextState === "active") checkLogs();
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", checkLogs);
    }
    checkLogs();

    return () => {
      mounted = false;
      subscription.remove();
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", checkLogs);
      }
    };
  }, []);

  return null;
}
