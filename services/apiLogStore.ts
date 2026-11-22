import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";
import { API_BASE } from "./apiConfig";
import { getUserToken } from "./userToken";

export const API_FAILURE_LOGS_KEY = "diy_api_failure_logs_v1";
export const MAX_API_ATTEMPTS = 3;
export const RETRY_BASE_MS = 200;

const MAX_LOCAL_LOGS = 200;
const MAX_BATCH_LOGS = 25;
const LOG_UPLOAD_TIMEOUT_MS = 10_000;
const REDACTED_TEXT = "[REDACTED]";
const SENSITIVE_KEY =
  /token|secret|password|staff|adminmobile|customermobile|mobilenumber|authorization|signature/i;
const MOBILE_KEY = /^(customerMobile|mobileNumber|mobile|phone)$/i;

export interface ApiAttemptLog {
  attempt: number;
  startedAt: string;
  durationMs: number;
  status: number | null;
  statusText: string | null;
  errorName: string | null;
  errorMessage: string | null;
  errorStack: string | null;
  responseBody: unknown;
}

export interface ApiFailureLog {
  id: string;
  type: "api_failure";
  createdAt: string;
  method: string;
  endpoint: string;
  url: string;
  finalStatus: number | null;
  finalErrorMessage: string;
  attempts: ApiAttemptLog[];
  requestBody: unknown;
  requestHeaders: Record<string, unknown>;
  context: Record<string, unknown>;
  retry: { maxAttempts: number; baseDelayMs: number };
}

export interface ApiLogContextSnapshot {
  appState?: string | null;
  isOnline?: boolean | null;
  route?: string | null;
  visitorId?: string | null;
  customerMobile?: string | null;
  lastOrderId?: string | null;
  cart?: { itemCount: number; total: number } | null;
  activeOrders?: {
    ids: string[];
    count: number;
    isSyncing: boolean;
    lastSyncedAt: number | null;
  } | null;
  lastLogUploadAt?: number | null;
  lastLogUploadError?: string | null;
  lastAppErrorUploadAt?: number | null;
  lastAppErrorUploadError?: string | null;
  extra?: Record<string, unknown>;
}

let contextSnapshot: ApiLogContextSnapshot = {};

export function setApiLogContext(patch: Partial<ApiLogContextSnapshot>): void {
  contextSnapshot = { ...contextSnapshot, ...patch };
}

export function getApiLogContext(): Record<string, unknown> {
  const expoConfig = Constants.expoConfig as
    | { name?: string; slug?: string; version?: string }
    | undefined;
  const nav = globalThis.navigator as
    | {
        onLine?: boolean;
        userAgent?: string;
        language?: string;
        hardwareConcurrency?: number;
        deviceMemory?: number;
      }
    | undefined;
  const screenInfo = (globalThis as unknown as {
    screen?: { width?: number; height?: number };
  }).screen;

  return {
    ...contextSnapshot,
    visitorId: contextSnapshot.visitorId ?? null,
    appState: contextSnapshot.appState ?? AppState.currentState ?? null,
    isOnline: contextSnapshot.isOnline ?? nav?.onLine ?? null,
    customerMobile: maskMobile(contextSnapshot.customerMobile),
    runtime: {
      platform: Platform.OS,
      osVersion: Platform.Version,
      appName: expoConfig?.name ?? null,
      appSlug: expoConfig?.slug ?? null,
      appVersion: expoConfig?.version ?? null,
      releaseChannel: Constants.releaseChannel ?? null,
      userAgent: nav?.userAgent ?? null,
      language: nav?.language ?? null,
      hardwareConcurrency: nav?.hardwareConcurrency ?? null,
      deviceMemory: nav?.deviceMemory ?? null,
      screenWidth: screenInfo?.width ?? null,
      screenHeight: screenInfo?.height ?? null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      locale: Intl.DateTimeFormat().resolvedOptions().locale ?? null,
      apiBase: API_BASE,
    },
  };
}

export function maskMobile(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return REDACTED_TEXT;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.length > 2000 ? `${value.slice(0, 2000)}…[TRUNCATED]` : value;
  }
  if (depth > 5) return "[DEPTH_LIMIT]";
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (MOBILE_KEY.test(key)) {
        result[key] = maskMobile(entry);
      } else if (SENSITIVE_KEY.test(key)) {
        result[key] = REDACTED_TEXT;
      } else {
        result[key] = sanitizeValue(entry, depth + 1);
      }
    }
    return result;
  }
  return String(value);
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const keys = Array.from(parsed.searchParams.keys());
    for (const key of keys) {
      if (SENSITIVE_KEY.test(key)) parsed.searchParams.set(key, REDACTED_TEXT);
    }
    const path = parsed.pathname.replace(/\/zxcvbnm\d+/i, "/[secret]");
    return `${parsed.origin}${path}${parsed.search}`;
  } catch {
    return url.replace(
      /(staffKey|adminMobile|token|secret)=[^&]+/gi,
      `$1=${REDACTED_TEXT}`
    );
  }
}

