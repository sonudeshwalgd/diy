import AsyncStorage from "@react-native-async-storage/async-storage";
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
import {
  getDisabledItems,
  getHiddenItems,
  getRestaurants,
  saveDisabledItems,
  saveHiddenItems,
  verifyStaffKey,
  type RestaurantInfo,
} from "../services/api";
import type { Combo } from "../data/products";
import {
  getComboAvailability as resolveComboAvailability,
  type ComboAvailability,
} from "../utils/comboAvailability";

export type DisabledScope = string;
export type SyncStatus = "idle" | "syncing" | "saved" | "error";

type ItemStateMode = "disabled" | "hidden";

interface DisabledItemsContextType {
  restaurants: RestaurantInfo[];
  restaurantIds: string[];
  disabledByRestaurant: Record<string, string[]>;
  hiddenByRestaurant: Record<string, string[]>;
  allDisabledIds: string[];
  allHiddenIds: string[];
  getDisabledIds: (restaurantId?: string) => string[];
  getHiddenIds: (restaurantId?: string) => string[];
  isItemDisabled: (id: string, restaurantId?: string) => boolean;
  isComboDisabled: (comboId: string, restaurantId?: string) => boolean;
  isItemHidden: (id: string, restaurantId?: string) => boolean;
  isComboHidden: (comboId: string, restaurantId?: string) => boolean;
  getComboAvailability: (combo: Combo) => ComboAvailability;
  setItemDisabled: (id: string, disabled: boolean, restaurantId?: string) => void;
  setItemHidden: (id: string, hidden: boolean, restaurantId?: string) => void;
  setItemsDisabled: (ids: string[], disabled: boolean, restaurantId?: string) => void;
  setItemsHidden: (ids: string[], hidden: boolean, restaurantId?: string) => void;
  toggleItem: (id: string, restaurantId?: string) => void;
  toggleItemHidden: (id: string, restaurantId?: string) => void;
  refresh: (restaurantId?: string) => Promise<void>;
  syncNow: (restaurantId?: string) => Promise<void>;
  unlock: (staffKey: string, restaurantId: string) => Promise<boolean>;
  lock: (restaurantId?: string) => Promise<void>;
  isUnlocked: (restaurantId?: string) => boolean;
  isVerifying: (restaurantId?: string) => boolean;
  getStatus: (restaurantId?: string) => SyncStatus;
  getError: (restaurantId?: string) => string | null;
  getLastSyncedAt: (restaurantId?: string) => string | null;
  isHiddenUnavailable: (restaurantId?: string) => boolean;
}

const AvailabilityContext = createContext<DisabledItemsContextType | undefined>(
  undefined
);

const FALLBACK_RESTAURANTS: RestaurantInfo[] = [
  {
    id: "diy-main",
    name: "Main Restaurant",
    slug: "diy-main",
    enabled: true,
    menuSource: "static",
  },
  {
    id: "diy-chinese",
    name: "DIY Chinese",
    slug: "diy-chinese",
    enabled: true,
    menuSource: "database",
  },
];

