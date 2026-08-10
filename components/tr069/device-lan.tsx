"use client";

import { useCallback, useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import {
    Network,
    Server,
    Clock,
    Copy,
    Activity,
    ArrowDown,
    ArrowUp,
    Info,
    AlertCircle,
    RefreshCw,
    Save,
    ShieldAlert
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface LanInterfaceStats {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    errorsReceived: number;
    errorsSent: number;
    discardPacketsReceived: number;
    discardPacketsSent: number;
    multicastPacketsReceived: number;
    multicastPacketsSent: number;
    broadcastPacketsReceived: number;
    broadcastPacketsSent: number;
    unicastPacketsReceived: number;
    unicastPacketsSent: number;
    unknownProtoPacketsReceived: number;
}

interface LanInterface {
    index: number;
    name: string;
    enable: boolean;
    macAddress: string;
    maxBitRate: string;
    duplexMode: string;
    status: string;
    loopStatus: string | null;
    detectionStatus: string | null;
    stats: LanInterfaceStats;
    parameters: Record<string, unknown>;
}

interface TR069DeviceLanInfoProps {
    deviceId: string;
}

interface DeviceDetails {
    id: string;
    serialNumber: string;
    productClass: string;
    manufacturer: string;
    oui: string;
    status: string;
    lastContact: string;
    uptime: string;
    lanInterfaces: LanInterface[];
    lanConfiguration?: LanConfiguration;
}

interface LanConfiguration {
    supported: boolean;
    dataModel: "TR-098" | "TR-181" | "unknown";
    root?: string;
    message?: string;
    pending?: boolean;
    pendingTaskId?: string;
    parameters: LanForm;
}

interface LanForm {
    lanIpAddress: string;
    subnetMask: string;
    dhcpEnabled: boolean | null;
    minAddress: string;
    maxAddress: string;
    leaseTime: number;
    gateway: string;
    dnsServers: string;
    domainName: string;
}

const emptyLanForm: LanForm = {
    lanIpAddress: "",
    subnetMask: "255.255.255.0",
    dhcpEnabled: false,
    minAddress: "",
    maxAddress: "",
    leaseTime: 86400,
    gateway: "",
    dnsServers: "",
    domainName: ""
};

// Helper function to format bytes
const formatBytes = (bytes: number | undefined | null, decimals = 2) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i < 0 || !isFinite(i)) return '0 Bytes';
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper function to get status color
const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'up':
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        case 'down':
        case 'nolink':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'disabled':
            return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        default:
            return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
};

