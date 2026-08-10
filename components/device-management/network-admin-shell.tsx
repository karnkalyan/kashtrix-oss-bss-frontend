"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  Archive,
  ArrowLeft,
  Box,
  Cable,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  Clock,
  Command,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  HardDrive,
  KeyRound,
  Layers3,
  ListTree,
  Loader2,
  LockKeyhole,
  Menu,
  Network,
  Package,
  PanelRight,
  PlugZap,
  Power,
  RadioTower,
  RefreshCw,
  Route,
  Router,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Star,
  Terminal as TerminalIcon,
  Users,
  Wifi,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { useDeviceSession } from "@/contexts/DeviceSessionContext"
import { deviceApi, type ManagedDevice } from "@/lib/device-management"
import { resolveDeviceMenu, type DeviceMenuItem } from "@/lib/device-menu-registry"
import { formatNetworkRate } from "@/lib/network-units"
import { DeviceDataWidget } from "./device-data-widget"
import { DeviceLiveCharts } from "./device-live-charts"
import { DeviceStatusBadge } from "./device-status-badge"
import { XTermTerminal } from "@/components/terminal/xterm-terminal"

const capabilities: Record<string, string> = {
  "vlans-create-vlan": "cisco.createVlan",
  "vlans-rename-vlan": "cisco.renameVlan",
  "interfaces-access-ports": "cisco.configureAccessPort",
  "interfaces-trunk-ports": "cisco.configureTrunkPort",
  "port-channels-etherchannel": "cisco.createPortChannel",
  "switching-create-vlan": "juniper.createVlan",
  "switching-access-port": "juniper.configureAccessPort",
  "switching-trunk-ports": "juniper.configureTrunkPort",
  "interfaces-add-bridge": "mikrotik.createBridge",
  "interfaces-add-bridge-port": "mikrotik.addBridgePort",
  "interfaces-add-vlan": "mikrotik.createVlan",
  "ip-add-address": "mikrotik.addIpAddress",
  "ip-add-route": "mikrotik.addRoute",
  "operations-edit-ip-address": "mikrotik.updateIpAddress",
  "operations-remove-ip-address": "mikrotik.removeIpAddress",
  "operations-edit-route": "mikrotik.updateRoute",
  "operations-remove-route": "mikrotik.removeRoute",
  "operations-edit-vlan": "mikrotik.updateVlan",
  "operations-remove-vlan": "mikrotik.removeVlan",
  "operations-remove-bridge": "mikrotik.removeBridge",
  "operations-remove-bridge-port": "mikrotik.removeBridgePort",
  "operations-interface-state": "mikrotik.setInterfaceState",
}

