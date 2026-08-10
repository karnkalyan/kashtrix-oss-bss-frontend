// lib/websocket-client.ts
import { toast } from "react-hot-toast";
import { getWebSocketUrl } from "@/lib/api";

export type WebSocketEvent =
  | "connected"
  | "disconnected"
  | "authenticated"
  | "error"
  | "heartbeat"
  | "ping"
  | "pong"
  | "subscribed"
  | "unsubscribed"
  | "command.response"
  | "yeastar.listener.started"
  | "yeastar.listener.stopped"
  | "dashboard.update"
  | "data.updated"
  | "system.status"
  | "system.notification"
  | "chat.message"
  | "gps.location.updated"
  | "yeastar.service.available"
  | `device:${string}`
  | `network-operations:${string}`;

export interface WebSocketMessage {
  type: WebSocketEvent;
  data: any;
  timestamp: string;
}

interface WebSocketConfig {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  debug?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  isAuthenticated: boolean;
  clientId?: string;
  userId?: number;
  ispId?: number;
  userName?: string;
  userEmail?: string;
  permissions: string[];
}

type EventHandler = (data: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private heartbeatInterval: number;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Map<WebSocketEvent, Set<EventHandler>> = new Map();
  private subscriptions: Set<string> = new Set();
  private state: WebSocketState = {
    isConnected: false,
    isAuthenticated: false,
    permissions: [],
  };
  private commandQueue: Array<{ type: string; data: any }> = [];
  private autoConnect: boolean;
  private autoReconnect: boolean;
  private debug: boolean;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private visibilityHandlerAttached = false;
  private lastConnectionErrorAt = 0;

  constructor(config: WebSocketConfig = {}) {
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
    this.reconnectInterval = config.reconnectInterval ?? 5000;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000;
    this.autoConnect = config.autoConnect ?? true;
    this.autoReconnect = config.autoReconnect ?? true;
    this.debug = config.debug ?? false;

    // Do not touch window/document during construction unless we are definitely in the browser.
    if (this.autoConnect && typeof window !== "undefined") {
      setTimeout(() => this.initialize(), 100);
    }
  }

  private log(...args: any[]) {
    if (this.debug) console.log("[WebSocket]", ...args);
  }

  private error(...args: any[]) {
    console.error("[WebSocket]", ...args);
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  private initialize() {
    if (!this.isBrowser()) return;

    if (!this.state.isConnected && !this.isConnecting) {
      this.connect().catch((error: any) => {
        this.warnSafe(
          "[WebSocket] Initial connection failed:",
          error?.message || error
        );
      });
    }

    if (!this.visibilityHandlerAttached) {
      this.visibilityHandlerAttached = true;

      document.addEventListener("visibilitychange", () => {
        if (
          document.visibilityState === "visible" &&
          !this.state.isConnected
        ) {
          this.connect().catch((error) => {
            this.warnSafe(
              "[WebSocket] Reconnect on visibility failed:",
              error
            );
          });
        }
      });
    }
  }

  private warnSafe(...args: any[]) {
    if (this.debug) console.warn(...args);
  }

  private getWebSocketUrl(): string {
    return getWebSocketUrl();
  }

  async connect(): Promise<void> {
    if (!this.isBrowser()) {
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.ws?.readyState === WebSocket.OPEN && this.state.isConnected) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();

    if (!wsUrl) {
      this.isConnecting = false;
      return Promise.resolve();
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.error("Connection timeout");
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.state.isConnected = true;
          this.reconnectAttempts = 0;
          this.lastConnectionErrorAt = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => this.handleMessage(event);
        this.ws.onclose = (event) => this.handleClose(event);

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          const errorMsg =
            "WebSocket connection failed. Please check if the server is running.";
          const now = Date.now();
          if (this.debug && now - this.lastConnectionErrorAt > 30000) {
            console.warn("[WebSocket]", errorMsg, { url: wsUrl });
          }
          this.lastConnectionErrorAt = now;
          this.emit("error", { message: errorMsg, error });
          reject(new Error(errorMsg));
        };
      } catch (error: any) {
        this.isConnecting = false;
        this.error("Failed to create WebSocket:", error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  getConnectionStatus(): string {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return this.state.isAuthenticated ? "authenticated" : "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case "connected":
          this.handleConnectedEvent(message.data);
          break;

        case "authenticated":
          this.handleAuthenticatedEvent(message.data);
          break;

        case "ping":
          this.send({ type: "ping", data: {} });
          this.emit("heartbeat", message.data);
          break;

        case "system.status":
        case "system.notification":
        case "yeastar.service.available":
        case "subscribed":
        case "unsubscribed":
          this.emit(message.type, message.data);
          break;

        case "error":
          this.handleErrorEvent(message.data);
          break;

        default:
          this.emit(message.type, message.data);
      }
    } catch (err) {
      this.error("Failed to parse message:", err);
    }
  }

  private handleConnectedEvent(data: any) {
    if (data?.userId && data?.permissions) {
      this.state.clientId = data.clientId;
      this.state.userId = data.userId;
      this.state.ispId = data.ispId;
      this.state.userName = data.userName;
      this.state.permissions = data.permissions || [];
      this.state.isAuthenticated = true;

      this.commandQueue.forEach((cmd) => this.send(cmd));
      this.commandQueue = [];

      this.emit("authenticated", this.state);
    }

    this.emit("connected", this.state);
  }

  private handleAuthenticatedEvent(data: any) {
    this.state.isAuthenticated = true;
    this.emit("authenticated", this.state);
    this.log("Authenticated via dedicated event", data);
  }

  private handleClose(event: CloseEvent) {
    this.log("Connection closed", event.code, event.reason);
    this.state.isConnected = false;
    this.state.isAuthenticated = false;
    this.clearHeartbeat();
    this.connectionPromise = null;
    this.isConnecting = false;
    this.ws = null;

    this.emit("disconnected", {
      code: event.code,
      reason: event.reason,
    });

    if (event.code !== 1000 && this.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  private handleErrorEvent(data: any) {
    this.error("Server error:", data);

    if (this.isBrowser()) {
      const message = String(data?.message || "");
      const code = String(data?.code || "");

      if (code.includes("AUTH") || message.toLowerCase().includes("auth")) {
        toast.error("Authentication error. Please log in again.");
      } else if (message) {
        toast.error(message);
      }
    }

    this.emit("error", data);
  }

  private startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: "heartbeat", data: {} });
      }
    }, this.heartbeatInterval);
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.error("Max reconnection attempts reached");
      if (this.isBrowser())
        toast.error("Failed to reconnect. Please refresh the page.");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    this.log(
      `Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        this.warnSafe("[WebSocket] Reconnection failed:", error);
      });
    }, delay);
  }

  send(message: { type: string; data: any }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (message.type === "command" && !this.state.isAuthenticated) {
        this.commandQueue.push(message);
        this.log("Queued command (not authenticated yet):", message.type);
      } else {
        this.ws.send(JSON.stringify(message));
        this.log("Sent:", message.type);
      }
    } else {
      this.log("Cannot send message - WebSocket not open");
    }
  }

  subscribe(channels: string | string[]) {
    const list = Array.isArray(channels) ? channels : [channels];
    const validChannels = list.filter(
      (ch) => ch && typeof ch === "string" && ch.trim().length > 0
    );

    if (validChannels.length === 0) return;

    validChannels.forEach((c) => {
      if (!this.subscriptions.has(c)) {
        this.subscriptions.add(c);
      }
    });

    this.send({
      type: "subscribe",
      data: {
        channels: validChannels,
      },
    });
  }

  unsubscribe(channels: string | string[]) {
    const list = Array.isArray(channels) ? channels : [channels];
    const validChannels = list.filter(
      (ch) => ch && typeof ch === "string" && ch.trim().length > 0
    );

    if (validChannels.length === 0) {
      console.warn(
        "[WebSocket] No valid channels to unsubscribe from:",
        channels
      );
      return;
    }

    validChannels.forEach((c) => this.subscriptions.delete(c));

    this.send({
      type: "unsubscribe",
      data: {
        channels: validChannels,
      },
    });
  }

  sendCommand(command: string, data?: any) {
    this.send({
      type: "command",
      data: {
        command,
        ...(data || {}),
      },
    });
  }

  on(event: WebSocketEvent, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  off(event: WebSocketEvent, handler?: EventHandler) {
    if (!handler) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.get(event)?.delete(handler);
    }
  }

  private emit(event: WebSocketEvent, data: any) {
    this.eventHandlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        this.error(`Error in ${event} handler:`, error);
      }
    });
  }

  disconnect() {
    this.autoReconnect = false;
    this.clearHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.state.isConnected = false;
    this.state.isAuthenticated = false;
    this.isConnecting = false;
    this.connectionPromise = null;

    this.emit("disconnected", { manual: true });
  }

  getState() {
    return { ...this.state };
  }

  isConnected() {
    return this.state.isConnected;
  }

  isAuthenticated() {
    return this.state.isAuthenticated;
  }

  getSubscriptions() {
    return Array.from(this.subscriptions);
  }

  hasPermission(permission: string): boolean {
    return this.state.permissions.includes(permission);
  }

  getPermissions(): string[] {
    return [...this.state.permissions];
  }
}

// ===== SAFE SINGLETON PATTERN =====
// Never instantiate at module level. Only create when called from browser context.

let _webSocketClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient | null {
  // Return null on server - never throw
  if (typeof window === "undefined") {
    return null;
  }

  if (!_webSocketClient) {
    _webSocketClient = new WebSocketClient({
      debug: process.env.NODE_ENV === "development",
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
    });
  }

  return _webSocketClient;
}

export function resetWebSocketClient() {
  if (_webSocketClient) {
    _webSocketClient.disconnect();
    _webSocketClient = null;
  }
}
