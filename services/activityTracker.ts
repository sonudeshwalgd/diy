import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { apiFetch } from "./apiClient";
import { getApiLogContext } from "./apiLogStore";
import { getUserToken } from "./userToken";

const ACTIVITY_EVENTS_KEY = "diy_activity_events_v1";
const ACTIVITY_META_KEY = "diy_activity_meta_v1";
const MAX_LOCAL_EVENTS = 1000;
const MAX_BATCH_EVENTS = 50;
const MIN_VISIT_GAP_MS = 30_000;

interface ActivityMeta {
  firstVisitAt: string;
  lastVisitAt: string;
  lastSessionEndAt: string | null;
  visitCount: number;
  orderCount: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
}

export interface ActivityEventData {
  name?: string;
  route?: string | null;
  categoryId?: string;
  categoryName?: string;
  productId?: string;
  productName?: string;
  restaurant?: string;
  price?: number;
  quantity?: number;
  value?: number;
  durationMs?: number;
  position?: number;
  scrollDepth?: number;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityEventInput extends ActivityEventData {
  type: string;
}

export interface ActivityEvent extends ActivityEventInput {
  id: string;
  visitorId: string;
  sessionId: string;
  occurredAt: string;
  route: string | null;
  appState: string | null;
  visitCount: number;
  orderCount: number;
  hasOrdered: boolean;
  context: Record<string, unknown>;
}

let sessionId: string | null = null;
let sessionStartedAt: number | null = null;
let flushing = false;
const seenActivityKeys = new Set<string>();
const timings = new Map<string, number>();

const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

async function readEvents(): Promise<ActivityEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_EVENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ActivityEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeEvents(events: ActivityEvent[]): Promise<void> {
  await AsyncStorage.setItem(
    ACTIVITY_EVENTS_KEY,
    JSON.stringify(events.slice(-MAX_LOCAL_EVENTS))
  );
}

async function readMeta(): Promise<ActivityMeta> {
  const now = new Date().toISOString();
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_META_KEY);
    if (!raw) {
      return {
        firstVisitAt: now,
        lastVisitAt: now,
        lastSessionEndAt: null,
        visitCount: 0,
        orderCount: 0,
        firstOrderAt: null,
        lastOrderAt: null,
      };
    }
    const parsed = JSON.parse(raw) as Partial<ActivityMeta>;
    return {
      firstVisitAt: parsed.firstVisitAt ?? now,
      lastVisitAt: parsed.lastVisitAt ?? now,
      lastSessionEndAt: parsed.lastSessionEndAt ?? null,
      visitCount: parsed.visitCount ?? 0,
      orderCount: parsed.orderCount ?? 0,
      firstOrderAt: parsed.firstOrderAt ?? null,
      lastOrderAt: parsed.lastOrderAt ?? null,
    };
  } catch {
    return {
      firstVisitAt: now,
      lastVisitAt: now,
      lastSessionEndAt: null,
      visitCount: 0,
      orderCount: 0,
      firstOrderAt: null,
      lastOrderAt: null,
    };
  }
}

async function writeMeta(meta: ActivityMeta): Promise<void> {
  await AsyncStorage.setItem(ACTIVITY_META_KEY, JSON.stringify(meta));
}

export async function trackActivity(input: ActivityEventInput): Promise<void> {
  if (input.dedupeKey) {
    if (seenActivityKeys.has(input.dedupeKey)) return;
    seenActivityKeys.add(input.dedupeKey);
  }

  const [visitorId, meta, rawContext] = await Promise.all([
    getUserToken(),
    readMeta(),
    Promise.resolve(getApiLogContext()),
  ]);
  const context: Record<string, unknown> = {
    route: typeof rawContext.route === "string" ? rawContext.route : null,
    appState: rawContext.appState ?? null,
    isOnline: rawContext.isOnline ?? null,
    cart: rawContext.cart ?? null,
    activeOrders: rawContext.activeOrders ?? null,
  };

  const { dedupeKey: _dedupeKey, ...payload } = input;
  const event: ActivityEvent = {
    ...payload,
    id: createId("evt"),
    visitorId,
    sessionId: sessionId ?? createId("ses"),
    occurredAt: new Date().toISOString(),
    route: typeof context.route === "string" ? context.route : null,
    appState: AppState.currentState ?? null,
    visitCount: meta.visitCount,
    orderCount: meta.orderCount,
    hasOrdered: meta.orderCount > 0,
    context,
  };

  const events = await readEvents();
  events.push(event);
  await writeEvents(events);

  if (events.length >= MAX_BATCH_EVENTS) {
    void flushActivityEvents();
  }
}

