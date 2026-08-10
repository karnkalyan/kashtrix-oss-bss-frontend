"use client"

import { Suspense, useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Send,
  Mail,
  Building,
  Navigation,
  BarChart2,
  List,
  Trash2,
  Check,
  MoreVertical,
  Edit,
  User,
  ExternalLink
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useBranch } from "@/contexts/BranchContext"
import { useAuth } from "@/contexts/AuthContext"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { openDirectionsFromCurrentLocation } from "@/lib/directions"

interface Ticket {
  id: number
  ticketNumber: string
  title: string
  description?: string
  status: string
  priority: string
  category?: string
  ticketTypeId?: number
  departmentId?: number
  responseDueAt?: string
  resolutionDueAt?: string
  closeDueAt?: string
  createdAt: string
  updatedAt: string
  customer?: { id: number; firstName: string; lastName: string; email: string }
  subject?: { 
    type: 'CUSTOMER' | 'LEAD' | 'GUEST';
    id: number; 
    uniqueId: string; 
    firstName: string; 
    lastName: string; 
    email: string;
    phoneNumber?: string;
    address?: string;
  }
  assignedTo?: { id: number; name: string; email: string }
  createdBy?: { id: number; name: string; email: string }
  branch?: { id: number; name: string }
  _count?: { comments: number }
  comments?: any[]
  resolution?: string
}

const TICKET_COMPLAINT_CATALOG: Record<string, string[]> = {
  "New Connection": ["Coverage Check", "Plan Inquiry", "New Installation", "Installation Reschedule", "Activation Issue"],
  "Internet Connectivity": ["No Internet", "Slow Internet", "Frequent Disconnection", "High Latency", "Packet Loss", "Website/Application Not Working"],
  "Wi-Fi Issue": ["Weak Signal", "Wi-Fi Not Connecting", "Password Reset", "Limited Coverage", "Too Many Connected Devices"],
  "Fiber/Line Issue": ["LOS Red Light", "Low Optical Power", "Fiber Cable Damage", "Drop Cable Issue", "Distribution Box Issue"],
  "Router/Device Issue": ["Router Not Powering On", "Router Configuration", "Router Reset", "Router Replacement", "ONU/ONT Issue"],
  "Billing and Payment": ["Payment Not Updated", "Incorrect Bill", "Duplicate Payment", "Invoice Request", "Receipt Request", "Refund Request"],
  Renewal: ["Package Renewal", "Account Expired", "Auto-Renewal Issue", "Renewal Confirmation"],
  "Package Change": ["Package Upgrade", "Package Downgrade", "Bandwidth Change", "Package Information", "Usage Inquiry"],
  "Account Management": ["Mobile Number Change", "Email Change", "Password Reset", "Ownership Transfer", "Customer Details Update"],
  Relocation: ["Address Relocation", "Internal Cable Relocation", "Router Relocation", "New Location Feasibility"],
  "Suspension/Termination": ["Temporary Suspension", "Service Reactivation", "Permanent Termination", "Equipment Return"],
  "Network Services": ["Public IP Request", "Static IP Issue", "Port Forwarding", "CGNAT Issue", "DNS Issue", "VPN Issue", "CCTV/Gaming Issue"],
  "IPTV/Value-Added Services": ["IPTV Not Working", "Set-Top Box Issue", "Missing Channel", "OTT Activation", "Voice Service Issue"],
  Outage: ["Area Outage", "Planned Maintenance", "Backbone Issue", "Upstream Issue", "Power Failure"],
  "Complaint/Escalation": ["Technician Delay", "Unresolved Issue", "Poor Customer Service", "Installation Delay", "Billing Dispute", "Supervisor Escalation"],
  Other: ["Other"],
}

function TicketsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { branches, selectedBranchId } = useBranch()
  const { user, hasPermission } = useAuth()
  const { on } = useWebSocket()

  // Layout View Switch
  const [viewMode, setViewMode] = useState<"dashboard" | "list">("dashboard")

  // Dashboard Filters
  const [dashboardDateRange, setDashboardDateRange] = useState("7days") // today, 7days, 30days, all
  const [dashboardType, setDashboardType] = useState("all")

  // Paginated List State
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dashboard raw dataset
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [allLoading, setAllLoading] = useState(false)

  // Creation State
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")

  // Edit State
  const [showEdit, setShowEdit] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)

  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPriority, setNewPriority] = useState("MEDIUM")
  const [newCategory, setNewCategory] = useState("")
  const [newBranchId, setNewBranchId] = useState<string>("none")
  const [notifyEmail, setNotifyEmail] = useState(true)
  
  const [subjectType, setSubjectType] = useState<"CUSTOMER" | "LEAD" | "NONE">("NONE")
  const [subjectId, setSubjectId] = useState<string>("none")
  const [customers, setCustomers] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
  const [assignedToId, setAssignedToId] = useState<string>("none")
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [ticketTypeId, setTicketTypeId] = useState("")
  const [complaintType, setComplaintType] = useState("")
  const [complaintSubtype, setComplaintSubtype] = useState("")
  const [departments, setDepartments] = useState<any[]>([])
  const [departmentId, setDepartmentId] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")

  const roleName = String(typeof user?.role === "string" ? user.role : user?.role?.name || "").toLowerCase()
  const isFieldStaff = roleName.includes("field staff") || roleName.includes("field_staff")
  const selectedSubject = useMemo(() => {
    if (subjectId === "none") return null
    const source = subjectType === "CUSTOMER" ? customers : subjectType === "LEAD" ? leads : []
    return source.find((item: any) => String(item.id) === subjectId) || null
  }, [subjectId, subjectType, customers, leads])
  const linkedSubjectBranchId = selectedSubject?.subBranchId || selectedSubject?.branchId || selectedSubject?.subBranch?.id || selectedSubject?.branch?.id || null

  useEffect(() => {
    if (isFieldStaff) setViewMode("list")
  }, [isFieldStaff])

  useEffect(() => {
    if (linkedSubjectBranchId) setNewBranchId(String(linkedSubjectBranchId))
  }, [linkedSubjectBranchId])

  const handleAssigneeChange = (value: string | string[]) => {
    const selectedValue = Array.isArray(value) ? value[0] : value
    setAssignedToId(selectedValue)
    const assignee = assignableUsers.find((item: any) => String(item.id) === selectedValue)
    const assigneeDepartmentId = assignee?.departmentId || assignee?.department?.id
    if (assigneeDepartmentId) setDepartmentId(String(assigneeDepartmentId))
  }

  const handleComplaintTypeChange = (value: string | string[]) => {
    const nextType = Array.isArray(value) ? value[0] : value
    setComplaintType(nextType)
    setComplaintSubtype("")
    setTicketTypeId("")
    setNewCategory(nextType)
  }

  const handleComplaintSubtypeChange = (value: string | string[]) => {
    const nextSubtype = Array.isArray(value) ? value[0] : value
    setComplaintSubtype(nextSubtype)
    setNewCategory(`${complaintType} > ${nextSubtype}`)
    const normalize = (input: unknown) => String(input || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    const match = ticketTypes.find((type: any) => {
      const candidate = normalize(`${type.name} ${type.code}`)
      return candidate.includes(normalize(nextSubtype)) || candidate.includes(normalize(`${complaintType} ${nextSubtype}`))
    })
    setTicketTypeId(match ? String(match.id) : "")
    if (match?.departmentId) setDepartmentId(String(match.departmentId))
  }

  // Open dropdown trackers
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)

  const loadInitialConfigs = async () => {
    try {
      const [types, deps] = await Promise.all([
        apiRequest<any[]>("/tickets/types?active=true"),
        apiRequest<any>("/department")
      ])
      setTicketTypes(Array.isArray(types) ? types : [])
      setDepartments(Array.isArray(deps) ? deps : (deps?.data || []))
    } catch (e) {
      console.error("Failed to load configs", e)
    }
  }

  const fetchAllTickets = useCallback(async () => {
    setAllLoading(true)
    try {
      const res = await apiRequest<any>("/tickets?limit=1000")
      setAllTickets(res?.data || [])
    } catch (e) {
      console.error("Failed to load dashboard tickets", e)
    } finally {
      setAllLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialConfigs()
    fetchAllTickets()
  }, [fetchAllTickets])

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreate(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (showCreate || showEdit) {
      const fetchSubjects = async () => {
        setLoadingSubjects(true)
        try {
          const [custRes, leadRes] = await Promise.all([
            apiRequest<any>("/customer?limit=200"),
            apiRequest<any>("/lead?limit=200")
          ])
          setCustomers(custRes?.data || [])
          setLeads(leadRes?.data || [])
        } catch (e) {
          console.error("Failed to fetch subjects", e)
        } finally {
          setLoadingSubjects(false)
        }
      }
      fetchSubjects()
    }
  }, [showCreate, showEdit])

  // Dynamic subject search - also search via API when user types in SearchableSelect
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("")
  useEffect(() => {
    if ((!showCreate && !showEdit) || subjectSearchQuery.trim().length < 2) return
    const timer = setTimeout(async () => {
      try {
        if (subjectType === 'CUSTOMER') {
          const res = await apiRequest<any>(`/customer?search=${encodeURIComponent(subjectSearchQuery.trim())}&limit=50`)
          const existing = new Set(customers.map((c: any) => c.id))
          const newItems = (res?.data || []).filter((c: any) => !existing.has(c.id))
          if (newItems.length > 0) setCustomers(prev => [...prev, ...newItems])
        } else if (subjectType === 'LEAD') {
          const res = await apiRequest<any>(`/lead?search=${encodeURIComponent(subjectSearchQuery.trim())}&limit=50`)
          const existing = new Set(leads.map((l: any) => l.id))
          const newItems = (res?.data || []).filter((l: any) => !existing.has(l.id))
          if (newItems.length > 0) setLeads(prev => [...prev, ...newItems])
        }
      } catch {}
    }, 400)
    return () => clearTimeout(timer)
  }, [subjectSearchQuery, showCreate, showEdit, subjectType])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await apiRequest<any[]>("/users")
        const branchId = newBranchId !== "none" ? Number(newBranchId) : selectedBranchId
        setAssignableUsers((users || []).filter((user: any) => {
          const roleName = String(user.role?.name || "").toLowerCase()
          if (roleName === "customer") return false
          if (!branchId) return true
          return user.branchId === branchId || user.branch?.id === branchId || user.userBranches?.some((ub: any) => ub.branch?.id === branchId)
        }))
      } catch (error) {
        console.error("Failed to fetch assignable users", error)
        setAssignableUsers([])
      }
    }
    fetchUsers()
  }, [showCreate, showEdit, newBranchId, selectedBranchId])

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)

      const res = await apiRequest<any>(`/tickets?${params.toString()}`)
      setTickets(res?.data || [])
      setTotalPages(res?.pagination?.totalPages || 1)
      setTotal(res?.pagination?.total || 0)
    } catch (error: any) {
      console.error(error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, priorityFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    return on("data.updated", (event: any) => {
      if (event?.entity !== "ticket_comment" || event?.action !== "created") return
      const ticketId = Number(event.ticketId)
      setTickets(current => current.map(ticket => ticket.id === ticketId
        ? { ...ticket, _count: { comments: (ticket._count?.comments || 0) + 1 } }
        : ticket))
      setAllTickets(current => current.map(ticket => ticket.id === ticketId
        ? { ...ticket, _count: { comments: (ticket._count?.comments || 0) + 1 } }
        : ticket))
      apiRequest<Ticket>(`/tickets/${ticketId}`).then(detail => {
        setSelectedTicket(current => current?.id === ticketId ? detail : current)
      }).catch(() => undefined)
    })
  }, [on])

  const subjectHref = (subject: Ticket["subject"]) => {
    if (!subject) return "#"
    if (subject.type === "GUEST") return "#"
    return subject.type === "CUSTOMER" ? `/customers/${subject.id}` : `/leads/${subject.id}`
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    if (!complaintType || !complaintSubtype) {
      toast({ title: "Complaint type required", description: "Select a complaint type and sub-type.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await apiRequest("/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          category: newCategory || undefined,
          ticketTypeId: ticketTypeId ? Number(ticketTypeId) : undefined,
          departmentId: departmentId ? Number(departmentId) : undefined,
          contactName: subjectType === "NONE" ? contactName : undefined,
          contactPhone: subjectType === "NONE" ? contactPhone : undefined,
          contactEmail: subjectType === "NONE" ? contactEmail : undefined,
          customerId: subjectType === "CUSTOMER" && subjectId !== "none" ? Number(subjectId) : undefined,
          leadId: subjectType === "LEAD" && subjectId !== "none" ? Number(subjectId) : undefined,
          targetBranchId: newBranchId !== "none" ? newBranchId : undefined,
          assignedToId: assignedToId !== "none" ? Number(assignedToId) : undefined,
          notifyEmail,
        }),
      })
      toast({ title: "Success", description: "Ticket created" })
      setShowCreate(false)
      setNewTitle("")
      setNewDescription("")
      setNewPriority("MEDIUM")
      setNewCategory("")
      setNewBranchId("none")
      setAssignedToId("none")
      setSubjectType("NONE")
      setSubjectId("none")
      setTicketTypeId("")
      setComplaintType("")
      setComplaintSubtype("")
      setDepartmentId("")
      setContactName("")
      setContactPhone("")
      setContactEmail("")
      setNotifyEmail(false)
      fetchTickets()
      fetchAllTickets()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const selectTicket = async (ticket: Ticket) => {
    if (isFieldStaff) {
      router.push(`/tickets/${ticket.id}`)
      return
    }
    try {
      const detail = await apiRequest<Ticket>(`/tickets/${ticket.id}`)
      setSelectedTicket(detail)
    } catch (e) {
      setSelectedTicket(ticket)
    }
  }

  const handleStatusChange = async (ticketId: number, status: string) => {
    // Role-based close checks
    if (status === "CLOSED") {
      const roleName = String(typeof user?.role === "string" ? user.role : user?.role?.name || "").toLowerCase()
      const isRestricted = ["support", "admin", "field staff", "field_staff", "staff"].some(r => roleName.includes(r))
      if (isRestricted) {
        toast({ title: "Access Denied", description: "Support, Admin, and Field Staff roles can resolve tickets but cannot close them.", variant: "destructive" })
        return
      }
    }

    try {
      await apiRequest(`/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      toast({ title: "Status updated" })
      fetchTickets()
      fetchAllTickets()
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null)
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleReassign = async (ticketId: number, value: string) => {
    try {
      await apiRequest(`/tickets/${ticketId}`, { method: "PUT", body: JSON.stringify({ assignedToId: value === "none" ? null : Number(value) }) })
      toast({ title: "Ticket reassigned" })
      fetchTickets()
      fetchAllTickets()
      const detail = await apiRequest<Ticket>(`/tickets/${ticketId}`); setSelectedTicket(detail)
    } catch (error: any) { toast({ title: "Reassignment failed", description: error.message, variant: "destructive" }) }
  }

  const handleDelete = async (ticketId: number) => {
    if (!confirm("Are you sure you want to delete this support ticket?")) return
    try {
      await apiRequest(`/tickets/${ticketId}`, { method: "DELETE" })
      toast({ title: "Success", description: "Ticket deleted successfully" })
      fetchTickets()
      fetchAllTickets()
      if (selectedTicket?.id === ticketId) setSelectedTicket(null)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  const handleEditOpen = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setNewTitle(ticket.title)
    setNewDescription(ticket.description || "")
    setNewPriority(ticket.priority)
    setNewCategory(ticket.category || "")
    setNewBranchId(ticket.branch?.id ? String(ticket.branch.id) : "none")
    setAssignedToId(ticket.assignedTo?.id ? String(ticket.assignedTo.id) : "none")
    setTicketTypeId(ticket.ticketTypeId ? String(ticket.ticketTypeId) : "")
    setDepartmentId(ticket.departmentId ? String(ticket.departmentId) : "")
    setShowEdit(true)
  }

  const handleEditSave = async () => {
    if (!editingTicket || !newTitle.trim()) return
    setSubmitting(true)
    try {
      await apiRequest(`/tickets/${editingTicket.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          category: newCategory || undefined,
          ticketTypeId: ticketTypeId ? Number(ticketTypeId) : undefined,
          departmentId: departmentId ? Number(departmentId) : undefined,
          branchId: newBranchId !== "none" ? Number(newBranchId) : null,
          assignedToId: assignedToId !== "none" ? Number(assignedToId) : null
        })
      })
      toast({ title: "Success", description: "Ticket details updated" })
      setShowEdit(false)
      setEditingTicket(null)
      fetchTickets()
      fetchAllTickets()
      if (selectedTicket?.id === editingTicket.id) {
        const detail = await apiRequest<Ticket>(`/tickets/${editingTicket.id}`)
        setSelectedTicket(detail)
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return
    setSubmitting(true)
    try {
      await apiRequest(`/tickets/${selectedTicket.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
      })
      setNewComment("")
      const detail = await apiRequest<Ticket>(`/tickets/${selectedTicket.id}`)
      if (detail) setSelectedTicket(detail)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-500 text-white"
      case "IN_PROGRESS": return "bg-amber-500 text-white"
      case "RESOLVED": return "bg-green-500 text-white"
      case "CLOSED": return "bg-gray-500 text-white"
      default: return "bg-gray-500 text-white"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
      case "HIGH": return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "MEDIUM": return <Clock className="h-4 w-4 text-yellow-500" />
      case "LOW": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  // Dashboard Filtering Calculations
  const filteredDashboardTickets = useMemo(() => {
    let list = [...allTickets]

    // Date range filter
    const now = new Date()
    if (dashboardDateRange === "today") {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      list = list.filter(t => new Date(t.createdAt) >= startOfToday)
    } else if (dashboardDateRange === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      list = list.filter(t => new Date(t.createdAt) >= sevenDaysAgo)
    } else if (dashboardDateRange === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      list = list.filter(t => new Date(t.createdAt) >= thirtyDaysAgo)
    }

    // Type filter
    if (dashboardType !== "all") {
      list = list.filter(t => String(t.ticketTypeId) === dashboardType)
    }

    return list
  }, [allTickets, dashboardDateRange, dashboardType])

  // Aggregate Chart Values
  const widgetStats = useMemo(() => {
    const total = filteredDashboardTickets.length
    const open = filteredDashboardTickets.filter(t => t.status === "OPEN").length
    const progress = filteredDashboardTickets.filter(t => t.status === "IN_PROGRESS").length
    const resolved = filteredDashboardTickets.filter(t => t.status === "RESOLVED").length
    const closed = filteredDashboardTickets.filter(t => t.status === "CLOSED").length
    return { total, open, progress, resolved, closed }
  }, [filteredDashboardTickets])

  const statusPieData = useMemo(() => {
    return [
      { name: "Open", value: widgetStats.open, color: "#3b82f6" },
      { name: "In Progress", value: widgetStats.progress, color: "#f59e0b" },
      { name: "Resolved", value: widgetStats.resolved, color: "#10b981" },
      { name: "Closed", value: widgetStats.closed, color: "#6b7280" }
    ].filter(d => d.value > 0)
  }, [widgetStats])

  const priorityBarData = useMemo(() => {
    const counts = filteredDashboardTickets.reduce((acc: any, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1
      return acc
    }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 })
    return [
      { name: "Low", value: counts.LOW, fill: "#10b981" },
      { name: "Medium", value: counts.MEDIUM, fill: "#f59e0b" },
      { name: "High", value: counts.HIGH, fill: "#f97316" },
      { name: "Urgent", value: counts.CRITICAL, fill: "#ef4444" }
    ]
  }, [filteredDashboardTickets])

  const typeBarData = useMemo(() => {
    const counts = filteredDashboardTickets.reduce((acc: any, t) => {
      const typeObj = ticketTypes.find(type => type.id === t.ticketTypeId)
      const name = typeObj?.name || "Other"
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).map(name => ({
      name,
      value: counts[name],
      fill: "#6366f1"
    }))
  }, [filteredDashboardTickets, ticketTypes])

  const lineTrendData = useMemo(() => {
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const dateKey = d.toDateString()
      const count = filteredDashboardTickets.filter(t => new Date(t.createdAt).toDateString() === dateKey).length
      trend.push({ name: dateStr, tickets: count })
    }
    return trend
  }, [filteredDashboardTickets])

  // Durations & SLA Helper
  const getDurationsAndSLA = (ticket: Ticket) => {
    const created = new Date(ticket.createdAt)
    const now = new Date()
    
    // Response Time (RT)
    let rtHours = "Pending"
    if (ticket.comments && ticket.comments.length > 0) {
      const staffComment = ticket.comments.find(c => c.user && c.user.id !== ticket.subject?.id)
      if (staffComment) {
        const diff = new Date(staffComment.createdAt).getTime() - created.getTime()
        rtHours = (Math.max(0.1, diff / (1000 * 60 * 60))).toFixed(1) + " hrs"
      }
    }

    // Time to Resolve (TTR)
    let ttrHours = "Open"
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      const diff = new Date(ticket.updatedAt).getTime() - created.getTime()
      ttrHours = (Math.max(0.1, diff / (1000 * 60 * 60))).toFixed(1) + " hrs"
    }

    // SLA status check
    let slaStatus = "Met SLA"
    if (ticket.responseDueAt && new Date(ticket.responseDueAt) < now && rtHours === "Pending") {
      slaStatus = "Response Overdue"
    } else if (ticket.resolutionDueAt && new Date(ticket.resolutionDueAt) < now && (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED")) {
      slaStatus = "Resolve Overdue"
    }

    return { rtHours, ttrHours, slaStatus }
  }

  const isRestrictedCloseRole = useMemo(() => {
    const roleName = String(typeof user?.role === "string" ? user.role : user?.role?.name || "").toLowerCase()
    return ["support", "admin", "field staff", "field_staff", "staff"].some(r => roleName.includes(r))
  }, [user])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LifeBuoy className="h-7 w-7 text-primary" />
              Support Tickets Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Configure priorities, analyze support queues, and manage active workloads.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-muted p-1 rounded-lg flex items-center gap-1 shadow-inner">
              <Button 
                variant={viewMode === "dashboard" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("dashboard")}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                <BarChart2 className="h-4 w-4" /> Dashboard
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("list")}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                <List className="h-4 w-4" /> Tickets List
              </Button>
            </div>

            {hasPermission("tickets_create") && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-sm hover:shadow-md h-9">
                    <Plus className="h-4 w-4" /> New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                      <LifeBuoy className="h-5 w-5" /> Create Support Ticket
                    </DialogTitle>
                    <DialogDescription>Create a new customer or lead support ticket with SLA rules.</DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* General Subject Info */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5"/> Ticket Title / Subject *
                        </Label>
                        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Internet Speed Issue" className="rounded-lg shadow-sm" />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description Details</Label>
                        <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Details..." rows={4} className="rounded-lg shadow-sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
                          <Select value={newPriority} onValueChange={setNewPriority}>
                            <SelectTrigger className="rounded-lg shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complaint Type</Label>
                          <SearchableSelect
                            options={Object.keys(TICKET_COMPLAINT_CATALOG).map(value => ({ value, label: value }))}
                            value={complaintType}
                            onValueChange={handleComplaintTypeChange}
                            placeholder="Search complaint type..."
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complaint Sub-type</Label>
                        <SearchableSelect
                          options={(TICKET_COMPLAINT_CATALOG[complaintType] || []).map(value => ({ value, label: value }))}
                          value={complaintSubtype}
                          onValueChange={handleComplaintSubtypeChange}
                          placeholder={complaintType ? "Search complaint sub-type..." : "Select complaint type first"}
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</Label>
                          <Select value={departmentId} onValueChange={setDepartmentId}>
                            <SelectTrigger className="rounded-lg shadow-sm"><SelectValue placeholder="Select department" /></SelectTrigger>
                            <SelectContent>
                              {departments.map(dep => <SelectItem key={dep.id} value={String(dep.id)}>{dep.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Building className="w-3.5 h-3.5"/> Target Branch
                          </Label>
                          <Select value={newBranchId} onValueChange={setNewBranchId} disabled={Boolean(linkedSubjectBranchId)}>
                            <SelectTrigger className="rounded-lg shadow-sm"><SelectValue placeholder="General / No branch" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">General / No branch</SelectItem>
                              {branches.map(b => (
                                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {linkedSubjectBranchId && <p className="text-[11px] text-muted-foreground">Branch is assigned automatically from the selected customer or lead.</p>}
                        </div>
                      </div>
                    </div>

                    {/* Linking & Assigning section */}
                    <div className="space-y-4 border-l pl-5 border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignee Staff</Label>
                        <SearchableSelect
                          options={[
                            { value: "none", label: "Unassigned" },
                            ...assignableUsers.map(user => ({ 
                              value: user.id.toString(), 
                              label: user.name || user.email 
                            }))
                          ]}
                          value={assignedToId}
                          onValueChange={handleAssigneeChange}
                          placeholder="Search staff member..."
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Subject Type</Label>
                        <Select value={subjectType} onValueChange={(v: any) => { setSubjectType(v); setSubjectId("none"); }}>
                          <SelectTrigger className="rounded-lg shadow-sm"><SelectValue placeholder="Select Type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">General (No Subject)</SelectItem>
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                            <SelectItem value="LEAD">Lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {subjectType !== "NONE" && (
                        <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {subjectType === "CUSTOMER" ? "Linked Customer Record" : "Linked Lead Record"}
                          </Label>
                          <SearchableSelect
                            options={subjectType === "CUSTOMER" 
                              ? customers.map(c => ({ value: c.id.toString(), label: `${c.firstName} ${c.lastName} (${c.customerUniqueId})` }))
                              : leads.map(l => ({ value: l.id.toString(), label: `${l.firstName} ${l.lastName} (Lead #${l.id})` }))
                            }
                            value={subjectId}
                            onValueChange={setSubjectId as (val: string | string[]) => void}
                            placeholder={loadingSubjects ? "Loading..." : "Search..."}
                            className="w-full"
                          />
                        </div>
                      )}

                      {subjectType === "NONE" && (
                        <div className="space-y-3 animate-in slide-in-from-top-1 duration-200 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Contact Name *</Label>
                            <Input value={contactName} onChange={e => setContactName(e.target.value)} className="bg-white" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Phone</Label>
                              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="bg-white" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Email</Label>
                              <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="bg-white" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="notify" checked={notifyEmail} onCheckedChange={(c) => setNotifyEmail(c as boolean)} />
                      <Label htmlFor="notify" className="flex items-center gap-1 cursor-pointer font-normal text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> Send Notification to Customer / Assignee
                      </Label>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                      <Button onClick={handleCreate} disabled={submitting} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow">
                        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Create Ticket
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Edit Ticket Modal */}
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent className="sm:max-w-2xl md:max-w-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <Edit className="h-5 w-5" /> Edit Support Ticket Details
              </DialogTitle>
              <DialogDescription>Modify active support ticket information.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ticket Subject *</Label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Details / Description</Label>
                  <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ticket Type</Label>
                    <Select value={ticketTypeId} onValueChange={(value) => { setTicketTypeId(value); const type = ticketTypes.find(t => String(t.id) === value); setNewCategory(String(type?.code || '').toLowerCase()); if (type?.departmentId) setDepartmentId(String(type.departmentId)) }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-l pl-5 border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignee Staff</Label>
                  <SearchableSelect
                    options={[
                      { value: "none", label: "Unassigned" },
                      ...assignableUsers.map(user => ({ 
                        value: user.id.toString(), 
                        label: user.name || user.email 
                      }))
                    ]}
                    value={assignedToId}
                    onValueChange={handleAssigneeChange}
                    placeholder="Search staff member..."
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(dep => <SelectItem key={dep.id} value={String(dep.id)}>{dep.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Branch</Label>
                  <Select value={newBranchId} onValueChange={setNewBranchId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / No branch</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEdit(false); setEditingTicket(null); }}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {viewMode === "dashboard" ? (
          <div className="space-y-6">
            {/* Dashboard Filters */}
            <div className="flex gap-4 items-center bg-white dark:bg-slate-900 border p-4 rounded-xl shadow-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Range:</span>
                <select
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-1.5 text-xs font-semibold"
                  value={dashboardDateRange}
                  onChange={(e) => setDashboardDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Ticket Type:</span>
                <select
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-1.5 text-xs font-semibold"
                  value={dashboardType}
                  onChange={(e) => setDashboardType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {ticketTypes.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="ml-auto">
                <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={() => { fetchAllTickets(); fetchTickets(); }}>
                  <RefreshCw className="h-3.5 w-3.5" /> Reload Stats
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Tickets", val: widgetStats.total, color: "text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900" },
                { label: "Open", val: widgetStats.total - widgetStats.progress - widgetStats.resolved - widgetStats.closed, color: "text-blue-600 bg-blue-50/50 dark:bg-blue-900/10" },
                { label: "In Progress", val: widgetStats.progress, color: "text-amber-600 bg-amber-50/50 dark:bg-amber-900/10" },
                { label: "Resolved", val: widgetStats.resolved, color: "text-green-600 bg-green-50/50 dark:bg-green-900/10" },
                { label: "Closed", val: widgetStats.closed, color: "text-slate-500 bg-slate-100/50 dark:bg-slate-800/30" }
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-xl border p-4 shadow-sm ${kpi.color}`}>
                  <p className="text-xs uppercase tracking-wider font-bold opacity-80">{kpi.label}</p>
                  <p className="text-3xl font-extrabold mt-1">{kpi.val}</p>
                </div>
              ))}
            </div>

            {/* Recharts Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart */}
              <CardContainer title="Last 7 Days Ticket Trends" description="Frequency of daily support ticket submissions">
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContainer>

              {/* Status Donut Chart */}
              <CardContainer title="Ticket Status Distribution" description="Proportional breakdown by workflow status">
                <div className="h-[280px] w-full flex items-center justify-center">
                  {statusPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No status distribution data</span>
                  )}
                </div>
              </CardContainer>

              {/* Priority Bar Chart */}
              <CardContainer title="Priority Distribution" description="Workload counts sorted by ticket urgency">
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityBarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContainer>

              {/* Ticket Type Distribution */}
              <CardContainer title="Ticket Types Distribution" description="Trouble queues logged in categories">
                <div className="h-[280px] w-full pt-4">
                  {typeBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeBarData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">No ticket type data</div>
                  )}
                </div>
              </CardContainer>
            </div>

            {/* Detailed Table */}
            <CardContainer title="Detailed Workload Table" description="Consolidated audit of support tickets.">
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm bg-card mt-2">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Ticket No</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Date & Branch</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Customer & Phone</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Assignee / Department</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Type & Subject</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Urgency</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">SLA Metrics</th>
                      <th className="h-10 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDashboardTickets.length > 0 ? (
                      filteredDashboardTickets.map((t) => {
                        const { rtHours, ttrHours, slaStatus } = getDurationsAndSLA(t)
                        const custName = t.subject 
                          ? `${t.subject.firstName || ""} ${t.subject.lastName || ""}`.trim() 
                          : "General / Walk-in"
                        const custPhone = t.subject?.phoneNumber || "N/A"
                        const typeName = ticketTypes.find(type => type.id === t.ticketTypeId)?.name || "Unclassified"
                        return (
                          <tr key={t.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                              <Link href={`/tickets/${t.id}`} className="text-primary hover:underline">{t.ticketNumber}</Link>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">{new Date(t.createdAt).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">{t.branch?.name || "Global / Main"}</div>
                            </td>
                            <td className="p-4">
                              {t.subject && t.subject.type !== "GUEST" ? (
                                <Link href={subjectHref(t.subject)} className="font-bold text-primary hover:underline hover:text-blue-500 inline-flex items-center gap-1">
                                  {custName} <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <div className="font-bold text-slate-700 dark:text-slate-300">{custName}</div>
                              )}
                              <div className="text-xs text-muted-foreground font-mono">{custPhone}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium">{t.assignedTo?.name || "Unassigned"}</div>
                              <div className="text-xs text-muted-foreground">{departments.find(d => d.id === t.departmentId)?.name || "General"}</div>
                            </td>
                            <td className="p-4 max-w-[200px]">
                              <div className="text-xs uppercase font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-1 py-0.5 rounded w-max">{typeName}</div>
                              <div className="font-medium text-slate-800 dark:text-slate-200 truncate mt-1">{t.title}</div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 font-semibold text-xs">
                                {getPriorityIcon(t.priority)} {t.priority}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={`${getStatusColor(t.status)} font-semibold text-xs`}>{t.status.replace("_", " ")}</Badge>
                            </td>
                            <td className="p-4 space-y-1 text-xs font-mono">
                              <div>RT: <span className="font-semibold text-slate-700 dark:text-slate-300">{rtHours}</span></div>
                              <div>TTR: <span className="font-semibold text-slate-700 dark:text-slate-300">{ttrHours}</span></div>
                              <div>
                                <Badge variant={slaStatus.includes("Overdue") ? "destructive" : "outline"} className="text-[10px] py-0 px-1 font-bold">
                                  {slaStatus}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-4 text-right relative">
                              <div className="inline-block text-left">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => setOpenDropdownId(openDropdownId === t.id ? null : t.id)}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                                
                                {openDropdownId === t.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                                    <div className="absolute right-0 mt-1 w-48 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 py-1 text-left">
                                      <Link 
                                        href={`/tickets/${t.id}`}
                                        onClick={() => setOpenDropdownId(null)}
                                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 font-medium text-blue-600"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" /> View Details
                                      </Link>
                                      <button 
                                        onClick={() => { handleEditOpen(t); setOpenDropdownId(null); }} 
                                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 font-medium"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-muted-foreground" /> Edit Ticket
                                      </button>
                                      {t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                                        <button 
                                          onClick={() => { handleStatusChange(t.id, "RESOLVED"); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-green-600 font-semibold flex items-center gap-1.5"
                                        >
                                          <Check className="h-3.5 w-3.5" /> Resolve Ticket
                                        </button>
                                      )}
                                      {!isRestrictedCloseRole && t.status !== "CLOSED" && (
                                        <button 
                                          onClick={() => { handleStatusChange(t.id, "CLOSED"); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 font-semibold flex items-center gap-1.5"
                                        >
                                          <XCircle className="h-3.5 w-3.5" /> Close Ticket
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => { handleDelete(t.id); setOpenDropdownId(null); }} 
                                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600 font-semibold flex items-center gap-1.5 border-t"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete Ticket
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground italic">No tickets logged in the system.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContainer>
          </div>
        ) : (
          /* List View & Sidebar (Original Layout) */
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchTickets}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ticket List */}
              <div className="lg:col-span-2 space-y-3">
                {loading ? (
                  <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : tickets.length === 0 ? (
                  <CardContainer title="" className="text-center py-12">
                    <LifeBuoy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No tickets found</p>
                  </CardContainer>
                ) : (
                  <>
                    {tickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => selectTicket(ticket)}
                        className={`p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${
                          selectedTicket?.id === ticket.id ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(ticket.priority)}
                            <Link href={`/tickets/${ticket.id}`} onClick={event => event.stopPropagation()} className="font-mono text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                              {ticket.ticketNumber} <ExternalLink className="h-3 w-3" />
                            </Link>
                            <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                            {ticket.ticketTypeId && <Badge variant="outline">{ticketTypes.find(type => type.id === ticket.ticketTypeId)?.name || "Other"}</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-medium mb-1 hover:text-primary transition-colors">
                          <Link href={`/tickets/${ticket.id}`} onClick={event => event.stopPropagation()} className="hover:underline">
                            {ticket.title}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {ticket.subject && (
                            <Link href={subjectHref(ticket.subject)} onClick={event => event.stopPropagation()} className="flex items-center gap-1 font-medium text-primary hover:underline">
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{ticket.subject.type}</Badge>
                              {ticket.subject.firstName} {ticket.subject.lastName}
                            </Link>
                          )}
                          {ticket.assignedTo && <span>→ {ticket.assignedTo.name}</span>}
                          {ticket._count && <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{ticket._count.comments}</span>}
                        </div>
                      </div>
                    ))}
                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Detail Panel */}
              <div className="space-y-4">
                {selectedTicket ? (
                  <CardContainer title={`Ticket ${selectedTicket.ticketNumber}`} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-lg">{selectedTicket.title}</h3>
                          {selectedTicket.description && <p className="text-sm text-muted-foreground mt-2">{selectedTicket.description}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditOpen(selectedTicket)}>
                            <Edit className="h-4 w-4 text-slate-700" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-650 h-8 w-8 hover:bg-red-50" onClick={() => handleDelete(selectedTicket.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {hasPermission("tasks_create") && <Button asChild variant="outline" className="w-full"><Link href={`/tasks?ticketId=${selectedTicket.id}&create=true`}>Schedule as Task</Link></Button>}
                      <Button asChild variant="default" className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow">
                        <Link href={`/tickets/${selectedTicket.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" /> View Full Details
                        </Link>
                      </Button>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Status:</div>
                        <div>
                          <Select value={selectedTicket.status} onValueChange={v => handleStatusChange(selectedTicket.id, v)}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OPEN">Open</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="RESOLVED">Resolved</SelectItem>
                              {!isRestrictedCloseRole && <SelectItem value="CLOSED">Closed</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="text-muted-foreground">Priority:</div>
                        <div className="flex items-center gap-1">{getPriorityIcon(selectedTicket.priority)} {selectedTicket.priority}</div>
                        
                        {selectedTicket.subject && (
                          <>
                            <div className="text-muted-foreground">{selectedTicket.subject.type === 'CUSTOMER' ? 'Customer:' : 'Lead:'}</div>
                            <Link href={subjectHref(selectedTicket.subject)} className="block rounded p-1 -m-1 text-primary hover:bg-primary/5 hover:underline font-bold inline-flex items-center gap-1.5">
                              {selectedTicket.subject.firstName} {selectedTicket.subject.lastName}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </>
                        )}
                        <div className="text-muted-foreground">Assigned To:</div>
                        <Select value={selectedTicket.assignedTo ? String(selectedTicket.assignedTo.id) : "none"} onValueChange={value => handleReassign(selectedTicket.id, value)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{assignableUsers.map(user => <SelectItem key={user.id} value={String(user.id)}>{user.name || user.email}</SelectItem>)}</SelectContent></Select>
                        <div className="text-muted-foreground">Created:</div>
                        <div>{new Date(selectedTicket.createdAt).toLocaleString()}</div>
                        <div className="text-muted-foreground">SLA:</div>
                        <div className="text-xs">Response {selectedTicket.responseDueAt ? new Date(selectedTicket.responseDueAt).toLocaleString() : "—"}<br/>Resolve {selectedTicket.resolutionDueAt ? new Date(selectedTicket.resolutionDueAt).toLocaleString() : "—"}<br/>Close {selectedTicket.closeDueAt ? new Date(selectedTicket.closeDueAt).toLocaleString() : "—"}</div>
                      </div>

                      {selectedTicket.subject?.address && (
                        <Button variant="outline" className="w-full gap-2" onClick={() => openDirectionsFromCurrentLocation(selectedTicket.subject!.address || "")}>
                          <Navigation className="h-4 w-4" /> Get Directions
                        </Button>
                      )}

                      {/* Comments */}
                      <div className="border-t pt-3 space-y-3">
                        <h4 className="text-sm font-medium">Comments</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {selectedTicket.comments?.map(c => (
                            <div key={c.id} className="bg-white dark:bg-slate-800 p-2 rounded-lg border text-sm">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{c.user?.name}</span>
                                <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-muted-foreground">{c.content}</p>
                            </div>
                          ))}
                          {(!selectedTicket.comments || selectedTicket.comments.length === 0) && (
                            <p className="text-xs text-muted-foreground text-center py-3">No comments yet</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddComment()}
                            className="flex-1"
                          />
                          <Button size="icon" onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContainer>
                ) : (
                  <CardContainer title="" className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-md">
                    <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Select a ticket to view details</p>
                  </CardContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading tickets...</div>}>
      <TicketsContent />
    </Suspense>
  )
}
