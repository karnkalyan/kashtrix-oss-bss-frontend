"use client"

import { useEffect, useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Copy, ArrowUp, ArrowDown, Check, Wifi, Globe, ShieldAlert, Cpu, Database, AlertCircle, ArrowUpRight, Activity } from "lucide-react"
import { toast } from "react-hot-toast"
import { CircularProgress } from "@/components/ui/circular-progress"
import { apiRequest } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TR069DeviceDetailsProps {
    deviceId: string
    deviceInfo?: any
}

export function TR069DeviceDetails({ deviceId, deviceInfo }: TR069DeviceDetailsProps) {
    const safeDeviceId = String(deviceId ?? "")
    const [fetchedDeviceInfo, setFetchedDeviceInfo] = useState<any>(null)
    const resolvedDeviceInfo = deviceInfo || fetchedDeviceInfo

    useEffect(() => {
        if (!deviceInfo && safeDeviceId) {
            apiRequest<{ success: boolean; data?: any }>(
                `/services/genieacs/devices/${encodeURIComponent(safeDeviceId)}/deviceinfo`
            ).then(res => {
                if (res?.success && res?.data) {
                    setFetchedDeviceInfo(res.data)
                }
            }).catch(() => null)
        }
    }, [safeDeviceId, deviceInfo])

    const realDetails = resolvedDeviceInfo?.deviceInfo

    // Parse memory
    const memTotalKb = realDetails?.memoryTotal ? Number(realDetails.memoryTotal) : 0
    const memFreeKb = realDetails?.memoryFree ? Number(realDetails.memoryFree) : 0

    let memTotalStr = "N/A"
    let memFreeStr = "N/A"
    let memUsedStr = "N/A"
    let memUsagePct = 0
    const memoryAvailable = memTotalKb > 0

    if (memTotalKb > 0) {
        const memTotalMb = Number((memTotalKb / 1024).toFixed(2))
        const memFreeMb = Number((memFreeKb / 1024).toFixed(2))
        const memUsedMb = Number((memTotalMb - memFreeMb).toFixed(2))

        memTotalStr = `${memTotalMb} MB`
        memFreeStr = `${memFreeMb} MB`
        memUsedStr = `${memUsedMb} MB`
        memUsagePct = Math.round((memUsedMb / memTotalMb) * 100)
    }

    // Parse CPU temperature
    let cpuTempStr = "N/A"
    if (realDetails?.cpuTemp && realDetails.cpuTemp !== 'N/A') {
        const temp = parseFloat(realDetails.cpuTemp)
        cpuTempStr = `${temp.toFixed(1)}°C`
    }

    // Parse RX Optical Power
    const rxPowerRaw = realDetails?.rxPower || "N/A"
    let rxPowerNumeric = 0
    if (rxPowerRaw !== "N/A") {
        const cleaned = String(rxPowerRaw).replace(/[^0-9.-]/g, "")
        rxPowerNumeric = cleaned ? Math.abs(parseFloat(cleaned)) : 0
    }
    const rxPowerPct = rxPowerNumeric > 0 ? Math.max(0, Math.min(100, Math.round(((40 - rxPowerNumeric) / 40) * 100))) : 0
    const rxPowerLabelInside = rxPowerNumeric > 0 ? `-${Math.round(rxPowerNumeric)}` : "N/A"
    const cpuUsageRaw = Number(realDetails?.cpuUsage)
    const cpuUsageAvailable = Number.isFinite(cpuUsageRaw) && realDetails?.cpuUsage !== "N/A"

    // Parse WAN IP & Management IP
    const wanIp = resolvedDeviceInfo?.wanConnections?.[0]?.externalIPAddress || resolvedDeviceInfo?.wanConnections?.[0]?.ipAddress || realDetails?.ipAddress || "N/A"

    let managementIp = realDetails?.ipAddress || "N/A"
    if (realDetails?.connectionRequestURL) {
        try {
            const url = new URL(realDetails.connectionRequestURL)
            managementIp = url.hostname || managementIp
        } catch { /* ignore parse errors */ }
    }

    const info = {
        serialNumber: realDetails?.serialNumber || safeDeviceId || "N/A",
        ipAddress: wanIp,
        managementIpAddress: managementIp,
        macAddress: realDetails?.macAddress || realDetails?.parameters?.["MACAddress"] || "N/A",
        manufacturer: realDetails?.manufacturer || "N/A",
        model: realDetails?.modelName || "N/A",
        hardwareVersion: realDetails?.hardwareVersion || "N/A",
        softwareVersion: realDetails?.softwareVersion || "N/A",
        additionalSoftwareVersion: realDetails?.additionalSoftwareVersion || "N/A",
        oui: realDetails?.manufacturerOUI || "N/A",
        productClass: realDetails?.productClass || "N/A",
        accessType: realDetails?.accessType || "N/A",
        tr069Enabled: realDetails?.connectionRequestURL || realDetails?.acsUrl ? "Yes" : "Unknown",
        username: realDetails?.connectionRequestUsername || "N/A",
        password: realDetails?.connectionRequestPassword || "N/A",
        specVersion: realDetails?.specVersion || "N/A",
        description: realDetails?.description || "N/A",

        cpuUsage: cpuUsageAvailable ? cpuUsageRaw : 0,
        cpuUsageAvailable,
        memoryUsage: memUsagePct,
        memoryAvailable,
        rxPowerPercent: rxPowerPct,
        rxPowerLabelInside,
        rxPowerValue: rxPowerRaw,
        cpuTemp: cpuTempStr,
        memoryTotal: memTotalStr,
        memoryFree: memFreeStr,
        memoryUsed: memUsedStr,

        lastBootTime: "N/A",
        firstUse: realDetails?.firstUseDate ? new Date(realDetails.firstUseDate).toLocaleString() : "N/A",
        deviceTime: realDetails?.parameters?.CurrentLocalTime || "N/A",
        acsUrl: realDetails?.acsUrl || "N/A"
    }

    const formatBytes = (bytes: number) => {
        if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
        const units = ["B", "KB", "MB", "GB", "TB"]
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
        return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
    }

    const wanRows = (resolvedDeviceInfo?.wanConnections || []).map((conn: any) => {
        const isUp = conn.connectionStatus === "Connected" || conn.connectionStatus === "Up"
        return {
            name: conn.name || `WAN ${conn.connectionIndex || ""}`,
            status: isUp ? "Up" : "Down",
            type: conn.connectionType || "WAN",
            ip: conn.externalIPAddress || conn.ipAddress || "-",
            color: isUp ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        }
    })

    return (
        <div className="space-y-6">
            {/* Real System Telemetry Gauges */}
            <CardContainer title="Realtime System Telemetry &amp; Resources" description="Live CPU, memory pool, and optical power readings from GenieACS">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-2">
                    {/* CPU Usage */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm border-slate-100 dark:border-slate-800">
                        <CircularProgress value={info.cpuUsageAvailable ? info.cpuUsage : 0} color="rgb(99, 102, 241)">
                            <span className="text-xl font-extrabold">{info.cpuUsageAvailable ? `${info.cpuUsage}%` : "N/A"}</span>
                        </CircularProgress>
                        <span className="text-xs font-bold mt-3 text-slate-800 dark:text-slate-200 uppercase tracking-wider">CPU Load</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold">{info.cpuUsageAvailable ? "Reporting via CWMP" : "Parameter unmapped"}</span>
                    </div>

                    {/* Memory Usage */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm border-slate-100 dark:border-slate-800">
                        <CircularProgress value={info.memoryAvailable ? info.memoryUsage : 0} color="rgb(168, 85, 247)">
                            <span className="text-xl font-extrabold">{info.memoryAvailable ? `${info.memoryUsage}%` : "N/A"}</span>
                        </CircularProgress>
                        <span className="text-xs font-bold mt-3 text-slate-800 dark:text-slate-200 uppercase tracking-wider">Memory Pool</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold">{info.memoryAvailable ? `${info.memoryUsed} used of ${info.memoryTotal}` : "Memory parameters unmapped"}</span>
                    </div>

                    {/* Optical Power */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm border-slate-100 dark:border-slate-800">
                        <CircularProgress value={info.rxPowerPercent} color="rgb(16, 185, 129)">
                            <span className="text-sm font-extrabold">{info.rxPowerValue}</span>
                        </CircularProgress>
                        <span className="text-xs font-bold mt-3 text-slate-800 dark:text-slate-200 uppercase tracking-wider">Optical Power (Rx)</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Standard range: -27 to -15 dBm</span>
                    </div>

                    {/* CPU Temperature */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm border-slate-100 dark:border-slate-800">
                        <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                            <Cpu className="h-8 w-8 text-amber-500" />
                        </div>
                        <span className="text-xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">{info.cpuTemp}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Thermal State</span>
                    </div>
                </div>
            </CardContainer>

            {/* System Details Key-Value Card */}
            <CardContainer title="TR-069 Device Specifications &amp; Metadata" description="Complete hardware, firmware, and protocol details">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs py-2">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Serial Number</span>
                        <span className="font-extrabold font-mono text-slate-800 dark:text-slate-100 text-sm">{info.serialNumber}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Manufacturer</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{info.manufacturer}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Model Name</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{info.model}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">MAC Address</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{info.macAddress}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">IP Address (WAN)</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{info.ipAddress}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Management IP</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{info.managementIpAddress}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hardware Version</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{info.hardwareVersion}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Software Version</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{info.softwareVersion}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Manufacturer OUI</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{info.oui}</span>
                    </div>
                </div>
            </CardContainer>

            {/* Dynamic WAN Connections Overview */}
            <CardContainer title="Active WAN Interfaces &amp; Connections" description="Dynamic WAN IP bindings synced over TR-069">
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead className="text-xs font-bold">Interface Name</TableHead>
                                <TableHead className="text-xs font-bold">Connection Type</TableHead>
                                <TableHead className="text-xs font-bold">Status</TableHead>
                                <TableHead className="text-xs font-bold">Assigned IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {wanRows.length > 0 ? (
                                wanRows.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-bold text-xs">{row.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{row.type}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-[9px] font-extrabold uppercase px-2 py-0.5 ${row.color}`}>
                                                {row.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                                        No active WAN connection instances returned by ACS
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContainer>
        </div>
    )
}
