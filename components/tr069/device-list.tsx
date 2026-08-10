"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Search, Filter, MoreVertical, Router, ExternalLink, AlertCircle,
    ChevronLeft, ChevronRight, RefreshCw, Eye, UserPlus, Plus, ArrowUpRight
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { OpticalPowerIndicator } from "./optical-power-indicator"

type Device = {
    id: number
    device: string
    SerialNumber: string
    customerName: string
    ProductClass: string
    Manufacturer: string
    status: "Online" | "Offline" | "Degraded"
    ipAddress: string
    health: "Good" | "Warning" | "Critical"
    lastContact: string
    lastContactRel: string
    provisioningProfile: string
    rxPower: number | null
    oltRxPower: number | null
    oltName: string | null
}

function formatRelativeTime(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 0) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}

export function TR069DeviceList() {
    const [searchQuery, setSearchQuery] = useState("")
    const [devices, setDevices] = useState<Device[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const fetchDevices = useCallback(async () => {
        try {
            setIsLoading(true)
            const res = await apiRequest<{ success: boolean; devices?: any[] }>("/tr069-devices")
            if (res.success && res.devices) {
                const parsed: Device[] = res.devices.map((d: any, idx: number) => ({
                    id: d.id || idx + 10,
                    device: d.device || `CPE-${d.SerialNumber?.slice(-8).toUpperCase() || d.id}`,
                    SerialNumber: d.SerialNumber || "N/A",
                    customerName: d.lead ? `${d.lead.firstName} ${d.lead.lastName}` : "Unlinked Customer",
                    ProductClass: d.ProductClass || "Generic CPE",
                    Manufacturer: d.Manufacturer || "Unknown",
                    status: d.status?.toLowerCase().includes("online") ? "Online" : d.status?.toLowerCase().includes("degraded") ? "Degraded" : "Offline",
                    ipAddress: d.ipAddress || "—",
                    health: d.status?.toLowerCase().includes("online") ? "Good" : d.status?.toLowerCase().includes("degraded") ? "Warning" : "Critical",
                    lastContact: d.lastContact ? new Date(d.lastContact).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A",
                    lastContactRel: d.lastContact ? formatRelativeTime(new Date(d.lastContact)) : "N/A",
                    provisioningProfile: d.provisioningProfile || "Default_Profile",
                    rxPower: d.rxPower !== null && d.rxPower !== undefined && Number.isFinite(Number(d.rxPower)) ? Number(d.rxPower) : null,
                    oltRxPower: d.oltRxPower !== null && d.oltRxPower !== undefined && Number.isFinite(Number(d.oltRxPower)) ? Number(d.oltRxPower) : null,
                    oltName: d.oltName || null,
                }))
                setDevices(parsed)
            } else {
                setDevices([])
            }
        } catch {
            setDevices([])
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchDevices()
    }, [fetchDevices])

    const syncDevices = async () => {
        try {
            setIsSyncing(true)
            toast.loading("Syncing with ACS...", { id: "sync" })
            const response = await apiRequest<{ success: boolean; stats?: { total: number } }>("/tr069-devices/sync", { method: 'POST' })
            if (response.success) {
                toast.success(`Synced ${response.stats?.total ?? 0} devices`, { id: "sync" })
                await fetchDevices()
            } else {
                toast.error("Sync failed", { id: "sync" })
            }
        } catch {
            toast.error("Failed to sync with ACS", { id: "sync" })
        } finally {
            setIsSyncing(false)
        }
    }

    const filteredDevices = devices.filter(d => {
        const q = searchQuery.toLowerCase()
        return d.device.toLowerCase().includes(q) ||
            d.customerName.toLowerCase().includes(q) ||
            d.Manufacturer.toLowerCase().includes(q) ||
            d.ProductClass.toLowerCase().includes(q) ||
            d.ipAddress.toLowerCase().includes(q)
    })

    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage)
    const paginatedDevices = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="space-y-6">
            <CardContainer title="CPE Device Registry" description="Comprehensive inventory of customer premise routers managed via CWMP" gradientColor="#4f46e5">
                <div className="flex flex-col gap-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by serial number, IP, customer..."
                                className="pl-9 h-10 text-xs rounded-xl border-indigo-500/10 focus:border-indigo-500/40"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button variant="outline" size="sm" className="h-10 text-xs rounded-xl border-indigo-500/20 hover:bg-indigo-500/10" onClick={syncDevices} disabled={isSyncing}>
                                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                                Sync ACS
                            </Button>
                            <Button variant="outline" size="sm" className="h-10 text-xs rounded-xl border-indigo-500/20 hover:bg-indigo-500/10">
                                <Filter className="h-3.5 w-3.5 mr-2" />
                                Filters
                            </Button>
                            <Button size="sm" className="h-10 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Add CPE Device
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-border overflow-hidden bg-card/20 shadow-inner">
                        <Table>
                            <TableHeader className="bg-secondary/30">
                                <TableRow>
                                    <TableHead className="text-xs font-bold">CPE ID</TableHead>
                                    <TableHead className="text-xs font-bold">Linked Customer</TableHead>
                                    <TableHead className="text-xs font-bold">Hardware Model</TableHead>
                                    <TableHead className="text-xs font-bold">Connection State</TableHead>
                                    <TableHead className="text-xs font-bold">WAN IP Address</TableHead>
                                    <TableHead className="text-xs font-bold">Signal Strength</TableHead>
                                    <TableHead className="text-xs font-bold">TR-181 Health</TableHead>
                                    <TableHead className="text-xs font-bold">Last Inform</TableHead>
                                    <TableHead className="text-xs font-bold">Active Profile</TableHead>
                                    <TableHead className="w-[60px] text-xs font-bold text-center">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-12 text-xs text-muted-foreground animate-pulse">
                                            Loading CPE devices...
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedDevices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-12 text-xs text-muted-foreground">
                                            No active devices matched your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedDevices.map(d => (
                                        <TableRow key={d.id} className="hover:bg-indigo-500/5 transition-colors border-b">
                                            <TableCell className="font-extrabold text-xs text-indigo-500 font-mono tracking-wider">
                                                <Link href={`/tr069/device/${d.SerialNumber}`} target="_blank" rel="noopener noreferrer" className="hover:underline inline-flex items-center gap-1">
                                                    {d.device} <ArrowUpRight className="h-3 w-3 opacity-70" />
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold">{d.customerName}</TableCell>
                                            <TableCell className="text-xs font-semibold text-muted-foreground">{d.Manufacturer} {d.ProductClass}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.status === "Online" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                        d.status === "Degraded" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                                            "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === "Online" ? "bg-emerald-500 animate-pulse" :
                                                            d.status === "Degraded" ? "bg-amber-500 animate-ping" :
                                                                "bg-rose-500"
                                                        }`} />
                                                    {d.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{d.ipAddress}</TableCell>
                                            <TableCell title={d.oltName || undefined}>
                                                <div className="space-y-3">
                                                    <OpticalPowerIndicator label="ONT Rx" value={d.rxPower} />
                                                    <OpticalPowerIndicator label="OLT Rx" value={d.oltRxPower} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${d.health === "Good" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25" :
                                                        d.health === "Warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25" :
                                                            "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                                                    }`}>
                                                    {d.health}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-semibold">
                                                {d.lastContact} <span className="text-[9px] font-mono text-muted-foreground/75">({d.lastContactRel})</span>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-indigo-500 font-semibold">{d.provisioningProfile}</TableCell>
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-lg">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 text-xs rounded-xl shadow-lg border-indigo-500/10">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/tr069/device/${d.SerialNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer font-semibold py-2">
                                                                <Eye className="h-3.5 w-3.5 text-indigo-500" /> View Configs
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="flex items-center gap-2 font-semibold py-2">
                                                            <UserPlus className="h-3.5 w-3.5 text-indigo-500" /> Link Customer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-4">
                            <span className="font-semibold">Showing {paginatedDevices.length} of {filteredDevices.length} CPEs</span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContainer>

            {/* Automation & Service Tools Bottom Bar */}
            <div className="space-y-4 border-t border-border/80 pt-8">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-6 bg-indigo-500 rounded" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Automation Service Integrations</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                        { title: "Zero-touch Provisioning", desc: "Enroll new CPEs with auto-configuration profiles." },
                        { title: "Firmware Rollout Engine", desc: "Schedule, throttle, and audit batch firmware updates." },
                        { title: "Wi-Fi Config Templates", desc: "Standardize SSIDs, radio frequency channels & securities." },
                        { title: "VoIP / SIP Profile Sync", desc: "Sync profiles, SIP server credentials, and lines status." },
                        { title: "Remote Diagnostics Hub", desc: "Execute speed tests, latency checks, and trace routes." },
                        { title: "Platform Safeguards", desc: "Enforce reboot validation gates and change windows." }
                    ].map((tool, idx) => (
                        <div key={idx} className="flex flex-col justify-between p-5 rounded-2xl border bg-card/45 hover:bg-card/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer border-border">
                            <div>
                                <span className="text-xs font-extrabold block leading-tight text-slate-800 dark:text-slate-200">{tool.title}</span>
                                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{tool.desc}</p>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-500 mt-4 flex items-center gap-1 group">
                                Launch Tool <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