export async function startVisit(force = false): Promise<boolean> {
  const now = Date.now();
  const meta = await readMeta();
  const previous = meta.lastVisitAt ? Date.parse(meta.lastVisitAt) : NaN;
  const gapMs = Number.isFinite(previous) ? Math.max(0, now - previous) : null;

  if (!force && gapMs !== null && gapMs < MIN_VISIT_GAP_MS) return false;

  const visitCount = meta.visitCount + 1;
  const firstVisitAt = meta.firstVisitAt || new Date(now).toISOString();
  sessionId = createId("ses");
  sessionStartedAt = now;
  seenActivityKeys.clear();

  await writeMeta({
    ...meta,
    firstVisitAt,
    lastVisitAt: new Date(now).toISOString(),
    visitCount,
  });

  await trackActivity({
    type: "visit_start",
    name: "Opened application",
    metadata: {
      visitCount,
      isReturning: visitCount > 1,
      gapMs,
      firstVisitAt,
      previousVisitAt: meta.lastVisitAt,
      lastOrderAt: meta.lastOrderAt,
    },
  });

  if (visitCount > 1 && meta.lastOrderAt) {
    const lastOrder = Date.parse(meta.lastOrderAt);
    await trackActivity({
      type: "post_order_revisit",
      name: "Returned after placing an order",
      metadata: {
        visitCount,
        hoursSinceOrder: Number.isFinite(lastOrder)
          ? Math.round(((now - lastOrder) / 3_600_000) * 10) / 10
          : null,
      },
    });
  }

  return true;
}

export async function endVisit(): Promise<void> {
  if (!sessionId || sessionStartedAt === null) return;
  const durationMs = Date.now() - sessionStartedAt;
  const endedSessionId = sessionId;
  sessionId = null;
  sessionStartedAt = null;

  await trackActivity({
    type: "visit_end",
    name: "Closed application",
    durationMs,
    metadata: { sessionId: endedSessionId },
  });

  const meta = await readMeta();
  await writeMeta({ ...meta, lastSessionEndAt: new Date().toISOString() });
}

export function trackRoute(route: string): void {
  void trackActivity({
    type: "screen_view",
    name: route,
    route,
    dedupeKey: `screen:${sessionId ?? "none"}:${route}`,
  });
}

export function startTimedActivity(
  key: string,
  type: string,
  input: ActivityEventData = {}
): void {
  timings.set(key, Date.now());
  void trackActivity({ ...input, type, durationMs: 0 });
}

export function endTimedActivity(
  key: string,
  type: string,
  input: ActivityEventData = {}
): void {
  const started = timings.get(key);
  if (!started) return;
  timings.delete(key);
  void trackActivity({ ...input, type, durationMs: Date.now() - started });
}

export function trackImpression(input: ActivityEventInput): void {
  void trackActivity(input);
}

export function trackCartActivity(
  action: "add" | "remove" | "increase" | "decrease" | "clear",
  input: ActivityEventData = {}
): void {
  void trackActivity({
    type: `cart_${action}`,
    name: `Cart ${action}`,
    ...input,
  });
}

export function trackCheckoutStart(input: ActivityEventData = {}): void {
  void trackActivity({ type: "checkout_start", name: "Started ordering", ...input });
}

export async function markOrderPlaced(input: {
  orderId: string;
  items: {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    restaurant?: string;
  }[];
  total: number;
  itemCount: number;
}): Promise<void> {
  const now = Date.now();
  const meta = await readMeta();
  const firstVisit = Date.parse(meta.firstVisitAt);
  const lastOrder = meta.lastOrderAt ? Date.parse(meta.lastOrderAt) : NaN;
  const orderCount = meta.orderCount + 1;
  const firstOrderAt = meta.firstOrderAt ?? new Date(now).toISOString();

  await writeMeta({
    ...meta,
    orderCount,
    firstOrderAt,
    lastOrderAt: new Date(now).toISOString(),
  });

  await trackActivity({
    type: "order_placed",
    name: "Placed order",
    value: input.total,
    dedupeKey: `order_placed:${input.orderId}`,
    metadata: {
      orderId: input.orderId,
      items: input.items,
      itemCount: input.itemCount,
      orderCount,
      isRepeatOrder: orderCount > 1,
      minutesSinceFirstVisit: Number.isFinite(firstVisit)
        ? Math.round((now - firstVisit) / 60_000)
        : null,
      hoursSinceLastOrder: Number.isFinite(lastOrder)
        ? Math.round(((now - lastOrder) / 3_600_000) * 10) / 10
        : null,
    },
  });
}

export async function flushActivityEvents(): Promise<{
  uploaded: number;
  remaining: number;
}> {
  if (flushing) return { uploaded: 0, remaining: (await readEvents()).length };
  const events = await readEvents();
  if (events.length === 0) return { uploaded: 0, remaining: 0 };

  flushing = true;
  try {
    const batch = events.slice(0, MAX_BATCH_EVENTS);
    const response = await apiFetch(
      "/activity-events",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
      },
      { allowInBackground: true }
    );
    if (!response.ok) {
      return { uploaded: 0, remaining: events.length };
    }

    const sentIds = new Set(batch.map((event) => event.id));
    const remaining = events.filter((event) => !sentIds.has(event.id));
    await writeEvents(remaining);
    return { uploaded: batch.length, remaining: remaining.length };
  } catch {
    return { uploaded: 0, remaining: events.length };
  } finally {
    flushing = false;
  }
}
