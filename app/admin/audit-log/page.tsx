"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDateInput } from "@/components/ui/calendar-date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Loader2, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { OrchestrationConsole } from "@/components/ui/orchestration-console"

type AuditLog = {
  id: number
  userId: number | null
  user: {
    name: string
    email: string
    role?: { name: string }
  } | null
  action: string
  details: string
  ip: string | null
  browser: string | null
  timestamp: string
  changeCount?: number
  changes?: Array<{ field: string; previous: unknown; new: unknown }>
}

type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiResponse = {
  data: AuditLog[]
  pagination: Pagination
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingActions, setLoadingActions] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [selectedAction, setSelectedAction] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  // Load distinct actions
  useEffect(() => {
    const fetchActions = async () => {
      try {
        const data = await apiRequest<string[]>("/audit-logs/actions")
        setActions(data || [])
      } catch (err) {
        console.error("Failed to load audit actions", err)
      } finally {
        setLoadingActions(false)
      }
    }
    fetchActions()
  }, [])

  // Load audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.append("page", String(page))
      queryParams.append("limit", String(limit))
      if (search.trim()) queryParams.append("search", search.trim())
      if (selectedAction && selectedAction !== "ALL") queryParams.append("action", selectedAction)
      if (startDate) queryParams.append("startDate", startDate)
      if (endDate) queryParams.append("endDate", endDate)

      const response = await apiRequest<ApiResponse>(`/audit-logs?${queryParams.toString()}`)
      if (response) {
        setLogs(response.data || [])
        setPagination(response.pagination || null)
      }
    } catch (err) {
      toast.error("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, selectedAction, startDate, endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleReset = () => {
    setSearch("")
    setSelectedAction("ALL")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const totalLogs = logs.length > 0 ? pagination?.total || 0 : 0

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <PageHeader
        title="System Audit Log"
        description="Terminal-based view of all user interactions, configurations, actions, and security events"
      />

      {/* Filters */}
      <CardContainer title="Filters" description="Narrow down audit records by user search, actions, or date ranges">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search Keywords</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Details, IP, Browser..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Filter Action</Label>
            <Select value={selectedAction} onValueChange={(v) => { setSelectedAction(v); setPage(1); }}>
              <SelectTrigger id="action" className="border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {actions.map((act) => (
                  <SelectItem key={act} value={act}>
                    {act}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1 border-slate-200 dark:border-slate-800">
              Reset
            </Button>
            <Button onClick={() => fetchLogs()} className="flex-1 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Terminal Console View */}
      {loading ? (
        <CardContainer title="Audit Logs Output Console" description="Real-time terminal view of all security events">
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContainer>
      ) : logs.length === 0 ? (
        <CardContainer title="Audit Logs Output Console" description="Real-time terminal view of all security events">
          <div className="py-12 text-center text-muted-foreground">No audit logs found matching criteria.</div>
        </CardContainer>
      ) : (
        <>
          <OrchestrationConsole
            title="System Audit Logs Output Console"
            status={`LOADED ${logs.length} / ${totalLogs} RECORDS`}
            logs={logs}
            empty="No audit logs found."
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 px-2">
              <div className="text-xs text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} audit logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-slate-200 dark:border-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs">
                  Page {page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="border-slate-200 dark:border-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
