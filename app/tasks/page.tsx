"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { CardContainer } from "@/components/ui/card-container"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CalendarDateInput } from "@/components/ui/calendar-date-input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
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
  ClipboardList, 
  Plus, 
  Search, 
  Clock, 
  User, 
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  MapPin,
  Phone,
  Timer,
  LayoutGrid,
  List as ListIcon,
  MapPinOff,
  UserCheck,
  Hourglass,
  Activity,
  AlertCircle,
  Navigation,
  Send,
  MoreVertical,
  BarChart2,
  Edit,
  ExternalLink,
  MessageSquare
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
import { useBranch } from "@/contexts/BranchContext"
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { openDirectionsFromCurrentLocation } from "@/lib/directions"

interface TaskActivityLog {
  id: number
  action: string
  lat?: number
  lon?: number
  timestamp: string
  notes?: string
  user?: { name: string }
}

interface Task {
  id: number
  title: string
  description?: string
  startTime?: string
  endTime?: string
  duration?: number
  status: string
  priority: string
  assignedTo?: { id: number; name: string; email: string }
  customer?: { id: number; customerUniqueId: string; lead?: { firstName: string; lastName: string; phoneNumber?: string; address?: string; street?: string } }
  ticket?: { 
    id: number; 
    ticketNumber: string; 
    title: string; 
    lead?: { id: number; firstName?: string; lastName?: string; phoneNumber?: string; address?: string; street?: string }; 
    customer?: { id: number; customerUniqueId: string; lead?: { firstName: string; lastName: string; phoneNumber?: string; address?: string; street?: string } } 
  }
  branch?: { id: number; name: string }
  createdAt: string
  startedAt?: string
  completedAt?: string
  workingDuration?: number
  totalDuration?: number
  activityLogs?: TaskActivityLog[]
  warning?: string | null
}

