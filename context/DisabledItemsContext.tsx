import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type Context,
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
  getHiddenItems,
  saveDisabledItems,
  saveHiddenItems,
  verifyStaffKey,
} from "../services/api";
import type { Combo } from "../data/products";
import {
  getComboAvailability as resolveComboAvailability,
  type ComboAvailability,
} from "../utils/comboAvailability";

export type DisabledScope = "global" | "diy_chineese";

const DISABLED_STORAGE_KEYS: Record<DisabledScope, string> = {
  global: "diy_disabled_items_v1",
  diy_chineese: "diy_disabled_items_diy_chineese_v1",
};

const HIDDEN_STORAGE_KEYS: Record<DisabledScope, string> = {
  global: "diy_hidden_items_v1",
  diy_chineese: "diy_hidden_items_diy_chineese_v1",
};

export type SyncStatus = "idle" | "syncing" | "saved" | "error";

type ItemStateMode = "disabled" | "hidden";

interface DisabledItemsContextType {
  disabledIds: string[];
  disabledCount: number;
  hiddenIds: string[];
  hiddenCount: number;
  isItemDisabled: (id: string) => boolean;
  isComboDisabled: (comboId: string) => boolean;
  isItemHidden: (id: string) => boolean;
  isComboHidden: (comboId: string) => boolean;
  getComboAvailability: (combo: Combo) => ComboAvailability;
  setItemDisabled: (id: string, disabled: boolean) => void;
  setItemHidden: (id: string, hidden: boolean) => void;
  setItemsDisabled: (ids: string[], disabled: boolean) => void;
  setItemsHidden: (ids: string[], hidden: boolean) => void;
  toggleItem: (id: string) => void;
  toggleItemHidden: (id: string) => void;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
  unlock: (staffKey: string) => Promise<boolean>;
  lock: () => Promise<void>;
  unlocked: boolean;
  verifying: boolean;
  loading: boolean;
  hiddenUnavailable: boolean;
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
}

const disabledItemsContexts: Record<
  DisabledScope,
  Context<DisabledItemsContextType | undefined>
> = {
  global: createContext<DisabledItemsContextType | undefined>(undefined),
  diy_chineese: createContext<DisabledItemsContextType | undefined>(undefined),
};

