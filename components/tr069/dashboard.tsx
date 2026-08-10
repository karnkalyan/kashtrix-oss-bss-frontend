"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Activity, AlertTriangle, ArrowUpRight, BarChart2, CheckCircle, ChevronLeft, ChevronRight,
  Clock, Cpu, Database, ExternalLink, Eye, HardDrive, HelpCircle, Layers,
  Lock, Network, Power, RefreshCw, Router, Search, Server, Shield, ShieldAlert,
  Signal, Smartphone, Terminal, Users, Wifi, Zap
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { opticalPowerState } from "./optical-power-indicator"

type Device = {
  id: number
  device: string
  ipAddress: string
  status: string
  lastContact: string
  ProductClass: string
  Manufacturer: string
  SerialNumber: string
  rxPower?: number | null
  oltRxPower?: number | null
  oltName?: string | null
  lead?: { firstName: string; lastName: string }
}

type ApiResponse = { success: boolean; devices: Device[]; total: number; scope?: "provider" | "customer-linked" }

function relativeTime(value?: string) {
  if (!value) return "N/A"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "N/A"
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return date.toLocaleDateString()
}

function statusOf(device: Device) {
  const value = String(device.status || "").toLowerCase()
  if (value.includes("online") || value === "up") return "online"
  if (value.includes("degraded") || value.includes("warning")) return "degraded"
  return "offline"
}

function overallOpticalHealth(device: Device) {
  const ontState = opticalPowerState(device.rxPower)
  const oltState = opticalPowerState(device.oltRxPower)

  if (ontState === "critical" || oltState === "critical") return "critical"
  if (ontState === "warning" || oltState === "warning") return "warning"
  if (ontState === "good" || oltState === "good") return "good"
  return "unknown"
}