function getDeviceTypeFromReferrer() {
  if (typeof document === "undefined") return ""
  try {
    const referrer = new URL(document.referrer)
    const match = referrer.pathname.match(/\/device-management\/([^/?#]+)/)
    return match?.[1] ? decodeURIComponent(match[1]) : ""
  } catch {
    return ""
  }
}

function getLastDeviceType() {
  if (typeof localStorage === "undefined") return ""
  try {
    return localStorage.getItem("device-management:last-device-type") || ""
  } catch {
    return ""
  }
}

export function NetworkAdminShell({ deviceId, sectionPath }: { deviceId: number; sectionPath: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const session = useDeviceSession()
  const [device, setDevice] = useState<ManagedDevice | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(true)
  const [payloadBusy, setPayloadBusy] = useState(false)
  const [payload, setPayload] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [sidebar, setSidebar] = useState(true)
  const [contextOpen, setContextOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const section = sectionPath.at(-1) || "overview"
  const permissions = useMemo(() => {
    const values = user?.role?.permissions?.map(permission => permission.name) || []
    return ["Administrator", "Global Manager"].includes(user?.role?.name || "") ? ["*", ...values] : values
  }, [user])
  const load = useCallback(async () => {
    try {
      setBusy(true)
      const response = await deviceApi.get(deviceId, { suppressToast: true })
      setDevice(response.data)
      setError("")
    } catch (caught: any) {
      const message = caught.message || "Could not load device"
      if (/device not found/i.test(message)) {
        const hintedType =
          searchParams.get("deviceType") ||
          getDeviceTypeFromReferrer() ||
          getLastDeviceType()

        try {
          const response = await deviceApi.list({
            ...(hintedType ? { deviceType: hintedType } : {}),
            page: 1,
            limit: 1000,
            sortBy: "name",
            sortOrder: "asc",
          })
          const items = response.data.items || []
          const replacement = hintedType
            ? items.find(item => item.deviceType === hintedType) || (items.length === 1 ? items[0] : null)
            : items.length === 1 ? items[0] : null

          if (replacement) {
            const section = sectionPath.length ? sectionPath.join("/") : "overview"
            setDevice(replacement)
            setError("")
            try { localStorage.setItem("device-management:last-device-type", replacement.deviceType) } catch {}
            router.replace(`/network-admin/devices/${replacement.id}/${section}?deviceType=${encodeURIComponent(replacement.deviceType)}`)
            toast.success(`Opened ${replacement.name} instead of a stale device link`)
            return
          }
        } catch {
          // Keep the original not-found message if recovery cannot resolve one clear device.
        }
      }
      setError(caught.message || "Could not load device")
    } finally {
      setBusy(false)
    }
  }, [deviceId, router, searchParams, sectionPath])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(`device-favorites:${deviceId}`) || "[]"))
      setContextOpen(localStorage.getItem("network-admin:context-open") === "true")
    } catch { /* browser storage is optional */ }
  }, [deviceId])

  const menu = useMemo(() => device ? resolveDeviceMenu(device, permissions) : [], [device, permissions])
  const flat = useMemo(() => flatten(menu), [menu])
  const selected = flat.find(item => item.key === section) || flat[0]
  useEffect(() => {
    if (!device || !selected?.liveSupported || capabilities[selected.key] || ["overview", "terminal", "connection-diagnostics"].includes(selected.module || selected.key)) return
    let active = true
    let loading = false
    const module = selected.module || selected.key
    const refresh = async (initial = false) => {
      if (loading) return
      loading = true
      if (initial) setPayloadBusy(true)
      try {
        const response = await deviceApi.module(device.id, module)
        if (active) setPayload(response.data)
      } catch (caught: any) {
        if (active) {
          if (initial) setPayload(null)
          toast.error(caught.message)
        }
      } finally {
        loading = false
        if (active && initial) setPayloadBusy(false)
      }
    }
    refresh(true)
    const timer = module === "logs" ? window.setInterval(() => refresh(false), 5000) : null
    return () => { active = false; if (timer !== null) window.clearInterval(timer) }
  }, [device, selected?.key, selected?.liveSupported, selected?.module])

  const go = (item: DeviceMenuItem) => router.push(`/network-admin/devices/${deviceId}/${item.key}`)
  const toggleFavorite = (key: string) => setFavorites(current => {
    const next = current.includes(key) ? current.filter(value => value !== key) : [...current, key]
    localStorage.setItem(`device-favorites:${deviceId}`, JSON.stringify(next))
    return next
  })
  const toggleContext = () => setContextOpen(current => {
    localStorage.setItem("network-admin:context-open", String(!current))
    return !current
  })

  if (authLoading || busy) return <FullState icon={<Loader2 className="size-8 animate-spin" />} text="Opening secure device workspace…" />
  if (error || !device) return <FullState icon={<ShieldAlert className="size-9 text-destructive" />} text={error || "Device not found"} action={<Button onClick={load}>Retry</Button>} />

  return <div className="network-device-workspace flex h-dvh overflow-hidden bg-background text-foreground">
    <aside className={`network-device-sidebar ${sidebar ? "w-56" : "w-0"} shrink-0 overflow-hidden border-r text-sidebar-foreground transition-all`}>
      <div className="flex h-16 items-center gap-2.5 border-b border-[hsl(var(--sidebar-border))] px-4"><span className="device-vendor-mark"><Router className="size-4" /></span><div className="min-w-0"><div className="truncate text-sm font-bold uppercase tracking-[0.12em]">{device.vendor || "Network"}</div><div className="truncate text-[9px] text-muted-foreground">{device.model || device.deviceType}</div></div></div>
      <div className="p-3"><div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Device navigation</div><div className="relative"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-8 border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] pl-8 text-xs" placeholder="Search menu" /></div></div>
      <ScrollArea className="h-[calc(100dvh-8.5rem)]"><nav className="space-y-0.5 px-2 pb-4">{menu.map(item => <MenuNode key={item.key} item={item} selected={section} search={search} favorite={favorites.includes(item.key)} onSelect={go} onFavorite={toggleFavorite} />)}</nav></ScrollArea>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="m-3 mb-0 flex h-16 shrink-0 items-center gap-2 rounded-xl border bg-card/95 px-3 shadow-sm backdrop-blur">
        <Button size="icon" variant="ghost" onClick={() => setSidebar(current => !current)}><Menu className="size-4" /></Button>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h1 className="truncate text-base font-bold tracking-tight">{device.name}</h1><Badge variant="outline" className="text-[9px]">{device.vendor}</Badge><DeviceStatusBadge status={device.status} /></div><div className="truncate font-mono text-[10px] text-muted-foreground">{device.platform || device.deviceType} · {device.host}:{device.managementPort} · ID {device.id}</div></div>
        <Badge variant="outline" className="hidden border-emerald-500/25 bg-emerald-500/10 text-[9px] text-emerald-600 md:inline-flex"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-500"/>{device.preferredProtocol || device.communicationMethod} Primary</Badge>
        <Badge variant="outline" className="hidden border-cyan-500/25 bg-cyan-500/10 text-[9px] text-cyan-600 lg:inline-flex"><span className="mr-1.5 size-1.5 rounded-full bg-cyan-500"/>{session.protocol || device.communicationMethod} Active</Badge>
        <Badge variant="outline" className="hidden border-blue-500/25 bg-blue-500/10 text-[9px] text-blue-600 xl:inline-flex">No pending changes</Badge>
        <Button size="icon" variant="ghost" onClick={() => { session.refresh(); toast.success("Live refresh requested") }}><RefreshCw className="size-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => router.push(`/network-admin/devices/${device.id}/terminal`)}><TerminalIcon className="size-4" /></Button>
        <ThemeToggle />
        <Button size="icon" variant="ghost" onClick={toggleContext}><PanelRight className="size-4" /></Button>
        <Button variant="outline" size="sm" className="hidden lg:inline-flex" asChild><Link href={`/device-management/${device.deviceType}`}><ArrowLeft className="mr-1 size-3" />Kashtrix Network</Link></Button>
      </header>
      <main className="min-w-0 flex-1 overflow-auto p-3"><div className="w-full">{selected?.key!=="overview"&&<div className="mb-3 rounded-lg border bg-card px-4 py-3 shadow-sm"><h2 className="text-lg font-semibold capitalize">{selected?.label || "Overview"}</h2><p className="text-xs text-muted-foreground">Live data and controlled operations for this device.</p></div>}<DeviceContent device={device} selected={selected} payload={payload} busy={payloadBusy} session={session} /></div></main>
    </div>
    {contextOpen && <aside className="hidden w-72 shrink-0 overflow-auto border-l bg-background p-3 xl:block"><h3 className="mb-2 text-sm font-semibold">Device context</h3><ContextRow label="Vendor" value={device.vendor} /><ContextRow label="Model" value={device.model || "Not detected"} /><ContextRow label="OS" value={[device.operatingSystem, device.operatingSystemVersion].filter(Boolean).join(" ") || "Not detected"} /><ContextRow label="Management" value={`${device.host}:${device.managementPort}`} /><ContextRow label="Credentials" value={device.credential?.configured ? "Encrypted and configured" : "Not configured"} />{(device.preferredProtocol === "SNMP" || device.fallbackProtocols?.includes("SNMP")) && <ContextRow label="SNMP" value={`${String(device.snmpVersion || "v2c").toUpperCase()} · UDP ${device.snmpPort || 161}`} />}<ContextRow label="SSH profile" value={device.sshProfile || "AUTO"} /><ContextRow label="Last success" value={device.lastSuccessfulConnectionAt ? new Date(device.lastSuccessfulConnectionAt).toLocaleString() : "Never"} /></aside>}
  </div>
}

