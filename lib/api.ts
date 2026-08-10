// lib/api.ts
import toast from "react-hot-toast";

type ApiRequestInit = RequestInit & {
  suppressToast?: boolean;
};

/**
 * Dynamically resolves the API base URL based on the current browser domain.
 * This allows one build to work on multiple domains.
 */
export function getDynamicBaseUrl(): string {
  if (typeof window === "undefined") {
    // Server-side (Middleware/SSR) fallback
    return process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3200";
  }

  const hostname = window.location.hostname;

  const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configuredBase) return configuredBase;

  // Same-origin production path: https://frontend-domain/api
  if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.")) {
    return "/api";
  }

  // Local development fallback: use the exact same hostname the user is visiting
  return `http://${hostname}:3200`;
}

/**
 * Get WebSocket URL based on current domain
 */
export function getWebSocketUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const configuredWebSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (configuredWebSocketUrl) return configuredWebSocketUrl;

  const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configuredBase && !configuredBase.startsWith("/")) {
    try {
      const url = new URL(configuredBase);
      const configuredForLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      const browserIsLoopback = hostname === "localhost" || hostname === "127.0.0.1";

      // A URL compiled as localhost is valid on the developer's machine, but from
      // another LAN browser localhost means that browser itself. Keep the configured
      // port and use the host that served the frontend.
      if (configuredForLoopback && !browserIsLoopback) {
        url.hostname = hostname;
      }

      // HTTPS pages cannot open an insecure ws:// connection. Production should
      // terminate WebSockets at the same reverse proxy that serves the frontend.
      if (window.location.protocol === "https:" && url.protocol === "http:") {
        return `wss://${window.location.host}/ws`;
      }

      url.protocol = url.protocol.replace("http", "ws");
      url.pathname = "/ws";
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {}
  }

  // Same-origin production proxy (/ws)
  if (hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.startsWith("192.168.") && !hostname.startsWith("10.")) {
    return `${protocol}://${window.location.host}/ws`;
  }

  // Local/LAN dev environment: Backend runs on port 3200
  return `${protocol}://${hostname}:3200/ws`;
}

export function buildApiAssetUrl(assetPath?: string | null): string {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith("data:") || assetPath.startsWith("blob:")) {
    return assetPath;
  }

  const cleanPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  const baseUrl = getDynamicBaseUrl().replace(/\/+$/, "");

  if (cleanPath.startsWith("/uploads/")) {
    return `${baseUrl}${cleanPath}`;
  }

  return cleanPath;
}

function isClient() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isPublicAuthPage() {
  if (!isClient()) return false;
  return ["/login", "/forgot-password", "/reset-password"].some(
    path => window.location.pathname === path || window.location.pathname.startsWith(`${path}/`)
  );
}

function notifyLicenseExpired(payload: any, fallbackMessage: string) {
  if (!isClient()) return;
  window.dispatchEvent(new CustomEvent("license-expired", {
    detail: {
      message: payload?.message || payload?.error || fallbackMessage,
      hwid: payload?.hwid || null,
    },
  }));
}

async function parseResponsePayload(res: Response) {
  try {
    return await res.clone().json();
  } catch {
    try {
      return await res.clone().text();
    } catch {
      return null;
    }
  }
}

function publicErrorMessage(status: number) {
  if (status >= 500) return "Server error. Please try again shortly.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 401) return "Your session is no longer valid.";
  if (status === 429) return "Too many requests. Please wait and try again.";
  return "The request could not be completed.";
}

// Global state for token refresh mutex
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
const lastGetRequestAt = new Map<string, number>();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const suppressToast = options.suppressToast === true;
  delete options.suppressToast;
  // Get the URL dynamically for every request
  const BASE_URL = getDynamicBaseUrl().replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;
  const method = (options.method || "GET").toUpperCase();
  const canCoalesce = method === "GET" && !options.body;

  options.credentials = "include";

  const selectedBranchId = isClient() ? localStorage.getItem("selected-branch-id") : null;
  const throttleKey = canCoalesce ? `${url}:${selectedBranchId || ""}` : "";

  if (!(options.body instanceof FormData)) {
    options.headers = {
      "Content-Type": "application/json",
      ...(selectedBranchId ? { "x-selected-branch-id": selectedBranchId } : {}),
      ...(options.headers || {}),
    };
  } else {
    const newHeaders = { 
      ...(selectedBranchId ? { "x-selected-branch-id": selectedBranchId } : {}),
      ...(options.headers || {}) 
    } as Record<string, any>;
    delete newHeaders["Content-Type"];
    options.headers = newHeaders;
  }

  if (throttleKey) {
    const previous = lastGetRequestAt.get(throttleKey) || 0;
    const elapsed = Date.now() - previous;
    if (elapsed < 120) {
      await sleep(120 - elapsed);
    }
    lastGetRequestAt.set(throttleKey, Date.now());
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    const msg = "Network error. Check your connection and try again.";
    if (isClient() && !suppressToast) toast.error(msg);
    throw new Error(msg);
  }

  // 401 refresh flow
  const isPublicAuthRequest = ["/auth/login", "/auth/forgot-password", "/auth/reset-password"].some(path => endpoint.includes(path));
  if (response.status === 401 && !endpoint.includes("/auth/refresh") && !isPublicAuthRequest) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }).then(async (refreshRes) => {
        if (!refreshRes.ok) {
           if (isClient() && !isPublicAuthPage()) {
              toast.error("Session expired. Please login again.");
              window.location.href = "/login";
           }
           return false;
        }
        try {
          // Simply succeed, cookies are updated automatically by backend response
          await refreshRes.json();
        } catch (e) {
          console.error("Failed to parse refresh token response:", e);
        }
        return true;
      }).catch(() => false)
        .finally(() => {
          isRefreshing = false;
        });
    }

    const refreshSuccess = await refreshPromise;
    
    if (refreshSuccess) {
      // Retry the original request
      response = await fetch(url, options);
    } else {
      throw new Error("Session expired");
    }
  }

  // Handle errors
  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    let payloadStr: string;

    if (payload && typeof payload === "object" && "error" in payload) {
      payloadStr = String((payload as any).error);
    } else if (typeof payload === "string") {
      payloadStr = payload;
    } else {
      payloadStr = `${response.status} ${response.statusText}`;
    }

    if (payload && typeof payload === "object" && (payload as any).licenseExpired) {
      notifyLicenseExpired(payload, payloadStr);
      return null as unknown as T;
    }

    if (response.status === 402) {
      notifyLicenseExpired(payload, payloadStr);
      throw new Error("A valid license is required.");
    }

    const safeMessage = publicErrorMessage(response.status);
    if (isClient() && !suppressToast) toast.error(safeMessage);
    throw new Error(safeMessage);
  }

  // Success parsing
  if (response.status === 204 || response.status === 205)
    return null as unknown as T;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