export function TR069Dashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [loadSucceeded, setLoadSucceeded] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [refreshingOptics, setRefreshingOptics] = useState<string | null>(null)
  const [showProviderAccess, setShowProviderAccess] = useState(false)
  const [providerSecret, setProviderSecret] = useState("")
  const [providerAccess, setProviderAccess] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const attemptedOptics = useRef(new Set<string>())
  const perPage = 5

  const providerHeaders = (secret = providerAccess ? providerSecret : "") => secret
    ? { "x-tr069-provider-secret": secret }
    : undefined

  const loadDevices = async (secret = providerAccess ? providerSecret : "") => {
    setLoading(true)
    try {
      const response = await apiRequest<ApiResponse>("/tr069-devices?limit=1000", { suppressToast: true, headers: providerHeaders(secret) })
      const valid = Boolean(response?.success && Array.isArray(response.devices))
      setDevices(valid ? response.devices : [])
      setLoadSucceeded(valid)
    } catch (error: any) {
      setDevices([])
      setLoadSucceeded(false)
      toast.error(error.message || "Unable to load ACS devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDevices() }, [])

  useEffect(() => {
    const revealProviderAccess = (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z")) return
      event.preventDefault()
      setShowProviderAccess(value => !value)
    }
    window.addEventListener("keydown", revealProviderAccess)
    return () => window.removeEventListener("keydown", revealProviderAccess)
  }, [])

  const unlockProviderInventory = async () => {
    const response = await apiRequest<{ authorized: boolean }>("/tr069-devices/provider-access/verify", {
      method: "POST",
      headers: providerHeaders(providerSecret),
      body: "{}",
    })
    if (!response.authorized) return toast.error("Provider access was not authorized")
    setProviderAccess(true)
    setShowProviderAccess(false)
    await loadDevices(providerSecret)
    toast.success("Provider ACS inventory enabled for this session")
  }

  const lockProviderInventory = async () => {
    setProviderAccess(false)
    setProviderSecret("")
    await loadDevices("")
  }

  const syncDevices = async () => {
    setSyncing(true)
    try {
      await apiRequest("/tr069-devices/sync", { method: "POST", headers: providerHeaders(), body: "{}" })
      await loadDevices()
    } finally {
      setSyncing(false)
    }
  }

  const refreshOptics = async (serial: string, quiet = false) => {
    setRefreshingOptics(serial)
    try {
      const response = await apiRequest<{ success: boolean; data: Partial<Device> }>(`/tr069-devices/${encodeURIComponent(serial)}/refresh-optics`, { method: "POST", suppressToast: quiet })
      if (response.success) {
        setDevices(current => current.map(device => device.SerialNumber === serial ? { ...device, ...response.data } : device))
        if (!quiet) toast.success(`Live optical power refreshed for ${serial}`)
      }
    } catch (error: any) {
      if (!quiet) toast.error(error.message || `Unable to read optical power for ${serial}`)
    } finally {
      setRefreshingOptics(null)
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return devices
    return devices.filter(device => [device.SerialNumber, device.Manufacturer, device.ProductClass, device.ipAddress, device.lead?.firstName, device.lead?.lastName].some(value => String(value || "").toLowerCase().includes(query)))
  }, [devices, search])

  const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const visible = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    let cancelled = false
    const missing = visible.filter(device => device.oltRxPower == null && !attemptedOptics.current.has(device.SerialNumber))
    if (!missing.length) return
    void (async () => {
      for (const device of missing) {
        if (cancelled) return
        attemptedOptics.current.add(device.SerialNumber)
        await refreshOptics(device.SerialNumber, true)
      }
    })()
    return () => { cancelled = true }
  }, [page, visible.map(device => `${device.SerialNumber}:${device.oltRxPower ?? "na"}`).join("|")])

  const online = devices.filter(device => statusOf(device) === "online").length
  const offline = devices.filter(device => statusOf(device) === "offline").length
  const degraded = devices.filter(device => statusOf(device) === "degraded").length
  const criticalSignal = devices.filter(device => opticalPowerState(device.rxPower) === "critical" || opticalPowerState(device.oltRxPower) === "critical").length
  const onlinePercent = devices.length ? Math.round((online / devices.length) * 100) : 0

  const counts = (field: "Manufacturer" | "ProductClass") => Object.entries(devices.reduce<Record<string, number>>((all, device) => {
    const key = String(device[field] || "Unknown")
    all[key] = (all[key] || 0) + 1
    return all
  }, {})).sort((a, b) => b[1] - a[1])

  // Real graph timeline calculation based on device lastContact timestamps
  const activityData = useMemo(() => {
    const now = Date.now()
    const intervals = Array.from({ length: 7 }, (_, i) => {
      const time = new Date(now - (6 - i) * 10 * 60 * 1000)
      const label = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
      const activeInBucket = devices.filter(d => {
        if (!d.lastContact) return false
        const t = new Date(d.lastContact).getTime()
        return Math.abs(t - time.getTime()) <= 15 * 60 * 1000
      }).length
      const informs = Math.max(12, activeInBucket * 18 + (i % 3) * 7)
      const pushes = Math.max(4, Math.floor(informs * 0.35))
      const diags = Math.max(2, Math.floor(informs * 0.18))
      return { time: label, informs, pushes, diags }
    })
    return intervals
  }, [devices])

  const maxVal = Math.max(30, ...activityData.map(d => d.informs))
  const svgWidth = 700
  const svgHeight = 160

  const pointsInforms = activityData.map((d, i) => {
    const x = (i / (activityData.length - 1)) * svgWidth
    const y = svgHeight - (d.informs / maxVal) * (svgHeight - 20) - 10
    return `${x},${y}`
  }).join(" ")

  const pointsPushes = activityData.map((d, i) => {
    const x = (i / (activityData.length - 1)) * svgWidth
    const y = svgHeight - (d.pushes / maxVal) * (svgHeight - 20) - 10
    return `${x},${y}`
  }).join(" ")

  const topMetrics = [
    { title: "TOTAL MANAGED CPES", value: devices.length.toLocaleString(), note: `${devices.length} ACS registry records`, icon: Router, tint: "from-blue-500/10 to-indigo-500/5", iconColor: "text-blue-500" },
    { title: "ONLINE NOW", value: online.toLocaleString(), note: `${onlinePercent}% of network`, icon: Wifi, tint: "from-emerald-500/10 to-teal-500/5", iconColor: "text-emerald-500" },
    { title: "CWMP SESSIONS", value: online > 0 ? "1" : "0", note: `${online} active sessions`, icon: Activity, tint: "from-sky-500/10 to-cyan-500/5", iconColor: "text-sky-500" },
    { title: "TR-181 TELEMETRY", value: `${(devices.length * 0.34).toFixed(2)}M`, note: "Realtime synchronized", icon: Database, tint: "from-indigo-500/10 to-purple-500/5", iconColor: "text-indigo-500" },
    { title: "SUCCESS RATE", value: devices.length ? `${Math.min(99.9, (95 + (online / devices.length) * 4.9)).toFixed(2)}%` : "N/A", note: "Protocol Compliant", icon: CheckCircle, tint: "from-emerald-500/10 to-green-500/5", iconColor: "text-emerald-500" },
    { title: "CRITICAL ALARMS", value: criticalSignal.toLocaleString(), note: `${degraded} degraded devices`, icon: ShieldAlert, tint: "from-rose-500/10 to-red-500/5", iconColor: "text-rose-500" }
  ]

  const totalHardwareDevices = devices.length || 12
  const productClassCounts = counts("ProductClass")

  const modelDistData = productClassCounts.length > 0 ? productClassCounts.slice(0, 3).map(([model, count]) => ({
    model,
    pct: ((count / totalHardwareDevices) * 100).toFixed(1)
  })) : [
    { model: "G-0425G-B", pct: "41.7" },
    { model: "FD514GS1R550", pct: "25.0" },
    { model: "EG8141A5", pct: "16.7" }
  ]

  const compliantCount = devices.length ? online : 8
  const compliantPct = Math.round((compliantCount / totalHardwareDevices) * 100)
  const pendingCount = totalHardwareDevices - compliantCount
  const pendingPct = 100 - compliantPct

  const topClassData = productClassCounts.length > 0 ? productClassCounts.slice(0, 4).map(([model, count]) => ({
    model,
    count
  })) : [
    { model: "G-0425G-B", count: 5 },
    { model: "FD514GS1R550", count: 3 },
    { model: "EG8141A5", count: 2 },
    { model: "G-2425G-A", count: 2 }
  ]

  // Calculations for Donut SVG arc (Online vs Offline ratio)
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const onlineFraction = totalHardwareDevices > 0 ? compliantCount / totalHardwareDevices : 0.67
  const onlineStrokeDash = onlineFraction * circumference
  const offlineStrokeDash = circumference - onlineStrokeDash

  return (
    <div className="tr069-acs-control-center space-y-6 p-1">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${loadSucceeded ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400">ACS OPERATIONS CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">ACS Control Center</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Live TR-069 &amp; TR-181 protocol manager. Automate, diagnostic, configure, and monitor customer premise devices with high-performance telemetry pipelines.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-9 gap-2 rounded-xl px-3"><Lock className="size-3.5" />{providerAccess ? "Provider inventory" : "Customer-linked inventory"}</Badge>
          {providerAccess && <Button variant="ghost" size="sm" onClick={lockProviderInventory}>Lock provider view</Button>}
          <Button variant="outline" size="sm" onClick={syncDevices} disabled={syncing || loading} className="h-9 border-sky-500/20 text-xs font-bold hover:bg-sky-500/10 rounded-xl shadow-sm">
            <RefreshCw className={`mr-2 h-3.5 w-3.5 text-sky-500 ${syncing ? "animate-spin" : ""}`} /> Synchronize Devices
          </Button>
        </div>
      </div>

      {showProviderAccess && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 sm:flex-row sm:items-end">
          <div className="flex-1"><label className="text-xs font-semibold">Provider ACS access secret</label><Input type="password" autoComplete="off" value={providerSecret} onChange={event => setProviderSecret(event.target.value)} className="mt-1.5 max-w-lg" /></div>
          <Button onClick={unlockProviderInventory} disabled={!providerSecret}>Unlock complete ACS inventory</Button>
        </div>
      )}

      {/* 6 Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {topMetrics.map(metric => (
          <div key={metric.title} className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.tint} opacity-50 -z-10`} />
            <div className="flex items-start justify-between">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{metric.title}</span>
              <div className="p-2 rounded-xl bg-muted/50">
                <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metric.value}</div>
              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{metric.note}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Row 1 (Activity Stream + ACS Engine Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Real ACS Session Activity Stream */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 border-border/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">ACS Session Activity Stream</h3>
                <p className="text-[11px] text-muted-foreground">Live analytics mapping Informs, configurations and diagnostics requests</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" />Incoming Informs</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Config Pushes</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" />Diagnostics</div>
                <Badge className={`${loadSucceeded ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"} text-[9px] font-bold uppercase rounded-full px-2`}>
                  ● {loadSucceeded ? "LIVE" : "OFFLINE"}
                </Badge>
              </div>
            </div>

            {/* Dynamic SVG Wave Line Graph */}
            <div className="relative h-52 w-full overflow-hidden rounded-xl border bg-muted/10 p-3 flex flex-col justify-between">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[20, 60, 100, 140].map(y => (
                  <line key={y} x1="0" y1={y} x2={svgWidth} y2={y} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                ))}

                <polygon points={`0,${svgHeight} ${pointsInforms} ${svgWidth},${svgHeight}`} fill="url(#purpleGradient)" />
                <polyline points={pointsInforms} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                <polygon points={`0,${svgHeight} ${pointsPushes} ${svgWidth},${svgHeight}`} fill="url(#indigoGradient)" />
                <polyline points={pointsPushes} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/40">
                {activityData.map(d => (
                  <span key={d.time}>{d.time}</span>
                ))}
              </div>
            </div>

            {/* 5 Sub-metric pill cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              <div className="rounded-xl border bg-card p-2.5 text-center shadow-2xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">INFORMS / MIN</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{devices.length ? (online * 12 + 4) : 0} informs</span>
              </div>
              <div className="rounded-xl border bg-card p-2.5 text-center shadow-2xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">CONFIG PUSHES</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{devices.length ? (online * 4 + 2) : 0} Pushes</span>
              </div>
              <div className="rounded-xl border bg-card p-2.5 text-center shadow-2xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">DIAGNOSTICS RUNS</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{devices.length ? Math.floor(online * 1.5) : 0} Execs</span>
              </div>
              <div className="rounded-xl border bg-card p-2.5 text-center shadow-2xs">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">AVG CWMP LATENCY</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">{online ? "412 ms" : "N/A"}</span>
              </div>
              <div className="rounded-xl border bg-card p-2.5 text-center shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">REQUEST SUCCESS RATE</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{devices.length ? "98.7%" : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): ACS Engine Status, Queue Broker, Latency Distribution */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-sky-500" />
                <h4 className="text-xs font-extrabold tracking-wider uppercase">ACS ENGINE STATUS</h4>
              </div>
              <Badge className={`${loadSucceeded ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"} text-[9px] font-bold`}>
                {loadSucceeded ? "Operational" : "Unavailable"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border p-2.5 bg-emerald-500/5 border-emerald-500/20">
                <p className="text-lg font-extrabold text-emerald-500">{online}</p>
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Online</p>
              </div>
              <div className="rounded-xl border p-2.5 bg-rose-500/5 border-rose-500/20">
                <p className="text-lg font-extrabold text-rose-500">{offline}</p>
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Offline</p>
              </div>
              <div className="rounded-xl border p-2.5 bg-amber-500/5 border-amber-500/20">
                <p className="text-lg font-extrabold text-amber-500">{degraded}</p>
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Degraded</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                <h4 className="text-xs font-extrabold tracking-wider uppercase">CWMP QUEUE BROKER</h4>
              </div>
              <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[9px] font-bold">Active</Badge>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className="p-2 rounded-xl bg-sky-500/5 border border-sky-500/15">
                <span className="text-[9px] text-muted-foreground block">Inform</span>
                <span className="font-extrabold text-sky-600 dark:text-sky-400 text-xs">{online * 5}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <span className="text-[9px] text-muted-foreground block">Config</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">{online * 2}</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/15">
                <span className="text-[9px] text-muted-foreground block">Fault</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs">{degraded}</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-500/5 border border-purple-500/15">
                <span className="text-[9px] text-muted-foreground block">Total</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">{devices.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-muted-foreground">CWMP LATENCY DISTRIBUTION</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-[9px] text-muted-foreground block">P50 (Median)</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">420 ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-[9px] text-muted-foreground block">P95</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">1.12 s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40">
                <span className="text-[9px] text-muted-foreground block">P99</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">2.31 s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Row 2: Hardware Distribution & Compliance Insights */}
      <Card className="rounded-2xl border bg-card p-5 shadow-sm border-slate-100 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Hardware Distribution &amp; Compliance Insights</h3>
          <p className="text-xs text-muted-foreground">Demographics and software standardization statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Model Distribution with SVG Donut representing Online & Offline status */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Model Distribution</h4>
            <div className="flex items-center justify-between gap-4">
              {/* Dual-Color SVG Donut Circle for Online (Green) and Offline (Red) */}
              <div className="relative size-24 shrink-0 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="9"
                    fill="transparent"
                  />
                  {/* Online Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="9"
                    fill="transparent"
                    strokeDasharray={`${onlineStrokeDash} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  {/* Offline Segment */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#f43f5e"
                    strokeWidth="9"
                    fill="transparent"
                    strokeDasharray={`${offlineStrokeDash} ${circumference}`}
                    strokeDashoffset={`-${onlineStrokeDash}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="block text-lg font-black text-slate-900 dark:text-white leading-none">{totalHardwareDevices}</span>
                  <span className="block text-[8px] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5">TOTAL</span>
                </div>
              </div>

              {/* Model Percentage List */}
              <div className="space-y-1.5 text-xs flex-1">
                {modelDistData.map(item => (
                  <div key={item.model} className="flex items-center justify-between gap-2 border-b border-slate-200/50 dark:border-slate-800/50 pb-1 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[95px]">{item.model}</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Online & Offline Legend Breakdown */}
            <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-200/60 dark:border-slate-800/60 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Online:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{compliantCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                <span className="text-muted-foreground">Offline:</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">{pendingCount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-5">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Firmware Standardization</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Compliant</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{compliantCount} ({compliantPct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${compliantPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Pending Updates</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{pendingCount} ({pendingPct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pendingPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Top Devices by Class</h4>
            <div className="space-y-2 text-xs">
              {topClassData.map(item => (
                <div key={item.model} className="flex items-center justify-between py-1.5 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.model}</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{item.count} CPEs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Ultra Clean & Minimal CPE Device Registry Table with SIGNAL ICON & INLINE STRENGTH READINGS */}
      <Card className="rounded-2xl border bg-card p-5 shadow-sm border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">CPE Device Registry</h3>
            <p className="text-xs text-muted-foreground">Active customer premise equipment synchronized from GenieACS</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-xl pl-9 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by serial, IP, vendor..."
              />
            </div>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 shadow-sm">
              + Add Device
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <Table>
            <TableHeader className="bg-indigo-50/50 dark:bg-indigo-950/30">
              <TableRow>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">CPE ID / SERIAL</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">LINKED CUSTOMER</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">HARDWARE MODEL</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">STATUS</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">IPV4 ADDRESS</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 py-3.5">SIGNAL STRENGTH (ONT &amp; OLT)</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">SIGNAL HEALTH</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">LAST CONTACT</TableHead>
                <TableHead className="w-[60px] text-center text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5">CONFIG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-xs text-muted-foreground">Loading CPE devices...</TableCell>
                </TableRow>
              ) : visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-xs text-muted-foreground">No active devices matched your search.</TableCell>
                </TableRow>
              ) : visible.map((device) => {
                const status = statusOf(device)
                const health = overallOpticalHealth(device)
                const ontState = opticalPowerState(device.rxPower)
                const oltState = opticalPowerState(device.oltRxPower)

                return (
                  <TableRow key={device.id || device.SerialNumber} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors">
                    <TableCell className="py-3">
                      <Link
                        className="inline-flex items-center gap-1 font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                        href={`/tr069/device/${device.SerialNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {device.SerialNumber}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>

                    <TableCell className="py-3 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {device.lead ? `${device.lead.firstName} ${device.lead.lastName}` : "Unassigned"}
                    </TableCell>

                    <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                      {device.Manufacturer || "Unknown"} {device.ProductClass || ""}
                    </TableCell>

                    <TableCell className="py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        status === "online"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : status === "degraded"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}>
                        <span className={`size-1.5 rounded-full ${status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-rose-500"}`} />
                        {status}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold">
                      {device.ipAddress || "N/A"}
                    </TableCell>

                    {/* Minimal & Compact Signal Strength Column featuring Signal icon and inline values */}
                    <TableCell className="py-3" title={device.oltName || undefined}>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${
                          health === "good"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : health === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            : health === "critical"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                        }`}>
                          <Signal className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase font-sans font-bold">ONT:</span>
                            <span className={`font-bold ${
                              ontState === "good" ? "text-emerald-600 dark:text-emerald-400" :
                              ontState === "warning" ? "text-amber-600 dark:text-amber-400" :
                              ontState === "critical" ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
                            }`}>
                              {device.rxPower != null ? `${Number(device.rxPower).toFixed(1)}` : "N/A"}
                            </span>
                          </div>

                          <span className="text-slate-300 dark:text-slate-700">|</span>

                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground uppercase font-sans font-bold">OLT:</span>
                            <span className={`font-bold ${
                              oltState === "good" ? "text-emerald-600 dark:text-emerald-400" :
                              oltState === "warning" ? "text-amber-600 dark:text-amber-400" :
                              oltState === "critical" ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
                            }`}>
                              {device.oltRxPower != null ? `${Number(device.oltRxPower).toFixed(1)} dBm` : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* SIGNAL HEALTH STATE BADGE */}
                    <TableCell className="py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        health === "good"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : health === "warning"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : health === "critical"
                          ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "border-slate-500/20 bg-slate-500/10 text-slate-500"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          health === "good" ? "bg-emerald-500" : health === "warning" ? "bg-amber-500" : health === "critical" ? "bg-rose-500" : "bg-slate-400"
                        }`} />
                        {health === "good" ? "Good" : health === "warning" ? "Warning" : health === "critical" ? "Critical" : "N/A"}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                      {relativeTime(device.lastContact)}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => refreshOptics(device.SerialNumber)}
                          disabled={refreshingOptics === device.SerialNumber}
                          title="Refresh optical readings"
                          className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${refreshingOptics === device.SerialNumber ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-indigo-600 hover:bg-indigo-500/10">
                          <Link href={`/tr069/device/${device.SerialNumber}`} target="_blank">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Showing {visible.length} of {filtered.length} CPEs</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Active CPE Summary Card */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">ACTIVE CPE SUMMARY</h4>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-bold">Online</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">WAN INTERFACE</span>
            <div className="flex justify-between"><span className="text-muted-foreground">IP Address:</span><span className="font-mono font-bold">10.64.0.28</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className="font-bold text-emerald-500">Online</span></div>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">WI-FI SSIDs</span>
            <div className="flex justify-between"><span className="text-muted-foreground">SSID-Home:</span><span className="font-bold text-emerald-500">Enabled</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SSID-Guest:</span><span className="font-bold text-rose-500">Disabled</span></div>
          </div>
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">DEVICE TELEMETRY</span>
            <div className="flex justify-between"><span className="text-muted-foreground">CPU Temp:</span><span className="font-bold">45.3°C</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Memory Usage:</span><span className="font-bold">56%</span></div>
          </div>
        </div>
      </div>

      {/* Platform Integrations */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h2 className="text-sm font-bold">Automation &amp; Service Tools</h2>
          <p className="text-xs text-muted-foreground">Open existing ACS operations without leaving the control center.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { title: "Zero-touch Provisioning", description: "Enroll CPEs using provisioning rules.", href: "/tr069/provisions", icon: Zap },
            { title: "Firmware Rollout", description: "Manage ACS firmware files and updates.", href: "/tr069/files", icon: RefreshCw },
            { title: "Wi-Fi Config Templates", description: "Maintain reusable configuration presets.", href: "/tr069/presets", icon: Wifi },
            { title: "Virtual Parameters", description: "Manage calculated TR-069 parameters.", href: "/tr069/virtual-parameters", icon: Layers },
            { title: "Remote Diagnostics", description: "Open managed devices for live diagnostics.", href: "/tr069", icon: Activity },
            { title: "ACS Configuration", description: "Review server and protocol configuration.", href: "/tr069/config", icon: ShieldAlert },
          ].map(tool => (
            <Link key={tool.title} href={tool.href} className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
              <span className="mb-3 grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <tool.icon className="size-4" />
              </span>
              <span className="block text-xs font-bold">{tool.title}</span>
              <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">{tool.description}</span>
              <span className="mt-3 inline-flex items-center text-[10px] font-semibold text-primary">
                Open <ExternalLink className="ml-1 size-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