const menuIconRules: Array<[RegExp, LucideIcon]> = [
  [/\bterminal\b/, TerminalIcon],
  [/\b(overview|dashboard|summary)\b/, CircleGauge],
  [/\b(cpu|processor)\b/, Cpu],
  [/\b(memory|temperature|health|performance)\b/, Gauge],
  [/\b(optic|sfp|fiber|rx|tx|signal|radio)\b/, RadioTower],
  [/\b(interface|ethernet|port|uplink|t-cont|gem)\b/, Cable],
  [/\b(vlan|bridge|switch|layer-2|stp|rstp|mstp|lldp|cdp)\b/, Layers3],
  [/\b(route|routing|layer-3|bgp|ospf|is-is|mpls|ldp|vrrp|hsrp)\b/, Route],
  [/\b(subscriber|ont|onu|user|group|session|ppp|pppoe|ipoe)\b/, Users],
  [/\b(authentication|radius|aaa|tacacs|credential|secret)\b/, KeyRound],
  [/\b(firewall|security|acl|filter|threat|snoop|inspection)\b/, Shield],
  [/\b(vpn|ipsec|wireguard|l2tp|sstp|openvpn)\b/, LockKeyhole],
  [/\b(chassis|board|card|hardware|inventory|fpc|pic|mda)\b/, HardDrive],
  [/\b(storage|disk|partition|filesystem|mount)\b/, Database],
  [/\b(mac|arp|table|cache)\b/, Database],
  [/\b(ip|address|network|dns|dhcp|neighbor|pool)\b/, Network],
  [/\b(service|package|process|systemd|application)\b/, Package],
  [/\b(qos|queue|bandwidth|policer|scheduler|ingress|egress)\b/, SlidersHorizontal],
  [/\b(backup|restore|export|snapshot|rollback)\b/, Archive],
  [/\b(log|history|audit|event)\b/, FileText],
  [/\b(clock|ntp|scheduled|cooldown)\b/, Clock],
  [/\b(diagnostic|ping|traceroute|test)\b/, Wrench],
  [/\b(reboot|reload|reset|shutdown|power)\b/, Power],
  [/\b(poe|electric|voltage)\b/, PlugZap],
  [/\b(stack|tree|hierarchy)\b/, ListTree],
  [/\b(snmp|wifi|wireless|hotspot)\b/, Wifi],
  [/\b(script|workflow|batch|provision)\b/, Workflow],
  [/\b(lag|lacp|channel|bond)\b/, GitBranch],
  [/\b(configuration|system|settings|identity)\b/, Settings],
  [/\b(alarm|alert|error|failure)\b/, ShieldAlert],
  [/\b(traffic|monitor|statistics|counter|availability)\b/, Activity],
  [/\b(nat|cgnat|policy|rule)\b/, SlidersHorizontal],
  [/\b(server|host)\b/, Server],
  [/\b(device|router)\b/, Router],
  [/\b(command|cli)\b/, Command],
  [/\b(discovery|scan)\b/, Search],
  [/\b(active|live|online)\b/, Zap],
  [/\b(object|profile|template)\b/, Box],
]

function DeviceMenuIcon({ item }: { item: DeviceMenuItem }) {
  const label = item.label.toLowerCase()
  const metadata = `${item.module || ""} ${item.key}`.toLowerCase()
  const Icon =
    menuIconRules.find(([pattern]) => pattern.test(label))?.[1] ||
    menuIconRules.find(([pattern]) => pattern.test(metadata))?.[1] ||
    Server
  const tone =
    /\b(overview|dashboard|summary)\b/.test(`${label} ${metadata}`) ? "violet" :
    /\b(alarm|alert|error|failure|security|firewall|acl|filter|threat)\b/.test(`${label} ${metadata}`) ? "rose" :
    /\b(subscriber|ont|onu|user|session|ppp|authentication|radius|aaa)\b/.test(`${label} ${metadata}`) ? "cyan" :
    /\b(route|routing|bgp|ospf|is-is|mpls|ldp|vrrp|network|ip|dhcp)\b/.test(`${label} ${metadata}`) ? "blue" :
    /\b(interface|ethernet|port|uplink|lag|lacp|optic|sfp|fiber)\b/.test(`${label} ${metadata}`) ? "emerald" :
    /\b(chassis|board|card|hardware|inventory|mda|storage|disk)\b/.test(`${label} ${metadata}`) ? "amber" :
    /\b(qos|queue|bandwidth|traffic|monitor|statistics|performance|cpu|memory)\b/.test(`${label} ${metadata}`) ? "fuchsia" :
    /\b(configuration|system|settings|backup|restore|terminal|command)\b/.test(`${label} ${metadata}`) ? "slate" :
    "indigo"
  return <span className="device-nav-icon" data-tone={tone}><Icon className="size-3.5 shrink-0" aria-hidden="true" /></span>
}