const normalizeIds = (ids: string[]) =>
  [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

const disabledStorageKey = (id: string) =>
  `diy_disabled_items_v2_${id}`;
const hiddenStorageKey = (id: string) =>
  `diy_hidden_items_v2_${id}`;

const matchesIdOrBase = (set: Set<string>, id: string) => {
  if (set.has(id)) return true;
  const baseId = id.split(":")[0];
  return baseId !== id && set.has(baseId);
};

export function DisabledItemsProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] =
    useState<RestaurantInfo[]>(FALLBACK_RESTAURANTS);
  const restaurantsRef = useRef(restaurants);
  const [disabledByRestaurant, setDisabledByRestaurant] = useState<
    Record<string, string[]>
  >({});
  const [hiddenByRestaurant, setHiddenByRestaurant] = useState<
    Record<string, string[]>
  >({});
  const disabledRef = useRef<Record<string, string[]>>({});
  const hiddenRef = useRef<Record<string, string[]>>({});
  const staffKeysRef = useRef<Record<string, string>>({});
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [loading, setLoading] = useState(true);
  const [statusBy, setStatusBy] = useState<Record<string, SyncStatus>>({});
  const [errorsBy, setErrorsBy] = useState<Record<string, string | null>>({});
  const [lastSyncedBy, setLastSyncedBy] = useState<Record<string, string | null>>({});
  const [unlockedBy, setUnlockedBy] = useState<Record<string, boolean>>({});
  const [verifyingBy, setVerifyingBy] = useState<Record<string, boolean>>({});
  const [hiddenUnavailableBy, setHiddenUnavailableBy] = useState<
    Record<string, boolean>
  >({});

  const restaurantIds = useMemo(
    () => restaurants.map((restaurant) => restaurant.id),
    [restaurants]
  );

  const slugFor = useCallback((restaurantId: string) => {
    const found = restaurantsRef.current.find(
      (restaurant) => restaurant.id === restaurantId
    );
    return found?.slug ?? restaurantId;
  }, []);

  const idsFor = useCallback(
    (restaurantId?: string) =>
      restaurantId ? [restaurantId] : restaurantIds,
    [restaurantIds]
  );

  const applyDisabled = useCallback((restaurantId: string, ids: string[]) => {
    disabledRef.current = {
      ...disabledRef.current,
      [restaurantId]: ids,
    };
    setDisabledByRestaurant(disabledRef.current);
    AsyncStorage.setItem(disabledStorageKey(restaurantId), JSON.stringify(ids)).catch(
      () => {}
    );
  }, []);

  const applyHidden = useCallback((restaurantId: string, ids: string[]) => {
    hiddenRef.current = {
      ...hiddenRef.current,
      [restaurantId]: ids,
    };
    setHiddenByRestaurant(hiddenRef.current);
    AsyncStorage.setItem(hiddenStorageKey(restaurantId), JSON.stringify(ids)).catch(
      () => {}
    );
  }, []);

  useEffect(() => {
    restaurantsRef.current = restaurants;
  }, [restaurants]);

  useEffect(() => {
    let active = true;
    (async () => {
      let loaded = restaurants;
      try {
        const remote = await getRestaurants();
        if (active && remote.length) {
          loaded = remote;
          setRestaurants(remote);
        }
      } catch {}
      if (!active) return;

      await Promise.all(
        loaded.map(async (restaurant) => {
          const [disabledRaw, hiddenRaw] = await Promise.all([
            AsyncStorage.getItem(disabledStorageKey(restaurant.id)),
            AsyncStorage.getItem(hiddenStorageKey(restaurant.id)),
          ]);
          const parse = (raw: string | null) => {
            if (!raw) return null;
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed)
                ? parsed.filter((id): id is string => typeof id === "string")
                : null;
            } catch {
              return null;
            }
          };
          const cachedDisabled = parse(disabledRaw);
          const cachedHidden = parse(hiddenRaw);
          if (cachedDisabled) applyDisabled(restaurant.id, normalizeIds(cachedDisabled));
          if (cachedHidden) applyHidden(restaurant.id, normalizeIds(cachedHidden));
          if (cachedHidden) {
            setHiddenUnavailableBy((current) => ({
              ...current,
              [restaurant.id]: false,
            }));
          }
        })
      );
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [applyDisabled, applyHidden]);

  const fetchRemote = useCallback(
    async (restaurantIdsToFetch: string[]) => {
      await Promise.all(
        restaurantIdsToFetch.map(async (restaurantId) => {
          const slug = slugFor(restaurantId);
          let failed = false;
          let message = "Could not load item availability";

          try {
            const data = await getDisabledItems(slug);
            applyDisabled(
              restaurantId,
              normalizeIds(Array.isArray(data.itemIds) ? data.itemIds : [])
            );
          } catch (err) {
            failed = true;
            message = err instanceof Error ? err.message : message;
          }

          try {
            const data = await getHiddenItems(slug);
            applyHidden(
              restaurantId,
              normalizeIds(Array.isArray(data.itemIds) ? data.itemIds : [])
            );
            setHiddenUnavailableBy((current) => ({
              ...current,
              [restaurantId]: false,
            }));
          } catch (err) {
            failed = true;
            message = err instanceof Error ? err.message : message;
            if (!hiddenRef.current[restaurantId]) {
              setHiddenUnavailableBy((current) => ({
                ...current,
                [restaurantId]: true,
              }));
            }
          }

          setStatusBy((current) => ({
            ...current,
            [restaurantId]: failed ? "error" : "saved",
          }));
          setErrorsBy((current) => ({
            ...current,
            [restaurantId]: failed ? message : null,
          }));
          if (!failed) {
            setLastSyncedBy((current) => ({
              ...current,
              [restaurantId]: new Date().toISOString(),
            }));
          }
        })
      );
    },
    [applyDisabled, applyHidden, slugFor]
  );

  useEffect(() => {
    if (!loading) return;
    void fetchRemote(restaurantIds).finally(() => setLoading(false));
  }, [fetchRemote, loading, restaurantIds]);

  const flush = useCallback(
    async (restaurantId: string, mode: ItemStateMode) => {
      const timerKey = `${restaurantId}:${mode}`;
      if (saveTimersRef.current[timerKey]) {
        clearTimeout(saveTimersRef.current[timerKey]);
        delete saveTimersRef.current[timerKey];
      }

      const staffKey = staffKeysRef.current[restaurantId];
      if (!staffKey) {
        setStatusBy((current) => ({ ...current, [restaurantId]: "error" }));
        setErrorsBy((current) => ({
          ...current,
          [restaurantId]: "Enter your staff key to save changes",
        }));
        return;
      }

      const ids =
        mode === "disabled"
          ? disabledRef.current[restaurantId] ?? []
          : hiddenRef.current[restaurantId] ?? [];
      const slug = slugFor(restaurantId);
      setStatusBy((current) => ({ ...current, [restaurantId]: "syncing" }));
      setErrorsBy((current) => ({ ...current, [restaurantId]: null }));
      try {
        if (mode === "disabled") {
          await saveDisabledItems(ids, staffKey, slug);
        } else {
          await saveHiddenItems(ids, staffKey, slug);
        }
        setLastSyncedBy((current) => ({
          ...current,
          [restaurantId]: new Date().toISOString(),
        }));
        setStatusBy((current) => ({ ...current, [restaurantId]: "saved" }));
      } catch (err) {
        setStatusBy((current) => ({ ...current, [restaurantId]: "error" }));
        setErrorsBy((current) => ({
          ...current,
          [restaurantId]:
            err instanceof Error
              ? err.message
              : "Could not save. Your changes are saved locally.",
        }));
      }
    },
    [slugFor]
  );

  const setItems = useCallback(
    (ids: string[], active: boolean, mode: ItemStateMode, restaurantId: string) => {
      if (!staffKeysRef.current[restaurantId]) {
        setErrorsBy((current) => ({
          ...current,
          [restaurantId]: "Enter your staff key to make changes",
        }));
        return;
      }

      const current =
        mode === "disabled"
          ? disabledRef.current[restaurantId] ?? []
          : hiddenRef.current[restaurantId] ?? [];
      const targets = normalizeIds(ids);
      const targetSet = new Set(targets);
      const next = active
        ? [...new Set([...current, ...targets])].sort()
        : current.filter((id) => !targetSet.has(id));
      if (sameIds(current, next)) return;

      if (mode === "disabled") {
        applyDisabled(restaurantId, next);
      } else {
        applyHidden(restaurantId, next);
      }
      setStatusBy((current) => ({ ...current, [restaurantId]: "syncing" }));
      setErrorsBy((current) => ({ ...current, [restaurantId]: null }));

      const timerKey = `${restaurantId}:${mode}`;
      if (saveTimersRef.current[timerKey]) clearTimeout(saveTimersRef.current[timerKey]);
      saveTimersRef.current[timerKey] = setTimeout(() => {
        void flush(restaurantId, mode);
      }, 500);
    },
    [applyDisabled, applyHidden, flush]
  );

  useEffect(
    () => () => {
      Object.values(saveTimersRef.current).forEach(clearTimeout);
    },
    []
  );

  const getDisabledIds = useCallback(
    (restaurantId?: string) =>
      restaurantId
        ? disabledByRestaurant[restaurantId] ?? []
        : Object.values(disabledByRestaurant).flat(),
    [disabledByRestaurant]
  );

  const getHiddenIds = useCallback(
    (restaurantId?: string) =>
      restaurantId
        ? hiddenByRestaurant[restaurantId] ?? []
        : Object.values(hiddenByRestaurant).flat(),
    [hiddenByRestaurant]
  );

  const isItemDisabled = useCallback(
    (id: string, restaurantId?: string) =>
      matchesIdOrBase(new Set(getDisabledIds(restaurantId)), id),
    [getDisabledIds]
  );

  const isItemHidden = useCallback(
    (id: string, restaurantId?: string) =>
      matchesIdOrBase(new Set(getHiddenIds(restaurantId)), id),
    [getHiddenIds]
  );

  const isComboDisabled = useCallback(
    (comboId: string, restaurantId?: string) =>
      matchesIdOrBase(new Set(getDisabledIds(restaurantId)), `combo:${comboId}`),
    [getDisabledIds]
  );

  const isComboHidden = useCallback(
    (comboId: string, restaurantId?: string) =>
      matchesIdOrBase(new Set(getHiddenIds(restaurantId)), `combo:${comboId}`),
    [getHiddenIds]
  );

  const lock = useCallback(
    async (restaurantId?: string) => {
      const selected = idsFor(restaurantId).filter(
        (id) => Boolean(staffKeysRef.current[id])
      );
      if (!selected.length) return;

      await Promise.all(
        selected.flatMap((id) => [flush(id, "disabled"), flush(id, "hidden")])
      );
      for (const id of selected) delete staffKeysRef.current[id];
      setUnlockedBy((current) => {
        if (!selected.some((id) => current[id])) return current;
        const next = { ...current };
        selected.forEach((id) => delete next[id]);
        return next;
      });
    },
    [flush, idsFor]
  );

  const value = useMemo<DisabledItemsContextType>(() => {
    const statuses = idsFor().map((id) => statusBy[id] ?? "idle");
    const status: SyncStatus = statuses.includes("error")
      ? "error"
      : statuses.includes("syncing")
        ? "syncing"
        : statuses.includes("saved")
          ? "saved"
          : "idle";
    const error = idsFor().map((id) => errorsBy[id]).find(Boolean) ?? null;
    const timestamps = idsFor()
      .map((id) => lastSyncedBy[id])
      .filter((value): value is string => Boolean(value));
    const hiddenUnavailable = idsFor().some(
      (id) => hiddenUnavailableBy[id]
    );

    return {
      restaurants,
      restaurantIds,
      disabledByRestaurant,
      hiddenByRestaurant,
      allDisabledIds: getDisabledIds(),
      allHiddenIds: getHiddenIds(),
      getDisabledIds,
      getHiddenIds,
      isItemDisabled,
      isComboDisabled,
      isItemHidden,
      isComboHidden,
      getComboAvailability: (combo) =>
        resolveComboAvailability(
          combo,
          (id) => isItemDisabled(id),
          isComboDisabled(combo.id)
        ),
      setItemDisabled: (id, disabled, restaurantId = "diy-main") =>
        setItems([id], disabled, "disabled", restaurantId),
      setItemHidden: (id, hidden, restaurantId = "diy-main") =>
        setItems([id], hidden, "hidden", restaurantId),
      setItemsDisabled: (ids, disabled, restaurantId = "diy-main") =>
        setItems(ids, disabled, "disabled", restaurantId),
      setItemsHidden: (ids, hidden, restaurantId = "diy-main") =>
        setItems(ids, hidden, "hidden", restaurantId),
      toggleItem: (id, restaurantId = "diy-main") =>
        setItems(
          [id],
          !isItemDisabled(id, restaurantId),
          "disabled",
          restaurantId
        ),
      toggleItemHidden: (id, restaurantId = "diy-main") =>
        setItems(
          [id],
          !isItemHidden(id, restaurantId),
          "hidden",
          restaurantId
        ),
      refresh: async (restaurantId) => {
        setLoading(true);
        try {
          await fetchRemote(idsFor(restaurantId));
        } finally {
          setLoading(false);
        }
      },
      syncNow: async (restaurantId) => {
        const selected = idsFor(restaurantId);
        await Promise.all(
          selected.flatMap((id) => [
            flush(id, "disabled"),
            flush(id, "hidden"),
          ])
        );
      },
      unlock: async (staffKey, restaurantId) => {
        const key = staffKey.trim();
        if (!key) return false;
        setVerifyingBy((current) => ({ ...current, [restaurantId]: true }));
        setErrorsBy((current) => ({ ...current, [restaurantId]: null }));
        try {
          const valid = await verifyStaffKey(key, slugFor(restaurantId));
          if (!valid) {
            setErrorsBy((current) => ({
              ...current,
              [restaurantId]: "Invalid staff key",
            }));
            return false;
          }
          staffKeysRef.current = {
            ...staffKeysRef.current,
            [restaurantId]: key,
          };
          setUnlockedBy((current) => ({ ...current, [restaurantId]: true }));
          return true;
        } catch (err) {
          setErrorsBy((current) => ({
            ...current,
            [restaurantId]:
              err instanceof Error ? err.message : "Could not verify staff key",
          }));
          return false;
        } finally {
          setVerifyingBy((current) => ({ ...current, [restaurantId]: false }));
        }
      },
      lock,
      isUnlocked: (restaurantId) =>
        restaurantId
          ? Boolean(unlockedBy[restaurantId])
          : idsFor().some((id) => unlockedBy[id]),
      isVerifying: (restaurantId) =>
        restaurantId
          ? Boolean(verifyingBy[restaurantId])
          : idsFor().some((id) => verifyingBy[id]),
      getStatus: (restaurantId) =>
        restaurantId ? statusBy[restaurantId] ?? "idle" : status,
      getError: (restaurantId) =>
        restaurantId ? errorsBy[restaurantId] ?? null : error,
      getLastSyncedAt: (restaurantId) =>
        restaurantId
          ? lastSyncedBy[restaurantId] ?? null
          : timestamps.sort().at(-1) ?? null,
      isHiddenUnavailable: (restaurantId) =>
        restaurantId ? Boolean(hiddenUnavailableBy[restaurantId]) : hiddenUnavailable,
    };
  }, [
    disabledByRestaurant,
    errorsBy,
    fetchRemote,
    flush,
    getDisabledIds,
    getHiddenIds,
    hiddenByRestaurant,
    hiddenUnavailableBy,
    idsFor,
    isComboDisabled,
    isComboHidden,
    isItemDisabled,
    isItemHidden,
    lastSyncedBy,
    lock,
    restaurantIds,
    restaurants,
    setItems,
    slugFor,
    statusBy,
    unlockedBy,
    verifyingBy,
  ]);

  return (
    <AvailabilityContext.Provider value={value}>
      {children}
    </AvailabilityContext.Provider>
  );
}

