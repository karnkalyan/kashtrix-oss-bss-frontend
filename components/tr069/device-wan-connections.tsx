"use client";

import { useEffect, useRef, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WanConnection } from "@/types/tr069";
import {
    Globe, Activity, Tag, Network, Router, Download, Upload,
    Clock, Shield, RefreshCw, BarChart as BarChartIcon, Info,
    AlertTriangle, Zap, Eye, EyeOff, Settings, Fingerprint,
    Wifi, Radio, Terminal, Lock, Trash2, Plus, ArrowLeft, Edit3
} from "lucide-react";
// Recharts imported removed to resolve compilation issues
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";

interface TR069DeviceWanConnectionsProps {
    deviceId: string; // serial number
}

type WanDiagnosticResult = {
    diagnostic?: string;
    status: "queued" | "pending" | "completed" | "failed";
    diagnosticsState?: string;
    target?: string;
    summary?: Record<string, unknown>;
    results?: Array<Record<string, unknown>>;
    retrievedAt?: string;
    message?: string | null;
};

const waitForWanDiagnostic = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

function numberFromSummary(summary: Record<string, unknown> | undefined, key: string) {
    const raw = summary?.[key];
    if (raw === null || raw === undefined || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
}

function HumanReadableWanDiagnostic({ result }: { result: WanDiagnosticResult }) {
    const sentSuccess = numberFromSummary(result.summary, "successCount");
    const failed = numberFromSummary(result.summary, "failureCount");
    const sent = (sentSuccess ?? 0) + (failed ?? 0);
    const loss = sent > 0 ? Math.round(((failed || 0) / sent) * 100) : null;
    const minimum = numberFromSummary(result.summary, "minimumResponseTime");
    const average = numberFromSummary(result.summary, "averageResponseTime");
    const maximum = numberFromSummary(result.summary, "maximumResponseTime");
    const reachable = result.status === "completed" && sentSuccess !== null && sentSuccess > 0;

    return (
        <div className="mt-2 space-y-2 text-[10px]">
            {result.status === "queued" && (
                <p className="font-semibold text-amber-700">Waiting for the CPE to receive this ACS task.</p>
            )}
            {result.status === "pending" && (
                <p className="font-semibold text-indigo-700">The CPE received the request; the test is still running.</p>
            )}
            {result.diagnostic === "ping" && result.status === "completed" && (
                <>
                    <p className={`text-sm font-extrabold ${reachable ? "text-emerald-600" : "text-rose-600"}`}>
                        {reachable ? "Gateway responded successfully" : "No ICMP reply received"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-background/70 p-2">
                            <span className="block text-muted-foreground">Packets</span>
                            <strong>{sent} sent · {sentSuccess ?? 0} received · {failed ?? 0} lost{loss !== null ? ` (${loss}%)` : ""}</strong>
                        </div>
                        <div className="rounded-lg bg-background/70 p-2">
                            <span className="block text-muted-foreground">Latency min / avg / max</span>
                            <strong>{minimum ?? "—"} / {average ?? "—"} / {maximum ?? "—"} ms</strong>
                        </div>
                    </div>
                    {!reachable && (
                        <p className="text-muted-foreground">The WAN may still be online; some upstream gateways intentionally block ICMP echo requests.</p>
                    )}
                </>
            )}
            {result.diagnostic === "traceroute" && result.status === "completed" && (
                <>
                    <p className="text-sm font-extrabold text-emerald-600">
                        Traceroute completed with {result.results?.length || 0} hop(s)
                    </p>
                    <ol className="max-h-48 space-y-1 overflow-auto font-mono">
                        {(result.results || []).map((hop, index) => (
                            <li key={String(hop.index ?? index)} className="rounded bg-background/70 p-1.5">
                                {index + 1}. {String(hop.HopHost || hop.HopHostAddress || "No response")} {hop.HopRTTimes ? `· ${String(hop.HopRTTimes)} ms` : ""}
                            </li>
                        ))}
                    </ol>
                </>
            )}
            {result.status === "failed" && (
                <p className="font-semibold text-rose-600">The CPE reported: {result.diagnosticsState || result.message || "Diagnostic failed"}.</p>
            )}
        </div>
    );
}

function wanConnectionKey(connection: WanConnection) {
    return connection.root || [
        connection.modelRoot || "TR-098",
        connection.wanDeviceIndex || "device",
        connection.wanConnectionDeviceIndex || "interface",
        connection.type,
        connection.connectionIndex
    ].join(":");
}

interface EthernetStats {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    broadcastReceived: number;
    broadcastSent: number;
    multicastReceived: number;
    multicastSent: number;
    unicastReceived: number;
    unicastSent: number;
    errorsReceived: number;
    errorsSent: number;
    discardReceived: number;
    discardSent: number;
    crcErrors: number;
    overSizePackets: number;
    underSizePackets: number;
    fragmentsReceived: number;
    fragmentsSent: number;
    jabbersReceived: number;
    jabbersSent: number;
    downstreamBwUtilization: string;
    upstreamBwUtilization: string;
}

interface AccessControls {
    httpEnabled: boolean;
    httpTrusted: boolean;
    httpsEnabled: boolean;
    httpsTrusted: boolean;
    httpsDebugMode: boolean;
    httpsDebugTimer: number;
    sshEnabled: boolean;
    sshTrusted: boolean;
    telnetEnabled: boolean;
    telnetTrusted: boolean;
    ftpEnabled: boolean;
    sftpEnabled: boolean;
    icmpEnabled: boolean;
    icmpTrusted: boolean;
    tr69Enabled: boolean;
    tr69Trusted: boolean;
    trustedNetworkEnable: boolean;
}

interface ConnectionDetails {
    serviceType: string;
    vlanId: number | null;
    vlanPriority: number | null;
    addressingType: string;
    macAddress: string;
    mtuValue: string;
    dnsServers: string[];
    name: string;
    ipDetails: {
        externalIPAddress: string;
        defaultGateway: string;
        subnetMask: string;
        remoteIPAddress: string;
    };
    pppoeDetails?: {
        username: string;
        password: string;
        acName: string;
        remoteIP: string;
        sessionId: string;
        lcpEcho: number;
        lcpEchoRetry: number;
        authenticationProtocol: string;
        encryptionProtocol: string;
        compressionProtocol: string;
        serviceName: string;
        currentMRU: number;
        maxMRU: number;
    };
    accessControls: AccessControls;
    connectionStats: {
        uptime: number;
        lastConnectionError: string;
        connectionTrigger: string;
        natEnabled: boolean;
        dnsEnabled: boolean;
        dnsOverrideAllowed: boolean;
        macAddressOverride: boolean;
        rsipAvailable: boolean;
        wanFwMark: number;
        shapingRate: number;
        shapingBurstSize: number;
        routeProtocolRx: string;
        idleDisconnectTime: number;
        autoDisconnectTime: number;
        warnDisconnectDelay: number;
    };
    dhcpOptions?: {
        dhcpServer: string;
        leaseTime: number;
        renewTime: number;
        rebindTime: number;
        dhcpOption125Enabled: boolean;
        dhcpOption125EnterpriseNumber: number;
        dhcpKeepAliveInterval: number;
        dhcpcWaitTime: number;
    };
    ipv6Details?: {
        ipv6Address: string;
        ipv6AddressOrigin: string;
        ipv6Prefix: string;
        ipv6PrefixOrigin: string;
        ipv6PrefixDelegationEnabled: boolean;
        ipv6DNSServers: string[];
        ipv6DefaultGateway: string;
        ipv6ConnStatus: string;
        ipv6NAEnabled: boolean;
    };
    portTriggering?: {
        numberOfEntries: number;
    };
    dmzConfig?: {
        dmzEnabled: boolean;
        dmzHostDescription: string;
        internalClient: string;
        excludeIPAddress: string;
    };
    vendorSpecific?: {
        dscpMark: number;
        vlanID: number;
        multicastVlan: number;
        aftr: string;
        aftrMode: number;
        dsliteEnable: boolean;
        op50Enabled: boolean;
        op50ReqIp: string;
        isFixedWAN: boolean;
        lanInterface: string;
        connectionDelay: number;
        ssdpEnabled: boolean;
        keepAliveTime: number;
        keepAliveRetry: number;
        wanNameType: string;
        dhcpOption125Enable: boolean;
        enterpriseNumb: number;
        option125Value: string;
    };
}

// Form state for adding a WAN connection
interface WanFormData {
    type: "ppp" | "ip";
    vlanId: string;
    serviceType: "INTERNET" | "VOIP" | "TR069" | "OTHER";
    isNat: boolean;
    // PPP specific
    username: string;
    password: string;
    // IP specific
    addressingType: "DHCP" | "Static";
    externalIp: string;
    subnet: string;
    gateway: string;
    isDNS: boolean;
    dnsServers: string;
}

const defaultFormData: WanFormData = {
    type: "ip",
    vlanId: "",
    serviceType: "INTERNET",
    isNat: true,
    username: "",
    password: "",
    addressingType: "DHCP",
    externalIp: "",
    subnet: "",
    gateway: "",
    isDNS: true,
    dnsServers: "",
};

export function TR069DeviceWanConnections({ deviceId }: TR069DeviceWanConnectionsProps) {
    const [wanConnections, setWanConnections] = useState<WanConnection[]>([]);
    const [stats, setStats] = useState<Record<string, EthernetStats>>({});
    const [throughput, setThroughput] = useState<Record<string, { rxBps: number; txBps: number }>>({});
    const previousTrafficRef = useRef<Record<string, { received: number; sent: number; sampledAt: number }>>({});
    const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<string>("overview");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [snapshotMeta, setSnapshotMeta] = useState<{ source?: string; snapshotAt?: string } | null>(null);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    // Add modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState<WanFormData>(defaultFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEditConnection, setSelectedEditConnection] = useState<WanConnection | null>(null);
    const [editFormData, setEditFormData] = useState({
        vlanId: "",
        serviceType: "INTERNET",
        username: "",
        password: "",
        isNat: true,
        addressingType: "DHCP",
        externalIp: "",
        subnet: "",
        gateway: "",
        isDNS: true,
        dnsServers: "",
    });
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [isLoadingRadiusCredentials, setIsLoadingRadiusCredentials] = useState(false);
    const [quickActionRunning, setQuickActionRunning] = useState("");
    const [quickActionResult, setQuickActionResult] = useState<WanDiagnosticResult | null>(null);

    const loadRadiusCredentials = async (target: "add" | "edit") => {
        try {
            setIsLoadingRadiusCredentials(true);
            const response = await apiRequest<{ success: boolean; data: { username: string; password: string; customerId?: string } }>(
                `/tr069-devices/${encodeURIComponent(deviceId)}/radius-credentials`
            );
            if (!response?.success || !response.data?.username) throw new Error("RADIUS credentials were not found");
            if (target === "add") {
                setFormData(prev => ({ ...prev, username: response.data.username, password: response.data.password || "" }));
            } else {
                setEditFormData(prev => ({ ...prev, username: response.data.username, password: response.data.password || "" }));
            }
            toast.success(`Loaded RADIUS credentials${response.data.customerId ? ` for ${response.data.customerId}` : ""}`);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load RADIUS credentials");
        } finally {
            setIsLoadingRadiusCredentials(false);
        }
    };

    // Delete confirmation
    const [deleteWanId, setDeleteWanId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openEditModal = (conn: WanConnection) => {
        const details = getConnectionDetails(conn);
        setSelectedEditConnection(conn);
        setEditFormData({
            vlanId: details.vlanId ? details.vlanId.toString() : "",
            serviceType: details.serviceType || "INTERNET",
            username: details.pppoeDetails?.username || "",
            password: details.pppoeDetails?.password || "",
            isNat: details.connectionStats?.natEnabled !== false,
            addressingType: details.addressingType || "DHCP",
            externalIp: details.ipDetails.externalIPAddress === "N/A" ? "" : details.ipDetails.externalIPAddress,
            subnet: details.ipDetails.subnetMask === "N/A" ? "" : details.ipDetails.subnetMask,
            gateway: details.ipDetails.defaultGateway === "N/A" ? "" : details.ipDetails.defaultGateway,
            isDNS: details.connectionStats?.dnsEnabled !== false,
            dnsServers: details.dnsServers?.join(",") || "",
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateConnection = async () => {
        if (!selectedEditConnection) return;
        const wanId = selectedEditConnection.wanConnectionDeviceIndex;
        const type = selectedEditConnection.type.toLowerCase();

        if (!editFormData.vlanId) {
            toast.error("VLAN ID is required");
            return;
        }

        if (type === 'ppp') {
            if (!editFormData.username || !editFormData.password) {
                toast.error("Username and Password are required for PPPoE");
                return;
            }
        } else if (type === 'ip' && editFormData.addressingType === 'Static') {
            if (!editFormData.externalIp || !editFormData.subnet || !editFormData.gateway) {
                toast.error("IP, Subnet, and Gateway are required for Static IPoE");
                return;
            }
        }

        try {
            setIsSubmittingEdit(true);
            const response = await apiRequest<any>(`/services/genieacs/devices/${deviceId}/update-wan-connection`, {
                method: "POST",
                body: JSON.stringify({
                    wanId,
                    type,
                    vlanId: parseInt(editFormData.vlanId, 10),
                    serviceType: editFormData.serviceType,
                    staticConfig: {
                        username: editFormData.username,
                        password: editFormData.password,
                        isNat: editFormData.isNat,
                        addressingType: editFormData.addressingType,
                        externalIp: editFormData.externalIp,
                        subnet: editFormData.subnet,
                        gateway: editFormData.gateway,
                        isDNS: editFormData.isDNS,
                        dnsServers: editFormData.dnsServers,
                        serviceType: editFormData.serviceType,
                    }
                })
            });

            if (response.success) {
                toast.success("WAN connection updated successfully");
                setIsEditModalOpen(false);
                fetchWanInfo({ refresh: true });
            } else {
                toast.error(response.error || "Failed to update WAN connection");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update WAN connection");
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    useEffect(() => {
        const initial = window.setTimeout(async () => {
            await fetchWanInfo();
            void fetchWanInfo({ background: true, live: true });
        }, 0);
        const timer = window.setInterval(() => void fetchWanInfo({ background: true, live: true }), 15000);
        return () => {
            window.clearTimeout(initial);
            window.clearInterval(timer);
        };
    }, [deviceId]);

    const fetchWanInfo = async ({
        background = false,
        refresh = false,
        live = false,
    }: { background?: boolean; refresh?: boolean; live?: boolean } = {}) => {
        try {
            if (!background) setIsLoading(true);
            const query = new URLSearchParams();
            if (refresh) query.set("refresh", "true");
            if (live) query.set("live", "true");
            const suffix = query.size ? `?${query.toString()}` : "";
            const response = await apiRequest<{ success: boolean; data: any; meta?: { source?: string; snapshotAt?: string } }>(
                `/services/genieacs/devices/${encodeURIComponent(deviceId)}/waninfo${suffix}`,
                { suppressToast: true }
            );

            if (response.success && response.data?.wanConnections && response.data.wanConnections.length > 0) {
                setWanConnections(response.data.wanConnections);
                setSnapshotMeta(response.meta || null);
                const nextStats = processStats(response.data.wanConnections);
                updateThroughput(nextStats, Date.now());
                setLoadError("");
            } else {
                setWanConnections([]);
                processStats([]);
                setLoadError("The CPE did not return any WAN connection objects.");
            }
        } catch (error: any) {
            console.error("Error fetching WAN info:", error);
            setLoadError(error?.message || "Could not retrieve WAN details from ACS.");
        } finally {
            if (!background) setIsLoading(false);
        }
    };

    const processStats = (connections: WanConnection[]) => {
        const newStats: Record<string, EthernetStats> = {};

        connections.forEach((conn) => {
            const params = conn.parameters || {};
            const key = wanConnectionKey(conn);
            const connType = conn.type === "PPP" ? "WANPPPConnection" : "WANIPConnection";
            const basePath = conn.root || `InternetGatewayDevice.WANDevice.${conn.wanDeviceIndex}.WANConnectionDevice.${conn.wanConnectionDeviceIndex}.${connType}.${conn.connectionIndex}`;

            const getInt = (path: string) => {
                const val = params[`${basePath}.${path}`];
                return val ? parseInt(val, 10) : 0;
            };

            const getString = (path: string) => params[`${basePath}.${path}`] || "";

            newStats[key] = {
                bytesReceived: getInt("Stats.EthernetBytesReceived"),
                bytesSent: getInt("Stats.EthernetBytesSent"),
                packetsReceived: getInt("Stats.EthernetPacketsReceived"),
                packetsSent: getInt("Stats.EthernetPacketsSent"),
                broadcastReceived: getInt("Stats.EthernetBroadcastPacketsReceived"),
                broadcastSent: getInt("Stats.EthernetBroadcastPacketsSent"),
                multicastReceived: getInt("Stats.EthernetMulticastPacketsReceived"),
                multicastSent: getInt("Stats.EthernetMulticastPacketsSent"),
                unicastReceived: getInt("Stats.EthernetUnicastPacketsReceived"),
                unicastSent: getInt("Stats.EthernetUnicastPacketsSent"),
                errorsReceived: getInt("Stats.EthernetErrorsReceived"),
                errorsSent: getInt("Stats.EthernetErrorsSent"),
                discardReceived: getInt("Stats.EthernetDiscardPacketsReceived"),
                discardSent: getInt("Stats.EthernetDiscardPacketsSent"),
                crcErrors: getInt("Stats.X_ALU-COM_CRCErrorReceived"),
                overSizePackets: getInt("Stats.X_ALU-COM_OverSizePacketsReceived"),
                underSizePackets: getInt("Stats.X_ALU-COM_UnderSizePacketsReceived"),
                fragmentsReceived: getInt("Stats.X_ALU-COM_DownStreamFragments"),
                fragmentsSent: getInt("Stats.X_ALU-COM_UpStreamFragments"),
                jabbersReceived: getInt("Stats.X_ALU-COM_DownStreamJabbers"),
                jabbersSent: getInt("Stats.X_ALU-COM_UpStreamJabbers"),
                downstreamBwUtilization: getString("Stats.X_ALU-COM_DownStreamBwUtilization"),
                upstreamBwUtilization: getString("Stats.X_ALU-COM_UpStreamBwUtilization"),
            };
        });

        setStats(newStats);
        return newStats;
    };

    const updateThroughput = (nextStats: Record<string, EthernetStats>, sampledAt: number) => {
        const nextSamples: Record<string, { received: number; sent: number; sampledAt: number }> = {};
        const nextRates: Record<string, { rxBps: number; txBps: number }> = {};
        for (const [key, counters] of Object.entries(nextStats)) {
            const previous = previousTrafficRef.current[key];
            nextSamples[key] = { received: counters.bytesReceived, sent: counters.bytesSent, sampledAt };
            if (!previous) continue;
            if (sampledAt <= previous.sampledAt) {
                nextSamples[key] = previous;
                continue;
            }
            const elapsedSeconds = (sampledAt - previous.sampledAt) / 1000;
            if (elapsedSeconds <= 0) continue;
            const receivedDelta = counters.bytesReceived - previous.received;
            const sentDelta = counters.bytesSent - previous.sent;
            nextRates[key] = {
                rxBps: receivedDelta >= 0 ? (receivedDelta * 8) / elapsedSeconds : 0,
                txBps: sentDelta >= 0 ? (sentDelta * 8) / elapsedSeconds : 0
            };
        }
        previousTrafficRef.current = nextSamples;
        if (Object.keys(nextRates).length > 0) {
            setThroughput(current => ({ ...current, ...nextRates }));
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchWanInfo({ refresh: true });
        setIsRefreshing(false);
    };

    const runWanDiagnostic = async (
        conn: WanConnection,
        type: "ping" | "traceroute",
        target: string,
        label: string
    ) => {
        if (!target || target === "N/A") {
            toast.error(`${label} target is unavailable on this WAN profile`);
            return;
        }

        setQuickActionRunning(label);
        setQuickActionResult({ status: "pending", diagnostic: type, target });
        toast.loading(`${label} requested on ${conn.name || "WAN profile"}…`, { id: "wan-quick-action" });
        try {
            const queued = await apiRequest<{
                success: boolean;
                data?: { dataModel?: "TR-098" | "TR-181"; taskId?: string };
                error?: string;
            }>(`/services/genieacs/devices/${encodeURIComponent(deviceId)}/diagnostics`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    target,
                    repetitions: type === "ping" ? 4 : 3,
                    timeout: 5000,
                    interfacePath: conn.root || ""
                }),
                suppressToast: true
            });
            if (!queued.success || !queued.data?.dataModel) throw new Error(queued.error || "The diagnostic task was not accepted");

            let finalResult: WanDiagnosticResult | null = null;
            // Keep following the task through a full five-minute periodic
            // Inform interval when the CPE Connection Request is unreachable.
            for (let attempt = 0; attempt < 72; attempt += 1) {
                if (attempt > 0) await waitForWanDiagnostic(5000);
                const query = new URLSearchParams({
                    type,
                    dataModel: queued.data.dataModel,
                    refresh: "true"
                });
                if (queued.data.taskId) query.set("taskId", queued.data.taskId);
                const response = await apiRequest<{ success: boolean; data?: WanDiagnosticResult; error?: string }>(
                    `/services/genieacs/devices/${encodeURIComponent(deviceId)}/diagnostics/result?${query}`,
                    { suppressToast: true }
                );
                if (!response.success || !response.data) throw new Error(response.error || "The diagnostic result is unavailable");
                finalResult = response.data;
                setQuickActionResult(finalResult);
                if (finalResult.status === "completed" || finalResult.status === "failed") break;
            }

            if (!finalResult || finalResult.status === "pending") {
                toast.error(finalResult?.message || `${label} is still running on the CPE`, { id: "wan-quick-action" });
            } else if (finalResult.status === "queued") {
                toast.error(finalResult.message || `${label} is queued; the CPE has not consumed it yet`, { id: "wan-quick-action" });
            } else if (finalResult.status === "completed") {
                toast.success(`${label} completed`, { id: "wan-quick-action" });
            } else {
                toast.error(`${label} failed: ${finalResult.diagnosticsState || "CPE error"}`, { id: "wan-quick-action" });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : `${label} failed`;
            setQuickActionResult({ status: "failed", diagnostic: type, target, diagnosticsState: message });
            toast.error(message, { id: "wan-quick-action" });
        } finally {
            setQuickActionRunning("");
        }
    };

    const togglePasswordVisibility = (key: string) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const getConnectionDetails = (conn: WanConnection): ConnectionDetails => {
        const params = conn.parameters || {};
        const connType = conn.type === "PPP" ? "WANPPPConnection" : "WANIPConnection";
        const basePath = conn.root || `InternetGatewayDevice.WANDevice.${conn.wanDeviceIndex}.WANConnectionDevice.${conn.wanConnectionDeviceIndex}.${connType}.${conn.connectionIndex}`;

        const getStr = (path: string) => {
            const value = params[`${basePath}.${path}`];
            return value === undefined || value === null ? "" : String(value);
        };
        const getBool = (path: string) => {
            const val = params[`${basePath}.${path}`];
            return val === "true" || val === true;
        };
        const getInt = (path: string) => {
            const val = params[`${basePath}.${path}`];
            if (val === undefined || val === null || val === "") return 0;
            const parsed = Number(val);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        const serviceType = conn.serviceType || getStr("X_ALU-COM_ServiceList") || getStr("X_D0542D_ServiceList") || "OTHER";
        const vidMatch = conn.name?.match(/VID[_\s]?(\d+)/i);
        const vlanId = conn.vlan ?? (vidMatch ? parseInt(vidMatch[1]) : null);
        const vlanPriority = getInt("X_CT-COM_802-1pMark") || null;
        const addressingType = conn.type === "PPP" ? "PPPoE" : getStr("AddressingType") || "DHCP";
        const macAddress = conn.macAddress && conn.macAddress !== "N/A"
            ? conn.macAddress
            : getStr("MACAddress") || "N/A";
        const mtuValue = conn.type === "PPP"
            ? getStr("CurrentMRUSize") || getStr("MaxMRUSize") || conn.mtu?.toString() || "N/A"
            : getStr("MaxMTUSize") || conn.mtu?.toString() || "N/A";
        const dnsServers = conn.dnsServers?.length
            ? conn.dnsServers
            : getStr("DNSServers").split(",").filter((s: string) => s.trim());

        const ipDetails = {
            externalIPAddress: conn.externalIPAddress || getStr("ExternalIPAddress") || "N/A",
            defaultGateway: conn.gateway || getStr("DefaultGateway") || "N/A",
            subnetMask: conn.subnetMask || getStr("SubnetMask") || "N/A",
            remoteIPAddress: conn.remoteIPAddress || getStr("RemoteIPAddress") || "N/A",
        };

        let pppoeDetails = undefined;
        if (conn.type === "PPP") {
            pppoeDetails = {
                username: conn.username || getStr("Username") || "N/A",
                password: getStr("Password") || "",
                acName: conn.pppoeAcName || getStr("PPPoEACName") || "N/A",
                remoteIP: conn.remoteIPAddress || getStr("RemoteIPAddress") || "N/A",
                sessionId: String(conn.pppoeSessionId ?? (getStr("PPPoESessionID") || "N/A")),
                lcpEcho: conn.lcpEchoInterval ?? getInt("PPPLCPEcho"),
                lcpEchoRetry: conn.lcpEchoRetryCount ?? getInt("PPPLCPEchoRetry"),
                authenticationProtocol: getStr("PPPAuthenticationProtocol") || conn.authenticationProtocol || "N/A",
                encryptionProtocol: conn.encryptionProtocol || getStr("PPPEncryptionProtocol") || "N/A",
                compressionProtocol: conn.compressionProtocol || getStr("PPPCompressionProtocol") || "N/A",
                serviceName: conn.pppoeServiceName || getStr("PPPoEServiceName") || "",
                currentMRU: conn.currentMRU ?? getInt("CurrentMRUSize"),
                maxMRU: conn.maximumMRU ?? getInt("MaxMRUSize"),
            };
        }

        const accessControls: AccessControls = {
            httpEnabled: !getBool("X_ALU-COM_WanAccessCfg.HttpDisabled"),
            httpTrusted: getBool("X_ALU-COM_WanAccessCfg.HttpTrusted"),
            httpsEnabled: !getBool("X_ALU-COM_WanAccessCfg.HttpsDisabled"),
            httpsTrusted: getBool("X_ALU-COM_WanAccessCfg.HttpsTrusted"),
            httpsDebugMode: getBool("X_ALU-COM_WanAccessCfg.HttpsDebugMode"),
            httpsDebugTimer: getInt("X_ALU-COM_WanAccessCfg.HttpsDebugTimer"),
            sshEnabled: !getBool("X_ALU-COM_WanAccessCfg.SshDisabled"),
            sshTrusted: getBool("X_ALU-COM_WanAccessCfg.SshTrusted"),
            telnetEnabled: !getBool("X_ALU-COM_WanAccessCfg.TelnetDisabled"),
            telnetTrusted: getBool("X_ALU-COM_WanAccessCfg.TelnetTrusted"),
            ftpEnabled: !getBool("X_ALU-COM_WanAccessCfg.FtpDisabled"),
            sftpEnabled: !getBool("X_ALU-COM_WanAccessCfg.SftpDisabled"),
            icmpEnabled: !getBool("X_ALU-COM_WanAccessCfg.IcmpEchoReqDisabled"),
            icmpTrusted: getBool("X_ALU-COM_WanAccessCfg.IcmpEchoReqTrusted"),
            tr69Enabled: !getBool("X_ALU-COM_WanAccessCfg.Tr69Disabled"),
            tr69Trusted: getBool("X_ALU-COM_WanAccessCfg.Tr69Trusted"),
            trustedNetworkEnable: getBool("X_ALU-COM_WanAccessCfg.TrustedNetworkEnable"),
        };

        const connectionStats = {
            uptime: conn.uptime || getInt("Uptime"),
            lastConnectionError: getStr("LastConnectionError") || "ERROR_NONE",
            connectionTrigger: getStr("ConnectionTrigger") || "AlwaysOn",
            natEnabled: getBool("NATEnabled"),
            dnsEnabled: getBool("DNSEnabled"),
            dnsOverrideAllowed: getBool("DNSOverrideAllowed"),
            macAddressOverride: getBool("MACAddressOverride"),
            rsipAvailable: getBool("RSIPAvailable"),
            wanFwMark: getInt("WanFwMark"),
            shapingRate: getInt("ShapingRate"),
            shapingBurstSize: getInt("ShapingBurstSize"),
            routeProtocolRx: getStr("RouteProtocolRx") || "Off",
            idleDisconnectTime: getInt("IdleDisconnectTime"),
            autoDisconnectTime: getInt("AutoDisconnectTime"),
            warnDisconnectDelay: getInt("WarnDisconnectDelay"),
        };

        const dhcpOptions = {
            dhcpServer: getStr("DHCPServerIPAddress") || "N/A",
            leaseTime: getInt("DHCPLeaseTime"),
            renewTime: getInt("DHCPRenewTime"),
            rebindTime: getInt("DHCPRebindTime"),
            dhcpOption125Enabled: getBool("DHCPClient.X_ALU_DHCPOption125.Enable"),
            dhcpOption125EnterpriseNumber: getInt("DHCPClient.X_ALU_DHCPOption125.EnterpriseNumber"),
            dhcpKeepAliveInterval: getInt("X_ALU-COM_DHCPKeepAliveInterval"),
            dhcpcWaitTime: getInt("X_ALU-COM_DhcpcWaitTime"),
        };

        const ipv6Details = {
            ipv6Address: conn.ipv6Address || getStr("X_ALU-COM_IPv6IPAddress") || getStr("X_CT-COM_IPv6IPAddress") || getStr("X_CMS_IPv6IPAddress") || getStr("IPv6Address") || "",
            ipv6AddressOrigin: getStr("X_ALU-COM_IPv6IPAddressOrigin") || getStr("X_CT-COM_IPv6IPAddressOrigin") || getStr("X_CMS_IPv6IPAddressOrigin") || getStr("IPv6AddressOrigin") || "AutoConfigured",
            ipv6Prefix: conn.ipv6Prefix || getStr("X_ALU-COM_IPv6Prefix") || getStr("X_CT-COM_IPv6Prefix") || getStr("X_CMS_IPv6Prefix") || getStr("IPv6Prefix") || "",
            ipv6PrefixOrigin: getStr("X_ALU-COM_IPv6PrefixOrigin") || getStr("X_CT-COM_IPv6PrefixOrigin") || getStr("X_CMS_IPv6PrefixOrigin") || getStr("IPv6PrefixOrigin") || "PrefixDelegation",
            ipv6PrefixDelegationEnabled: getBool("X_ALU-COM_IPv6PrefixDelegationEnabled") || getBool("X_CT-COM_IPv6PrefixDelegationEnabled") || getBool("X_CMS_IPv6PrefixDelegationEnabled") || getBool("IPv6PrefixDelegationEnabled"),
            ipv6DNSServers: (getStr("X_ALU-COM_IPv6DNSServers") || getStr("X_CT-COM_IPv6DNSServers") || getStr("X_CMS_IPv6DNSServers") || getStr("IPv6DNSServers") || "").split(",").filter((s: string) => s.trim()),
            ipv6DefaultGateway: conn.ipv6Gateway || getStr("X_ALU-COM_DefaultIPv6Gateway") || getStr("X_CT-COM_DefaultIPv6Gateway") || getStr("X_CMS_DefaultIPv6Gateway") || getStr("IPv6DefaultGateway") || "",
            ipv6ConnStatus: getStr("X_ALU-COM_IPv6ConnStatus") || getStr("X_CT-COM_IPv6ConnStatus") || getStr("X_CMS_IPv6ConnStatus") || getStr("IPv6ConnStatus") || "Unconfigured",
            ipv6NAEnabled: getBool("X_ALU_COM_IPv6NAEnabled") || getBool("X_CT-COM_IPv6NAEnabled") || getBool("X_CMS_IPv6NAEnabled") || getBool("IPv6NAEnabled"),
        };

        const portTriggering = {
            numberOfEntries: getInt("X_ALU-COM_PortTriggeringNumberOfEntries"),
        };

        const dmzConfig = {
            dmzEnabled: getBool("X_ASB_COM_DmzIpHostCfg.DmzEnabled") || getBool("X_ASB_COM_DmzPppHostCfg.DmzEnabled"),
            dmzHostDescription: getStr("X_ASB_COM_DmzIpHostCfg.DmzHostDescription") || getStr("X_ASB_COM_DmzPppHostCfg.DmzHostDescription"),
            internalClient: getStr("X_ASB_COM_DmzIpHostCfg.InternalClient") || getStr("X_ASB_COM_DmzPppHostCfg.InternalClient"),
            excludeIPAddress: getStr("X_ASB_COM_DmzIpHostCfg.ExcludeIPAddress") || getStr("X_ASB_COM_DmzPppHostCfg.ExcludeIPAddress"),
        };

        const vendorSpecific = {
            dscpMark: getInt("X_ALU-COM_DSCPMark"),
            vlanID: getInt("X_ALU-COM_VlanID"),
            multicastVlan: getInt("X_ALU-COM_MulticastVlan"),
            aftr: getStr("X_ALU-COM_Aftr"),
            aftrMode: getInt("X_ALU-COM_AftrMode"),
            dsliteEnable: getBool("X_ALU-COM_Dslite_Enable"),
            op50Enabled: getBool("X_ALU-COM_Op50Enabled"),
            op50ReqIp: getStr("X_ALU-COM_Op50ReqIp") || "0.0.0.0",
            isFixedWAN: getBool("X_ALU-COM_isFixedWAN"),
            lanInterface: getStr("X_ALU-COM_LanInterface"),
            connectionDelay: getInt("X_ALU-COM_ConnectionDelay"),
            ssdpEnabled: getBool("X_ALU-COM_SSDP_Enabled"),
            keepAliveTime: getInt("X_ALU-COM_KeepAliveTime"),
            keepAliveRetry: getInt("X_ALU-COM_KeepAliveRetry"),
            wanNameType: getStr("X_ALU-COM_WanNameType") || "Auto",
            dhcpOption125Enable: getBool("X_ALU_Op125Enabled"),
            enterpriseNumb: getInt("X_ALU_EnterpriseNumb"),
            option125Value: getStr("X_ALU_Option125Value"),
        };

        return {
            serviceType,
            vlanId,
            vlanPriority,
            addressingType,
            macAddress,
            mtuValue,
            dnsServers,
            name: conn.name || "",
            ipDetails,
            pppoeDetails,
            accessControls,
            connectionStats,
            dhcpOptions,
            ipv6Details,
            portTriggering,
            dmzConfig,
            vendorSpecific,
        };
    };

    const formatUptime = (seconds: number): string => {
        if (!seconds) return "N/A";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatBitRate = (bitsPerSecond: number): string => {
        if (!Number.isFinite(bitsPerSecond) || bitsPerSecond <= 0) return "0 bps";
        const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
        const index = Math.min(Math.floor(Math.log(bitsPerSecond) / Math.log(1000)), units.length - 1);
        return `${(bitsPerSecond / Math.pow(1000, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    };

    const formatNumber = (num: number): string => {
        return num.toLocaleString();
    };

    const getTrafficData = (stats: EthernetStats) => [
        { name: "Received", value: stats.bytesReceived, color: "#22c55e" },
        { name: "Sent", value: stats.bytesSent, color: "#3b82f6" },
    ];

    const getPacketData = (stats: EthernetStats) => [
        { name: "Received", value: stats.packetsReceived, color: "#22c55e" },
        { name: "Sent", value: stats.packetsSent, color: "#3b82f6" },
    ];

    const totalTraffic = Object.values(stats).reduce(
        (acc, curr) => ({
            bytesReceived: acc.bytesReceived + curr.bytesReceived,
            bytesSent: acc.bytesSent + curr.bytesSent,
            packetsReceived: acc.packetsReceived + curr.packetsReceived,
            packetsSent: acc.packetsSent + curr.packetsSent,
        }),
        { bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0 }
    );

    // Handle Add WAN
    const handleAddWan = async () => {
        setIsSubmitting(true);
        try {
            // Build payload according to the required structure
            const payload: any = {
                type: formData.type,
                vlanId: formData.vlanId,
                staticConfig: {
                    externalIp: formData.externalIp,
                    subnet: formData.subnet,
                    gateway: formData.gateway,
                    isDNS: formData.isDNS ? "true" : "false",
                    dnsServers: formData.dnsServers,
                    addressingType: formData.addressingType,
                    serviceType: formData.serviceType,
                    isNat: formData.isNat ? "true" : "false",
                },
            };

            // Include username/password only for PPP type
            if (formData.type === "ppp") {
                payload.staticConfig.username = formData.username;
                payload.staticConfig.password = formData.password;
            }

            const response = await apiRequest<{ success: boolean; message?: string }>(
                `/services/genieacs/devices/${deviceId}/create-wan-connection`,
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (response.success) {
                toast.success("WAN connection created successfully");
                setIsAddModalOpen(false);
                setFormData(defaultFormData);
                await fetchWanInfo({ refresh: true }); // refresh list
            } else {
                toast.error(response.message || "Failed to create WAN connection");
            }
        } catch (error) {
            console.error("Error creating WAN connection:", error);
            toast.error("Error creating WAN connection");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Delete WAN
    const handleDeleteWan = async (wanId: string) => {
        setIsDeleting(true);
        try {

            const payload: any = {
                wanId: wanId,
            }

            const response = await apiRequest<{ success: boolean; message?: string }>(
                `/services/genieacs/devices/${deviceId}/delete-wan-connection`,
                {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (response.success) {
                toast.success("WAN connection deleted");
                setDeleteWanId(null);
                await fetchWanInfo({ refresh: true }); // refresh list
            } else {
                toast.error(response.message || "Failed to delete WAN connection");
            }
        } catch (error) {
            console.error("Error deleting WAN connection:", error);
            toast.error("Error deleting WAN connection");
        } finally {
            setIsDeleting(false);
        }
    };

    const renderConnectionDetails = (conn: WanConnection) => {
        const key = wanConnectionKey(conn);
        const details = getConnectionDetails(conn);
        const ethernetStats = stats[key] || {
            bytesReceived: 0, bytesSent: 0, packetsReceived: 0, packetsSent: 0,
            broadcastReceived: 0, broadcastSent: 0, multicastReceived: 0, multicastSent: 0,
            unicastReceived: 0, unicastSent: 0, errorsReceived: 0, errorsSent: 0,
            discardReceived: 0, discardSent: 0, crcErrors: 0, overSizePackets: 0,
            underSizePackets: 0, fragmentsReceived: 0, fragmentsSent: 0,
            jabbersReceived: 0, jabbersSent: 0, downstreamBwUtilization: "0", upstreamBwUtilization: "0"
        };
        const liveRate = throughput[key];
        const isConnected = conn.connectionStatus?.toLowerCase() === "connected";

        const getServiceStyle = (serviceType: string) => {
            const type = (serviceType || "").toUpperCase();
            if (type === "INTERNET") {
                return {
                    icon: <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
                    bg: "bg-emerald-500/10 border-emerald-500/25",
                    text: "text-emerald-600 dark:text-emerald-400",
                    border: "border-emerald-500/20",
                    badge: "success" as const,
                    chartColor: "#10b981",
                    gradientId: "greenGrad",
                    iconSvgColor: "text-emerald-500/20"
                };
            }
            if (type === "TR069" || type === "ACS") {
                return {
                    icon: <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
                    bg: "bg-indigo-500/10 border-indigo-500/25",
                    text: "text-indigo-600 dark:text-indigo-400",
                    border: "border-indigo-500/20",
                    badge: "default" as const,
                    chartColor: "#6366f1",
                    gradientId: "indigoGrad",
                    iconSvgColor: "text-indigo-500/20"
                };
            }
            if (type === "VOIP" || type === "VOICE") {
                return {
                    icon: <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
                    bg: "bg-amber-500/10 border-amber-500/25",
                    text: "text-amber-600 dark:text-amber-400",
                    border: "border-amber-500/20",
                    badge: "warning" as const,
                    chartColor: "#f59e0b",
                    gradientId: "amberGrad",
                    iconSvgColor: "text-amber-500/20"
                };
            }
            // Fallback for IP / IPTV / OTHER
            return {
                icon: <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
                bg: "bg-blue-500/10 border-blue-500/25",
                text: "text-blue-600 dark:text-blue-400",
                border: "border-blue-500/20",
                badge: "secondary" as const,
                chartColor: "#3b82f6",
                gradientId: "blueGrad",
                iconSvgColor: "text-blue-500/20"
            };
        };

        const style = getServiceStyle(details.serviceType);

        return (
            <div className="space-y-6">
                {/* Breadcrumbs and Top Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <span>Device Details</span>
                        <span>&gt;</span>
                        <span>Network</span>
                        <span>&gt;</span>
                        <span>WAN Connections</span>
                        <span>&gt;</span>
                        <span className="text-foreground font-bold">{details.name || "Unnamed WAN"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedConnection(null)} className="rounded-xl h-9 text-xs font-bold border-indigo-500/20 hover:bg-indigo-500/10">
                            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Device
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-xl h-9 text-xs font-bold border-indigo-500/20 hover:bg-indigo-500/10">
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                        <Button onClick={() => openEditModal(conn)} size="sm" className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700">
                            <Settings className="h-3.5 w-3.5 mr-1 text-white" /> Edit WAN
                        </Button>
                    </div>
                </div>

                {/* Top Banner Card */}
                <div className="rounded-2xl border bg-card p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                        <div className="flex flex-wrap items-center gap-6 flex-1">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                {style.icon}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{details.name || "Unnamed WAN"}</span>
                                    <Badge variant={isConnected ? "success" : "destructive"} className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase">
                                        {conn.connectionStatus || "N/A"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                    <span>{conn.type}</span>
                                    <span>•</span>
                                    <span>{conn.connectionType || "N/A"}</span>
                                    <span>•</span>
                                    <span>{conn.connectionType}</span>
                                    <span>•</span>
                                    <span>VLAN {details.vlanId ?? "N/A"}</span>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-border hidden md:block" />

                            <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">IP ({conn.connectionType})</div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Type</span>
                            </div>

                            <div className="h-8 w-px bg-border hidden md:block" />

                            <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{conn.uptime ? formatUptime(conn.uptime) : "N/A"}</div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Uptime</span>
                            </div>

                            <div className="h-8 w-px bg-border hidden md:block" />

                            <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Latest ACS cache</div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Last Sync</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Tabs - Static visual matching the image */}
                <div className="border-b">
                    <div className="flex gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {[
                            { id: "overview", label: "Overview" },
                            { id: "ip", label: "IP Configuration" },
                            { id: "ppp", label: "PPP / BRAS Details" },
                            { id: "ipv6", label: "IPv6 Configuration" },
                            { id: "acl", label: "Access Control List (ACL)" },
                            { id: "stats", label: "Connection Statistics" }
                        ].map((tab) => (
                            <span
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`pb-2 cursor-pointer transition-colors duration-150 ${activeSubTab === tab.id ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'hover:text-foreground'}`}
                            >
                                {tab.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 2-Column Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Span 2) */}
                    <div className="lg:col-span-2 space-y-6">
                        {(activeSubTab === "overview" || activeSubTab === "ip") && (
                            <>
                                {/* General Information Card */}
                                <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4 flex-1">
                                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">General Information</h3>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-semibold">
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">WAN Name</span>
                                                    <span className="text-slate-800 dark:text-slate-200">{details.name || "Unnamed WAN"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Status</span>
                                                    <Badge variant={isConnected ? "success" : "destructive"} className="text-[9px] font-bold uppercase px-2 rounded-full mt-0.5">
                                                        {conn.connectionStatus || "N/A"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Service Type</span>
                                                    <span className="text-slate-800 dark:text-slate-200">{details.serviceType}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Connection Type</span>
                                                    <span className="text-slate-800 dark:text-slate-200">IP ({conn.connectionType})</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">VLAN ID</span>
                                                    <span className="text-slate-800 dark:text-slate-200">{details.vlanId ?? "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Addressing Mode</span>
                                                    <span className="text-slate-800 dark:text-slate-200">{conn.addressingType || details.addressingType}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Interface</span>
                                                    <span className="break-all text-slate-800 dark:text-slate-200 font-mono">{conn.transportType || conn.lowerLayers || conn.root || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">MAC Address</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-mono">{details.macAddress}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Profile Path</span>
                                                    <span className="break-all text-[10px] text-slate-800 dark:text-slate-200 font-mono">{conn.root || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block opacity-80 pl-6 self-center">
                                            <svg className={`w-24 h-24 ${style.iconSvgColor}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="15" y="45" width="70" height="25" rx="5" />
                                                <circle cx="25" cy="57" r="2" fill="currentColor" />
                                                <circle cx="35" cy="57" r="2" fill="currentColor" />
                                                <circle cx="45" cy="57" r="2" fill="currentColor" />
                                                <line x1="20" y1="45" x2="30" y2="25" strokeLinecap="round" />
                                                <line x1="80" y1="45" x2="70" y2="25" strokeLinecap="round" />
                                                <circle cx="50" cy="57" r="3" />
                                                <circle cx="70" cy="57" r="2" fill="currentColor" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* IP Configuration Card */}
                                <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">IP Configuration</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-semibold">
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">IP Address</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono text-sm">{details.ipDetails.externalIPAddress}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Subnet Mask</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono text-sm">{details.ipDetails.subnetMask}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Gateway</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono text-sm">{details.ipDetails.defaultGateway}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Primary DNS</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono">{details.dnsServers[0] || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Secondary DNS</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono">{details.dnsServers[1] || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">MTU</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono">{details.mtuValue}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">MAC Address</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono">{details.macAddress}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Remote IP</span>
                                            <span className="text-slate-850 dark:text-slate-150 font-mono">{details.ipDetails.remoteIPAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {(activeSubTab === "overview" || activeSubTab === "ppp") && conn.type === "PPP" && details.pppoeDetails && (
                            /* PPP / BRAS Details Card */
                            <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">PPP / BRAS Details</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-semibold">
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Username</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">{details.pppoeDetails.username}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Password</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">••••••••</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">BRAS Name (AC)</span>
                                        <span className="text-slate-855 dark:text-slate-145">{details.pppoeDetails.acName || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Remote IP</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">{details.pppoeDetails.remoteIP || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Session ID</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">{details.pppoeDetails.sessionId}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Service Name</span>
                                        <span className="text-slate-850 dark:text-slate-150">{details.pppoeDetails.serviceName || "INTERNET"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">LCP Echo</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">{details.pppoeDetails.lcpEcho} / {details.pppoeDetails.lcpEchoRetry}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Authentication</span>
                                        <span className="text-slate-850 dark:text-slate-150">{details.pppoeDetails.authenticationProtocol || "PAP / None"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Compression</span>
                                        <span className="text-slate-850 dark:text-slate-150">{details.pppoeDetails.compressionProtocol || "None"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">MRU (Current/Max)</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">{details.pppoeDetails.currentMRU || "N/A"} / {details.pppoeDetails.maxMRU || "N/A"}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeSubTab === "ipv6") && (
                            /* IPv6 Configuration Card */
                            <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">IPv6 Configuration</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-semibold">
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">IPv6 Addressing Type</span>
                                        <span className="text-slate-800 dark:text-slate-200">SLAAC / DHCPv6</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">IPv6 Connection Status</span>
                                        <span className="text-slate-850 dark:text-slate-150 font-mono">Disabled</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">IPv6 Address</span>
                                        <span className="text-slate-800 dark:text-slate-200 font-mono">::</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">IPv6 Gateway</span>
                                        <span className="text-slate-800 dark:text-slate-200 font-mono">::</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(activeSubTab === "overview" || activeSubTab === "acl") && (
                            /* Access Control List (ACL) Card */
                            <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">Access Control List (ACL)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                                    {[
                                        { label: "Web Access (HTTP)", icon: <Lock className="h-4 w-4 text-emerald-500" /> },
                                        { label: "Secure Web (HTTPS)", icon: <Lock className="h-4 w-4 text-emerald-500" /> },
                                        { label: "Remote Access (SSH)", icon: <Lock className="h-4 w-4 text-emerald-500" /> },
                                        { label: "Remote Access (Telnet)", icon: <Lock className="h-4 w-4 text-emerald-500" /> },
                                        { label: "File Transfer (FTP)", icon: <Lock className="h-4 w-4 text-emerald-500" /> },
                                        { label: "File Transfer (SFTP)", icon: <Lock className="h-4 w-4 text-emerald-500" /> }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl border bg-secondary/10">
                                            <div className="flex items-center gap-2.5">
                                                {item.icon}
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.label}</div>
                                                    <div className="text-[10px] text-muted-foreground">Trusted Mode: No</div>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase rounded-full">
                                                Enabled
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(activeSubTab === "overview") && (
                            /* Network Services */
                            <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">Network Services</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                                    {[
                                        { label: "ICMP (Ping)", icon: <Activity className="h-4 w-4 text-emerald-500" /> },
                                        { label: "TR-069 (ACS)", icon: <Settings className="h-4 w-4 text-emerald-500" /> }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl border bg-secondary/10">
                                            <div className="flex items-center gap-2.5">
                                                {item.icon}
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.label}</div>
                                                    <div className="text-[10px] text-muted-foreground">Trusted Mode: No</div>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase rounded-full">
                                                Enabled
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-2 text-center">
                                    <Button variant="ghost" size="sm" className="text-indigo-500 text-xs font-bold hover:bg-indigo-500/10 rounded-xl">
                                        Show Advanced Information &or;
                                    </Button>
                                </div>
                            </div>
                        )}

                        {(activeSubTab === "stats") && (
                            /* Connection Statistics Card */
                            <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider mb-2">Connection Statistics</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-xs font-semibold">
                                    <div className="rounded-xl border bg-secondary/10 p-3">
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Bytes Sent</span>
                                        <span className="block text-slate-800 dark:text-slate-200">{ethernetStats.bytesSent.toLocaleString()} B</span>
                                        <span className="mt-1 block text-sm font-extrabold text-indigo-600">{formatBytes(ethernetStats.bytesSent)}</span>
                                        <span className="mt-1 block text-[10px] text-muted-foreground">Current upload: {liveRate ? formatBitRate(liveRate.txBps) : "Calculating..."}</span>
                                    </div>
                                    <div className="rounded-xl border bg-secondary/10 p-3">
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Bytes Received</span>
                                        <span className="block text-slate-800 dark:text-slate-200">{ethernetStats.bytesReceived.toLocaleString()} B</span>
                                        <span className="mt-1 block text-sm font-extrabold text-emerald-600">{formatBytes(ethernetStats.bytesReceived)}</span>
                                        <span className="mt-1 block text-[10px] text-muted-foreground">Current download: {liveRate ? formatBitRate(liveRate.rxBps) : "Calculating..."}</span>
                                    </div>
                                    <div className="rounded-xl border bg-secondary/10 p-3">
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Packets Sent</span>
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{ethernetStats.packetsSent.toLocaleString()}</span>
                                    </div>
                                    <div className="rounded-xl border bg-secondary/10 p-3">
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase block mb-0.5">Packets Received</span>
                                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{ethernetStats.packetsReceived.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                        <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Human-readable WAN usage</div>
                                        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <span className="block text-[9px] uppercase text-muted-foreground">Uploaded</span>
                                                <strong className="text-sm text-indigo-600">{formatBytes(ethernetStats.bytesSent)}</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase text-muted-foreground">Downloaded</span>
                                                <strong className="text-sm text-emerald-600">{formatBytes(ethernetStats.bytesReceived)}</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase text-muted-foreground">Combined</span>
                                                <strong className="text-sm text-slate-800 dark:text-slate-100">{formatBytes(ethernetStats.bytesSent + ethernetStats.bytesReceived)}</strong>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[9px] text-muted-foreground">Cumulative traffic reported by this WAN profile since its counters were last reset.</p>
                                    </div>
                                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                                        <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Live throughput</div>
                                        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <span className="block text-[9px] uppercase text-muted-foreground">Upload</span>
                                                <strong className="text-sm text-indigo-600">{liveRate ? formatBitRate(liveRate.txBps) : "Calculating..."}</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase text-muted-foreground">Download</span>
                                                <strong className="text-sm text-emerald-600">{liveRate ? formatBitRate(liveRate.rxBps) : "Calculating..."}</strong>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase text-muted-foreground">Combined</span>
                                                <strong className="text-sm text-slate-800 dark:text-slate-100">{liveRate ? formatBitRate(liveRate.txBps + liveRate.rxBps) : "Calculating..."}</strong>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[9px] text-muted-foreground">Calculated from counter changes between the latest two ACS snapshots.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (Span 1) */}
                    <div className="space-y-6">
                        {/* Connection Health Card */}
                        <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Connection Health</h3>
                                <Select defaultValue="24h">
                                    <SelectTrigger className="h-7 text-[10px] w-24 rounded-lg bg-secondary/40">
                                        <SelectValue placeholder="Period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                                        <SelectItem value="7d">Last 7 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Small Area Chart Line representation */}
                            <div className="h-32 w-full relative">
                                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <path d="M 0 30 Q 10 20 20 25 T 40 15 T 60 22 T 80 12 T 100 20 L 100 40 L 0 40 Z" fill={`url(#${style.gradientId})`} />
                                    <path d="M 0 30 Q 10 20 20 25 T 40 15 T 60 22 T 80 12 T 100 20" stroke={style.chartColor} strokeWidth="1" fill="none" />
                                    <defs>
                                        <linearGradient id={style.gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={style.chartColor} stopOpacity="0.25" />
                                            <stop offset="100%" stopColor={style.chartColor} stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center pt-2">
                                <div className="p-2 rounded-xl bg-secondary/20">
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Availability</div>
                                    <div className="text-[11px] font-extrabold text-emerald-600 mt-1">99.56%</div>
                                </div>
                                <div className="p-2 rounded-xl bg-secondary/20">
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Packet Loss</div>
                                    <div className="text-[11px] font-extrabold text-amber-500 mt-1">0.12%</div>
                                </div>
                                <div className="p-2 rounded-xl bg-secondary/20">
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Latency</div>
                                    <div className="text-[11px] font-extrabold text-indigo-500 mt-1">18 ms</div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-3.5">
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Summary</h3>
                            <div className="space-y-2.5 text-xs font-semibold">
                                {[
                                    { label: "Created On", val: "N/A" },
                                    { label: "Last Updated", val: "N/A" },
                                    { label: "Last Error", val: "None" },
                                    { label: "Sync Status", val: <span className="text-emerald-500 font-extrabold">In Sync</span> },
                                    { label: "Sync Time", val: "Latest ACS cache" }
                                ].map((row, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0">
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase">{row.label}</span>
                                        <span className="text-slate-800 dark:text-slate-200">{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-card p-6 border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 space-y-4">
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block uppercase tracking-wider">Quick Actions</h3>
                            <div className="space-y-2">
                                {[
                                    {
                                        label: "Ping Gateway",
                                        onClick: () => void runWanDiagnostic(conn, "ping", details.ipDetails.defaultGateway, "Gateway ping"),
                                        color: "text-emerald-600 hover:bg-emerald-500/10"
                                    },
                                    {
                                        label: "Traceroute Gateway",
                                        onClick: () => void runWanDiagnostic(conn, "traceroute", details.ipDetails.defaultGateway, "Gateway traceroute"),
                                        color: "text-indigo-600 hover:bg-indigo-500/10"
                                    },
                                    {
                                        label: "Ping Primary DNS",
                                        onClick: () => void runWanDiagnostic(conn, "ping", details.dnsServers[0] || "", "DNS server ping"),
                                        color: "text-blue-600 hover:bg-blue-500/10"
                                    },
                                    {
                                        label: "Copy WAN IP",
                                        onClick: () => {
                                            void navigator.clipboard.writeText(details.ipDetails.externalIPAddress);
                                            toast.success("WAN IP copied");
                                        },
                                        color: "text-slate-850 dark:text-slate-150"
                                    },
                                    {
                                        label: "Copy WAN MAC",
                                        onClick: () => {
                                            void navigator.clipboard.writeText(details.macAddress);
                                            toast.success("WAN MAC copied");
                                        },
                                        color: "text-slate-850 dark:text-slate-150"
                                    },
                                    { label: "Edit WAN Connection", onClick: () => openEditModal(conn), color: "text-slate-850 dark:text-slate-150" },
                                    { label: "Delete WAN Connection", onClick: () => setDeleteWanId(conn.wanConnectionDeviceIndex), color: "text-red-500 hover:bg-red-500/10" },
                                    {
                                        label: "Force Resync",
                                        onClick: () => {
                                            toast.promise(
                                                handleRefresh(),
                                                {
                                                    loading: "Forcing WAN synchronization over CWMP...",
                                                    success: "WAN configuration synchronized!",
                                                    error: "Sync failed."
                                                }
                                            );
                                        },
                                        color: "text-slate-850 dark:text-slate-150"
                                    }
                                ].map((act, idx) => (
                                    <button
                                        key={idx}
                                        onClick={act.onClick}
                                        disabled={Boolean(quickActionRunning) && act.label !== "Force Resync"}
                                        className={`w-full flex justify-between items-center p-3 rounded-xl border text-xs font-bold text-left hover:bg-secondary/35 transition-colors ${act.color}`}
                                    >
                                        <span>{quickActionRunning && act.label.toLowerCase().includes(quickActionRunning.toLowerCase().split(" ")[0]) ? `${act.label}…` : act.label}</span>
                                        <span>→</span>
                                    </button>
                                ))}
                            </div>
                            {quickActionResult && (
                                <div className={`rounded-xl border p-3 text-[10px] ${
                                    quickActionResult.status === "completed"
                                        ? "border-emerald-500/25 bg-emerald-500/5"
                                        : quickActionResult.status === "failed"
                                            ? "border-rose-500/25 bg-rose-500/5"
                                            : "border-indigo-500/25 bg-indigo-500/5"
                                }`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold uppercase">{quickActionResult.diagnostic} · {quickActionResult.target}</span>
                                        <Badge variant="outline" className="text-[8px] uppercase">{quickActionResult.diagnosticsState || quickActionResult.status}</Badge>
                                    </div>
                                    <HumanReadableWanDiagnostic result={quickActionResult} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (selectedConnection) {
        const selectedConnObj = wanConnections.find(
            (connection) => wanConnectionKey(connection) === selectedConnection
        );
        if (selectedConnObj) {
            return renderConnectionDetails(selectedConnObj);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-14 animate-pulse rounded-2xl border bg-secondary/20" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-56 animate-pulse rounded-2xl border bg-secondary/20" />
                    <div className="h-56 animate-pulse rounded-2xl border bg-secondary/20" />
                </div>
            </div>
        );
    }

    if (wanConnections.length === 0) {
        return (
            <CardContainer title="WAN Connections" gradientColor="#6366f1">
                <div className="text-center py-12 text-muted-foreground">
                    {loadError || "No WAN connections found."}
                </div>
                <div className="flex justify-center mt-4">
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add WAN Connection
                    </Button>
                </div>
            </CardContainer>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Summary Stats and Add button */}
            <div className="flex flex-row justify-between items-center w-full mb-2">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">WAN Connections</h2>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        Total: {wanConnections.length} • Active: {wanConnections.filter(c => c.connectionStatus?.toLowerCase() === "connected").length} • Inactive: {wanConnections.filter(c => c.connectionStatus?.toLowerCase() !== "connected").length}
                    </p>
                    {snapshotMeta?.snapshotAt && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            {snapshotMeta.source === "database" ? "Saved database snapshot" : "Latest ACS snapshot"}
                            {" • "}
                            {new Date(snapshotMeta.snapshotAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="font-bold rounded-xl h-9 text-xs px-4"
                    >
                        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRefreshing ? "Pulling from ACS" : "Refresh from ACS"}
                    </Button>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-9 text-xs px-4">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add WAN
                    </Button>
                </div>
            </div>

            {/* Connection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {wanConnections.map((conn) => {
                    const key = wanConnectionKey(conn);
                    const details = getConnectionDetails(conn);
                    const isConnected = conn.connectionStatus?.toLowerCase() === "connected";

                    return (
                        <div
                            key={key}
                            className={`relative rounded-2xl border bg-card/45 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer overflow-hidden ${
                                isConnected ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"
                            }`}
                            onClick={() => setSelectedConnection(key)}
                        >
                            <div className="space-y-4">
                                {/* Top Row: Icon, Title, Badges, Actions */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"
                                        }`}>
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{details.name || details.serviceType}</span>
                                                <Badge variant={isConnected ? "success" : "secondary"} className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase">
                                                    {conn.connectionStatus || "Inactive"}
                                                </Badge>
                                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase">
                                                    {conn.type} ({conn.connectionType})
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditModal(conn)}
                                            className="h-8 w-8 p-0 border border-slate-200/50 hover:bg-slate-100 dark:border-slate-700/50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
                                            title="Edit Connection"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeleteWanId(conn.wanConnectionDeviceIndex)}
                                            className="h-8 w-8 p-0 border border-slate-200/50 hover:bg-slate-100 dark:border-slate-700/50 dark:hover:bg-slate-800 rounded-lg text-red-500 hover:text-red-600"
                                            title="Delete Connection"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Fields Grid */}
                                <div className="grid grid-cols-2 gap-4 border-t border-b border-border/50 py-3 mt-2 text-xs font-semibold sm:grid-cols-3 xl:grid-cols-5">
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">Type</span>
                                        <span className="text-slate-800 dark:text-slate-200">{conn.type} ({conn.connectionType})</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">Service</span>
                                        <span className="text-slate-800 dark:text-slate-200">{details.serviceType || "TR069"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">VLAN ID</span>
                                        <span className="text-slate-800 dark:text-slate-200">{details.vlanId ?? "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">MAC Address</span>
                                        <span className="break-all font-mono text-slate-800 dark:text-slate-200">{details.macAddress}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">Uptime</span>
                                        <span className="text-slate-800 dark:text-slate-200">{isConnected && conn.uptime !== undefined ? formatUptime(conn.uptime) : "N/A"}</span>
                                    </div>
                                </div>

                                {/* Footer Row */}
                                <div className="grid grid-cols-2 gap-4 pt-1 text-xs font-semibold sm:grid-cols-3 xl:grid-cols-5">
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">IP Address</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">{conn.externalIPAddress || conn.ipAddress || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">Gateway</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">{conn.gateway || conn.remoteIPAddress || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">DNS</span>
                                        <span className="break-words font-mono text-slate-800 dark:text-slate-200">{conn.dnsServers?.length ? conn.dnsServers.join(", ") : "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">MTU / MRU</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">{conn.mtu || conn.currentMRU || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-[9px] font-bold uppercase block mb-0.5">Status</span>
                                        <span className={`font-extrabold ${isConnected ? "text-emerald-500" : "text-red-500"}`}>
                                            {isConnected ? "Connected" : "No Link"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View All WAN Connections Link */}
            <div className="mt-6 flex justify-center mb-6">
                <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 text-xs font-bold gap-1 hover:bg-indigo-500/10 rounded-xl">
                    View All WAN Connections &rarr;
                </Button>
            </div>

            {/* Add WAN Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add WAN Connection</DialogTitle>
                        <DialogDescription>
                            Configure a new WAN connection for device {deviceId}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: "ppp" | "ip") => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ip">IP (DHCP/Static)</SelectItem>
                                    <SelectItem value="ppp">PPP (PPPoE)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* VLAN ID */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vlanId" className="text-right">
                                VLAN ID
                            </Label>
                            <Input
                                id="vlanId"
                                value={formData.vlanId}
                                onChange={(e) => setFormData({ ...formData, vlanId: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g., 528"
                            />
                        </div>

                        {/* Service Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serviceType" className="text-right">
                                Service Type
                            </Label>
                            <Select
                                value={formData.serviceType}
                                onValueChange={(value: "INTERNET" | "VOIP" | "TR069" | "OTHER") =>
                                    setFormData({ ...formData, serviceType: value })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNET">Internet</SelectItem>
                                    <SelectItem value="VOIP">VoIP</SelectItem>
                                    <SelectItem value="TR069">TR069</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* NAT Enabled (only for Internet) */}
                        {formData.serviceType === "INTERNET" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isNat" className="text-right">
                                    NAT
                                </Label>
                                <div className="flex items-center space-x-2 col-span-3">
                                    <Checkbox
                                        id="isNat"
                                        checked={formData.isNat}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isNat: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="isNat" className="text-sm font-normal">
                                        Enable NAT (default)
                                    </Label>
                                </div>
                            </div>
                        )}

                        {/* PPP specific fields */}
                        {formData.type === "ppp" && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div />
                                    <Button type="button" variant="outline" className="col-span-3" onClick={() => loadRadiusCredentials("add")} disabled={isLoadingRadiusCredentials}>
                                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingRadiusCredentials ? "animate-spin" : ""}`} />
                                        Use Customer RADIUS Credentials
                                    </Button>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="username" className="text-right">
                                        Username
                                    </Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="col-span-3"
                                        placeholder="PPPoE username"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="password" className="text-right">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="col-span-3"
                                        placeholder="PPPoE password"
                                    />
                                </div>
                            </>
                        )}

                        {/* IP specific fields */}
                        {formData.type === "ip" && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="addressingType" className="text-right">
                                        Addressing
                                    </Label>
                                    <Select
                                        value={formData.addressingType}
                                        onValueChange={(value: "DHCP" | "Static") =>
                                            setFormData({ ...formData, addressingType: value })
                                        }
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select addressing type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DHCP">DHCP</SelectItem>
                                            <SelectItem value="Static">Static</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.addressingType === "Static" && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="externalIp" className="text-right">
                                                IP Address
                                            </Label>
                                            <Input
                                                id="externalIp"
                                                value={formData.externalIp}
                                                onChange={(e) => setFormData({ ...formData, externalIp: e.target.value })}
                                                className="col-span-3"
                                                placeholder="e.g., 10.7.29.1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="subnet" className="text-right">
                                                Subnet Mask
                                            </Label>
                                            <Input
                                                id="subnet"
                                                value={formData.subnet}
                                                onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                                                className="col-span-3"
                                                placeholder="e.g., 255.255.255.0"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="gateway" className="text-right">
                                                Gateway
                                            </Label>
                                            <Input
                                                id="gateway"
                                                value={formData.gateway}
                                                onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                                                className="col-span-3"
                                                placeholder="e.g., 10.7.29.1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="isDNS" className="text-right">
                                                Use DNS
                                            </Label>
                                            <div className="flex items-center space-x-2 col-span-3">
                                                <Checkbox
                                                    id="isDNS"
                                                    checked={formData.isDNS}
                                                    onCheckedChange={(checked) =>
                                                        setFormData({ ...formData, isDNS: checked as boolean })
                                                    }
                                                />
                                                <Label htmlFor="isDNS" className="text-sm font-normal">
                                                    Enable custom DNS servers
                                                </Label>
                                            </div>
                                        </div>
                                        {formData.isDNS && (
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="dnsServers" className="text-right">
                                                    DNS Servers
                                                </Label>
                                                <Input
                                                    id="dnsServers"
                                                    value={formData.dnsServers}
                                                    onChange={(e) => setFormData({ ...formData, dnsServers: e.target.value })}
                                                    className="col-span-3"
                                                    placeholder="Comma separated, e.g., 9.9.9.9,1.1.1.1"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddWan} disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Connection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit WAN Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit WAN Connection</DialogTitle>
                        <DialogDescription>
                            Modify parameters for WAN connection (Instance #{selectedEditConnection?.wanConnectionDeviceIndex})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Selected Connection Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <Input
                                value={selectedEditConnection?.type === "PPP" ? "PPP (PPPoE)" : "IP (IPoE)"}
                                className="col-span-3 bg-muted"
                                readOnly
                            />
                        </div>

                        {/* VLAN ID */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editVlanId" className="text-right">VLAN ID</Label>
                            <Input
                                id="editVlanId"
                                value={editFormData.vlanId}
                                onChange={(e) => setEditFormData({ ...editFormData, vlanId: e.target.value })}
                                className="col-span-3"
                                placeholder="e.g., 528"
                            />
                        </div>

                        {/* Service Type */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editServiceType" className="text-right">Service Type</Label>
                            <Select
                                value={editFormData.serviceType}
                                onValueChange={(value) => setEditFormData({ ...editFormData, serviceType: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INTERNET">INTERNET</SelectItem>
                                    <SelectItem value="VOIP">VOIP</SelectItem>
                                    <SelectItem value="TR069">TR069</SelectItem>
                                    <SelectItem value="OTHER">OTHER</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* PPPoE Specific Fields */}
                        {selectedEditConnection?.type === "PPP" && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <div />
                                    <Button type="button" variant="outline" className="col-span-3" onClick={() => loadRadiusCredentials("edit")} disabled={isLoadingRadiusCredentials}>
                                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingRadiusCredentials ? "animate-spin" : ""}`} />
                                        Use Customer RADIUS Credentials
                                    </Button>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editUsername" className="text-right">Username</Label>
                                    <Input
                                        id="editUsername"
                                        value={editFormData.username}
                                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editPassword" className="text-right">Password</Label>
                                    <Input
                                        id="editPassword"
                                        type="text"
                                        value={editFormData.password}
                                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editIsNatPPP" className="text-right">NAT Enabled</Label>
                                    <div className="col-span-3 flex items-center">
                                        <Checkbox
                                            id="editIsNatPPP"
                                            checked={editFormData.isNat}
                                            onCheckedChange={(checked) => setEditFormData({ ...editFormData, isNat: !!checked })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* IPoE Specific Fields */}
                        {selectedEditConnection?.type === "IP" && (
                            <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editAddressingType" className="text-right">Addressing Type</Label>
                                    <Select
                                        value={editFormData.addressingType}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, addressingType: value })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select addressing type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DHCP">DHCP</SelectItem>
                                            <SelectItem value="Static">Static</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editIsNatIP" className="text-right">NAT Enabled</Label>
                                    <div className="col-span-3 flex items-center">
                                        <Checkbox
                                            id="editIsNatIP"
                                            checked={editFormData.isNat}
                                            onCheckedChange={(checked) => setEditFormData({ ...editFormData, isNat: !!checked })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editIsDNS" className="text-right">DNS Enabled</Label>
                                    <div className="col-span-3 flex items-center">
                                        <Checkbox
                                            id="editIsDNS"
                                            checked={editFormData.isDNS}
                                            onCheckedChange={(checked) => setEditFormData({ ...editFormData, isDNS: !!checked })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="editDnsServers" className="text-right">DNS Servers</Label>
                                    <Input
                                        id="editDnsServers"
                                        value={editFormData.dnsServers}
                                        onChange={(e) => setEditFormData({ ...editFormData, dnsServers: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Comma separated, e.g., 9.9.9.9,1.1.1.1"
                                    />
                                </div>

                                {editFormData.addressingType === "Static" && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="editExternalIp" className="text-right">IP Address</Label>
                                            <Input
                                                id="editExternalIp"
                                                value={editFormData.externalIp}
                                                onChange={(e) => setEditFormData({ ...editFormData, externalIp: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="editSubnet" className="text-right">Subnet Mask</Label>
                                            <Input
                                                id="editSubnet"
                                                value={editFormData.subnet}
                                                onChange={(e) => setEditFormData({ ...editFormData, subnet: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="editGateway" className="text-right">Gateway</Label>
                                            <Input
                                                id="editGateway"
                                                value={editFormData.gateway}
                                                onChange={(e) => setEditFormData({ ...editFormData, gateway: e.target.value })}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateConnection} disabled={isSubmittingEdit}>
                            {isSubmittingEdit ? "Updating..." : "Update Connection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteWanId} onOpenChange={(open) => !open && setDeleteWanId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete WAN Connection</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this WAN connection? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteWanId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteWanId && handleDeleteWan(deleteWanId)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
