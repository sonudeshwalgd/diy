import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  ApiError,
  getOrderById,
  type AdminOrder,
} from "../services/api";
import { isAppForeground } from "../services/apiLogStore";
import {
  getStoredOrderIds,
  removeStoredOrderIds,
  saveLastOrderId,
} from "../utils/orderId";

const INACTIVE_STATUSES = ["DELIVERED", "CANCELLED"];
const SYNC_THROTTLE_MS = 1000;

export function isActiveOrderStatus(status: string): boolean {
  return !INACTIVE_STATUSES.includes(status.toUpperCase());
}

export function getOrderKey(order: AdminOrder): string {
  return order.orderId || order._id;
}

interface ActiveOrdersContextValue {
  orderIds: string[];
  activeOrders: AdminOrder[];
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncOrders: (force?: boolean) => Promise<void>;
  rememberOrderId: (orderId: string, order?: AdminOrder) => Promise<void>;
}

const ActiveOrdersContext = createContext<ActiveOrdersContextValue | null>(null);

export function ActiveOrdersProvider({ children }: { children: ReactNode }) {
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [activeOrders, setActiveOrders] = useState<AdminOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const syncingRef = useRef(false);
  const lastStartRef = useRef(0);

  const syncOrders = useCallback(async (force = false) => {
    if (syncingRef.current || !isAppForeground()) return;
    const now = Date.now();
    if (!force && now - lastStartRef.current < SYNC_THROTTLE_MS) return;

    syncingRef.current = true;
    lastStartRef.current = now;
    setIsSyncing(true);

    try {
      const ids = await getStoredOrderIds();
      setOrderIds(ids);

      if (ids.length === 0) {
        setActiveOrders([]);
        setLastSyncedAt(Date.now());
        return;
      }

      const removedIds: string[] = [];
      const failedIds: string[] = [];
      const fetched = await Promise.all(
        ids.map(async (id) => {
          try {
            const { order } = await getOrderById(id, { silentNotFound: true });
            if (!isActiveOrderStatus(order.orderStatus)) {
              removedIds.push(id);
            }
            return { id, order };
          } catch (error) {
            const notFound =
              error instanceof ApiError &&
              (error.status === 404 ||
                error.message.toLowerCase().includes("not found"));
            if (notFound) {
              removedIds.push(id);
            } else {
              failedIds.push(id);
            }
            return { id, order: null };
          }
        })
      );

      if (removedIds.length > 0) {
        await removeStoredOrderIds(removedIds);
      }

      const removed = new Set(removedIds);
      setOrderIds(ids.filter((id) => !removed.has(id)));

      const nextActive = fetched
        .filter(
          (
            result
          ): result is { id: string; order: AdminOrder } =>
            result.order !== null &&
            isActiveOrderStatus(result.order.orderStatus)
        )
        .map((result) => result.order);

      const keyToId = new Map<string, string>();
      for (const result of fetched) {
        if (result.order) keyToId.set(getOrderKey(result.order), result.id);
      }
      const failed = new Set(failedIds);
      const fetchedIds = new Set(ids);
      const currentIds = new Set(await getStoredOrderIds());
      setActiveOrders((previous) => {
        const retained = previous.filter((order) => {
          const storedId = order.orderId || keyToId.get(order._id) || order._id;
          return (
            currentIds.has(storedId) &&
            (!fetchedIds.has(storedId) || failed.has(storedId))
          );
        });
        return [...nextActive, ...retained];
      });

      if (failedIds.length === 0) {
        setLastSyncedAt(Date.now());
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const rememberOrderId = useCallback(
    async (orderId: string, order?: AdminOrder) => {
      await saveLastOrderId(orderId);
      setOrderIds((previous) =>
        previous.includes(orderId) ? previous : [...previous, orderId]
      );
      if (order && isActiveOrderStatus(order.orderStatus)) {
        setActiveOrders((previous) => [
          order,
          ...previous.filter((existing) => getOrderKey(existing) !== getOrderKey(order)),
        ]);
      }
    },
    []
  );

  useEffect(() => {
    void syncOrders();
  }, [syncOrders]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active" && isAppForeground()) void syncOrders();
    };
    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [syncOrders]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      if (isAppForeground()) void syncOrders();
    };
    window.addEventListener("focus", handleFocus);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleFocus);
    }
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleFocus);
      }
    };
  }, [syncOrders]);

  const value = useMemo(
    () => ({
      orderIds,
      activeOrders,
      isSyncing,
      lastSyncedAt,
      syncOrders,
      rememberOrderId,
    }),
    [orderIds, activeOrders, isSyncing, lastSyncedAt, syncOrders, rememberOrderId]
  );

  return (
    <ActiveOrdersContext.Provider value={value}>
      {children}
    </ActiveOrdersContext.Provider>
  );
}

export function useActiveOrders(): ActiveOrdersContextValue {
  const context = useContext(ActiveOrdersContext);
  if (!context) {
    throw new Error("useActiveOrders must be used within ActiveOrdersProvider");
  }
  return context;
}
