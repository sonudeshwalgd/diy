import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./apiConfig";
import {
  getApiLogContext,
  isAppForeground,
  isRetryableStatus,
  MAX_API_ATTEMPTS,
  RETRY_BASE_MS,
  sanitizeValue,
  setApiLogContext,
  sleep,
  withRequestTimeout,
  type LogFlushResult,
} from "./apiLogStore";

export const APP_ERROR_LOGS_KEY = "diy_app_error_logs_v1";

const MAX_LOCAL_APP_ERRORS = 200;
const MAX_BATCH_APP_ERRORS = 25;
const APP_ERROR_UPLOAD_TIMEOUT_MS = 10_000;
const DEDUPE_WINDOW_MS = 10_000;
const REDACTED_TEXT = "[REDACTED]";

export type AppErrorSource = "js" | "promise" | "react" | "manual";

export interface AppErrorLog {
  id: string;
  type: "app_error";
  createdAt: string;
  source: AppErrorSource;
  name: string;
  message: string;
  stack: string | null;
  fatal: boolean;
  componentStack: string | null;
  context: Record<string, unknown>;
  extra: Record<string, unknown>;
}

export interface CaptureAppErrorOptions {
  source?: AppErrorSource;
  fatal?: boolean;
  componentStack?: string | null;
  extra?: Record<string, unknown>;
}

const recentErrors = new Map<string, number>();

function createId(): string {
  const uuid = (
    globalThis.crypto as { randomUUID?: () => string } | undefined
  )?.randomUUID?.();
  return uuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeText(value: string): string {
  const sanitized = sanitizeValue(value);
  return typeof sanitized === "string" ? sanitized : REDACTED_TEXT;
}

function errorDetails(error: unknown): {
  name: string;
  message: string;
  stack: string | null;
} {
  if (error instanceof Error) {
    return {
      name: sanitizeText(error.name || "Error"),
      message: sanitizeText(error.message || "Unknown error"),
      stack: error.stack ? sanitizeText(error.stack) : null,
    };
  }
  if (typeof error === "string") {
    return { name: "Error", message: sanitizeText(error), stack: null };
  }
  try {
    return {
      name: "Error",
      message: sanitizeText(JSON.stringify(error)),
      stack: null,
    };
  } catch {
    return { name: "Error", message: REDACTED_TEXT, stack: null };
  }
}

function shouldCapture(log: AppErrorLog): boolean {
  const now = Date.now();
  for (const [key, timestamp] of recentErrors) {
    if (now - timestamp > DEDUPE_WINDOW_MS) recentErrors.delete(key);
  }
  const key = `${log.source}:${log.name}:${log.message}:${(log.stack ?? "").slice(0, 300)}`;
  const last = recentErrors.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
  recentErrors.set(key, now);
  return true;
}

async function readAppErrorLogs(): Promise<AppErrorLog[]> {
  try {
    const raw = await AsyncStorage.getItem(APP_ERROR_LOGS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AppErrorLog[]) : [];
  } catch {
    return [];
  }
}

export async function getAppErrorLogs(): Promise<AppErrorLog[]> {
  return readAppErrorLogs();
}

export async function appendAppErrorLog(log: AppErrorLog): Promise<void> {
  try {
    const logs = await readAppErrorLogs();
    const next = [log, ...logs].slice(0, MAX_LOCAL_APP_ERRORS);
    await AsyncStorage.setItem(APP_ERROR_LOGS_KEY, JSON.stringify(next));
  } catch {
    return;
  }
}

export async function removeAppErrorLogs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const remove = new Set(ids);
    const logs = (await readAppErrorLogs()).filter((log) => !remove.has(log.id));
    await AsyncStorage.setItem(APP_ERROR_LOGS_KEY, JSON.stringify(logs));
  } catch {
    return;
  }
}

export async function clearAppErrorLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_ERROR_LOGS_KEY);
  } catch {
    return;
  }
}

export function captureAppError(
  error: unknown,
  options: CaptureAppErrorOptions = {}
): void {
  const details = errorDetails(error);
  const log: AppErrorLog = {
    id: createId(),
    type: "app_error",
    createdAt: new Date().toISOString(),
    source: options.source ?? "manual",
    name: details.name,
    message: details.message,
    stack: details.stack,
    fatal: options.fatal === true,
    componentStack: options.componentStack ? sanitizeText(options.componentStack) : null,
    context: getApiLogContext(),
    extra: sanitizeValue(options.extra ?? {}) as Record<string, unknown>,
  };

  if (!shouldCapture(log)) return;
  void appendAppErrorLog(log);
}

let flushing = false;

export async function flushAppErrorLogs(): Promise<LogFlushResult> {
  if (flushing) {
    return { uploaded: 0, remaining: (await readAppErrorLogs()).length };
  }

  const logs = await readAppErrorLogs();
  if (logs.length === 0) return { uploaded: 0, remaining: 0 };
  if (!isAppForeground()) return { uploaded: 0, remaining: logs.length };

  flushing = true;
  const batch = logs.slice(0, MAX_BATCH_APP_ERRORS);
  let lastError: string | undefined;

  try {
    for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt += 1) {
      if (!isAppForeground()) break;
      const timed = withRequestTimeout(undefined, APP_ERROR_UPLOAD_TIMEOUT_MS);
      try {
        const response = await fetch(`${API_BASE}/client-errors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ errors: batch }),
          signal: timed.signal,
        });
        if (!response.ok) {
          lastError = `App error upload failed with status ${response.status}`;
          if (!isRetryableStatus(response.status)) break;
        } else {
          await removeAppErrorLogs(batch.map((log) => log.id));
          setApiLogContext({
            lastAppErrorUploadAt: Date.now(),
            lastAppErrorUploadError: null,
          });
          return { uploaded: batch.length, remaining: (await readAppErrorLogs()).length };
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
      lastAppErrorUploadAt: Date.now(),
      lastAppErrorUploadError: lastError ?? "Unknown app error upload error",
    });
    return {
      uploaded: 0,
      remaining: (await readAppErrorLogs()).length,
      error: lastError,
    };
  } finally {
    flushing = false;
  }
}

type ErrorHandler = (error: Error, isFatal?: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler?: () => ErrorHandler | undefined;
  setGlobalHandler?: (handler: ErrorHandler) => void;
}

let handlersInstalled = false;

export function installAppErrorHandlers(): () => void {
  if (handlersInstalled) return () => {};
  handlersInstalled = true;

  const errorUtils = (
    globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }
  ).ErrorUtils;
  const previousHandler = errorUtils?.getGlobalHandler?.();

  const handleNativeError: ErrorHandler = (error, isFatal) => {
    captureAppError(error, { source: "js", fatal: isFatal === true });
    previousHandler?.(error, isFatal);
  };
  errorUtils?.setGlobalHandler?.(handleNativeError);

  const handleWindowError = (event: ErrorEvent) => {
    captureAppError(event.error ?? new Error(event.message || "Window error"), {
      source: "js",
      fatal: true,
      extra: {
        filename: event.filename || null,
        lineno: event.lineno || null,
        colno: event.colno || null,
      },
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureAppError(event.reason, { source: "promise", fatal: false });
  };

  const target =
    typeof window !== "undefined" && typeof window.addEventListener === "function"
      ? window
      : null;
  target?.addEventListener("error", handleWindowError);
  target?.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    if (previousHandler) errorUtils?.setGlobalHandler?.(previousHandler);
    target?.removeEventListener("error", handleWindowError);
    target?.removeEventListener("unhandledrejection", handleUnhandledRejection);
    handlersInstalled = false;
  };
}
