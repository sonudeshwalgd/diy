import { API_BASE } from "./apiConfig";
import {
  appendApiFailureLog,
  getApiLogContext,
  isAbortError,
  isAppForeground,
  isRetryableStatus,
  MAX_API_ATTEMPTS,
  RETRY_BASE_MS,
  sanitizeBody,
  sanitizeHeaders,
  sanitizeUrl,
  sleep,
  withRequestTimeout,
  type ApiAttemptLog,
  type ApiFailureLog,
} from "./apiLogStore";

const GET_TIMEOUT_MS = 12_000;
const MUTATION_TIMEOUT_MS = 20_000;

interface ApiFetchOptions {
  silentStatuses?: number[];
}

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

function errorDetails(error: unknown): {
  name: string;
  message: string;
  stack: string | null;
} {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Request failed",
      stack: error.stack ?? null,
    };
  }
  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : String(error),
    stack: null,
  };
}

function responseMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const value = (body as { error?: unknown }).error;
    if (typeof value === "string" && value) return value;
  }
  return `HTTP ${status}`;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const method = (init.method || "GET").toUpperCase();
  const timeoutMs =
    method === "GET" || method === "HEAD" ? GET_TIMEOUT_MS : MUTATION_TIMEOUT_MS;
  const requestHeaders = sanitizeHeaders(init.headers);
  const requestBody = sanitizeBody(init.body);
  const silentStatuses = new Set(options.silentStatuses ?? []);
  const attempts: ApiAttemptLog[] = [];

  let lastError: unknown = null;
  let lastResponse: Response | null = null;
  let callerAborted = false;

  for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt += 1) {
    if (!isAppForeground()) break;

    const startedAt = Date.now();
    const timed = withRequestTimeout(init.signal, timeoutMs);
    const requestInit: RequestInit = { ...init, signal: timed.signal };
    let retryable = true;
    lastResponse = null;

    try {
      const response = await fetch(url, requestInit);
      lastResponse = response;

      if (response.ok) return response;

      let responseBody: unknown = "[UNAVAILABLE]";
      try {
        responseBody = sanitizeBody(await response.clone().text());
      } catch {
        responseBody = "[READ_FAILED]";
      }
      const message = responseMessage(responseBody, response.status);
      const details = errorDetails(
        new ApiError(message, response.status, response.statusText)
      );
      attempts.push({
        attempt,
        startedAt: new Date(startedAt).toISOString(),
        durationMs: Date.now() - startedAt,
        status: response.status,
        statusText: response.statusText || null,
        errorName: details.name,
        errorMessage: details.message,
        errorStack: details.stack,
        responseBody,
      });
      lastError = new ApiError(message, response.status, response.statusText);
      retryable = isRetryableStatus(response.status);
    } catch (error) {
      if (init.signal?.aborted) {
        callerAborted = true;
        retryable = false;
        lastError = error;
      } else if (timed.didTimeout() || isAbortError(error)) {
        lastError = new ApiError(
          `Request timed out after ${timeoutMs}ms`,
          408,
          "Timeout"
        );
        retryable = true;
      } else {
        lastError = error;
        retryable = true;
      }

      const details = errorDetails(lastError);
      attempts.push({
        attempt,
        startedAt: new Date(startedAt).toISOString(),
        durationMs: Date.now() - startedAt,
        status: lastError instanceof ApiError ? lastError.status : null,
        statusText: lastError instanceof ApiError ? lastError.statusText || null : null,
        errorName: details.name,
        errorMessage: details.message,
        errorStack: details.stack,
        responseBody: null,
      });
    } finally {
      timed.cleanup();
    }

    if (!retryable || attempt >= MAX_API_ATTEMPTS || !isAppForeground()) break;
    await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
  }

  if (callerAborted) {
    throw lastError instanceof Error ? lastError : new Error("Request aborted");
  }
  if (attempts.length === 0) {
    throw new Error("Request skipped while app was in background");
  }

  const finalError = errorDetails(lastError);
  const endpoint = url.split("?")[0].replace(API_BASE, "");
  const log: ApiFailureLog = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    type: "api_failure",
    createdAt: new Date().toISOString(),
    method,
    endpoint,
    url: sanitizeUrl(url),
    finalStatus:
      lastError instanceof ApiError ? lastError.status : (lastResponse?.status ?? null),
    finalErrorMessage: finalError.message,
    attempts,
    requestBody,
    requestHeaders,
    context: getApiLogContext(),
    retry: { maxAttempts: MAX_API_ATTEMPTS, baseDelayMs: RETRY_BASE_MS },
  };
  const silent =
    lastError instanceof ApiError && silentStatuses.has(lastError.status);
  if (!silent) await appendApiFailureLog(log);

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error(finalError.message);
}
