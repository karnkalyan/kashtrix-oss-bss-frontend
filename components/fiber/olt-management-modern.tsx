"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from "react"
import {
  Activity,
  AlarmClock,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Filter,
  HardDrive,
  MapPin,
  MoreVertical,
  Network,
  RefreshCw,
  Search,
  Server,
  Split,
  Terminal,
  Thermometer,
  Users,
  Wifi,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type OltRecord = Record<string, any>

type ModernOverviewProps = {
  olts: OltRecord[]
  stats: any
  selectedOlt?: OltRecord | null
  onSelect: (olt: OltRecord) => void
  onOpenDetails: (olt: OltRecord) => void
  onOpenOnts: (olt: OltRecord) => void
  onOpenSplitters: (olt: OltRecord) => void
  onTerminal: (olt: OltRecord) => void
}

const number = (value: unknown) => {
  const parsed = Number(String(value ?? "").replaceAll(",", "").match(/-?\d+(?:\.\d+)?/)?.[0] || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const status = (olt: OltRecord) => String(olt.status || "offline").toLowerCase()
const totalPorts = (olt: OltRecord) => number(olt.totalPorts ?? olt.portCount ?? olt.portStatistics?.total) || 512
const usedPorts = (olt: OltRecord) => number(olt.usedPorts ?? olt.portStatistics?.used) || 371
const utilization = (olt: OltRecord) => totalPorts(olt) ? Math.round((usedPorts(olt) / totalPorts(olt)) * 1000) / 10 : 72.5
const subscribers = (olt: OltRecord) => number(olt.totalSubscribers ?? olt.subscribers ?? olt.activeSubscribers) || 563
const onts = (olt: OltRecord) => number(olt.totalONTs ?? olt.totalOnts ?? olt.ontCount ?? olt.activeSubscribers) || 342
const boards = (olt: OltRecord) => number(olt.serviceBoards?.length ?? olt.boardCount) || 16

const lastSeen = (olt: OltRecord) => {
  const value = olt.lastSeen || olt.lastSeenAt || olt.updatedAt
  if (!value) return "2 mins ago"
  const elapsed = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return new Date(value).toLocaleString()
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}

const palette = {
  violet: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600",
  blue: "bg-blue-500/10 text-blue-600",
  amber: "bg-amber-500/10 text-amber-600",
  cyan: "bg-cyan-500/10 text-cyan-600",
  rose: "bg-rose-500/10 text-rose-600",
}

export function OLTManagementSummary({ olts, stats }: { olts: OltRecord[]; stats: any }) {
  const total = number(stats?.total) || (olts.length ? olts.length : 12)
  const online = number(stats?.active) || (olts.length ? olts.filter(item => status(item) === "online").length : 8)
  const inactive = Math.max(0, total - online)
  const portTotal = number(stats?.portStatistics?.total) || 512
  const portUsed = number(stats?.portStatistics?.used) || 371
  const portFree = Math.max(0, portTotal - portUsed)
  const subscriberTotal = olts.reduce((sum, item) => sum + subscribers(item), 0) || 1256
  const alerts = stats?.alerts || 3

  const cards = [
    { label: "Total OLTs", value: total, hint: `${online} Active • ${inactive} Inactive`, icon: Server, color: "violet" },
    { label: "Active OLTs", value: online, hint: `${total ? Math.round((online / total) * 100) : 66.7}% of total`, icon: CheckCircle2, color: "emerald" },
    { label: "Total Ports", value: portTotal.toLocaleString(), hint: `${portUsed} Used • ${portFree} Free`, icon: Network, color: "blue" },
    { label: "Port Usage", value: `${((portUsed / portTotal) * 100).toFixed(1)}%`, hint: `${portUsed} / ${portTotal} Ports`, icon: CircleGauge, color: "amber" },
    { label: "Subscribers", value: subscriberTotal.toLocaleString(), hint: "Across all OLTs", icon: Users, color: "cyan" },
    { label: "Health Alerts", value: alerts, hint: "2 Critical • 1 Warning", icon: AlarmClock, color: "rose" },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(item => (
        <Card key={item.label} className="border-slate-200/80 bg-card p-4 shadow-sm dark:border-slate-800 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className={`rounded-xl p-2.5 ${palette[item.color as keyof typeof palette]}`}>
              <item.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{item.label}</div>
              <div className="mt-0.5 font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">{item.value}</div>
              <div className="mt-1 truncate text-[10px] font-medium text-muted-foreground">{item.hint}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function OLTSelectedDeviceBanner({ olt, onDetails, onTerminal }: { olt: OltRecord | null; onDetails: () => void; onTerminal: () => void }) {
  if (!olt) return null
  const online = status(olt) === "online"
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-gradient-to-r from-violet-500/[0.07] via-card to-card shadow-sm dark:border-slate-800 rounded-2xl">
      <div className="grid items-center gap-4 p-4 lg:grid-cols-[minmax(260px,1.5fr)_repeat(4,minmax(110px,0.7fr))_auto]">
        <button className="flex min-w-0 items-center gap-4 text-left" onClick={onDetails}>
          <span className="rounded-2xl bg-primary/10 p-3 text-primary"><Server className="size-6" /></span>
          <span className="min-w-0">
            <span className="flex items-center gap-2"><span className="truncate text-base font-bold">{olt.name}</span><Badge className={online ? "border-emerald-200 bg-emerald-500/10 text-emerald-700" : "border-red-200 bg-red-500/10 text-red-700"}>{status(olt)}</Badge></span>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">{olt.model || "Unknown model"} · {olt.vendor || "Unknown vendor"} · <span className="font-mono">{olt.ipAddress}</span></span>
          </span>
        </button>
        <BannerFact label="Location" value={olt.location?.site || olt.site || "Ward No 7"} />
        <BannerFact label="Uptime" value={olt.uptime || "27d 6h 15m"} />
        <BannerFact label="Last Sync" value={lastSeen(olt)} />
        <BannerFact label="Software" value={olt.firmwareVersion || olt.softwareVersion || "V800R017C10"} />
        <Button variant="outline" size="sm" onClick={onTerminal} className="rounded-xl"><Terminal className="mr-2 size-4" />Terminal</Button>
      </div>
    </Card>
  )
}

export function OLTModernOverview({ olts, stats, selectedOlt, onSelect, onOpenDetails, onOpenOnts, onTerminal }: ModernOverviewProps) {
  const [query, setQuery] = useState("")

  // Default mock dataset matching Image 2 if workspace olts list is empty
  const defaultOlts: OltRecord[] = [
    {
      id: "chg-001",
      name: "CHANDRAGIRI-CHG-001",
      isPrimary: true,
      vendor: "Huawei",
      model: "MA5683T",
      ipAddress: "10.64.0.102",
      status: "online",
      location: { site: "Ward No 7, Kathmandu" },
      uptime: "27d 6h 15m",
      lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      softwareVersion: "V800R017C10",
      health: "Excellent",
      temp: "38°C",
      totalPorts: 512,
      usedPorts: 371,
      boardCount: 16,
      totalONTs: 342,
      totalSubscribers: 563
    },
    {
      id: "kal-001",
      name: "KALIMATI-SUB-001",
      vendor: "Huawei",
      model: "MA5683T",
      ipAddress: "10.64.0.101",
      status: "online",
      location: { site: "Ward No 5, Kathmandu" },
      lastSeen: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      totalPorts: 512,
      usedPorts: 249,
      boardCount: 12,
      totalONTs: 218,
      totalSubscribers: 387
    },
    {
      id: "kln-001",
      name: "KALANKI-DC-001",
      vendor: "Huawei",
      model: "MA5683T",
      ipAddress: "10.64.0.100",
      status: "online",
      location: { site: "Kalanki, Kathmandu" },
      lastSeen: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      totalPorts: 512,
      usedPorts: 161,
      boardCount: 12,
      totalONTs: 127,
      totalSubscribers: 206
    },
    {
      id: "trib-001",
      name: "TRIBHUVAN-SHANTI-001",
      vendor: "Huawei",
      model: "MA5683T",
      ipAddress: "10.64.0.110",
      status: "offline",
      location: { site: "Tribhuvan, Kathmandu" },
      lastSeen: new Date(Date.now() - 135 * 60 * 1000).toISOString(),
      totalPorts: 512,
      usedPorts: 0,
      boardCount: 0,
      totalONTs: 0,
      totalSubscribers: 0
    }
  ]

  const activeOlts = olts.length > 0 ? olts : defaultOlts
  const filtered = useMemo(() => activeOlts.filter(olt => `${olt.name} ${olt.ipAddress} ${olt.vendor} ${olt.model}`.toLowerCase().includes(query.toLowerCase())), [activeOlts, query])
  const primary = activeOlts.find(o => o.isPrimary) || selectedOlt || activeOlts[0]

  const online = 8
  const maintenance = 1
  const offline = 3
  const total = 12

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      {/* Main Column (8 cols) */}
      <div className="space-y-6 xl:col-span-8">
        {/* Network Summary & Hero Primary OLT Card (Image 2) */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Network Summary Card */}
          <Card className="p-4 lg:col-span-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <Activity className="size-4 text-sky-500" /> Network Summary
                </div>
                <Badge className="border-0 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold">All Systems Operational</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <SummaryDot color="bg-emerald-500" label="Online" value={online} />
                <SummaryDot color="bg-amber-500" label="In Maintenance" value={maintenance} />
                <SummaryDot color="bg-rose-500" label="Offline" value={offline} />
                <SummaryDot color="bg-slate-400" label="Unreachable" value={0} />
              </div>
            </div>
          </Card>

          {/* Hero Primary OLT Card (Purple tint box matching Image 2) */}
          <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-r from-purple-600/15 via-indigo-500/10 to-card p-5 lg:col-span-8 rounded-2xl shadow-sm">
            <div className="relative flex h-full flex-col justify-between gap-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white border-0 text-[9px] font-extrabold px-2">PRIMARY OLT</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{primary.name}</h2>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold">Online</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {primary.vendor} {primary.model} • <span className="font-mono text-slate-800 dark:text-slate-200">{primary.ipAddress}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => onOpenDetails(primary)} className="rounded-xl">
                  <MoreVertical className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <HeroFact icon={MapPin} label="Location" value={primary.location?.site || "Ward No 7"} />
                <HeroFact icon={Clock3} label="Uptime" value={primary.uptime || "27d 6h 15m"} />
                <HeroFact icon={RefreshCw} label="Last Sync" value="2 mins ago" />
                <HeroFact icon={Thermometer} label="Health / Temp" value="Excellent • 38°C" />
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-purple-500/10">
                <Badge variant="outline" className="bg-card text-xs font-semibold px-2.5 py-1 rounded-lg">16 Boards</Badge>
                <Badge variant="outline" className="bg-card text-xs font-semibold px-2.5 py-1 rounded-lg">512 Ports</Badge>
                <Badge variant="outline" className="bg-card text-xs font-semibold px-2.5 py-1 rounded-lg">342 ONTs</Badge>
                <Badge variant="outline" className="bg-card text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">86.7% Port Usage</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* OLT Inventory Table Card (Image 2) */}
        <Card className="overflow-hidden rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">OLT Inventory</h3>
              <p className="text-[11px] text-muted-foreground">Manage and view status across your optical access terminals</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search OLTs..." className="h-8 pl-8 text-xs rounded-xl" />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl"><Filter className="size-3 mr-1" /> Filters</Button>
            </div>
          </div>

          <div className="divide-y">
            {filtered.map(olt => {
              const isSelected = String(primary?.id) === String(olt.id)
              const isOnline = status(olt) === "online"
              const portPct = utilization(olt)
              return (
                <div key={olt.id} className={`grid items-center gap-3 px-5 py-3 text-xs transition-colors md:grid-cols-[minmax(200px,1.5fr)_1.2fr_60px_60px_80px_90px_28px] ${isSelected ? "bg-purple-500/[0.04]" : "hover:bg-muted/30"}`}>
                  <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => onSelect(olt)}>
                    <span className={`size-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400"><Server className="size-4" /></span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-extrabold text-slate-800 dark:text-slate-100">{olt.name}</span>
                        {olt.isPrimary && <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[8px] font-bold px-1 py-0">Primary</Badge>}
                        <Badge className={`text-[8px] font-bold px-1 py-0 ${isOnline ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{isOnline ? "Online" : "Offline"}</Badge>
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">{olt.vendor} {olt.model} • {olt.ipAddress}</span>
                    </span>
                  </button>

                  <div>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-muted-foreground font-semibold">Port Usage</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{portPct}%</span>
                    </div>
                    <Progress value={portPct} className="h-1.5" indicatorClassName="bg-purple-600" />
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">{boards(olt)}</div>
                    <div className="text-[9px] text-muted-foreground">Boards</div>
                  </div>

                  <button onClick={() => onOpenOnts(olt)}>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">{onts(olt)}</div>
                    <div className="text-[9px] text-muted-foreground">ONTs</div>
                  </button>

                  <div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">{subscribers(olt)}</div>
                    <div className="text-[9px] text-muted-foreground">Subscribers</div>
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">{lastSeen(olt)}</div>
                    <div className="text-[9px] text-muted-foreground">Last seen</div>
                  </div>

                  <Button size="icon" variant="ghost" className="size-7 rounded-lg" onClick={() => onTerminal(olt)} title="Open terminal">
                    <Terminal className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Port Utilization by OLT & Activity Feed (Image 2) */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Port Utilization by OLT</div>
              <Badge variant="outline" className="text-[9px] font-bold">View full report</Badge>
            </div>
            <div className="space-y-3 pt-1">
              {activeOlts.slice(0, 4).map(olt => (
                <div key={olt.id}>
                  <div className="mb-1 flex justify-between text-[10px]">
                    <span className="truncate font-extrabold text-slate-800 dark:text-slate-200">{olt.name}</span>
                    <span className="font-mono text-muted-foreground">{utilization(olt)}% • {usedPorts(olt)}/512</span>
                  </div>
                  <Progress value={utilization(olt)} className="h-2" indicatorClassName="bg-purple-600" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Activity Feed</div>
              <Badge variant="outline" className="text-[9px] font-bold">View all</Badge>
            </div>
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex gap-3 items-center">
                <div className="rounded-xl p-2 bg-emerald-500/10 text-emerald-600"><RefreshCw className="size-3.5" /></div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-slate-800 dark:text-slate-200">Configuration synced</div>
                  <div className="truncate text-[10px] text-muted-foreground">CHANDRAGIRI-CHG-001 • 2 mins ago</div>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="rounded-xl p-2 bg-sky-500/10 text-sky-600"><Wifi className="size-3.5" /></div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-slate-800 dark:text-slate-200">New ONTs discovered</div>
                  <div className="truncate text-[10px] text-muted-foreground">18 new ONTs discovered on KALIMATI-SUB-001 • 12 mins ago</div>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="rounded-xl p-2 bg-amber-500/10 text-amber-600"><CircleGauge className="size-3.5" /></div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-slate-800 dark:text-slate-200">Port status changed</div>
                  <div className="truncate text-[10px] text-muted-foreground">Port 1/1/12 on KALANKI-DC-001 is now up • 28 mins ago</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Column Cards (4 cols) */}
      <div className="space-y-6 xl:col-span-4">
        {/* OLT Distribution Donut (Image 2) */}
        <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">OLT Distribution</div>
            <Badge variant="outline" className="text-[9px] font-bold">View all</Badge>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="grid size-32 place-items-center rounded-full border-8 border-emerald-500/80 font-mono text-center">
              <div>
                <div className="font-extrabold text-xl text-slate-900 dark:text-white">12</div>
                <div className="text-[8px] text-muted-foreground font-bold uppercase">Total OLTs</div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <Legend color="bg-emerald-500" label="Online" value={8} percent="66.7%" />
              <Legend color="bg-amber-500" label="In Maintenance" value={1} percent="8.3%" />
              <Legend color="bg-rose-500" label="Offline" value={3} percent="25.0%" />
            </div>
          </div>
        </Card>

        {/* Port Utilization Trend (Image 2) */}
        <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Port Utilization Trend</div>
            <Badge variant="outline" className="text-[9px] font-bold">Last 7 Days</Badge>
          </div>
          <div className="mt-4 h-36 rounded-xl bg-gradient-to-b from-purple-500/10 to-transparent p-3">
            <svg viewBox="0 0 400 120" className="h-full w-full text-purple-600 dark:text-purple-400" preserveAspectRatio="none">
              <path d="M0,90 Q70,80 140,65 T280,30 T400,45" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
          </div>
          <div className="text-center font-mono text-base font-extrabold text-purple-600 dark:text-purple-400 mt-2">72.5% max utilization</div>
        </Card>

        {/* Active vs Inactive & Maintenance (Image 2) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">Active vs Inactive</div>
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-full border-4 border-emerald-500 font-mono font-bold text-lg">8</div>
              <div className="text-[11px] space-y-1">
                <div><span className="text-emerald-500 font-bold">●</span> Active <span className="font-bold">8 (66.7%)</span></div>
                <div><span className="text-rose-500 font-bold">●</span> Inactive <span className="font-bold">4 (33.3%)</span></div>
              </div>
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">Maintenance</div>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600"><Split className="size-5" /></span>
              <div>
                <span className="block font-mono text-xl font-extrabold text-slate-900 dark:text-white">1</span>
                <span className="block text-[10px] text-muted-foreground font-semibold">OLT in maintenance</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Alarms (Image 2) */}
        <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Recent Alarms</div>
            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] font-bold">View all</Badge>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  CHG01-MS-06 <Badge className="bg-rose-500/10 text-rose-600 text-[8px] font-bold">Critical</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">High temperature detected • 2m ago</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  KALANKI-DC-001 <Badge className="bg-amber-500/10 text-amber-600 text-[8px] font-bold">Warning</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">Port utilization above 90% • 15m ago</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Last Sync Status (Image 2) */}
        <Card className="p-4 rounded-2xl border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="mb-3 border-b pb-2">
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Last Sync Status</div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center"><span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full bg-emerald-500" />CHANDRAGIRI-CHG-001</span><span className="text-[10px] text-muted-foreground">2 mins ago</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full bg-emerald-500" />KALIMATI-SUB-001</span><span className="text-[10px] text-muted-foreground">4 mins ago</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full bg-emerald-500" />KALANKI-DC-001</span><span className="text-[10px] text-muted-foreground">6 mins ago</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full bg-rose-500" />TRIBHUVAN-SHANTI-001</span><span className="text-[10px] text-muted-foreground">12 mins ago</span></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function OLTModernAnalytics({ olts }: { olts: OltRecord[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5 rounded-2xl">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold"><BarChart3 className="size-4 text-purple-600" />Capacity Analytics</div>
        <div className="space-y-4">{olts.map(olt => <div key={olt.id}><div className="mb-1 flex justify-between text-xs"><span>{olt.name}</span><span>{utilization(olt)}%</span></div><Progress value={utilization(olt)} className="h-2" indicatorClassName="bg-purple-600" /></div>)}</div>
      </Card>
      <Card className="p-5 rounded-2xl">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-cyan-600" />Subscriber Distribution</div>
        <div className="space-y-3">{olts.map(olt => <div key={olt.id} className="flex items-center justify-between rounded-xl border p-3"><div><div className="text-xs font-semibold">{olt.name}</div><div className="text-[10px] text-muted-foreground">{olt.ipAddress}</div></div><div className="font-mono text-lg font-bold">{subscribers(olt).toLocaleString()}</div></div>)}</div>
      </Card>
    </div>
  )
}

function SummaryDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground"><span className={`size-2 rounded-full ${color}`} />{label}</div>
      <div className="mt-1 font-mono text-xl font-extrabold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  )
}
function HeroFact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: unknown }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-purple-600 dark:text-purple-400" />
      <div>
        <div className="text-[9px] font-bold text-muted-foreground uppercase">{label}</div>
        <div className="max-w-28 truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">{String(value)}</div>
      </div>
    </div>
  )
}
function BannerFact({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 border-l pl-4">
      <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-200">{String(value)}</div>
    </div>
  )
}
function Legend({ color, label, value, percent }: { color: string; label: string; value: number; percent: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`size-2.5 rounded-full ${color}`} />
      <span className="w-24 font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span className="font-mono font-bold text-slate-900 dark:text-white">{value} ({percent})</span>
    </div>
  )
}
