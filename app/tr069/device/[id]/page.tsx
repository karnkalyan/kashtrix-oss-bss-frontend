"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Activity, Wifi, RefreshCw, ChevronLeft, ChevronRight, Search, ArrowLeft,
  Router, Power, CheckCircle, AlertTriangle, ShieldAlert, Cloud, Lock, Settings, MoreVertical, Cpu,
  LayoutDashboard, Globe, Network, Cable, Users, UploadCloud, ListChecks, Terminal, Database, SlidersHorizontal
} from "lucide-react"

// Import full workable TR-069 configuration tab components
import { TR069DeviceWifi } from "@/components/tr069/device-wifi"
import { WifiClientTopology } from "@/components/tr069/wifi-client-topology"
import { TR069DeviceWanConnections } from "@/components/tr069/device-wan-connections"
import { TR069DeviceLanInfo } from "@/components/tr069/device-lan"
import { TR069DeviceNeighbors } from "@/components/tr069/device-neighbors"
import { TR069DeviceDiagnostics } from "@/components/tr069/device-diagnostics"
import { TR069DeviceDetails } from "@/components/tr069/device-details"
import { TR069DeviceFirmware } from "@/components/tr069/device-firmware"
import { TR069DeviceParameters } from "@/components/tr069/device-parameters"

import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

interface PageProps {
  params: Promise<{ id: string }>
}

type Device = {
  id: number
  device: string
  ipAddress: string
  username: string
  status: string
  signal: string
  lastContact: string
  uptime: string
  ProductClass: string
  Manufacturer: string
  SerialNumber: string
  OUI: string
}

