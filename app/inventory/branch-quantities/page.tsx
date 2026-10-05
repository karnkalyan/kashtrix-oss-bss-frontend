"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Building2,
  HardDrive,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Package,
  Layers,
  ArrowUpDown,
  Filter
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

type BranchQuantity = {
  branchId: string | number
  branchName: string
  branchCode?: string
  total: number
  inStock: number
  branch: number
  customer: number
  technician: number
  faulty: number
}

function BranchQuantitiesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const deviceTypeParam = searchParams.get("type") || "ONT"

  const [selectedType, setSelectedType] = useState<string>(deviceTypeParam.toUpperCase())
  const [items, setItems] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchBranch, setSearchBranch] = useState<string>("")
  const [searchSerial, setSearchSerial] = useState<string>("")

  // Pagination for branch table
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Pagination for individual items table
  const [itemsPage, setItemsPage] = useState<number>(1)
  const [itemsPageSize, setItemsPageSize] = useState<number>(20)

  // Active tab: "branches" or "items"
  const [activeTab, setActiveTab] = useState<string>("branches")
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL")

  useEffect(() => {
    if (deviceTypeParam) {
      setSelectedType(deviceTypeParam.toUpperCase())
    }
  }, [deviceTypeParam])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [invData, branchData]: [any, any] = await Promise.all([
          apiRequest<any>("/inventory"),
          apiRequest<any>("/branches")
        ])
        setItems(Array.isArray(invData) ? invData : [])
        setBranches(Array.isArray(branchData) ? branchData : (Array.isArray(branchData?.data) ? branchData.data : []))
      } catch (err: any) {
        console.error("Failed to load inventory data:", err)
        toast({ title: "Error", description: "Failed to load branch quantities data", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // All distinct types available in inventory
  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>()
    items.forEach(it => {
      if (it.type) typeSet.add(it.type.toUpperCase())
    })
    if (!typeSet.has(selectedType)) typeSet.add(selectedType)
    return Array.from(typeSet).sort()
  }, [items, selectedType])

  // Items for the selected device type
  const typeItems = useMemo(() => {
    return items.filter(it => (it.type || "").toUpperCase() === selectedType)
  }, [items, selectedType])

  // Aggregate branch distribution
  const branchBreakdown = useMemo(() => {
    const map = new Map<string, BranchQuantity>()

    // Pre-populate with all known branches so zero-stock branches can also be shown if desired
    branches.forEach((b: any) => {
      const bKey = String(b.id)
      map.set(bKey, {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code || "",
        total: 0,
        inStock: 0,
        branch: 0,
        customer: 0,
        technician: 0,
        faulty: 0,
      })
    })

    // Also account for Head Office / Unassigned
    const unassignedKey = "head-office"
    map.set(unassignedKey, {
      branchId: "head-office",
      branchName: "Head Office (Global / Unassigned)",
      branchCode: "HQ",
      total: 0,
      inStock: 0,
      branch: 0,
      customer: 0,
      technician: 0,
      faulty: 0,
    })

    typeItems.forEach((item: any) => {
      const count = Number(item.qty || item.quantity || 1)
      const bId = item.branchId ? String(item.branchId) : (item.branch?.id ? String(item.branch.id) : unassignedKey)

      if (!map.has(bId)) {
        map.set(bId, {
          branchId: bId,
          branchName: item.branch?.name || (bId === unassignedKey ? "Head Office (HQ)" : `Branch #${bId}`),
          branchCode: item.branch?.code || "",
          total: 0,
          inStock: 0,
          branch: 0,
          customer: 0,
          technician: 0,
          faulty: 0,
        })
      }

      const rec = map.get(bId)!
      rec.total += count

      const status = String(item.status || "").toUpperCase()
      const isFaulty = item.condition === "Faulty" || item.condition === "Damaged" || status.includes("FAULTY")
      const isAssignedToUser = Boolean(item.userId || item.user)
      const isAssignedToCustomer = Boolean(item.customerId || item.customer) || status.includes("CUSTOMER")

      if (isFaulty) {
        rec.faulty += count
      } else if (isAssignedToCustomer) {
        rec.customer += count
      } else if (isAssignedToUser) {
        rec.technician += count
      } else if (status === "ASSIGNED_TO_BRANCH") {
        rec.branch += count
      } else {
        rec.inStock += count
      }
    })

    // Filter out branches with 0 total items, unless searched
    return Array.from(map.values())
      .filter(b => b.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [typeItems, branches])

  // Filtered branches by search
  const filteredBranches = useMemo(() => {
    if (!searchBranch.trim()) return branchBreakdown
    const term = searchBranch.toLowerCase().trim()
    return branchBreakdown.filter(b => 
      b.branchName.toLowerCase().includes(term) ||
      (b.branchCode && b.branchCode.toLowerCase().includes(term))
    )
  }, [branchBreakdown, searchBranch])

  // Branch Pagination
  const totalBranchPages = Math.ceil(filteredBranches.length / pageSize) || 1
  const paginatedBranches = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredBranches.slice(start, start + pageSize)
  }, [filteredBranches, currentPage, pageSize])

  // Overall Totals for this device type
  const totals = useMemo(() => {
    return branchBreakdown.reduce(
      (acc, b) => {
        acc.total += b.total
        acc.inStock += b.inStock
        acc.branch += b.branch
        acc.customer += b.customer
        acc.technician += b.technician
        acc.faulty += b.faulty
        return acc
      },
      { total: 0, inStock: 0, branch: 0, customer: 0, technician: 0, faulty: 0 }
    )
  }, [branchBreakdown])

  // Detailed Items for this device type with branch filter
  const filteredTypeItems = useMemo(() => {
    return typeItems.filter(item => {
      if (selectedBranchFilter !== "ALL") {
        const itemBranchId = item.branchId ? String(item.branchId) : (item.branch?.id ? String(item.branch.id) : "head-office")
        if (itemBranchId !== selectedBranchFilter) return false
      }
      if (searchSerial.trim()) {
        const term = searchSerial.toLowerCase().trim()
        const sMatch = (item.serialNumber || "").toLowerCase().includes(term)
        const nameMatch = (item.name || "").toLowerCase().includes(term)
        const macMatch = (item.macAddress || "").toLowerCase().includes(term)
        if (!sMatch && !nameMatch && !macMatch) return false
      }
      return true
    })
  }, [typeItems, selectedBranchFilter, searchSerial])

  const totalItemPages = Math.ceil(filteredTypeItems.length / itemsPageSize) || 1
  const paginatedItems = useMemo(() => {
    const start = (itemsPage - 1) * itemsPageSize
    return filteredTypeItems.slice(start, start + itemsPageSize)
  }, [filteredTypeItems, itemsPage, itemsPageSize])

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType)
    setCurrentPage(1)
    setItemsPage(1)
    setSelectedBranchFilter("ALL")
    router.replace(`/inventory/branch-quantities?type=${encodeURIComponent(newType)}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/inventory")}
              className="gap-2 text-muted-foreground hover:text-foreground pl-0 -ml-1 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Branch Quantities for {selectedType}
              </h1>
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-mono">
                {totals.total} total {totals.total === 1 ? "device" : "devices"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Detailed distribution of {totals.total} total {selectedType} device(s) across branches with live assignment metrics.
            </p>
          </div>

          {/* Quick Type Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Switch Device Type:
            </span>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(t => (
                  <SelectItem key={t} value={t} className="font-medium">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Quantity</div>
            <div className="text-2xl font-bold text-foreground mt-1">{totals.total}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across {branchBreakdown.length} branches</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">In Stock</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{totals.inStock}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Available for deployment</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/10">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Branch Assigned</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{totals.branch}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Assigned to branch pool</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-purple-500/20 bg-purple-50/30 dark:bg-purple-950/10">
            <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Customer Assigned</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">{totals.customer}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active at customer sites</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10">
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Field Staff / Tech</div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{totals.technician}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">With technicians</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Faulty / Returned</div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">{totals.faulty}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Requires inspection/repair</p>
          </div>
        </div>

        {/* Tabs: Branch Quantities vs Specific Devices List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
            <TabsList className="bg-muted/70 p-1">
              <TabsTrigger value="branches" className="gap-2 px-4">
                <Building2 className="h-4 w-4" />
                Branch Distribution ({branchBreakdown.length})
              </TabsTrigger>
              <TabsTrigger value="items" className="gap-2 px-4">
                <HardDrive className="h-4 w-4" />
                Individual Devices ({typeItems.length})
              </TabsTrigger>
            </TabsList>

            {activeTab === "branches" && (
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search branch name or code..."
                    value={searchBranch}
                    onChange={(e) => { setSearchBranch(e.target.value); setCurrentPage(1); }}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
              </div>
            )}

            {activeTab === "items" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search serial, model, or name..."
                    value={searchSerial}
                    onChange={(e) => { setSearchSerial(e.target.value); setItemsPage(1); }}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>
                <Select
                  value={selectedBranchFilter}
                  onValueChange={(val) => { setSelectedBranchFilter(val); setItemsPage(1); }}
                >
                  <SelectTrigger className="h-8 text-xs w-[180px] bg-background">
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branchBreakdown.map(bb => (
                      <SelectItem key={String(bb.branchId)} value={String(bb.branchId)}>
                        {bb.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* TAB 1: Branch Distribution Table */}
          <TabsContent value="branches" className="space-y-4 m-0">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[280px]">Branch Name</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-center">In Stock</TableHead>
                    <TableHead className="text-center">Branch Assigned</TableHead>
                    <TableHead className="text-center">Customer Assigned</TableHead>
                    <TableHead className="text-center">Field Staff / Tech</TableHead>
                    <TableHead className="text-center">Faulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-sm">Loading branch quantities...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedBranches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-sm">No branch records found</p>
                        <p className="text-xs mt-0.5">Try clearing your search query</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBranches.map((bb) => (
                      <TableRow key={String(bb.branchId)} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-semibold text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>{bb.branchName}</span>
                                {bb.branchCode && (
                                  <Badge variant="outline" className="text-[10px] px-1 font-mono">
                                    {bb.branchCode}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {bb.total} {selectedType} units allocated
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold font-mono text-sm">
                          {bb.total}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 font-semibold text-xs px-2.5">
                            {bb.inStock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold text-xs px-2.5">
                            {bb.branch}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-semibold text-xs px-2.5">
                            {bb.customer}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 font-semibold text-xs px-2.5">
                            {bb.technician}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {bb.faulty > 0 ? (
                            <Badge variant="destructive" className="font-semibold text-xs px-2.5">
                              {bb.faulty}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => {
                              setSelectedBranchFilter(String(bb.branchId))
                              setActiveTab("items")
                              setItemsPage(1)
                            }}
                          >
                            View Devices
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls for Branch Table */}
            {filteredBranches.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-16 text-xs bg-background">
                      <SelectValue placeholder={String(pageSize)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredBranches.length)} to{" "}
                    {Math.min(currentPage * pageSize, filteredBranches.length)} of {filteredBranches.length} branches
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    title="First Page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 font-medium text-foreground">
                    Page {currentPage} of {totalBranchPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalBranchPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalBranchPages, p + 1))}
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalBranchPages}
                    onClick={() => setCurrentPage(totalBranchPages)}
                    title="Last Page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Individual Devices Detailed Table */}
          <TabsContent value="items" className="space-y-4 m-0">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Serial Number / ID</TableHead>
                    <TableHead>Model / Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-sm">Loading devices...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-sm">No matching {selectedType} devices found</p>
                        <p className="text-xs mt-0.5">Try resetting the branch filter or search term</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold">
                          {item.serialNumber || `#${item.id}`}
                          {item.macAddress && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              MAC: {item.macAddress}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{item.name || item.model || selectedType}</div>
                          {item.model && item.name && (
                            <div className="text-xs text-muted-foreground">{item.model}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {item.branch?.name || "Head Office / Unassigned"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              item.status === "IN_STOCK" ? "outline" :
                              item.status === "ASSIGNED_TO_CUSTOMER" ? "default" :
                              item.status === "FAULTY" ? "destructive" : "secondary"
                            }
                            className="text-[11px]"
                          >
                            {(item.status || "UNKNOWN").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.customer ? (
                            <span className="text-purple-700 dark:text-purple-300 font-medium">
                              Customer: {item.customer.name || item.customer.customerUniqueId}
                            </span>
                          ) : item.user ? (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              Staff: {item.user.name}
                            </span>
                          ) : item.branch ? (
                            <span className="text-blue-700 dark:text-blue-300 font-medium">
                              Branch Stock
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">None (In Stock)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={item.condition === "Faulty" ? "text-rose-600 font-semibold" : ""}>
                            {item.condition || "Good"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination for Items Table */}
            {filteredTypeItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <Select
                    value={String(itemsPageSize)}
                    onValueChange={(val) => {
                      setItemsPageSize(Number(val))
                      setItemsPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-16 text-xs bg-background">
                      <SelectValue placeholder={String(itemsPageSize)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>
                    Showing {Math.min((itemsPage - 1) * itemsPageSize + 1, filteredTypeItems.length)} to{" "}
                    {Math.min(itemsPage * itemsPageSize, filteredTypeItems.length)} of {filteredTypeItems.length} devices
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={itemsPage === 1}
                    onClick={() => setItemsPage(1)}
                    title="First Page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={itemsPage === 1}
                    onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 font-medium text-foreground">
                    Page {itemsPage} of {totalItemPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={itemsPage >= totalItemPages}
                    onClick={() => setItemsPage((p) => Math.min(totalItemPages, p + 1))}
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={itemsPage >= totalItemPages}
                    onClick={() => setItemsPage(totalItemPages)}
                    title="Last Page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default function BranchQuantitiesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    }>
      <BranchQuantitiesContent />
    </Suspense>
  )
}
