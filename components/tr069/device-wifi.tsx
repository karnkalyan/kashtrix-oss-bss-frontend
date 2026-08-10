"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import {
  Activity,
  Download,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Save,
  Shield,
  Signal,
  Upload,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SSID } from "@/types/tr069";
import { apiRequest } from "@/lib/api";

interface TR069DeviceWifiProps {
  deviceId: string;
}

interface WifiStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  unicastReceived: number;
  unicastSent: number;
  multicastReceived: number;
  multicastSent: number;
  broadcastReceived: number;
  broadcastSent: number;
  errorsReceived: number;
  errorsSent: number;
  discardReceived: number;
  discardSent: number;
}

const EMPTY_STATS: WifiStats = {
  bytesReceived: 0,
  bytesSent: 0,
  packetsReceived: 0,
  packetsSent: 0,
  unicastReceived: 0,
  unicastSent: 0,
  multicastReceived: 0,
  multicastSent: 0,
  broadcastReceived: 0,
  broadcastSent: 0,
  errorsReceived: 0,
  errorsSent: 0,
  discardReceived: 0,
  discardSent: 0,
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readParameter(
  parameters: Record<string, unknown>,
  ...names: string[]
): unknown {
  for (const name of names) {
    if (parameters[name] !== undefined && parameters[name] !== null) {
      return parameters[name];
    }
  }
  return undefined;
}

function mapSecurity(
  beaconType?: string,
  parameters: Record<string, unknown> = {},
): string {
  const type = String(
    beaconType ||
    readParameter(
      parameters,
      "BeaconType",
      "SecurityModeEnabled",
      "X_CMS_BeaconType",
    ) ||
    "",
  ).toLowerCase();

  if (type.includes("wpa2") || type.includes("11i")) return "wpa2-psk";
  if (type.includes("wpa")) return "wpa-psk";
  if (type.includes("wep")) return "wep";
  return "none";
}

function getFrequencyBand(ssid: SSID): string {
  const parameters = (ssid.parameters || {}) as Record<string, unknown>;
  const value = String(
    readParameter(
      parameters,
      "OperatingFrequencyBand",
      "FrequencyBand",
      "X_CMS_FrequencyBand",
      "Standard",
    ) || "",
  ).toLowerCase();

  const channel = toNumber(ssid.channel);
  if (value.includes("5") || channel > 14) return "5GHz";
  return "2.4GHz";
}

function getClientCount(ssid: SSID): number {
  const parameters = (ssid.parameters || {}) as Record<string, unknown>;
  return toNumber(
    readParameter(
      parameters,
      "TotalAssociations",
      "AssociatedDeviceNumberOfEntries",
      "X_CMS_AssociatedDeviceNumberOfEntries",
    ),
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(Number.isFinite(value) ? value : 0);
}

export function TR069DeviceWifi({ deviceId }: TR069DeviceWifiProps) {
  const [ssidList, setSsidList] = useState<SSID[]>([]);
  const [selectedSSID, setSelectedSSID] = useState<SSID | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [snapshotMeta, setSnapshotMeta] = useState<{ source?: string; snapshotAt?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeWifiTab, setActiveWifiTab] = useState("basic");
  const [maxClients, setMaxClients] = useState("32");
  const [settings, setSettings] = useState({
    enabled: false,
    ssid: "",
    password: "",
    security: "",
    channel: "",
    bandwidth: "",
    mode: "",
    txPower: "",
  });
  const [stats, setStats] = useState<WifiStats>(EMPTY_STATS);

  const fetchWlanInfo = async ({
    preferredInstance,
    refresh = false,
  }: { preferredInstance?: string; refresh?: boolean } = {}) => {
    try {
      if (!refresh) setIsLoading(true);
      if (refresh) setIsRefreshing(true);

      const suffix = refresh ? "?refresh=true" : "";
      const response = await apiRequest<{
        success: boolean;
        data: any;
        meta?: { source?: string; snapshotAt?: string };
      }>(`/services/genieacs/devices/${encodeURIComponent(deviceId)}/wlaninfo${suffix}`, {
        suppressToast: true,
      });

      if (!response.success) {
        setSsidList([]);
        setSelectedSSID(null);
        setLoadError("This device did not return any Wi-Fi SSID objects.");
        toast.error("Failed to load WiFi information");
        return;
      }

      const ssids: SSID[] = response.data?.ssidList || [];
      setSsidList(ssids);
      setSnapshotMeta(response.meta || null);
      setLoadError("");

      if (ssids.length === 0) {
        setSelectedSSID(null);
        setLoadError("This device did not return any Wi-Fi SSID objects.");
        return;
      }

      setSelectedSSID((previous) => {
        const currentInstance = preferredInstance || previous?.instance;
        const current = ssids.find((ssid) => ssid.instance === currentInstance);
        const firstEnabled = ssids.find((ssid) => ssid.enable === true);
        return current || firstEnabled || ssids[0];
      });
    } catch (error: any) {
      console.error("Error fetching WLAN info:", error);
      setLoadError(error?.message || "Could not load Wi-Fi configuration from ACS.");
      toast.error("Error loading WiFi information");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchWlanInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    if (!selectedSSID) return;

    const parameters = (selectedSSID.parameters || {}) as Record<
      string,
      unknown
    >;
    const password =
      selectedSSID.keyPassphrase ||
      String(
        readParameter(
          parameters,
          "X_CMS_KeyPassphrase",
          "X_CT-COM_KeyPassphrase",
          "PreSharedKey",
        ) || "",
      );

    setSettings({
      enabled: Boolean(selectedSSID.enable),
      ssid: selectedSSID.ssid || "",
      password: password || "********",
      security: mapSecurity(selectedSSID.beaconType, parameters),
      channel: String(selectedSSID.channel || "Auto"),
      bandwidth: String(
        readParameter(
          parameters,
          "ChannelBandwidth",
          "OperatingChannelBandwidth",
          "X_CMS_ChannelBandwidth",
        ) || "",
      ),
      mode: String(
        readParameter(
          parameters,
          "Standard",
          "OperatingStandards",
          "X_CMS_Standard",
        ) || "",
      ),
      txPower: String(
        readParameter(parameters, "TransmitPower", "X_CMS_TransmitPower") ||
        "",
      ),
    });

    setStats({
      bytesReceived: toNumber(
        readParameter(parameters, "BytesReceived", "Stats.BytesReceived"),
      ),
      bytesSent: toNumber(
        readParameter(parameters, "BytesSent", "Stats.BytesSent"),
      ),
      packetsReceived: toNumber(
        readParameter(parameters, "PacketsReceived", "Stats.PacketsReceived"),
      ),
      packetsSent: toNumber(
        readParameter(parameters, "PacketsSent", "Stats.PacketsSent"),
      ),
      unicastReceived: toNumber(
        readParameter(
          parameters,
          "UnicastPacketsReceived",
          "Stats.UnicastPacketsReceived",
        ),
      ),
      unicastSent: toNumber(
        readParameter(parameters, "UnicastPacketsSent", "Stats.UnicastPacketsSent"),
      ),
      multicastReceived: toNumber(
        readParameter(
          parameters,
          "MulticastPacketsReceived",
          "Stats.MulticastPacketsReceived",
        ),
      ),
      multicastSent: toNumber(
        readParameter(
          parameters,
          "MulticastPacketsSent",
          "Stats.MulticastPacketsSent",
        ),
      ),
      broadcastReceived: toNumber(
        readParameter(
          parameters,
          "BroadcastPacketsReceived",
          "Stats.BroadcastPacketsReceived",
        ),
      ),
      broadcastSent: toNumber(
        readParameter(
          parameters,
          "BroadcastPacketsSent",
          "Stats.BroadcastPacketsSent",
        ),
      ),
      errorsReceived: toNumber(
        readParameter(parameters, "ErrorsReceived", "Stats.ErrorsReceived"),
      ),
      errorsSent: toNumber(
        readParameter(parameters, "ErrorsSent", "Stats.ErrorsSent"),
      ),
      discardReceived: toNumber(
        readParameter(
          parameters,
          "DiscardPacketsReceived",
          "Stats.DiscardPacketsReceived",
        ),
      ),
      discardSent: toNumber(
        readParameter(
          parameters,
          "DiscardPacketsSent",
          "Stats.DiscardPacketsSent",
        ),
      ),
    });
  }, [selectedSSID]);

  const handleToggleEnable = async () => {
    if (!selectedSSID) return;

    try {
      setIsSaving(true);
      const newEnabledState = !settings.enabled;
      const instanceMatch = selectedSSID.instance.match(
        /WLANConfiguration\.(\d+)/,
      );

      if (!instanceMatch) {
        toast.error("Invalid SSID instance");
        return;
      }

      const response = await apiRequest<{
        success: boolean;
        message?: string;
      }>(`/services/genieacs/devices/${deviceId}/ssid-operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ssidIndex: instanceMatch[1],
          operation: newEnabledState,
        }),
      });

      if (!response.success) {
        toast.error(
          response.message ||
          `Failed to ${newEnabledState ? "enable" : "disable"} WiFi network`,
        );
        return;
      }

      toast.success(
        `WiFi network ${newEnabledState ? "enabled" : "disabled"} successfully`,
      );
      setSettings((previous) => ({
        ...previous,
        enabled: newEnabledState,
      }));
      setSsidList((previous) =>
        previous.map((ssid) =>
          ssid.instance === selectedSSID.instance
            ? {
              ...ssid,
              enable: newEnabledState,
              status: newEnabledState ? "Up" : "Disabled",
            }
            : ssid,
        ),
      );
      setSelectedSSID((previous) =>
        previous
          ? {
            ...previous,
            enable: newEnabledState,
            status: newEnabledState ? "Up" : "Disabled",
          }
          : null,
      );
    } catch (error) {
      console.error("Error toggling WiFi:", error);
      toast.error("Error updating WiFi settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSSID) return;

    try {
      setIsSaving(true);
      const instanceMatch = selectedSSID.instance.match(
        /WLANConfiguration\.(\d+)/,
      );

      if (!instanceMatch) {
        toast.error("Invalid SSID instance");
        return;
      }

      const payload = {
        ssidIndex: Number.parseInt(instanceMatch[1], 10),
        ssidName: settings.ssid,
        password:
          settings.password && settings.password !== "********"
            ? settings.password
            : undefined,
      };

      const response = await apiRequest<{
        success: boolean;
        message?: string;
      }>(`/services/genieacs/devices/${deviceId}/update-wifi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        toast.error(response.message || "Failed to save WiFi settings");
        return;
      }

      toast.success("WiFi settings saved successfully");
      await fetchWlanInfo({ preferredInstance: selectedSSID.instance });
    } catch (error) {
      console.error("Error saving WiFi settings:", error);
      toast.error("Error saving WiFi settings");
    } finally {
      setIsSaving(false);
    }
  };

  const wifiTabs = [
    { key: "basic", label: "Basic Settings" },
    { key: "security", label: "Security" },
    { key: "advanced", label: "Advanced Settings" },
    { key: "wps", label: "WPS" },
    { key: "mac", label: "MAC Filtering" },
    { key: "guest", label: "Guest Access" },
    { key: "schedule", label: "Schedule" },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-72 animate-pulse rounded-2xl border bg-secondary/20 lg:col-span-3" />
        <div className="h-72 animate-pulse rounded-2xl border bg-secondary/20 lg:col-span-6" />
        <div className="h-72 animate-pulse rounded-2xl border bg-secondary/20 lg:col-span-3" />
      </div>
    );
  }

  if (!selectedSSID) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
        <p>{loadError || "No WiFi configuration was returned by this device."}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void fetchWlanInfo({ refresh: true })}
        >
          Retry Wi-Fi retrieval
        </Button>
      </div>
    );
  }

  const rawRssi =
    selectedSSID.parameters?.["RSSI"] ||
    selectedSSID.parameters?.["SignalStrength"] ||
    selectedSSID.parameters?.["X_CT-COM_SignalStrength"] ||
    selectedSSID.parameters?.["X_ALU_COM_RSSI"] ||
    selectedSSID.parameters?.["X_CMS_RSSI"];

  let signalStrength: number | null = null;
  if (rawRssi != null && rawRssi !== "") {
    const parsed = Number.parseInt(String(rawRssi), 10);
    if (Number.isFinite(parsed) && parsed !== 0) signalStrength = parsed;
  }

  if (signalStrength === null && (selectedSSID.enable || settings.enabled)) {
    const tx = String(
      settings.txPower || selectedSSID.parameters?.["TransmitPower"] || "100",
    ).toLowerCase();
    if (tx.includes("100") || tx.includes("high") || tx.includes("max")) signalStrength = -45;
    else if (tx.includes("75") || tx.includes("med")) signalStrength = -58;
    else if (tx.includes("50")) signalStrength = -68;
    else if (tx.includes("25") || tx.includes("low")) signalStrength = -78;
    else signalStrength = -45;
  }

  const signalQuality =
    signalStrength === null
      ? "Disabled"
      : signalStrength > -50
        ? "Excellent"
        : signalStrength > -60
          ? "Good"
          : signalStrength > -70
            ? "Fair"
            : "Poor";
  const signalColor =
    signalStrength === null
      ? "bg-slate-400"
      : signalStrength > -50
        ? "bg-emerald-500"
        : signalStrength > -60
          ? "bg-green-500"
          : signalStrength > -70
            ? "bg-amber-500"
            : "bg-red-500";
  const signalPct =
    signalStrength === null
      ? 0
      : Math.max(0, Math.min(100, ((signalStrength + 100) / 100) * 100));
  const disabledSSIDs = ssidList.filter((ssid) => !ssid.enable);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">WiFi Settings</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">View and manage wireless network configurations for this device</p>
          {snapshotMeta?.snapshotAt && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {snapshotMeta.source === "database" ? "Saved database snapshot" : "Latest ACS snapshot"}
              {" • "}
              {new Date(snapshotMeta.snapshotAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchWlanInfo({ preferredInstance: selectedSSID.instance, refresh: true })}
          disabled={isRefreshing || isSaving}
          className="h-9 rounded-xl text-xs font-bold"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Pulling from ACS" : "Refresh from ACS"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">WiFi Networks</h3>
              <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">Manage and configure wireless networks</p>
            </div>
            <Button size="sm" className="h-8 rounded-xl bg-indigo-600 px-3 text-[10px] font-bold text-white hover:bg-indigo-700">+ Add Network</Button>
          </div>

          <div className="space-y-2.5">
            {ssidList.map((ssid) => {
              const band = getFrequencyBand(ssid);
              const clients = getClientCount(ssid);
              const isSelected = selectedSSID.instance === ssid.instance;
              const secType = ssid.beaconType?.toUpperCase()?.replace("-", "") || "OPEN";
              return (
                <button
                  type="button"
                  key={ssid.instance}
                  onClick={() => setSelectedSSID(ssid)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition-all duration-200 ${isSelected
                      ? "border-indigo-500/40 bg-indigo-500/5 shadow-sm"
                      : "border-border/60 bg-card/60 hover:bg-secondary/20"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl border p-2 ${ssid.enable
                          ? band === "5GHz"
                            ? "border-purple-500/25 bg-purple-500/10 text-purple-500"
                            : "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                          : "border-border bg-secondary text-muted-foreground"
                        }`}>
                        {ssid.enable ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{ssid.ssid || "Unnamed"}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${band === "5GHz" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}`}>
                            {band === "5GHz" ? "5 GHz" : "2.4 GHz"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">SSID: {ssid.ssid}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${ssid.enable ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}>
                        {ssid.enable ? "Enabled" : "Disabled"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">→</span>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-3 border-t border-border/40 pt-2 text-[9px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />Channel {ssid.channel || "Auto"}</span>
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" />{secType}</span>
                    <span className="flex items-center gap-1"><Signal className="h-3 w-3" />{clients} Clients</span>
                  </div>
                </button>
              );
            })}
          </div>

          {disabledSSIDs.length > 0 && (
            <button type="button" className="w-full rounded-xl border border-dashed border-indigo-500/30 py-2 text-center text-[10px] font-bold text-indigo-500 transition-colors hover:bg-indigo-500/5 hover:text-indigo-600">
              View Inactive Networks ({disabledSSIDs.length}) ↓
            </button>
          )}
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-slate-100/80 bg-card p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{settings.ssid} ({getFrequencyBand(selectedSSID) === "5GHz" ? "5 GHz" : "2.4 GHz"})</h3>
                <Badge className={`rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${settings.enabled ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}>
                  {settings.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={settings.enabled} onCheckedChange={handleToggleEnable} disabled={isSaving} />
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-muted-foreground">Hide SSID</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-rose-500">Delete</Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800/80">
            <div className="border-b border-border px-4 pt-3">
              <div className="flex gap-4 overflow-x-auto pb-2 text-[10px] font-bold">
                {wifiTabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    onClick={() => setActiveWifiTab(tab.key)}
                    className={`whitespace-nowrap border-b-2 pb-2 transition-all ${activeWifiTab === tab.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 p-5">
              {activeWifiTab === "basic" && (
                <div className="grid grid-cols-1 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">SSID Name</Label>
                    <Input value={settings.ssid} onChange={(event) => setSettings((previous) => ({ ...previous, ssid: event.target.value }))} disabled={isSaving || !settings.enabled} className="rounded-xl border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Broadcast SSID</Label>
                    <Switch checked={settings.enabled} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Operating Mode</Label>
                    <select className="h-9 w-full rounded-xl border bg-background px-3 text-xs" disabled={!settings.enabled} value={settings.mode || "802.11n (WiFi 4)"} onChange={(event) => setSettings((previous) => ({ ...previous, mode: event.target.value }))}>
                      <option value={settings.mode || "802.11n (WiFi 4)"}>{settings.mode || "802.11n (WiFi 4)"}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-muted-foreground">Channel</Label>
                      <div className="flex gap-2"><Input value={settings.channel} readOnly className="flex-1 rounded-xl bg-secondary/40" /><span className="inline-flex items-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 text-[9px] font-bold text-indigo-500">Auto</span></div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-muted-foreground">Channel Width</Label>
                      <select className="h-9 w-full rounded-xl border bg-background px-3 text-xs" disabled={!settings.enabled} value={settings.bandwidth || "20 MHz"} onChange={(event) => setSettings((previous) => ({ ...previous, bandwidth: event.target.value }))}>
                        <option value={settings.bandwidth || "20 MHz"}>{settings.bandwidth || "20 MHz"}</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Transmit Power</Label>
                    <select className="h-9 w-full rounded-xl border bg-background px-3 text-xs" disabled={!settings.enabled} value={settings.txPower || "High"} onChange={(event) => setSettings((previous) => ({ ...previous, txPower: event.target.value }))}>
                      <option value={settings.txPower || "High"}>{settings.txPower || "High"}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Max Clients</Label>
                    <Input value={maxClients} onChange={(event) => setMaxClients(event.target.value)} disabled={!settings.enabled} className="rounded-xl" />
                    <p className="text-[9px] text-muted-foreground">Range: 1 - 64</p>
                  </div>
                </div>
              )}

              {activeWifiTab === "security" && (
                <div className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Security Type</Label>
                    <Input value={settings.security.toUpperCase()} readOnly className="rounded-xl bg-secondary/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Pre-Shared Key (Password)</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={settings.password} onChange={(event) => setSettings((previous) => ({ ...previous, password: event.target.value }))} disabled={isSaving || !settings.enabled} className="rounded-xl pr-10 font-mono" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-indigo-500" onClick={() => setShowPassword((previous) => !previous)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-muted-foreground">Encryption Mode</Label>
                    <Input value={selectedSSID.encryptionMode || "AES"} readOnly className="rounded-xl bg-secondary/40" />
                  </div>
                </div>
              )}

              {activeWifiTab !== "basic" && activeWifiTab !== "security" && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-xs font-semibold">{wifiTabs.find((tab) => tab.key === activeWifiTab)?.label} settings</p>
                  <p className="mt-1 text-[10px]">Configuration options will appear here when supported by this CPE</p>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                <Button variant="outline" size="sm" onClick={() => void fetchWlanInfo({ preferredInstance: selectedSSID.instance })} disabled={isSaving} className="h-9 rounded-xl border-slate-200 text-xs font-bold dark:border-slate-700">Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving || !settings.enabled} className="h-9 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700"><Save className="mr-1.5 h-3.5 w-3.5" />{isSaving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          {settings.enabled ? (
            <>
              <div className="rounded-2xl border border-slate-100/80 bg-card p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800/80">
                <span className="mb-3 block text-xs font-extrabold text-slate-800 dark:text-slate-200">Signal Strength</span>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{signalStrength === null ? "N/A" : `${signalStrength} dBm`}</div>
                  <Badge className={`mt-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase ${signalQuality === "Excellent" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : signalQuality === "Good" ? "border-green-500/20 bg-green-500/10 text-green-500" : signalQuality === "Fair" ? "border-amber-500/20 bg-amber-500/10 text-amber-500" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}>{signalQuality}</Badge>
                </div>
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full border bg-secondary"><div className={`h-full rounded-full transition-all duration-500 ${signalColor}`} style={{ width: `${signalPct}%` }} /></div>
                  <div className="mt-1.5 flex justify-between font-mono text-[9px] text-muted-foreground"><span>-100 dBm</span><span>-60 dBm</span><span>0 dBm</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100/80 bg-card p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800/80">
                <span className="mb-3 block text-xs font-extrabold text-slate-800 dark:text-slate-200">Network Information</span>
                <div className="space-y-2 text-xs font-semibold">
                  {[
                    { label: "BSSID", val: selectedSSID.bssid || String(selectedSSID.parameters?.["BSSID"] || selectedSSID.parameters?.["MACAddress"] || "N/A") },
                    { label: "Frequency", val: getFrequencyBand(selectedSSID) === "5GHz" ? "5 GHz" : "2.4 GHz" },
                    { label: "Channel", val: String(selectedSSID.channel || "Auto") },
                    { label: "Channel Width", val: settings.bandwidth || "20 MHz" },
                    { label: "Mode", val: settings.mode || "802.11n" },
                    { label: "Clients Connected", val: String(getClientCount(selectedSSID)) },
                    { label: "Traffic", val: `↑ ${formatBytes(stats.bytesReceived)} ↓ ${formatBytes(stats.bytesSent)}` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-0"><span className="text-[10px] font-medium text-muted-foreground">{row.label}</span><span className="text-[10px] font-mono text-slate-800 dark:text-slate-200">{row.val}</span></div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100/80 bg-card p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-800/80">
                <div className="mb-3 flex items-center justify-between"><span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Interface Metrics</span><span className="text-[9px] font-medium text-muted-foreground">Realtime traffic on this SSID</span></div>
                <div className="space-y-4">
                  {[
                    { label: "Bytes", received: stats.bytesReceived, sent: stats.bytesSent, formatter: formatBytes },
                    { label: "Packets", received: stats.packetsReceived, sent: stats.packetsSent, formatter: formatNumber },
                  ].map((metric) => {
                    const total = metric.received + metric.sent || 1;
                    return (
                      <div key={metric.label} className="space-y-3 rounded-xl border bg-secondary/15 p-4">
                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground"><span>{metric.label}</span><span className="text-slate-800 dark:text-slate-200">Total: {metric.formatter(metric.received + metric.sent)}</span></div>
                        <div><div className="mb-1 flex justify-between text-[9px] font-bold text-muted-foreground"><span>Received</span><span>{metric.formatter(metric.received)}</span></div><div className="h-1.5 w-full overflow-hidden rounded-full border bg-secondary"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((metric.received / total) * 100)}%` }} /></div></div>
                        <div><div className="mb-1 flex justify-between text-[9px] font-bold text-muted-foreground"><span>Sent</span><span>{metric.formatter(metric.sent)}</span></div><div className="h-1.5 w-full overflow-hidden rounded-full border bg-secondary"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.round((metric.sent / total) * 100)}%` }} /></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground"><WifiOff className="mx-auto mb-3 h-10 w-10 opacity-50" /><p>This WiFi network is currently disabled.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}