const normalizeIds = (ids: string[]) =>
  [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

function DisabledItemsProviderImpl({
  scope,
  children,
}: {
  scope: DisabledScope;
  children: React.ReactNode;
}) {
  const disabledStorageKey = DISABLED_STORAGE_KEYS[scope];
  const hiddenStorageKey = HIDDEN_STORAGE_KEYS[scope];
  const restaurant = scope === "diy_chineese" ? "diy_chineese" : undefined;

  const [disabledIds, setDisabledIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenUnavailable, setHiddenUnavailable] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const disabledIdsRef = useRef<string[]>([]);
  const hiddenIdsRef = useRef<string[]>([]);
  const disabledDirtyRef = useRef(false);
  const hiddenDirtyRef = useRef(false);
  const hiddenSnapshotAvailableRef = useRef(false);
  const disabledSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staffKeyRef = useRef("");

  const applyDisabledIds = useCallback(
    (ids: string[]) => {
      disabledIdsRef.current = ids;
      setDisabledIds(ids);
      AsyncStorage.setItem(disabledStorageKey, JSON.stringify(ids)).catch(
        () => {}
      );
    },
    [disabledStorageKey]
  );

  const applyHiddenIds = useCallback(
    (ids: string[]) => {
      hiddenIdsRef.current = ids;
      setHiddenIds(ids);
      AsyncStorage.setItem(hiddenStorageKey, JSON.stringify(ids)).catch(
        () => {}
      );
    },
    [hiddenStorageKey]
  );

  const hydrateFromCache = useCallback(async () => {
    let hiddenSnapshotAvailable = false;
    try {
      const [disabledRaw, hiddenRaw] = await Promise.all([
        AsyncStorage.getItem(disabledStorageKey),
        AsyncStorage.getItem(hiddenStorageKey),
      ]);
      if (disabledRaw) {
        try {
          const parsed = JSON.parse(disabledRaw);
          if (Array.isArray(parsed)) {
            applyDisabledIds(
              parsed.filter((id): id is string => typeof id === "string")
            );
          }
        } catch {}
      }
      if (hiddenRaw) {
        try {
          const parsed = JSON.parse(hiddenRaw);
          if (Array.isArray(parsed)) {
            hiddenSnapshotAvailable = true;
            applyHiddenIds(
              parsed.filter((id): id is string => typeof id === "string")
            );
          }
        } catch {}
      }
    } catch {}
    hiddenSnapshotAvailableRef.current = hiddenSnapshotAvailable;
    return hiddenSnapshotAvailable;
  }, [applyDisabledIds, applyHiddenIds, disabledStorageKey, hiddenStorageKey]);

  const fetchRemote = useCallback(async () => {
    let failed = false;
    let message = "Could not load item availability";

    try {
      const data = await getDisabledItems(restaurant);
      const ids = normalizeIds(
        Array.isArray(data.itemIds) ? data.itemIds : []
      );
      if (!disabledDirtyRef.current) applyDisabledIds(ids);
    } catch (err) {
      failed = true;
      message = err instanceof Error ? err.message : message;
    }

    try {
      const data = await getHiddenItems(restaurant);
      const ids = normalizeIds(
        Array.isArray(data.itemIds) ? data.itemIds : []
      );
      if (!hiddenDirtyRef.current) applyHiddenIds(ids);
      hiddenSnapshotAvailableRef.current = true;
      setHiddenUnavailable(false);
    } catch (err) {
      failed = true;
      message = err instanceof Error ? err.message : message;
      if (
        scope === "diy_chineese" &&
        !hiddenSnapshotAvailableRef.current &&
        !hiddenDirtyRef.current
      ) {
        setHiddenUnavailable(true);
      }
    }

    if (failed) {
      setStatus("error");
      setError(message);
      return;
    }

    setLastSyncedAt(new Date().toISOString());
    setError(null);
    setStatus("saved");
  }, [applyDisabledIds, applyHiddenIds, restaurant, scope]);

  const flushDisabled = useCallback(async () => {
    if (disabledSaveTimer.current) {
      clearTimeout(disabledSaveTimer.current);
      disabledSaveTimer.current = null;
    }

    if (!staffKeyRef.current) {
      setStatus("error");
      setError("Enter your staff key to save changes");
      return;
    }

    const ids = disabledIdsRef.current;
    setStatus("syncing");
    setError(null);
    try {
      await saveDisabledItems(ids, staffKeyRef.current, restaurant);
      if (disabledIdsRef.current === ids) disabledDirtyRef.current = false;
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
  }, [restaurant]);

  const flushHidden = useCallback(async () => {
    if (hiddenSaveTimer.current) {
      clearTimeout(hiddenSaveTimer.current);
      hiddenSaveTimer.current = null;
    }

    if (!staffKeyRef.current) {
      setStatus("error");
      setError("Enter your staff key to save changes");
      return;
    }

    const ids = hiddenIdsRef.current;
    setStatus("syncing");
    setError(null);
    try {
      await saveHiddenItems(ids, staffKeyRef.current, restaurant);
      if (hiddenIdsRef.current === ids) hiddenDirtyRef.current = false;
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
  }, [restaurant]);

  const queueSave = useCallback(
    (mode: ItemStateMode) => {
      const timer =
        mode === "disabled" ? disabledSaveTimer : hiddenSaveTimer;
      const flushFn = mode === "disabled" ? flushDisabled : flushHidden;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flushFn();
      }, 500);
    },
    [flushDisabled, flushHidden]
  );

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
      if (disabledSaveTimer.current) clearTimeout(disabledSaveTimer.current);
      if (hiddenSaveTimer.current) clearTimeout(hiddenSaveTimer.current);
    };
  }, [fetchRemote, hydrateFromCache]);

  const unlock = useCallback(
    async (staffKey: string) => {
      const key = staffKey.trim();
      if (!key) return false;

      setVerifying(true);
      setError(null);
      try {
        const valid = await verifyStaffKey(key, restaurant);
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
    },
    [restaurant]
  );

  const lock = useCallback(async () => {
    if (staffKeyRef.current) {
      await Promise.all([flushDisabled(), flushHidden()]);
    }
    staffKeyRef.current = "";
    setUnlocked(false);
  }, [flushDisabled, flushHidden]);

  const setItems = useCallback(
    (ids: string[], active: boolean, mode: ItemStateMode) => {
      if (!staffKeyRef.current) {
        setError("Enter your staff key to make changes");
        return;
      }

      const current = mode === "disabled" ? disabledIdsRef.current : hiddenIdsRef.current;
      const targets = normalizeIds(ids);
      const targetSet = new Set(targets);
      const next = active
        ? [...new Set([...current, ...targets])].sort()
        : current.filter((id) => !targetSet.has(id));

      if (sameIds(current, next)) return;

      if (mode === "disabled") {
        disabledDirtyRef.current = true;
        applyDisabledIds(next);
      } else {
        hiddenDirtyRef.current = true;
        applyHiddenIds(next);
      }
      setStatus("syncing");
      setError(null);
      queueSave(mode);
    },
    [applyDisabledIds, applyHiddenIds, queueSave]
  );

  const setItemDisabled = useCallback(
    (id: string, disabled: boolean) => setItems([id], disabled, "disabled"),
    [setItems]
  );

  const setItemHidden = useCallback(
    (id: string, hidden: boolean) => setItems([id], hidden, "hidden"),
    [setItems]
  );

  const setItemsDisabled = useCallback(
    (ids: string[], disabled: boolean) => setItems(ids, disabled, "disabled"),
    [setItems]
  );

  const setItemsHidden = useCallback(
    (ids: string[], hidden: boolean) => setItems(ids, hidden, "hidden"),
    [setItems]
  );

  const toggleItem = useCallback(
    (id: string) => {
      setItemDisabled(id, !disabledIdsRef.current.includes(id));
    },
    [setItemDisabled]
  );

  const toggleItemHidden = useCallback(
    (id: string) => {
      setItemHidden(id, !hiddenIdsRef.current.includes(id));
    },
    [setItemHidden]
  );

  const syncNow = useCallback(async () => {
    await Promise.all([flushDisabled(), flushHidden()]);
  }, [flushDisabled, flushHidden]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchRemote();
    setLoading(false);
  }, [fetchRemote]);

  const disabledIdSet = useMemo(() => new Set(disabledIds), [disabledIds]);
  const hiddenIdSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const matchesIdOrBase = useCallback((set: Set<string>, id: string) => {
    if (set.has(id)) return true;
    const baseId = id.split(":")[0];
    return baseId !== id && set.has(baseId);
  }, []);

  const isItemDisabled = useCallback(
    (id: string) => matchesIdOrBase(disabledIdSet, id),
    [disabledIdSet, matchesIdOrBase]
  );

  const isItemHidden = useCallback(
    (id: string) => matchesIdOrBase(hiddenIdSet, id),
    [hiddenIdSet, matchesIdOrBase]
  );

  const isComboDisabled = useCallback(
    (comboId: string) =>
      matchesIdOrBase(disabledIdSet, `combo:${comboId}`),
    [disabledIdSet, matchesIdOrBase]
  );

  const isComboHidden = useCallback(
    (comboId: string) => matchesIdOrBase(hiddenIdSet, `combo:${comboId}`),
    [hiddenIdSet, matchesIdOrBase]
  );

  const getComboAvailability = useCallback(
    (combo: Combo) =>
      resolveComboAvailability(combo, isItemDisabled, isComboDisabled(combo.id)),
    [isComboDisabled, isItemDisabled]
  );

  const Context = disabledItemsContexts[scope];

  return (
    <Context.Provider
      value={{
        disabledIds,
        disabledCount: disabledIds.length,
        hiddenIds,
        hiddenCount: hiddenIds.length,
        isItemDisabled,
        isComboDisabled,
        isItemHidden,
        isComboHidden,
        getComboAvailability,
        setItemDisabled,
        setItemHidden,
        setItemsDisabled,
        setItemsHidden,
        toggleItem,
        toggleItemHidden,
        refresh,
        syncNow,
        unlock,
        lock,
        unlocked,
        verifying,
        loading,
        hiddenUnavailable,
        status,
        lastSyncedAt,
        error,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function DisabledItemsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DisabledItemsProviderImpl scope="global">
      {children}
    </DisabledItemsProviderImpl>
  );
}

export function DiyChineseDisabledItemsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DisabledItemsProviderImpl scope="diy_chineese">
      {children}
    </DisabledItemsProviderImpl>
  );
}

export function useDisabledItems(scope: DisabledScope = "global") {
  const context = useContext(disabledItemsContexts[scope]);
  if (!context) {
    throw new Error(
      `useDisabledItems must be used within DisabledItemsProvider (${scope})`
    );
  }
  return context;
}
