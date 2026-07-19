"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CustomerInvoices } from "@/components/customers/customer-invoices"
import { CustomerTickets } from "@/components/customers/customer-tickets"
import { Progress } from "@/components/ui/progress"
import toast from "react-hot-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Wifi,
  FileText,
  LifeBuoy,
  Activity,
  Clock,
  Network,
  Cable,
  Router,
  Settings,
  AlertCircle,
  Trash2,
  Loader2,
  Package,
  RefreshCw,
  Shield,
  Award,
  Users,
  FileCheck,
  Link,
  Globe,
  HardDrive,
  Box,
  Server,
  Split,
  Cpu,
  Zap,
  BarChart,
  Play,
  Pause,
  ArrowRightLeft,
  Plus,
  Search,
  Check,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  RotateCcw,
  Eye,
  EyeOff,
  Key,
  Tv,
  WifiOff,
  Download,
  Upload,
  ExternalLink,
  ImageIcon,
  History
} from "lucide-react"
import { apiRequest, buildApiAssetUrl, getDynamicBaseUrl } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Switch } from "@/components/ui/switch"

// TR-069 components
import { TR069DeviceDetails } from "@/components/tr069/device-details"
import { TR069DeviceWanConnections } from "@/components/tr069/device-wan-connections"
import { TR069DeviceWifi } from "@/components/tr069/device-wifi"
import { TR069DeviceLanInfo } from "@/components/tr069/device-lan"
import { TR069DeviceNeighbors } from "@/components/tr069/device-neighbors"

// Realtime Usage Chart
import { RealtimeUsageChart } from "@/components/customers/realtime-charts"
import { CustomerBillingManagement } from "@/components/customers/customer-billing-management"
import { NetTVDialog } from "@/components/customers/add-customer-form"

import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OrchestrationConsole } from "@/components/ui/orchestration-console"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Chart.js (for DataUsageHistory)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"
import { useTheme } from "next-themes"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ========== Types ==========

interface OLT {
  id: number
  name: string
  ipAddress: string
  model: string
  ports: number
  serviceBoards?: Array<{
    id: string
    slot: number
    type: string
    portCount: number
    usedPorts: number
    availablePorts: number
    status: string
  }>
  vlans?: Array<{
    id: string
    vlanId: number
    name: string
    description?: string
    gemIndex?: number
    priority?: number
    status: string
  }>
  profiles?: Array<{
    id: string
    profileId: string
    name: string
    type: string
    description?: string
  }>
  loadFiles?: Array<{
    id: string
    filename: string
    tftpHost: string
  }>
}

interface Splitter {
  id: number
  name: string
  splitterId: string
  splitRatio: string
  portCount: number
  oltId?: number
  location?: {
    latitude?: number
    longitude?: number
    site?: string
  }
  status?: string
  splitterType?: string
  availablePorts?: number
  distance?: number // for nearest calculation
  olt?: {
    id: number
    name: string
    ipAddress: string
  } | null
  connectedServiceBoard?: {
    oltId: string
    oltName: string
    boardPort: string
    port?: string
    boardSlot: number
    boardType?: string // to determine EPON/GPON
  } | null
  upstreamFiber?: { port?: string } | null
  isMaster?: boolean
  masterSplitterId?: string | null
}

function resolveSplitterBoardPort(path: Splitter[]): string {
  for (const splitter of path) {
    const board = splitter.connectedServiceBoard
    const port = board?.boardPort || board?.port || splitter.upstreamFiber?.port
    if (port) return String(port)
  }
  return ""
}

interface CustomerDevice {
  id?: number
  deviceType: string
  brand: string
  model: string
  serialNumber: string
  macAddress: string
  ponSerial?: string
  ponVendorIdIncluded?: boolean
  notes: string
  inventoryItemId?: number
  provisioningStatus?: string
}

interface Customer {

  id: number
  customerUniqueId: string | null
  panNo?: string
  idNumber: string
  leadId?: number
  membershipId: number | null
  branchId: number | null
  ispId: number
  isRechargeable: boolean
  installedById: number | null
  oltId: number | null
  splitterId: number | null
  existingISPId: number | null
  assignedPkg: number
  subscribedPkgId: number
  status: string
  isDeleted: boolean
  onboardStatus: string
  createdAt: string
  updatedAt: string
  primaryDeviceSerial?: string | null
  packagePrice: {
    id: number
    planId: number
    price: number
    packageDuration: string
    referenceId: string
    packageName: string
    isTrial: boolean
    isActive: boolean
    isDeleted: boolean
    packagePlanDetails: {
      id: number
      planName: string
      planCode: string
      connectionType: number
      dataLimit: number
      downSpeed: number
      upSpeed: number
      deviceLimit: number
      isPopular: boolean
      description: string
      isActive: boolean
      isDeleted: boolean
    }
  }
  subscribedPkg: {
    id: number
    planId: number
    price: number
    packageDuration: string
    referenceId: string
    packageName: string
    isTrial: boolean
    isActive: boolean
    isDeleted: boolean
    packagePlanDetails: {
      id: number
      planName: string
      planCode: string
      connectionType: number
      dataLimit: number
      downSpeed: number
      upSpeed: number
      deviceLimit: number
      isPopular: boolean
      description: string
      isActive: boolean
      isDeleted: boolean
    }
  }
  membership: {
    id: number
    name: string
    code: string
    description: string | null
    address: string
    details: string | null
    newMemberEnabled: boolean
    newMemberIsPercent: boolean
    newMemberValue: number
    renewalEnabled: boolean
    renewalIsPercent: boolean
    renewalValue: number
    isActive: boolean
    isDeleted: boolean
  } | null
  installedBy?: {
    name: string
    email: string
  } | null
  referencedById?: number | null
  referencedBy?: {
    firstName: string
    lastName: string
    email: string
  } | null
  inventoryItems?: any[]
  existingISP?: {
    id: number
    name: string
  } | null
  documents: Array<{
    id: number
    documentType: string
    fileName: string
    filePath?: string
    mimeType: string
    size: number
    uploadedAt: string
    isDeleted: boolean
    previewUrl?: string | null
    downloadUrl?: string | null
    canPreviewInline?: boolean
  }>
  connectionUsers: Array<{
    id: number
    username: string
    password: string
    isActive: boolean
    isDeleted: boolean
    createdAt: string
  }>
  customerSubscriptions: Array<{
    id: number
    package: number
    isTrial: boolean
    planStart: string
    planEnd: string
    isActive: boolean
    isInvoicing: boolean
    isPaused?: boolean
    pauseDate?: string | null
    extensionCount?: number
    graceDaysBalance?: number
    compensationDays?: number
    adminExtensionDays?: number
    packagePrice: {
      id: number
      planId: number
      price: number
      packageDuration: string
      referenceId: string
      packageName: string
      isTrial: boolean
      packagePlanDetails: {
        id: number
        planName: string
        planCode: string
        downSpeed: number
        upSpeed: number
        deviceLimit: number
      }
    }
  }>
  orders: Array<{
    id: number
    totalAmount: number
    orderDate: string
    packageStart: string
    packageEnd: string
    isPaid: boolean
    isActive: boolean
    isRenewalOrder?: boolean
    isTrialOrder?: boolean
    packageItems?: Array<{
      id: number
      name?: string
      referenceId?: string | null
      amount?: number | null
      isTaxable: boolean
      isTscApplicable: boolean
      isRenewal: boolean
    }>
    items: Array<{
      id: number
      itemName: string
      referenceId: string
      itemPrice: number
      createdAt: string
    }>
    packagePrice: {
      id: number
      planId: number
      price: number
      packageDuration: string
      referenceId: string
      packageName: string
      isTrial: boolean
      packagePlanDetails: {
        id: number
        planName: string
        planCode: string
        downSpeed: number
        upSpeed: number
        deviceLimit: number
      }
    }
  }>
  isp: {
    companyName: string
    phoneNumber: string
    masterEmail: string
  }
  firstName: string
  lastName: string
  middleName: string | null
  profilePicture?: string | null
  email: string
  phoneNumber: string
  secondaryPhone?: string
  gender?: string
  street?: string
  district?: string
  state?: string
  devices: Array<{
    id: number
    deviceType: string
    brand: string
    model: string
    serialNumber: string
    macAddress: string
    ponSerial: string
    provisioningStatus: string
    notes: string | null
    createdAt: string
    updatedAt: string
  }>
  serviceDetails: Array<{
    id: number
    oltId: number
    splitterId: number
    oltPort: string
    splitterPort: string
    vlanId: string
    vlanPriority: string
    connectionType: string
    status: string
    provisioningNotes: string | null
    createdAt: string
    updatedAt: string
    olt?: any
    splitter?: any
    vlanDetails?: Array<{
      id: number
      oltId: number
      vlanId: number
      name: string
      description?: string
      gemIndex?: number
      vlanType?: string
      priority?: number
      status: string
      createdAt: string
      updatedAt: string
    }>
  }>
  subscribedApps: Array<{
    id: number
    customerId: number
    serviceId: number
    status: string
    validUntil: string | null
    serviceData: any
    externalUsername?: string | null
    createdAt: string
    updatedAt: string
    service: {
      id: number
      name: string
      code: string
      description: string
      iconUrl: string
      category: string
      isDeleted: boolean
    }
  }>
  portalUser?: {
    id: number
    email: string
    name: string | null
    profilePicture?: string | null
    status: string
    createdAt: string
    updatedAt: string
  } | null
  ontRealtimeStatus?: string
  radiusRealtimeStatus?: string
  radiusAccounting?: {
    status: string
    sessionDownload: number
    sessionUpload: number
    nasIp: string
    framedIp: string
    onlineDuration: number
  } | null
}

interface PackageOption {
  id: number
  packageName: string
  price: number
  packageDuration: string
  packagePlanDetails: {
    planName: string
    downSpeed: number
    upSpeed: number
  }
}

interface RadiusSession {
  radacctid: number
  acctsessionid: string
  acctuniqueid: string
  username: string
  realm: string
  nasipaddress: string
  nasportid: string
  nasporttype: string
  acctstarttime: string | null
  acctupdatetime: string | null
  acctstoptime: string | null
  acctinterval: number | null
  acctsessiontime: number | null
  acctauthentic: string
  connectinfo_start: string
  connectinfo_stop: string
  acctinputoctets: number
  acctoutputoctets: number
  calledstationid: string
  callingstationid: string
  acctterminatecause: string
  servicetype: string
  framedprotocol: string
  framedipaddress: string
  framedipv6address: string
  framedipv6prefix: string
  framedinterfaceid: string
  delegatedipv6prefix: string
  class: any
}

// ========== Helper Functions ==========
function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatBytesToGB(bytes: number): string {
  if (bytes === 0) return "0 GB"
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + " GB"
}

type AggregateBy = "daily" | "weekly" | "monthly"