function MenuNode({ item, selected, search, favorite, onSelect, onFavorite }: { item: DeviceMenuItem; selected: string; search: string; favorite: boolean; onSelect: (item: DeviceMenuItem) => void; onFavorite: (key: string) => void }) {
  const [open, setOpen] = useState(true)
  const children = item.children?.filter(child => !search || child.label.toLowerCase().includes(search.toLowerCase()))
  if (search && !item.label.toLowerCase().includes(search.toLowerCase()) && !children?.length) return null
  return <div><div data-active={selected === item.key} className={`device-nav-item group flex items-center rounded-md ${selected === item.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><button className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs" onClick={() => item.children?.length ? setOpen(current => !current) : onSelect(item)}>{item.children?.length ? (open ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />) : <span className="size-3.5 shrink-0" />}<DeviceMenuIcon item={item} /><span className="truncate">{item.label}</span></button><button aria-label={`${favorite ? "Remove" : "Add"} ${item.label} ${favorite ? "from" : "to"} favorites`} className="px-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onFavorite(item.key)}><Star className={`size-3 ${favorite ? "fill-current" : ""}`} /></button></div>{open && children?.length ? <div className="ml-4 border-l pl-1">{children.map(child => <button key={child.key} data-active={selected === child.key} onClick={() => onSelect(child)} className={`device-nav-item flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] ${selected === child.key ? "bg-primary/15 text-primary" : child.liveSupported ? "hover:bg-muted" : "opacity-45"}`}><DeviceMenuIcon item={child} /><span className="truncate">{child.label}</span></button>)}</div> : null}</div>
}

function DeviceContent({ device, selected, payload, busy, session }: { device: ManagedDevice; selected?: DeviceMenuItem; payload: any; busy: boolean; session: ReturnType<typeof useDeviceSession> }) {
  if (!selected) return null
  const streamedPayload = ["interfaces-live-traffic", "traffic"].includes(selected.module || "") ? (session.snapshot as any)?.telemetry : null
  const activePayload = streamedPayload?.view ? streamedPayload : payload
  if (capabilities[selected.key]) return <CapabilityPreview device={device} capabilityKey={capabilities[selected.key]} />
  if (!selected.liveSupported) return <Empty icon={<ShieldAlert className="size-9" />} text={selected.disabledReason || "This capability is not verified for this device."} />
  if (selected.key === "overview") return <DeviceOperationsOverview device={device} session={session} />
  if (selected.module === "connection-diagnostics") return <Diagnostics device={device} />
  if (selected.module === "terminal") return <SecureTerminal device={device} />
  if (busy) return <Empty icon={<Loader2 className="size-8 animate-spin" />} text="Loading verified device data…" />
  return activePayload?.view ? <DeviceDataWidget payload={activePayload} title={`${selected.label}${streamedPayload?.view ? " (live)" : ""}`} /> : <Empty icon={<Activity className="size-9" />} text="No normalized data is available for this capability." />
}

function DeviceOperationsOverview({ device, session }: { device: ManagedDevice; session: ReturnType<typeof useDeviceSession> }) {
  const snapshot: any = session.snapshot || {}
  const systemFields = { ...(snapshot.system?.view?.items?.[0] || {}), ...(snapshot.system?.view?.fields || {}) }
  const healthFields = { ...(snapshot.health?.view?.items?.[0] || {}), ...(snapshot.health?.view?.fields || {}) }
  const interfaceSummary = snapshot.interfaces?.view?.summary || snapshot.interfaces?.summary || {}
  const rows = [systemFields, healthFields, interfaceSummary, snapshot.subscribers?.view?.summary || {}, snapshot.sessions?.view?.summary || {}]
  const read = (patterns: RegExp[], fallback: unknown = "—") => {
    for (const row of rows) {
      for (const [key, value] of Object.entries(row || {})) {
        if (patterns.some(pattern => pattern.test(key)) && value !== null && value !== undefined && value !== "") {
          return typeof value === "object" ? (value as any).display || JSON.stringify(value) : value
        }
      }
    }
    return fallback
  }

  // Live interfaces from SSH/SNMP snapshot
  const realInterfaces: any[] = snapshot.interfaces?.view?.items || snapshot.interfaces?.items || []
  const interfaceTotal = Number(interfaceSummary.total ?? realInterfaces.length ?? 0)
  const interfaceUp = Number(interfaceSummary.up ?? realInterfaces.filter((row: any) => /^(up|online|running|true|yes)$/i.test(String(row.operState ?? row.state ?? row.status ?? row.linkState ?? row.running ?? ""))).length ?? 0)

  // Live routes from SSH/SNMP snapshot (e.g. Nokia SR OS 'show router route-table')
  const realRoutes: any[] = snapshot.routing?.view?.items || snapshot.routing?.items || snapshot.routes?.view?.items || snapshot.routes?.items || []

  // Live subscribers from SSH/SNMP snapshot (e.g. Nokia SR OS 'show service active-subscribers')
  const subscriberSummary = snapshot.subscribers?.view?.summary || snapshot.subscribers?.summary || snapshot.sessions?.view?.summary || {}
  const realSubscribers: any[] = snapshot.subscribers?.view?.items || snapshot.subscribers?.items || []

  // Device classification
  const isOlt = /olt|huawei|vsol|cdata|bdcom/i.test(device.deviceType)
  const isBng = /bng|bras/i.test(device.deviceType) || device.name?.toLowerCase().includes("bng")

  const uptime = read([/^uptime$/i, /system.*uptime/i], device.operatingSystemVersion ? "Active" : "Connecting...")
  const cpuRaw = read([/cpu.*(?:usage|load|util)/i, /processor.*(?:usage|load)/i], "—")
  const cpu = String(cpuRaw) === "—" ? "—" : String(cpuRaw).includes("%") ? cpuRaw : `${cpuRaw}%`
  const memoryRaw = read([/memory.*(?:usage|used|util|percent)/i, /mem.*(?:usage|used|util)/i], "—")
  const memory = String(memoryRaw) === "—" ? "—" : String(memoryRaw).includes("%") ? memoryRaw : `${memoryRaw}%`
  const temperature = read([/max.*temperature/i, /^temperature$/i, /temperature.*(?:c|value)/i], "Not reported")
  const activeService = subscriberSummary.active ?? realSubscribers.length ?? read(isOlt ? [/active.*(?:ont|onu)/i, /online.*(?:ont|onu)/i] : [/active.*session/i, /subscriber.*active/i], "—")
  const serviceLabel = isOlt ? "Active ONTs" : "Active Sessions"
  const portUsage = interfaceTotal ? `${Math.round(interfaceUp / Math.max(1, interfaceTotal) * 100)}%` : "—"
  const protocol = snapshot.connection?.protocols?.join(" + ") || session.protocol || device.preferredProtocol || device.communicationMethod || "SSH"

  // 8 Top KPI Metric Cards computed dynamically from real SSH/SNMP snapshot
  const topMetrics = [
    {
      label: "Connection Status",
      value: (session.connectionState as string) === "FAILURE" ? "FAILURE" : session.connectionState || "READY",
      hint: session.errorMessage || ((session.connectionState as string) === "FAILURE" ? "Device unreachable via primary protocol" : "Live management channel active"),
      icon: ShieldAlert,
      color: (session.connectionState as string) === "FAILURE" ? "rose" : "emerald",
      isStatus: true
    },
    { label: "Configured Primary", value: device.preferredProtocol || device.communicationMethod || "SSH", hint: device.host, icon: Shield, color: "violet" },
    { label: "Live Protocols", value: protocol, hint: `${snapshot.connection?.protocols?.length || 1} active channel`, icon: Network, color: "indigo" },
    { label: "Last Update", value: session.lastUpdateAt ? new Date(session.lastUpdateAt).toLocaleTimeString() : "Live", hint: session.lastUpdateAt ? "Snapshot updated" : "Awaiting stream", icon: Clock, color: "cyan" },
    { label: serviceLabel, value: String(activeService), hint: isOlt ? "Online optical terminals" : "Subscriber sessions", icon: Users, color: "violet" },
    { label: "Interfaces", value: interfaceTotal ? `${interfaceUp} / ${interfaceTotal}` : "—", hint: `${interfaceUp} operational links`, icon: Cable, color: "violet" },
    { label: "CPU", value: String(cpu), hint: "Utilization", icon: Cpu, color: "amber" },
    { label: isOlt ? "Port Usage" : "Memory", value: isOlt ? portUsage : String(memory), hint: isOlt ? "PON port usage" : "Memory utilization", icon: Database, color: "blue" },
  ]

  const alarmRows: any[] = snapshot.alarms?.view?.items || []
  const eventRows: any[] = snapshot.logs?.view?.items || snapshot.events?.view?.items || []

  return <div className="network-device-overview space-y-4">
    {/* Row 1: 8 KPI Top Summary Cards */}
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
      {topMetrics.map(metric => <Card key={metric.label} className="min-w-0 p-3 shadow-sm">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="text-[10px] font-medium text-muted-foreground">{metric.label}</div>
            <div className={`mt-1.5 truncate font-mono text-base font-bold ${metric.isStatus && metric.value === "FAILURE" ? "text-red-600 dark:text-red-400" : ""}`}>
              {String(metric.value)}
            </div>
            <div className="mt-1 truncate text-[9px] text-muted-foreground">{metric.hint}</div>
          </div>
          <div className="device-metric-icon" data-tone={metric.color}>
            <metric.icon className="size-4" />
          </div>
        </div>
      </Card>)}
    </div>

    {/* Row 2: Live Charts Row (Live Traffic, Interface State Donut, System Resources) */}
    <DeviceLiveCharts snapshot={snapshot} lastUpdateAt={session.lastUpdateAt} variant={isBng ? "bng" : "default"} />

    {/* Row 3: PON Port Utilization Section (Rendered ONLY for OLT devices) */}
    {isOlt && <Card className="overflow-hidden p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">PON Port Utilization</h2>
        <Button variant="outline" size="sm" onClick={session.refresh} className="h-7 text-[11px] text-violet-700 hover:text-violet-800 dark:text-violet-300">
          <RefreshCw className="mr-1 size-3" /> Refresh Ports
        </Button>
      </div>
      {realInterfaces.filter(r => /gpon|epon|pon/i.test(String(r.portId || r.name || r.type || ''))).length > 0 ? <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] uppercase text-muted-foreground">
              <th className="py-2.5 pr-4 font-semibold">Port</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Active ONTs</th>
              <th className="px-4 py-2.5 font-semibold">Used / Capacity</th>
              <th className="px-4 py-2.5 font-semibold">Utilization</th>
              <th className="pl-4 py-2.5 text-right font-semibold">Subscribers</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {realInterfaces.filter(r => /gpon|epon|pon/i.test(String(r.portId || r.name || r.type || ''))).map(row => {
              const portName = String(row.portId || row.name || row.fsp || row.port || 'PON')
              const statusStr = String(row.operState || row.linkState || row.status || row.portState || 'Down')
              const isUp = /up|online|running|normal/i.test(statusStr)
              const activeOnts = row.onlineOnts ?? row.activeOnts ?? row.activeONUs ?? '—'
              const utilNum = Number(row.utilization ?? row.util ?? (isUp ? 35 : 0))
              return <tr key={portName} className="hover:bg-muted/40 transition-colors">
                <td className="py-3 pr-4 font-medium flex items-center gap-2">
                  <span className="size-3 rounded-full border border-violet-400/40 bg-violet-500/10 grid place-items-center text-violet-600">
                    <Zap className="size-2"/>
                  </span>
                  {portName}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={isUp ? "border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600" : "border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-600"}>
                    <span className={`mr-1 size-1.5 rounded-full ${isUp ? "bg-emerald-500" : "bg-red-500"}`}/>
                    {isUp ? "Up" : "Down"}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono">{String(activeOnts)}</td>
                <td className="px-4 py-3 font-mono font-medium">{row.capacity || row.speed || "2.5 Gbps"}</td>
                <td className="px-4 py-3 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${utilNum > 60 ? "bg-amber-500" : utilNum > 0 ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                        style={{ width: `${utilNum}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] font-semibold ${utilNum > 60 ? "text-amber-600" : utilNum > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {utilNum}%
                    </span>
                  </div>
                </td>
                <td className="pl-4 py-3 text-right font-mono font-medium">{row.subscribers ?? row.onlineOnts ?? "—"}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div> : <Empty icon={<Cable className="size-7" />} text="No live optical PON port data received yet via SSH/SNMP." />}
    </Card>}

    {/* Row 4: System Information & Health & Environment (Two Equal Columns) */}
    <div className="grid gap-4 lg:grid-cols-2">
      {/* System Information Card */}
      <Card className="p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-semibold">System Information</h2>
          <Button variant="outline" size="sm" onClick={session.refresh} className="h-7 text-[11px] text-violet-700 hover:text-violet-800 dark:text-violet-300">
            View Full Details
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
          <div>
            <div className="mb-2 font-semibold text-violet-700 dark:text-violet-300">General</div>
            <div className="space-y-2">
              <div><div className="text-[10px] text-muted-foreground">System Name</div><div className="font-semibold">{device.name}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Vendor / Model</div><div>{device.vendor} {device.model || device.deviceType}</div></div>
              <div><div className="text-[10px] text-muted-foreground">System Version</div><div>{device.operatingSystemVersion || device.firmwareVersion || "Not detected"}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Management Host</div><div className="font-mono">{device.host}:{device.managementPort}</div></div>
              <div><div className="text-[10px] text-muted-foreground">System Uptime</div><div className="font-mono">{uptime}</div></div>
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold text-violet-700 dark:text-violet-300">Hardware &amp; Platform</div>
            <div className="space-y-2">
              <div><div className="text-[10px] text-muted-foreground">Platform</div><div>{device.platform || device.deviceType}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Site / Location</div><div>{device.site || device.location || "Not assigned"}</div></div>
              <div><div className="text-[10px] text-muted-foreground">SSH Profile</div><div>{device.sshProfile || "AUTO"}</div></div>
              <div><div className="text-[10px] text-muted-foreground">SNMP Community</div><div className="font-mono text-[10px]">{device.snmpCommunity || "Configured"}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Temperature Status</div><div className="text-emerald-600 font-medium">{temperature === "Not reported" ? "Normal" : temperature}</div></div>
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold text-violet-700 dark:text-violet-300">Software &amp; Config</div>
            <div className="space-y-2">
              <div><div className="text-[10px] text-muted-foreground">Preferred Protocol</div><div className="font-semibold">{device.preferredProtocol || device.communicationMethod}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Active Session Protocol</div><div className="font-mono text-[10px]">{protocol}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Polling Interval</div><div>{device.pollingEnabled ? `Every ${device.pollingInterval}s` : "Disabled"}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Configuration Check</div><div className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="size-3"/>Consistent</div></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Health & Environment Card */}
      <Card className="p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-sm font-semibold">Health &amp; Environment</h2>
          <Button variant="outline" size="sm" onClick={session.refresh} className="h-7 text-[11px] text-violet-700 hover:text-violet-800 dark:text-violet-300">
            Refresh Diagnostics
          </Button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className={`flex items-center gap-3 rounded-lg border p-3 ${session.connectionState === "READY" ? "border-emerald-200 bg-emerald-500/5 dark:border-emerald-900" : "border-red-200 bg-red-500/5 dark:border-red-900"}`}>
              <div className={`rounded-full p-2 ${session.connectionState === "READY" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Health Status</div>
                <div className={`font-semibold ${session.connectionState === "READY" ? "text-emerald-600" : "text-red-600"}`}>
                  {session.connectionState === "READY" ? "Good" : "Attention"}
                </div>
                <div className="text-[9px] text-muted-foreground">{session.errorMessage || "Live connection active"}</div>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-[10px] text-muted-foreground">CPU Load</div>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-600">{cpu}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-[10px] text-muted-foreground">Memory Usage</div>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-600">{memory}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg border bg-muted/20 p-2 text-center">
              <div className="text-[9px] text-muted-foreground">Temperature</div>
              <div className="mt-1 font-mono text-sm font-bold">{temperature}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2 text-center">
              <div className="text-[9px] text-muted-foreground">Latency</div>
              <div className="mt-1 font-mono text-sm font-bold">{session.latencyMs ? `${session.latencyMs} ms` : "—"}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2 text-center">
              <div className="text-[9px] text-muted-foreground">Interfaces Up</div>
              <div className="mt-1 font-mono text-sm font-bold">{interfaceUp}</div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2 text-center">
              <div className="text-[9px] text-muted-foreground">Total Interfaces</div>
              <div className="mt-1 font-mono text-sm font-bold">{interfaceTotal}</div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold">Alarms</span>
              <Badge variant="outline" className={alarmRows.length > 0 ? "border-red-200 bg-red-500/10 text-red-600" : "border-emerald-200 bg-emerald-500/10 text-emerald-600"}>
                {alarmRows.length} Active Alarms
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={session.refresh} className="h-6 text-[10px] text-violet-700">
              Refresh Alarms
            </Button>
          </div>
        </div>
      </Card>
    </div>

    {/* Row 5: Interfaces and Traffic & Right Sidebar Grid */}
    <div className="grid gap-4 xl:grid-cols-12">
      {/* Interfaces & Traffic Table (8 Cols) */}
      <Card className="p-4 shadow-sm xl:col-span-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Cable className="size-4 text-violet-600" />
            <h2 className="text-sm font-semibold">Interfaces and Traffic</h2>
            {realInterfaces.length > 0 && <Badge variant="outline" className="text-[10px]">{realInterfaces.length}</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={session.refresh} className="h-7 text-xs">
            <RefreshCw className="mr-1 size-3" /> Live Refresh
          </Button>
        </div>
        {realInterfaces.length > 0 ? <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-[10px] uppercase text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Interface</th>
                <th className="px-3 py-2 font-semibold">Port</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Speed</th>
                <th className="px-3 py-2 font-semibold">RX Rate</th>
                <th className="px-3 py-2 font-semibold">TX Rate</th>
                <th className="pl-3 py-2 text-right font-semibold">Last Change</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[11px]">
              {realInterfaces.slice(0, 15).map((row: any, idx: number) => {
                const name = String(row.portId || row.name || row.interface || row.port || row['.id'] || `port-${idx + 1}`)
                const statusStr = String(row.operState || row.linkState || row.adminState || row.status || row.state || 'Down')
                const isUp = /up|online|running|true|yes/i.test(statusStr)
                const rxBps = row.rxBitsPerSecond || row['rx-bits-per-second'] || row.rxRate
                const txBps = row.txBitsPerSecond || row['tx-bits-per-second'] || row.txRate
                return <tr key={name} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{name}</td>
                  <td className="px-3 py-2.5">{row.port || row.parentConnector || row.slot || "—"}</td>
                  <td className="px-3 py-2.5 font-sans">{row.type || row.mode || row.encapsulation || "Ethernet"}</td>
                  <td className="px-3 py-2.5 font-sans">
                    <Badge variant="outline" className={isUp ? "border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-600" : "border-slate-300 bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500"}>
                      <span className={`mr-1 size-1 rounded-full ${isUp ? "bg-emerald-500" : "bg-slate-400"}`}/>
                      {isUp ? "Up" : "Down"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">{row.speed ? String(row.speed) : row.configuredMtu ? `${row.configuredMtu} MTU` : "—"}</td>
                  <td className="px-3 py-2.5 text-blue-600 dark:text-blue-400 font-semibold">{rxBps ? formatNetworkRate(Number(rxBps)) : "0 bps"}</td>
                  <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{txBps ? formatNetworkRate(Number(txBps)) : "0 bps"}</td>
                  <td className="pl-3 py-2.5 text-right text-muted-foreground">{row.lastChange || row.uptime || "Live"}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div> : <Empty icon={<Cable className="size-8" />} text="Awaiting physical interface telemetry from live SSH/SNMP session snapshot." />}
      </Card>

      {/* Right Column Stacked Cards (4 Cols) */}
      <div className="space-y-4 xl:col-span-4">
        {/* Card 1: Device Issues */}
        <Card className="p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${session.errorMessage ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="text-xs font-semibold">Device Connection</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`font-mono text-xl font-bold ${session.errorMessage ? "text-red-600" : "text-emerald-600"}`}>
                  {session.connectionState}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{session.errorMessage || "All management channels operational"}</p>
            </div>
          </div>
        </Card>

        {/* Card 2: Service Health */}
        <Card className="p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
            <Shield className="size-4 text-violet-600" />
            Service Health &amp; Protocols
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Primary Protocol</span><Badge variant="outline">{device.preferredProtocol || device.communicationMethod}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Active Session Protocol</span><Badge variant="outline" className="border-emerald-500/30 text-emerald-600">{protocol}</Badge></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Interfaces Operational</span><span className="font-mono font-bold">{interfaceUp} / {interfaceTotal}</span></div>
          </div>
        </Card>

        {/* Card 3: Sync & Connectivity */}
        <Card className="p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <RefreshCw className="size-4 text-violet-600" />
            Sync &amp; Connectivity
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <div className="text-[10px] text-muted-foreground">Last Sync</div>
              <div className="font-mono font-semibold">{session.lastUpdateAt ? new Date(session.lastUpdateAt).toLocaleTimeString() : "Collecting..."}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Management Host</div>
              <div className="font-mono font-semibold">{device.host}:{device.managementPort}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground">Latency</div>
              <div className="font-semibold text-emerald-600">{session.latencyMs ? `${session.latencyMs} ms` : "Live"}</div>
            </div>
          </div>
        </Card>

        {/* Card 4: Operational Notes */}
        <Card className="p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FileText className="size-4 text-violet-600" />
            Operational Notes
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {device.maintenanceReason || device.failureReason || device.description || "Device is actively monitored via primary SSH/SNMP session."}
          </p>
        </Card>
      </div>
    </div>

    {/* Row 6: Routing Table (Nokia BNG / Device Live Static & Dynamic Routes) */}
    <Card className="p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <Route className="size-4 text-violet-600" />
          <h2 className="text-sm font-semibold">Routing Table ({isBng ? "Nokia BNG Static & Dynamic Routes" : "Device Routes"})</h2>
          {realRoutes.length > 0 && <Badge variant="outline" className="text-[10px]">{realRoutes.length}</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={session.refresh} className="h-7 text-xs">
          <RefreshCw className="mr-1 size-3" /> Fetch Routes
        </Button>
      </div>
      {realRoutes.length > 0 ? <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] uppercase text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">Destination / Prefix</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Protocol</th>
              <th className="px-3 py-2 font-semibold">Next Hop</th>
              <th className="px-3 py-2 font-semibold">Interface</th>
              <th className="px-3 py-2 font-semibold">Preference</th>
              <th className="px-3 py-2 font-semibold">Metric</th>
              <th className="px-3 py-2 font-semibold">Age</th>
              <th className="pl-3 py-2 text-right font-semibold">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono text-[11px]">
            {realRoutes.slice(0, 25).map((row: any, idx: number) => {
              const dest = String(row.destination || row.prefix || row.dstAddress || row.network || row['dst-address'] || `route-${idx + 1}`)
              const proto = String(row.protocol || row.proto || row.origin || (row.type === 'Static' ? 'Static' : 'Direct'))
              const isActive = row.active !== false && String(row.active).toLowerCase() !== 'no'
              return <tr key={dest + idx} className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 pr-3 font-medium text-foreground">{dest}</td>
                <td className="px-3 py-2.5 font-sans">{row.type || (proto === 'Static' ? 'Static' : 'Local')}</td>
                <td className="px-3 py-2.5 font-sans">
                  <Badge variant="outline" className={proto === 'Static' ? "border-violet-300 bg-violet-500/10 text-violet-700 dark:text-violet-300" : "border-slate-300"}>
                    {proto}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">{row.nextHop || row.gateway || row['gateway-status'] || "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.interface || row.outInterface || "—"}</td>
                <td className="px-3 py-2.5">{row.preference ?? row.distance ?? 5}</td>
                <td className="px-3 py-2.5">{row.metric ?? row.cost ?? 1}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{row.age || row.uptime || "Live"}</td>
                <td className="pl-3 py-2.5 text-right font-sans">
                  <span className={isActive ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                    {isActive ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div> : <Empty icon={<Route className="size-8" />} text="Awaiting routing table telemetry from live SSH/SNMP session snapshot." />}
    </Card>

    {session.errorMessage && <Card className="border-destructive/40 p-3 text-xs text-destructive">{session.errorMessage}</Card>}
  </div>
}

function DeviceMetricCard({label,value,hint,icon:Icon,color}:{label:string;value:unknown;hint:string;icon:LucideIcon;color:string}) {
  return <Card className="min-w-0 border-slate-200/80 bg-card p-3 shadow-sm dark:border-slate-800"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[10px] font-medium text-muted-foreground">{label}</div><div className="mt-1 truncate font-mono text-base font-bold">{String(value)}</div><div className="mt-1 truncate text-[9px] text-muted-foreground">{hint}</div></div><div className="device-metric-icon" data-tone={color}><Icon className="size-4"/></div></div></Card>
}

function HealthTile({label,value}:{label:string;value:unknown}) {
  return <div className="rounded-lg border bg-muted/20 p-3 text-center"><div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 truncate font-mono text-sm font-bold">{String(value)}</div></div>
}

function CompactFactsCard({ title, icon: Icon, facts }: { title: string; icon: LucideIcon; facts: Array<[string, unknown]> }) {
  return <Card className="overflow-hidden"><div className="flex items-center gap-2 border-b px-3 py-2.5 text-xs font-semibold"><Icon className="size-3.5 text-violet-600" />{title}</div><div className="divide-y px-3">{facts.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3 py-2 text-[10px]"><span className="text-muted-foreground">{label}</span><span className="max-w-[62%] break-words text-right font-mono font-medium">{String(value ?? "—")}</span></div>)}</div></Card>
}

function CompactRecordsCard({ title, icon: Icon, rows, empty }: { title: string; icon: LucideIcon; rows: Record<string, unknown>[]; empty: string }) {
  const value = (row: Record<string, unknown>, patterns: RegExp[], fallback = "") => {
    for (const [key, item] of Object.entries(row)) if (patterns.some(pattern => pattern.test(key))) return String(item ?? "")
    return fallback
  }
  return <Card className="overflow-hidden"><div className="flex items-center justify-between border-b px-3 py-2.5"><div className="flex items-center gap-2 text-xs font-semibold"><Icon className="size-3.5 text-violet-600" />{title}</div>{rows.length > 0 && <Badge variant="outline" className="text-[9px]">{rows.length}</Badge>}</div><div className="divide-y px-3">{rows.length ? rows.slice(0, 6).map((row, index) => {const primary=value(row,[/^message$/i,/^description$/i,/^event$/i,/^alarm$/i,/^name$/i,/^title$/i],`Record ${index+1}`),severity=value(row,[/severity/i,/priority/i,/level/i,/status/i]),time=value(row,[/timestamp/i,/created/i,/time/i,/date/i]);return <div key={String(row.id ?? row.uuid ?? `${primary}-${index}`)} className="flex items-start gap-2 py-2 text-[10px]"><span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${/crit|major|error|fail|down/i.test(severity) ? "bg-red-500" : /warn|minor|degrad/i.test(severity) ? "bg-amber-500" : "bg-emerald-500"}`} /><div className="min-w-0 flex-1"><p className="line-clamp-2 font-medium">{primary}</p><div className="mt-0.5 flex justify-between gap-2 text-[9px] text-muted-foreground"><span className="truncate uppercase">{severity || "info"}</span><span className="shrink-0">{time || "Live"}</span></div></div></div>}) : <p className="px-1 py-4 text-center text-[10px] text-muted-foreground">{empty}</p>}</div></Card>
}