export function useDisabledItems(restaurantId = "diy-main") {
  const context = useContext(AvailabilityContext);
  const contextLock = context?.lock;
  const lockForScope = useCallback(
    () =>
      contextLock
        ? contextLock(restaurantId || undefined)
        : Promise.resolve(),
    [contextLock, restaurantId]
  );
  if (!context) {
    throw new Error("useDisabledItems must be used within DisabledItemsProvider");
  }
  return useMemo(
    () => ({
      disabledIds: context.getDisabledIds(restaurantId || undefined),
      disabledCount: context.getDisabledIds(restaurantId || undefined).length,
      hiddenIds: context.getHiddenIds(restaurantId || undefined),
      hiddenCount: context.getHiddenIds(restaurantId || undefined).length,
      isItemDisabled: (id: string) =>
        context.isItemDisabled(id, restaurantId || undefined),
      isComboDisabled: (comboId: string) =>
        context.isComboDisabled(comboId, restaurantId || undefined),
      isItemHidden: (id: string) =>
        context.isItemHidden(id, restaurantId || undefined),
      isComboHidden: (comboId: string) =>
        context.isComboHidden(comboId, restaurantId || undefined),
      getComboAvailability: (combo: Combo) =>
        context.getComboAvailability(combo),
      setItemDisabled: (id: string, disabled: boolean) =>
        context.setItemDisabled(id, disabled, restaurantId || "diy-main"),
      setItemHidden: (id: string, hidden: boolean) =>
        context.setItemHidden(id, hidden, restaurantId || "diy-main"),
      setItemsDisabled: (ids: string[], disabled: boolean) =>
        context.setItemsDisabled(ids, disabled, restaurantId || "diy-main"),
      setItemsHidden: (ids: string[], hidden: boolean) =>
        context.setItemsHidden(ids, hidden, restaurantId || "diy-main"),
      toggleItem: (id: string) =>
        context.toggleItem(id, restaurantId || "diy-main"),
      toggleItemHidden: (id: string) =>
        context.toggleItemHidden(id, restaurantId || "diy-main"),
      refresh: () => context.refresh(restaurantId || undefined),
      syncNow: () => context.syncNow(restaurantId || undefined),
      unlock: (staffKey: string) =>
        context.unlock(staffKey, restaurantId || "diy-main"),
      lock: lockForScope,
      unlocked: context.isUnlocked(restaurantId || undefined),
      verifying: context.isVerifying(restaurantId || undefined),
      loading:
        restaurantId === "" ? false : context.getStatus(restaurantId) === "idle",
      hiddenUnavailable: context.isHiddenUnavailable(restaurantId || undefined),
      status: context.getStatus(restaurantId || undefined),
      lastSyncedAt: context.getLastSyncedAt(restaurantId || undefined),
      error: context.getError(restaurantId || undefined),
      restaurants: context.restaurants,
      restaurantIds: context.restaurantIds,
    }),
    [context, lockForScope, restaurantId]
  );
}