function aggregateSessions(sessions: RadiusSession[], by: AggregateBy): any[] {
  const grouped: { [key: string]: { download: number; upload: number; count: number } } = {}

  sessions.forEach(s => {
    if (!s.acctstarttime) return
    const date = new Date(s.acctstarttime)
    let key: string
    if (by === "daily") {
      key = date.toISOString().split('T')[0] // YYYY-MM-DD
    } else if (by === "weekly") {
      const d = new Date(date)
      d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)) // Monday
      key = d.toISOString().split('T')[0]
    } else {
      key = date.toISOString().slice(0, 7) // YYYY-MM
    }

    if (!grouped[key]) {
      grouped[key] = { download: 0, upload: 0, count: 0 }
    }
    grouped[key].download += s.acctoutputoctets / (1024 * 1024) // MB
    grouped[key].upload += s.acctinputoctets / (1024 * 1024)
    grouped[key].count += 1
  })

  return Object.entries(grouped)
    .map(([date, values]) => ({
      date,
      download: values.download,
      upload: values.upload,
      sessions: values.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ========== Data Usage History Component (Chart.js version) ==========
interface DataUsageHistoryProps {
  usernames: string[]
}

function DataUsageHistory({ usernames }: DataUsageHistoryProps) {
  const { resolvedTheme } = useTheme()
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [sessions, setSessions] = useState<RadiusSession[]>([])
  const [loading, setLoading] = useState(false)
  const [liveUpdate, setLiveUpdate] = useState(false)
  const [intervalSec, setIntervalSec] = useState<number>(60)
  const [aggregateBy, setAggregateBy] = useState<AggregateBy>("daily")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (usernames.length > 0 && !selectedUser) {
      setSelectedUser(usernames[0])
    }
  }, [usernames, selectedUser])

  const fetchSessions = useCallback(async (username: string) => {
    if (!username) return
    setLoading(true)
    try {
      const response = await apiRequest<{ success: boolean; data: RadiusSession[] }>(
        `/services/radius/act/${username}`
      )
      if (response.success && response.data) {
        setSessions(response.data)
        if (response.data.length > 0) {
          const dates = response.data
            .map(s => s.acctstarttime ? new Date(s.acctstarttime).toISOString().slice(0, 7) : "")
            .filter(Boolean)
          if (dates.length > 0) {
            const latest = dates.sort().pop() || ""
            setSelectedMonth(latest)
          }
        }
      } else {
        toast.error("Failed to fetch usage data")
      }
    } catch (error) {
      console.error("Error fetching RADIUS sessions:", error)
      toast.error("Failed to fetch usage data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchSessions(selectedUser)
    }
  }, [selectedUser, fetchSessions])

  useEffect(() => {
    if (liveUpdate && selectedUser) {
      intervalRef.current = setInterval(() => {
        fetchSessions(selectedUser)
      }, intervalSec * 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [liveUpdate, intervalSec, selectedUser, fetchSessions])

  const toggleLiveUpdate = () => setLiveUpdate(prev => !prev)

  const availableMonths = React.useMemo(() => {
    const months = sessions
      .map(s => s.acctstarttime ? new Date(s.acctstarttime).toISOString().slice(0, 7) : "")
      .filter(Boolean)
    return [...new Set(months)].sort().reverse()
  }, [sessions])

  const filteredSessions = React.useMemo(() => {
    if (!selectedMonth) return sessions
    return sessions.filter(s => {
      if (!s.acctstarttime) return false
      const month = new Date(s.acctstarttime).toISOString().slice(0, 7)
      return month === selectedMonth
    })
  }, [sessions, selectedMonth])

  // Group by date and convert to GB (ascending order)
  const groupedByDate = React.useMemo(() => {
    const groups: { [date: string]: { totalDownload: number; totalUpload: number; sessions: RadiusSession[] } } = {}
    filteredSessions.forEach(session => {
      if (!session.acctstarttime) return
      const date = new Date(session.acctstarttime).toLocaleDateString()
      if (!groups[date]) {
        groups[date] = { totalDownload: 0, totalUpload: 0, sessions: [] }
      }
      groups[date].totalDownload += session.acctoutputoctets
      groups[date].totalUpload += session.acctinputoctets
      groups[date].sessions.push(session)
    })
    return Object.entries(groups)
      .map(([date, data]) => ({
        date,
        totalDownloadGB: data.totalDownload / (1024 * 1024 * 1024),
        totalUploadGB: data.totalUpload / (1024 * 1024 * 1024),
        sessionCount: data.sessions.length,
        sampleIP: data.sessions[0]?.framedipaddress || "N/A",
        sampleNAS: data.sessions[0]?.nasipaddress || "N/A",
        sampleMAC: data.sessions[0]?.callingstationid || "N/A",
        sampleCause: data.sessions[0]?.acctterminatecause || "N/A",
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // ascending
  }, [filteredSessions])

  const chartData = aggregateSessions(filteredSessions, aggregateBy)
  const isDarkMode = resolvedTheme === "dark"

  const chartLabels = chartData.map(d => d.date)
  const chartDatasets = [
    {
      label: "Download (MB)",
      data: chartData.map(d => d.download),
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    },
    {
      label: "Upload (MB)",
      data: chartData.map(d => d.upload),
      borderColor: "rgb(16, 185, 129)",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      fill: true,
      tension: 0.4,
    },
  ]

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: isDarkMode ? "#e2e8f0" : "#334155",
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) label += ": "
            if (context.parsed.y !== null) label += context.parsed.y.toFixed(2) + " MB"
            return label
          },
        },
        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDarkMode ? "#e2e8f0" : "#334155",
        bodyColor: isDarkMode ? "#e2e8f0" : "#334155",
        borderColor: isDarkMode ? "rgba(71, 85, 105, 0.5)" : "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)",
        },
        ticks: {
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "MB",
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
        grid: {
          color: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)",
        },
        ticks: {
          color: isDarkMode ? "#94a3b8" : "#64748b",
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  if (usernames.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No connection users available</div>
  }

  return (
    <div className="customer-profile-shell space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-48">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {usernames.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant={liveUpdate ? "default" : "outline"} onClick={toggleLiveUpdate} className="gap-2">
            {liveUpdate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {liveUpdate ? "Stop" : "Start"} Live Update
          </Button>

          <Select value={intervalSec.toString()} onValueChange={(val) => setIntervalSec(parseInt(val))} disabled={!liveUpdate}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 sec</SelectItem>
              <SelectItem value="60">1 min</SelectItem>
              <SelectItem value="300">5 min</SelectItem>
            </SelectContent>
          </Select>

          <Select value={aggregateBy} onValueChange={(val: AggregateBy) => setAggregateBy(val)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="month" className="text-sm">Month:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="h-80 w-full">
          <Line data={{ labels: chartLabels, datasets: chartDatasets }} options={chartOptions} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && filteredSessions.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">No sessions found for this period</div>
      )}

      {/* Grouped Table with GB */}
      {!loading && groupedByDate.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Total Download (GB)</th>
                <th className="p-2 text-left">Total Upload (GB)</th>
                <th className="p-2 text-left">Sessions</th>
                <th className="p-2 text-left">Sample IP</th>
                <th className="p-2 text-left">Sample NAS IP</th>
                <th className="p-2 text-left">Sample MAC</th>
                <th className="p-2 text-left">Sample Cause</th>
              </tr>
            </thead>
            <tbody>
              {groupedByDate.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-2">{row.date}</td>
                  <td className="p-2">{row.totalDownloadGB.toFixed(2)} GB</td>
                  <td className="p-2">{row.totalUploadGB.toFixed(2)} GB</td>
                  <td className="p-2">{row.sessionCount}</td>
                  <td className="p-2">{row.sampleIP}</td>
                  <td className="p-2">{row.sampleNAS}</td>
                  <td className="p-2">{row.sampleMAC}</td>
                  <td className="p-2">{row.sampleCause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== Device Dialog Component (with MAC formatting) ====================
interface DeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: CustomerDevice
  onSave: (device: CustomerDevice) => void
}

function formatMacAddress(value: string): string {
  const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toLowerCase()
  const groups = cleaned.match(/.{1,4}/g)
  if (!groups) return value
  return groups.join('.')
}

function formatColonMacAddress(value?: string | null): string {
  const compact = String(value || "").replace(/[^a-fA-F0-9]/g, "")
  if (!/^[a-fA-F0-9]{12}$/.test(compact)) return value || "N/A"
  return compact.match(/.{2}/g)!.join(":").toUpperCase()
}

function normalizeIdentifier(value?: string | null): string {
  return (value || "").replace(/[^a-fA-F0-9]/g, "").toLowerCase()
}

function DeviceDialog({ open, onOpenChange, device, onSave }: DeviceDialogProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<CustomerDevice & { ponSerial?: string }>({
    deviceType: "ONT",
    brand: "",
    model: "",
    serialNumber: "",
    macAddress: "",
    ponSerial: "",
    ponVendorIdIncluded: true,
    notes: "",
  })

  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [loadingInventory, setLoadingInventory] = useState(false)

  useEffect(() => {
    if (device) {
      setFormData({
        ...device,
        ponSerial: (device as any).ponSerial || "",
        ponVendorIdIncluded: (device as any).ponVendorIdIncluded !== false,
        macAddress: device.macAddress ? formatMacAddress(device.macAddress) : "",
      })
    } else {
      setFormData({
        deviceType: "ONT",
        brand: "",
        model: "",
        serialNumber: "",
        macAddress: "",
        ponSerial: "",
        ponVendorIdIncluded: true,
        notes: "",
        id: undefined,
        inventoryItemId: undefined,
      })
    }
  }, [device, open])

  // Fetch branch stock
  useEffect(() => {
    if (open && user?.id) {
      setLoadingInventory(true)
      apiRequest<any[]>(`/inventory?type=${encodeURIComponent(formData.deviceType)}&status=ASSIGNED_TO_USER&userId=${user.id}`)
        .then(data => {
          const available = (data || []).filter((item: any) =>
            item.status === "ASSIGNED_TO_USER" && Number(item.userId) === Number(user.id) && !item.customerId
          )
          setInventoryItems(available)
        })
        .catch(console.error)
        .finally(() => setLoadingInventory(false))
    }
  }, [open, user?.id, formData.deviceType])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInventorySelect = (value: string | string[]) => {
    const serialNumber = Array.isArray(value) ? value[0] : value
    const selectedIdentifier = normalizeIdentifier(serialNumber)
    const item = inventoryItems.find(i =>
      i.serialNumber === serialNumber ||
      normalizeIdentifier(i.serialNumber) === selectedIdentifier ||
      normalizeIdentifier(i.ponSerialNumber) === selectedIdentifier ||
      normalizeIdentifier(i.macAddress) === selectedIdentifier
    )
    if (item) {
      setFormData(prev => ({
        ...prev,
        serialNumber: item.serialNumber,
        macAddress: item.macAddress || prev.macAddress,
        ponSerial: item.ponSerialNumber || prev.ponSerial,
        ponVendorIdIncluded: item.ponVendorIdIncluded !== false,
        brand: item.name || prev.brand,
        model: item.model || item.type || prev.model,
        inventoryItemId: item.id,
      }))
    }
  }

  const handleMacBlur = () => {
    if (formData.macAddress) {
      setFormData(prev => ({ ...prev, macAddress: formatMacAddress(prev.macAddress) }))
    }
  }

  const handleSubmit = () => {
    if (!formData.brand || !formData.model || !formData.serialNumber) {
      toast.error("Please fill all required fields")
      return
    }
    onSave(formData as CustomerDevice)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add Provisioned Device"}</DialogTitle>
          <DialogDescription>
            Assign an ONT/Device from your branch's inventory to this customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="deviceType">Device Type *</Label>
            <SearchableSelect
              options={[
                { value: "ONT", label: "ONT (Optical Network Terminal)" },
                { value: "Router", label: "Router" },
                { value: "STB", label: "Set-Top Box" },
              ]}
              value={formData.deviceType}
              onValueChange={(value) => handleChange("deviceType", Array.isArray(value) ? value[0] : value)}
              placeholder="Select device type"
            />
          </div>

          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 rounded-lg">
            <Label>Select Available Stock *</Label>
            <SearchableSelect
              options={inventoryItems.map(i => ({
                value: i.serialNumber,
                label: `${i.name} (${i.serialNumber})`
              }))}
              value={formData.serialNumber}
              onValueChange={handleInventorySelect}
              placeholder={loadingInventory ? "Loading inventory..." : "Select from branch stock"}
              disabled={loadingInventory}
            />
            <p className="text-[10px] text-muted-foreground">Only showing devices assigned to your user from your active branch.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                placeholder="e.g., TP-Link"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                placeholder="e.g., Archer C7"
                disabled
              />
            </div>
          </div>
          {formData.deviceType === "ONT" && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="ponVendorIdIncluded">PON serial includes vendor ID</Label>
                <p className="text-xs text-muted-foreground">Convert the first four characters (for example ALCL) to ASCII hex for Huawei OLT registration.</p>
              </div>
              <Switch id="ponVendorIdIncluded" checked={formData.ponVendorIdIncluded !== false} disabled />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleChange("serialNumber", e.target.value)}
                placeholder="SN123456"
                disabled
              />
              {formData.ponSerial && (
                <p className="text-xs text-muted-foreground">
                  OLT serial: <span className="font-mono">{formData.ponVendorIdIncluded === false ? formData.ponSerial.toUpperCase() : (() => {
                    const vendor = formData.ponSerial!.slice(0, 4)
                    const rest = formData.ponSerial!.slice(4)
                    return /^[0-9A-Fa-f]{16}$/.test(formData.ponSerial!)
                      ? formData.ponSerial!.toUpperCase()
                      : vendor.split("").map(ch => ch.charCodeAt(0).toString(16).padStart(2, "0")).join("").toUpperCase() + rest.toUpperCase()
                  })()}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="macAddress">MAC Address</Label>
              <Input
                id="macAddress"
                value={formData.macAddress}
                onChange={(e) => handleChange("macAddress", e.target.value)}
                onBlur={handleMacBlur}
                placeholder="xxxx.xxxx.xxxx"
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ponSerial">PON-SN (GPON)</Label>
              <Input
                id="ponSerial"
                value={formData.ponSerial}
                onChange={(e) => handleChange("ponSerial", e.target.value)}
                placeholder="e.g., ALCLF12345678"
                disabled
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional info..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit}>Save Device</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Edit Assigned Device Dialog Component ==========
interface EditAssignedDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: any | null
  customerId: number
  onSaveSuccess: () => void
}

function EditAssignedDeviceDialog({ open, onOpenChange, device, customerId, onSaveSuccess }: EditAssignedDeviceDialogProps) {
  const [formData, setFormData] = useState({
    deviceType: "ONT",
    brand: "",
    model: "",
    serialNumber: "",
    macAddress: "",
    ponSerial: "",
    provisioningStatus: "pending",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (device) {
      setFormData({
        deviceType: device.deviceType || "ONT",
        brand: device.brand || "",
        model: device.model || "",
        serialNumber: device.serialNumber || "",
        macAddress: device.macAddress || "",
        ponSerial: device.ponSerial || "",
        provisioningStatus: device.provisioningStatus || "pending",
        notes: device.notes || "",
      })
    }
  }, [device, open])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!device) return
    setLoading(true)
    try {
      await apiRequest(`/customer/${customerId}/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      })
      toast.success("Device updated successfully")
      onSaveSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || "Failed to update device")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assigned Device</DialogTitle>
          <DialogDescription>Modify device details and status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="edit-deviceType">Device Type *</Label>
            <Select value={formData.deviceType} onValueChange={(val) => handleChange("deviceType", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONT">ONT (Optical Network Terminal)</SelectItem>
                <SelectItem value="Router">Router</SelectItem>
                <SelectItem value="STB">Set-Top Box</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand *</Label>
              <Input id="edit-brand" value={formData.brand} onChange={(e) => handleChange("brand", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model *</Label>
              <Input id="edit-model" value={formData.model} onChange={(e) => handleChange("model", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-serialNumber">Serial Number *</Label>
              <Input id="edit-serialNumber" value={formData.serialNumber} onChange={(e) => handleChange("serialNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-macAddress">MAC Address</Label>
              <Input id="edit-macAddress" value={formData.macAddress} onChange={(e) => handleChange("macAddress", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-ponSerial">PON-SN (GPON)</Label>
              <Input id="edit-ponSerial" value={formData.ponSerial} onChange={(e) => handleChange("ponSerial", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select value={formData.provisioningStatus} onValueChange={(val) => handleChange("provisioningStatus", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">PENDING</SelectItem>
                  <SelectItem value="active">ACTIVE</SelectItem>
                  <SelectItem value="suspended">SUSPENDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Main Component ==========
interface CustomerProfileProps {
  customerId?: string
}

export function CustomerProfile({ customerId: customerIdProp }: CustomerProfileProps = {}) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [billingTscPercentage, setBillingTscPercentage] = useState(10)
  
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  const fetchAuditLogs = useCallback(async () => {
    if (!customer?.id) return;
    setLoadingAudit(true)
    try {
      const res = await apiRequest<any>(`/audit-logs/customer/${customer.id}`)
      if (res && res.success) {
        setAuditLogs(res.data || [])
      }
    } catch (e) {
      console.error("Error fetching customer audit logs:", e)
    } finally {
      setLoadingAudit(false)
    }
  }, [customer?.id])

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs()
    }
  }, [activeTab, fetchAuditLogs])

  useEffect(() => {
    apiRequest<Record<string, string>>("/settings")
      .then(settings => setBillingTscPercentage(Number(settings?.tscPercentage || 10)))
      .catch(() => setBillingTscPercentage(10))
  }, [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packages, setPackages] = useState<PackageOption[]>([])

  // Removed duplicate state definition

  // Additional service details
  const [tshulDetails, setTshulDetails] = useState<any>(null)
  const [nettvDetails, setNettvDetails] = useState<any>(null)
  const [tshulMessage, setTshulMessage] = useState("")
  const [nettvMessage, setNettvMessage] = useState("")
  const [loadingTshul, setLoadingTshul] = useState(false)
  const [loadingNettv, setLoadingNettv] = useState(false)
  const [syncingNettv, setSyncingNettv] = useState(false)

  // Modal states
  const [changeUsernameOpen, setChangeUsernameOpen] = useState(false)
  const [changePackageOpen, setChangePackageOpen] = useState(false)
  const [resetMacOpen, setResetMacOpen] = useState(false)
  const [renewPackageOpen, setRenewPackageOpen] = useState(false)
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false)
  const [returnHardwareOpen, setReturnHardwareOpen] = useState(false)
  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<any | null>(null)
  const [deleteDeviceOpen, setDeleteDeviceOpen] = useState(false)
  const [deletingDevice, setDeletingDevice] = useState<any | null>(null)

  // Form states
  const [newUsername, setNewUsername] = useState("")
  const [selectedConnectionUser, setSelectedConnectionUser] = useState("")
  const [selectedPackage, setSelectedPackage] = useState("")
  const [selectedPlanName, setSelectedPlanName] = useState("")
  const [newMacAddress, setNewMacAddress] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [removingDeviceKey, setRemovingDeviceKey] = useState<string | null>(null)
  const [acsSyncing, setAcsSyncing] = useState(false)
  const [provisioningStatusSaving, setProvisioningStatusSaving] = useState(false)
  const [serviceActionLoading, setServiceActionLoading] = useState<"radius" | "nettv" | "account" | "disconnect" | null>(null)
  const [nettvProvisionOpen, setNettvProvisionOpen] = useState(false)
  const [nettvPasswordOpen, setNettvPasswordOpen] = useState(false)
  const [nettvPasswordSaving, setNettvPasswordSaving] = useState(false)
  const [nettvPasswordForm, setNettvPasswordForm] = useState({ password: "", conf_password: "" })
  const [renewLoading, setRenewLoading] = useState(false)
  const [assignHardwareOpen, setAssignHardwareOpen] = useState(false)
  const [hardwareSearch, setHardwareSearch] = useState("")
  const [availableStock, setAvailableStock] = useState<any[]>([])
  const [selectedHardwareId, setSelectedHardwareId] = useState<number | null>(null)
  const [returnHardwareItem, setReturnHardwareItem] = useState<any | null>(null)
  const [voipEnabled, setVoipEnabled] = useState(false)

  // Reprovision Radius modal states
  const [reprovisionRadiusOpen, setReprovisionRadiusOpen] = useState(false)
  const [reprovisionPkgId, setReprovisionPkgId] = useState("")
  const [reprovisionUsername, setReprovisionUsername] = useState("")
  const [reprovisionPassword, setReprovisionPassword] = useState("")
  const [provisionServicesOpen, setProvisionServicesOpen] = useState(false)
  const [accountingProvision, setAccountingProvision] = useState({ code: "TSHUL", name: "Account Billing", requiresPan: true })
  const [identityOpen, setIdentityOpen] = useState(false)
  const [identityIdNumber, setIdentityIdNumber] = useState("")
  const [identityPanNumber, setIdentityPanNumber] = useState("")
  const [identitySaving, setIdentitySaving] = useState(false)
  useEffect(() => {
    apiRequest<any>("/services/isp", { suppressToast: true }).then((response) => {
      const services = Array.isArray(response) ? response : (response?.data || [])
      const selected = services.find((item: any) => ["TSHUL", "NEPURIX"].includes(item?.service?.code) && item.isActive && item.isEnabled)
      if (!selected) return
      const code = selected.service.code
      setAccountingProvision({ code, name: selected.service.name || code, requiresPan: selected.config?.is_pan_necessary ?? selected.config?.requiresPan ?? selected.config?.panRequired ?? code === "TSHUL" })
    }).catch(() => undefined)
  }, [])
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false)
  const [documentType, setDocumentType] = useState("idProof")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentUploading, setDocumentUploading] = useState(false)

  // ========== Radius Login Details ==========
  const [radiusAuthLogs, setRadiusAuthLogs] = useState<any[]>([])
  const [radiusAuthLoading, setRadiusAuthLoading] = useState(false)
  const [bindingRadiusMac, setBindingRadiusMac] = useState<string | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({})

  // ========== Radius Active Sessions ==========
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [activeSessionsLoading, setActiveSessionsLoading] = useState(false)

  // ========== Portal Password Dialog States ==========
  const [portalPasswordOpen, setPortalPasswordOpen] = useState(false)
  const [newPortalEmail, setNewPortalEmail] = useState("")
  const [newPortalPassword, setNewPortalPassword] = useState("")
  const [portalPasswordSubmitting, setPortalPasswordSubmitting] = useState(false)
  const [showPortalPassword, setShowPortalPassword] = useState(false)
  const [radiusPasswordOpen, setRadiusPasswordOpen] = useState(false)
  const [radiusPasswordUser, setRadiusPasswordUser] = useState<{ id: number; username: string } | null>(null)
  const [newRadiusPassword, setNewRadiusPassword] = useState("")
  const [radiusPasswordSubmitting, setRadiusPasswordSubmitting] = useState(false)

  const getFallbackPortalEmail = useCallback((cust: Customer | null) => {
    if (!cust) return ""
    if (cust.email) {
      const email = cust.email.trim().replace(/\s+/g, '').toLowerCase()
      if (email.includes('@')) {
        return email
      }
    }
    const username = String(cust.customerUniqueId || `customer-${cust.id}`).trim().replace(/\s+/g, '').toLowerCase()
    return username
  }, [])

  const getPortalLoginIdentifier = useCallback((value?: string | null) => {
    const normalized = String(value || "").trim()
    return normalized.toLowerCase().endsWith("@customer.local")
      ? normalized.slice(0, -"@customer.local".length)
      : normalized
  }, [])


  // ========== Hardware Dialog Steps ==========
  const [hwDialogStep, setHwDialogStep] = useState<1 | 2>(1)
  const [selectedDeviceType, setSelectedDeviceType] = useState<"ONT" | "STB" | "ONU" | "Router" | "Other">("ONT")

  // ========== Fiber Provisioning State (for Add Hardware) ==========
  const [olts, setOlts] = useState<OLT[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [loadingOlts, setLoadingOlts] = useState(false)
  const [loadingSplitters, setLoadingSplitters] = useState(false)
  const [hwProvisionDetails, setHwProvisionDetails] = useState({
    useSplitter: true,
    useDirectOLT: false,
    oltId: "",
    splitterId: "",
    splitterPort: "",
    oltPort: "",
    selectedVlanIds: [] as string[],
    selectedProfileIds: [] as string[],
    loadOntConfig: false,
    selectedLoadFileId: "",
  })
  const [hwDevices, setHwDevices] = useState<CustomerDevice[]>([])
  const [hwDeviceDialogOpen, setHwDeviceDialogOpen] = useState(false)
  const [hwEditingDeviceIndex, setHwEditingDeviceIndex] = useState<number | null>(null)
  const [discoveredOnts, setDiscoveredOnts] = useState<any[]>([])
  const [selectedDiscoveredOnt, setSelectedDiscoveredOnt] = useState<any | null>(null)
  const [matchedDeviceForOnt, setMatchedDeviceForOnt] = useState<CustomerDevice | null>(null)
  const [isAutoFinding, setIsAutoFinding] = useState(false)
  const [autoFindError, setAutoFindError] = useState<string | null>(null)
  const [hwProvisionLoading, setHwProvisionLoading] = useState(false)

  const hasOntDevices = hwDevices.some(d => d.deviceType === "ONT")
  const hasPendingOnt = hwDevices.some(d => d.deviceType === "ONT" && d.provisioningStatus !== "active")
  const isAlreadyProvisioned = hasOntDevices && !hasPendingOnt

  // ========== OLT/Splitter helpers ==========
  const findUltimateOltForSplitter = useCallback((splitterId: string): OLT | null => {
    if (!splitterId) return null
    const findRoot = (sId: string): Splitter | null => {
      const splitter = splitters.find(s => s.id.toString() === sId)
      if (!splitter) return null
      if (!splitter.masterSplitterId) return splitter
      const parent = splitters.find(s => s.splitterId === splitter.masterSplitterId)
      if (!parent) return splitter
      return findRoot(parent.id.toString())
    }
    const rootSplitter = findRoot(splitterId)
    if (!rootSplitter?.connectedServiceBoard) return null
    return olts.find(o => o.id.toString() === rootSplitter.connectedServiceBoard?.oltId) || null
  }, [splitters, olts])

  const getSplitterPath = useCallback((splitterId: string): Splitter[] => {
    const path: Splitter[] = []
    let current = splitters.find(s => s.id.toString() === splitterId)
    while (current) {
      path.unshift(current)
      if (!current.masterSplitterId) break
      const parent = splitters.find(s => s.splitterId === current!.masterSplitterId)
      if (!parent) break
      current = parent
    }
    return path
  }, [splitters])

  const handleHwProvisionChange = (field: string, value: any) => {
    setHwProvisionDetails(prev => ({ ...prev, [field]: value }))
  }

  const fetchOltsAndSplitters = useCallback(async () => {
    setLoadingOlts(true)
    setLoadingSplitters(true)
    try {
      const [oltData, splitterData] = await Promise.all([
        apiRequest<any>("/olt?limit=1000"),
        apiRequest<any>("/splitters?limit=1000"),
      ])
      setOlts(Array.isArray(oltData?.data) ? oltData.data : [])
      setSplitters(Array.isArray(splitterData?.data) ? splitterData.data : [])
    } catch (e) {
      console.error("Failed to load OLTs/splitters", e)
    } finally {
      setLoadingOlts(false)
      setLoadingSplitters(false)
    }
  }, [])

  useEffect(() => {
    if (assignHardwareOpen) {
      fetchOltsAndSplitters()
      const sd = customer?.serviceDetails?.[0]
      if (sd) {
        let selectedVlanIds: string[] = []
        if (sd.vlanId) {
          selectedVlanIds = sd.vlanId.split(',').filter(Boolean)
        }
        setHwProvisionDetails({
          useSplitter: !!sd.splitterId,
          useDirectOLT: !sd.splitterId,
          oltId: sd.oltId?.toString() || "",
          splitterId: sd.splitterId?.toString() || "",
          splitterPort: sd.splitterPort || "",
          oltPort: sd.oltPort || "",
          selectedVlanIds,
          selectedProfileIds: [],
          loadOntConfig: false,
          selectedLoadFileId: "",
        })
      } else {
        setHwProvisionDetails({
          useSplitter: true,
          useDirectOLT: false,
          oltId: "",
          splitterId: "",
          splitterPort: "",
          oltPort: "",
          selectedVlanIds: [],
          selectedProfileIds: [],
          loadOntConfig: false,
          selectedLoadFileId: "",
        })
      }
      const mappedDevices: CustomerDevice[] = (customer?.devices || []).map((dev) => ({
        id: dev.id,
        deviceType: dev.deviceType,
        brand: dev.brand,
        model: dev.model,
        serialNumber: dev.serialNumber,
        macAddress: dev.macAddress,
        ponSerial: dev.ponSerial || undefined,
        notes: dev.notes || "",
        provisioningStatus: dev.provisioningStatus || "pending",
      }))
      setHwDevices(mappedDevices)
      setSelectedDiscoveredOnt(null)
      setMatchedDeviceForOnt(null)
      setAutoFindError(null)
    } else {
      setHwDevices([])
      setHwProvisionDetails({
        useSplitter: true,
        useDirectOLT: false,
        oltId: "",
        splitterId: "",
        splitterPort: "",
        oltPort: "",
        selectedVlanIds: [],
        selectedProfileIds: [],
        loadOntConfig: false,
        selectedLoadFileId: "",
      })
      setSelectedDiscoveredOnt(null)
      setMatchedDeviceForOnt(null)
      setAutoFindError(null)
      setDiscoveredOnts([])
    }
  }, [assignHardwareOpen, customer, fetchOltsAndSplitters])

  const openDeviceDialogForEdit = useCallback((index: number) => {
    setHwEditingDeviceIndex(index)
    setHwDeviceDialogOpen(true)
  }, [])

  const removeDevice = useCallback((index: number) => {
    setHwDevices(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDeviceSave = useCallback((device: CustomerDevice) => {
    if (hwEditingDeviceIndex !== null) {
      setHwDevices(prev => {
        const updated = [...prev]
        updated[hwEditingDeviceIndex] = device
        return updated
      })
      setHwEditingDeviceIndex(null)
    } else {
      setHwDevices(prev => [...prev, device])
    }
  }, [hwEditingDeviceIndex])

  // Helper to convert a serial (e.g., "ALCLB2C804B0") to hex format ("414C434CB2C804B0")
  const convertToPonHex = useCallback((serial: string): string => {
    if (!serial) return ""
    // If it's already all hex digits, return as is (upper case)
    if (/^[0-9A-Fa-f]+$/.test(serial)) return serial.toUpperCase()
    // First 4 chars are vendor ID, convert each to hex ASCII
    const vendor = serial.slice(0, 4)
    const rest = serial.slice(4)
    const hexVendor = vendor.split('').map(ch => ch.charCodeAt(0).toString(16).toUpperCase()).join('')
    return hexVendor + rest.toUpperCase()
  }, [])

  // Helper to get serial for OLT registration
  const getOntSerialForRegistration = useCallback((device: CustomerDevice, isEpon: boolean): string => {
    if (isEpon) {
      // EPON: use MAC address without dots
      return device.macAddress
    } else {
      // GPON: only encode the four-character vendor ID when inventory says it is included.
      const ponSerial = device.ponSerial || device.serialNumber
      return device.ponVendorIdIncluded === false ? ponSerial.toUpperCase() : convertToPonHex(ponSerial)
    }
  }, [convertToPonHex])

  // OLT Provisioning function
  const registerOntOnOlt = useCallback(async (): Promise<boolean> => {
    if (!hwProvisionDetails.oltId) {
      toast.error("No OLT selected")
      return false
    }
    if (!matchedDeviceForOnt || !selectedDiscoveredOnt) {
      toast.error("No matched ONT device")
      return false
    }

    const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
    if (!selectedOlt) {
      toast.error("Please select a valid OLT")
      return false
    }

    let boardPortStr = hwProvisionDetails.oltPort || ""
    let boardType = selectedOlt.serviceBoards?.[0]?.type

    if (hwProvisionDetails.useSplitter) {
      const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
      if (!ultimateOlt) {
        toast.error("Could not determine OLT from selected splitter")
        return false
      }

      const path = getSplitterPath(hwProvisionDetails.splitterId)
      boardPortStr = resolveSplitterBoardPort(path)
      const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
      boardType = selectedSplitter?.connectedServiceBoard?.boardType || ultimateOlt.serviceBoards?.[0]?.type
    }

    // boardPortStr format like "0/0/1"
    const [frame, slot, port] = boardPortStr.split('/').map(Number)
    if ([frame, slot, port].some(part => Number.isNaN(part) || part === undefined)) {
      toast.error("Invalid OLT port format. Use frame/slot/port, for example 0/0/1.")
      return false
    }

    // Determine board type
    const isEpon = !!boardType?.toUpperCase().includes("EPON")

    // Build serial
    const serial = getOntSerialForRegistration(matchedDeviceForOnt, isEpon)
    if (!serial) {
      toast.error("No serial/MAC available for ONT")
      return false
    }

    // Get VLANs
    const vlans = hwProvisionDetails.selectedVlanIds
      .map(vlanId => {
        const vlan = selectedOlt?.vlans?.find(v => v.id.toString() === vlanId.toString())
        if (!vlan) return null
        return {
          vlan: vlan.vlanId,
          gemport: vlan.gemIndex || 1, // fallback if gemIndex missing
        }
      })
      .filter(Boolean)

    // Get profiles (line_profile_id and service_profile_id)
    const profiles = selectedOlt?.profiles?.filter(p => hwProvisionDetails.selectedProfileIds.includes(p.id.toString())) || []
    const lineProfile = profiles.find(p => p.type === "line" || p.type === "LINE")
    const serviceProfile = profiles.find(p => p.type === "service" || p.type === "SERVICE")
    const lineProfileId = lineProfile ? (lineProfile.profileId || lineProfile.id) : null
    const serviceProfileId = serviceProfile ? (serviceProfile.profileId || serviceProfile.id) : null
    if (!isEpon) {
      if (!lineProfileId || !serviceProfileId) {
        toast.error("Please select both line and service profiles")
        return false
      }
    }

    const selectedLoadFile = hwProvisionDetails.loadOntConfig
      ? selectedOlt.loadFiles?.find(file => file.id === hwProvisionDetails.selectedLoadFileId)
      : null
    if (hwProvisionDetails.loadOntConfig && !selectedLoadFile) {
      toast.error("Please select an ONT configuration file")
      return false
    }

    const payload = {
      action: "registerONT",
      params: {
        frame,
        slot,
        port,
        serial,
        line_profile_id: lineProfileId,
        service_profile_id: serviceProfileId,
        description: `${customer?.firstName || "Customer"}_${customer?.lastName || ""}_${customer?.street || ""}`.replace(/\s+/g, '_'),
        vlans,
        load_file: selectedLoadFile?.filename?.toLowerCase() || null,
      },
    }

    try {
      const response = await apiRequest<any>(`/device/${hwProvisionDetails.oltId}/action`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      if (response?.success) {
        toast.success("ONT registered on OLT successfully")
        return true
      } else {
        toast.error(response?.error || "Failed to register ONT")
        return false
      }
    } catch (error: any) {
      toast.error(error?.message || "Error")
      return false
    }
  }, [hwProvisionDetails, matchedDeviceForOnt, selectedDiscoveredOnt, findUltimateOltForSplitter, getSplitterPath, splitters, olts, customer, getOntSerialForRegistration])

  const handleAutoFindOnt = useCallback(async () => {
    if (!hwProvisionDetails.oltId) {
      toast.error("Please select an OLT first")
      return
    }

    let frame: number, slot: number, port: number

    if (hwProvisionDetails.useSplitter) {
      if (!hwProvisionDetails.splitterId) {
        toast.error("Please select a splitter first")
        return
      }

      const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
      const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
      const path = getSplitterPath(hwProvisionDetails.splitterId)
      const boardPortStr = resolveSplitterBoardPort(path)

      if (!boardPortStr) {
        toast.error("Unable to determine board port from splitter")
        return
      }

      const parts = boardPortStr.split('/').map(Number)
      if (parts.length !== 3 || parts.some(isNaN)) {
        toast.error(`Invalid board port format from splitter: ${boardPortStr}`)
        return
      }
      [frame, slot, port] = parts
    } else {
      // Direct OLT mode
      if (!hwProvisionDetails.oltPort) {
        toast.error("Please enter the OLT port (frame/slot/port) for direct connection")
        return
      }
      const parts = hwProvisionDetails.oltPort.split('/').map(Number)
      if (parts.length !== 3 || parts.some(isNaN)) {
        toast.error("OLT port must be in format frame/slot/port (e.g., 0/0/1)")
        return
      }
      [frame, slot, port] = parts
    }

    setIsAutoFinding(true)
    setAutoFindError(null)
    setDiscoveredOnts([])
    setSelectedDiscoveredOnt(null)
    setMatchedDeviceForOnt(null)

    try {
      const response = await apiRequest<any>(`/device/${hwProvisionDetails.oltId}/action`, {
        method: "POST",
        body: JSON.stringify({
          action: "autofind",
          params: [frame, slot, port],
        }),
        headers: { "Content-Type": "application/json" },
      })

      if (response?.success && response.data) {
        setDiscoveredOnts(response.data)
      } else {
        setAutoFindError(response?.error || "Failed to discover ONTs")
      }
    } catch (error: any) {
      setAutoFindError(error?.message || "Error during autofind")
    } finally {
      setIsAutoFinding(false)
    }
  }, [hwProvisionDetails, splitters, findUltimateOltForSplitter, getSplitterPath, toast])

  const handleSelectDiscoveredOnt = useCallback((ontId: string) => {
    const ont = discoveredOnts.find(o => o.ont_id_details === ontId)
    setSelectedDiscoveredOnt(ont || null)

    if (!ont) {
      setMatchedDeviceForOnt(null)
      return
    }

    if (!hwDevices.length) {
      setMatchedDeviceForOnt(null)
      toast.error("No devices added. Please add a device first.")
      return
    }

    const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
    const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
    const boardType = selectedSplitter?.connectedServiceBoard?.boardType || ultimateOlt?.serviceBoards?.[0]?.type
    const isEpon = boardType?.toUpperCase().includes("EPON")

    const ontIdentifier = ont.ont_id_details  // e.g., "414C434CB2C804B0" for GPON
    const normalizedOnt = normalizeIdentifier(ontIdentifier)

    // Try to match with any added ONT device
    for (const device of hwDevices) {
      if (device.deviceType !== "ONT") continue

      const candidateIdentifiers = [
        device.macAddress,
        device.serialNumber,
        device.ponSerial,
        convertToPonHex(device.serialNumber || ""),
        convertToPonHex(device.ponSerial || ""),
      ]
        .map(normalizeIdentifier)
        .filter(Boolean)

      if (candidateIdentifiers.includes(normalizedOnt)) {
        setMatchedDeviceForOnt(device)
        setSelectedDiscoveredOnt((prev: any) => prev ? ({ ...prev, ont_id: ont.ont_id }) : null)
        toast.success(`Matched with device: ${device.brand} ${device.model}`)
        return
      }

      if (isEpon) {
        // EPON: match by MAC
        const normalizedMac = normalizeIdentifier(device.macAddress)
        if (normalizedMac && normalizedMac === normalizedOnt) {
          setMatchedDeviceForOnt(device)
          setSelectedDiscoveredOnt((prev: any) => prev ? ({ ...prev, ont_id: ont.ont_id }) : null)
          toast.success(`Matched with device: ${device.brand} ${device.model}`)
          return
        }
      } else {
        // GPON: match by serialNumber or ponSerial after converting to hex
        const deviceSerialHex = convertToPonHex(device.serialNumber || "")
        const devicePonHex = convertToPonHex(device.ponSerial || "")
        if ((devicePonHex && devicePonHex === ontIdentifier) || (deviceSerialHex && deviceSerialHex === ontIdentifier)) {
          setMatchedDeviceForOnt(device)
          setSelectedDiscoveredOnt((prev: any) => prev ? ({ ...prev, ont_id: ont.ont_id }) : null)
          toast.success(`Matched with device: ${device.brand} ${device.model}`)
          return
        }
      }
    }

    // No match found
    setMatchedDeviceForOnt(null)
    toast.error("No matching device found")
  }, [hwDevices, hwProvisionDetails.splitterId, splitters, findUltimateOltForSplitter, discoveredOnts, convertToPonHex, toast])

  const handleHwProvisionSave = async () => {
    if (!customer) return
    setHwProvisionLoading(true)
    try {
      const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
      const ultimateOlt = hwProvisionDetails.useSplitter
        ? findUltimateOltForSplitter(hwProvisionDetails.splitterId)
        : selectedOlt

      // Step 1: Register ONT on OLT (if fiber, and discovery/matching is set)
      if (selectedDiscoveredOnt && matchedDeviceForOnt) {
        const ontRegistered = await registerOntOnOlt()
        if (!ontRegistered) {
          setHwProvisionLoading(false)
          return
        }
      }

      // Step 2: Save connection details to customer
      // vlanId field needs to be a comma-separated string of the selected VLAN IDs (database IDs)
      const vlanIdStr = hwProvisionDetails.selectedVlanIds.join(',')

      await apiRequest(`/customer/${customer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          connectionType: "fiber",
          oltId: ultimateOlt?.id || hwProvisionDetails.oltId ? Number(ultimateOlt?.id || hwProvisionDetails.oltId) : null,
          splitterId: hwProvisionDetails.splitterId ? Number(hwProvisionDetails.splitterId) : null,
          oltPort: hwProvisionDetails.oltPort || null,
          splitterPort: hwProvisionDetails.splitterPort || null,
          vlanId: vlanIdStr,
        }),
        headers: { "Content-Type": "application/json" },
      })

      // Step 3: Assign new devices to customer
      const newDevices = hwDevices.filter(d => !d.id && d.inventoryItemId)
      for (const dev of newDevices) {
        await apiRequest(`/inventory/${dev.inventoryItemId}/assign-customer`, {
          method: "PUT",
          body: JSON.stringify({ customerId: customer.id })
        })
      }

      // Step 3.5: Activate ONT Devices in database
      // Fetch fresh customer details to get IDs of newly assigned devices
      const freshData = await apiRequest<any>(`/customer/${customer.id}`)
      if (freshData) {
        const freshDevices = freshData.devices || []
        const ontDevicesToActivate = freshDevices.filter((d: any) => d.deviceType === "ONT" && d.provisioningStatus !== "active")
        for (const dev of ontDevicesToActivate) {
          await apiRequest(`/customer/${customer.id}/devices/${dev.id}`, {
            method: "PUT",
            body: JSON.stringify({ provisioningStatus: "active" }),
            headers: { "Content-Type": "application/json" }
          })
        }
      }

      const syncOltId = String(ultimateOlt?.id || hwProvisionDetails.oltId || "")
      if (syncOltId) {
        const syncResults = await Promise.allSettled([
          apiRequest("/tr069-devices/sync", { method: "POST" }),
          apiRequest(`/olt/${syncOltId}/onts/sync`, { method: "POST" }),
        ])
        syncResults.forEach((result, index) => {
          if (result.status === "rejected") {
            console.warn(index === 0 ? "TR-069 sync after provisioning failed" : "OLT ONT sync after provisioning failed", result.reason)
          }
        })
      }

      toast.success("Fiber provisioning saved successfully")
      setAssignHardwareOpen(false)
      fetchCustomerData()
    } catch (e: any) {
      toast.error(e?.message)
    } finally {
      setHwProvisionLoading(false)
    }
  }

  const handleOutboundCall = async (phoneNumber?: string | null) => {
    if (!voipEnabled) {
      toast.error("Calling is disabled because no VOIP service is enabled")
      return
    }
    if (!phoneNumber) {
      toast.error("Phone number is not available")
      return
    }
    const extension = String(user?.yeastarExt || user?.extId || "").trim()
    if (!extension) {
      toast.error("No VoIP extension is assigned to your user account")
      return
    }

    try {
      await apiRequest(`/yeaster/calls/make`, {
        method: "POST",
        body: JSON.stringify({
          extension,
          caller: extension,
          callee: phoneNumber,
          number: phoneNumber,
          autoanswer: "yes",
        })
      })
      toast.success(`Calling ${phoneNumber}`)
    } catch (error: any) {
      const message = String(error?.message || "")
      if (message && !/yeastar|yeaster|asterisk|voip|configured|enabled/i.test(message)) {
        toast.error(message)
      }
    }
  }

  const fetchVoipStatus = useCallback(async () => {
    const [yeastar, asterisk] = await Promise.all([
      apiRequest<any>("/services/isp/status/YEASTAR", { suppressToast: true }).catch(() => null),
      apiRequest<any>("/services/isp/status/ASTERISK", { suppressToast: true }).catch(() => null),
    ])
    const statuses = [yeastar?.data, asterisk?.data]
    setVoipEnabled(statuses.some((status) => status?.enabled === true && status?.configured === true))
  }, [])

  useEffect(() => {
    fetchVoipStatus()
  }, [fetchVoipStatus])
  const [stockLoading, setStockLoading] = useState(false)

  const fetchAvailableStock = async () => {
    setStockLoading(true)
    try {
      const params = new URLSearchParams()
      if (hardwareSearch) params.set("search", hardwareSearch)
      if (!hardwareSearch && customer?.branchId) params.set("branchId", customer.branchId.toString())
      const queryString = params.toString()
      const data = await apiRequest<any>(`/inventory${queryString ? `?${queryString}` : ""}`)
      const rows = Array.isArray(data) ? data : (data?.data || [])
      const assignableStatuses = new Set(["IN_STOCK", "ASSIGNED_TO_BRANCH", "ASSIGNED_TO_USER", "ASSIGNED_TO_ROLE", "RETURNED"])
      setAvailableStock(rows.filter((item: any) => assignableStatuses.has(item.status) && !item.customerId && (item.availableQty ?? 1) > 0))
    } catch (e) {
      console.error(e)
    } finally {
      setStockLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (assignHardwareOpen) fetchAvailableStock()
    }, 300)
    return () => clearTimeout(timer)
  }, [assignHardwareOpen, hardwareSearch, customer?.branchId])

  const handleAssignHardware = async () => {
    if (!selectedHardwareId) return;
    setActionLoading(true)
    try {
      await apiRequest(`/inventory/${selectedHardwareId}/assign-customer`, {
        method: "PUT",
        body: JSON.stringify({ customerId: customer?.id })
      })
      toast.success("Hardware assigned successfully")
      setAssignHardwareOpen(false)
      setSelectedHardwareId(null)
      fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const params = useParams()
  const router = useRouter()
  const customerId = customerIdProp || (params.id as string)

  const [networkSettings, setNetworkSettings] = useState({
    dnd: false,
    autoRenew: true,
    dontSuspend: false,
    excludeMACBind: false,
    bindMAC: true,
    bindIP: true,
    bindNASPORT: false,
  })

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest<Customer>(`/customer/${customerId}`)
      if (data) {
        setCustomer(data)
        if (data.connectionUsers.length > 0) {
          setSelectedConnectionUser(data.connectionUsers[0].id.toString())
        }
        const currentMac = data.devices?.[0]?.macAddress || ""
        setNewMacAddress(currentMac)
      } else {
        setError("Customer not found")
        toast.error("Customer not found")
      }
    } catch (error: any) {
      console.error("Error fetching customer:", error)
      setError(error.message || "Failed to fetch customer data")
      toast.error("Failed to load customer data")
    } finally {
      setLoading(false)
    }
  }

  const syncAcsDevice = async () => {
    const serial = customer?.primaryDeviceSerial || customer?.devices?.find((device) => device.deviceType === "ONT")?.serialNumber
    if (!serial) return toast.error("No linked TR-069 device was found for this customer")
    setAcsSyncing(true)
    try {
      const response = await apiRequest<{ success: boolean; message?: string }>(`/tr069-devices/${encodeURIComponent(serial)}/sync`, { method: "POST" })
      toast.success(response.message || "ACS device details synchronized")
      await fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to synchronize ACS device")
    } finally {
      setAcsSyncing(false)
    }
  }

  useEffect(() => {
    if (customerId) fetchCustomerData()
  }, [customerId])

  // ========== Fetch Radius Auth Logs ==========
  const fetchRadiusAuthLogs = useCallback(async () => {
    if (!customerId) return
    setRadiusAuthLoading(true)
    try {
      const data = await apiRequest<{ success: boolean; data: any[]; message?: string }>(`/customer/${customerId}/radius/auth-logs`)
      if (data?.success && data.data) {
        setRadiusAuthLogs(data.data)
      } else {
        setRadiusAuthLogs([])
      }
    } catch (error) {
      console.error("Error fetching radius auth logs:", error)
      setRadiusAuthLogs([])
    } finally {
      setRadiusAuthLoading(false)
    }
  }, [customerId])

  const bindRadiusMac = useCallback(async (username: string, macAddress: string, bind = true) => {
    const normalizedMac = String(macAddress || "").trim().toUpperCase().replace(/-/g, ":")
    if (!username || (bind && !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedMac))) {
      toast.error("A valid username and MAC address are required")
      return
    }

    const bindingKey = `${username}:${bind ? "bind" : "unbind"}`
    setBindingRadiusMac(bindingKey)
    try {
      const response = await apiRequest<{ success: boolean; message?: string }>(`/customer/${customerId}/radius/bind-mac`, {
        method: "PUT",
        body: JSON.stringify({ username, macAddress: normalizedMac, bind })
      })
      toast.success(response?.message || `MAC bound to ${username}`)
      await fetchRadiusAuthLogs()
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${bind ? "bind" : "unbind"} MAC in RADIUS`)
    } finally {
      setBindingRadiusMac(null)
    }
  }, [customerId, fetchRadiusAuthLogs])

  // ========== Fetch Radius Active Sessions ==========
  const fetchActiveSessions = useCallback(async () => {
    if (!customer?.connectionUsers || customer.connectionUsers.length === 0) return
    setActiveSessionsLoading(true)
    try {
      const allSessions: any[] = []
      for (const u of customer.connectionUsers) {
        try {
          const res = await apiRequest<any>(`/customer/sessions/${u.username}`, { suppressToast: true })
          if (res && res.online === true) {
            allSessions.push({
              username: u.username,
              acctsessionid: res.session_id,
              framedipaddress: res.framed_ip,
              nasipaddress: res.nas_ip,
              acctstarttime: res.started_at,
              data_in: res.data_in,
              data_out: res.data_out
            })
          }
        } catch (err: any) {
          // If no active session found (404), skip it silently
          console.log(`No active session for ${u.username}:`, err.message)
        }
      }
      setActiveSessions(allSessions)
    } catch (error) {
      console.error("Error fetching customer active sessions:", error)
      setActiveSessions([])
    } finally {
      setActiveSessionsLoading(false)
    }
  }, [customer?.connectionUsers])

  const handleDisconnectSessionId = async (sessionId: string) => {
    try {
      setActionLoading(true)
      const response = await apiRequest<{ success: boolean; message: string }>(`/customer/disconnect/session/${sessionId}`, {
        method: 'POST'
      })
      if (response.success) {
        toast.success(response.message || "Session disconnected successfully")
        fetchActiveSessions()
        fetchRadiusAuthLogs()
      } else {
        toast.error("Failed to disconnect session")
      }
    } catch (error: any) {
      console.error("Error disconnecting session:", error)
      const detail = error?.detail || error?.error || error?.message || "Failed to disconnect session"
      toast.error(detail)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDisconnectAllSessions = async (username: string) => {
    try {
      setActionLoading(true)
      const response = await apiRequest<{ success: boolean; message: string }>(`/customer/disconnect/${username}/all`, {
        method: 'POST'
      })
      if (response.success) {
        toast.success(response.message || "All sessions disconnected successfully")
        fetchActiveSessions()
        fetchRadiusAuthLogs()
      } else {
        toast.error("Failed to disconnect sessions")
      }
    } catch (error: any) {
      console.error("Error disconnecting sessions:", error)
      toast.error(error.message || "Failed to disconnect sessions")
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePortalPassword = async () => {
    const isEditing = !!customer?.portalUser;
    if (!isEditing && (!newPortalPassword.trim() || newPortalPassword.length < 4)) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (newPortalPassword.trim() && newPortalPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (!newPortalEmail.trim()) {
      toast.error("Please enter a portal username or email address");
      return;
    }
    setPortalPasswordSubmitting(true);
    try {
      await apiRequest(`/customer/${customerId}/portal-password`, {
        method: "PUT",
        body: JSON.stringify({ 
          email: newPortalEmail.trim(), 
          newPassword: newPortalPassword.trim() || undefined 
        })
      });
      toast.success(isEditing ? "Portal credentials updated successfully" : "Portal account created successfully");
      setPortalPasswordOpen(false);
      setNewPortalPassword("");
      fetchCustomerData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update portal account");
    } finally {
      setPortalPasswordSubmitting(false);
    }
  };

  const openRadiusPasswordDialog = (connectionUser: { id: number; username: string }) => {
    setRadiusPasswordUser({ id: connectionUser.id, username: connectionUser.username })
    setNewRadiusPassword("")
    setRadiusPasswordOpen(true)
  }

  const handleChangeRadiusPassword = async () => {
    if (!radiusPasswordUser) return
    if (!newRadiusPassword.trim() || newRadiusPassword.length < 4) {
      toast.error("Password must be at least 4 characters")
      return
    }
    setRadiusPasswordSubmitting(true)
    try {
      const response = await apiRequest<any>(`/customer/${customerId}/connection-users/${radiusPasswordUser.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword: newRadiusPassword })
      })
      toast.success(response?.data?.radiusUpdated === false
          ? "Local password updated. Radius update failed or is unavailable."
          : "Radius / PPPoE password updated successfully")
      setRadiusPasswordOpen(false)
      setRadiusPasswordUser(null)
      setNewRadiusPassword("")
      fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update Radius password")
    } finally {
      setRadiusPasswordSubmitting(false)
    }
  }

  const handleForceNettvPassword = async () => {
    const username = nettvDetails?.subscriber?.username || customer?.customerUniqueId;
    if (!username) {
      toast.error("Subscriber username not found.");
      return;
    }
    if (!nettvPasswordForm.password || nettvPasswordForm.password !== nettvPasswordForm.conf_password) {
      toast.error("Password and confirmation must match");
      return;
    }
    setNettvPasswordSaving(true);
    try {
      const resellerId = nettvDetails?.subscriber?.reseller?.id || nettvDetails?.subscriber?.reseller_id || 5;
      await apiRequest(`/services/nettv/subscribers/${encodeURIComponent(username)}/pwd`, {
        method: "PATCH",
        body: JSON.stringify({
          password: nettvPasswordForm.password,
          conf_password: nettvPasswordForm.conf_password,
          reseller_id: resellerId
        })
      });
      toast.success("NetTV password updated successfully!");
      setNettvPasswordOpen(false);
      setNettvPasswordForm({ password: "", conf_password: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update NetTV password");
    } finally {
      setNettvPasswordSaving(false);
    }
  }

  useEffect(() => {
    if (activeTab === "radius" && customerId) {
      fetchRadiusAuthLogs()
      fetchActiveSessions()
    }
  }, [activeTab, customerId, fetchRadiusAuthLogs, fetchActiveSessions])

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await apiRequest<PackageOption[]>('/package-price?active=true')
        if (data) {
          setPackages(data)
          if (data.length > 0 && customer) {
            setSelectedPackage(customer.subscribedPkgId.toString())
            const current = data.find(pkg => String(pkg.id) === String(customer.subscribedPkgId))
            setSelectedPlanName(current?.packagePlanDetails?.planName || "")
          }
        }
      } catch (error) {
        console.error("Error fetching packages:", error)
      }
    }
    if (customer) fetchPackages()
  }, [customer])

  useEffect(() => {
    if (customer?.customerUniqueId) {
      const fetchTshul = async () => {
        setLoadingTshul(true)
        try {
          const res = await apiRequest(`/services/tshul/customers/${customer.customerUniqueId}`)
          if (res.configured === false) {
            setTshulDetails(null)
            setTshulMessage(res.message || "TSHUL service is not configured.")
          } else if (res.success) {
            setTshulDetails(res.data)
            setTshulMessage("")
          }
        } catch (error: any) {
          setTshulDetails(null)
          setTshulMessage(error.message || "TSHUL service is not configured.")
        } finally {
          setLoadingTshul(false)
        }
      }
      fetchTshul()
    }
  }, [customer?.customerUniqueId])

  useEffect(() => {
    if (customer?.customerUniqueId) {
      const nettvIsProvisioned = Boolean(customer.subscribedApps?.some((app) => {
        const serviceCode = String(app.service?.code || "").toUpperCase()
        const serviceName = String(app.service?.name || "").toUpperCase()
        const status = String(app.status || "").toLowerCase()
        return status === "active" && (serviceCode === "NETTV" || serviceName.includes("NETTV"))
      }))

      if (!nettvIsProvisioned) {
        setNettvDetails(null)
        setNettvMessage("NetTV is not provisioned for this customer.")
        setLoadingNettv(false)
        return
      }

      const fetchNettv = async () => {
        setLoadingNettv(true)
        try {
          const res = await apiRequest(`/services/nettv/subscribers/${customer.customerUniqueId}`)
          if (res.configured === false) {
            setNettvDetails(null)
            setNettvMessage(res.message || "NetTV service is not configured.")
          } else if (res.success) {
            setNettvDetails(res.data)
            setNettvMessage("")
          }
        } catch (error: any) {
          setNettvDetails(null)
          setNettvMessage(error.message || "NetTV service is not configured.")
        } finally {
          setLoadingNettv(false)
        }
      }
      fetchNettv()
    }
  }, [customer?.customerUniqueId, customer?.subscribedApps])

    const toggleSetting = (setting: keyof typeof networkSettings) => {
    setNetworkSettings((prev) => ({ ...prev, [setting]: !prev[setting] }))
    toast.success(`${setting} has been ${!networkSettings[setting] ? "enabled" : "disabled"}.`)
  }

  const handleSyncNettv = async () => {
    if (!customer?.id) return
    setSyncingNettv(true)
    try {
      const res = await apiRequest(`/customer/${customer.id}/sync/nettv`, { method: "POST" })
      if (res.success) {
        toast.success("NetTV subscriber details synchronized successfully!")
        if (customer.customerUniqueId) {
          const fetchRes = await apiRequest(`/services/nettv/subscribers/${customer.customerUniqueId}`)
          if (fetchRes.success) {
            setNettvDetails(fetchRes.data)
            setNettvMessage("")
          }
        }
      } else {
        toast.error(res.message || "Failed to sync NetTV details.")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sync NetTV details.")
    } finally {
      setSyncingNettv(false)
    }
  }

  const handleChangeUsername = async () => {
    if (!newUsername.trim() || !selectedConnectionUser) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/username`, {
        method: 'PUT',
        body: JSON.stringify({
          connectionUserId: parseInt(selectedConnectionUser),
          newUsername: newUsername.trim()
        })
      })

      toast.success(response.message || "Username changed successfully")

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }

      setChangeUsernameOpen(false)
      setNewUsername("")
    } catch (error: any) {
      console.error("Error changing username:", error)
      toast.error(error.message || "Failed to change username")
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePackage = async () => {
    if (!selectedPackage) {
      toast.error("Please select a package")
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/package`, {
        method: 'PUT',
        body: JSON.stringify({
          newPackageId: parseInt(selectedPackage)
        })
      })

      toast.success(response.message || "Package changed successfully")

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }

      setChangePackageOpen(false)
    } catch (error: any) {
      console.error("Error changing package:", error)
      toast.error(error.message || "Failed to change package")
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetMac = async () => {
    if (!newMacAddress.trim()) {
      toast.error("Please enter a MAC address")
      return
    }

    const normalizedMac = formatColonMacAddress(newMacAddress)
    if (normalizedMac === "N/A" || !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizedMac)) {
      toast.error("Invalid MAC address. Use D0:5F:AF:AD:78:0B, D0-5F-AF-AD-78-0B, or d05f.afad.780b")
      return
    }

    try {
      setActionLoading(true)
      const response = await apiRequest(`/customer/${customerId}/mac`, {
        method: 'PUT',
        body: JSON.stringify({
          newMacAddress: normalizedMac
        })
      })

      toast.success(response.message || "MAC address reset successfully")

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
        setNewMacAddress(updatedCustomer.devices?.[0]?.macAddress || "")
      }

      setResetMacOpen(false)
    } catch (error: any) {
      console.error("Error resetting MAC:", error)
      toast.error(error.message || "Failed to reset MAC address")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRenewPackage = async () => {
    try {
      setRenewLoading(true)

      const response = await apiRequest("/customer/subscribe", {
        method: 'POST',
        body: JSON.stringify({ customerId: parseInt(customerId), createOrder: true }),
        headers: {
          'Content-Type': 'application/json',
        }
      })

      toast.success("Package renewed successfully")

      const updatedCustomer = await apiRequest<Customer>(`/customer/${customerId}`)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }

      setRenewPackageOpen(false)
    } catch (error: any) {
      console.error("Error renewing package:", error)
      toast.error(error.message || "Failed to renew package")
    } finally {
      setRenewLoading(false)
    }
  }

  const openReprovisionRadiusDialog = () => {
    if (customer) {
      setReprovisionPkgId(customer.subscribedPkgId ? customer.subscribedPkgId.toString() : "")
      setReprovisionUsername(customer.connectionUsers?.[0]?.username || "")
      setReprovisionPassword(customer.connectionUsers?.[0]?.password || "")
      setReprovisionRadiusOpen(true)
    }
  }

  const openIdentityDialog = () => {
    if (!customer) return
    setIdentityIdNumber(customer.idNumber || "")
    setIdentityPanNumber(customer.panNo || "")
    setIdentityOpen(true)
  }

  const handleIdentitySave = async () => {
    if (!identityIdNumber.trim()) {
      toast.error("ID number is required")
      return
    }
    if (identityPanNumber.trim() && !/^\d{9}$/.test(identityPanNumber.trim())) {
      toast.error("PAN number must contain exactly 9 digits")
      return
    }
    try {
      setIdentitySaving(true)
      await apiRequest(`/customer/${customerId}`, {
        method: "PUT",
        body: JSON.stringify({
          idNumber: identityIdNumber.trim(),
          panNumber: identityPanNumber.trim(),
        }),
        headers: { "Content-Type": "application/json" },
      })
      toast.success("Customer ID and PAN updated")
      setIdentityOpen(false)
      await fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update customer identity")
    } finally {
      setIdentitySaving(false)
    }
  }

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      toast.error("Select a document to upload")
      return
    }
    try {
      setDocumentUploading(true)
      const formData = new FormData()
      formData.append(documentType, documentFile)
      await apiRequest(`/customer/${customerId}/documents`, { method: "POST", body: formData })
      toast.success("Document uploaded successfully")
      setDocumentUploadOpen(false)
      setDocumentFile(null)
      await fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document")
    } finally {
      setDocumentUploading(false)
    }
  }

  const handleReprovisionRadiusSubmit = async () => {
    if (!reprovisionPkgId || !reprovisionUsername || !reprovisionPassword) {
      toast.error("Package, username, and password are required")
      return
    }
    try {
      setServiceActionLoading("radius")
      const response = await apiRequest<{ success: boolean; message: string }>(`/customer/${customerId}/reprovision/radius`, {
        method: "POST",
        body: JSON.stringify({
          subscribedPkgId: Number(reprovisionPkgId),
          username: reprovisionUsername,
          password: reprovisionPassword
        })
      })
      if (response.success) {
        toast.success(response.message || "Radius reprovisioned successfully")
        setReprovisionRadiusOpen(false)
        fetchCustomerData()
      } else {
        toast.error("Radius reprovisioning failed")
      }
    } catch (error: any) {
      console.error("Error reprovisioning Radius:", error)
      toast.error(error.message || "Radius reprovisioning failed")
    } finally {
      setServiceActionLoading(null)
    }
  }

  const handleReprovisionNettv = async (nettvData: any) => {
    try {
      const wasAlreadyLinked = Boolean(getLinkedNettvUsername(customer))
      setServiceActionLoading("nettv")
      const response = await apiRequest<{ success: boolean; message: string }>(`/customer/${customerId}/reprovision/nettv`, {
        method: 'POST',
        body: JSON.stringify({ nettvData }),
        headers: { "Content-Type": "application/json" },
      })
      if (response.success) {
        toast.success(response.message || "NetTV reprovisioned successfully")
        await fetchCustomerData()
        if (!wasAlreadyLinked && !nettvData?.provisioning?.stb?.serial) {
          toast.success("Subscriber created. Select the customer's STB and subscription package to complete NetTV provisioning.")
          setNettvProvisionOpen(true)
        }
      } else {
        toast.error("NetTV reprovisioning failed")
      }
    } catch (error: any) {
      console.error("Error reprovisioning NetTV:", error)
      toast.error(error.message || "NetTV reprovisioning failed")
    } finally {
      setServiceActionLoading(null)
    }
  }

  const handleReprovisionAccount = async () => {
    try {
      setServiceActionLoading("account")
      const response = await apiRequest<{ success: boolean; message: string }>(`/customer/${customerId}/reprovision/account`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
      })
      if (response.success) {
        toast.success(response.message || "Account reprovisioned successfully")
        fetchCustomerData()
      } else {
        toast.error(response.message || "Account reprovisioning failed")
      }
    } catch (error: any) {
      console.error("Error reprovisioning Account:", error)
      toast.error(error.message || "Account reprovisioning failed")
    } finally {
      setServiceActionLoading(null)
    }
  }

  const handleDisconnectSession = async () => {
    const connectionUser = customer?.connectionUsers?.[0]
    if (!connectionUser) {
      toast.error("No connection user found for this customer")
      return
    }

    try {
      setServiceActionLoading("disconnect")
      const response = await apiRequest<{ success: boolean; message: string }>(`/customer/disconnect/${connectionUser.username}`, {
        method: 'POST'
      })
      if (response.success) {
        toast.success(response.message || "Radius session disconnected successfully")
        fetchActiveSessions()
        fetchRadiusAuthLogs()
      } else {
        toast.error("Disconnection failed")
      }
    } catch (error: any) {
      console.error("Error disconnecting session:", error)
      toast.error(error.message || "Failed to disconnect session")
    } finally {
      setServiceActionLoading(null)
    }
  }

  const handleDeleteCustomer = async () => {
    setDeleteCustomerOpen(true)
  }

  const confirmDeleteCustomer = async () => {
    try {
      setActionLoading(true)
      await apiRequest(`/customer/${customerId}`, {
        method: 'DELETE',
      })

      toast.success("Customer deleted successfully")

      router.push('/customers')
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast.error(error.message || "Failed to delete customer")
    } finally {
      setActionLoading(false)
    }
  }

  const deleteOntFromOlt = async (serialNumber: string) => {
    if (!serialNumber) throw new Error("Cannot delete ONT: serial number is missing");
    const oltId = customer?.serviceDetails?.[0]?.oltId || customer?.oltId;
    if (!oltId) {
      throw new Error("Cannot delete ONT: customer has no associated OLT");
    }
    
    try {
      console.log(`[OLT_DELETE] Fetching ONT details for serial ${serialNumber} from OLT ${oltId}`);
      const serialCandidates = [...new Set([serialNumber, convertToPonHex(serialNumber)].filter(Boolean))]
      let res: any = null
      for (const candidate of serialCandidates) {
        const candidateResponse = await apiRequest<any>(`/olt/${oltId}/onts?search=${encodeURIComponent(candidate)}`)
        if (candidateResponse?.success && Array.isArray(candidateResponse.data) && candidateResponse.data.length > 0) {
          res = candidateResponse
          break
        }
      }
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const ont = res.data[0];
        const fsp = ont.servicePort || ""; 
        const ontIdVal = ont.ontId;
        const servicePorts = ont.ontDetails?.servicePorts;

        // Parse FSP (frame/slot/port)
        const fspParts = fsp ? fsp.split('/') : [];
        const frame = fspParts.length > 0 ? parseInt(fspParts[0], 10) : 0;
        const slot = fspParts.length > 1 ? parseInt(fspParts[1], 10) : 0;
        const port = fspParts.length > 2 ? parseInt(fspParts[2], 10) : 0;
        const ont_id = parseInt(ontIdVal, 10);

        if (isNaN(frame) || isNaN(slot) || isNaN(port) || isNaN(ont_id)) {
          throw new Error(`Cannot delete ONT: invalid F/S/P or ONT ID (${fsp}, ${ontIdVal})`);
        }

        let service_port_indices: number[] = [];
        if (servicePorts) {
          try {
            const ports = typeof servicePorts === 'string'
              ? JSON.parse(servicePorts)
              : servicePorts;
            if (Array.isArray(ports)) {
              service_port_indices = ports
                .map((sp: any) => Number(sp?.index ?? sp?.servicePortIndex ?? sp?.service_port))
                .filter((v: any) => Number.isInteger(v) && v >= 0);
            }
          } catch (e) {
            console.error("[OLT_DELETE] Error parsing service ports:", e);
          }
        }

        const payload = {
          action: "deleteOnt",
          params: {
            frame,
            slot,
            port,
            ont_id,
            serial: serialNumber,
            service_port_indices
          }
        };

        console.log(`[OLT_DELETE] Sending deleteOnt action to /device/${oltId}/action`, payload);
        const actionRes = await apiRequest<any>(`/device/${oltId}/action`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });

        if (actionRes?.success) {
          toast.success("ONT deleted from OLT successfully");
        } else {
          throw new Error(actionRes?.error || actionRes?.message || "ONT deletion from OLT returned failure status.");
        }
      } else {
        throw new Error(`Cannot delete ONT: ${serialNumber} was not found in synchronized OLT inventory`);
      }
    } catch (err: any) {
      console.error("[OLT_DELETE] Failed to delete ONT from OLT:", err);
      throw err;
    }
  };

  const confirmReturnHardware = async (note: string, isFaulty: boolean) => {
    if (!returnHardwareItem) return
    const removalKey = String(returnHardwareItem.serialNumber || returnHardwareItem.id)
    try {
      setActionLoading(true)
      setRemovingDeviceKey(removalKey)
      toast.loading("Please wait while the device is removed from the OLT, customer and TR-069...", { id: "device-removal" })
      const isOnt = String(returnHardwareItem.type || returnHardwareItem.deviceType || '').toUpperCase() === 'ONT';
      if (isOnt) {
        const assignedDevice = customer?.devices?.find((device: any) =>
          (returnHardwareItem.serialNumber && device.serialNumber === returnHardwareItem.serialNumber) ||
          (returnHardwareItem.macAddress && device.macAddress === returnHardwareItem.macAddress)
        )
        await deleteOntFromOlt(assignedDevice?.ponSerial || assignedDevice?.serialNumber || returnHardwareItem.serialNumber);
      }
      await apiRequest(`/inventory/${returnHardwareItem.id}/return`, {
        method: "PUT",
        body: JSON.stringify({
          status: isFaulty ? "FAULTY" : "IN_STOCK",
          note: note || `Returned from customer ${customer?.customerUniqueId || customerId}`,
        }),
      })
      toast.success("Hardware returned and TR-069 link removed successfully", { id: "device-removal" })
      setReturnHardwareItem(null)
      fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to return hardware", { id: "device-removal" })
    } finally {
      setActionLoading(false)
      setRemovingDeviceKey(null)
    }
  }

  const getMatchingInventoryItem = (device: any) => {
    if (!customer?.inventoryItems) return null
    return customer.inventoryItems.find((item: any) => 
      (device.serialNumber && item.serialNumber === device.serialNumber) ||
      (device.macAddress && item.macAddress === device.macAddress)
    ) || null
  }

  const hasInventoryItem = (device: any) => {
    return !!getMatchingInventoryItem(device)
  }

  const handleReturnOrDeleteDevice = (device: any) => {
    const matchingItem = getMatchingInventoryItem(device)
    if (matchingItem) {
      setReturnHardwareItem(matchingItem)
      setReturnHardwareOpen(true)
    } else {
      setDeletingDevice(device)
      setDeleteDeviceOpen(true)
    }
  }

  const confirmDeleteDevice = async () => {
    if (!deletingDevice || !customer) return
    const targetDevice = deletingDevice
    const removalKey = String(targetDevice.serialNumber || targetDevice.id)
    try {
      setActionLoading(true)
      setRemovingDeviceKey(removalKey)
      toast.loading("Please wait while the device is removed from the OLT, customer and TR-069...", { id: "device-removal" })
      await apiRequest(`/customer/${customer.id}/devices/${targetDevice.id}`, {
        method: "DELETE"
      })
      toast.success("Device deleted and TR-069 link removed successfully", { id: "device-removal" })
      setDeletingDevice(null)
      fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete device", { id: "device-removal" })
    } finally {
      setActionLoading(false)
      setRemovingDeviceKey(null)
      setDeleteDeviceOpen(false)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NPR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImageDocument = (doc: Customer["documents"][number]) => {
    return /^image\//i.test(doc.mimeType || "") || /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName || "")
  }

  const isPdfDocument = (doc: Customer["documents"][number]) => {
    return String(doc.mimeType || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(doc.fileName || "")
  }

  const getDocumentPreviewUrl = (doc: Customer["documents"][number]) => {
    if (doc.previewUrl) return buildApiAssetUrl(doc.previewUrl)
    if (doc.filePath) return buildApiAssetUrl(`/${doc.filePath.replace(/\\/g, "/")}`)
    return ""
  }

  const getDocumentDownloadUrl = (doc: Customer["documents"][number], inline = false) => {
    const path = doc.downloadUrl || (customer ? `/customer/${customer.id}/documents/${doc.id}/download` : "")
    if (!path) return getDocumentPreviewUrl(doc)
    if (/^https?:\/\//i.test(path)) return inline ? `${path}${path.includes("?") ? "&" : "?"}inline=1` : path
    const baseUrl = getDynamicBaseUrl().replace(/\/+$/, "")
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    return `${baseUrl}${cleanPath}${inline ? `${cleanPath.includes("?") ? "&" : "?"}inline=1` : ""}`
  }

  const getCustomerFullName = () => {
    if (!customer) return ""
    return `${customer.firstName} ${customer.middleName ? customer.middleName + ' ' : ''}${customer.lastName}`
  }

  const getCustomerInitials = () => {
    if (!customer) return "CU"
    const parts = [customer.firstName, customer.middleName, customer.lastName]
      .filter((name): name is string => Boolean(name && name.trim()))
      .flatMap((name) => name.trim().split(/\s+/))

    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return "CU"
  }

  const getCustomerProfilePictureUrl = () => {
    const rawPicture = customer?.profilePicture || customer?.portalUser?.profilePicture
    return rawPicture ? buildApiAssetUrl(rawPicture) : ""
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case "active":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">ACTIVE</Badge>
      case "suspended":
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">SUSPENDED</Badge>
      case "inactive":
        return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0">INACTIVE</Badge>
      default:
        return <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">{status.toUpperCase()}</Badge>
    }
  }

  const getConnectionType = () => customer?.serviceDetails?.[0]?.connectionType ?? "N/A"
  const getProvisioningStatus = () => {
    const serviceStatus = customer?.serviceDetails?.[0]?.status
    if (serviceStatus) return serviceStatus
    if (String(customer?.status || '').toLowerCase() === 'active') return 'active'
    return "N/A"
  }
  const getMacAddress = () => formatColonMacAddress(customer?.devices?.[0]?.macAddress)
  const getDeviceModel = () => customer?.devices?.[0]?.model ?? "N/A"
  const getVlanId = () => customer?.serviceDetails?.[0]?.vlanId ?? "N/A"
  const getVlanPriority = () => customer?.serviceDetails?.[0]?.vlanPriority ?? "N/A"
  const formatConnectionType = (type: string) => type?.toUpperCase() ?? "N/A"

  const getServiceMessage = (app: any): string => {
    const data = app.serviceData
    if (!data) return "No data"
    if (data.message) return data.message
    if (data.Message) return data.Message
    if (data.Data?.Message) return data.Data.Message
    if (data.Error) return data.Error
    if (data.success === false && data.error) return data.error
    if (typeof data === 'object') {
      if (data.data?.radcheck?.username) return `User ${data.data.radcheck.username} created`
      if (data.subscriber?.id) return `Subscriber ID: ${data.subscriber.id}`
    }
    return "Success"
  }

  const getSubscribedApp = (codes: string[]) => {
    const normalizedCodes = codes.map((code) => code.toUpperCase())
    return customer?.subscribedApps?.find((app: any) => {
      const serviceCode = String(app.service?.code || "").toUpperCase()
      const serviceName = String(app.service?.name || "").toUpperCase()
      return normalizedCodes.some((code) => serviceCode.includes(code) || serviceName.includes(code))
    })
  }

  const isAppProvisioned = (app: any) => {
    if (!app) return false
    const status = String(app.status || app.serviceData?.status || app.serviceData?.Status || "").toLowerCase()
    return status === "active" || status === "success" || status === "provisioned" || app.serviceData?.success === true
  }

  const isNettvProvisioned = isAppProvisioned(getSubscribedApp(["NETTV", "NET TV"]));

  const provisionedServices = [
    {
      label: "Radius / PPPoE",
      icon: Key,
      provisioned: Boolean(customer?.connectionUsers?.some((user) => user.isActive)),
      status: customer?.connectionUsers?.some((user) => user.isActive) ? "Provisioned" : "Not provisioned",
      detail: customer?.connectionUsers?.map((user) => user.username).filter(Boolean).join(", ") || "No active Radius login",
    },
    {
      label: "NetTV",
      icon: Tv,
      app: getSubscribedApp(["NETTV", "NET TV"]),
      provisioned: isAppProvisioned(getSubscribedApp(["NETTV", "NET TV"])),
      status: isAppProvisioned(getSubscribedApp(["NETTV", "NET TV"])) ? "Provisioned" : "Not provisioned",
      detail: getSubscribedApp(["NETTV", "NET TV"]) ? getServiceMessage(getSubscribedApp(["NETTV", "NET TV"])) : "No NetTV subscription",
    },
    {
      label: "Account",
      icon: CreditCard,
      app: getSubscribedApp(["TSHUL", "NEPURIX", "BILLING"]),
      provisioned: isAppProvisioned(getSubscribedApp(["TSHUL", "NEPURIX", "BILLING"])),
      status: isAppProvisioned(getSubscribedApp(["TSHUL", "NEPURIX", "BILLING"])) ? "Provisioned" : "Not provisioned",
      detail: getSubscribedApp(["TSHUL", "NEPURIX", "BILLING"]) ? getServiceMessage(getSubscribedApp(["TSHUL", "NEPURIX", "BILLING"])) : "No account subscription",
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading customer data...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error || "Customer not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/customers')} className="mt-2">Back to Customers</Button>
        </div>
      </div>
    )
  }

  const invoiceAmount = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalPaid = customer.orders.filter(order => order.isPaid).reduce((sum, order) => sum + order.totalAmount, 0)
  const dueAmount = invoiceAmount - totalPaid
  const latestOrder = customer.orders.length > 0
    ? [...customer.orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0]
    : null
  const billingPackageItems = latestOrder?.packageItems?.length
    ? latestOrder.packageItems.map((item) => ({
        name: item.name || "Package item",
        referenceId: item.referenceId || "N/A",
        amount: Number(latestOrder.totalAmount) === 0 ? 0 : Number(item.amount || 0),
      }))
    : (latestOrder?.items || []).map((item) => ({
        name: item.itemName,
        referenceId: item.referenceId || "N/A",
        amount: Number(item.itemPrice || 0),
      }))
  const latestSubscription = customer.customerSubscriptions.length > 0 ? customer.customerSubscriptions[0] : null

  const getDaysUntilExpiry = () => {
    if (!latestSubscription) return 0
    const expiryDate = new Date(latestSubscription.planEnd)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const daysUntilExpiry = getDaysUntilExpiry()

  const serviceDetail = customer.serviceDetails?.[0]
  const olt = serviceDetail?.olt
  const splitter = serviceDetail?.splitter
  const vlanDetails = serviceDetail?.vlanDetails || []
  const usernames = customer.connectionUsers.map(u => u.username)
  const customerProfileData = customer as Customer & {
    address?: string
    city?: string
    zipCode?: string
  }

  const markProvisioningComplete = async () => {
    setProvisioningStatusSaving(true)
    try {
      const response = await apiRequest<{ success: boolean; message?: string }>(`/customer/${customerId}/provisioning-status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "active" }) })
      toast.success(response.message || "Customer provisioning marked complete")
      await fetchCustomerData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update provisioning status")
    } finally {
      setProvisioningStatusSaving(false)
    }
  }
  const planUsagePercent = latestSubscription ? Math.max(0, Math.min(100, 100 - (daysUntilExpiry / 30) * 100)) : 0
  const profileHighlights = [
    { label: "Subscriber ID", value: customer.customerUniqueId || `CUST-${customer.id.toString().padStart(3, "0")}`, icon: Shield },
    { label: "Primary Login", value: customer.connectionUsers[0]?.username || "Not assigned", icon: Key },
    { label: "Service Plan", value: customer.subscribedPkg?.packageName || "Not subscribed", icon: Package },
    { label: "Balance Due", value: formatPrice(dueAmount), icon: CreditCard },
  ]
  const overviewSignals = [
    { label: "ACS", value: String(customer.ontRealtimeStatus || "offline").toUpperCase(), online: String(customer.ontRealtimeStatus || "").toLowerCase() === "online" },
    { label: "RADIUS", value: String(customer.radiusRealtimeStatus || "offline").toUpperCase(), online: String(customer.radiusRealtimeStatus || "").toLowerCase() === "online" },
    { label: "Provisioning", value: String(getProvisioningStatus()).toUpperCase(), online: String(getProvisioningStatus()).toLowerCase() === "active" },
    { label: "Devices", value: String(customer.devices.length), online: customer.devices.length > 0 },
  ]

  return (
    <div className="customer-profile-shell space-y-6">
      {/* Dialogs */}
      <NetTVDialog
        open={nettvProvisionOpen}
        onOpenChange={setNettvProvisionOpen}
        onConfirm={handleReprovisionNettv}
        defaultFname={customer.firstName || ""}
        defaultLname={customer.lastName || ""}
        defaultEmail={customer.email || ""}
        defaultUsername={getLinkedNettvUsername(customer) || buildNettvCredential(customer.connectionUsers?.[0]?.username || customer.customerUniqueId)}
        defaultPassword={buildNettvCredential(customer.connectionUsers?.[0]?.password)}
        defaultAddress={customer.street || customerProfileData.address || ""}
        defaultCity={customerProfileData.city || customer.district || ""}
        defaultDistrict={customer.district || customerProfileData.city || ""}
        defaultProvince={customer.state || ""}
        defaultZip={customerProfileData.zipCode || ""}
        defaultPhone={customer.phoneNumber || ""}
        defaultMobile={customer.secondaryPhone && !/^no secondary$/i.test(customer.secondaryPhone.trim()) ? customer.secondaryPhone : (customer.phoneNumber || "")}
        defaultLat={String((customer as any).lead?.metadata?.latitude ?? (customer as any).lead?.latitude ?? (customer as any).lead?.lat ?? (customer as any).lead?.location?.latitude ?? (customer as any).latitude ?? (customer as any).lat ?? "")}
        defaultLng={String((customer as any).lead?.metadata?.longitude ?? (customer as any).lead?.longitude ?? (customer as any).lead?.lon ?? (customer as any).lead?.lng ?? (customer as any).lead?.location?.longitude ?? (customer as any).longitude ?? (customer as any).lon ?? (customer as any).lng ?? "")}
      />

      <Dialog open={provisionServicesOpen} onOpenChange={setProvisionServicesOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activate / Provision Services</DialogTitle>
            <DialogDescription>
              Resume a failed customer activation or provision any missing service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div><div className="font-medium">RADIUS Authentication</div><div className="text-sm text-muted-foreground">Create or repair the PPPoE login.</div></div>
              <Button type="button" onClick={() => { setProvisionServicesOpen(false); openReprovisionRadiusDialog() }}>Configure</Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div><div className="font-medium">NETTV IPTV</div><div className="text-sm text-muted-foreground">Create or repair the NETTV subscriber.</div></div>
              <Button type="button" onClick={() => { setProvisionServicesOpen(false); setNettvProvisionOpen(true) }}>Configure</Button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div><div className="font-medium">{accountingProvision.name} Billing</div><div className="text-sm text-muted-foreground">Requires an ID number{accountingProvision.requiresPan ? " and valid 9-digit PAN" : ""}.</div></div>
              <Button type="button" disabled={serviceActionLoading === "account"} onClick={() => {
                if (!customer.idNumber || (accountingProvision.requiresPan && !/^\d{9}$/.test(customer.panNo || ""))) {
                  toast.error(`Update the customer ID${accountingProvision.requiresPan ? " and 9-digit PAN" : ""} before provisioning Account Billing.`)
                  setProvisionServicesOpen(false)
                  openIdentityDialog()
                  return
                }
                handleReprovisionAccount()
              }}>
                {serviceActionLoading === "account" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Provision
              </Button>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setProvisionServicesOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={identityOpen} onOpenChange={setIdentityOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Customer ID and PAN</DialogTitle>
            <DialogDescription>Identity is required for customer activation; PAN is required for Account Billing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2"><Label htmlFor="profile-id-number">ID Number / Passport *</Label><Input id="profile-id-number" value={identityIdNumber} onChange={(e) => setIdentityIdNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="profile-pan-number">PAN Number</Label><Input id="profile-pan-number" inputMode="numeric" maxLength={9} value={identityPanNumber} onChange={(e) => setIdentityPanNumber(e.target.value.replace(/\D/g, ""))} placeholder="9-digit PAN" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIdentityOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleIdentitySave} disabled={identitySaving}>{identitySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentUploadOpen} onOpenChange={setDocumentUploadOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Upload Customer Document</DialogTitle><DialogDescription>Upload an image, PDF, Word document, or other supported customer record.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2"><Label>Document Type</Label><Select value={documentType} onValueChange={setDocumentType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="idProof">ID Proof</SelectItem><SelectItem value="addressProof">Address Proof</SelectItem><SelectItem value="photo">Customer Photo</SelectItem><SelectItem value="otherDocuments">Other Document</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="customer-document">File *</Label><Input id="customer-document" type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDocumentUploadOpen(false)}>Cancel</Button><Button type="button" onClick={handleDocumentUpload} disabled={documentUploading}>{documentUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reprovisionRadiusOpen} onOpenChange={setReprovisionRadiusOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovision Radius User</DialogTitle>
            <DialogDescription>Choose a package, username, and password to provision to the Radius server.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reprovisionPackage">Subscribed Package *</Label>
              <Select value={reprovisionPkgId} onValueChange={setReprovisionPkgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.packageName} - {formatPrice(pkg.price)}/{pkg.packageDuration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reprovisionUsername">Radius Username *</Label>
              <Input
                id="reprovisionUsername"
                value={reprovisionUsername}
                onChange={(e) => setReprovisionUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reprovisionPassword">Radius Password *</Label>
              <Input
                id="reprovisionPassword"
                type="text"
                value={reprovisionPassword}
                onChange={(e) => setReprovisionPassword(e.target.value)}
                placeholder="Password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setReprovisionRadiusOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleReprovisionRadiusSubmit} disabled={serviceActionLoading === "radius"}>
              {serviceActionLoading === "radius" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reprovision & Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changeUsernameOpen} onOpenChange={setChangeUsernameOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>Update the username for this customer's connection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection-user">Connection User</Label>
              <Select value={selectedConnectionUser} onValueChange={setSelectedConnectionUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection user" />
                </SelectTrigger>
                <SelectContent>
                  {customer.connectionUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>{user.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input id="new-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Enter new username" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeUsernameOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeUsername} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={changePackageOpen} onOpenChange={setChangePackageOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Package</DialogTitle>
            <DialogDescription>Select a new package for this customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select value={selectedPlanName} onValueChange={(planName) => {
                setSelectedPlanName(planName)
                setSelectedPackage(String(packages.find(pkg => pkg.packagePlanDetails?.planName === planName)?.id || ""))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {packages.filter((pkg, index, rows) => rows.findIndex(item => item.planId === pkg.planId) === index).map(pkg => <SelectItem key={pkg.planId} value={pkg.packagePlanDetails?.planName || String(pkg.planId)}>{String(pkg.packageName || pkg.packagePlanDetails?.planName || "Package").replace(/\s+-\s+(1|3|6|12)\s+Months?$/i, "")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Enabled Duration</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage} disabled={!selectedPlanName}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {packages.filter(pkg => pkg.packagePlanDetails?.planName === selectedPlanName).map(pkg => <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.packageDuration} · {formatPrice(pkg.price)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedPackage && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-muted-foreground">The customer will be switched to the selected package immediately.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePackageOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePackage} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetMacOpen} onOpenChange={setResetMacOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset MAC Address</DialogTitle>
            <DialogDescription>Update the MAC address for this customer's device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-mac">Current MAC Address</Label>
              <Input id="current-mac" value={getMacAddress()} readOnly className="bg-slate-50 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-mac">New MAC Address</Label>
              <Input id="new-mac" value={newMacAddress} onChange={(e) => setNewMacAddress(e.target.value)} placeholder="00:1A:2B:3C:4D:5E" />
              <p className="text-xs text-muted-foreground">Format: 00:1A:2B:3C:4D:5E or 00-1A-2B-3C-4D-5E</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetMacOpen(false)}>Cancel</Button>
            <Button onClick={handleResetMac} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset MAC Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renewPackageOpen} onOpenChange={setRenewPackageOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Package</DialogTitle>
            <DialogDescription>
              Renew the current package for this customer. This will create a new order and extend the subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Current Package</div>
                  <div className="text-sm text-muted-foreground">
                    {customer?.subscribedPkg?.packageName} - {formatPrice(customer?.subscribedPkg?.price || 0)}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="text-sm">
                  A new order will be created and the subscription will be extended based on the package duration.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewPackageOpen(false)}>Cancel</Button>
            <Button onClick={handleRenewPackage} disabled={renewLoading} className="bg-gradient-to-r from-green-500 to-emerald-600">
              {renewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renew Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteCustomerOpen}
        onOpenChange={setDeleteCustomerOpen}
        title="Delete customer?"
        description="This will revert the customer back to a qualified lead. Customers with assigned hardware cannot be deleted until devices are returned to stock, office, or staff."
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteCustomer}
      />

      <ConfirmDialog
        open={returnHardwareOpen}
        onOpenChange={(open) => {
          setReturnHardwareOpen(open)
          if (!open) setReturnHardwareItem(null)
        }}
        title="Return hardware?"
        description={`Return ${returnHardwareItem?.serialNumber || returnHardwareItem?.name || "this hardware"} from this customer before deleting or reassigning it.`}
        confirmLabel="Return Hardware"
        cancelLabel="Cancel"
        showInput
        inputLabel="Return note"
        inputPlaceholder="Reason or office/staff return note"
        showCheckbox
        checkboxLabel="Mark device as faulty"
        onConfirm={confirmReturnHardware}
      />

      <Dialog open={portalPasswordOpen} onOpenChange={setPortalPasswordOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{customer?.portalUser ? "Edit Portal Login Credentials" : "Create Portal Account"}</DialogTitle>
            <DialogDescription>
              {customer?.portalUser
                ? "Update the email/username and password for this subscriber's portal login."
                : "Create a new portal login account for this subscriber."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-portal-email">Portal Email / Username</Label>
              <Input
                id="new-portal-email"
                type="text"
                autoCapitalize="none"
                value={newPortalEmail}
                onChange={(e) => setNewPortalEmail(e.target.value)}
                placeholder="username or email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-portal-password">Password</Label>
              <Input
                id="new-portal-password"
                type="password"
                value={newPortalPassword}
                onChange={(e) => setNewPortalPassword(e.target.value)}
                placeholder={customer?.portalUser ? "Enter new password (optional)" : "Enter password (min 4 characters)"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortalPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePortalPassword} disabled={portalPasswordSubmitting}>
              {portalPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer?.portalUser ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={radiusPasswordOpen} onOpenChange={setRadiusPasswordOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Radius Password</DialogTitle>
            <DialogDescription>{radiusPasswordUser?.username || "Connection user"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-radius-password">New Password</Label>
              <Input
                id="new-radius-password"
                type="password"
                value={newRadiusPassword}
                onChange={(e) => setNewRadiusPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRadiusPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRadiusPassword} disabled={radiusPasswordSubmitting}>
              {radiusPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={nettvPasswordOpen} onOpenChange={(open) => { if (!nettvPasswordSaving) setNettvPasswordOpen(open) }}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Force NetTV Password Change</DialogTitle>
            <DialogDescription>Sets a new IPTV account password for this subscriber.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nettv-password">New Password</Label>
              <Input
                id="nettv-password"
                type="password"
                value={nettvPasswordForm.password}
                onChange={(e) => setNettvPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettv-conf-password">Confirm Password</Label>
              <Input
                id="nettv-conf-password"
                type="password"
                value={nettvPasswordForm.conf_password}
                onChange={(e) => setNettvPasswordForm((prev) => ({ ...prev, conf_password: e.target.value }))}
                placeholder="Confirm password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNettvPasswordOpen(false)} disabled={nettvPasswordSaving}>Cancel</Button>
            <Button onClick={handleForceNettvPassword} disabled={nettvPasswordSaving}>
              {nettvPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
          <div className="border-b bg-muted/35 p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 rounded-xl ring-1 ring-border">
              {getCustomerProfilePictureUrl() && (
                <AvatarImage src={getCustomerProfilePictureUrl()} alt={getCustomerFullName()} />
              )}
              <AvatarFallback className="rounded-xl bg-primary text-xl text-primary-foreground">
                {getCustomerInitials()}
              </AvatarFallback>
            </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscriber profile</p>
                <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight">{getCustomerFullName()}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getStatusBadge(customer.status)}
                  {latestSubscription?.isTrial && <Badge variant="secondary">Trial</Badge>}
                  {customer.isRechargeable && <Badge variant="outline">Rechargeable</Badge>}
                  {customer.referencedById && <Badge variant="outline">Referred</Badge>}
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <button type="button" className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-background ${!voipEnabled ? "cursor-not-allowed opacity-60" : ""}`} onClick={() => handleOutboundCall(customer.phoneNumber)}>
                <Phone className="h-4 w-4 text-muted-foreground" /> {customer.phoneNumber || "No mobile number"}
              </button>
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5"><Mail className="h-4 w-4 text-muted-foreground" /> <span className="truncate">{customer.email || "No email address"}</span></div>
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5"><MapPin className="h-4 w-4 text-muted-foreground" /> <span className="truncate">{[customer.street, customer.district, customer.state].filter(Boolean).join(", ") || "No address saved"}</span></div>
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5"><Calendar className="h-4 w-4 text-muted-foreground" /> Member since {formatDate(customer.createdAt)}</div>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
            {profileHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-lg border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-3 truncate text-lg font-semibold">{item.value}</div>
                </div>
              )
            })}
            <div className="sm:col-span-2 xl:col-span-4">
              <div className="grid gap-2 sm:grid-cols-4">
                {overviewSignals.map((signal) => (
                  <div key={signal.label} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-xs">
                    <span className="font-medium text-muted-foreground">{signal.label}</span>
                    <span className={signal.online ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="customer-service-strip grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Customer service summary">
        <div className="customer-service-tile">
          <span className="customer-service-icon bg-[var(--status-info-bg)] text-[var(--status-info)]"><Wifi className="size-4" /></span>
          <div><p>Assigned devices</p><strong>{customer.devices.length}</strong></div>
        </div>
        <div className="customer-service-tile">
          <span className="customer-service-icon bg-[var(--status-success-bg)] text-[var(--status-success)]"><Activity className="size-4" /></span>
          <div><p>Radius logins</p><strong>{customer.connectionUsers.filter((item) => item.isActive).length} active</strong></div>
        </div>
        <div className="customer-service-tile">
          <span className="customer-service-icon bg-[var(--status-warning-bg)] text-[var(--status-warning)]"><Package className="size-4" /></span>
          <div><p>Service plan</p><strong>{latestSubscription ? `${daysUntilExpiry} days left` : "Not subscribed"}</strong></div>
        </div>
        <div className="customer-service-tile">
          <span className="customer-service-icon bg-[var(--status-danger-bg)] text-[var(--status-danger)]"><CreditCard className="size-4" /></span>
          <div><p>Outstanding balance</p><strong>{formatPrice(dueAmount)}</strong></div>
        </div>
      </section>

      <div className="customer-action-bar sticky top-0 z-20 flex flex-wrap gap-2 rounded-2xl border bg-card/95 p-3 shadow-[0_10px_35px_rgba(43,13,58,.08)] backdrop-blur-xl">
        <Button size="sm" variant="ai" className="h-9" onClick={() => setProvisionServicesOpen(true)}>
          <Zap className="mr-2 h-4 w-4" /> Activate / Provision Services
        </Button>
        {(customer.serviceDetails?.some(service => service.status !== "active") || customer.devices?.some(device => device.deviceType === "ONT" && device.provisioningStatus !== "active")) && (
          <Button size="sm" variant="outline" className="h-9 border-emerald-600 text-emerald-700" onClick={markProvisioningComplete} disabled={provisioningStatusSaving}>
            {provisioningStatusSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Mark Provisioning Complete
          </Button>
        )}
        <Button size="sm" className="h-9 bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600" onClick={() => setRenewPackageOpen(true)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Renew Package
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={syncAcsDevice} disabled={acsSyncing}>
          {acsSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Sync ACS
        </Button>
        <Button size="sm" variant="secondary" className="h-9" onClick={() => setChangeUsernameOpen(true)}>
          <User className="mr-2 h-4 w-4" /> Change Username
        </Button>
        <Button size="sm" variant="secondary" className="h-9" onClick={() => setChangePackageOpen(true)}>
          <Package className="mr-2 h-4 w-4" /> Change Packages
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={() => setResetMacOpen(true)}>
          <RefreshCw className="mr-2 h-4 w-4" /> MAC RESET
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={openReprovisionRadiusDialog} disabled={serviceActionLoading === "radius"}>
          {serviceActionLoading === "radius" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
          Reprovision Radius
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={() => setNettvProvisionOpen(true)} disabled={serviceActionLoading === "nettv"}>
          {serviceActionLoading === "nettv" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tv className="mr-2 h-4 w-4" />}
          Reprovision NetTV
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9"
          onClick={() => customer?.customerUniqueId && router.push(`/nettv?subscriber=${encodeURIComponent(customer.customerUniqueId)}`)}
          disabled={!customer?.customerUniqueId || !isNettvProvisioned}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Open NetTV Details
        </Button>
        <Button size="sm" variant="outline" className="h-9" onClick={handleReprovisionAccount} disabled={serviceActionLoading === "account"}>
          {serviceActionLoading === "account" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Reprovision Account
        </Button>
        <Button size="sm" className="h-9 bg-amber-600 text-white hover:bg-amber-700" onClick={handleDisconnectSession} disabled={serviceActionLoading === "disconnect"}>
          {serviceActionLoading === "disconnect" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WifiOff className="mr-2 h-4 w-4" />}
          Disconnect Session
        </Button>
        <Button size="sm" variant="destructive" className="h-9" onClick={handleDeleteCustomer} disabled={actionLoading}>
          {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete Customer
        </Button>
        {customer?.leadId && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:hover:bg-amber-950/20"
            onClick={() => router.push(`/leads/edit/${customer.leadId}`)}
          >
            <Pencil className="mr-2 h-4 w-4 text-amber-500" /> Edit Lead Details
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex overflow-x-auto justify-start h-auto p-1 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 scrollbar-none">
          <TabsTrigger value="overview" className="flex-1 flex-shrink-0"><User className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 flex-shrink-0"><CreditCard className="mr-2 h-4 w-4" />Billing</TabsTrigger>
          <TabsTrigger value="devices" className="flex-1 flex-shrink-0"><Wifi className="mr-2 h-4 w-4" />Devices</TabsTrigger>
          <TabsTrigger value="usage" className="flex-1 flex-shrink-0"><BarChart className="mr-2 h-4 w-4" />Graphs</TabsTrigger>
          <TabsTrigger value="realtime" className="flex-1 flex-shrink-0"><Activity className="mr-2 h-4 w-4" />Realtime Usage</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 flex-shrink-0"><FileText className="mr-2 h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="radius" className="flex-1 flex-shrink-0"><Key className="mr-2 h-4 w-4" />Radius Login</TabsTrigger>
          <TabsTrigger value="nettv" className="flex-1 flex-shrink-0"><Tv className="mr-2 h-4 w-4" />NetTV</TabsTrigger>
          <TabsTrigger value="support" className="flex-1 flex-shrink-0"><LifeBuoy className="mr-2 h-4 w-4" />Support</TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 flex-shrink-0"><History className="mr-2 h-4 w-4" />Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service command summary</p>
                  <h3 className="mt-1 text-xl font-semibold">{customer.subscribedPkg?.packageName || "No active package"}</h3>
                </div>
                <Badge className={daysUntilExpiry < 7 ? "bg-red-600 text-white" : daysUntilExpiry < 30 ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}>
                  {latestSubscription ? `${daysUntilExpiry} days remaining` : "No subscription"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Speed Profile</div>
                  <div className="mt-1 font-semibold">{customer.subscribedPkg?.packagePlanDetails?.downSpeed || "N/A"} / {customer.subscribedPkg?.packagePlanDetails?.upSpeed || "N/A"} Mbps</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Primary Device</div>
                  <div className="mt-1 truncate font-semibold">{getDeviceModel()}</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Active Sessions</div>
                  <div className="mt-1 font-semibold">{customer.connectionUsers.filter((item) => item.isActive).length} RADIUS user(s)</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current cycle progress</span>
                  <span className="font-medium">{latestSubscription ? `${Math.round(planUsagePercent)}% used` : "N/A"}</span>
                </div>
                <Progress value={planUsagePercent} className="h-2" />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick facts</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">ISP</span><span className="font-medium">{customer.isp.companyName}</span></div>
                <div className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">ID / PAN</span><span className="font-medium">{customer.idNumber || "N/A"} / {customer.panNo || "N/A"}</span></div>
                <div className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">Lead</span><span className="font-medium">{customer.leadId || "N/A"}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Last update</span><span className="font-medium">{formatDate(customer.updatedAt)}</span></div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardContainer title="Account Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Customer ID:</span>
                    <span className="font-medium">{customer.customerUniqueId || `CUST-${customer.id.toString().padStart(3, '0')}`}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Primary Username:</span>
                    <span className="font-medium">{customer.connectionUsers.length > 0 ? customer.connectionUsers[0].username : "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ID Number:</span>
                    <span className="font-medium">{customer.idNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">PAN Number:</span>
                    <span className="font-medium">{customer.panNo || "N/A"}</span>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="mt-1 w-full" onClick={openIdentityDialog}>
                    <Pencil className="mr-2 h-4 w-4" /> Update ID & PAN
                  </Button>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{getCustomerFullName()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Email Address:</span>
                    <span className="font-medium text-blue-500">{customer.email}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Phone Number:</span>
                    <button type="button" className={`font-medium hover:text-green-600 ${!voipEnabled ? "cursor-not-allowed opacity-50 hover:text-muted-foreground" : ""}`} onClick={() => handleOutboundCall(customer.phoneNumber)}>{customer.phoneNumber}</button>
                  </div>
                  {customer.secondaryPhone && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Secondary Phone:</span>
                      <button type="button" className={`font-medium hover:text-green-600 ${!voipEnabled ? "cursor-not-allowed opacity-50 hover:text-muted-foreground" : ""}`} onClick={() => handleOutboundCall(customer.secondaryPhone)}>{customer.secondaryPhone}</button>
                    </div>
                  )}
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Account Status:</span>
                    <span className="font-medium">{getStatusBadge(customer.status)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Registration Date:</span>
                    <span className="font-medium">{formatDate(customer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{formatDate(customer.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Service Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ISP Provider:</span>
                    <span className="font-medium">{customer.isp.companyName}</span>
                  </div>
                  {customer.membership && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Membership:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.membership.name}</div>
                        <div className="text-xs text-muted-foreground">Code: {customer.membership.code}</div>
                      </div>
                    </div>
                  )}
                  {customer.installedBy && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Installed By:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.installedBy.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.installedBy.email}</div>
                      </div>
                    </div>
                  )}
                  {customer.referencedBy && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Referred By:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.referencedBy.firstName} {customer.referencedBy.lastName}</div>
                        <div className="text-xs text-muted-foreground">{customer.referencedBy.email}</div>
                      </div>
                    </div>
                  )}
                  {customer.existingISP && (
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Previous ISP:</span>
                      <div className="text-right">
                        <div className="font-medium">{customer.existingISP.name}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Lead ID:</span>
                    <span className="font-medium flex items-center gap-1.5">
                      {customer.leadId ? (
                        <>
                          <span>{customer.leadId}</span>
                          <span
                            className="text-xs text-blue-500 hover:text-blue-600 cursor-pointer hover:underline flex items-center ml-1"
                            onClick={() => router.push(`/leads/edit/${customer.leadId}`)}
                          >
                            (Edit Lead)
                          </span>
                        </>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Reference Status:</span>
                    <span className="font-medium">{customer.referencedById ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Subscription & Billing" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Current Package:</span>
                    <span className="font-medium">{customer.subscribedPkg.packageName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Price:</span>
                    <span className="font-medium">{formatPrice(customer.subscribedPkg.price)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Billing Cycle:</span>
                    <span className="font-medium capitalize">{customer.subscribedPkg.packageDuration}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Subscription Type:</span>
                    <span className="font-medium">{customer.isRechargeable ? "Rechargeable" : "Standard"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium">Not set</span>
                  </div>
                  {latestSubscription && (
                    <>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Current Status:</span>
                        <Badge className={latestSubscription.isPaused ? "bg-amber-600 text-white" : "bg-green-600 text-white"}>{latestSubscription.isPaused ? "PAUSED" : latestSubscription.isTrial ? "TRIAL" : "ACTIVE"}</Badge>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Plan Start:</span>
                        <span className="font-medium">{formatDate(latestSubscription.planStart)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Plan End:</span>
                        <span className="font-medium">{formatDate(latestSubscription.planEnd)}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <span className={`font-medium ${daysUntilExpiry < 7 ? "text-red-500" : daysUntilExpiry < 30 ? "text-amber-500" : "text-green-500"}`}>
                          {daysUntilExpiry} days
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardContainer title="Connection Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Connection Type:</span>
                    <span className="font-medium">{getConnectionType()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Provisioning Status:</span>
                    <Badge className={String(getProvisioningStatus()).toLowerCase() === 'active' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                      {String(getProvisioningStatus()).toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Device Model:</span>
                    <span className="font-medium">{getDeviceModel()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">MAC Address:</span>
                    <span className="font-medium">{getMacAddress()}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Assigned Package:</span>
                    <span className="font-medium">{customer.packagePrice?.packageName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Subscribed Package:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packageName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">ONT Status (ACS):</span>
                    <Badge className={String(customer.ontRealtimeStatus || '').toLowerCase() === 'online' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {String(customer.ontRealtimeStatus || 'N/A').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Radius Link:</span>
                    <Badge className={String(customer.radiusRealtimeStatus || '').toLowerCase() === 'online' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                      {String(customer.radiusRealtimeStatus || 'N/A').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Provisioned Services" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connection Type</div>
                      <div className="mt-1 font-semibold">{formatConnectionType(getConnectionType())}</div>
                    </div>
                    <Badge className={String(getProvisioningStatus()).toLowerCase() === 'active' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                      {String(getProvisioningStatus()).toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {provisionedServices.map((service) => {
                  const Icon = service.icon
                  return (
                    <div key={service.label} className="rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${service.provisioned ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium">{service.label}</div>
                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{service.detail}</div>
                          </div>
                        </div>
                        <Badge className={service.provisioned ? "bg-green-500 text-white" : "bg-amber-500 text-white"}>
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContainer>

            <CardContainer title="Package Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Plan Name:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.planName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Plan Code:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.planCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Download Speed:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.downSpeed || 'N/A'} Mbps</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Upload Speed:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.upSpeed || 'N/A'} Mbps</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Data Limit:</span>
                    <span className="font-medium">
                      {customer.subscribedPkg?.packagePlanDetails?.dataLimit === 0 ? "Unlimited" : customer.subscribedPkg?.packagePlanDetails?.dataLimit ? `${customer.subscribedPkg.packagePlanDetails.dataLimit} GB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Device Limit:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packagePlanDetails?.deviceLimit ?? 'N/A'} devices</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Duration:</span>
                    <span className="font-medium">{customer.subscribedPkg?.packageDuration || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Reference ID:</span>
                    <span className="font-medium">{customer.subscribedPkg?.referenceId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Package Status:</span>
                    <span className="font-medium">
                      <Badge className={customer.subscribedPkg?.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                        {customer.subscribedPkg?.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            </CardContainer>

            {customer.radiusAccounting && (
              <CardContainer title="Radius Session Info" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Session Status:</span>
                      <Badge className={String(customer.radiusAccounting.status || '').toLowerCase() === 'online' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {String(customer.radiusAccounting.status).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Upload Traffic:</span>
                      <span className="font-medium">
                        {(() => {
                          const bytes = customer.radiusAccounting.sessionUpload;
                          if (!bytes || bytes <= 0) return "0 B";
                          const sizes = ["B", "KB", "MB", "GB", "TB"];
                          const i = Math.floor(Math.log(bytes) / Math.log(1024));
                          return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Download Traffic:</span>
                      <span className="font-medium">
                        {(() => {
                          const bytes = customer.radiusAccounting.sessionDownload;
                          if (!bytes || bytes <= 0) return "0 B";
                          const sizes = ["B", "KB", "MB", "GB", "TB"];
                          const i = Math.floor(Math.log(bytes) / Math.log(1024));
                          return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">NAS IP:</span>
                      <span className="font-medium font-mono">{customer.radiusAccounting.nasIp}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Framed IP:</span>
                      <span className="font-medium font-mono">{customer.radiusAccounting.framedIp}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-muted-foreground">Online Duration:</span>
                      <span className="font-medium">{formatDuration(customer.radiusAccounting.onlineDuration)}</span>
                    </div>
                  </div>
                </div>
              </CardContainer>
            )}
          </div>

          {/* Network Infrastructure Card */}
          {serviceDetail && (
            <CardContainer title="Network Infrastructure" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                {olt && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">OLT: {olt.name}</h4>
                      <Badge className={String(olt.status || '').toLowerCase() === "online" ? "bg-green-500" : "bg-red-500"}>{olt.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Model:</div><div className="font-medium">{olt.model}</div>
                      <div>IP Address:</div><div className="font-mono">{olt.ipAddress}</div>
                      <div>Vendor:</div><div>{olt.vendor}</div>
                      <div>Ports:</div><div>{olt.usedPorts}/{olt.totalPorts} used</div>
                      {serviceDetail.oltPort && (
                        <>
                          <div>OLT Port:</div><div>{serviceDetail.oltPort}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {splitter && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Split className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">Splitter: {splitter.name}</h4>
                      <Badge className={splitter.status === "active" ? "bg-green-500" : "bg-red-500"}>{splitter.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Splitter ID:</div><div className="font-mono">{splitter.splitterId}</div>
                      <div>Ratio:</div><div>{splitter.splitRatio}</div>
                      <div>Type:</div><div>{splitter.splitterType || "N/A"}</div>
                      <div>Ports:</div><div>{splitter.availablePorts}/{splitter.portCount} available</div>
                      <div>Location:</div><div>{splitter.location?.site || "N/A"}</div>
                      {serviceDetail.splitterPort && (
                        <>
                          <div>Splitter Port:</div><div>{serviceDetail.splitterPort}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {vlanDetails.length > 0 && (
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">VLANs</h4>
                    </div>
                    <div className="space-y-2">
                      {vlanDetails.map((vlan) => (
                        <div key={vlan.id} className="flex items-center justify-between text-sm p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <div>
                            <span className="font-medium">VLAN {vlan.vlanId}</span> - {vlan.name}
                            {vlan.description && <span className="text-xs text-muted-foreground ml-1">({vlan.description})</span>}
                          </div>
                          <div className="flex gap-4">
                            {vlan.gemIndex && <span>GEM: {vlan.gemIndex}</span>}
                            <Badge className={vlan.status === "active" ? "bg-green-500" : "bg-red-500"}>{vlan.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContainer>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardContainer title="Location Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">Street:</span>
                    <span className="font-medium">{customer.street || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">District:</span>
                    <span className="font-medium">{customer.district || "N/A"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-muted-foreground">State:</span>
                    <span className="font-medium">{customer.state || "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer title="Subscriber Portal Login Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Portal Account</span>
                  </div>
                  <Badge variant={customer.portalUser ? (customer.portalUser.status === 'active' ? 'default' : 'secondary') : 'secondary'}>
                    {customer.portalUser ? (customer.portalUser.status === 'active' ? 'Active' : 'Inactive') : 'No Login account'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-muted-foreground">Portal Username/Email:</span>
                    <span className="font-mono font-medium">{getPortalLoginIdentifier(customer.portalUser?.email || getFallbackPortalEmail(customer))}</span>
                  </div>
                  {customer.portalUser ? (
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-muted-foreground">Password Hash:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {showPortalPassword ? "Hashed in database" : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowPortalPassword(prev => !prev)}
                        >
                          {showPortalPassword ? (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-muted-foreground">Default Password (Initial):</span>
                      <span className="font-mono font-medium">{customer.customerUniqueId?.toLowerCase().replace(/\s+/g, '') || "N/A"}</span>
                    </div>
                  )}
                  <div className="flex justify-end mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setNewPortalEmail(getPortalLoginIdentifier(customer.portalUser?.email || getFallbackPortalEmail(customer)))
                        setNewPortalPassword("")
                        setPortalPasswordOpen(true)
                      }} 
                      className="gap-1.5"
                    >
                      <Key className="h-3.5 w-3.5" />
                      {customer.portalUser ? "Edit Portal Login" : "Create Portal Account"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          <CustomerBillingManagement customer={customer} refreshCustomer={fetchCustomerData} controlsOnly />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CardContainer title="RADIUS / PPPoE Credentials" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-3">
                {customer.connectionUsers.length > 0 ? (
                  customer.connectionUsers.map((connectionUser) => (
                    <div key={connectionUser.id} className="rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{connectionUser.username}</span>
                        </div>
                        <Badge variant={connectionUser.isActive ? "default" : "secondary"}>
                          {connectionUser.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Password:</span>
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {visiblePasswords[connectionUser.id] ? connectionUser.password : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setVisiblePasswords(prev => ({
                            ...prev,
                            [connectionUser.id]: !prev[connectionUser.id]
                          }))}
                        >
                          {visiblePasswords[connectionUser.id] ? (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openRadiusPasswordDialog(connectionUser)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No connection users saved.</div>
                )}
              </div>
            </CardContainer>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardContainer title="Billing Summary" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Invoice Amount:</div>
                        <div className="font-bold">{formatPrice(invoiceAmount)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <div>Total Paid:</div>
                        <div>{formatPrice(totalPaid)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium text-red-500">Due Amount:</div>
                        <div className="font-bold text-red-500">{formatPrice(dueAmount)}</div>
                      </div>
                      {latestOrder && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Due Date: {formatDate(latestOrder.packageEnd)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Expiry Date:</div>
                        <div>{latestSubscription ? formatDate(latestSubscription.planEnd) : "N/A"}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Last Renewal: {formatDate(customer.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <CreditCard className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div className="w-full">
                      <div className="flex justify-between">
                        <div className="font-medium">Payment Method:</div>
                        <div>Not set</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Auto Renew: {networkSettings.autoRenew ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>
                </div>
                {billingPackageItems.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="mb-2 text-sm font-semibold">Current Package Items</div>
                    <div className="space-y-2">
                      {billingPackageItems.map((item, index) => (
                        <div key={`${item.referenceId}-${index}`} className="flex items-center justify-between gap-4 rounded-md bg-background/60 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{item.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{item.referenceId}</div>
                          </div>
                          <div className="shrink-0 font-mono font-semibold">{formatPrice(item.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContainer>

            <CardContainer title="Subscription Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Wifi className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{customer.subscribedPkg.packagePlanDetails.planName}</div>
                      <div className="text-sm text-muted-foreground">Package: {customer.subscribedPkg.packageName}</div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Billing Cycle: {customer.subscribedPkg.packageDuration}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {customer.isRechargeable ? "Rechargeable" : "Standard"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <FileText className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Price: {formatPrice(customer.subscribedPkg.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        Duration: {customer.subscribedPkg.packageDuration}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Award className="mr-2 h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Reference ID: {customer.subscribedPkg.referenceId}</div>
                      <div className="text-sm text-muted-foreground">
                        Package Status: {customer.subscribedPkg.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContainer>
          </div>

          <CardContainer title="Order History" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="space-y-4">
              {customer.orders.length > 0 ? (
                <div className="space-y-3">
                  {customer.orders.map((order) => {
                    const configuredItems = order.packageItems || []
                    const configuredByReference = new Map(configuredItems.filter(item => item.referenceId).map(item => [item.referenceId, item]))
                    const resolvedItems = order.isTrialOrder
                      ? [{
                          sn: 1,
                          itemName: order.packagePrice?.packageName || customer.subscribedPkg?.packageName || 'Trial Package',
                          referenceId: order.packagePrice?.referenceId || customer.subscribedPkg?.referenceId || 'N/A',
                          qty: 1,
                          price: 0,
                          total: 0,
                          isTaxable: false,
                          isTscApplicable: false,
                        }]
                      : configuredItems.length > 0
                      ? configuredItems.map((item, idx) => ({
                          sn: idx + 1,
                          itemName: item.name || 'Package item',
                          referenceId: item.referenceId || 'N/A',
                          qty: 1,
                          price: Number(item.amount || 0),
                          total: Number(item.amount || 0),
                          isTaxable: item.isTaxable !== false,
                          isTscApplicable: item.isTscApplicable === true,
                        }))
                      : order.items && order.items.length > 0
                      ? order.items.map((item: any, idx: number) => {
                          const configured = item.referenceId ? configuredByReference.get(item.referenceId) : null
                          return {
                            sn: idx + 1,
                            itemName: item.itemName,
                            referenceId: item.referenceId || 'N/A',
                            qty: 1,
                            price: item.itemPrice,
                            total: item.itemPrice,
                            isTaxable: configured ? configured.isTaxable !== false : true,
                            isTscApplicable: configured ? configured.isTscApplicable === true : false,
                          }
                        })
                      : [
                          {
                            sn: 1,
                            itemName: order.packagePrice?.packageName || customer.packagePrice?.packageName || customer.subscribedPkg?.packageName || 'ARR-100-MBPS',
                            referenceId: order.packagePrice?.referenceId || customer.packagePrice?.referenceId || customer.subscribedPkg?.referenceId || 'N/A',
                            qty: 1,
                            price: order.packagePrice?.price ?? order.totalAmount,
                            total: order.totalAmount,
                            isTaxable: true,
                            isTscApplicable: false,
                          }
                        ];
                    const itemsSubtotal = resolvedItems.reduce((sum, item) => sum + Number(item.total || 0), 0)
                    const itemsTsc = resolvedItems.reduce((sum, item) => sum + (item.isTscApplicable ? Number(item.total || 0) * billingTscPercentage / 100 : 0), 0)
                    const taxableAmount = resolvedItems.reduce((sum, item) => item.isTaxable ? sum + Number(item.total || 0) + (item.isTscApplicable ? Number(item.total || 0) * billingTscPercentage / 100 : 0) : sum, 0)
                    const vatAmount = taxableAmount * 0.13
                    return (
                      <div key={order.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Order #{order.id}</span>
                              <Badge variant={order.isPaid ? "default" : "secondary"} className={order.isPaid ? "bg-green-500" : "bg-amber-500"}>
                                {order.isPaid ? "Paid" : "Pending"}
                              </Badge>
                              <Badge variant="outline" className={order.isActive ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                                {order.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Order Date: {formatDate(order.orderDate)} | Package: {order.packageStart} to {order.packageEnd}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{formatPrice(order.totalAmount)}</div>
                            <div className="text-sm text-muted-foreground">{resolvedItems.length} items</div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="text-sm font-medium mb-2">Order Items:</div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-muted-foreground uppercase">
                                  <th className="py-2 px-3 text-center">S.N.</th>
                                  <th className="py-2 px-3">Item Name</th>
                                  <th className="py-2 px-3">Reference ID</th>
                                  <th className="py-2 px-3 text-center">Qty</th>
                                  <th className="py-2 px-3 text-right">Unit Price</th>
                                  <th className="py-2 px-3 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                {resolvedItems.map((item) => (
                                  <tr key={item.sn} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="py-2.5 px-3 text-center font-mono text-xs">{item.sn}</td>
                                    <td className="py-2.5 px-3 font-medium text-foreground">{item.itemName}</td>
                                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{item.referenceId}</td>
                                    <td className="py-2.5 px-3 text-center">{item.qty}</td>
                                    <td className="py-2.5 px-3 text-right font-mono">{formatPrice(item.price)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono font-medium">{formatPrice(item.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {configuredItems.length > 0 && (
                            <div className="ml-auto mt-3 grid max-w-sm grid-cols-2 gap-x-5 gap-y-1 border-t pt-3 text-sm">
                              <span className="text-muted-foreground">Subtotal</span><span className="text-right font-mono">{formatPrice(itemsSubtotal)}</span>
                              <span className="text-muted-foreground">TSC ({billingTscPercentage}%)</span><span className="text-right font-mono">{formatPrice(itemsTsc)}</span>
                              <span className="text-muted-foreground">Taxable Amount</span><span className="text-right font-mono">{formatPrice(taxableAmount)}</span>
                              <span className="text-muted-foreground">VAT (13%)</span><span className="text-right font-mono">{formatPrice(vatAmount)}</span>
                              <span className="font-semibold">Total Amount</span><span className="text-right font-mono font-semibold">{formatPrice(order.totalAmount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">No order history found</div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Orders: {customer.orders.length} | Total Amount: {formatPrice(invoiceAmount)}
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Dialog open={assignHardwareOpen} onOpenChange={setAssignHardwareOpen}>
            <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-3xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Fiber Network Provisioning
                </DialogTitle>
                <DialogDescription>
                  Configure splitter, OLT, VLANs, and add devices. Use Autofind to discover and match ONT.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Connection Method */}
                <div className="space-y-4">
                  <Label>Connection Method</Label>
                  <RadioGroup
                    value={hwProvisionDetails.useSplitter ? "splitter" : "direct"}
                    onValueChange={(value) => {
                      if (value === "splitter") {
                        setHwProvisionDetails((prev) => ({ ...prev, useSplitter: true, useDirectOLT: false }))
                      } else {
                        setHwProvisionDetails((prev) => ({ ...prev, useSplitter: false, useDirectOLT: true }))
                      }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="splitter" id="splitter-method" />
                      <Label htmlFor="splitter-method" className="flex items-center cursor-pointer font-medium">
                        <Split className="mr-2 h-5 w-5 text-primary" />
                        Via Splitter
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="direct" id="direct-method" />
                      <Label htmlFor="direct-method" className="flex items-center cursor-pointer font-medium">
                        <Server className="mr-2 h-5 w-5 text-primary" />
                        Direct OLT Port
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Splitter selection */}
                {hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="splitterId">Splitter</Label>
                    <SearchableSelect
                      options={splitters
                        .filter(s => (s.availablePorts ?? 0) > 0 || s.id.toString() === hwProvisionDetails.splitterId)
                        .map((splitter) => ({
                          value: splitter.id.toString(),
                          label: `${splitter.name} (${splitter.splitterId})`,
                          description: `Ratio: ${splitter.splitRatio} | Ports: ${splitter.portCount} | Available: ${splitter.availablePorts ?? 0}`,
                        }))}
                      value={hwProvisionDetails.splitterId}
                      onValueChange={(value) => {
                        const val = Array.isArray(value) ? value[0] : value
                        const selectedSplitter = splitters.find(s => s.id.toString() === val)
                        if (selectedSplitter) {
                          const ultimateOlt = findUltimateOltForSplitter(val)
                          setHwProvisionDetails((prev) => ({
                            ...prev,
                            splitterId: val,
                            oltId: ultimateOlt ? ultimateOlt.id.toString() : '',
                          }))
                        } else {
                          setHwProvisionDetails((prev) => ({ ...prev, splitterId: val }))
                        }
                      }}
                      placeholder={loadingSplitters ? "Loading splitters..." : "Select splitter with available ports"}
                      disabled={loadingSplitters}
                    />
                  </div>
                )}

                {/* Display selected splitter details with hierarchy */}
                {hwProvisionDetails.splitterId && hwProvisionDetails.useSplitter && (
                  (() => {
                    const selectedSplitter = splitters.find(s => s.id.toString() === hwProvisionDetails.splitterId)
                    if (!selectedSplitter) return null
                    const path = getSplitterPath(hwProvisionDetails.splitterId)
                    const ultimateOlt = findUltimateOltForSplitter(hwProvisionDetails.splitterId)
                    return (
                      <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                        <h4 className="font-medium text-sm">Selected Splitter Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Name:</div><div>{selectedSplitter.name}</div>
                          <div>ID:</div><div>{selectedSplitter.splitterId}</div>
                          <div>Ratio:</div><div>{selectedSplitter.splitRatio}</div>
                          <div>Type:</div><div>{selectedSplitter.splitterType || "N/A"}</div>
                          <div>Ports:</div><div>{selectedSplitter.portCount} total, {selectedSplitter.availablePorts ?? 0} available</div>
                          <div>Status:</div><div><Badge variant={selectedSplitter.status === "active" ? "default" : "destructive"}>{selectedSplitter.status}</Badge></div>
                        </div>

                        {/* Hierarchy Path */}
                        {path.length > 1 && (
                          <div className="mt-2">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Splitter Hierarchy</Label>
                            <div className="flex flex-wrap items-center gap-1 mt-1 text-xs">
                              {path.map((s, idx) => (
                                <React.Fragment key={s.id}>
                                  {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${s.id === selectedSplitter.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    {s.name}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ultimate OLT */}
                        {ultimateOlt && (
                          <div className="mt-3 p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Server className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-xs text-green-800 dark:text-green-300">Ultimate OLT</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <span className="text-muted-foreground">Name:</span><span className="font-medium">{ultimateOlt.name}</span>
                              {resolveSplitterBoardPort(path) && (
                                <>
                                  <span className="text-muted-foreground">Port:</span><span className="font-mono font-medium">{resolveSplitterBoardPort(path)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()
                )}

                {/* OLT selection for direct connection */}
                {!hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="oltId">OLT</Label>
                    <SearchableSelect
                      options={olts.map((olt) => ({
                        value: olt.id.toString(),
                        label: olt.name,
                        description: `${olt.model}`,
                      }))}
                      value={hwProvisionDetails.oltId}
                      onValueChange={(value) => {
                        const val = Array.isArray(value) ? value[0] : value
                        handleHwProvisionChange("oltId", val)
                      }}
                      placeholder={loadingOlts ? "Loading OLTs..." : "Select OLT"}
                      disabled={loadingOlts}
                    />
                  </div>
                )}

                {/* OLT Port Input – only for direct connection */}
                {!hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="oltPort">OLT Port</Label>
                    <Input
                      id="oltPort"
                      value={hwProvisionDetails.oltPort}
                      onChange={(e) => handleHwProvisionChange("oltPort", e.target.value)}
                      placeholder="e.g., 1/1/1"
                    />
                  </div>
                )}

                {hwProvisionDetails.useSplitter && (
                  <div className="space-y-2">
                    <Label htmlFor="splitterPort">Splitter Output Port</Label>
                    <Input
                      id="splitterPort"
                      value={hwProvisionDetails.splitterPort}
                      onChange={(e) => handleHwProvisionChange("splitterPort", e.target.value)}
                      placeholder="e.g., 1-32"
                    />
                  </div>
                )}

                {/* VLAN Multi-Select */}
                {hwProvisionDetails.oltId && (
                  (() => {
                    const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
                    if (!selectedOlt || !selectedOlt.vlans || selectedOlt.vlans.length === 0) {
                      return (
                        <div className="text-sm text-muted-foreground">No VLANs available for this OLT.</div>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        <Label>Select VLANs</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                          {selectedOlt.vlans.map((vlan) => (
                            <div key={vlan.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`vlan-${vlan.id}`}
                                checked={hwProvisionDetails.selectedVlanIds.includes(vlan.id.toString())}
                                onCheckedChange={(checked) => {
                                  const newIds = checked
                                    ? [...hwProvisionDetails.selectedVlanIds, vlan.id.toString()]
                                    : hwProvisionDetails.selectedVlanIds.filter(id => id !== vlan.id.toString())
                                  handleHwProvisionChange("selectedVlanIds", newIds)
                                }}
                              />
                              <Label htmlFor={`vlan-${vlan.id}`} className="text-sm cursor-pointer font-normal">
                                {vlan.vlanId} - {vlan.name} {vlan.description ? `(${vlan.description})` : ''}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}

                {/* Profile Multi-Select */}
                {hwProvisionDetails.oltId && (
                  (() => {
                    const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
                    if (!selectedOlt || !selectedOlt.profiles || selectedOlt.profiles.length === 0) {
                      return (
                        <div className="text-sm text-muted-foreground">No profiles available for this OLT.</div>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        <Label>Select Profiles</Label>
                        <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                          {selectedOlt.profiles.map((profile) => (
                            <div key={profile.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`profile-${profile.id}`}
                                checked={hwProvisionDetails.selectedProfileIds.includes(profile.id.toString())}
                                onCheckedChange={(checked) => {
                                  const newIds = checked
                                    ? [...hwProvisionDetails.selectedProfileIds, profile.id.toString()]
                                    : hwProvisionDetails.selectedProfileIds.filter(id => id !== profile.id.toString())
                                  handleHwProvisionChange("selectedProfileIds", newIds)
                                }}
                              />
                              <Label htmlFor={`profile-${profile.id}`} className="text-sm cursor-pointer font-normal">
                                {profile.name} ({profile.type}) {profile.description ? `- ${profile.description}` : ''}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}

                {hwProvisionDetails.oltId && (() => {
                  const selectedOlt = olts.find(o => o.id.toString() === hwProvisionDetails.oltId)
                  const loadFiles = selectedOlt?.loadFiles || []
                  return (
                    <div className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label>Load ONT configuration file</Label>
                          <p className="text-xs text-muted-foreground">Runs after ONT registration and service-port creation.</p>
                        </div>
                        <Switch
                          checked={hwProvisionDetails.loadOntConfig}
                          disabled={loadFiles.length === 0}
                          onCheckedChange={(checked) => setHwProvisionDetails(prev => ({
                            ...prev,
                            loadOntConfig: checked,
                            selectedLoadFileId: checked ? (prev.selectedLoadFileId || loadFiles[0]?.id || "") : prev.selectedLoadFileId,
                          }))}
                        />
                      </div>
                      {hwProvisionDetails.loadOntConfig && (
                        <Select value={hwProvisionDetails.selectedLoadFileId} onValueChange={(value) => handleHwProvisionChange("selectedLoadFileId", value)}>
                          <SelectTrigger><SelectValue placeholder="Select ONT file" /></SelectTrigger>
                          <SelectContent>
                            {loadFiles.map(file => <SelectItem key={file.id} value={file.id}>{file.filename} ({file.tftpHost})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {loadFiles.length === 0 && <p className="text-xs text-muted-foreground">Add a load file in the selected OLT first.</p>}
                    </div>
                  )
                })()}

                {/* Customer Devices Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Customer Devices</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      setHwEditingDeviceIndex(null)
                      setHwDeviceDialogOpen(true)
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Device
                    </Button>
                  </div>

                  {hwDevices.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No devices added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {hwDevices.map((device, index) => (
                        <div key={index} className="flex items-start justify-between p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                          <div>
                            <div className="font-semibold text-sm">{device.brand} {device.model}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {device.deviceType} • SN: {device.serialNumber} • MAC: {device.macAddress || "N/A"}
                              {device.ponSerial && <span> • PON-SN: {device.ponSerial}</span>}
                            </div>
                            {device.notes && <div className="text-xs text-gray-500 mt-1 italic">Notes: {device.notes}</div>}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => openDeviceDialogForEdit(index)}>
                              Edit
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeDevice(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Autofind ONT Section */}
                {hwProvisionDetails.oltId && (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">ONT Discovery</Label>
                      {isAlreadyProvisioned ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                          PROVISIONED & ACTIVE
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAutoFindOnt}
                          disabled={
                            isAutoFinding ||
                            !hwProvisionDetails.oltId ||
                            (hwProvisionDetails.useDirectOLT && !hwProvisionDetails.oltPort)
                          }
                        >
                          {isAutoFinding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Autofind ONT
                        </Button>
                      )}
                    </div>

                    {isAlreadyProvisioned ? (
                      <p className="text-xs text-muted-foreground">
                        The ONT device is already successfully provisioned and active on the OLT network.
                      </p>
                    ) : (
                      <>
                        {/* Show the board port that will be used */}
                        {hwProvisionDetails.useSplitter && hwProvisionDetails.splitterId && (
                          <div className="text-xs text-muted-foreground">
                            Using board port from splitter:{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">
                              {(() => {
                                const path = getSplitterPath(hwProvisionDetails.splitterId);
                                return resolveSplitterBoardPort(path) || 'Not available';
                              })()}
                            </code>
                          </div>
                        )}

                        {hwProvisionDetails.useDirectOLT && hwProvisionDetails.oltPort && (
                          <div className="text-xs text-muted-foreground">
                            Using entered OLT port:{' '}
                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">
                              {hwProvisionDetails.oltPort}
                            </code>
                          </div>
                        )}

                        {autoFindError && (
                          <Alert variant="destructive" className="py-2.5">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{autoFindError}</AlertDescription>
                          </Alert>
                        )}

                        {discoveredOnts.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="discoveredOntSelect" className="text-xs font-medium">Select Discovered ONT</Label>
                            <SearchableSelect
                              options={discoveredOnts.map((ont) => ({
                                value: ont.ont_id_details,
                                label: `${ont.ont_id_details} (on ${ont.interface})`,
                              }))}
                              value={selectedDiscoveredOnt?.ont_id_details || ''}
                              onValueChange={(value) => {
                                const val = Array.isArray(value) ? value[0] : value
                                handleSelectDiscoveredOnt(val)
                              }}
                              placeholder="Choose an ONT from the list"
                            />
                          </div>
                        )}

                        {matchedDeviceForOnt && selectedDiscoveredOnt && (
                          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 py-2.5">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                              Matched with device: {matchedDeviceForOnt.brand} {matchedDeviceForOnt.model}
                              {matchedDeviceForOnt.ponSerial && ` (PON-SN: ${matchedDeviceForOnt.ponSerial})`}
                            </AlertDescription>
                          </Alert>
                        )}
                        {selectedDiscoveredOnt && !matchedDeviceForOnt && (
                          <Alert variant="destructive" className="py-2.5">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              No matching device found. Please add a device with matching serial/MAC/PON-SN.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignHardwareOpen(false)}>Cancel</Button>
                <Button onClick={handleHwProvisionSave} disabled={hwProvisionLoading}>
                  {hwProvisionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Device Provision
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DeviceDialog
            open={hwDeviceDialogOpen}
            onOpenChange={setHwDeviceDialogOpen}
            device={hwEditingDeviceIndex !== null ? hwDevices[hwEditingDeviceIndex] : undefined}
            onSave={handleDeviceSave}
          />

          <EditAssignedDeviceDialog
            open={editDeviceOpen}
            onOpenChange={setEditDeviceOpen}
            device={editingDevice}
            customerId={customer.id}
            onSaveSuccess={fetchCustomerData}
          />

          <ConfirmDialog
            open={deleteDeviceOpen}
            onOpenChange={(open) => {
              setDeleteDeviceOpen(open)
              if (!open) setDeletingDevice(null)
            }}
            title="Delete device?"
            description={`Are you sure you want to delete the device ${deletingDevice?.brand || ""} ${deletingDevice?.model || ""} (Serial: ${deletingDevice?.serialNumber || "N/A"})? This action cannot be undone.`}
            confirmLabel="Delete Device"
            cancelLabel="Cancel"
            variant="destructive"
            onConfirm={confirmDeleteDevice}
          />

          <CardContainer title="Assigned Hardware" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{customer.devices.length} device{customer.devices.length === 1 ? "" : "s"} assigned</div>
              <Button onClick={() => setAssignHardwareOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Hardware
              </Button>
            </div>
            {customer.devices.length > 0 ? (
              <div className="space-y-3">
                {customer.devices.map((device, index) => {
                  const hasInv = hasInventoryItem(device);
                  const deviceKey = String(device.serialNumber || device.id)
                  const isRemoving = removingDeviceKey === deviceKey
                  return (
                    <div key={`${device.serialNumber || device.macAddress || index}`} className={`flex flex-col gap-3 rounded-lg border p-4 transition-opacity sm:flex-row sm:items-center sm:justify-between ${isRemoving ? "pointer-events-none opacity-60" : ""}`}>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {device.deviceType || "Device"} {device.brand || ""} {device.model || ""}
                          <Badge variant={device.provisioningStatus === "active" ? "default" : "secondary"}>
                            {device.provisioningStatus?.toUpperCase() || "PENDING"}
                          </Badge>
                          {isRemoving && <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Removing...</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Serial: <span className="font-mono">{device.serialNumber || "N/A"}</span> | MAC: <span className="font-mono">{device.macAddress || "N/A"}</span>
                          {device.ponSerial && ` | PON-SN: ${device.ponSerial}`}
                        </div>
                        {device.notes && <div className="text-xs text-muted-foreground italic">Note: {device.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setAssignHardwareOpen(true);
                          }}
                          disabled={actionLoading || isRemoving}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleReturnOrDeleteDevice(device)}
                          disabled={actionLoading || isRemoving}
                        >
                          {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : hasInv ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          <span className="sr-only">{hasInv ? "Return" : "Delete"}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No hardware assigned yet.</div>
            )}
          </CardContainer>

          {customer.devices.filter(d => d.deviceType === "ONT" && d.serialNumber).length > 0 && (
            <CardContainer title="ACS Device Information" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
              <Tabs defaultValue={customer.devices.find(d => d.deviceType === "ONT")?.serialNumber}>
                <TabsList className="w-full flex overflow-x-auto justify-start h-auto scrollbar-none mb-4 bg-muted p-1 rounded-lg">
                  {customer.devices.filter(d => d.deviceType === "ONT").map((device, idx) => (
                    <TabsTrigger key={idx} value={device.serialNumber} className="flex-shrink-0">{device.brand} {device.model}</TabsTrigger>
                  ))}
                </TabsList>
                {customer.devices.filter(d => d.deviceType === "ONT").map((device, idx) => (
                  <TabsContent key={idx} value={device.serialNumber}>
                    <Tabs defaultValue="basic-info">
                      <TabsList className="w-full flex overflow-x-auto justify-start h-auto scrollbar-none mb-4 bg-muted p-1 rounded-lg">
                        <TabsTrigger value="basic-info" className="flex-shrink-0">Basic Info</TabsTrigger>
                        <TabsTrigger value="wan" className="flex-shrink-0">WAN Connections</TabsTrigger>
                        <TabsTrigger value="wifi" className="flex-shrink-0">WiFi</TabsTrigger>
                        <TabsTrigger value="lan" className="flex-shrink-0">LAN</TabsTrigger>
                        <TabsTrigger value="neighbor-devices" className="flex-shrink-0">Connected Devices</TabsTrigger>
                      </TabsList>
                      <TabsContent value="basic-info"><TR069DeviceDetails deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="wan"><TR069DeviceWanConnections deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="wifi"><TR069DeviceWifi deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="lan"><TR069DeviceLanInfo deviceId={device.serialNumber} /></TabsContent>
                      <TabsContent value="neighbor-devices"><TR069DeviceNeighbors deviceId={device.serialNumber} /></TabsContent>
                    </Tabs>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContainer>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <CardContainer title="Data Usage History" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <DataUsageHistory usernames={usernames} />
          </CardContainer>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <CardContainer title="Realtime Usage" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <RealtimeUsageChart usernames={usernames} />
          </CardContainer>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <CardContainer title="Customer Documents" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" type="button" onClick={() => setDocumentUploadOpen(true)}><Upload className="mr-2 h-4 w-4" />Upload Document</Button>
              </div>
              {customer.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.documents.map((doc) => (
                    <div key={doc.id} className="overflow-hidden rounded-lg border border-slate-200 bg-background dark:border-slate-700">
                      <div className="h-40 bg-slate-100 dark:bg-slate-800">
                        {isImageDocument(doc) && getDocumentPreviewUrl(doc) ? (
                          <img src={getDocumentPreviewUrl(doc)} alt={doc.fileName} className="h-full w-full object-cover" />
                        ) : isPdfDocument(doc) ? (
                          <iframe src={getDocumentPreviewUrl(doc) || getDocumentDownloadUrl(doc, true)} title={doc.fileName} className="h-full w-full bg-white" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <FileCheck className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {isImageDocument(doc) ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                              <div className="truncate font-medium">{doc.fileName}</div>
                            </div>
                            <div className="text-sm text-muted-foreground capitalize">{doc.documentType}</div>
                          </div>
                          <Badge variant="outline" className={doc.isDeleted ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}>
                            {doc.isDeleted ? "Deleted" : "Active"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Uploaded: {formatDate(doc.uploadedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Size: {formatFileSize(doc.size)} | Type: {doc.mimeType}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" onClick={() => window.open(getDocumentPreviewUrl(doc) || getDocumentDownloadUrl(doc, true), "_blank")}>
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" onClick={() => {
                            window.open(getDocumentDownloadUrl(doc), "_blank")
                            toast.success(`Opening ${doc.fileName}`)
                          }}>
                            <Download className="mr-1 h-3.5 w-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">No documents uploaded for this customer</div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Documents: {customer.documents.length} |
                ID Proof: {customer.documents.filter(d => d.documentType === "idProof").length} |
                Address Proof: {customer.documents.filter(d => d.documentType === "addressProof").length} |
                Photos: {customer.documents.filter(d => d.documentType === "photo").length}
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="radius" className="space-y-4">
          <CardContainer title="Active RADIUS Sessions" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Currently active PPPoE/Hotspot sessions on the RADIUS server.</p>
              <Button size="sm" variant="outline" onClick={fetchActiveSessions} disabled={activeSessionsLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${activeSessionsLoading ? 'animate-spin' : ''}`} />
                Refresh Sessions
              </Button>
            </div>
            {activeSessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading active sessions...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSessions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No active sessions found on the RADIUS server.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Username</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">IP Address</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">NAS IP</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Start Time</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Uptime</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Usage (DL/UL)</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSessions.map((session: any, idx: number) => {
                          const usageStr = `${session.data_out || "0 B"} / ${session.data_in || "0 B"}`;

                          // Compute uptime from acctstarttime (started_at)
                          let uptimeStr = "N/A";
                          if (session.acctstarttime) {
                            const diffSec = Math.floor((Date.now() - new Date(session.acctstarttime).getTime()) / 1000);
                            uptimeStr = diffSec > 0 ? formatDuration(diffSec) : "00:00:00";
                          }

                          return (
                            <tr key={session.acctsessionid || idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2 px-3 font-mono text-xs">{session.username}</td>
                              <td className="py-2 px-3 font-mono text-xs">{session.framedipaddress || "N/A"}</td>
                              <td className="py-2 px-3 font-mono text-xs">{session.nasipaddress || "N/A"}</td>
                              <td className="py-2 px-3 text-xs">
                                {session.acctstarttime ? new Date(session.acctstarttime).toLocaleString() : "N/A"}
                              </td>
                              <td className="py-2 px-3 text-xs font-mono">
                                {uptimeStr}
                              </td>
                              <td className="py-2 px-3 text-xs font-mono">{usageStr}</td>
                              <td className="py-2 px-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="h-7 px-2 text-xs"
                                    onClick={() => handleDisconnectSessionId(session.acctsessionid)}
                                    disabled={actionLoading}
                                  >
                                    Disconnect
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {customer?.connectionUsers && customer.connectionUsers.length > 0 && activeSessions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {customer.connectionUsers.map((u) => {
                      const userHasSession = activeSessions.some(s => s.username === u.username);
                      if (!userHasSession) return null;
                      return (
                        <Button
                          key={u.id}
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20"
                          onClick={() => handleDisconnectAllSessions(u.username)}
                          disabled={actionLoading}
                        >
                          Disconnect All Sessions for {u.username}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContainer>

          <CardContainer title="Radius Login Details" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Authentication logs from RADIUS server for all connection users.</p>
              <Button size="sm" variant="outline" onClick={fetchRadiusAuthLogs} disabled={radiusAuthLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${radiusAuthLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            {radiusAuthLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading auth logs...</span>
              </div>
            ) : (() => {
              const logsToRender = (radiusAuthLogs && radiusAuthLogs.length > 0)
                ? radiusAuthLogs
                : (customer?.connectionUsers && customer.connectionUsers.length > 0)
                  ? customer.connectionUsers.map((user: any) => ({
                      id: `virtual-${user.id}`,
                      date: null,
                      username: user.username,
                      password: "N/A",
                      mac: "N/A",
                      calledId: "N/A",
                      framedIp: "N/A",
                      nasIp: "N/A",
                      nasPort: "N/A",
                      reply: "N/A",
                      reason: "No radius logs found (using database profile)"
                    }))
                  : [];

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Username</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Password</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">MAC</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Called ID</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Framed IP</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">NAS IP</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">NAS Port</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Reply</th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsToRender.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-8 text-muted-foreground">
                            No connection user saved for this customer.
                          </td>
                        </tr>
                      ) : (
                        logsToRender.map((log: any, idx: number) => (
                          <tr key={log.id || idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 whitespace-nowrap text-xs">
                              {log.date ? new Date(log.date).toLocaleString() : "N/A"}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{log.username}</td>
                            <td className="py-2 px-3">
                              {log.reply === 'Access-Reject' ? (
                                <span className="font-mono text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                                  {log.password}
                                </span>
                              ) : log.password === 'N/A' ? (
                                <span className="font-mono text-xs text-muted-foreground">N/A</span>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">••••••••</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="font-mono text-xs">{log.mac || "N/A"}</span>
                                {log.reply === "Access-Accept" &&
                                  (log.boundMac || /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(String(log.mac || ""))) &&
                                  log.username && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1 px-2 text-xs"
                                    disabled={bindingRadiusMac !== null}
                                    onClick={() => bindRadiusMac(log.username, log.boundMac || log.mac, !log.boundMac)}
                                    title={log.boundMac
                                      ? `Remove Calling-Station-Id ${log.boundMac} from ${log.username}`
                                      : `Bind ${log.mac} to ${log.username} as Calling-Station-Id`}
                                  >
                                    {bindingRadiusMac === `${log.username}:${log.boundMac ? "unbind" : "bind"}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Link className="h-3 w-3" />
                                    )}
                                    {log.boundMac ? "Unbind MAC" : "Bind MAC"}
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{log.calledId || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.framedIp || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.nasIp || "N/A"}</td>
                            <td className="py-2 px-3 font-mono text-xs">{log.nasPort || "N/A"}</td>
                            <td className="py-2 px-3">
                              <Badge 
                                variant={
                                  log.reply === 'Access-Accept' 
                                    ? 'default' 
                                    : log.reply === 'Access-Reject' 
                                      ? 'destructive' 
                                      : 'secondary'
                                } 
                                className="text-xs"
                              >
                                {log.reply || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-xs">{log.reason || "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContainer>
        </TabsContent>

        <TabsContent value="nettv" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold dark:text-white">NetTV Service Details</h3>
            <div className="flex items-center space-x-2">
              {nettvDetails && (
                <Button
                  onClick={() => {
                    setNettvPasswordForm({ password: "", conf_password: "" });
                    setNettvPasswordOpen(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm border-0"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              )}
              <Button
                onClick={handleSyncNettv}
                disabled={syncingNettv || loadingNettv || !customer?.customerUniqueId}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-sm border-0"
              >
                {syncingNettv ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sync NetTV Details
              </Button>
            </div>
          </div>

          {loadingNettv ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-2" />
              <p className="text-slate-500 dark:text-slate-400">Loading NetTV subscriber details...</p>
            </div>
          ) : nettvMessage ? (
            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-medium">NetTV Info</p>
                <p className="text-sm opacity-90">{nettvMessage}</p>
              </div>
            </div>
          ) : nettvDetails ? (
            (() => {
              const sub = nettvDetails.subscriber || {};
              const details = sub.details || {};
              
              // Construct full name
              const fullName = details.fname 
                ? `${details.fname || ""} ${details.mname || ""} ${details.lname || ""}`.trim()
                : sub.fname 
                  ? `${sub.fname} ${sub.lname || ""}`.trim()
                  : "N/A";
              
              // Construct phone/mobile
              const phone = details.phone_no || details.mobile_no || sub.phone_no || sub.mobile_no || "N/A";
              
              // Construct address
              const address = details.address || sub.address || "N/A";
              const city = details.city || "N/A";
              const district = details.district || "N/A";
              const province = details.province_info?.name || details.province || "N/A";
              const country = details.country_info?.name || "Nepal";

              // Reseller info
              const reseller = sub.reseller || {};
              
              // User STBs list
              const userStbs = sub.user_stbs || nettvDetails.stbs || [];

              return (
                <div className="space-y-6">
                  {/* Grid of basic info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Subscriber Account Details */}
                    <CardContainer title="Subscriber Account Details" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Username</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.username || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">ERP ID</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.erp_id || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Registration Type</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{sub.registration_type || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Status</span>
                          <Badge variant={sub.status === 1 ? "default" : "destructive"}>
                            {sub.status === 1 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Wallet Enabled</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.is_wallet_enable ? "Yes" : "No"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Remote Enabled</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.is_remote_enable ? "Yes" : "No"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Balance</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">NPR {sub.balance ?? 0}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Due Amount</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">NPR {sub.due_amount ?? 0}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-1 md:col-span-2">
                          <span className="text-xs text-muted-foreground block mb-1">Created / Updated</span>
                          <span className="font-medium text-slate-600 dark:text-slate-400 text-xs">
                            Created: {sub.created_at || "N/A"} | Updated: {sub.updated_at || "N/A"}
                          </span>
                        </div>
                      </div>
                    </CardContainer>

                    {/* Subscriber Contact Details */}
                    <CardContainer title="Subscriber Contact & Address" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-1 md:col-span-2">
                          <span className="text-xs text-muted-foreground block mb-1">Full Name</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{fullName}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Email</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{sub.email || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Phone Number</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{phone}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-1 md:col-span-2">
                          <span className="text-xs text-muted-foreground block mb-1">Address</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{address}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">City / District</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{city} / {district}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Province / Country</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{province} / {country}</span>
                        </div>
                      </div>
                    </CardContainer>

                  </div>

                  {/* Reseller Details */}
                  {reseller.id && (
                    <CardContainer title="Reseller Details" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Reseller ID & Name</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{reseller.name} (#{reseller.id})</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Username / Profile</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{reseller.username} ({reseller.profile || "N/A"})</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Contact Info</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{reseller.mobile_no || "N/A"} | {reseller.email || "N/A"}</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Reseller Balance</span>
                          <Badge variant="secondary" className="font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            NPR {reseller.credit_balance ?? 0}
                          </Badge>
                        </div>
                      </div>
                    </CardContainer>
                  )}

                  {/* Set Top Box List card */}
                  <CardContainer title="Provisioned Set Top Boxes (STBs)" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    {(!userStbs || userStbs.length === 0) ? (
                      <p className="text-slate-500 dark:text-slate-400 p-4 text-center">No STBs provisioned for this subscriber.</p>
                    ) : (
                      <div className="space-y-6">
                        {userStbs.map((stbItem: any, index: number) => {
                          const mainStb = stbItem.stb || stbItem || {};
                          const stbStatus = stbItem.status || mainStb.status || "N/A";
                          const isActive = String(stbStatus) === "1" || String(stbStatus).toLowerCase() === "active";
                          const pkgs = stbItem.stb_packages || mainStb.subscribed_packages || stbItem.subscribed_packages || stbItem.active_package || [];
                          
                          let maxExpiry = "N/A";
                          pkgs.forEach((pkg: any) => {
                            const exp = pkg.expiry_date || pkg.package_subscription_details?.[0]?.expiry_date;
                            if (exp) {
                              if (maxExpiry === "N/A" || new Date(exp) > new Date(maxExpiry)) {
                                maxExpiry = exp;
                              }
                            }
                          });

                          return (
                            <div key={index} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                <div className="flex items-center space-x-2">
                                  <Tv className="h-5 w-5 text-purple-600" />
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    STB #{index + 1} ({stbItem.stb_label || stbItem.type || mainStb.model?.name || "OTT"})
                                  </span>
                                </div>
                                <Badge variant={isActive ? "default" : "destructive"}>
                                  {isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">Serial Number</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{mainStb.serial || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">MAC Address</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{mainStb.mac || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">Chip ID</span>
                                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{mainStb.chip_id || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block mb-1">Expiry Date</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {maxExpiry !== "N/A" ? new Date(maxExpiry).toLocaleDateString() : "N/A"}
                                  </span>
                                </div>
                              </div>

                              {/* STB Packages list */}
                              <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">STB Packages</h4>
                                {pkgs.length === 0 ? (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">No active packages on this STB.</p>
                                ) : (
                                  <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                                          <th className="py-2.5 px-3 font-semibold">Package Name</th>
                                          <th className="py-2.5 px-3 font-semibold">Price</th>
                                          <th className="py-2.5 px-3 font-semibold">Expiry Date</th>
                                          <th className="py-2.5 px-3 font-semibold">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {pkgs.map((pkg: any, pkgIdx: number) => {
                                          const expStr = pkg.expiry_date || pkg.package_subscription_details?.[0]?.expiry_date;
                                          const isPkgActive = expStr ? new Date(expStr) > new Date() : (pkg.status === "Active" || pkg.status === 1);
                                          return (
                                            <tr key={pkgIdx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                                                {pkg.package_config_name || pkg.name || `Pkg ID: ${pkg.package_id || pkg.id}`}
                                              </td>
                                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                                Rs. {pkg.price || pkg.package_price || 0}
                                              </td>
                                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                                {expStr ? new Date(expStr).toLocaleDateString() : "N/A"}
                                              </td>
                                              <td className="py-2.5 px-3">
                                                <Badge variant={isPkgActive ? "default" : "secondary"} className="text-[10px]">
                                                  {isPkgActive ? "Active" : "Expired"}
                                                </Badge>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContainer>
                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400">No NetTV details available. Click sync to retrieve.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <CustomerTickets customerId={customer.id} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <CardContainer title="Customer & Lead Activity History" className="border border-slate-200/80 shadow-md">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs text-slate-500">
                  Complete audit trail of actions taken for this account by users and automated systems
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAuditLogs}
                  disabled={loadingAudit}
                  className="bg-white border-slate-200"
                >
                  <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loadingAudit ? (
                <div className="space-y-3 py-6">
                  <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
                  No activity log history recorded for this customer.
                </div>
              ) : (
                <OrchestrationConsole logs={auditLogs} title="Customer Orchestration Output Console" />
              )}
            </div>
          </CardContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}
const buildNettvCredential = (value?: string | null) => {
  const cleaned = String(value || "").trim().replace(/^_?nettv/i, "").replace(/_nettv$/i, "")
  return cleaned ? `${cleaned}_nettv` : ""
}

const getLinkedNettvUsername = (customer?: Customer | null) => {
  const app = customer?.subscribedApps?.find((item: any) => String(item.service?.code || "").toUpperCase() === "NETTV") as any
  return String(app?.externalUsername || app?.serviceData?.username || app?.serviceData?.subscriber?.username || "").trim()
}
