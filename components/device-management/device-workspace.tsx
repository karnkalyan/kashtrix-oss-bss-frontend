"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, Archive, ChevronRight, Clock, Loader2, Play, RefreshCw, Server, ShieldCheck, Wrench } from "lucide-react"
import toast from "react-hot-toast"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DeviceStatusBadge } from "./device-status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { DEVICE_TYPES, deviceApi, type DeviceType, type ManagedDevice } from "@/lib/device-management"
import { DeviceDataWidget } from './device-data-widget'

export function DeviceWorkspace({ deviceType: initialDeviceType, deviceId }: { deviceType?: DeviceType; deviceId: number }) {
    const [device, setDevice] = useState<ManagedDevice | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [module, setModule] = useState("dashboard")
    const [moduleData, setModuleData] = useState<any>(null)
    const [moduleLoading, setModuleLoading] = useState(false)
    const [command, setCommand] = useState("")
    const [terminal, setTerminal] = useState<string[]>(["Authenticated read-only terminal. Commands are allowlisted and audited."])
    const [audits, setAudits] = useState<any[]>([])
    const [backups, setBackups] = useState<any[]>([])

    const load = useCallback(async () => {
        try {
            setLoading(true)
            const response = await deviceApi.get(deviceId)
            if (initialDeviceType && response.data.deviceType !== initialDeviceType) {
                throw new Error("Device type does not match this workspace.")
            }
            setDevice(response.data)
            setError("")
        } catch (error: any) {
            setError(error.message || "Could not load device")
        } finally {
            setLoading(false)
        }
    }, [deviceId, initialDeviceType])

    useEffect(() => {
        load()
    }, [load])

    const capabilities = useMemo(() => device?.capabilities || [], [device])
    const activeDeviceType = device?.deviceType || initialDeviceType

    const select = async (name: string) => {
        setModule(name)
        setModuleData(null)
        if (name === "terminal") return
        if (name === "audit") {
            try {
                setModuleLoading(true)
                const res = await deviceApi.audits(deviceId)
                setAudits(res.data)
            } catch (error: any) {
                toast.error(error.message)
            } finally {
                setModuleLoading(false)
            }
            return
        }
        if (name === "backup") {
            try {
                setModuleLoading(true)
                const res = await deviceApi.backups(deviceId)
                setBackups(res.data)
            } catch (error: any) {
                toast.error(error.message)
            } finally {
                setModuleLoading(false)
            }
            return
        }
        const cap = capabilities.find(item => item.capability === name)
        if (!cap?.supported) return
        try {
            setModuleLoading(true)
            const res = await deviceApi.module(deviceId, name)
            setModuleData(res.data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setModuleLoading(false)
        }
    }

    const refresh = async () => {
        try {
            await deviceApi.refresh(deviceId)
            await load()
            toast.success("Status refreshed")
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const test = async () => {
        try {
            const result = await deviceApi.test(deviceId)
            toast.success(`Connected${result.data.profile ? ` using ${result.data.profile}` : ""}`)
            await load()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const run = async () => {
        if (!command.trim()) return
        const sent = command.trim()
        setCommand("")
        setTerminal(lines => [...lines, `$ ${sent}`])
        try {
            const response = await deviceApi.command(deviceId, sent)
            setTerminal(lines => [...lines, String(response.data.output || "(no output)")])
        } catch (error: any) {
            setTerminal(lines => [...lines, `ERROR: ${error.message}`])
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <Center icon={<Loader2 className="h-8 w-8 animate-spin" />} text="Loading device workspace…" />
            </DashboardLayout>
        )
    }

    if (error || !device) {
        return (
            <DashboardLayout>
                <Center icon={<AlertTriangle className="h-8 w-8 text-destructive" />} text={error || "Device not found"} action={<Button onClick={load}>Retry</Button>} />
            </DashboardLayout>
        )
    }

    const allModules = [...capabilities, { capability: 'audit', supported: true, readOnly: true, metadata: {} as any }]
    const deviceTypeLabel = activeDeviceType && DEVICE_TYPES[activeDeviceType] ? DEVICE_TYPES[activeDeviceType].label : "Device"

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <Card className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <Server className="h-7 w-7 text-primary" />
                                <h1 className="text-2xl font-semibold">{device.name}</h1>
                                <DeviceStatusBadge status={device.status} />
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {deviceTypeLabel} · {device.vendor} {device.model || ""} · {device.firmwareVersion || "firmware unknown"} · {device.host}:{device.managementPort} · {device.communicationMethod}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "never"}{device.failureReason ? ` · ${device.failureReason}` : ""}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={test}>
                                <Activity className="mr-2 h-4 w-4" />Test
                            </Button>
                            <Button variant="outline" onClick={refresh}>
                                <RefreshCw className="mr-2 h-4 w-4" />Refresh
                            </Button>
                            <Button variant="outline" onClick={() => {
                                const reason = window.prompt("Maintenance reason")
                                if (reason) deviceApi.maintenance(device.id, reason).then(load)
                            }}>
                                <Wrench className="mr-2 h-4 w-4" />Maintenance
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="grid min-h-[620px] gap-4 lg:grid-cols-[250px_1fr]">
                    <Card className="overflow-hidden">
                        <div className="border-b p-3 text-sm font-semibold">{device.vendor} workspace</div>
                        <ScrollArea className="h-[570px]">
                            <nav className="space-y-1 p-2">
                                {allModules.map(cap => (
                                    <button
                                        key={cap.capability}
                                        disabled={!cap.supported}
                                        onClick={() => select(cap.capability)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm capitalize",
                                            module === cap.capability ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted",
                                            !cap.supported && "cursor-not-allowed opacity-40"
                                        )}
                                    >
                                        <span>{cap.capability.replaceAll("-", " ")}</span>
                                        {cap.supported ? <ChevronRight className="h-4 w-4" /> : <span className="text-[10px]">unsupported</span>}
                                    </button>
                                ))}
                            </nav>
                        </ScrollArea>
                    </Card>

                    <Card className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold capitalize">{module.replaceAll("-", " ")}</h2>
                                <p className="text-sm text-muted-foreground">Normalized device data. Raw output is available only in the audited Terminal.</p>
                            </div>
                            {module === "backup" && (
                                <Button onClick={async () => {
                                    if (!window.confirm("Create a configuration backup now?")) return
                                    try {
                                        await deviceApi.createBackup(device.id)
                                        toast.success("Backup created")
                                        select("backup")
                                    } catch (error: any) {
                                        toast.error(error.message)
                                    }
                                }}>
                                    <Archive className="mr-2 h-4 w-4" />Create backup
                                </Button>
                            )}
                        </div>

                        {device.status === "offline" || device.status === "failure" ? (
                            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">
                                Device is {device.status}. Read operations may fail until connectivity is restored.
                            </div>
                        ) : null}

                        {moduleLoading ? (
                            <Center icon={<Loader2 className="h-7 w-7 animate-spin" />} text="Loading module…" />
                        ) : (
                            <div className="relative">
                                {/* Persisted Terminal Panel */}
                                <div className={cn(module !== "terminal" && "hidden")}>
                                    <div className="space-y-3">
                                        <div className="rounded-md bg-black p-4 font-mono text-sm text-green-400">
                                            <div className="h-[420px] overflow-auto whitespace-pre-wrap">{terminal.join("\n")}</div>
                                            <div className="mt-3 flex gap-2 border-t border-green-900 pt-3">
                                                <span>$</span>
                                                <Input
                                                    className="border-0 bg-transparent font-mono text-green-300 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    value={command}
                                                    onChange={e => setCommand(e.target.value)}
                                                    onKeyDown={e => e.key === "Enter" && run()}
                                                    placeholder="Enter an allowlisted read command"
                                                />
                                                <Button size="icon" onClick={run}><Play className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Credentials stay on the backend. Shell operators and non-allowlisted commands are rejected and every command is audited.</p>
                                    </div>
                                </div>

                                {/* Persisted Audit Table */}
                                <div className={cn(module !== "audit" && "hidden")}>
                                    <AuditTable rows={audits} />
                                </div>

                                {/* Persisted Backup List */}
                                <div className={cn(module !== "backup" && "hidden")}>
                                    <BackupList rows={backups} />
                                </div>

                                {/* Dynamic Module Data Widget */}
                                {moduleData?.view && (
                                    <div className={cn(module === "terminal" || module === "audit" || module === "backup" ? "hidden" : "")}>
                                        <DeviceDataWidget payload={moduleData} title={module.replaceAll('-', ' ')} />
                                    </div>
                                )}

                                {/* Fallback Dashboard / Capability Splash */}
                                <div className={cn(
                                    (module === "terminal" || module === "audit" || module === "backup" || moduleData?.view) && "hidden"
                                )}>
                                    <Center
                                        icon={<ShieldCheck className="h-10 w-10" />}
                                        text={capabilities.find(item => item.capability === module)?.supported ? "Choose refresh to load verified device data." : "This capability is not available for the detected model, firmware, or protocol."}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}

function Center({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            {icon}
            <p>{text}</p>
            {action}
        </div>
    )
}

function AuditTable({ rows }: { rows: any[] }) {
    return rows.length ? (
        <div className="space-y-2 max-h-[500px] overflow-auto">
            {rows.map(row => (
                <div key={row.id} className="rounded-md border p-3 text-sm bg-card">
                    <div className="flex justify-between">
                        <span className="font-semibold">{row.action}</span>
                        <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">{row.success ? "Success" : row.failureReason || "Failed"}</div>
                </div>
            ))}
        </div>
    ) : (
        <Center icon={<Clock className="h-8 w-8" />} text="No audit events yet." />
    )
}

function BackupList({ rows }: { rows: any[] }) {
    return rows.length ? (
        <div className="space-y-2 max-h-[500px] overflow-auto">
            {rows.map(row => (
                <div key={row.id} className="flex justify-between items-center rounded-md border p-3 bg-card">
                    <div>
                        <span className="font-semibold text-sm">{row.name}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.format} · {row.sizeBytes} bytes</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</span>
                </div>
            ))}
        </div>
    ) : (
        <Center icon={<Archive className="h-8 w-8" />} text="No backups created." />
    )
}
