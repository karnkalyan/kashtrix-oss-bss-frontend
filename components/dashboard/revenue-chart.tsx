"use client"

import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RevenueChart() {
  const [billingData, setBillingData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBillingStats() {
      try {
        const { apiRequest } = await import("@/lib/api")
        const response = await apiRequest("/dashboard/revenue-overview")
        const rows = response?.data || response
        setBillingData(Array.isArray(rows) ? rows : [])
      } catch (error) {
        console.error("Failed to fetch billing stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBillingStats()
  }, [])

  const totals = useMemo(() => {
    const total = billingData.reduce((sum, item) => sum + Number(item.revenue || 0), 0)
    const average = billingData.length ? total / billingData.length : 0
    return { total, average }
  }, [billingData])

  const money = (value: number) => `NPR ${Math.round(value).toLocaleString()}`

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b px-4 py-3">
        <div>
          <CardTitle className="text-[15px]">Revenue Overview</CardTitle>
          <CardDescription className="mt-0.5 text-[11px]">Collected payments in Nepal Rupees</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[280px] min-h-0 min-w-0 px-3 pb-1 pt-4 sm:h-[310px]">
          {loading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : billingData.length ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 640, height: 280 }}
            >
              <AreaChart data={billingData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid vertical stroke="#3A444F" strokeDasharray="3 4" strokeOpacity={0.55} />
                <XAxis dataKey="month" tick={{ fill: "#87929D", fontSize: 10 }} axisLine={{ stroke: "#3A444F" }} tickLine={false} />
                <YAxis tick={{ fill: "#87929D", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}K` : String(value)} />
                <Tooltip
                  cursor={{ stroke: "#6CC7D9", strokeDasharray: "3 3" }}
                  contentStyle={{ background: "#171B21", border: "1px solid #3A444F", borderRadius: 7, color: "#F3F6F8", fontSize: 11 }}
                  formatter={(value: any) => [money(Number(value || 0)), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6CC7D9" strokeWidth={2} fill="#173F49" fillOpacity={0.72} dot={{ r: 3.5, fill: "#6CC7D9", stroke: "#173F49", strokeWidth: 1 }} activeDot={{ r: 5, fill: "#6CC7D9" }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No paid revenue found for this period.</div>
          )}
        </div>

        <div className="grid border-t sm:grid-cols-2">
          <Metric label="Total Collected Revenue" value={money(totals.total)} />
          <Metric label="Average Per Reported Period" value={money(totals.average)} />
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-data text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  )
}
