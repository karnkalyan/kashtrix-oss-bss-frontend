"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Badge } from "@/components/ui/badge"
import { Phone, Users, Clock, BarChart3, TrendingUp, PieChart, Activity } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useWebSocket } from "@/contexts/WebSocketContext"

interface CallStats {
  total: number
  inbound: number
  outbound: number
  internal: number
  answered: number
  missed: number
  totalDuration: number
}

interface DashboardData {
  timestamp: string
  system?: any
  extensions: {
    total: number
    active: number
  }
  activeCalls: CallStats
  todayStats: CallStats
}

interface AsteriskCallDashboardProps {
  ispId: number
  webSocketConnected?: boolean
  serverDown?: boolean
}

export default function AsteriskCallDashboard({ ispId, webSocketConnected, serverDown }: AsteriskCallDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { on } = useWebSocket()

  const fetchDashboardData = async () => {
    if (serverDown) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; data: DashboardData }>('/asterisk/calls/dashboard')
      if (response.success && response.data) {
        setDashboardData(response.data)
      }
    } catch (error: any) {
      console.error("Error fetching Asterisk dashboard data:", error)
      toast.error("Failed to fetch Asterisk dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [serverDown])

  // Real-time updates via WebSocket
  useEffect(() => {
    const handleCallEvent = () => {
      fetchDashboardData()
    }

    const unsubscribeStatus = on("asterisk.call.status", handleCallEvent)
    const unsubscribeStart = on("asterisk.call.start", handleCallEvent)
    const unsubscribeEnd = on("asterisk.call.end", handleCallEvent)
    const unsubscribeAnswered = on("asterisk.call.answered", handleCallEvent)
    const unsubscribeSynced = on("asterisk.data.synced", fetchDashboardData)

    return () => {
      unsubscribeStatus()
      unsubscribeStart()
      unsubscribeEnd()
      unsubscribeAnswered()
      unsubscribeSynced()
    }
  }, [on, webSocketConnected, serverDown])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  if (loading && !dashboardData) {
    return (
      <CardContainer title="Asterisk Call Dashboard">
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </CardContainer>
    )
  }

  return (
    <CardContainer title="Call Dashboard" description="Real-time Asterisk call statistics and analytics">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Active Calls</span>
              </div>
              <Badge variant="outline">
                {dashboardData?.activeCalls?.total || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{dashboardData?.activeCalls?.total || 0}</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">In: {dashboardData?.activeCalls?.inbound || 0}</span>
              <span className="text-blue-600">Out: {dashboardData?.activeCalls?.outbound || 0}</span>
              <span className="text-purple-600">Int: {dashboardData?.activeCalls?.internal || 0}</span>
            </div>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Extensions</span>
              </div>
              <Badge variant="outline">
                {dashboardData?.extensions?.active || 0}/{dashboardData?.extensions?.total || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{dashboardData?.extensions?.total || 0}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              {dashboardData?.extensions?.active || 0} active
            </div>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Today's Calls</span>
              </div>
              <Badge variant="outline">
                {dashboardData?.todayStats?.total || 0}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{dashboardData?.todayStats?.total || 0}</p>
            <div className="mt-2 text-xs">
              <span className="text-green-600">✓ {dashboardData?.todayStats?.answered || 0}</span>
              <span className="text-red-600 ml-2">✗ {dashboardData?.todayStats?.missed || 0}</span>
            </div>
          </div>

          <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Talk Time</span>
              </div>
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">
              {formatDuration(dashboardData?.todayStats?.totalDuration || 0)}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Total talk time today
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Distribution */}
          <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Call Distribution</h3>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Inbound Calls</span>
                  <span>{dashboardData?.todayStats?.inbound || 0} ({getPercentage(dashboardData?.todayStats?.inbound || 0, dashboardData?.todayStats?.total || 1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${getPercentage(dashboardData?.todayStats?.inbound || 0, dashboardData?.todayStats?.total || 1)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Outbound Calls</span>
                  <span>{dashboardData?.todayStats?.outbound || 0} ({getPercentage(dashboardData?.todayStats?.outbound || 0, dashboardData?.todayStats?.total || 1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${getPercentage(dashboardData?.todayStats?.outbound || 0, dashboardData?.todayStats?.total || 1)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Internal Calls</span>
                  <span>{dashboardData?.todayStats?.internal || 0} ({getPercentage(dashboardData?.todayStats?.internal || 0, dashboardData?.todayStats?.total || 1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${getPercentage(dashboardData?.todayStats?.internal || 0, dashboardData?.todayStats?.total || 1)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Call Success Rate */}
          <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Call Success Rate</h3>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Answered Calls</span>
                  <span>{dashboardData?.todayStats?.answered || 0} ({getPercentage(dashboardData?.todayStats?.answered || 0, dashboardData?.todayStats?.total || 1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${getPercentage(dashboardData?.todayStats?.answered || 0, dashboardData?.todayStats?.total || 1)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Missed / Failed Calls</span>
                  <span>{dashboardData?.todayStats?.missed || 0} ({getPercentage(dashboardData?.todayStats?.missed || 0, dashboardData?.todayStats?.total || 1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${getPercentage(dashboardData?.todayStats?.missed || 0, dashboardData?.todayStats?.total || 1)}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Average Call Duration</p>
                    <p className="text-2xl font-bold">
                      {dashboardData?.todayStats?.total && dashboardData.todayStats.answered
                        ? formatDuration(Math.round(dashboardData.todayStats.totalDuration / dashboardData.todayStats.answered))
                        : "0s"}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Last updated: {dashboardData?.timestamp ? new Date(dashboardData.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </CardContainer>
  )
}
