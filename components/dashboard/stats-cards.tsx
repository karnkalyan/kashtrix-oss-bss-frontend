"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Users, Wifi, CreditCard, ShoppingCart, Headphones, Receipt, TrendingUp } from "lucide-react"
import { apiRequest } from "@/lib/api"

export function StatsCards() {
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiRequest('/dashboard/summary')
        setStatsData(response?.data || response)
      } catch (error) {
        console.error("Failed to fetch overall stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid min-h-[116px] gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[116px] animate-pulse rounded-[8px] border border-border bg-card" />
        ))}
      </div>
    )
  }

  const activeCustomers = statsData?.activeCustomers || 0
  const totalCustomers = statsData?.totalCustomers || 0
  
  const stats = [
    {
      title: "Active Customers",
      value: (statsData?.activeCustomers || 0).toLocaleString(),
      change: totalCustomers > 0 ? `${Math.round((activeCustomers / totalCustomers) * 100)}% of total base` : "No customer records",
      icon: Users,
      tone: "text-[#6fa8ff] bg-[rgba(111,168,255,.12)]",
      changeTone: "text-[var(--status-success)]",
    },
    {
      title: "Expiring This Week",
      value: (statsData?.expiringThisWeek || 0).toLocaleString(),
      change: "Renewal needed soon",
      icon: ShoppingCart,
      tone: "text-[var(--status-warning)] bg-[var(--status-warning-bg)]",
      changeTone: "text-[var(--status-warning)]",
    },
    {
      title: "Expiring This Month",
      value: (statsData?.expiringThisMonth || 0).toLocaleString(),
      change: "Upcoming renewals",
      icon: Wifi,
      tone: "text-[#78d36b] bg-[rgba(120,211,107,.12)]",
      changeTone: "text-[#78d36b]",
    },
    {
      title: "Open Tickets",
      value: (statsData?.openTickets || 0).toLocaleString(),
      change: "Support items needing action",
      icon: Headphones,
      tone: "text-[#b47cff] bg-[rgba(180,124,255,.12)]",
      changeTone: "text-[#b47cff]",
    },
    {
      title: "Pending Invoices",
      value: (statsData?.pendingInvoices || 0).toLocaleString(),
      change: "Awaiting payment",
      icon: Receipt,
      tone: "text-[var(--status-info)] bg-[var(--status-info-bg)]",
      changeTone: "text-[var(--status-warning)]",
    },
    {
      title: "Expired Users",
      value: (statsData?.expiredUsers || 0).toLocaleString(),
      change: `${statsData?.expiredUsers || 0} disconnected`,
      icon: CreditCard,
      tone: "text-[var(--status-danger)] bg-[var(--status-danger-bg)]",
      changeTone: "text-[var(--status-danger)]",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  tone: string
  changeTone?: string
}

function StatCard({ title, value, change, icon: Icon, tone, changeTone }: StatCardProps) {
  return (
    <div className="network-kpi min-w-0 rounded-[10px] border bg-card p-3.5 text-card-foreground">
      <div className="flex items-center gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-[8px] ${tone}`} aria-hidden="true">
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
        <p className="truncate text-[11px] font-medium text-muted-foreground">{title}</p>
      </div>
      <div className="mt-2 pl-12">
        <div className="font-data text-[21px] font-semibold tabular-nums leading-none text-foreground">{value}</div>
        <p className={`mt-2 flex items-center gap-1 truncate text-[10px] ${changeTone || "text-muted-foreground"}`}>
          {title === "Active Customers" && <TrendingUp className="size-3" />}{change}
        </p>
      </div>
    </div>
  )
}
