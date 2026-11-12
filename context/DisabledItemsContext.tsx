import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getDisabledItems,
  saveDisabledItems,
  verifyStaffKey,
} from "../services/api";
import type { Combo } from "../data/products";
import {
  getComboAvailability as resolveComboAvailability,
  type ComboAvailability,
} from "../utils/comboAvailability";

const STORAGE_KEY = "diy_disabled_items_v1";

export type SyncStatus = "idle" | "syncing" | "saved" | "error";

interface DisabledItemsContextType {
  disabledIds: string[];
  disabledCount: number;
  isItemDisabled: (id: string) => boolean;
  isComboDisabled: (comboId: string) => boolean;
  getComboAvailability: (combo: Combo) => ComboAvailability;
  setItemDisabled: (id: string, disabled: boolean) => void;
  toggleItem: (id: string) => void;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  unlock: (staffKey: string) => Promise<boolean>;
  lock: () => Promise<void>;
  unlocked: boolean;
  verifying: boolean;
  loading: boolean;
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
}

const DisabledItemsContext = createContext<
  DisabledItemsContextType | undefined
>(undefined);

export function DisabledItemsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [disabledIds, setDisabledIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const idsRef = useRef<string[]>([]);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staffKeyRef = useRef("");

  const applyIds = useCallback((ids: string[]) => {
    idsRef.current = ids;
    setDisabledIds(ids);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
  }, []);

  const hydrateFromCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const cached = parsed.filter(
        (id): id is string => typeof id === "string"
      );
      idsRef.current = cached;
      setDisabledIds(cached);
    } catch {
      return;
    }
  }, []);

  const fetchRemote = useCallback(async () => {
    try {
      const data = await getDisabledItems();
      const ids = Array.isArray(data.itemIds) ? data.itemIds : [];
      if (!dirtyRef.current) {
        applyIds(ids);
      }
      setLastSyncedAt(new Date().toISOString());
      setError(null);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Could not load item availability"
      );
    }
  }, [applyIds]);

  const flush = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (!staffKeyRef.current) {
      setStatus("error");
      setError("Enter your staff key to save changes");
      return;
    }

    const ids = idsRef.current;
    setStatus("syncing");
    setError(null);
    try {
      await saveDisabledItems(ids, staffKeyRef.current);
      if (idsRef.current === ids) {
        dirtyRef.current = false;
      }
      setLastSyncedAt(new Date().toISOString());
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Could not save. Your changes are saved locally."
      );
    }
  }, []);

  const queueSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      void flush();
    }, 500);
  }, [flush]);

  useEffect(() => {
    let active = true;
    (async () => {
      await hydrateFromCache();
      if (!active) return;
      await fetchRemote();
      if (!active) return;
      setLoading(false);
    })();
    return () => {
      active = false;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [hydrateFromCache, fetchRemote]);

  const unlock = useCallback(async (staffKey: string) => {
    const key = staffKey.trim();
    if (!key) return false;

    setVerifying(true);
    setError(null);
    try {
      const valid = await verifyStaffKey(key);
      if (!valid) {
        setError("Invalid staff key");
        return false;
      }
      staffKeyRef.current = key;
      setUnlocked(true);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not verify staff key"
      );
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const lock = useCallback(async () => {
    if (staffKeyRef.current) {
      await flush();
    }
    staffKeyRef.current = "";
    setUnlocked(false);
  }, [flush]);

  const setItemDisabled = useCallback(
    (id: string, disabled: boolean) => {
      if (!staffKeyRef.current) {
        setError("Enter your staff key to make changes");
        return;
      }

      const current = idsRef.current;
      if (disabled && current.includes(id)) return;
      if (!disabled && !current.includes(id)) return;

      const next = disabled
        ? [...current, id]
        : current.filter((itemId) => itemId !== id);

      dirtyRef.current = true;
      applyIds(next);
      setStatus("syncing");
      setError(null);
      queueSave();
    },
    [applyIds, queueSave]
  );

  const toggleItem = useCallback(
    (id: string) => {
      setItemDisabled(id, !idsRef.current.includes(id));
    },
    [setItemDisabled]
  );

  const syncNow = useCallback(async () => {
    await flush();
  }, [flush]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchRemote();
    setLoading(false);
  }, [fetchRemote]);

  const idSet = useMemo(() => new Set(disabledIds), [disabledIds]);

  const isItemDisabled = useCallback(
    (id: string) => {
      if (idSet.has(id)) return true;
      const baseId = id.split(":")[0];
      return baseId !== id && idSet.has(baseId);
    },
    [idSet]
  );

  const isComboDisabled = useCallback(
    (comboId: string) =>
      idSet.has(`combo:${comboId}`) || idSet.has(comboId),
    [idSet]
  );

  const getComboAvailability = useCallback(
    (combo: Combo) =>
      resolveComboAvailability(combo, isItemDisabled, isComboDisabled(combo.id)),
    [isComboDisabled, isItemDisabled]
  );

  return (
    <DisabledItemsContext.Provider
      value={{
        disabledIds,
        disabledCount: disabledIds.length,
        isItemDisabled,
        isComboDisabled,
        getComboAvailability,
        setItemDisabled,
        toggleItem,
        refresh,
        syncNow,
        unlock,
        lock,
        unlocked,
        verifying,
        loading,
        status,
        lastSyncedAt,
        error,
      }}
    >
      {children}
    </DisabledItemsContext.Provider>
  );
}

export function useDisabledItems() {
  const context = useContext(DisabledItemsContext);
  if (!context) {
    throw new Error("useDisabledItems must be used within DisabledItemsProvider");
  }
  return context;
}