export function TR069DeviceLanInfo({ deviceId }: TR069DeviceLanInfoProps) {
    const [deviceDetails, setDeviceDetails] = useState<DeviceDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lanForm, setLanForm] = useState<LanForm>(emptyLanForm);

    const fetchDeviceDetails = useCallback(async (refresh = false) => {
        try {
            if (refresh) setIsRefreshing(true);
            else setIsLoading(true);
            const response = await apiRequest<{ success: boolean; data: DeviceDetails }>(
                `/services/genieacs/devices/${encodeURIComponent(deviceId)}/laninfo${refresh ? "?refresh=true" : ""}`,
                { suppressToast: true }
            );

            if (response.success && response.data) {
                setDeviceDetails(response.data);
                if (response.data.lanConfiguration?.parameters) {
                    setLanForm({
                        ...emptyLanForm,
                        ...response.data.lanConfiguration.parameters
                    });
                }
                setError(null);
            } else {
                setDeviceDetails(null);
                setError('No LAN telemetry is available for this device.');
            }
        } catch (err) {
            console.error("Error fetching device details:", err);
            setError(err instanceof Error ? err.message : "Could not load LAN telemetry");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [deviceId]);

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchDeviceDetails(), 0);
        return () => window.clearTimeout(timer);
    }, [fetchDeviceDetails]);

    const updateLanField = <K extends keyof LanForm>(key: K, value: LanForm[K]) => {
        setLanForm(current => ({ ...current, [key]: value }));
    };

    const saveLanConfiguration = async () => {
        try {
            setIsSaving(true);
            const response = await apiRequest<{
                success: boolean;
                data?: { message?: string; parameters?: LanForm };
                message?: string;
            }>(`/services/genieacs/devices/${encodeURIComponent(deviceId)}/laninfo`, {
                method: "PUT",
                body: JSON.stringify(lanForm)
            });
            toast.success(response.data?.message || "LAN and DHCP configuration queued");
            if (response.data?.parameters) setLanForm(response.data.parameters);
            setDeviceDetails(current => current?.lanConfiguration ? {
                ...current,
                lanConfiguration: {
                    ...current.lanConfiguration,
                    parameters: response.data?.parameters || lanForm,
                    pending: true
                }
            } : current);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update LAN configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const calculatePortUtilization = (stats: LanInterfaceStats | undefined) => {
        const safeStats = {
            bytesReceived: stats?.bytesReceived ?? 0,
            bytesSent: stats?.bytesSent ?? 0,
            packetsReceived: stats?.packetsReceived ?? 0,
            packetsSent: stats?.packetsSent ?? 0,
            errorsReceived: stats?.errorsReceived ?? 0,
            errorsSent: stats?.errorsSent ?? 0,
        };
        const totalBytes = safeStats.bytesReceived + safeStats.bytesSent;
        const totalPackets = safeStats.packetsReceived + safeStats.packetsSent;
        return {
            totalBytes: formatBytes(totalBytes),
            totalPackets: totalPackets > 0 ? totalPackets.toLocaleString() : '0',
            errorRate: totalPackets > 0 && (safeStats.errorsReceived + safeStats.errorsSent) > 0
                ? ((safeStats.errorsReceived + safeStats.errorsSent) / totalPackets * 100).toFixed(2)
                : '0'
        };
    };

    if (isLoading) {
        return (
            <CardContainer title="LAN Port Information" gradientColor="#8b5cf6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-2 text-muted-foreground">Loading LAN port details...</p>
                </div>
            </CardContainer>
        );
    }

    if (error || !deviceDetails) {
        return (
            <CardContainer title="LAN Port Information" gradientColor="#8b5cf6">
                <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{error || "LAN port information not available"}</p>
                </div>
            </CardContainer>
        );
    }

    const activePorts = deviceDetails.lanInterfaces.filter(port => port.status === 'Up');
    const inactivePorts = deviceDetails.lanInterfaces.filter(port => port.status !== 'Up');
    const lanConfig = deviceDetails.lanConfiguration;

    return (
        <div className="space-y-6">
            {/* Device Summary */}
            <CardContainer title="Device Summary" gradientColor="#3b82f6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Serial Number</div>
                        <div className="font-mono text-sm flex items-center gap-2">
                            {deviceDetails.serialNumber}
                            <button
                                onClick={() => copyToClipboard(deviceDetails.serialNumber, "Serial Number")}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Product Class</div>
                        <div className="font-medium">{deviceDetails.productClass}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Manufacturer</div>
                        <div className="font-medium">{deviceDetails.manufacturer}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <Badge variant={deviceDetails.status === 'Online' ? 'success' : 'secondary'}>
                            {deviceDetails.status}
                        </Badge>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <div className="text-sm text-muted-foreground">Uptime</div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{deviceDetails.uptime}</span>
                        </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                        <div className="text-sm text-muted-foreground">Last Contact</div>
                        <div>{new Date(deviceDetails.lastContact).toLocaleString()}</div>
                    </div>
                </div>
            </CardContainer>

            <CardContainer title="LAN IP & DHCP Server Management" gradientColor="#6366f1">
                <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <Server className="h-4 w-4 text-indigo-500" />
                                CPE LAN configuration
                                {lanConfig?.dataModel && (
                                    <Badge variant="outline">{lanConfig.dataModel}</Badge>
                                )}
                                {lanConfig?.pending && (
                                    <Badge className="bg-amber-500/10 text-amber-700">Pending CPE apply</Badge>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Loaded from the local ACS snapshot. Refresh explicitly pulls the current values from the ONT.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void fetchDeviceDetails(true)}
                                disabled={isRefreshing || isSaving}
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                                {isRefreshing ? "Pulling from ACS" : "Refresh from ACS"}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => void saveLanConfiguration()}
                                disabled={isSaving || isRefreshing || !lanConfig?.supported}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? "Queuing changes" : "Save to ONT"}
                            </Button>
                        </div>
                    </div>

                    {!lanConfig?.supported ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700">
                            <AlertCircle className="mr-2 inline h-4 w-4" />
                            {lanConfig?.message || "The ONT did not expose a supported DHCP server parameter tree."}
                        </div>
                    ) : (
                        <>
                            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
                                <ShieldAlert className="mr-2 inline h-4 w-4" />
                                Changing the LAN IP can disconnect local clients and move the router management page. Confirm the DHCP pool remains in the same subnet.
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <LanField label="LAN IP Address" value={lanForm.lanIpAddress} onChange={value => updateLanField("lanIpAddress", value)} placeholder="192.168.1.1" />
                                <LanField label="Subnet Mask" value={lanForm.subnetMask} onChange={value => updateLanField("subnetMask", value)} placeholder="255.255.255.0" />
                                <LanField label="Gateway / IP Routers" value={lanForm.gateway} onChange={value => updateLanField("gateway", value)} placeholder="192.168.1.1" />
                                <LanField label="Domain Name" value={lanForm.domainName} onChange={value => updateLanField("domainName", value)} placeholder="lan" />
                            </div>

                            <div className="rounded-xl border bg-muted/20 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-semibold">DHCP Server</Label>
                                        <p className="text-xs text-muted-foreground">Automatically allocate addresses to LAN clients.</p>
                                    </div>
                                    <Switch
                                        checked={lanForm.dhcpEnabled === true}
                                        onCheckedChange={checked => updateLanField("dhcpEnabled", checked)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <LanField label="Pool Start" value={lanForm.minAddress} onChange={value => updateLanField("minAddress", value)} placeholder="192.168.1.2" disabled={!lanForm.dhcpEnabled} />
                                    <LanField label="Pool End" value={lanForm.maxAddress} onChange={value => updateLanField("maxAddress", value)} placeholder="192.168.1.254" disabled={!lanForm.dhcpEnabled} />
                                    <LanField
                                        label="Lease Time (seconds)"
                                        value={String(lanForm.leaseTime)}
                                        onChange={value => updateLanField("leaseTime", Number(value))}
                                        placeholder="86400"
                                        type="number"
                                        disabled={!lanForm.dhcpEnabled}
                                    />
                                    <LanField label="DNS Servers" value={lanForm.dnsServers} onChange={value => updateLanField("dnsServers", value)} placeholder="1.1.1.1, 8.8.8.8" disabled={!lanForm.dhcpEnabled} />
                                </div>
                            </div>

                            <details className="rounded-xl border p-3 text-xs">
                                <summary className="cursor-pointer font-semibold">ACS parameter mapping</summary>
                                <div className="mt-3 break-all rounded-lg bg-muted/40 p-3 font-mono text-[11px] text-muted-foreground">
                                    {lanConfig.root || "Parameter root unavailable"}
                                </div>
                            </details>
                        </>
                    )}
                </div>
            </CardContainer>

            {/* Port Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <CardContainer title="Total Ports" gradientColor="#8b5cf6" className="text-center">
                    <div className="text-3xl font-bold">{deviceDetails.lanInterfaces.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">LAN Interfaces</div>
                </CardContainer>

                <CardContainer title="Active Ports" gradientColor="#10b981" className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{activePorts.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">Connected</div>
                </CardContainer>

                <CardContainer title="Inactive Ports" gradientColor="#ef4444" className="text-center">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{inactivePorts.length}</div>
                    <div className="text-sm text-muted-foreground mt-1">Disconnected</div>
                </CardContainer>

                <CardContainer title="Total Traffic" gradientColor="#f59e0b" className="text-center">
                    <div className="text-2xl font-bold">
                        {formatBytes(deviceDetails.lanInterfaces.reduce((acc, port) =>
                            acc + port.stats.bytesReceived + port.stats.bytesSent, 0
                        ))}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Combined</div>
                </CardContainer>
            </div>

            {/* LAN Ports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {deviceDetails.lanInterfaces.map((port) => {
                    const utilization = calculatePortUtilization(port.stats);
                    const currentSpeed = String(port.parameters[`InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.${port.index}.X_ALU_COM_CurMaxBitRate`] || 'N/A');
                    const currentDuplex = String(port.parameters[`InternetGatewayDevice.LANDevice.1.LANEthernetInterfaceConfig.${port.index}.X_ALU_COM_CurDuplexMode`] || 'N/A');

                    return (
                        <CardContainer
                            key={port.index}
                            title={`Port ${port.index} - ${port.name}`}
                            gradientColor={port.status === 'Up' ? '#10b981' : '#ef4444'}
                            className="transition-all hover:shadow-lg"
                        >
                            <div className="space-y-4">
                                {/* Port Header Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Network className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-mono text-sm">{port.macAddress}</span>
                                    </div>
                                    <Badge className={getStatusColor(port.status)}>
                                        {port.status}
                                    </Badge>
                                </div>

                                {/* Port Configuration */}
                                <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <div className="text-muted-foreground">Current Speed</div>
                                        <div className="font-medium">{currentSpeed} Mbps</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Duplex Mode</div>
                                        <div className="font-medium">{currentDuplex}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Max Bit Rate</div>
                                        <div className="font-medium">{port.maxBitRate}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Configured Duplex</div>
                                        <div className="font-medium">{port.duplexMode}</div>
                                    </div>
                                </div>

                                {/* Traffic Statistics */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Traffic Statistics
                                    </h4>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <ArrowDown className="h-3 w-3" /> Received
                                            </span>
                                            <span className="font-mono">{formatBytes(port.stats?.bytesReceived)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <ArrowUp className="h-3 w-3" /> Sent
                                            </span>
                                            <span className="font-mono">{formatBytes(port.stats?.bytesSent)}</span>
                                        </div>
                                    </div>

                                    {/* Packet Statistics */}
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                            Advanced Statistics
                                        </summary>
                                        <div className="mt-3 space-y-2 pl-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="text-muted-foreground">Packets Received</div>
                                                <div className="font-mono text-right">{port.stats.packetsReceived?.toLocaleString()}</div>

                                                <div className="text-muted-foreground">Packets Sent</div>
                                                <div className="font-mono text-right">{port.stats.packetsSent?.toLocaleString()}</div>

                                                <div className="text-muted-foreground">Errors</div>
                                                <div className="font-mono text-right text-red-600">
                                                    {port.stats.errorsReceived + port.stats.errorsSent}
                                                </div>

                                                <div className="text-muted-foreground">Discards</div>
                                                <div className="font-mono text-right">
                                                    {port.stats.discardPacketsReceived + port.stats.discardPacketsSent}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <div className="text-xs text-muted-foreground mb-1">Error Rate</div>
                                                <Progress value={parseFloat(utilization.errorRate)} max={1} className="h-1" />
                                                <div className="text-right text-xs mt-1">{utilization.errorRate}%</div>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                {/* Port Status Indicators */}
                                {port.status === 'Up' && (
                                    <div className="flex gap-2 text-xs">
                                        <Badge variant="outline" className="bg-green-50">
                                            Link Active
                                        </Badge>
                                        {port.stats.errorsReceived === 0 && port.stats.errorsSent === 0 && (
                                            <Badge variant="outline" className="bg-green-50">
                                                No Errors
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContainer>
                    );
                })}
            </div>

            {/* Additional LAN Information */}
            {activePorts.length > 0 && (
                <CardContainer title="Network Summary" gradientColor="#8b5cf6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Total Upload</div>
                                <div className="text-2xl font-bold">
                                    {formatBytes(deviceDetails.lanInterfaces.reduce((acc, port) => acc + port.stats.bytesSent, 0))}
                                </div>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Total Download</div>
                                <div className="text-2xl font-bold">
                                    {formatBytes(deviceDetails.lanInterfaces.reduce((acc, port) => acc + port.stats.bytesReceived, 0))}
                                </div>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="text-sm text-muted-foreground mb-1">Total Packets</div>
                                <div className="text-2xl font-bold">
                                    {(deviceDetails.lanInterfaces.reduce((acc, port) => acc + port.stats.packetsReceived + port.stats.packetsSent, 0)).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <Info className="inline h-4 w-4 mr-1" />
                            All ports share the same MAC address as they are part of a bridge interface
                        </div>
                    </div>
                </CardContainer>
            )}
        </div>
    );
}

function LanField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled = false
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: "text" | "number";
    disabled?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="font-mono text-sm"
            />
        </div>
    );
}