export function sanitizeBody(body: unknown): unknown {
  if (body === null || body === undefined) return null;
  if (typeof body === "string") {
    try {
      return sanitizeValue(JSON.parse(body));
    } catch {
      return sanitizeValue(body);
    }
  }
  return sanitizeValue(body);
}

export function sanitizeHeaders(headers: HeadersInit | undefined): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!headers) return result;
  const entries =
    typeof Headers !== "undefined" && headers instanceof Headers
      ? Array.from(headers.entries())
      : Array.isArray(headers)
        ? headers
        : Object.entries(headers);
  for (const [key, value] of entries) {
    result[key] = SENSITIVE_KEY.test(key) ? REDACTED_TEXT : sanitizeValue(value);
  }
  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isAppForeground(): boolean {
  if (AppState.currentState === "background") return false;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }
  return true;
}

export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 425 || status === 429;
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

export function withRequestTimeout(
  signal: AbortSignal | null | undefined,
  timeoutMs: number
): {
  signal: AbortSignal | undefined;
  cleanup: () => void;
  didTimeout: () => boolean;
} {
  if (typeof AbortController === "undefined") {
    return { signal: signal ?? undefined, cleanup: () => {}, didTimeout: () => false };
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromSignal = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", abortFromSignal, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortFromSignal);
    },
    didTimeout: () => timedOut,
  };
}

function createLogId(): string {
  const uuid = (
    globalThis.crypto as { randomUUID?: () => string } | undefined
  )?.randomUUID?.();
  return uuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readLogs(): Promise<ApiFailureLog[]> {
  try {
    const raw = await AsyncStorage.getItem(API_FAILURE_LOGS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApiFailureLog[]) : [];
  } catch {
    return [];
  }
}

export async function getApiFailureLogs(): Promise<ApiFailureLog[]> {
  return readLogs();
}

export async function appendApiFailureLog(log: ApiFailureLog): Promise<void> {
  try {
    const logs = await readLogs();
    const next = [log, ...logs].slice(0, MAX_LOCAL_LOGS);
    await AsyncStorage.setItem(API_FAILURE_LOGS_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}

export async function removeApiFailureLogs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const remove = new Set(ids);
    const logs = (await readLogs()).filter((log) => !remove.has(log.id));
    await AsyncStorage.setItem(API_FAILURE_LOGS_KEY, JSON.stringify(logs));
  } catch {
    return;
  }
}

export async function clearApiFailureLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(API_FAILURE_LOGS_KEY);
  } catch {
    return;
  }
}

export interface LogFlushResult {
  uploaded: number;
  remaining: number;
  error?: string;
}

let flushing = false;

export async function flushApiLogs(): Promise<LogFlushResult> {
  if (flushing) {
    return { uploaded: 0, remaining: (await readLogs()).length };
  }

  const logs = await readLogs();
  if (logs.length === 0) return { uploaded: 0, remaining: 0 };
  if (!isAppForeground()) return { uploaded: 0, remaining: logs.length };

  flushing = true;
  const batch = logs.slice(0, MAX_BATCH_LOGS);
  let lastError: string | undefined;
  let visitorToken = contextSnapshot.visitorId ?? undefined;

  try {
    try {
      visitorToken = await getUserToken();
      setApiLogContext({ visitorId: visitorToken });
    } catch (error) {
      console.warn("Visitor token unavailable for log upload", error);
    }

    for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt += 1) {
      if (!isAppForeground()) break;
      const timed = withRequestTimeout(undefined, LOG_UPLOAD_TIMEOUT_MS);
      try {
        const response = await fetch(`${API_BASE}/client-logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(visitorToken ? { "x-visitor-token": visitorToken } : {}),
          },
          body: JSON.stringify({ logs: batch, visitorId: visitorToken ?? null }),
          signal: timed.signal,
        });
        if (!response.ok) {
          lastError = `Log upload failed with status ${response.status}`;
          if (!isRetryableStatus(response.status)) break;
        } else {
          await removeApiFailureLogs(batch.map((log) => log.id));
          setApiLogContext({
            lastLogUploadAt: Date.now(),
            lastLogUploadError: null,
          });
          return { uploaded: batch.length, remaining: (await readLogs()).length };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      } finally {
        timed.cleanup();
      }

      if (attempt < MAX_API_ATTEMPTS && isAppForeground()) {
        await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
      }
    }

    setApiLogContext({
      lastLogUploadAt: Date.now(),
      lastLogUploadError: lastError ?? "Unknown log upload error",
    });
    return {
      uploaded: 0,
      remaining: (await readLogs()).length,
      error: lastError,
    };
  } finally {
    flushing = false;
  }
}
