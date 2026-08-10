"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Check,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  Send,
  User,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "react-hot-toast"
import { apiRequest, buildApiAssetUrl } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Updated interface to match actual API response
interface Customer {
  id: number
  customerUniqueId: string
  panNo?: string
  idNumber?: string
  leadId?: number
  membershipId?: number | null
  branchId?: number | null
  ispId: number
  isRechargeable: boolean
  installedById?: number | null
  oltId?: number | null
  splitterId?: number | null
  existingISPId?: number | null
  assignedPkg: number
  subscribedPkgId: number
  status: string
  isDeleted: boolean
  onboardStatus: string
  createdAt: string
  updatedAt: string
  packagePrice: {
    id: number
    packageName: string
    price: number
    packageDuration: string
    isTrial: boolean
    packagePlanDetails: {
      planName: string
      planCode: string
      downSpeed: number
      upSpeed: number
      deviceLimit: number
    }
  }
  subscribedPkg: {
    id: number
    packageName: string
    price: number
    packageDuration: string
    isTrial: boolean
    packagePlanDetails: {
      planName: string
      planCode: string
      downSpeed: number
      upSpeed: number
      deviceLimit: number
    }
  }
  membership: {
    id: number
    name: string
    code: string
  } | null
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
      description: string
      gemIndex: number
      vlanType: string
      priority: number
      status: string
      createdAt: string
      updatedAt: string
    }>
  }>
  documents: any[]
  connectionUsers: Array<{
    id: number
    username: string
    password: string
    isActive: boolean
    createdAt: string
  }>
  customerSubscriptions: Array<{
    id: number
    package: number
    isTrial: boolean
    planStart: string
    planEnd: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }>
  firstName: string
  middleName?: string | null
  lastName: string
  profilePicture?: string | null
  portalUser?: {
    profilePicture?: string | null
  } | null
  email: string
  phoneNumber: string
  secondaryPhone?: string
  gender?: string
  street?: string
  district?: string
  state?: string
  branch?: {
    id: number
    name: string
  } | null
  subBranch?: {
    id: number
    name: string
  } | null
  convertedAt?: string
  isFree?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface CustomersResponse {
  data: Customer[]
  pagination: PaginationInfo
}