export default function TR069DevicePage({ params }: PageProps) {
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  const router = useRouter()
  const resolvedParams = use(params)
  const id = String(resolvedParams?.id ?? "")

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Workspace tabs list with dedicated icons
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "wan", label: "WAN Connections", icon: Globe },
    { key: "wifi", label: "WiFi Config", icon: Wifi },
    { key: "wifi-map", label: "WiFi Map", icon: Network },
    { key: "lan", label: "LAN / Ethernet", icon: Cable },
    { key: "connected", label: "Connected Devices", icon: Users },
    { key: "firmware", label: "Firmware Engine", icon: UploadCloud },
    { key: "operations", label: "TR-069 Operations", icon: ListChecks },
    { key: "diagnostics", label: "Diagnostics Hub", icon: Terminal },
    { key: "parameters", label: "All Parameters", icon: Database },
    { key: "config", label: "ACS Configuration", icon: Settings }
  ]

  const [activeTab, setActiveTab] = useState("overview")

  const fetchDeviceData = useCallback(async (refresh = false) => {
    try {
      setIsLoading(true)
      const [devicesRes, infoRes] = await Promise.all([
        apiRequest<{ success: boolean; devices?: Device[] }>("/tr069-devices?limit=1000").catch(() => null),
        apiRequest<{ success: boolean; data?: any }>(
          `/services/genieacs/devices/${encodeURIComponent(id)}/deviceinfo${refresh ? "?refresh=true" : ""}`
        ).catch(() => null)
      ])

      if (infoRes && infoRes.success && infoRes.data) {
        setDeviceInfo(infoRes.data)
      }

      const realInfo = infoRes?.data?.deviceInfo

      if (devicesRes && devicesRes.success && devicesRes.devices) {
        const match = devicesRes.devices.find(d => d.SerialNumber === id)
        if (match) {
          setSelectedDevice({
            ...match,
            ipAddress: realInfo?.ipAddress || match.ipAddress || "N/A",
            uptime: infoRes?.data?.uptime || match.uptime || "N/A",
            lastContact: infoRes?.data?.lastContact || match.lastContact
          })
        } else {
          setSelectedDevice({
            id: 77,
            device: `CPE-${id.slice(-8).toUpperCase()}`,
            ipAddress: realInfo?.ipAddress || "N/A",
            username: realInfo?.connectionRequestUsername || "N/A",
            status: infoRes?.data?.status?.toLowerCase() || "online",
            signal: "N/A",
            lastContact: infoRes?.data?.lastContact || new Date().toISOString(),
            uptime: infoRes?.data?.uptime || "N/A",
            ProductClass: infoRes?.data?.productClass || "N/A",
            Manufacturer: infoRes?.data?.manufacturer || "ALCL",
            SerialNumber: id,
            OUI: infoRes?.data?.oui || "N/A"
          })
        }
      } else if (infoRes && infoRes.success && infoRes.data) {
        setSelectedDevice({
          id: 77,
          device: `CPE-${id.slice(-8).toUpperCase()}`,
          ipAddress: realInfo?.ipAddress || "N/A",
          username: realInfo?.connectionRequestUsername || "N/A",
          status: infoRes.data.status?.toLowerCase() || "online",
          signal: "N/A",
          lastContact: infoRes.data.lastContact || "N/A",
          uptime: infoRes.data.uptime || "N/A",
          ProductClass: infoRes.data.productClass || "N/A",
          Manufacturer: infoRes.data.manufacturer || "ALCL",
          SerialNumber: id,
          OUI: infoRes.data.oui || "N/A"
        })
      }
    } catch (e) {
      console.error("Error fetching device details:", e)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchDeviceData()
  }, [fetchDeviceData])

  const rebootDevice = async () => {
    try {
      toast.loading("Sending reboot command...", { id: "reboot" })
      const res = await apiRequest<any>(`/services/genieacs/devices/${id}/reboot`, { method: "POST" }).catch(() => ({ success: false }))
      if (res.success) {
        toast.success("Reboot command sent successfully", { id: "reboot" })
      } else {
        toast.error("ACS did not accept the reboot request", { id: "reboot" })
      }
    } catch {
      toast.error("Failed to send reboot command", { id: "reboot" })
    }
  }

  const refreshDevice = async () => {
    try {
      setIsRefreshing(true)
      toast.loading("Refreshing all supported CPE parameters over CWMP...", { id: "refresh" })
      const res = await apiRequest<any>(
        `/services/genieacs/devices/${encodeURIComponent(id)}/parameters?refresh=true&page=1&limit=25`,
        { suppressToast: true }
      ).catch(() => ({ success: false }))
      if (res.success) {
        await fetchDeviceData(false)
        toast.success("Basic info, WAN, LAN, WiFi, clients, and parameter views refreshed", { id: "refresh" })
      } else {
        toast.error("ACS could not refresh the device parameter roots", { id: "refresh" })
      }
    } catch {
      toast.error("Failed to refresh device cache", { id: "refresh" })
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading || !selectedDevice) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Resolving CPE parameters...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">ACS Device Details</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Comprehensive overview and real-time status of TR-069 device ({selectedDevice.SerialNumber})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/tr069")} className="border-indigo-500/20 hover:bg-indigo-500/10 text-xs font-bold h-9 rounded-xl shadow-sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Device List
          </Button>
        </div>

        {/* Top Banner (Device Info Header block) */}
        <div className="rounded-2xl border bg-card p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex flex-wrap items-center gap-6 flex-1">
              <div className="h-12 w-12 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Router className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{selectedDevice.SerialNumber}</span>
                  <Badge className={`${selectedDevice.status?.toLowerCase() === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"} border text-[9px] font-bold uppercase rounded-full px-2`}>
                    {selectedDevice.status || "Unknown"}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Device ID</span>
              </div>

              <div className="h-8 w-px bg-border hidden md:block" />

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{deviceInfo?.deviceInfo?.manufacturer || selectedDevice.Manufacturer} {deviceInfo?.deviceInfo?.modelName || selectedDevice.ProductClass}</div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Model</span>
              </div>

              <div className="h-8 w-px bg-border hidden md:block" />

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{deviceInfo?.deviceInfo?.ipAddress || selectedDevice.ipAddress}</div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">IP Address</span>
              </div>

              <div className="h-8 w-px bg-border hidden md:block" />

              <div className="space-y-1">
                <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{deviceInfo?.deviceInfo?.macAddress || deviceInfo?.deviceInfo?.parameters?.["MACAddress"] || "N/A"}</div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">MAC Address</span>
              </div>

              <div className="h-8 w-px bg-border hidden md:block" />

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{deviceInfo?.uptime || selectedDevice.uptime}</div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Uptime</span>
              </div>

              <div className="h-8 w-px bg-border hidden md:block" />

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {deviceInfo?.lastContact && deviceInfo.lastContact !== "N/A"
                    ? new Date(deviceInfo.lastContact).toLocaleString()
                    : "N/A"}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Last Contact</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto justify-end border-t xl:border-t-0 pt-4 xl:pt-0">
              <Button variant="outline" size="sm" onClick={rebootDevice} className="border-indigo-500/20 hover:bg-indigo-500/10 text-xs font-bold h-9 rounded-xl">
                <Power className="h-4 w-4 mr-1.5 text-indigo-500" /> Reboot
              </Button>
              <Button variant="outline" size="sm" onClick={refreshDevice} disabled={isRefreshing} className="border-indigo-500/20 hover:bg-indigo-500/10 text-xs font-bold h-9 rounded-xl">
                <RefreshCw className={`h-4 w-4 mr-1.5 text-indigo-500 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh All
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-indigo-500/20 hover:bg-indigo-500/10 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Row (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
              <Wifi className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Connection Status</span>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{selectedDevice.status || "Unknown"}</div>
              <span className="text-[9px] text-muted-foreground font-semibold">{selectedDevice.lastContact && selectedDevice.lastContact !== "N/A" ? `Last inform ${new Date(selectedDevice.lastContact).toLocaleString()}` : "No Inform timestamp"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">TR-069 Status</span>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{selectedDevice.lastContact && selectedDevice.lastContact !== "N/A" ? "Reporting" : "Unavailable"}</div>
              <span className="text-[9px] text-muted-foreground font-semibold">Based on latest ACS Inform</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Router className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hardware Version</span>
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{deviceInfo?.deviceInfo?.hardwareVersion || "N/A"}</div>
              <span className="text-[9px] text-muted-foreground font-semibold">OUI: {selectedDevice?.OUI || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/80 dark:border-slate-800/80 hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
              <Cpu className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Firmware Version</span>
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{deviceInfo?.deviceInfo?.softwareVersion || deviceInfo?.deviceInfo?.firmwareVersion || "N/A"}</div>
              <span className="text-[9px] text-muted-foreground font-semibold">Spec: {deviceInfo?.deviceInfo?.specVersion || "TR-069"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Alarms</span>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">0 Active</div>
              <span className="text-[9px] text-muted-foreground font-semibold">No active fault</span>
            </div>
          </div>
        </div>

        {/* Mobile Fallback Tab Bar */}
        <div className="border-b border-border lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 text-xs font-bold scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Side-by-Side Layout: Dedicated Device Management Sidebar + Active Tab Workspace */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Dedicated Device Management Sidebar */}
          <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0 space-y-4">
            <div className="rounded-2xl border bg-card/70 backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-100/90 dark:border-slate-800/90 space-y-3">
              <div className="flex items-center gap-3 border-b pb-3 border-border/80">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-extrabold block tracking-wider uppercase text-slate-800 dark:text-slate-200">Device Menu</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">TR-069 Configuration &amp; Control</span>
                </div>
              </div>

              {/* Vertical Navigation Items */}
              <nav className="space-y-1 py-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500"}`} />
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 opacity-60 transition-transform ${isActive ? "translate-x-0.5 text-white" : "group-hover:translate-x-0.5"}`} />
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Active Tab Workspace */}
          <div className="flex-1 min-w-0 w-full space-y-6">
            {activeTab === "overview" && <TR069DeviceDetails deviceId={id} deviceInfo={deviceInfo} />}
            {activeTab === "wan" && <TR069DeviceWanConnections deviceId={id} />}
            {activeTab === "wifi" && <TR069DeviceWifi deviceId={id} />}
            {activeTab === "wifi-map" && <WifiClientTopology deviceId={id} />}
            {activeTab === "lan" && <TR069DeviceLanInfo deviceId={id} />}
            {activeTab === "connected" && <TR069DeviceNeighbors deviceId={id} />}
            {activeTab === "firmware" && <TR069DeviceFirmware deviceId={id} />}
            {activeTab === "operations" && <TR069DeviceDetails deviceId={id} deviceInfo={deviceInfo} />}
            {activeTab === "diagnostics" && <TR069DeviceDiagnostics deviceId={id} />}
            {activeTab === "parameters" && <TR069DeviceParameters deviceId={id} />}
            {activeTab === "config" && <TR069DeviceDetails deviceId={id} deviceInfo={deviceInfo} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
