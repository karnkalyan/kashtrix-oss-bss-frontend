"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Pause, ArrowDown, ArrowUp, Database } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js"
import { apiRequest } from "@/lib/api"
import { getWebSocketClient } from "@/lib/websocket-client"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface RadiusSession {
    radacctid: number
    acctsessionid: string
    acctuniqueid: string
    username: string
    realm?: string
    nasipaddress?: string
    nasportid?: string
    nasporttype?: string
    acctstarttime: string | null
    acctupdatetime: string | null
    acctstoptime: string | null
    acctinterval?: number | null
    acctsessiontime?: number | null
    acctinputoctets: number
    acctoutputoctets: number
    calledstationid?: string
    callingstationid?: string
    acctterminatecause?: string
    framedipaddress?: string
}

interface RealtimePoint {
    time: string
    downloadMbps: number
    uploadMbps: number
}

interface RealtimeUsageChartProps {
    usernames: string[]
}

export function RealtimeUsageChart({ usernames }: RealtimeUsageChartProps) {
    const { resolvedTheme } = useTheme()
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [sessions, setSessions] = useState<RadiusSession[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [liveUpdate, setLiveUpdate] = useState(true)
    const [wsConnected, setWsConnected] = useState(false)
    const [currentRxMbps, setCurrentRxMbps] = useState<number>(0)
    const [currentTxMbps, setCurrentTxMbps] = useState<number>(0)
    const [totalDownloadMB, setTotalDownloadMB] = useState<number>(0)
    const [totalUploadMB, setTotalUploadMB] = useState<number>(0)
    const [activeSessionCount, setActiveSessionCount] = useState<number>(0)
    const [timeRange, setTimeRange] = useState<"realtime" | "1h" | "24h" | "7d">("realtime")
    
    // Buffer storing historical & live ticks strictly from RADIUS API / WS
    const [realtimeSeries, setRealtimeSeries] = useState<RealtimePoint[]>([])

    const lastOctetsRef = useRef<{ rxOctets: number; txOctets: number; timestamp: number } | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const chartRef = useRef<any>(null)

    useEffect(() => {
        if (usernames.length > 0 && !selectedUser) {
            setSelectedUser(usernames[0])
        }
    }, [usernames, selectedUser])

    // Seed initial realtime buffer for smooth chart rendering
    const seedRealtimeBuffer = useCallback((rxMbps: number, txMbps: number) => {
        const now = Date.now()
        const buffer: RealtimePoint[] = []
        for (let i = 14; i >= 0; i--) {
            const t = new Date(now - i * 3000)
            buffer.push({
                time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                downloadMbps: rxMbps,
                uploadMbps: txMbps,
            })
        }
        setRealtimeSeries(buffer)
    }, [])

    // Fetch RADIUS sessions from real API
    const fetchRadiusSessions = useCallback(async (username: string, isInitialCall: boolean = false) => {
        if (!username) return
        if (isInitialCall) setInitialLoading(true)
        try {
            const response = await apiRequest<{ success: boolean; data: RadiusSession[] }>(
                `/services/radius/act/${username}`
            )
            if (response.success && Array.isArray(response.data)) {
                const sessionList = response.data
                setSessions(sessionList)

                // Calculate cumulative MB totals from RADIUS accounting octets
                let rxOctetsSum = 0
                let txOctetsSum = 0
                let activeCount = 0
                let latestSessionDuration = 0

                sessionList.forEach(s => {
                    const rx = Number(s.acctoutputoctets || 0)
                    const tx = Number(s.acctinputoctets || 0)
                    rxOctetsSum += rx
                    txOctetsSum += tx
                    if (!s.acctstoptime) {
                        activeCount++
                        if (s.acctsessiontime && s.acctsessiontime > latestSessionDuration) {
                            latestSessionDuration = s.acctsessiontime
                        }
                    }
                })

                setTotalDownloadMB(Number((rxOctetsSum / (1024 * 1024)).toFixed(2)))
                setTotalUploadMB(Number((txOctetsSum / (1024 * 1024)).toFixed(2)))
                setActiveSessionCount(activeCount)

                // Compute real-time speed from octet delta between polling ticks
                const now = Date.now()
                if (lastOctetsRef.current) {
                    const deltaSeconds = (now - lastOctetsRef.current.timestamp) / 1000
                    if (deltaSeconds > 0) {
                        const deltaRx = Math.max(0, rxOctetsSum - lastOctetsRef.current.rxOctets)
                        const deltaTx = Math.max(0, txOctetsSum - lastOctetsRef.current.txOctets)

                        const calculatedRxMbps = Number(((deltaRx * 8) / (deltaSeconds * 1000000)).toFixed(2))
                        const calculatedTxMbps = Number(((deltaTx * 8) / (deltaSeconds * 1000000)).toFixed(2))

                        setCurrentRxMbps(calculatedRxMbps)
                        setCurrentTxMbps(calculatedTxMbps)

                        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        setRealtimeSeries(prev => {
                            const base = prev.length > 0 ? prev : seedInitialSeries(calculatedRxMbps, calculatedTxMbps)
                            return [...base.slice(-29), { time: nowStr, downloadMbps: calculatedRxMbps, uploadMbps: calculatedTxMbps }]
                        })
                    }
                } else {
                    // Initial load: compute average speed over active session duration if available
                    let initialRx = 0
                    let initialTx = 0
                    if (latestSessionDuration > 0) {
                        initialRx = Number(((rxOctetsSum * 8) / (latestSessionDuration * 1000000)).toFixed(2))
                        initialTx = Number(((txOctetsSum * 8) / (latestSessionDuration * 1000000)).toFixed(2))
                    }
                    setCurrentRxMbps(initialRx)
                    setCurrentTxMbps(initialTx)
                    seedRealtimeBuffer(initialRx, initialTx)
                }

                lastOctetsRef.current = { rxOctets: rxOctetsSum, txOctets: txOctetsSum, timestamp: now }
            }
        } catch (error) {
            console.error("Error fetching RADIUS sessions:", error)
        } finally {
            if (isInitialCall) setInitialLoading(false)
        }
    }, [seedRealtimeBuffer])

    const seedInitialSeries = (rx: number, tx: number): RealtimePoint[] => {
        const now = Date.now()
        const buffer: RealtimePoint[] = []
        for (let i = 14; i >= 0; i--) {
            const t = new Date(now - i * 3000)
            buffer.push({
                time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                downloadMbps: rx,
                uploadMbps: tx,
            })
        }
        return buffer
    }

    // Initial load when selected user changes
    useEffect(() => {
        if (selectedUser) {
            lastOctetsRef.current = null
            fetchRadiusSessions(selectedUser, true)
        }
    }, [selectedUser, fetchRadiusSessions])

    // WebSocket listener for live RADIUS events
    useEffect(() => {
        if (!liveUpdate || !selectedUser) return

        const ws = getWebSocketClient()
        if (ws) {
            setWsConnected(true)
            ws.subscribe(["traffic", `user:${selectedUser}`])

            const handleTrafficData = (data: any) => {
                if (data && (data.user === selectedUser || data.username === selectedUser)) {
                    if (data.rxMbps !== undefined && data.txMbps !== undefined) {
                        const rx = Number(data.rxMbps || 0)
                        const tx = Number(data.txMbps || 0)
                        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        setCurrentRxMbps(rx)
                        setCurrentTxMbps(tx)
                        setRealtimeSeries(prev => [...prev.slice(-29), { time: nowStr, downloadMbps: rx, uploadMbps: tx }])
                    } else {
                        // Re-fetch real RADIUS session details on incoming session update event
                        fetchRadiusSessions(selectedUser, false)
                    }
                }
            }

            ;(ws as any).on("TRAFFIC_STATS", handleTrafficData)
            ;(ws as any).on("TRAFFIC_UPDATE", handleTrafficData)
            ;(ws as any).on("RADIUS_ACCT", handleTrafficData)

            return () => {
                ;(ws as any).off("TRAFFIC_STATS", handleTrafficData)
                ;(ws as any).off("TRAFFIC_UPDATE", handleTrafficData)
                ;(ws as any).off("RADIUS_ACCT", handleTrafficData)
            }
        } else {
            setWsConnected(false)
        }
    }, [liveUpdate, selectedUser, fetchRadiusSessions])

    // API Polling interval for live updates (fetches real RADIUS accounting data every 5 seconds)
    useEffect(() => {
        if (!liveUpdate || !selectedUser) return

        intervalRef.current = setInterval(() => {
            fetchRadiusSessions(selectedUser, false)
        }, 5000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [liveUpdate, selectedUser, fetchRadiusSessions])

    const toggleLiveUpdate = () => setLiveUpdate(prev => !prev)

    // Chart formatting & setup
    const isDarkMode = resolvedTheme === "dark"

    let chartLabels: string[] = []
    let downloadDataset: number[] = []
    let uploadDataset: number[] = []
    let yAxisTitle = "Speed (Mbps)"

    if (timeRange === "realtime") {
        chartLabels = realtimeSeries.map(p => p.time)
        downloadDataset = realtimeSeries.map(p => p.downloadMbps)
        uploadDataset = realtimeSeries.map(p => p.uploadMbps)
        yAxisTitle = "Mbps"
    } else {
        yAxisTitle = "Data (MB)"
        const now = Date.now()
        let startTime = now - 60 * 60 * 1000
        let intervalMinutes = 1
        let points = 60

        if (timeRange === "24h") {
            startTime = now - 24 * 60 * 60 * 1000
            intervalMinutes = 60
            points = 24
        } else if (timeRange === "7d") {
            startTime = now - 7 * 24 * 60 * 60 * 1000
            intervalMinutes = 24 * 60
            points = 7
        }

        const buckets: { [key: string]: { download: number; upload: number } } = {}
        for (let i = 0; i < points; i++) {
            const time = new Date(startTime + i * intervalMinutes * 60 * 1000)
            let key = timeRange === "7d"
                ? time.toLocaleDateString([], { month: 'short', day: 'numeric' })
                : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            buckets[key] = { download: 0, upload: 0 }
        }

        sessions.forEach(session => {
            if (!session.acctstarttime) return
            const start = new Date(session.acctstarttime).getTime()
            if (start < startTime) return

            const bucketIndex = Math.floor((start - startTime) / (intervalMinutes * 60 * 1000))
            const keys = Object.keys(buckets)
            if (bucketIndex >= 0 && bucketIndex < keys.length) {
                const key = keys[bucketIndex]
                buckets[key].download += session.acctoutputoctets / (1024 * 1024)
                buckets[key].upload += session.acctinputoctets / (1024 * 1024)
            }
        })

        chartLabels = Object.keys(buckets)
        downloadDataset = chartLabels.map(l => buckets[l].download)
        uploadDataset = chartLabels.map(l => buckets[l].upload)
    }

    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: timeRange === "realtime" ? "Download (Mbps)" : "Download (MB)",
                data: downloadDataset,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.12)",
                fill: true,
                tension: 0.4,
                pointRadius: timeRange === "realtime" ? 2 : 3,
            },
            {
                label: timeRange === "realtime" ? "Upload (Mbps)" : "Upload (MB)",
                data: uploadDataset,
                borderColor: "rgb(16, 185, 129)",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                fill: true,
                tension: 0.4,
                pointRadius: timeRange === "realtime" ? 2 : 3,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            legend: {
                position: "top" as const,
                labels: { color: isDarkMode ? "#e2e8f0" : "#334155", font: { weight: "bold" as const } },
            },
            tooltip: {
                mode: "index" as const,
                intersect: false,
                callbacks: {
                    label: (context: any) => {
                        let label = context.dataset.label || ""
                        if (label) label += ": "
                        if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + (timeRange === "realtime" ? " Mbps" : " MB")
                        return label
                    },
                },
                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)",
                titleColor: isDarkMode ? "#e2e8f0" : "#334155",
                bodyColor: isDarkMode ? "#e2e8f0" : "#334155",
                borderColor: isDarkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(203, 213, 225, 0.5)",
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: isDarkMode ? "#94a3b8" : "#64748b", maxRotation: 0 },
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: yAxisTitle, color: isDarkMode ? "#94a3b8" : "#64748b" },
                grid: { color: isDarkMode ? "rgba(71, 85, 105, 0.25)" : "rgba(203, 213, 225, 0.4)" },
                ticks: { color: isDarkMode ? "#94a3b8" : "#64748b" },
            },
        },
        interaction: { mode: "nearest" as const, axis: "x" as const, intersect: false },
    }

    if (usernames.length === 0) {
        return <div className="text-center py-4 text-muted-foreground">No connection users available</div>
    }

    return (
        <div className="space-y-4">
            {/* Live Telemetry Gauges from Real RADIUS Accounting API */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 border-blue-200 dark:border-blue-900/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        <ArrowDown className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Rx Speed</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentRxMbps.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Mbps</span></div>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 p-3 border-emerald-200 dark:border-emerald-900/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <ArrowUp className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Tx Speed</div>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{currentTxMbps.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Mbps</span></div>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 p-3 border-slate-200 dark:border-slate-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                        <Database className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Usage (Rx/Tx)</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {totalDownloadMB.toFixed(1)} MB <span className="text-xs font-normal text-muted-foreground">↓</span> / {totalUploadMB.toFixed(1)} MB <span className="text-xs font-normal text-muted-foreground">↑</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 p-3">
                    <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Stream</div>
                        <div className="mt-1 flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-blue-400'} opacity-75`}></span>
                                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                            </span>
                            <span className="text-xs font-semibold">{wsConnected ? "WebSocket Stream" : `Active Sessions: ${activeSessionCount}`}</span>
                        </div>
                    </div>
                    <Badge variant={liveUpdate ? "default" : "outline"} className={liveUpdate ? "bg-emerald-600 text-white" : ""}>
                        {liveUpdate ? "LIVE" : "PAUSED"}
                    </Badge>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
                <div className="w-48">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                            {usernames.map((user) => (
                                <SelectItem key={user} value={user}>
                                    {user}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" variant={liveUpdate ? "default" : "outline"} onClick={toggleLiveUpdate} className="h-9 gap-1.5">
                        {liveUpdate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {liveUpdate ? "Pause Live Stream" : "Start Live Stream"}
                    </Button>

                    <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
                        <SelectTrigger className="w-36 h-9">
                            <SelectValue placeholder="Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="realtime">⚡ Live Realtime</SelectItem>
                            <SelectItem value="1h">Last 1 Hour</SelectItem>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Chart Container - Permanently mounted so canvas never disappears */}
            <div className="relative h-80 w-full pt-2">
                {initialLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-xs">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                <Line ref={chartRef} data={chartData} options={options} />
            </div>
        </div>
    )
}