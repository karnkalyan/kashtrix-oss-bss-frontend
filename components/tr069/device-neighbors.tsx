"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Laptop, Smartphone, Tv, Router, Gamepad, Monitor, Cable, Wifi, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface ConnectedDevice {
  macAddress: string;
  ipAddress: string;
  hostName?: string;
  active?: boolean | string | number;
  leaseTimeRemaining?: number | string;
  interfaceType?: string;
  ssid?: string;
}

interface TR069DeviceNeighborsProps {
  deviceId: string;
}

export function TR069DeviceNeighbors({ deviceId }: TR069DeviceNeighborsProps) {
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requestControllerRef = useRef<AbortController | null>(null);

  const fetchConnectedDevices = useCallback(async (refresh = false) => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const query = refresh ? "?refresh=true" : "";
      const response = await apiRequest<{
        success: boolean;
        data?: { connectedDevices?: ConnectedDevice[] } | ConnectedDevice[];
      }>(
        `/services/genieacs/devices/${encodeURIComponent(deviceId)}/connected-devices-info${query}`,
        { suppressToast: true, signal: controller.signal }
      );
      const data = response?.data;
      const devices = Array.isArray(data) ? data : data?.connectedDevices;

      if (response?.success && Array.isArray(devices)) {
        setConnectedDevices(devices);
        setLoadError("");
      } else {
        setLoadError("The device returned no host inventory.");
      }
    } catch (error: unknown) {
      if (requestControllerRef.current !== controller) return;
      if (controller.signal.aborted) {
        setLoadError("The host inventory request timed out. Try refreshing when the device is online.");
      } else {
        console.error("Error fetching connected devices:", error);
        setLoadError(error instanceof Error ? error.message : "Could not retrieve connected devices from ACS.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [deviceId]);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => void fetchConnectedDevices(), 0);
    return () => {
      window.clearTimeout(initialRequest);
      const activeRequest = requestControllerRef.current;
      requestControllerRef.current = null;
      activeRequest?.abort();
    };
  }, [fetchConnectedDevices]);

  const getDeviceIcon = (hostName: string = "") => {
    const name = hostName.toLowerCase();
    if (name.includes("tv") || name.includes("samsung") || name.includes("lg") || name.includes("sony")) return <Tv className="h-4 w-4 text-indigo-500" />;
    if (name.includes("phone") || name.includes("iphone") || name.includes("android") || name.includes("s24") || name.includes("galaxy")) return <Smartphone className="h-4 w-4 text-emerald-500" />;
    if (name.includes("router") || name.includes("ap") || name.includes("extender")) return <Router className="h-4 w-4 text-blue-500" />;
    if (name.includes("xbox") || name.includes("playstation") || name.includes("ps5") || name.includes("game")) return <Gamepad className="h-4 w-4 text-purple-500" />;
    if (name.includes("printer") || name.includes("prn")) return <Monitor className="h-4 w-4 text-amber-500" />;
    return <Laptop className="h-4 w-4 text-slate-500" />;
  };

  const getInterfaceIcon = (type: string = "") => {
    const t = type.toLowerCase();
    if (t.includes("wifi") || t.includes("wireless") || t.includes("wlan")) return <Wifi className="h-3.5 w-3.5 mr-1 inline-block" />;
    return <Cable className="h-3.5 w-3.5 mr-1 inline-block" />;
  };

  const formatLastSeen = (active: ConnectedDevice["active"], leaseTimeRemaining: ConnectedDevice["leaseTimeRemaining"]): string => {
    if (typeof active === "boolean" && active) return "Active now";
    if (typeof active === "string" && active === "true") return "Active now";
    if (typeof active === "number" && active === 1) return "Active now";
    const totalSeconds = Math.floor(Number(leaseTimeRemaining));
    if (Number.isFinite(totalSeconds) && totalSeconds > 0) {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} left`;
    }
    return "Offline";
  };

  const getActiveStatus = (active: ConnectedDevice["active"]): "online" | "offline" => {
    if (typeof active === "boolean") return active ? "online" : "offline";
    if (active === "true" || active === 1) return "online";
    return "offline";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 bg-card/45 border rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-xs text-muted-foreground font-bold uppercase tracking-wider">Retrieving connected hosts inventory...</p>
      </div>
    );
  }

  const validDevices = connectedDevices.filter(
    (d) => d.macAddress && d.macAddress !== "N/A"
  );

  return (
    <CardContainer
      title="Connected Client Inventory"
      description="Active and leased DHCP devices connected to this router"
      gradientColor="#6366f1"
    >
      <div className="mb-3 flex justify-end">
        <button
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void fetchConnectedDevices(true)}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing hosts..." : "Refresh live hosts"}
        </button>
      </div>
      {loadError && validDevices.length > 0 && (
        <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {loadError}
        </p>
      )}
      <div className="rounded-2xl border border-border overflow-hidden bg-white dark:bg-card shadow-inner mt-2">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow>
              <TableHead className="text-xs font-bold">CPE Neighbor / Hostname</TableHead>
              <TableHead className="text-xs font-bold">MAC Address</TableHead>
              <TableHead className="text-xs font-bold">Assigned IP</TableHead>
              <TableHead className="text-xs font-bold">Connection State</TableHead>
              <TableHead className="text-xs font-bold">Medium / Interface</TableHead>
              <TableHead className="text-xs font-bold">Lease Timer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  {loadError || "The CPE currently reports zero active or leased host records."}
                </TableCell>
              </TableRow>
            ) : (
              validDevices.map((device, index) => {
                const status = getActiveStatus(device.active);
                const lastSeen = formatLastSeen(device.active, device.leaseTimeRemaining);
                const interfaceType = device.ssid ? `WiFi - ${device.ssid}` : (device.interfaceType || "Unknown");

                return (
                  <TableRow key={`${device.macAddress}-${index}`} className="hover:bg-indigo-500/5 transition-colors border-b">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-secondary border p-2">
                          {getDeviceIcon(device.hostName)}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                            {device.hostName || "Unknown Host"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold">{device.macAddress}</TableCell>
                    <TableCell className="font-mono text-xs text-indigo-500 font-bold">{device.ipAddress}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        status === "online" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">
                      {getInterfaceIcon(interfaceType)} {interfaceType}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground font-mono">{lastSeen}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </CardContainer>
  );
}
