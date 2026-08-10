"use client"

import { useEffect, useState } from "react"
import { Activity, AlertCircle, CheckCircle2, Gauge, RefreshCw } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"

export function RealTimeStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: any }>("/olt/stats")
      if (response?.success) setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch OLT stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const usage = Number(stats?.portStatistics?.usagePercentage || 0)
  const items = [
    { label: "Online Devices", value: stats?.active || 0, status: "Online", icon: CheckCircle2, color: "text-[var(--status-success)]", dot: "bg-[var(--status-success)]" },
    { label: "Offline Devices", value: stats?.inactive || 0, status: "Offline", icon: AlertCircle, color: "text-[var(--status-danger)]", dot: "bg-[var(--status-danger)]" },
    { label: "Bandwidth Usage", value: `${usage}%`, status: usage > 85 ? "High" : "Normal", icon: Gauge, color: "text-[#78d36b]", dot: usage > 85 ? "bg-[var(--status-warning)]" : "bg-[var(--status-success)]" },
    { label: "Uptime", value: stats?.total > 0 ? "99.9%" : "—", status: stats?.total > 0 ? "Excellent" : "No nodes", icon: Activity, color: "text-primary", dot: "bg-[var(--status-success)]" },
  ]
  const visibleItems = items
    .filter(item => item.label !== "Uptime")
    .map(item => item.label === "Bandwidth Usage" ? { ...item, label: "OLT Port Utilization" } : item)

  return (
    <div className="relative">
      <Button variant="ghost" size="icon-sm" onClick={fetchStats} disabled={loading} className="absolute -right-1 -top-11" aria-label="Refresh network metrics">
        <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      </Button>
      <div className="grid gap-2 sm:grid-cols-3">
        {visibleItems.map(({ label, value, status, icon: Icon, color, dot }) => (
          <div key={label} className="network-inset rounded-[8px] border border-border bg-background px-3 py-2.5">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Icon className={`size-3.5 ${color}`} />{label}</div>
            <div className="mt-1.5 font-data text-[18px] font-semibold leading-none text-foreground">{value}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-muted-foreground"><span className={`size-1.5 rounded-full ${dot}`} />{status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
