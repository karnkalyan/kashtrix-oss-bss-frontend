"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Filter, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Calendar, RefreshCw } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface CallLog {
  id: string | number
  startTime: string
  endTime?: string
  callerId: string
  calledNumber: string
  extension?: string
  direction: 'inbound' | 'outbound' | 'internal'
  status: string
  duration?: number
  recordingUrl?: string
}

interface AsteriskCallLogsTableProps {
  ispId: number
  serverDown?: boolean
}

export default function AsteriskCallLogsTable({ ispId, serverDown }: AsteriskCallLogsTableProps) {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    direction: "all",
    status: "all",
    dateRange: "today"
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  const normalizeLog = (log: any): CallLog => ({
    ...log,
    id: String(log.id || log.callid || `${log.startTime}-${log.channelid || ""}`),
    callerId: String(log.caller || log.callerId || log.callfrom || "-"),
    calledNumber: String(log.destination || log.called || log.calledNumber || log.callto || "-"),
    extension: log.extension ? String(log.extension) : "",
    direction: log.direction || "internal",
    status: log.status || "UNKNOWN",
    startTime: log.startTime || log.createdAt || new Date().toISOString(),
    endTime: log.endTime || log.updatedAt,
    duration: Number(log.duration || 0),
    recordingUrl: log.recordingUrl || log.recordingurl
  })

  const fetchCallLogs = async () => {
    if (serverDown) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      })

      if (filters.direction !== "all") params.append("direction", filters.direction)
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.dateRange !== "all") {
        const now = new Date()
        let startDate = new Date()

        switch (filters.dateRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "yesterday":
            startDate.setDate(now.getDate() - 1)
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
        }

        if (filters.dateRange !== "all") {
          params.append("startDate", startDate.toISOString())
          params.append("endDate", now.toISOString())
        }
      }

      const response = await apiRequest<{
        success: boolean
        data: CallLog[]
        total: number
      }>(`/asterisk/calls/logs?${params}`)

      if (response.success) {
        const normalized = (response.data || []).map(normalizeLog)
        setLogs(normalized)
        setFilteredLogs(normalized)
        setTotalPages(Math.ceil((response.total || normalized.length) / limit) || 1)
      }
    } catch (error: any) {
      console.error("Error fetching Asterisk call logs:", error)
      toast.error("Failed to fetch Asterisk call logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCallLogs()
  }, [page, filters.dateRange, serverDown])

  useEffect(() => {
    let filtered = [...logs]

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.callerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.calledNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.extension?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filters.direction !== "all") {
      filtered = filtered.filter(log => log.direction === filters.direction)
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(log =>
        filters.status === "answered"
          ? (log.status === "ANSWERED" || log.status === "ANSWER")
          : (log.status === "NOANSWER" || log.status === "BUSY" || log.status === "FAILED" || log.status === "MISSED")
      )
    }

    setFilteredLogs(filtered)
  }, [searchTerm, filters.direction, filters.status, logs])

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "ANSWERED":
      case "ANSWER":
        return <Badge variant="success" className="gap-1"><Phone className="h-3 w-3" /> Answered</Badge>
      case "NOANSWER":
        return <Badge variant="destructive" className="gap-1"><PhoneMissed className="h-3 w-3" /> No Answer</Badge>
      case "BUSY":
        return <Badge variant="destructive" className="gap-1"><PhoneMissed className="h-3 w-3" /> Busy</Badge>
      case "FAILED":
      case "MISSED":
        return <Badge variant="destructive" className="gap-1"><PhoneMissed className="h-3 w-3" /> Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "inbound": return <PhoneIncoming className="h-4 w-4 text-green-500" />
      case "outbound": return <PhoneOutgoing className="h-4 w-4 text-blue-500" />
      case "internal": return <Phone className="h-4 w-4 text-purple-500" />
      default: return <Phone className="h-4 w-4" />
    }
  }

  return (
    <CardContainer
      title="Asterisk Call Logs"
      description="Historical Asterisk call records"
      actions={[
        {
          label: "Refresh",
          onClick: fetchCallLogs,
          icon: <RefreshCw className="h-4 w-4" />,
          variant: "outline"
        }
      ]}
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by caller, destination, extension..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.direction}
              onValueChange={(value) => setFilters({ ...filters, direction: value })}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[140px]">
                <Phone className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="missed">Missed/Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => {
                setFilters({ ...filters, dateRange: value })
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Call Logs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Called</TableHead>
                <TableHead>Extension</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/50">
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">
                      {formatDateTime(log.startTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(log.direction)}
                      <span className="capitalize text-xs">{log.direction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{log.callerId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{log.calledNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{log.extension || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs">{formatDuration(log.duration)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No call logs found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term" : "No Asterisk calls have been logged yet"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading call logs...</p>
            </div>
          </div>
        )}
      </div>
    </CardContainer>
  )
}
