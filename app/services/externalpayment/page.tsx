"use client"

import { useCallback, useEffect, useState } from "react"
import {
  WalletCards,
  RefreshCw,
  Search,
  Zap,
  Code2,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  UserCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileDown,
  Eye,
  Globe
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import toast from "react-hot-toast"

const money = (value: number) =>
  new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR" }).format(Number(value || 0))

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—")

export default function ExternalPaymentPage() {
  const [activeTab, setActiveTab] = useState("transactions")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  // Failed Logs state
  const [failedLogs, setFailedLogs] = useState<any[]>([])
  const [failedLoading, setFailedLoading] = useState(false)
  const [failedSearch, setFailedSearch] = useState("")
  const [failedPage, setFailedPage] = useState(1)
  const [failedPagination, setFailedPagination] = useState({ total: 0, totalPages: 1 })

  // Quick Push / Recharge Tester state
  const [identifierType, setIdentifierType] = useState("all")
  const [rechargeUsername, setRechargeUsername] = useState("")
  const [rechargePaymentMode, setRechargePaymentMode] = useState("EXTERNAL")
  const [rechargeDuration, setRechargeDuration] = useState("1 month")
  const [rechargeAmount, setRechargeAmount] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [customerContext, setCustomerContext] = useState<any>(null)
  const [pushLoading, setPushLoading] = useState(false)
  const [lastPushResult, setLastPushResult] = useState<any>(null)

  // API Config state
  const [config, setConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const getIdentifierPlaceholder = () => {
    switch (identifierType) {
      case "email":
        return "e.g. user@gmail.com"
      case "subscriber_user":
        return "e.g. nettv_subscriber_101 or PPPoE username"
      case "phone":
        return "e.g. 9801234567 (Primary phone)"
      case "secondary_phone":
        return "e.g. 9841234567 (Secondary contact number)"
      case "customer_id":
        return "e.g. CUST-1001 or numeric ID"
      case "username":
        return "e.g. karnkalyan (PPPoE / Account username)"
      default:
        return "Username, email, subscriber user, phone, secondary number, or CUST-xxxx"
    }
  }

  // Load Transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({ page: String(page), limit: "25", status })
      if (search.trim()) query.set("search", search.trim())
      const res = await apiRequest<any>(`/externalpayment/transactions?${query.toString()}`)
      if (res && res.transactions) {
        setTransactions(res.transactions)
        setPagination(res.pagination || { total: 0, totalPages: 1 })
      }
    } catch (error: any) {
      setTransactions([])
      toast.error(error.message || "Failed to load external payment transactions")
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  // Load Configuration
  const loadConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const res = await apiRequest<any>("/settings/externalpayment/config")
      setConfig(res)
    } catch (error: any) {
      console.warn("Failed to load config:", error.message)
    } finally {
      setConfigLoading(false)
    }
  }, [])

  // Load Failed Logs
  const loadFailedLogs = useCallback(async () => {
    setFailedLoading(true)
    try {
      const query = new URLSearchParams({ page: String(failedPage), limit: "25", status: "FAILED" })
      if (failedSearch.trim()) query.set("search", failedSearch.trim())
      const res = await apiRequest<any>(`/externalpayment/transactions?${query.toString()}`)
      if (res && res.transactions) {
        setFailedLogs(res.transactions)
        setFailedPagination(res.pagination || { total: 0, totalPages: 1 })
      }
    } catch (error: any) {
      setFailedLogs([])
      toast.error(error.message || "Failed to load failed payment logs")
    } finally {
      setFailedLoading(false)
    }
  }, [failedPage, failedSearch])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    if (activeTab === "failed-logs") {
      loadFailedLogs()
    }
  }, [activeTab, loadFailedLogs])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Customer Lookup
  const handleLookup = async () => {
    if (!rechargeUsername.trim()) {
      toast.error("Enter a customer identifier to search")
      return
    }

    setLookupLoading(true)
    setCustomerContext(null)
    setLastPushResult(null)
    try {
      const query = new URLSearchParams()
      if (identifierType && identifierType !== "all") {
        query.set("lookup_type", identifierType)
      }
      const queryString = query.toString() ? `?${query.toString()}` : ""
      const res = await apiRequest<any>(
        `/externalpayment/inquiry/${encodeURIComponent(rechargeUsername.trim())}${queryString}`
      )
      if (res.response_code === 0) {
        setCustomerContext(res)
        if (res.current_package?.duration) {
          setRechargeDuration(res.current_package.duration)
        }
        if (res.current_package?.amount) {
          setRechargeAmount(String(res.current_package.amount))
        }
        toast.success(`Found customer: ${res.customer.customer_name}`)
      } else {
        toast.error(res.error || "Customer inquiry failed")
      }
    } catch (error: any) {
      toast.error(error.message || "Customer not found")
    } finally {
      setLookupLoading(false)
    }
  }

  // Execute Direct Push Recharge
  const handlePushRecharge = async () => {
    if (!rechargeUsername.trim()) {
      toast.error("Customer identifier required")
      return
    }

    setPushLoading(true)
    try {
      const val = rechargeUsername.trim()
      const payload: any = {
        identifier: val,
        username: val,
        lookup_type: identifierType,
        payment_mode: rechargePaymentMode,
        duration: rechargeDuration
      }

      if (identifierType === "email") {
        payload.email = val
      } else if (identifierType === "phone") {
        payload.phone = val
        payload.phoneNumber = val
      } else if (identifierType === "secondary_phone") {
        payload.secondary_number = val
        payload.secondaryNumber = val
        payload.secondaryPhone = val
      } else if (identifierType === "subscriber_user") {
        payload.subscriber_user = val
        payload.subscriberUser = val
      }

      if (rechargeAmount && !isNaN(Number(rechargeAmount))) {
        payload.amount = Number(rechargeAmount)
      }

      const res = await apiRequest<any>("/externalpayment/test-recharge", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      if (res.response_code === 0) {
        setLastPushResult(res.data)
        toast.success("Recharge successful!")
        loadTransactions()
        // Refresh customer context if already loaded
        if (customerContext) {
          handleLookup()
        }
      } else {
        toast.error(res.response_message || "Recharge failed")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process recharge")
    } finally {
      setPushLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <WalletCards className="h-6 w-6 text-primary" />
              External Payment Gateway
            </h1>
            <p className="text-sm text-muted-foreground">
              Automated public recharge API, push payments, and transaction history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/docs/External_Payment_API_Documentation.pdf"
              download="External_Payment_API_Documentation.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="default" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <FileDown className="h-4 w-4" />
                Download PDF Docs
              </Button>
            </a>
            <Button
              variant="outline"
              onClick={() => {
                loadTransactions()
                loadFailedLogs()
                loadConfig()
              }}
              disabled={loading || failedLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading || failedLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="failed-logs" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Failed Logs
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Push Recharge
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-500" />
              API Docs
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TRANSACTIONS TABLE */}
          <TabsContent value="transactions" className="space-y-4">
            <CardContainer title="Payment Transactions" description={`${pagination.total} transaction(s) recorded`}>
              <div className="mb-4 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Search username, customer, transaction code or reference..."
                    className="pl-9"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full md:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer / Username</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Tx Code</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Request Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-muted/20 align-top cursor-pointer"
                        onClick={() => setSelectedRequest(item)}
                      >
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {formatDate(item.paidAt || item.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{item.customerName}</div>
                          <div className="text-xs font-mono text-primary">
                            @{item.username || item.customerUniqueId}
                          </div>
                          {item.customerPhone && (
                            <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
                          )}
                        </td>
                        <td className="p-3 font-medium">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {item.paymentMode}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs">{item.packageDuration || "1 month"}</td>
                        <td className="p-3 font-mono text-xs">{item.transactionCode || "—"}</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          {item.referenceCode || "—"}
                        </td>
                        <td className="p-3 text-right font-semibold">{money(item.amount)}</td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              item.status === "COMPLETED"
                                ? "default"
                                : item.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs flex items-center gap-1 mx-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRequest(item)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && transactions.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    No external payment transactions found. Use the &quot;Push Recharge&quot; tab to test one!
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((v) => v - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {Math.max(1, pagination.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((v) => v + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContainer>
          </TabsContent>

          {/* TAB: FAILED LOGS TABLE */}
          <TabsContent value="failed-logs" className="space-y-4">
            <CardContainer
              title="Failed Payment & Inquiry Logs"
              description={`${failedPagination.total} failed event(s) recorded (e.g. no user found, bad request, payment errors)`}
            >
              <div className="mb-4 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={failedSearch}
                    onChange={(event) => {
                      setFailedSearch(event.target.value)
                      setFailedPage(1)
                    }}
                    placeholder="Search failed username, identifier, or error..."
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={loadFailedLogs}
                  disabled={failedLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${failedLoading ? "animate-spin" : ""}`} />
                  Refresh Logs
                </Button>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                      <th className="p-3">Date</th>
                      <th className="p-3">Identifier / Username</th>
                      <th className="p-3">Failure Reason</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedLogs.map((item) => {
                      const reason = item.packageDetails?.reason || item.packageDetails?.error || "Failed request"
                      const isNoUser = reason.toLowerCase().includes("no user") || reason.toLowerCase().includes("not found")
                      return (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-muted/20 align-top cursor-pointer"
                          onClick={() => setSelectedRequest(item)}
                        >
                          <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="p-3">
                            <div className="font-medium font-mono text-primary">
                              @{item.username || item.requestId || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Lookup ID: {item.requestId || "—"}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={isNoUser ? "destructive" : "secondary"}
                              className="text-xs font-medium"
                            >
                              {reason}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {item.paymentMode}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {item.amount > 0 ? money(item.amount) : "—"}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="destructive" className="text-xs">
                              FAILED
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-primary hover:underline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedRequest(item)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!failedLoading && failedLogs.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    No failed logs found. All external payments and inquiries processed without errors.
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={failedPage <= 1 || failedLoading}
                  onClick={() => setFailedPage((v) => v - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {failedPage} of {Math.max(1, failedPagination.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={failedPage >= failedPagination.totalPages || failedLoading}
                  onClick={() => setFailedPage((v) => v + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContainer>
          </TabsContent>

          {/* Complete Request Information Dialog (Shared) */}
          <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  External API Request Details
                </DialogTitle>
                <DialogDescription>
                  Full payload, customer verification, and provisioning status for this incoming request.
                </DialogDescription>
              </DialogHeader>

              {selectedRequest && (
                <div className="space-y-4 text-sm mt-2">
                  {/* Status & Amount Banner */}
                  <div className="flex flex-wrap items-center justify-between p-3 rounded-lg border bg-muted/40 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <Badge
                        variant={
                          selectedRequest.status === "COMPLETED"
                            ? "default"
                            : selectedRequest.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                        }
                        className="mt-1"
                      >
                        {selectedRequest.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-bold text-base text-primary">
                        {money(selectedRequest.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Payment Mode</div>
                      <div className="font-semibold">{selectedRequest.paymentMode}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="font-medium">{selectedRequest.packageDuration || "1 month"}</div>
                    </div>
                  </div>

                  {/* Error Banner if Failed */}
                  {selectedRequest.status === "FAILED" && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-xs space-y-1">
                      <div className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Request Processing Failure
                      </div>
                      <p className="text-red-800 dark:text-red-300 font-mono">
                        {selectedRequest.packageDetails?.reason || selectedRequest.packageDetails?.error || "Payment execution could not be completed"}
                      </p>
                    </div>
                  )}

                  {/* Customer Information Grid */}
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> Customer Identity
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <div className="font-medium">{selectedRequest.customerName || "No user found"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Identifier / Username:</span>
                        <div className="font-mono font-medium text-primary">@{selectedRequest.username || selectedRequest.requestId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer ID:</span>
                        <div className="font-mono">{selectedRequest.customerUniqueId || "—"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Primary Phone:</span>
                        <div>{selectedRequest.customerPhone || "—"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Secondary Phone:</span>
                        <div>{selectedRequest.customerSecondaryPhone || selectedRequest.packageDetails?.payload?.secondary_number || selectedRequest.packageDetails?.payload?.secondaryNumber || selectedRequest.packageDetails?.payload?.secondaryPhone || "—"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <div>{selectedRequest.customerEmail || selectedRequest.packageDetails?.payload?.email || "—"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lookup Type:</span>
                        <div className="font-medium capitalize">{selectedRequest.packageDetails?.lookupType || "Auto / All"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Request Lookup ID:</span>
                        <div className="font-mono text-muted-foreground">{selectedRequest.requestId || "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction & System Tracking Codes */}
                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5" /> Transaction & Audit Codes
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground text-[10px] block">TRANSACTION CODE</span>
                        <span>{selectedRequest.transactionCode || "—"}</span>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground text-[10px] block">REFERENCE CODE</span>
                        <span>{selectedRequest.referenceCode || "—"}</span>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground text-[10px] block">INTERNAL ORDER ID</span>
                        <span>{selectedRequest.orderId || "—"}</span>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <span className="text-muted-foreground text-[10px] block">TIMESTAMP (PAID / CREATED)</span>
                        <span>{formatDate(selectedRequest.paidAt || selectedRequest.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Raw JSON Payload Details */}
                  {selectedRequest.packageDetails && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Raw Package & Execution Details:</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => copyToClipboard(JSON.stringify(selectedRequest, null, 2), "req-json")}
                        >
                          {copiedKey === "req-json" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                          Copy All JSON
                        </Button>
                      </div>
                      <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-md text-xs font-mono overflow-x-auto max-h-48">
                        {JSON.stringify(selectedRequest.packageDetails, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* TAB 2: INSTANT RECHARGE / PUSH TESTER */}
          <TabsContent value="tester" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form Card */}
              <div className="md:col-span-7">
                <CardContainer
                  title="Direct Recharge Push"
                  description="Push payment & activate subscription for any user without searching first."
                >
                  <div className="space-y-4">
                    {/* Identifier Type & Value */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Search / Identifier By</label>
                        <span className="text-xs text-muted-foreground">Select option or use Auto-Detect</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-1">
                          <Select
                            value={identifierType}
                            onValueChange={setIdentifierType}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Auto / All</SelectItem>
                              <SelectItem value="username">Username</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="subscriber_user">Subscriber User</SelectItem>
                              <SelectItem value="phone">Primary Phone</SelectItem>
                              <SelectItem value="secondary_phone">Secondary Phone</SelectItem>
                              <SelectItem value="customer_id">Customer ID</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <Input
                            placeholder={getIdentifierPlaceholder()}
                            value={rechargeUsername}
                            onChange={(e) => setRechargeUsername(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleLookup()
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleLookup}
                            disabled={lookupLoading}
                          >
                            {lookupLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">Inquiry</span>
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {identifierType === "all"
                          ? "Matches PPPoE username, customer unique ID, email, subscriber user, primary phone, or secondary phone number."
                          : `Filter specifically by customer's ${identifierType.replace("_", " ")}.`}
                      </p>
                    </div>

                    {/* Payment Mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Payment Mode</label>
                        <Select
                          value={rechargePaymentMode}
                          onValueChange={setRechargePaymentMode}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EXTERNAL">EXTERNAL (Gateway)</SelectItem>
                            <SelectItem value="ESEWA">ESEWA</SelectItem>
                            <SelectItem value="KHALTI">KHALTI</SelectItem>
                            <SelectItem value="FONEPAY">FONEPAY</SelectItem>
                            <SelectItem value="CONNECTIPS">CONNECTIPS</SelectItem>
                            <SelectItem value="CASH">CASH</SelectItem>
                            <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                            <SelectItem value="ONLINE">ONLINE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Package Duration */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Package Duration</label>
                        <Select
                          value={rechargeDuration}
                          onValueChange={setRechargeDuration}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1 month">1 Month</SelectItem>
                            <SelectItem value="3 months">3 Months</SelectItem>
                            <SelectItem value="6 months">6 Months</SelectItem>
                            <SelectItem value="1 year">1 Year</SelectItem>
                            <SelectItem value="15 days">15 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Custom Amount (Optional) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Amount (NPR){" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (Optional — auto-calculated if empty)
                        </span>
                      </label>
                      <Input
                        type="number"
                        placeholder="Leave empty to use package price"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                      />
                    </div>

                    {/* Action Button */}
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={handlePushRecharge}
                      disabled={pushLoading || !rechargeUsername.trim()}
                    >
                      {pushLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          Processing Recharge & Provisioning...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5 fill-current" />
                          Push Instant Recharge
                        </>
                      )}
                    </Button>
                  </div>
                </CardContainer>
              </div>

              {/* Status / Preview Card */}
              <div className="md:col-span-5 space-y-4">
                {customerContext && (
                  <CardContainer title="Customer Inquiry Details" description="Verified from system">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-md">
                        <UserCheck className="h-5 w-5 text-emerald-600" />
                        <div>
                          <div className="font-semibold">{customerContext.customer.customer_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            @{customerContext.customer.username} · {customerContext.customer.customer_unique_id}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 border rounded">
                          <span className="text-muted-foreground">Current Plan</span>
                          <div className="font-medium truncate">{customerContext.current_package?.name || "—"}</div>
                        </div>
                        <div className="p-2 border rounded">
                          <span className="text-muted-foreground">Expires On</span>
                          <div className="font-medium text-amber-600 font-mono">
                            {customerContext.customer.expiry_date || "Expired / Trial"}
                          </div>
                        </div>
                        <div className="p-2 border rounded">
                          <span className="text-muted-foreground">Primary Phone</span>
                          <div className="font-medium">{customerContext.customer.phone || "—"}</div>
                        </div>
                        <div className="p-2 border rounded">
                          <span className="text-muted-foreground">Secondary Phone</span>
                          <div className="font-medium">{customerContext.customer.secondary_phone || "—"}</div>
                        </div>
                        <div className="p-2 border rounded">
                          <span className="text-muted-foreground">Email</span>
                          <div className="font-medium truncate">{customerContext.customer.email || "—"}</div>
                        </div>
                        <div className="p-2 border rounded">
                          <span className="text-muted-foreground">Subscriber User</span>
                          <div className="font-medium font-mono truncate">{customerContext.customer.subscriber_username || customerContext.customer.username || "—"}</div>
                        </div>
                        <div className="p-2 border rounded col-span-2 flex justify-between items-center">
                          <span className="text-muted-foreground">Default Rate</span>
                          <div className="font-medium text-emerald-600 font-semibold text-sm">
                            {money(customerContext.current_package?.amount || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContainer>
                )}

                {lastPushResult ? (
                  <CardContainer title="Recharge Result" description="Successfully processed">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <div>
                          <div className="font-semibold">Recharged Successfully!</div>
                          <div className="text-xs">RADIUS synced & session refreshed</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Reference Code</span>
                          <span className="font-mono font-medium">{lastPushResult.reference_code}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">New Expiry</span>
                          <span className="font-mono font-semibold text-emerald-600">
                            {new Date(lastPushResult.new_expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-semibold">{money(lastPushResult.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order ID</span>
                          <span className="font-mono">#{lastPushResult.order_id}</span>
                        </div>
                      </div>
                    </div>
                  </CardContainer>
                ) : (
                  <div className="p-6 border rounded-lg border-dashed text-center text-muted-foreground text-sm flex flex-col items-center justify-center min-h-[200px]">
                    <CreditCard className="h-8 w-8 mb-2 opacity-40" />
                    Enter customer username and push recharge to see real-time updates and new expiration dates.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: API DOCS & INTEGRATION */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-4">
                <CardContainer title="Official PDF Documentation" description="Download complete integration guide">
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Contains API endpoints, headers, authentication guides, request/response examples, error codes, and billing integration details.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = "/docs/External_Payment_API_Documentation.pdf";
                          link.download = "External_Payment_API_Documentation.pdf";
                          link.target = "_blank";
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <FileDown className="h-4 w-4" />
                        Download PDF Specification
                      </Button>
                    </div>
                  </div>
                </CardContainer>

                <CardContainer title="API Credentials" description="Use these credentials in external systems">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Username</span>
                      <div className="flex items-center justify-between p-2 bg-muted rounded font-mono text-xs">
                        <span>{config?.username || "external_isp_1"}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(config?.username || "external_isp_1", "user")}
                        >
                          {copiedKey === "user" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Authentication Method</span>
                      <div className="p-2 bg-muted rounded text-xs font-semibold">
                        Bearer Token, HTTP Basic Auth, or Direct Body
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Default Payment Mode</span>
                      <div className="p-2 bg-muted rounded text-xs font-mono">
                        {config?.defaultPaymentMode || "EXTERNAL"}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md text-xs space-y-1">
                      <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" /> Direct Push Supported
                      </div>
                      <p className="text-blue-800 dark:text-blue-300">
                        External gateways can push recharge requests with basic auth or body credentials directly. No inquiry call is strictly required.
                      </p>
                    </div>
                  </div>
                </CardContainer>
              </div>

              <div className="md:col-span-7 space-y-4">
                <CardContainer title="Integration Quick Reference" description="cURL and HTTP request examples">
                  <div className="space-y-4">
                    {/* Endpoint 1 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">POST</Badge>
                          <span className="text-xs font-mono font-semibold">/api/externalpayment/payment</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() =>
                            copyToClipboard(
                              `curl -X POST "${origin || "https://cms.arrownet.com.np"}/api/externalpayment/payment" \\
  -H "Content-Type: application/json" \\
  -u "${config?.username || (config?.ispId ? `external_isp_${config.ispId}` : "ext_gateway")}:<password>" \\
  -d '{
    "username": "karnkalyan",
    "lookup_type": "all",
    "payment_mode": "${config?.defaultPaymentMode || "EXTERNAL"}",
    "duration": "1 month"
  }'`,
                              "curl-payment"
                            )
                          }
                        >
                          {copiedKey === "curl-payment" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                          Copy cURL
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">
                        Accepts <code className="text-primary font-mono font-semibold">username</code>, <code className="text-primary font-mono font-semibold">email</code>, <code className="text-primary font-mono font-semibold">phone</code>, <code className="text-primary font-mono font-semibold">secondary_number</code>, <code className="text-primary font-mono font-semibold">subscriber_user</code>, or <code className="text-primary font-mono font-semibold">identifier</code>.
                      </p>
                      <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-md text-xs font-mono overflow-x-auto">
{`curl -X POST "${origin || "https://cms.arrownet.com.np"}/api/externalpayment/payment" \\
  -H "Content-Type: application/json" \\
  -u "${config?.username || (config?.ispId ? `external_isp_${config.ispId}` : "ext_gateway")}:<password>" \\
  -d '{
    "username": "karnkalyan",
    "lookup_type": "all",
    "payment_mode": "${config?.defaultPaymentMode || "EXTERNAL"}",
    "duration": "1 month"
  }'`}
                      </pre>
                    </div>

                    {/* Endpoint 2 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">GET</Badge>
                          <span className="text-xs font-mono font-semibold">/api/externalpayment/inquiry/:identifier</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() =>
                            copyToClipboard(
                              `curl -X GET "${origin || "https://cms.arrownet.com.np"}/api/externalpayment/inquiry/karnkalyan?lookup_type=all" \\
  -u "${config?.username || "external_isp_1"}:External@ISP#1!2025"`,
                              "curl-inquiry"
                            )
                          }
                        >
                          {copiedKey === "curl-inquiry" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                          Copy cURL
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">
                        Inquiry parameter matches PPPoE username, subscriber user, customer email, primary phone, secondary phone, or customer unique ID.
                      </p>
                      <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-md text-xs font-mono overflow-x-auto">
{`curl -X GET "${origin || "https://cms.arrownet.com.np"}/api/externalpayment/inquiry/karnkalyan?lookup_type=all" \\
  -u "${config?.username || "external_isp_1"}:<password>"`}
                      </pre>
                    </div>

                    {/* Endpoint 3 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">POST</Badge>
                          <span className="text-xs font-mono font-semibold">/api/externalpayment/access-token</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() =>
                            copyToClipboard(
                              `curl -X POST "${origin || "https://cms.arrownet.com.np"}/api/externalpayment/access-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "password",
    "username": "${config?.username || "external_isp_1"}",
    "password": "External@ISP#1!2025"
  }'`,
                              "curl-auth"
                            )
                          }
                        >
                          {copiedKey === "curl-auth" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                          Copy cURL
                        </Button>
                      </div>
                      <pre className="p-3 bg-zinc-950 text-zinc-100 rounded-md text-xs font-mono overflow-x-auto">
{`curl -X POST "${origin || "https://cms.arrownet.com.np"}/api/externalpayment/access-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "password",
    "username": "${config?.username || "external_isp_1"}",
    "password": "<password>"
  }'`}
                      </pre>
                    </div>
                  </div>
                </CardContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