export function CustomersList() {
  const { user } = useAuth()
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [pendingDeleteCustomerId, setPendingDeleteCustomerId] = useState<string | null>(null)
  const [voipEnabled, setVoipEnabled] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })
  const router = useRouter()
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, { radius: string; acs: string; loading: boolean }>>({})
  const [smsProviders, setSmsProviders] = useState<any[]>([])
  const [selectedSmsProvider, setSelectedSmsProvider] = useState("")
  const [smsCustomer, setSmsCustomer] = useState<Customer | null>(null)
  const [smsMessage, setSmsMessage] = useState("")
  const [sendingSms, setSendingSms] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [connectionFilter, setConnectionFilter] = useState("all")
  const [referenceTime] = useState(() => Date.now())

  const handleOutboundCall = async (phoneNumber?: string) => {
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
      toast.error(/yeastar|yeaster|asterisk|voip|configured|enabled/i.test(message) ? "Calling is disabled because no VOIP service is enabled" : message || "Failed to initiate call")
    }
  }

  const fetchVoipStatus = async () => {
    const [yeastar, asterisk] = await Promise.all([
      apiRequest<any>("/services/isp/status/YEASTAR", { suppressToast: true }).catch(() => null),
      apiRequest<any>("/services/isp/status/ASTERISK", { suppressToast: true }).catch(() => null),
    ])
    const statuses = [yeastar?.data, asterisk?.data]
    setVoipEnabled(statuses.some((status) => status?.enabled === true && status?.configured === true))
  }

  const fetchCustomers = async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const data = await apiRequest<CustomersResponse>(`/customer?page=${page}&limit=${limit}`)

      if (data && Array.isArray(data.data)) {
        setCustomers(data.data)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        setCustomers([])
        toast.error("Invalid customer data format received")
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error)
      setError(error.message || "Failed to fetch customers")
      toast.error("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  const fetchSmsProviders = async () => {
    try {
      const response = await apiRequest<any>("/service/isp?includeInactive=true")
      const list = Array.isArray(response) ? response : response?.data || []
      const providers = list.filter((item: any) =>
        (item.service?.code === "AAKASHSMS" || item.service?.code === "SPARROWSMS") &&
        item.isActive !== false &&
        item.isDeleted !== true
      )
      setSmsProviders(providers)
      const defaultProvider = providers.find((item: any) => item.config?.isDefault === true) || providers[0]
      if (defaultProvider?.service?.code) setSelectedSmsProvider(defaultProvider.service.code)
    } catch (error) {
      console.error("Failed to fetch SMS providers:", error)
      setSmsProviders([])
    }
  }

  const openSmsDialog = (customer: Customer) => {
    if (!customer.phoneNumber) {
      toast.error("Phone number is not available")
      return
    }
    setSmsCustomer(customer)
    setSmsMessage(`Dear ${customer.firstName || "Customer"}, thank you for contacting us.`)
  }

  const sendManualSms = async () => {
    if (!smsCustomer) return
    if (!selectedSmsProvider) return toast.error("No enabled SMS provider is configured")
    if (!smsMessage.trim()) return toast.error("Message is required")
    if (!smsCustomer.phoneNumber) return toast.error("Phone number is not available")

    try {
      setSendingSms(true)
      const result = await apiRequest<any>("/service/sms/send-bulk", {
        method: "POST",
        body: JSON.stringify({
          to: smsCustomer.phoneNumber,
          text: smsMessage.trim(),
          type: "customer",
          provider: selectedSmsProvider,
        })
      })
      if (result?.success === false || result?.data?.error) {
        const providerError = result?.data?.errors?.[0]?.message || result?.data?.data?.errors?.[0]?.message
        toast.error(providerError || result?.data?.message || result?.error || "Failed to send SMS")
        return
      }
      toast.success(result?.message || result?.data?.message || "SMS sent successfully")
      setSmsCustomer(null)
      setSmsMessage("")
    } catch (error: any) {
      toast.error(error.message || "Failed to send SMS")
    } finally {
      setSendingSms(false)
    }
  }

  useEffect(() => {
    fetchCustomers(pagination.page, pagination.limit)
    fetchVoipStatus()
    fetchSmsProviders()
  }, [pagination.page])

  useEffect(() => {
    if (customers.length === 0) return

    // Initialize statuses for these customers if not already present
    setConnectionStatuses(prev => {
      const next = { ...prev }
      customers.forEach(c => {
        if (!next[c.id]) {
          next[c.id] = { radius: 'pending', acs: 'pending', loading: false }
        }
      })
      return next
    })

    // Asynchronously fetch status for each customer in the list
    customers.forEach(async (customer) => {
      const cid = customer.id.toString()
      // Only fetch if not already loaded or currently loading
      if (connectionStatuses[cid] && connectionStatuses[cid].radius !== 'pending' && connectionStatuses[cid].radius !== 'loading') return

      setConnectionStatuses(prev => ({
        ...prev,
        [cid]: { ...prev[cid], loading: true }
      }))

      try {
        const res = await apiRequest<any>(`/customer/${cid}`)
        if (res) {
          setConnectionStatuses(prev => ({
            ...prev,
            [cid]: {
              radius: res.radiusRealtimeStatus || 'offline',
              acs: res.ontRealtimeStatus || 'offline',
              loading: false
            }
          }))
        }
      } catch (err) {
        console.error(`Failed to fetch status for customer ${cid}`, err)
        setConnectionStatuses(prev => ({
          ...prev,
          [cid]: {
            radius: 'error',
            acs: 'error',
            loading: false
          }
        }))
      }
    })
  }, [customers])

  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map((customer) => customer.id.toString()))
    }
  }

  const toggleSelectCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter((customerId) => customerId !== id))
    } else {
      setSelectedCustomers([...selectedCustomers, id])
    }
  }

  const handleViewProfile = (customerId: string) => {
    router.push(`/customers/${customerId}`)
  }

  const handleViewInvoices = (customerId: string) => {
    router.push(`/customers/${customerId}/invoices`)
  }

  const handleCheckConnection = async (customerId: string) => {
    const loadingToast = toast.loading("Checking connection status...")
    setConnectionStatuses(prev => ({
      ...prev,
      [customerId]: { radius: 'loading', acs: 'loading', loading: true }
    }))
    try {
      const res = await apiRequest<any>(`/customer/${customerId}`)
      if (res) {
        setConnectionStatuses(prev => ({
          ...prev,
          [customerId]: {
            radius: res.radiusRealtimeStatus || 'offline',
            acs: res.ontRealtimeStatus || 'offline',
            loading: false
          }
        }))
        toast.success(`Status: Radius is ${res.radiusRealtimeStatus || 'offline'}, ACS is ${res.ontRealtimeStatus || 'offline'}`, { id: loadingToast })
      }
    } catch (err: any) {
      setConnectionStatuses(prev => ({
        ...prev,
        [customerId]: { radius: 'error', acs: 'error', loading: false }
      }))
      toast.error("Failed to check connection status", { id: loadingToast })
    }
  }

  const handleDeleteCustomer = (customerId: string) => {
    setPendingDeleteCustomerId(customerId)
    setDeleteDialogOpen(true)
  }

  const handleStatusChange = async (customerId: string, newStatus: string) => {
    const loadingToast = toast.loading(`Updating status to ${newStatus}...`)
    try {
      await apiRequest(`/customer/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Status updated to ${newStatus}`, { id: loadingToast })
      fetchCustomers(pagination.page, pagination.limit)
    } catch (error: any) {
      console.error("Error updating customer status:", error)
      toast.error(error.message || "Failed to update status", { id: loadingToast })
    }
  }

  const confirmDeleteCustomer = async () => {
    if (!pendingDeleteCustomerId) return
    try {
      await apiRequest(`/customer/${pendingDeleteCustomerId}`, {
        method: 'DELETE',
      })

      toast.success("Customer deleted successfully")
      fetchCustomers(pagination.page, pagination.limit)
      setSelectedCustomers(selectedCustomers.filter(id => id !== pendingDeleteCustomerId))
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast.error(error.message || "Failed to delete customer")
    } finally {
      setPendingDeleteCustomerId(null)
    }
  }

  const confirmBulkDelete = async () => {
    const ids = [...selectedCustomers]
    const loadingToast = toast.loading(`Deleting ${ids.length} customers...`)
    try {
      let deleted = 0
      for (const id of ids) {
        await apiRequest(`/customer/${id}`, { method: 'DELETE' })
        deleted += 1
      }
      toast.dismiss(loadingToast)
      toast.success(`${deleted} customers deleted successfully`)
      setSelectedCustomers([])
      fetchCustomers(pagination.page, pagination.limit)
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error(error.message || "Failed to delete selected customers")
    }
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case "active": return <Check className="mr-2 h-4 w-4 text-green-500" />
      case "suspended": return <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
      case "inactive": return <Ban className="mr-2 h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    const variants: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      suspended: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      inactive: "bg-red-500/10 text-red-500 border-red-500/20",
    }
    return (
      <Badge variant="outline" className={variants[statusLower] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {statusLower}
      </Badge>
    )
  }

  const getConnectionTypeBadge = (connectionType?: string) => {
    const typeLower = connectionType?.toLowerCase() ?? "unknown"
    const variants: Record<string, string> = {
      fiber: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pppoe: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      hotspot: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    }
    return (
      <Badge variant="outline" className={variants[typeLower] || "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
        {typeLower}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'NPR', minimumFractionDigits: 0
    }).format(price)
  }

  const getCustomerFullName = (customer: Customer) => {
    const name = [customer.firstName, customer.middleName, customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
    return name || customer.customerUniqueId || `Customer ${customer.id}`
  }

  const getCustomerInitials = (customer: Customer) => {
    const parts = [customer.firstName, customer.middleName, customer.lastName]
      .filter((name): name is string => Boolean(name && name.trim()))
      .flatMap((name) => name.trim().split(/\s+/))

    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return "CU"
  }

  const getCustomerProfilePictureUrl = (customer: Customer) => {
    const rawPicture = customer.profilePicture || customer.portalUser?.profilePicture
    return rawPicture ? buildApiAssetUrl(rawPicture) : ""
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    fetchCustomers(1, newLimit)
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const visibleCustomers = customers.filter((customer) => {
    const customerId = customer.id.toString()
    const status = customer.status?.toLowerCase() || "unknown"
    const connection = connectionStatuses[customerId]
    const isOnline = connection?.radius === "online" || connection?.acs === "online"
    const matchesSearch = !normalizedSearch || [
      customer.customerUniqueId,
      getCustomerFullName(customer),
      customer.email,
      customer.phoneNumber,
      customer.secondaryPhone,
      customer.connectionUsers?.[0]?.username,
      customer.branch?.name,
      customer.subscribedPkg?.packagePlanDetails?.planName,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))
    const matchesStatus = statusFilter === "all" || status === statusFilter
    const matchesConnection = connectionFilter === "all"
      || (connectionFilter === "online" && isOnline)
      || (connectionFilter === "offline" && !isOnline && !connection?.loading)

    return matchesSearch && matchesStatus && matchesConnection
  })

  const activeOnPage = customers.filter((customer) => customer.status?.toLowerCase() === "active").length
  const radiusOnlineOnPage = customers.filter((customer) => connectionStatuses[customer.id]?.radius === "online").length
  const acsOnlineOnPage = customers.filter((customer) => connectionStatuses[customer.id]?.acs === "online").length
  const expiringSoonOnPage = customers.filter((customer) => {
    const planEnd = customer.customerSubscriptions?.[0]?.planEnd
    if (!planEnd) return false
    const remaining = new Date(planEnd).getTime() - referenceTime
    return remaining >= 0 && remaining <= 7 * 24 * 60 * 60 * 1000
  }).length

  if (loading) {
    return (
      <CardContainer title="Customers" description="All registered customers">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CardContainer>
    )
  }

  if (error) {
    return (
      <CardContainer title="Customers" description="All registered customers">
        <div className="flex flex-col items-center py-12 gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchCustomers(pagination.page, pagination.limit)}>
            Retry
          </Button>
        </div>
      </CardContainer>
    )
  }

  return (
    <>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete customer?"
        description="This will revert the customer to a qualified lead. Customers with assigned hardware must return devices before deletion."
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteCustomer}
      />
      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete selected customers?"
        description="Each selected customer will be reverted to a qualified lead. Any customer with assigned hardware will be rejected by the server until devices are returned."
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmBulkDelete}
      />
      <CardContainer
        title="Customer Directory"
        description={`${pagination.total.toLocaleString()} registered subscriber accounts`}
        className="customer-directory-card"
        action={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCustomers(pagination.page, pagination.limit)}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      >
        <div className="customer-directory-summary grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total Customers", value: pagination.total, detail: "All registered accounts", icon: Users, tone: "violet" },
            { label: "Active on Page", value: activeOnPage, detail: `${customers.length} records loaded`, icon: UserCheck, tone: "emerald" },
            { label: "Radius Online", value: radiusOnlineOnPage, detail: "Live PPPoE sessions", icon: Wifi, tone: "blue" },
            { label: "ACS Online", value: acsOnlineOnPage, detail: "Reachable managed devices", icon: Wifi, tone: "cyan" },
            { label: "Expiring Soon", value: expiringSoonOnPage, detail: "Within the next 7 days", icon: CalendarClock, tone: "amber" },
          ].map((metric) => {
            const MetricIcon = metric.icon
            return (
              <div key={metric.label} className="customer-directory-stat">
                <div className={`customer-directory-stat-icon is-${metric.tone}`}>
                  <MetricIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight">{metric.value.toLocaleString()}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{metric.detail}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="customer-directory-toolbar">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by customer, ID, phone, username, branch, or plan..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Account status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={connectionFilter} onValueChange={setConnectionFilter}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All connections</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="customer-directory-table rounded-xl border">
          <div className="relative w-full overflow-auto">
            {visibleCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground/60" />
                <p className="font-medium">{customers.length === 0 ? "No customers found" : "No customers match these filters"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {customers.length === 0 ? "Add a customer to begin managing subscriber services." : "Try adjusting the search or status filters."}
                </p>
                {customers.length === 0 ? (
                  <Button variant="outline" size="sm" onClick={() => router.push('/customers/new')} className="mt-3">
                    Add New Customer
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilter("all")
                      setConnectionFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <table className="w-full caption-bottom text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                      <th className="w-[44px] py-3.5 pl-4 pr-1 text-left align-middle">
                        <Checkbox
                          checked={selectedCustomers.length === customers.length && customers.length > 0}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">CUSTOMER ID</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">SUBSCRIBER</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">RADIUS USER</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">BRANCH</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">PLAN &amp; SPEED</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">STATUS</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 py-3.5 px-3 text-left">CONNECTION &amp; TELEMETRY</th>
                      <th className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3 text-left">EXPIRATION</th>
                      <th className="w-[50px] text-center text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 py-3.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {visibleCustomers.map((customer) => {
                      const customerId = customer.id.toString()
                      const fullName = getCustomerFullName(customer)
                      const serviceDetail = customer.serviceDetails?.[0]
                      const connectionType = serviceDetail?.connectionType
                      const deviceModel = customer.devices?.[0]?.model
                      const plan = customer.subscribedPkg
                      const isTrial = customer.customerSubscriptions?.[0]?.isTrial

                      const radStatus = connectionStatuses[customerId]?.radius || 'offline'
                      const acsStatus = connectionStatuses[customerId]?.acs || 'offline'
                      const isRadOnline = radStatus === 'online'
                      const isAcsOnline = acsStatus === 'online'

                      const vlansSummary = serviceDetail?.vlanDetails && serviceDetail.vlanDetails.length > 0
                        ? serviceDetail.vlanDetails.map(v => `${v.vlanId}: ${v.name || v.vlanType}`).join(" · ")
                        : serviceDetail?.vlanId ? `VLAN ${serviceDetail.vlanId}` : null

                      return (
                        <tr
                          key={customerId}
                          className="transition-colors hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 cursor-pointer"
                          onClick={() => handleViewProfile(customerId)}
                        >
                          <td className="py-3 pl-4 pr-1 align-middle" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedCustomers.includes(customerId)}
                              onCheckedChange={() => toggleSelectCustomer(customerId)}
                              aria-label={`Select ${fullName}`}
                            />
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
                              {customer.customerUniqueId || `CUS-${customer.id.toString().padStart(4, '0')}`}
                            </span>
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 shrink-0">
                                {getCustomerProfilePictureUrl(customer) && (
                                  <AvatarImage src={getCustomerProfilePictureUrl(customer)} alt={fullName} />
                                )}
                                <AvatarFallback className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  {getCustomerInitials(customer)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate max-w-[180px]">{fullName}</div>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                  <span className="truncate max-w-[140px]">{customer.email}</span>
                                  {customer.phoneNumber && (
                                    <>
                                      <span>·</span>
                                      <button
                                        type="button"
                                        className={`inline-flex items-center hover:text-indigo-600 font-mono ${!voipEnabled ? "cursor-not-allowed opacity-60" : ""}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOutboundCall(customer.phoneNumber)
                                        }}
                                      >
                                        <Phone className="h-3 w-3 mr-0.5 inline" />
                                        {customer.phoneNumber}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 align-middle font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {customer.connectionUsers?.[0]?.username || '—'}
                          </td>
                          <td className="py-3 px-3 align-middle text-xs font-bold text-slate-800 dark:text-slate-200">
                            {customer.branch?.name || 'Main Branch'}
                            {customer.subBranch?.name && (
                              <span className="block text-[10px] font-medium text-muted-foreground">({customer.subBranch.name})</span>
                            )}
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div>
                              <div className="font-extrabold text-xs text-slate-900 dark:text-white">{plan?.packagePlanDetails?.planName ?? 'N/A'}</div>
                              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                {plan?.packagePlanDetails?.downSpeed ?? 75} Mbps · {plan?.price ? formatPrice(plan.price) : 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div className="flex flex-wrap items-center gap-1">
                              {getStatusBadge(customer.status)}
                              {customer.isFree && (
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[9px] font-bold px-1.5 py-0">
                                  Free
                                </Badge>
                              )}
                              {isTrial && (
                                <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20 text-[9px] font-bold px-1.5 py-0">
                                  Trial
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {getConnectionTypeBadge(connectionType)}
                                {deviceModel && (
                                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                                    ({deviceModel})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground font-sans font-bold uppercase">RADIUS:</span>
                                  {connectionStatuses[customerId]?.loading ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  ) : (
                                    <span className={`font-bold ${isRadOnline ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                                      ● {radStatus}
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-muted-foreground font-sans font-bold uppercase">ACS:</span>
                                  {connectionStatuses[customerId]?.loading ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  ) : (
                                    <span className={`font-bold ${isAcsOnline ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                                      ● {acsStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {vlansSummary && (
                                <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]" title={vlansSummary}>
                                  {vlansSummary}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 align-middle">
                            {customer.customerSubscriptions?.[0]?.planEnd ? (
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                                  {formatDate(customer.customerSubscriptions[0].planEnd)}
                                </div>
                                {new Date(customer.customerSubscriptions[0].planEnd).getTime() < referenceTime ? (
                                  <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-bold px-1.5 py-0">
                                    Expired
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold px-1.5 py-0">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewProfile(customerId)}>
                                  <User className="mr-2 h-4 w-4" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewInvoices(customerId)}>
                                  <FileText className="mr-2 h-4 w-4" /> View Invoices
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCheckConnection(customerId)}>
                                  <Wifi className="mr-2 h-4 w-4" /> Check Connection
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openSmsDialog(customer)}>
                                  <MessageSquare className="mr-2 h-4 w-4" /> Send SMS
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <User className="mr-2 h-4 w-4" /> Change Status
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleStatusChange(customerId, 'active')}>
                                      Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(customerId, 'inactive')}>
                                      Inactive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(customerId, 'suspended')}>
                                      Suspended
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customerId)}>
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} customers
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Rows per page:</span>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={pagination.limit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                      >
                        {[5, 10, 25, 50, 100].map(limit => (
                          <option key={limit} value={limit}>{limit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => Math.abs(page - pagination.page) <= 2 || page === 1 || page === pagination.totalPages)
                          .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2">…</span>}
                              <Button
                                variant={pagination.page === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCustomers.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border p-4">
            <span className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedCustomers.length}</span> customers selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Bulk Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.loading(`Exporting ${selectedCustomers.length} customers...`)}>
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.loading(`Sending emails...`)}>
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Manual SMS Dialog */}
        <Dialog open={!!smsCustomer} onOpenChange={(open) => !open && setSmsCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>
                Send a manual SMS to {smsCustomer ? `${smsCustomer.firstName} ${smsCustomer.lastName}` : "customer"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SMS Provider</Label>
                <Select value={selectedSmsProvider} onValueChange={setSelectedSmsProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {smsProviders.length > 0 ? (
                      smsProviders.map((provider) => (
                        <SelectItem key={String(provider.service?.code || provider.id)} value={String(provider.service?.code || "")}>
                          {provider.service?.name || provider.service?.code}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="AAKASHSMS">Aakash SMS</SelectItem>
                        <SelectItem value="SPARROWSMS">Sparrow SMS</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={smsCustomer?.phoneNumber || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={smsMessage} onChange={(event) => setSmsMessage(event.target.value)} rows={5} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSmsCustomer(null)}>Cancel</Button>
              <Button onClick={sendManualSms} disabled={sendingSms}>
                <Send className="mr-2 h-4 w-4" />
                {sendingSms ? "Sending..." : "Send SMS"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContainer>
    </>
  )
}