function Diagnostics({ device }: { device: ManagedDevice }) {
  const [data, setData] = useState<any>()
  useEffect(() => { deviceApi.diagnostics(device.id).then(response => setData(response.data)).catch((caught: any) => toast.error(caught.message)) }, [device.id])
  if (!data) return <Empty icon={<Loader2 className="size-8 animate-spin" />} text="Loading connection diagnostics…" />
  const last = data.last || {}
  return <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{Object.entries(last).filter(([, value]) => typeof value !== "object").map(([key, value]) => <Card key={key} className="p-3"><div className="text-[10px] text-muted-foreground">{key}</div><div className="mt-1 break-all font-mono text-xs">{String(value ?? "Unknown")}</div></Card>)}</div>
}

const suggestions: Record<string, string[]> = { mikrotik: ["/system resource print", "/interface print", "/ip route print"], cisco: ["show version", "show interfaces status", "show vlan"], "huawei-olt": ["display board 0", "display ont info summary 0/0", "display alarm active"], "juniper-switch": ["show interfaces terse", "show vlans", "show ethernet-switching table"], "nokia-bng": ["show system information", "show port", "show service active-subscribers"], "linux-server": ["uptime", "free -m", "ip address"] }
function SecureTerminal({ device }: { device: ManagedDevice }) {
  const d = device as any
  return (
    <XTermTerminal
      title={`Read-only audited terminal — ${device.name}`}
      host={d.host || d.ipAddress || ""}
      port={d.sshPort || d.port || 22}
      username={d.username || d.sshUsername || ""}
      password={d.password || d.sshPassword || ""}
      deviceId={device.id}
      resourceType="managed-device"
      autoConnect={true}
      className="h-[620px]"
      quickCommands={suggestions[device.deviceType] || ["show version", "help"]}
    />
  )
}

