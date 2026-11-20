import { API_BASE } from "./apiConfig";
import {
  appendApiFailureLog,
  getApiLogContext,
  MAX_API_ATTEMPTS,
  sanitizeBody,
  sanitizeHeaders,
  sanitizeUrl,
  sleep,
  type ApiAttemptLog,
  type ApiFailureLog,
} from "./apiLogStore";

const RETRY_BASE_MS = 200;

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

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const method = (init.method || "GET").toUpperCase();
  const requestHeaders = sanitizeHeaders(init.headers);
  const requestBody = sanitizeBody(init.body);
  const attempts: ApiAttemptLog[] = [];

  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    lastResponse = null;

    try {
      const response = await fetch(url, init);
      lastResponse = response;

      if (response.ok) return response;

      let responseBody: unknown = "[UNAVAILABLE]";
      try {
        responseBody = sanitizeBody(await response.clone().text());
      } catch {
        responseBody = "[READ_FAILED]";
      }
      const message = responseMessage(responseBody, response.status);
      const details = errorDetails(new ApiError(message, response.status, response.statusText));
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
    } catch (error) {
      lastError = error;
      const details = errorDetails(error);
      attempts.push({
        attempt,
        startedAt: new Date(startedAt).toISOString(),
        durationMs: Date.now() - startedAt,
        status: null,
        statusText: null,
        errorName: details.name,
        errorMessage: details.message,
        errorStack: details.stack,
        responseBody: null,
      });
    }

    if (attempt < MAX_API_ATTEMPTS) {
      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    }
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
  await appendApiFailureLog(log);

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error(finalError.message);
}
