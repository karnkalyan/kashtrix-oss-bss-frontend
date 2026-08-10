"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  CornerDownLeft,
  RefreshCw,
  Power,
  Check,
  Zap,
  Shield,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getWebSocketUrl } from "@/lib/api";

interface XTermTerminalProps {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  deviceId?: number | string;
  resourceType?: "managed-device" | "olt";
  title?: string;
  quickCommands?: string[];
  className?: string;
  autoConnect?: boolean;
  onClose?: () => void;
}

export function XTermTerminal({
  host = "",
  port = 22,
  username = "",
  password = "",
  deviceId,
  resourceType = "managed-device",
  title = "Device Terminal",
  quickCommands = [
    "show version",
    "display current-configuration",
    "show gpon olt",
    "ping 8.8.8.8",
    "help"
  ],
  className = "",
  autoConnect = true,
  onClose
}: XTermTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [statusMessage, setStatusMessage] = useState<string>("Ready to connect");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cols, setCols] = useState(80);
  const [rows, setRows] = useState(24);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    setIsMinimized(false);

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
        await container.requestFullscreen();
      }
    } catch {
      // Retain a viewport-sized fallback for browsers that deny fullscreen.
      setIsFullscreen((current) => !current);
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  };

  const toggleMinimized = async () => {
    if (document.fullscreenElement === containerRef.current) {
      await document.exitFullscreen().catch(() => undefined);
    }
    setIsMinimized((current) => !current);
    setTimeout(() => fitAddonRef.current?.fit(), 100);
  };

  const closeTerminal = async () => {
    if (document.fullscreenElement === containerRef.current) {
      await document.exitFullscreen().catch(() => undefined);
    }
    disconnect();
    onClose?.();
  };

  const propsRef = useRef({ host, port, username, password, deviceId, resourceType });
  useEffect(() => {
    propsRef.current = { host, port, username, password, deviceId, resourceType };
  }, [host, port, username, password, deviceId, resourceType]);

  const payloadSentRef = useRef(false);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const writeTerminalOutput = useCallback((data: string) => {
    const terminal = xtermRef.current;
    if (!terminal) return;

    terminal.write(data, () => terminal.scrollToBottom());
  }, []);

  const sendTerminalInput = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", data }));
    }
  }, []);

  // Connect WebSocket & SSH
  const connect = useCallback(() => {
    clearHeartbeat();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    payloadSentRef.current = false;
    setStatus("connecting");
    setStatusMessage("Establishing WebSocket connection...");

    const wsUrl = getWebSocketUrl();
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    const sendConnectPayload = () => {
      if (payloadSentRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      payloadSentRef.current = true;

      const termCols = fitAddonRef.current ? fitAddonRef.current.proposeDimensions()?.cols || 80 : 80;
      const termRows = fitAddonRef.current ? fitAddonRef.current.proposeDimensions()?.rows || 24 : 24;
      const cur = propsRef.current;

      wsRef.current.send(
        JSON.stringify({
          type: "connect",
          host: cur.host,
          port: cur.port,
          username: cur.username,
          password: cur.password,
          deviceId: cur.deviceId ? String(cur.deviceId) : undefined,
          resourceType: cur.resourceType,
          cols: termCols,
          rows: termRows,
          data: {
            host: cur.host,
            port: cur.port,
            username: cur.username,
            password: cur.password,
            deviceId: cur.deviceId ? String(cur.deviceId) : undefined,
            resourceType: cur.resourceType,
            cols: termCols,
            rows: termRows
          }
        })
      );
    };

    socket.onopen = () => {
      if (wsRef.current !== socket) return;
      setStatusMessage("WebSocket connected. Authenticating...");
      heartbeatTimerRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "heartbeat", data: {} }));
        }
      }, 25000);
      // Fallback timer if connected event is not received
      setTimeout(() => {
        sendConnectPayload();
      }, 500);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "ping") {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "heartbeat", data: {} }));
          }
          return;
        }

        // 0. WS Auth Ready event from backend
        if (msg.type === "connected") {
          setStatusMessage("Authenticated. Negotiating SSH session...");
          sendConnectPayload();
          return;
        }

        // 1. Status messages
        if (msg.type === "terminal:status" || msg.type === "status") {
          const statusObj = typeof msg.data === "object" && msg.data !== null ? msg.data : msg;
          const newStatus = statusObj.status || msg.status;
          const message = statusObj.message || msg.message || "";
          if (newStatus) {
            setStatus(newStatus);
            setStatusMessage(message);
            if (newStatus === "connected" && xtermRef.current) {
              xtermRef.current.focus();
            }
          }
          return;
        }

        // 2. Output data messages
        if (msg.type === "terminal:output" || msg.type === "output" || msg.type === "data") {
          let raw = msg.data !== undefined ? msg.data : msg.payload?.data;
          if (typeof raw === "object" && raw !== null) {
            raw = raw.data !== undefined ? raw.data : raw.text;
          }
          if (typeof raw === "string") {
            writeTerminalOutput(raw);
          }
          return;
        }

        // 3. Error messages
        if (msg.type === "error") {
          const errMsg = typeof msg.data === "object" ? msg.data?.message : (msg.message || "Terminal error");
          setStatus("error");
          setStatusMessage(errMsg);
          toast.error(errMsg);
          return;
        }

        // Fallback for direct data string
        if (typeof msg === "string") {
          writeTerminalOutput(msg);
        }
      } catch {
        if (typeof event.data === "string") {
          writeTerminalOutput(event.data);
        }
      }
    };

    socket.onerror = () => {
      setStatus("error");
      setStatusMessage("WebSocket connection failed");
      toast.error("WebSocket connection error");
    };

    socket.onclose = () => {
      if (wsRef.current !== socket) return;
      clearHeartbeat();
      wsRef.current = null;
      setStatus("disconnected");
      setStatusMessage("Disconnected");
    };
  }, [clearHeartbeat, writeTerminalOutput]);

  const disconnect = useCallback(() => {
    clearHeartbeat();
    const socket = wsRef.current;
    wsRef.current = null;
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "disconnect" }));
      }
      socket.close();
    }
    setStatus("disconnected");
    setStatusMessage("Disconnected");
  }, [clearHeartbeat]);

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      cursorWidth: 1,
      fontFamily: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
      fontSize: 14,
      fontWeight: "400",
      fontWeightBold: "700",
      letterSpacing: 0,
      lineHeight: 1.15,
      convertEol: false,
      scrollback: 10000,
      scrollOnUserInput: true,
      smoothScrollDuration: 100,
      allowTransparency: true,
      drawBoldTextInBrightColors: true,
      theme: {
        background: "#05080d",
        foreground: "#d8dee9",
        cursor: "#7dd3fc",
        cursorAccent: "#05080d",
        selectionBackground: "#264f78",
        selectionForeground: "#ffffff",

        black: "#1b2430",
        red: "#ff5f56",
        green: "#5af78e",
        yellow: "#f3f99d",
        blue: "#57c7ff",
        magenta: "#ff6ac1",
        cyan: "#9aedfe",
        white: "#f1f1f0",

        brightBlack: "#686868",
        brightRed: "#ff6e67",
        brightGreen: "#5af78e",
        brightYellow: "#f4f99d",
        brightBlue: "#57c7ff",
        brightMagenta: "#ff92d0",
        brightCyan: "#9aedfe",
        brightWhite: "#ffffff"
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    requestAnimationFrame(() => {
      fitAddon.fit();
      requestAnimationFrame(() => fitAddon.fit());
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.onData((data) => {
      sendTerminalInput(data);
    });

    term.onResize(({ cols: newCols, rows: newRows }) => {
      setCols(newCols);
      setRows(newRows);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "resize",
            cols: newCols,
            rows: newRows
          })
        );
      }
    });

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        try { fitAddon.fit(); } catch { }
      }, 70);
    };

    // ResizeObserver is more reliable than window resize event
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", handleResize);

    const autoConnectFrame = autoConnect
      ? requestAnimationFrame(() => connect())
      : null;

    return () => {
      if (autoConnectFrame !== null) cancelAnimationFrame(autoConnectFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      term.dispose();
      disconnect();
    };
  }, [autoConnect, connect, disconnect, sendTerminalInput]);

  const sendCommand = (cmd: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && status === "connected") {
      wsRef.current.send(
        JSON.stringify({
          type: "input",
          data: `${cmd}\r`
        })
      );
      if (xtermRef.current) xtermRef.current.focus();
    } else {
      toast.error("Terminal is not connected");
    }
  };

  const sendEnter = () => {
    sendCommand("");
  };

  const clearOutput = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const copyOutput = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Selection copied to clipboard");
      } else {
        toast.error("Highlight text in terminal to copy");
      }
    }
  };

  const statusVariant = () => {
    switch (status) {
      case "connected": return "success";
      case "connecting": return "warning";
      case "error": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div
      ref={containerRef}
      data-terminal-fullscreen={isFullscreen ? "true" : "false"}
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl transition-all dark:border-[rgba(38,56,89,0.45)] dark:bg-[#05080d] dark:text-slate-200 ${isMinimized ? "!h-11" : isFullscreen ? "fixed inset-0 z-[100] !h-dvh !w-screen max-w-none rounded-none border-none" : "h-[580px]"
        } ${className}`}
      style={isFullscreen ? { height: "100dvh", width: "100vw", maxWidth: "none" } : undefined}
    >
      {/* Title Bar */}
      <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 text-slate-900 select-none backdrop-blur-md dark:border-[rgba(38,56,89,0.45)] dark:bg-[rgba(13,20,32,0.95)] dark:text-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="h-3 w-3 rounded-full bg-red-500/80 transition-transform hover:scale-110 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              onClick={closeTerminal}
              aria-label="Close terminal"
              title="Close"
            />
            <button
              type="button"
              className="h-3 w-3 rounded-full bg-amber-500/80 transition-transform hover:scale-110 hover:bg-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              onClick={toggleMinimized}
              aria-label={isMinimized ? "Restore terminal" : "Minimize terminal"}
              title={isMinimized ? "Restore" : "Minimize"}
            />
            <button
              type="button"
              className="h-3 w-3 rounded-full bg-emerald-500/80 transition-transform hover:scale-110 hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Restore terminal" : "Maximize terminal"}
              title={isFullscreen ? "Restore" : "Maximize"}
            />
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700/60" />
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-900 dark:text-slate-300">
            <TerminalIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span>{title}</span>
            {host && <span className="text-slate-500 dark:text-slate-500">({host}:{port})</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusVariant()} className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5">
            {status}
          </Badge>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700/60" />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={copyOutput}
            title="Copy Selection"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={clearOutput}
            title="Clear Terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={sendEnter}
            title="Send Enter"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-600 hover:bg-slate-200 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          {status === "connected" ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs px-2.5 gap-1"
              onClick={disconnect}
            >
              <Power className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 text-xs px-2.5 gap-1 bg-cyan-600 hover:bg-cyan-500 text-white"
              onClick={connect}
              disabled={status === "connecting"}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${status === "connecting" ? "animate-spin" : ""}`} />
              Connect
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && <>
      {/* Quick Commands Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border bg-muted/60 px-3 py-1.5 scrollbar-none">
        <span className="mr-1 flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold text-foreground">
          <Zap className="h-3 w-3 text-primary" /> Commands:
        </span>
        {quickCommands.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => sendCommand(cmd)}
            disabled={status !== "connected"}
            className="shrink-0 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[11px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/60 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Main Terminal Container */}
      <div className="relative flex-1 bg-[#05080d] p-2" onClick={() => xtermRef.current?.focus()}>
        <div ref={terminalRef} className="h-full w-full" />

        {/* Connecting Overlay */}
        {status === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05080d]/85 backdrop-blur-xs p-6 text-center z-10">
            <div className="mb-4 rounded-full bg-cyan-500/10 p-4 border border-cyan-500/20 shadow-lg">
              <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
            <p className="font-mono text-xs text-slate-400 max-w-md">{statusMessage}</p>
          </div>
        )}

        {/* Error / Disconnected Overlay */}
        {(status === "error" || (status === "disconnected" && !autoConnect)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05080d]/90 backdrop-blur-xs p-6 text-center z-10">
            <div className="mb-4 rounded-full bg-red-500/10 p-4 border border-red-500/20 shadow-lg">
              <Server className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-slate-400 max-w-md mb-6">{statusMessage}</p>
            <Button
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2 gap-2 shadow-lg shadow-cyan-500/20"
              onClick={connect}
            >
              <Power className="h-4 w-4" />
              Reconnect SSH Terminal
            </Button>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="flex h-7 items-center justify-between border-t border-slate-200 bg-slate-50 px-4 font-mono text-[11px] text-slate-600 select-none dark:border-[rgba(38,56,89,0.3)] dark:bg-[#080d14] dark:text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-cyan-600 dark:text-cyan-400" /> Secure SSHv2 Stream
          </span>
          <span>
            Dimensions: {cols} × {rows}
          </span>
        </div>
        <div>
          <span>xterm-256color</span>
        </div>
      </div>
      </>}
    </div>
  );
}