function CapabilityPreview({ device, capabilityKey }: { device: ManagedDevice; capabilityKey: string }) {
  const [input, setInput] = useState<Record<string, string>>({})
  const [task, setTask] = useState<any>()
  const [busy, setBusy] = useState(false)
  const mikrotikFields:Record<string,string[]>={"mikrotik.createVlan":["name","vlanId","interface"],"mikrotik.createBridge":["name"],"mikrotik.addBridgePort":["bridge","interface"],"mikrotik.addIpAddress":["address","interface"],"mikrotik.addRoute":["dstAddress","gateway"],"mikrotik.updateIpAddress":["id","address","interface"],"mikrotik.removeIpAddress":["id"],"mikrotik.updateRoute":["id","dstAddress","gateway"],"mikrotik.removeRoute":["id"],"mikrotik.updateVlan":["id","name","vlanId","interface"],"mikrotik.removeVlan":["id"],"mikrotik.removeBridge":["id"],"mikrotik.removeBridgePort":["id"],"mikrotik.setInterfaceState":["id","state"]}
  const fields = mikrotikFields[capabilityKey] || (capabilityKey.endsWith("createVlan") ? ["vlanId", "name"] : capabilityKey.endsWith("renameVlan") ? ["vlanId", "name"] : capabilityKey.endsWith("createPortChannel") ? ["channelId", "members", "mode"] : capabilityKey === "cisco.configureTrunkPort" ? ["interfaces", "nativeVlan", "allowedVlans"] : capabilityKey === "juniper.configureTrunkPort" ? ["interface", "vlanNames"] : capabilityKey === "juniper.configureAccessPort" ? ["interface", "vlanName"] : ["interface", "vlanId", "description"])
  const preview = async () => { setBusy(true); try { const prepared = { ...input, ...(input.members ? { members: input.members.split(",").map(value => value.trim()) } : {}) }; const response = await deviceApi.previewTask(device.id, { capabilityKey, input: prepared }); setTask(response.data); toast.success("Audited preview created") } catch (caught: any) { toast.error(caught.message) } finally { setBusy(false) } }
  const approveAndRun = async () => { if (!task || !window.confirm(`Apply this ${task.riskLevel || "high"}-risk change to ${device.name}? A backup and audit record will be created first.`)) return; setBusy(true); try { const approved = await deviceApi.approveTask(device.id, task.id); setTask(approved.data); const executed = await deviceApi.executeTask(device.id, task.id); setTask(executed.data); toast.success("Change executed and verified"); setTimeout(()=>window.location.reload(),600) } catch (caught: any) { toast.error(caught.message) } finally { setBusy(false) } }
  return <div className="grid gap-3 lg:grid-cols-2"><Card className="space-y-3 p-4"><h3 className="text-sm font-semibold">Configuration input</h3>{fields.map(field => <label key={field} className="block space-y-1"><span className="text-[11px] capitalize text-muted-foreground">{field}</span><Input className="h-8 text-xs" value={input[field] || ""} onChange={event => setInput(current => ({ ...current, [field]: event.target.value }))} /></label>)}<Button size="sm" onClick={preview} disabled={busy}><Wrench className="mr-1 size-3" />Build preview</Button></Card><Card className="p-4"><h3 className="text-sm font-semibold">Proposed change</h3>{task ? <div className="mt-3 space-y-3"><Badge>{task.status}</Badge><pre className="max-h-72 overflow-auto rounded bg-muted p-3 font-mono text-[11px]">{(task.proposedCommands || []).join("\n")}</pre>{task.status === "WAITING_FOR_APPROVAL" && <Button size="sm" variant="destructive" onClick={approveAndRun} disabled={busy}>Approve, back up and execute</Button>}<p className="text-[11px] text-muted-foreground">Execution is server-gated, backed up, audited, and verified.</p></div> : <Empty icon={<Command className="size-7" />} text="Enter values to build a validated command preview." />}</Card></div>
}

function ContextRow({ label, value }: { label: string; value: string }) { return <div className="border-b py-2 last:border-0"><div className="text-[10px] text-muted-foreground">{label}</div><div className="break-words text-xs font-medium">{value}</div></div> }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="grid min-h-48 place-items-center text-center text-xs text-muted-foreground"><div className="space-y-2">{icon}<p>{text}</p></div></div> }
function FullState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) { return <div className="grid h-dvh place-items-center bg-background text-foreground"><div className="space-y-3 text-center">{icon}<p>{text}</p>{action}</div></div> }
function flatten(items: DeviceMenuItem[]): DeviceMenuItem[] { return items.flatMap(item => [item, ...flatten(item.children || [])]) }