export default function TasksPage() {
  const { branches, selectedBranchId } = useBranch()
  const { user, hasPermission } = useAuth()
  const canCreateTask = hasPermission("tasks_create")
  
  const isGlobalAdmin = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === 'string' ? user.role : (user.role?.name || '')
    const roleName = roleStr.toLowerCase()
    return roleName.includes('admin') || roleName === 'administrator' || roleName === 'superadmin' || roleName === 'super_admin'
  }, [user])

  const isFieldStaff = useMemo(() => {
    const roleStr = typeof user?.role === "string" ? user.role : (user?.role?.name || "")
    return roleStr.toLowerCase().includes("field staff") || roleStr.toLowerCase().includes("field_staff")
  }, [user])

  // View state: dashboard, list, timeline
  const [viewMode, setViewMode] = useState<"dashboard" | "list" | "timeline">("dashboard")

  // Dashboard Filters
  const [dashboardDateRange, setDashboardDateRange] = useState("7days") // today, 7days, 30days, all
  const [dashboardPriority, setDashboardPriority] = useState("all")

  // Tasks dataset
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Timeline Filters
  const [timelineMode, setTimelineMode] = useState<"daily" | "weekly">("daily")
  const [timelineDate, setTimelineDate] = useState<Date>(new Date())
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (isFieldStaff) {
      setViewMode("timeline")
      setActiveTab("timeline")
    }
  }, [isFieldStaff])

  // Comments State
  const [newTaskComment, setNewTaskComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)

  // Creation Form State
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newStaffId, setNewStaffId] = useState("none")
  const [newStartTime, setNewStartTime] = useState("")
  const [newDuration, setNewDuration] = useState("60") // minutes
  const [newPriority, setNewPriority] = useState("MEDIUM")
  const [timeSlot, setTimeSlot] = useState("10:00")
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [newCustomerId, setNewCustomerId] = useState("")
  const [ticketQuery, setTicketQuery] = useState("")
  const [ticketResults, setTicketResults] = useState<any[]>([])
  const [newTicketId, setNewTicketId] = useState("")
  const [showEdit, setShowEdit] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newStatus, setNewStatus] = useState("PENDING")
  
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)

  const complete24Hours = [
    { label: "12:00 AM", hour: 0 },
    { label: "01:00 AM", hour: 1 },
    { label: "02:00 AM", hour: 2 },
    { label: "03:00 AM", hour: 3 },
    { label: "04:00 AM", hour: 4 },
    { label: "05:00 AM", hour: 5 },
    { label: "06:00 AM", hour: 6 },
    { label: "07:00 AM", hour: 7 },
    { label: "08:00 AM", hour: 8 },
    { label: "09:00 AM", hour: 9 },
    { label: "10:00 AM", hour: 10 },
    { label: "11:00 AM", hour: 11 },
    { label: "12:00 PM", hour: 12 },
    { label: "01:00 PM", hour: 13 },
    { label: "02:00 PM", hour: 14 },
    { label: "03:00 PM", hour: 15 },
    { label: "04:00 PM", hour: 16 },
    { label: "05:00 PM", hour: 17 },
    { label: "06:00 PM", hour: 18 },
    { label: "07:00 PM", hour: 19 },
    { label: "08:00 PM", hour: 20 },
    { label: "09:00 PM", hour: 21 },
    { label: "10:00 PM", hour: 22 },
    { label: "11:00 PM", hour: 23 },
  ]

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiRequest<Task[]>("/tasks")
      setTasks(res || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const url = branches.length > 0 && selectedBranchId ? `/users?branchId=${selectedBranchId}` : "/users"
      const res = await apiRequest<any>(url)
      const list = Array.isArray(res) ? res : res?.data || []
      setUsers(list.filter((item: any) => {
        const roleName = typeof item.role === "string" ? item.role : item.role?.name
        return String(roleName || "").toLowerCase() !== "customer"
      }))
    } catch (e) {
      console.error(e)
    }
  }, [branches.length, selectedBranchId])

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [fetchTasks, fetchUsers])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ticketId = params.get("ticketId")
    if (!ticketId || params.get("create") !== "true" || !canCreateTask) return
    apiRequest<any>(`/tickets/${ticketId}`).then(ticket => {
      setNewTicketId(String(ticket.id)); setTicketQuery(`${ticket.ticketNumber} · ${ticket.title}`); setNewTitle(ticket.title || "")
      if (ticket.customerId) setNewCustomerId(String(ticket.customerId))
      setViewMode("list")
      setShowCreate(true)
    }).catch(() => toast.error("Unable to load the selected ticket"))
  }, [canCreateTask])

  // Customer + Lead query check (only triggers if query is typed)
  useEffect(() => {
    if ((!showCreate && !showEdit) || customerQuery.trim().length < 2) { setCustomerResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const [custRes, leadRes] = await Promise.all([
          apiRequest<any>(`/customer?search=${encodeURIComponent(customerQuery.trim())}&limit=10`),
          apiRequest<any>(`/lead?search=${encodeURIComponent(customerQuery.trim())}&limit=10`)
        ])
        const customers = (Array.isArray(custRes) ? custRes : (custRes?.data || [])).map((c: any) => ({ ...c, _type: 'CUSTOMER' }))
        const leads = (Array.isArray(leadRes) ? leadRes : (leadRes?.data || [])).map((l: any) => ({ ...l, _type: 'LEAD' }))
        setCustomerResults([...customers, ...leads])
      } catch { setCustomerResults([]) }
    }, 350)
    return () => clearTimeout(timer)
  }, [customerQuery, showCreate, showEdit])

  useEffect(() => {
    if ((!showCreate && !showEdit) || ticketQuery.trim().length < 2) { setTicketResults([]); return }
    const timer = setTimeout(() => apiRequest<any>(`/tickets?search=${encodeURIComponent(ticketQuery.trim())}&limit=10`).then(res => setTicketResults(res?.data || [])).catch(() => setTicketResults([])), 350)
    return () => clearTimeout(timer)
  }, [ticketQuery, showCreate, showEdit])

  // Get full task details including activityLogs
  const fetchTaskDetails = async (taskId: number) => {
    try {
      const details = await apiRequest<Task>(`/tasks/${taskId}`)
      setSelectedTask(details)
    } catch (err) {
      toast.error("Failed to load task details")
    }
  }

  // GPS geolocation fetcher
  const getCoordinates = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS Geolocation is not supported by your browser."))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          })
        },
        (err) => {
          let msg = "GPS Location Access Denied."
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Access Denied: GPS coordinate verification is mandatory for field tasks. Please enable browser location permissions."
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = "GPS Position unavailable."
          } else if (err.code === err.TIMEOUT) {
            msg = "GPS Timeout."
          }
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      )
    })
  }

  const handleCreate = async () => {
    if (!canCreateTask) {
      toast.error("You do not have permission to schedule tasks.")
      return
    }

    if (!newTitle.trim()) {
      toast.error("Task title is required")
      return
    }
    
    setSubmitting(true)
    
    let finalStartTime = undefined
    if (newStartTime) {
        const date = new Date(newStartTime)
        const [hours, minutes] = timeSlot.split(':')
        date.setHours(Number(hours), Number(minutes), 0, 0)
        finalStartTime = date.toISOString()
    }

    try {
      const res = await apiRequest<Task & { warning?: string }>("/tasks", {
        method: "POST",
        suppressToast: true,
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          assignedToId: newStaffId !== "none" ? Number(newStaffId) : undefined,
          startTime: finalStartTime,
          duration: Number(newDuration),
          priority: newPriority,
          customerId: newCustomerId ? Number(newCustomerId) : undefined,
          ticketId: newTicketId ? Number(newTicketId) : undefined,
          status: "PENDING"
        })
      })

      if (res.warning) {
        toast.error(res.warning, { duration: 6000 })
      } else {
        toast.success("Task scheduled successfully!")
      }

      setShowCreate(false)
      setNewTitle(""); setNewDesc(""); setNewStaffId("none"); setNewStartTime(""); setNewDuration("60"); setNewPriority("MEDIUM")
      setCustomerQuery(""); setCustomerResults([]); setNewCustomerId(""); setTicketQuery(""); setTicketResults([]); setNewTicketId("")
      fetchTasks()
    } catch (error: any) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.type === 'OVERLAP') {
          const startLocal = new Date(parsed.startTime).toLocaleString();
          const endLocal = new Date(parsed.endTime).toLocaleString();
          toast.error(`Technician ${parsed.technicianName} is already scheduled for "${parsed.title}" from ${startLocal} to ${endLocal}.`, { duration: 6000 });
        } else if (parsed.type === 'DUPLICATE') {
          const startLocal = new Date(parsed.startTime).toLocaleString();
          toast.error(`A task with the title "${parsed.title}" at ${startLocal} already exists.`, { duration: 6000 });
        } else {
          toast.error(parsed.message || parsed.error || "Failed to assign task");
        }
      } catch (e) {
        toast.error(error.message || "Failed to assign task")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditOpen = (task: Task) => {
    setEditingTask(task)
    setNewTitle(task.title)
    setNewDesc(task.description || "")
    setNewStaffId(task.assignedTo?.id ? String(task.assignedTo.id) : "none")
    setNewPriority(task.priority)
    setNewStatus(task.status)
    if (task.startTime) {
      const date = new Date(task.startTime)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      setNewStartTime(`${yyyy}-${mm}-${dd}`)
      
      const hh = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      setTimeSlot(`${hh}:${min}`)
    } else {
      setNewStartTime("")
      setTimeSlot("10:00")
    }
    setNewDuration(String(task.duration || "60"))
    if (task.customer) {
      setNewCustomerId(String(task.customer.id))
      const firstName = task.customer.lead?.firstName || ''
      const lastName = task.customer.lead?.lastName || ''
      setCustomerQuery(`${firstName} ${lastName} (${task.customer.customerUniqueId})`.trim())
    } else {
      setNewCustomerId("")
      setCustomerQuery("")
    }
    if (task.ticket) {
      setNewTicketId(String(task.ticket.id))
      setTicketQuery(`${task.ticket.ticketNumber} · ${task.ticket.title}`)
    } else {
      setNewTicketId("")
      setTicketQuery("")
    }
    setShowEdit(true)
  }

  const handleEditSave = async () => {
    if (!editingTask || !newTitle.trim()) {
      toast.error("Task title is required")
      return
    }
    
    setSubmitting(true)
    
    let finalStartTime = null
    if (newStartTime) {
        const date = new Date(newStartTime)
        const [hours, minutes] = timeSlot.split(':')
        date.setHours(Number(hours), Number(minutes), 0, 0)
        finalStartTime = date.toISOString()
    }

    try {
      const res = await apiRequest<Task & { warning?: string }>(`/tasks/${editingTask.id}`, {
        method: "PUT",
        suppressToast: true,
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          assignedToId: newStaffId !== "none" ? Number(newStaffId) : null,
          startTime: finalStartTime,
          duration: Number(newDuration),
          priority: newPriority,
          customerId: newCustomerId ? Number(newCustomerId) : null,
          ticketId: newTicketId ? Number(newTicketId) : null,
          status: newStatus
        })
      })

      if (res?.warning) {
        toast.error(res.warning, { duration: 6000 })
      } else {
        toast.success("Task updated successfully!")
      }

      setShowEdit(false)
      setEditingTask(null)
      setNewTitle(""); setNewDesc(""); setNewStaffId("none"); setNewStartTime(""); setNewDuration("60"); setNewPriority("MEDIUM"); setNewStatus("PENDING")
      setCustomerQuery(""); setCustomerResults([]); setNewCustomerId(""); setTicketQuery(""); setTicketResults([]); setNewTicketId("")
      fetchTasks()
    } catch (error: any) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.type === 'OVERLAP') {
          const startLocal = new Date(parsed.startTime).toLocaleString();
          const endLocal = new Date(parsed.endTime).toLocaleString();
          toast.error(`Technician ${parsed.technicianName} is already scheduled for "${parsed.title}" from ${startLocal} to ${endLocal}.`, { duration: 6000 });
        } else if (parsed.type === 'DUPLICATE') {
          const startLocal = new Date(parsed.startTime).toLocaleString();
          toast.error(`A task with the title "${parsed.title}" at ${startLocal} already exists.`, { duration: 6000 });
        } else {
          toast.error(parsed.message || parsed.error || "Failed to update task");
        }
      } catch (e) {
        toast.error(error.message || "Failed to update task")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (taskId: number, status: string) => {
    let lat = null
    let lon = null

    if (status === "IN_PROGRESS" || status === "COMPLETED") {
      try {
        toast.loading("Verifying GPS coordinates...", { id: "gps-verify" })
        const coords = await getCoordinates()
        lat = coords.lat
        lon = coords.lon
        toast.success("GPS Verified!", { id: "gps-verify" })
      } catch (err: any) {
        toast.error(err.message, { id: "gps-verify", duration: 5000 })
        return
      }
    }

    try {
      const updated = await apiRequest<Task>(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status, lat, lon })
      })

      if (updated.warning) {
        toast.error(updated.warning, { duration: 6000 })
      } else {
        toast.success(`Task marked as ${status.replace("_", " ").toLowerCase()}!`)
      }

      fetchTasks()
      fetchTaskDetails(taskId)
    } catch (error: any) {
      toast.error(error.message || "Failed to update task status")
    }
  }

  const handleAddComment = async () => {
    if (!selectedTask || !newTaskComment.trim()) return
    setAddingComment(true)
    try {
      await apiRequest(`/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newTaskComment.trim() })
      })
      setNewTaskComment("")
      toast.success("Progress note added")
      fetchTaskDetails(selectedTask.id)
    } catch (e: any) {
      toast.error(e.message || "Failed to add progress note")
    } finally {
      setAddingComment(false)
    }
  }

  // Dashboard filtering calculations
  const filteredDashboardTasks = useMemo(() => {
    let list = [...tasks]

    // Date range filter
    const now = new Date()
    if (dashboardDateRange === "today") {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      list = list.filter(t => t.startTime && new Date(t.startTime) >= startOfToday)
    } else if (dashboardDateRange === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      list = list.filter(t => t.startTime && new Date(t.startTime) >= sevenDaysAgo)
    } else if (dashboardDateRange === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      list = list.filter(t => t.startTime && new Date(t.startTime) >= thirtyDaysAgo)
    }

    // Priority filter
    if (dashboardPriority !== "all") {
      list = list.filter(t => t.priority === dashboardPriority)
    }

    // Field staff role scoping
    if (isFieldStaff) {
      list = list.filter(t => t.assignedTo?.id === user?.id)
    }

    return list
  }, [tasks, dashboardDateRange, dashboardPriority, isFieldStaff, user])

  // Aggregate Chart Values
  const widgetStats = useMemo(() => {
    const total = filteredDashboardTasks.length
    const pending = filteredDashboardTasks.filter(t => t.status === "PENDING" || t.status === "ACCEPTED").length
    const progress = filteredDashboardTasks.filter(t => t.status === "IN_PROGRESS" || t.status === "ON_HOLD").length
    const completed = filteredDashboardTasks.filter(t => t.status === "COMPLETED").length
    const cancelled = filteredDashboardTasks.filter(t => t.status === "CANCELLED").length
    const overdue = filteredDashboardTasks.filter(t => {
      if (t.status === "COMPLETED" || t.status === "CANCELLED") return false
      return (t.status === "OVERDUE") || (t.endTime && new Date(t.endTime) < new Date())
    }).length
    return { total, pending, progress, completed, cancelled, overdue }
  }, [filteredDashboardTasks])

  const statusPieData = useMemo(() => {
    return [
      { name: "Pending", value: widgetStats.pending, color: "#94a3b8" },
      { name: "In Progress", value: widgetStats.progress, color: "#3b82f6" },
      { name: "Completed", value: widgetStats.completed, color: "#10b981" },
      { name: "Overdue", value: widgetStats.overdue, color: "#ef4444" }
    ].filter(d => d.value > 0)
  }, [widgetStats])

  const priorityBarData = useMemo(() => {
    const counts = filteredDashboardTasks.reduce((acc: any, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1
      return acc
    }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 })
    return [
      { name: "Low", value: counts.LOW, fill: "#10b981" },
      { name: "Medium", value: counts.MEDIUM, fill: "#f59e0b" },
      { name: "High", value: counts.HIGH, fill: "#f97316" },
      { name: "Critical", value: counts.CRITICAL, fill: "#ef4444" }
    ]
  }, [filteredDashboardTasks])

  const staffWorkloadData = useMemo(() => {
    const counts = filteredDashboardTasks.reduce((acc: any, t) => {
      const name = t.assignedTo?.name || "Unassigned"
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).map(name => ({
      name,
      value: counts[name],
      fill: "#6366f1"
    }))
  }, [filteredDashboardTasks])

  const lineTrendData = useMemo(() => {
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const dateKey = d.toDateString()
      const count = filteredDashboardTasks.filter(t => t.startTime && new Date(t.startTime).toDateString() === dateKey).length
      trend.push({ name: dateStr, tasks: count })
    }
    return trend
  }, [filteredDashboardTasks])

  // Scheduler Timeline Calculations
  const timelineData = useMemo(() => {
    if (viewMode !== "timeline" && activeTab !== "timeline") return []
    
    // If the user is Field Staff, they can ONLY view their own schedule line
    const staffList = isFieldStaff 
      ? [{ id: user?.id || 0, name: user?.name || "Me" }]
      : (users.length > 0 ? users : [{ id: 0, name: "Unassigned" }])
    
    return staffList.map(staff => {
      const staffTasks = tasks.filter(t => {
        if (staff.id === 0) return !t.assignedTo
        return t.assignedTo?.id === staff.id
      })

      let filtered: Task[] = []
      if (timelineMode === "daily") {
        const targetStr = timelineDate.toDateString()
        filtered = staffTasks.filter(t => t.startTime && new Date(t.startTime).toDateString() === targetStr)
      } else {
        const startOfWeek = new Date(timelineDate)
        startOfWeek.setDate(timelineDate.getDate() - timelineDate.getDay()) // Sunday
        startOfWeek.setHours(0,0,0,0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
        endOfWeek.setHours(23,59,59,999)

        filtered = staffTasks.filter(t => {
          if (!t.startTime) return false
          const d = new Date(t.startTime)
          return d >= startOfWeek && d <= endOfWeek
        })
      }

      return { staff, tasks: filtered }
    })
  }, [tasks, users, isFieldStaff, user, timelineMode, timelineDate, viewMode, activeTab])

  const filteredTasks = useMemo(() => {
    let list = isFieldStaff ? tasks.filter(t => t.assignedTo?.id === user?.id) : tasks
    if (activeTab === "today") {
        const today = new Date().toDateString()
        list = list.filter(t => t.startTime && new Date(t.startTime).toDateString() === today)
    } else if (activeTab === "pending") {
        list = list.filter(t => t.status === "PENDING" || t.status === "ACCEPTED")
    }

    if (search) {
        const s = search.toLowerCase()
        list = list.filter(t => t.title.toLowerCase().includes(s) || t.customer?.customerUniqueId?.toLowerCase().includes(s))
    }
    return list
  }, [tasks, activeTab, search, isFieldStaff, user])

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 px-2 py-0.5 text-[10px]">Pending</Badge>
      case "ACCEPTED": return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 px-2 py-0.5 text-[10px]">Accepted</Badge>
      case "IN_PROGRESS": return <Badge className="bg-blue-500 hover:bg-blue-600 px-2 py-0.5 text-[10px]">In Progress</Badge>
      case "ON_HOLD": return <Badge className="bg-amber-500 hover:bg-amber-600 px-2 py-0.5 text-[10px]">On Hold</Badge>
      case "COMPLETED": return <Badge className="bg-emerald-500 hover:bg-emerald-600 px-2 py-0.5 text-[10px]">Completed</Badge>
      case "CANCELLED": return <Badge variant="destructive" className="px-2 py-0.5 text-[10px]">Cancelled</Badge>
      case "OVERDUE": return <Badge variant="destructive" className="bg-rose-150 text-rose-700 px-2 py-0.5 text-[10px]">Overdue</Badge>
      default: return <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">{status}</Badge>
    }
  }

  const hoursColumns = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const navigateTimeline = (direction: number) => {
    const next = new Date(timelineDate)
    if (timelineMode === "daily") {
      next.setDate(timelineDate.getDate() + direction)
    } else {
      next.setDate(timelineDate.getDate() + direction * 7)
    }
    setTimelineDate(next)
  }

  const openSlotCreator = (staffId: number, hourSlot?: string, dayOffset?: number) => {
    if (!canCreateTask) return
    setNewStaffId(staffId === 0 ? "none" : String(staffId))
    
    const targetDate = new Date(timelineDate)
    if (timelineMode === "weekly" && dayOffset !== undefined) {
      targetDate.setDate(timelineDate.getDate() - timelineDate.getDay() + dayOffset)
    }
    setNewStartTime(targetDate.toISOString().split('T')[0])
    
    if (hourSlot) {
      setTimeSlot(hourSlot)
    }
    setShowCreate(true)
  }

  const taskDestination = (task: Task) =>
    task.customer?.lead?.address ||
    task.customer?.lead?.street ||
    task.ticket?.customer?.lead?.address ||
    task.ticket?.customer?.lead?.street ||
    task.ticket?.lead?.address ||
    task.ticket?.lead?.street ||
    ""

  const renderTimelineGrid = () => (
    <div className="h-[calc(100dvh-23rem)] min-h-[480px] overflow-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 mt-4">
      <table className="w-full border-collapse min-w-[800px] text-left">
        <thead>
          <tr className="bg-slate-100/50 dark:bg-slate-900 text-xs font-semibold text-muted-foreground border-b border-slate-200 dark:border-slate-800">
            <th className="p-3 w-48 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10">Technician</th>
            {timelineMode === "daily" ? (
              hoursColumns.map(hour => <th key={hour} className="p-3 text-center border-r border-slate-100 dark:border-slate-850 font-mono text-[10px]">{hour}</th>)
            ) : (
              weekdays.map((day, i) => {
                const dayDate = new Date(timelineDate)
                dayDate.setDate(timelineDate.getDate() - timelineDate.getDay() + i)
                return (
                  <th key={day} className="p-3 text-center border-r border-slate-100 dark:border-slate-850">
                    <div>{day}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{dayDate.getDate()}</div>
                  </th>
                )
              })
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {timelineData.map(({ staff, tasks }) => (
            <tr key={staff.id} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
              <td className="p-3 font-semibold border-r border-slate-200 dark:border-slate-850 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] font-bold bg-slate-200 text-slate-700">{staff.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span>{isFieldStaff ? "—" : staff.name}</span>
              </td>

              {timelineMode === "daily" ? (() => {
                let skipCount = 0;
                return hoursColumns.map((hour, colIndex) => {
                  if (skipCount > 0) {
                    skipCount--;
                    return null;
                  }

                  const colHourNum = parseInt(hour.split(":")[0]);
                  
                  const matched = tasks.find(t => {
                    if (!t.startTime) return false;
                    const d = new Date(t.startTime);
                    if (d.toDateString() !== timelineDate.toDateString()) return false;
                    return d.getHours() === colHourNum;
                  });

                  let colSpan = 1;
                  if (matched) {
                    let durationMin = matched.duration || 60;
                    if (matched.startTime && matched.endTime) {
                      const diffMs = new Date(matched.endTime).getTime() - new Date(matched.startTime).getTime();
                      durationMin = Math.round(diffMs / (1000 * 60));
                    }
                    const durationHours = Math.max(1, Math.ceil(durationMin / 60));
                    colSpan = Math.min(durationHours, hoursColumns.length - colIndex);
                    skipCount = colSpan - 1;
                  }

                  return (
                    <td 
                      key={hour} 
                      colSpan={colSpan} 
                      className={`p-2 text-center border-r border-slate-100 dark:border-slate-850 h-12 relative ${
                        colSpan > 1 ? "bg-slate-100/30 dark:bg-slate-900/10" : ""
                      }`}
                      style={{ width: colSpan * 80 }}
                    >
                      {matched ? (
                        <div 
                          onClick={() => { fetchTaskDetails(matched.id); setViewMode("list"); }}
                          className={`p-1.5 rounded-lg border text-left cursor-pointer hover:shadow transition-shadow select-none overflow-hidden h-9 text-[10px] leading-tight ${
                            matched.status === "COMPLETED" 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                          }`}
                        >
                          <div className="font-semibold truncate">{matched.title}</div>
                          <div className="text-[8px] text-muted-foreground truncate opacity-80 mt-0.5">
                            {(() => {
                              const start = new Date(matched.startTime!);
                              const end = matched.endTime ? new Date(matched.endTime) : new Date(start.getTime() + (matched.duration || 60) * 60 * 1000);
                              const fmt = (d: Date) => {
                                let h = d.getHours();
                                const m = d.getMinutes();
                                const ap = h >= 12 ? 'PM' : 'AM';
                                h = h % 12;
                                h = h ? h : 12;
                                return `${h}:${m < 10 ? '0' + m : m} ${ap}`;
                              };
                              return `${fmt(start)} - ${fmt(end)}`;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openSlotCreator(staff.id, hour)}
                          className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-blue-50/20 dark:bg-blue-950/10 flex items-center justify-center transition-opacity"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </td>
                  );
                });
              })() : (
                weekdays.map((day, i) => {
                  const targetDay = new Date(timelineDate)
                  targetDay.setDate(timelineDate.getDate() - timelineDate.getDay() + i)
                  
                  const matchedList = tasks.filter(t => t.startTime && new Date(t.startTime).toDateString() === targetDay.toDateString())

                  return (
                    <td key={day} className="p-2 border-r border-slate-100 dark:border-slate-850 min-w-[100px] h-16 relative">
                      <div className="space-y-1">
                        {matchedList.map(task => (
                          <div 
                            key={task.id}
                            onClick={() => { fetchTaskDetails(task.id); setViewMode("list"); }}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px] truncate font-medium cursor-pointer border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => openSlotCreator(staff.id, undefined, i)}
                        className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 bg-slate-150 rounded p-0.5 transition-opacity"
                      >
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  )
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const isRestrictedCloseRole = useMemo(() => {
    const roleName = String(user?.role?.name || "").toLowerCase()
    return ["field staff", "field_staff", "staff"].includes(roleName)
  }, [user])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-primary" />
              Field Tasks & Operations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage technician schedules, GPS validations, timelines, and maintenance tasks</p>
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
                <ListIcon className="h-4 w-4" /> Task List
              </Button>
              <Button 
                variant={viewMode === "timeline" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("timeline")}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                <Clock className="h-4 w-4" /> Scheduler
              </Button>
            </div>

            {canCreateTask && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow">
                    <Plus className="h-4 w-4" /> Schedule Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl md:max-w-3xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                      <ClipboardList className="h-5 w-5" /> Assign New Task
                    </DialogTitle>
                    <DialogDescription>Create and assign a field operation task.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title *</Label>
                        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Fiber repair at Main St" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                        <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Additional instructions..." rows={4} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                          <CalendarDateInput value={newStartTime} onChange={setNewStartTime} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Time</Label>
                          <Input type="time" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-l pl-5 border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Customer</Label>
                        <Input value={customerQuery} onChange={e => { setCustomerQuery(e.target.value); setNewCustomerId("") }} placeholder="Search customer ID or name..." />
                        {customerResults.length > 0 && <div className="max-h-36 overflow-y-auto rounded border bg-popover mt-1">{customerResults.map((item: any) => { const isLead = item._type === 'LEAD'; const displayName = isLead ? `${item.firstName || ''} ${item.lastName || ''}`.trim() : `${item.firstName || item.lead?.firstName || ''} ${item.lastName || item.lead?.lastName || ''}`.trim(); const displayId = isLead ? `Lead #${item.id}` : (item.customerUniqueId || `Customer ${item.id}`); return (<button type="button" key={`${item._type}-${item.id}`} onClick={() => { if (!isLead) { setNewCustomerId(String(item.id)); } setCustomerQuery(`${displayId} · ${displayName}`); setCustomerResults([]) }} className="block w-full border-b p-2 text-left text-xs hover:bg-muted"><span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold mr-1.5 ${isLead ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{isLead ? 'LEAD' : 'CUSTOMER'}</span>{displayId} · {displayName}</button>) })}</div>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Support Ticket</Label>
                        <Input value={ticketQuery} onChange={e => { setTicketQuery(e.target.value); setNewTicketId("") }} placeholder="Search ticket number..." />
                        {ticketResults.length > 0 && <div className="max-h-36 overflow-y-auto rounded border bg-popover mt-1">{ticketResults.map(ticket => <button type="button" key={ticket.id} onClick={() => { setNewTicketId(String(ticket.id)); setTicketQuery(`${ticket.ticketNumber} · ${ticket.title}`); setNewTitle(current => current || ticket.title); setNewCustomerId(ticket.customerId ? String(ticket.customerId) : newCustomerId); setTicketResults([]) }} className="block w-full border-b p-2 text-left text-xs hover:bg-muted">{ticket.ticketNumber} · {ticket.title}</button>)}</div>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Staff</Label>
                          <Select value={newStaffId} onValueChange={setNewStaffId}>
                            <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {users.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
                          <Select value={newPriority} onValueChange={setNewPriority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                        <Select value={newDuration} onValueChange={setNewDuration}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Assign Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {!isFieldStaff && (
              <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogContent className="sm:max-w-2xl md:max-w-3xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                      <ClipboardList className="h-5 w-5" /> Edit Task Details
                    </DialogTitle>
                    <DialogDescription>Modify field operation task details and assignments.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title *</Label>
                        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Fiber repair at Main St" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                        <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Additional instructions..." rows={4} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                          <CalendarDateInput value={newStartTime} onChange={setNewStartTime} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Time</Label>
                          <Input type="time" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-l pl-5 border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Customer</Label>
                        <Input value={customerQuery} onChange={e => { setCustomerQuery(e.target.value); setNewCustomerId("") }} placeholder="Search customer ID or name..." />
                        {customerResults.length > 0 && <div className="max-h-36 overflow-y-auto rounded border bg-popover mt-1">{customerResults.map((item: any) => { const isLead = item._type === 'LEAD'; const displayName = isLead ? `${item.firstName || ''} ${item.lastName || ''}`.trim() : `${item.firstName || item.lead?.firstName || ''} ${item.lastName || item.lead?.lastName || ''}`.trim(); const displayId = isLead ? `Lead #${item.id}` : (item.customerUniqueId || `Customer ${item.id}`); return (<button type="button" key={`${item._type}-${item.id}`} onClick={() => { if (!isLead) { setNewCustomerId(String(item.id)); } setCustomerQuery(`${displayId} · ${displayName}`); setCustomerResults([]) }} className="block w-full border-b p-2 text-left text-xs hover:bg-muted"><span className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold mr-1.5 ${isLead ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{isLead ? 'LEAD' : 'CUSTOMER'}</span>{displayId} · {displayName}</button>) })}</div>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Support Ticket</Label>
                        <Input value={ticketQuery} onChange={e => { setTicketQuery(e.target.value); setNewTicketId("") }} placeholder="Search ticket number..." />
                        {ticketResults.length > 0 && <div className="max-h-36 overflow-y-auto rounded border bg-popover mt-1">{ticketResults.map(ticket => <button type="button" key={ticket.id} onClick={() => { setNewTicketId(String(ticket.id)); setTicketQuery(`${ticket.ticketNumber} · ${ticket.title}`); setNewTitle(current => current || ticket.title); setNewCustomerId(ticket.customerId ? String(ticket.customerId) : newCustomerId); setTicketResults([]) }} className="block w-full border-b p-2 text-left text-xs hover:bg-muted">{ticket.ticketNumber} · {ticket.title}</button>)}</div>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assign Staff</Label>
                          <Select value={newStaffId} onValueChange={setNewStaffId}>
                            <SelectTrigger><SelectValue placeholder="Select Staff" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {users.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
                          <Select value={newPriority} onValueChange={setNewPriority}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                          <Select value={newDuration} onValueChange={setNewDuration}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="240">4 hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="ACCEPTED">Accepted</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="ON_HOLD">On Hold</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowEdit(false); setEditingTask(null); }}>Cancel</Button>
                    <Button onClick={handleEditSave} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) }
          </div>
        </div>

        {viewMode === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
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
                <span className="text-sm font-semibold text-muted-foreground">Priority:</span>
                <select
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-background text-foreground p-1.5 text-xs font-semibold"
                  value={dashboardPriority}
                  onChange={(e) => setDashboardPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="ml-auto">
                <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={fetchTasks}>
                  <RefreshCw className="h-3.5 w-3.5" /> Reload Stats
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Tasks", val: widgetStats.total, color: "text-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-slate-200" },
                { label: "Pending", val: widgetStats.pending, color: "text-blue-600 bg-blue-50/50 dark:bg-blue-900/10" },
                { label: "In Progress", val: widgetStats.progress, color: "text-amber-600 bg-amber-50/50 dark:bg-amber-900/10" },
                { label: "Completed", val: widgetStats.completed, color: "text-green-600 bg-green-50/50 dark:bg-green-900/10" },
                { label: "Overdue", val: widgetStats.overdue, color: "text-rose-600 bg-rose-50/50 dark:bg-rose-900/10" }
              ].map((kpi) => (
                <div key={kpi.label} className={`rounded-xl border p-4 shadow-sm ${kpi.color}`}>
                  <p className="text-xs uppercase tracking-wider font-bold opacity-80">{kpi.label}</p>
                  <p className="text-3xl font-extrabold mt-1">{kpi.val}</p>
                </div>
              ))}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trends */}
              <CardContainer title="Last 7 Days Task Trends" description="Scheduled field operations">
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContainer>

              {/* Status */}
              <CardContainer title="Task Status Distribution" description="Completion status distribution">
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

              {/* Priorities */}
              <CardContainer title="Priority Distribution" description="Tasks sorted by urgency level">
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

              {/* Staff workloads */}
              <CardContainer title="Technician Workloads" description="Total task logs assigned per technician">
                <div className="h-[280px] w-full pt-4">
                  {staffWorkloadData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={staffWorkloadData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">No workload data</div>
                  )}
                </div>
              </CardContainer>
            </div>

            {/* Detailed Workload Table */}
            <CardContainer title="Task Audit List" description="Detailed list of field technician tasks.">
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm bg-card mt-2">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Task Title</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Scheduled Date</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Technician</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Linked Customer</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Linked Ticket</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Priority</th>
                      <th className="h-10 px-4 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="h-10 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDashboardTasks.length > 0 ? (
                      filteredDashboardTasks.map((t) => {
                        const custName = t.customer?.lead 
                          ? `${t.customer.lead.firstName || ""} ${t.customer.lead.lastName || ""}`.trim() 
                          : "No customer linked"
                        return (
                          <tr key={t.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                              <Link href={`/tasks/${t.id}`} className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                                {t.title} <ExternalLink className="h-3 w-3 opacity-70" />
                              </Link>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold">{t.startTime ? new Date(t.startTime).toLocaleDateString() : "Flexible"}</div>
                              <div className="text-xs text-muted-foreground">{t.startTime ? new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</div>
                            </td>
                            <td className="p-4 font-medium">{isFieldStaff ? "—" : (t.assignedTo?.name || "Unassigned")}</td>
                            <td className="p-4">
                              {t.customer ? (
                                <Link href={`/customers/${t.customer.id}`} className="font-bold text-primary hover:underline hover:text-blue-500 inline-flex items-center gap-1">
                                  {custName} <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">None</span>
                              )}
                            </td>
                            <td className="p-4">
                              {t.ticket ? (
                                <Link href={`/tickets/${t.ticket.id}`} className="font-mono text-xs font-bold text-indigo-600 hover:underline">
                                  {t.ticket.ticketNumber}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">None</span>
                              )}
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="text-xs font-semibold">{t.priority}</Badge>
                            </td>
                            <td className="p-4">{getStatusBadge(t.status)}</td>
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
                                        href={`/tasks/${t.id}`}
                                        onClick={() => setOpenDropdownId(null)}
                                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 font-medium text-blue-600"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" /> View Task Details Page
                                      </Link>
                                      <button 
                                        onClick={() => { fetchTaskDetails(t.id); setViewMode("list"); setOpenDropdownId(null); }} 
                                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 font-medium"
                                      >
                                        <ListIcon className="h-3.5 w-3.5 text-muted-foreground" /> Side Details Panel
                                      </button>
                                      {!isFieldStaff && (
                                        <button 
                                          onClick={() => { handleEditOpen(t); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 font-medium"
                                        >
                                          <Edit className="h-3.5 w-3.5 text-primary" /> Edit Task
                                        </button>
                                      )}
                                      {["PENDING", "ACCEPTED"].includes(t.status) && (
                                        <button 
                                          onClick={() => { handleStatusUpdate(t.id, "IN_PROGRESS"); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 font-semibold flex items-center gap-1.5"
                                        >
                                          <Activity className="h-3.5 w-3.5" /> Start Job (GPS)
                                        </button>
                                      )}
                                      {t.status === "IN_PROGRESS" && (
                                        <button 
                                          onClick={() => { handleStatusUpdate(t.id, "COMPLETED"); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-green-600 font-semibold flex items-center gap-1.5"
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete (GPS)
                                        </button>
                                      )}
                                      {!isRestrictedCloseRole && !["COMPLETED", "CANCELLED"].includes(t.status) && (
                                        <button 
                                          onClick={() => { handleStatusUpdate(t.id, "COMPLETED"); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 font-semibold flex items-center gap-1.5"
                                        >
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Close Task
                                        </button>
                                      )}
                                      {t.status !== "CANCELLED" && t.status !== "COMPLETED" && (
                                        <button 
                                          onClick={() => { handleStatusUpdate(t.id, "CANCELLED"); setOpenDropdownId(null); }} 
                                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-red-600 font-semibold flex items-center gap-1.5 border-t"
                                        >
                                          <XCircle className="h-3.5 w-3.5" /> Cancel Job
                                        </button>
                                      )}
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
                        <td colSpan={8} className="p-8 text-center text-muted-foreground italic">No tasks logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContainer>
          </div>
        )}

        {viewMode === "timeline" && (
          <CardContainer title="Operations Scheduler" description="Timeline of jobs scheduled per technician">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateTimeline(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-bold text-sm min-w-[150px] text-center">
                  {timelineMode === "daily" 
                    ? timelineDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                    : `Week of ${new Date(timelineDate.getTime() - timelineDate.getDay()*24*60*60*1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                  }
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateTimeline(1)}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setTimelineDate(new Date())}>Today</Button>
              </div>

              <div className="flex gap-2">
                <Button variant={timelineMode === "daily" ? "default" : "outline"} size="sm" onClick={() => setTimelineMode("daily")}>Daily View</Button>
                <Button variant={timelineMode === "weekly" ? "default" : "outline"} size="sm" onClick={() => setTimelineMode("weekly")}>Weekly View</Button>
              </div>
            </div>
            {renderTimelineGrid()}
          </CardContainer>
        )}

        {viewMode === "list" && (
          <div className="space-y-6">
            {/* Tab Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shadow-inner overflow-x-auto">
                <Button 
                  variant={activeTab === "all" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveTab("all")}
                  className="gap-1.5 h-8 text-xs font-semibold whitespace-nowrap"
                >
                  <ClipboardList className="h-3.5 w-3.5" /> All Tasks
                </Button>
                <Button 
                  variant={activeTab === "today" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveTab("today")}
                  className="gap-1.5 h-8 text-xs font-semibold whitespace-nowrap"
                >
                  <CalendarIcon className="h-3.5 w-3.5" /> Today
                </Button>
                <Button 
                  variant={activeTab === "pending" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveTab("pending")}
                  className="gap-1.5 h-8 text-xs font-semibold whitespace-nowrap"
                >
                  <Hourglass className="h-3.5 w-3.5" /> Pending
                </Button>
                <Button 
                  variant={activeTab === "timeline" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setActiveTab("timeline")}
                  className="gap-1.5 h-8 text-xs font-semibold whitespace-nowrap"
                >
                  <Clock className="h-3.5 w-3.5" /> Scheduler
                </Button>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tasks..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-white shadow-sm" 
                  />
                </div>
                <Button variant="outline" size="icon" onClick={fetchTasks} className="bg-white shadow-sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {activeTab === "timeline" ? (
              <CardContainer title="Operations Scheduler" description="Timeline of jobs scheduled per technician">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateTimeline(-1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-bold text-sm min-w-[150px] text-center">
                      {timelineMode === "daily" 
                        ? timelineDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                        : `Week of ${new Date(timelineDate.getTime() - timelineDate.getDay()*24*60*60*1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                      }
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateTimeline(1)}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setTimelineDate(new Date())}>Today</Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant={timelineMode === "daily" ? "default" : "outline"} size="sm" onClick={() => setTimelineMode("daily")}>Daily View</Button>
                    <Button variant={timelineMode === "weekly" ? "default" : "outline"} size="sm" onClick={() => setTimelineMode("weekly")}>Weekly View</Button>
                  </div>
                </div>
                {renderTimelineGrid()}
              </CardContainer>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task List */}
              <div className="lg:col-span-2 space-y-3">
                {loading ? (
                  <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 border rounded-2xl">
                    <ClipboardList className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                    <p className="text-muted-foreground">No tasks scheduled</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => fetchTaskDetails(task.id)}
                      className={`p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${
                        selectedTask?.id === task.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Link href={`/tasks/${task.id}`} onClick={e => e.stopPropagation()} className="font-mono text-xs text-primary font-bold hover:underline flex items-center gap-1">
                            Task #{task.id} <ExternalLink className="h-3 w-3" />
                          </Link>
                          {getStatusBadge(task.status)}
                          <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{task.startTime ? new Date(task.startTime).toLocaleDateString() : ""}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 hover:text-primary transition-colors">
                        <Link href={`/tasks/${task.id}`} onClick={e => e.stopPropagation()} className="hover:underline flex items-center gap-1.5">
                          {task.title}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Technician: {isFieldStaff ? "—" : (task.assignedTo?.name || "Unassigned")}</span>
                        {task.customer?.customerUniqueId && <span>• Customer: {task.customer.customerUniqueId}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Detail Side Panel */}
              <div className="relative">
                {selectedTask ? (
                  <div className="overflow-hidden rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl space-y-6 pb-6">
                    <div className="bg-primary p-6 text-primary-foreground">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="text-white border-white/20 bg-white/10">{selectedTask.priority} PRIORITY</Badge>
                        <Badge className="bg-white/20 text-white font-bold">{selectedTask.status.replace("_", " ")}</Badge>
                      </div>
                      <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                      <p className="text-white/70 text-sm mt-2">{selectedTask.description || "Field operation task assigned to staff."}</p>
                    </div>

                    <div className="px-6 space-y-5">
                      <Button asChild variant="default" className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow">
                        <Link href={`/tasks/${selectedTask.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" /> View Full Details
                        </Link>
                      </Button>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/40 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Scheduled Date</p>
                          <p className="text-xs font-semibold flex items-center gap-2">
                            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                            {selectedTask.startTime ? new Date(selectedTask.startTime).toLocaleDateString() : "Flexible"}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/40 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Time Slot</p>
                          <p className="text-xs font-semibold flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {selectedTask.startTime ? new Date(selectedTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Anytime"}
                          </p>
                        </div>
                      </div>
                                      {/* Contact Info (Clickable Customer/Lead Profile Link) */}
                      {(() => {
                        const displayCustomer = selectedTask.customer || selectedTask.ticket?.customer;
                        const displayLead = !displayCustomer ? selectedTask.ticket?.lead : null;

                        if (displayCustomer) {
                          const firstName = displayCustomer.lead?.firstName || "";
                          const lastName = displayCustomer.lead?.lastName || "";
                          const phone = displayCustomer.lead?.phoneNumber || "+977-XXXXXXXXXX";
                          const address = displayCustomer.lead?.address || "Location not provided";
                          
                          return (
                            <div className="space-y-2.5">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer Profile Details</h4>
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border space-y-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><User className="h-4 w-4" /></div>
                                  <div>
                                    <Link href={`/customers/${displayCustomer.id}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                                      {firstName} {lastName}
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                    <p className="text-[10px] text-muted-foreground">ID: {displayCustomer.customerUniqueId}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{address}</span>
                                </div>
                                {taskDestination(selectedTask) && (
                                  <Button variant="outline" size="sm" className="w-full gap-2 mt-1" onClick={() => openDirectionsFromCurrentLocation(taskDestination(selectedTask))}>
                                    <Navigation className="h-3.5 w-3.5" /> Get Directions
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (displayLead) {
                          const firstName = displayLead.firstName || "";
                          const lastName = displayLead.lastName || "";
                          const phone = displayLead.phoneNumber || "+977-XXXXXXXXXX";
                          const address = displayLead.address || "Location not provided";

                          return (
                            <div className="space-y-2.5">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lead Profile Details</h4>
                              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border space-y-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><User className="h-4 w-4" /></div>
                                  <div>
                                    <Link href={`/leads/${displayLead.id}`} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                                      {firstName} {lastName}
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                    <p className="text-[10px] text-muted-foreground">Lead ID: #{displayLead.id}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{address}</span>
                                </div>
                                {taskDestination(selectedTask) && (
                                  <Button variant="outline" size="sm" className="w-full gap-2 mt-1" onClick={() => openDirectionsFromCurrentLocation(taskDestination(selectedTask))}>
                                    <Navigation className="h-3.5 w-3.5" /> Get Directions
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })()}

                      {/* Linked Ticket Info & Clickable profiles */}
                      {selectedTask.ticket && (
                        <div className="space-y-2 border-t pt-4 border-slate-100 dark:border-slate-800">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Linked Support Ticket</h4>
                          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-primary">{selectedTask.ticket.ticketNumber}</span>
                              <Link href={`/tickets/${selectedTask.ticket.id}`} className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5">
                                View Ticket <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                            <p className="text-sm font-semibold mt-1 text-slate-850 dark:text-slate-200">{selectedTask.ticket.title}</p>
                            
                            {selectedTask.ticket.customer && (
                              <div className="mt-2 text-xs text-muted-foreground pt-2 border-t flex items-center justify-between">
                                <span>Customer Profile:</span>
                                <Link href={`/customers/${selectedTask.ticket.customer.id}`} className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                                  {selectedTask.ticket.customer.customerUniqueId} <ExternalLink className="h-3 w-3" />
                                </Link>
                              </div>
                            )}

                            {selectedTask.ticket.lead && (
                              <div className="mt-2 text-xs text-muted-foreground pt-2 border-t flex items-center justify-between">
                                <span>Lead Profile:</span>
                                <Link href={`/leads/${selectedTask.ticket.lead.id}`} className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                                  Lead #{selectedTask.ticket.lead.id} <ExternalLink className="h-3 w-3" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Technician Actions */}
                      <div className="space-y-3 border-t pt-4 border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GPS Validation Actions</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            className="rounded-xl border-blue-100 bg-blue-50/30 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20"
                            onClick={() => handleStatusUpdate(selectedTask.id, "IN_PROGRESS")}
                            disabled={selectedTask.status === "IN_PROGRESS" || selectedTask.status === "COMPLETED" || selectedTask.status === "CANCELLED" || (!isGlobalAdmin && selectedTask.assignedTo?.id !== user?.id && !hasPermission("tasks_manage"))}
                          >
                            Start Job (GPS)
                          </Button>
                          <Button 
                            variant="outline" 
                            className="rounded-xl border-emerald-100 bg-emerald-50/30 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-950/20"
                            onClick={() => handleStatusUpdate(selectedTask.id, "COMPLETED")}
                            disabled={selectedTask.status === "COMPLETED" || selectedTask.status === "CANCELLED" || (!isGlobalAdmin && selectedTask.assignedTo?.id !== user?.id && !hasPermission("tasks_manage"))}
                          >
                            Complete (GPS)
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="w-full text-rose-500 hover:bg-rose-50 rounded-xl text-xs" 
                          onClick={() => handleStatusUpdate(selectedTask.id, "CANCELLED")}
                          disabled={selectedTask.status === "CANCELLED" || selectedTask.status === "COMPLETED" || (!isGlobalAdmin && selectedTask.assignedTo?.id !== user?.id && !hasPermission("tasks_manage"))}
                        >
                          Cancel Task
                        </Button>
                      </div>

                      {/* Task Comment notes feed */}
                      <div className="border-t pt-4 border-slate-100 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span>Progress Work Notes</span>
                        </h4>
                        
                        <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                          {selectedTask.activityLogs?.map(log => {
                            const isComment = log.action === 'COMMENT'
                            return (
                              <div key={log.id} className={`p-2.5 rounded-xl border text-xs relative ${isComment ? 'bg-indigo-50/30 dark:bg-indigo-950/15 border-indigo-100 dark:border-indigo-900/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-150'}`}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {isComment ? `Note by ${log.user?.name || 'Staff'}` : log.action}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {new Date(log.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-350">{log.notes || `State changed to ${log.action}`}</p>
                                {log.lat && log.lon && (
                                  <div className="text-[9px] text-primary flex items-center gap-0.5 mt-1 font-semibold">
                                    <MapPin className="h-3 w-3" />
                                    <span>GPS Verified: {Number(log.lat).toFixed(4)}, {Number(log.lon).toFixed(4)}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {(!selectedTask.activityLogs || selectedTask.activityLogs.length === 0) && (
                            <p className="text-xs text-muted-foreground text-center py-4 italic">No progress comments recorded yet.</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Add work progress note..."
                            value={newTaskComment}
                            onChange={e => setNewTaskComment(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddComment()}
                            className="text-xs rounded-lg bg-white"
                          />
                          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddComment} disabled={addingComment || !newTaskComment.trim()}>
                            {addingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed h-[500px]">
                    <ListIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Select an active job to view details</p>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
