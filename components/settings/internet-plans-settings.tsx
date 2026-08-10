"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Pencil, Trash2, Save, X, Zap, Download, Upload, Infinity, RefreshCw, PlusCircle, MinusCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { apiRequest } from "@/lib/api"

export type InternetPlan = {
  id: string
  name: string
  code: string
  connectionType: number
  downloadSpeed: number
  uploadSpeed: number
  intUpload: number
  firDownload: number
  localUpload: number
  localDownload: number
  dataLimit: number
  price: number
  isPopular: boolean
  description: string
  deviceLimit?: number
  nasType: string
  service: string
  priority: string
  vendorProfiles: { vendor: string; profile: string }[]
  packageType: string
  allowRename: boolean
  fupApply: boolean
  fupLimitGb: number
  fupPenaltyPlanId: number
  isFupPackage: boolean
  onlyRenewal: boolean
  applyFramedPool: boolean
  framedPoolValue: string
  customRadiusAttributes: { attribute: string; op: string; value: string }[]
  maxDiscountPercentage: number
  maxDiscountCount: number
  highPriority: boolean
  branchIds: number[]
  resellerIds: number[]
}

export type ISPType = {
  id: number
  name: string
  code: string
  description: string
  icon: string
  isEnabled: boolean
  isExtra: boolean
}

type BranchItem = {
  id: number
  name: string
  code: string
}

type ResellerItem = {
  id: number
  name: string
  code: string
}

type RadiusPool = {
  name: string
  value: string
  description?: string
  isActive?: boolean
}

const NAS_TYPES = ["cisco", "juniper", "mikrotik", "nokia"]
const PACKAGE_TYPES = ["HOME", "BUSINESS", "CORPORATE", "ENTERPRISE", "STUDENT", "TRIAL"]
const OP_OPTIONS = [":=", "=", "==", "+=", "!=", ">", ">=", "<", "<=", "=~", "!~", "=*", "!*"]

const DEFAULT_VENDOR_PROFILE: Record<string, string> = {
  juniper: "x-ppp-profile",
  nokia: "",
}

const DEFAULT_PLAN: Omit<InternetPlan, "id"> = {
  name: "",
  code: "",
  connectionType: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  intUpload: 0,
  firDownload: 0,
  localUpload: 0,
  localDownload: 0,
  dataLimit: 0,
  price: 0,
  isPopular: false,
  description: "",
  deviceLimit: 1,
  nasType: "",
  service: "",
  priority: "",
  vendorProfiles: [],
  packageType: "",
  allowRename: false,
  fupApply: true,
  fupLimitGb: 0,
  fupPenaltyPlanId: 0,
  isFupPackage: false,
  onlyRenewal: false,
  applyFramedPool: false,
  framedPoolValue: "",
  customRadiusAttributes: [],
  maxDiscountPercentage: 100,
  maxDiscountCount: 0,
  highPriority: false,
  branchIds: [],
  resellerIds: [],
}

export function InternetPlansSettings() {
  const [ispTypes, setIspTypes] = useState<ISPType[]>([])
  const [internetPlans, setInternetPlans] = useState<InternetPlan[]>([])
  const [branches, setBranches] = useState<BranchItem[]>([])
  const [resellers, setResellers] = useState<ResellerItem[]>([])
  const [radiusPools, setRadiusPools] = useState<RadiusPool[]>([])
  const [ispInfo, setIspInfo] = useState<{ id: number; companyName: string } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPlan, setNewPlan] = useState(DEFAULT_PLAN)
  const [isResyncing, setIsResyncing] = useState(false)

  // Load ISP types
  useEffect(() => {
    async function loadTypes() {
      try {
        const raw = await apiRequest("/connection")
        if (!Array.isArray(raw)) throw new Error("Expected array from API")
        const mapped: ISPType[] = raw.map((r: any) => ({
          id: Number(r.id),
          name: r.name,
          code: r.code,
          description: r.description ?? "",
          icon: r.iconUrl ?? "",
          isEnabled: Boolean(r.isActive),
          isExtra: Boolean(r.isExtra),
        }))
        setIspTypes(mapped)
      } catch (err) {
        console.error("Failed to load ISP types", err)
        setIspTypes([])
      }
    }
    loadTypes()
  }, [])

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const raw = await apiRequest("/branches")
        if (Array.isArray(raw)) {
          setBranches(raw.map((b: any) => ({ id: b.id, name: b.name, code: b.code })))
        }
      } catch (err) {
        console.error("Failed to load branches", err)
      }
    }
    loadBranches()
  }, [])

  useEffect(() => {
    async function loadResellers() {
      try {
        const response = await apiRequest<{ success: boolean; data: ResellerItem[] }>("/resellers?limit=100")
        setResellers(Array.isArray(response?.data) ? response.data : [])
      } catch {
        setResellers([])
      }
    }
    loadResellers()
  }, [])

  // Load ISP info
  useEffect(() => {
    async function loadIsp() {
      try {
        const raw = await apiRequest("/isp/active")
        if (raw?.data) {
          setIspInfo({ id: raw.data.id, companyName: raw.data.companyName })
        }
      } catch (err) {
        console.error("Failed to load ISP info", err)
      }
    }
    loadIsp()
  }, [])

  useEffect(() => {
    async function loadPools() {
      try {
        const response = await apiRequest<{ success: boolean; data: RadiusPool[] }>("/settings/radius-pools")
        setRadiusPools(Array.isArray(response?.data) ? response.data.filter(pool => pool.isActive !== false) : [])
      } catch (err) {
        console.error("Failed to load RADIUS pools", err)
        setRadiusPools([])
      }
    }
    loadPools()
  }, [])

  const ISP_TYPE_OPTIONS: Option[] = ispTypes.map((t) => ({
    value: String(t.id),
    label: t.name,
  }))

  const pkgplans = async () => {
    try {
      const raw = await apiRequest("/pkgplan")
      if (!Array.isArray(raw)) throw new Error("Expected array from API.")
      const mapped: InternetPlan[] = raw.map((r: any) => ({
        id: String(r.id),
        name: r.planName,
        code: r.planCode,
        connectionType: Number(r.connectionTypeDetails?.id ?? r.connectionType ?? 0),
        downloadSpeed: Number(r.downSpeed ?? 0),
        uploadSpeed: Number(r.upSpeed ?? 0),
        intUpload: Number(r.intUpload ?? 0),
        firDownload: Number(r.firDownload ?? 0),
        localUpload: Number(r.localUpload ?? 0),
        localDownload: Number(r.localDownload ?? 0),
        dataLimit: Number(r.dataLimit ?? 0),
        price: Number(r.price ?? 0),
        isPopular: Boolean(r.isPopular),
        description: String(r.description ?? ""),
        deviceLimit: Number(r.deviceLimit ?? r.numDevices ?? 1),
        nasType: r.nasType || "",
        service: r.service || "",
        priority: r.priority || "",
        vendorProfiles: Array.isArray(r.vendorProfiles) ? r.vendorProfiles : [],
        packageType: r.packageType || "",
        allowRename: Boolean(r.allowRename),
        fupApply: r.fupApply !== undefined ? Boolean(r.fupApply) : true,
        fupLimitGb: Number(r.fupLimitGb ?? 0),
        fupPenaltyPlanId: Number(r.fupPenaltyPlanId ?? 0),
        isFupPackage: Boolean(r.isFupPackage),
        onlyRenewal: Boolean(r.onlyRenewal),
        applyFramedPool: Boolean(r.applyFramedPool),
        framedPoolValue: r.framedPoolValue || "",
        customRadiusAttributes: Array.isArray(r.customRadiusAttributes) ? r.customRadiusAttributes : [],
        maxDiscountPercentage: Number(r.maxDiscountPercentage ?? 100),
        maxDiscountCount: Number(r.maxDiscountCount ?? 0),
        highPriority: Boolean(r.highPriority),
        branchIds: Array.isArray(r.branches) ? r.branches.map((b: any) => b.branchId || b.branch?.id) : [],
        resellerIds: Array.isArray(r.resellers) ? r.resellers.map((item: any) => item.resellerId || item.reseller?.id) : [],
      }))
      setInternetPlans(mapped)
    } catch (err) {
      console.error("Failed to load package plans", err)
      setInternetPlans([])
    }
  }

  useEffect(() => {
    pkgplans()
  }, [])

  const resetForm = () => setNewPlan(DEFAULT_PLAN)

  const validateForm = () => {
    if (!newPlan.name || !newPlan.code || !newPlan.connectionType) {
      toast.error("Name, code, and Connection Type are required")
      return false
    }
    return true
  }

  const buildPayload = () => ({
    planName: newPlan.name,
    planCode: newPlan.code,
    connectionType: newPlan.connectionType,
    dataLimit: newPlan.dataLimit,
    downSpeed: newPlan.downloadSpeed,
    upSpeed: newPlan.uploadSpeed,
    intUpload: newPlan.intUpload || null,
    firDownload: newPlan.firDownload || null,
    localUpload: newPlan.localUpload || null,
    localDownload: newPlan.localDownload || null,
    isPopular: newPlan.isPopular,
    description: newPlan.description,
    deviceLimit: Number(newPlan.deviceLimit ?? 1),
    nasType: newPlan.nasType || null,
    service: newPlan.service || null,
    priority: newPlan.priority || null,
    vendorProfiles: (newPlan.vendorProfiles || []).filter(v => v.vendor && v.profile),
    packageType: newPlan.packageType || null,
    allowRename: newPlan.allowRename,
    fupApply: newPlan.fupApply,
    fupLimitGb: newPlan.fupApply && !newPlan.isFupPackage ? newPlan.fupLimitGb || null : null,
    fupPenaltyPlanId: newPlan.fupApply && !newPlan.isFupPackage ? newPlan.fupPenaltyPlanId || null : null,
    isFupPackage: newPlan.isFupPackage,
    onlyRenewal: newPlan.onlyRenewal,
    applyFramedPool: newPlan.applyFramedPool,
    framedPoolValue: newPlan.framedPoolValue || null,
    customRadiusAttributes: newPlan.customRadiusAttributes.filter(a => a.attribute && a.op && a.value),
    maxDiscountPercentage: newPlan.maxDiscountPercentage,
    maxDiscountCount: newPlan.maxDiscountCount,
    highPriority: newPlan.highPriority,
    branchIds: newPlan.branchIds,
    resellerIds: newPlan.resellerIds,
  })

  const handleAdd = async () => {
    if (!validateForm()) return
    try {
      await apiRequest("/pkgplan", { method: 'POST', body: JSON.stringify(buildPayload()) })
      toast.success("Internet plan added successfully")
      resetForm()
      setIsAdding(false)
      pkgplans()
    } catch (err: any) {
      console.error("Failed to add internet plan:", err)
      toast.error(err.message || "Failed to add internet plan. Please try again.")
    }
  }

  const handleEdit = (id: string) => {
    const plan = internetPlans.find((p) => p.id === id)
    if (!plan) return
    setNewPlan({ ...plan })
    setEditingId(id)
    setIsAdding(true)
  }

  const handleUpdate = async () => {
    if (!editingId || !validateForm()) return
    try {
      await apiRequest(`/pkgplan/${editingId}`, { method: 'PUT', body: JSON.stringify(buildPayload()) })
      toast.success("Internet plan updated successfully")
      resetForm()
      setEditingId(null)
      setIsAdding(false)
      pkgplans()
    } catch (err) {
      console.error("Failed to update internet plan:", err)
      toast.error("Failed to update internet plan. Please try again.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/pkgplan/${id}`, { method: 'DELETE' })
      toast.success("Internet plan deleted successfully")
      pkgplans()
    } catch (err) {
      console.error("Failed to delete internet plan:", err)
      toast.error("Failed to delete internet plan. Please try again.")
    }
  }

  const handleCancel = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(false)
  }

  const formatDataLimit = (limit: number | string) => {
    const num = typeof limit === "string" ? parseInt(limit, 10) : limit
    return num === 0 ? "Unlimited" : `${num}`
  }

  const selectedType = useMemo(() => {
    return ispTypes.find((t) => t.id === newPlan.connectionType)
  }, [ispTypes, newPlan.connectionType])

  const fupPenaltyPlanOptions: Option[] = internetPlans
    .filter((plan) => plan.isFupPackage && plan.id !== editingId)
    .map((plan) => ({
      value: plan.id,
      label: `${plan.name} (${plan.downloadSpeed}/${plan.uploadSpeed} Mbps)`,
    }))

  const framedPoolOptions: Option[] = radiusPools.map((pool) => ({
    value: pool.value,
    label: `${pool.name || pool.value} (${pool.value})`,
    description: pool.description,
  }))

  // NAS Type checkbox toggle
  const toggleNasType = (type: string) => {
    const current = newPlan.nasType ? newPlan.nasType.split(",").filter(Boolean) : []
    const isRemoving = current.includes(type)
    const updated = isRemoving
      ? current.filter((t) => t !== type)
      : [...current, type]

    let vendorProfiles = newPlan.vendorProfiles || []
    if (isRemoving) {
      vendorProfiles = vendorProfiles.filter(v => v.vendor !== type)
    } else if (type === "juniper" || type === "nokia") {
      const defaultProfile = type === "nokia"
        ? newPlan.code || `pkg-${newPlan.downloadSpeed || 0}mbps`
        : DEFAULT_VENDOR_PROFILE[type]
      const exists = vendorProfiles.some(v => v.vendor === type)
      if (!exists) vendorProfiles = [...vendorProfiles, { vendor: type, profile: defaultProfile }]
    }

    setNewPlan({ ...newPlan, nasType: updated.join(","), vendorProfiles })
  }

  // Branch checkbox toggle
  const toggleBranch = (branchId: number) => {
    const updated = newPlan.branchIds.includes(branchId)
      ? newPlan.branchIds.filter((id) => id !== branchId)
      : [...newPlan.branchIds, branchId]
    setNewPlan({ ...newPlan, branchIds: updated })
  }

  const toggleReseller = (resellerId: number) => {
    const updated = newPlan.resellerIds.includes(resellerId)
      ? newPlan.resellerIds.filter((id) => id !== resellerId)
      : [...newPlan.resellerIds, resellerId]
    setNewPlan({ ...newPlan, resellerIds: updated })
  }

  // Custom Radius Attributes
  const addCustomAttr = () => {
    setNewPlan({
      ...newPlan,
      customRadiusAttributes: [...newPlan.customRadiusAttributes, { attribute: "", op: ":=", value: "" }],
    })
  }
  const removeCustomAttr = (index: number) => {
    const updated = newPlan.customRadiusAttributes.filter((_, i) => i !== index)
    setNewPlan({ ...newPlan, customRadiusAttributes: updated })
  }
  const updateCustomAttr = (index: number, field: string, value: string) => {
    const updated = newPlan.customRadiusAttributes.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    )
    setNewPlan({ ...newPlan, customRadiusAttributes: updated })
  }

  // Vendor Profiles
  const addVendorProfile = () => {
    setNewPlan({
      ...newPlan,
      vendorProfiles: [...(newPlan.vendorProfiles || []), { vendor: "juniper", profile: "" }],
    })
  }
  const removeVendorProfile = (index: number) => {
    const updated = (newPlan.vendorProfiles || []).filter((_, i) => i !== index)
    setNewPlan({ ...newPlan, vendorProfiles: updated })
  }
  const updateVendorProfile = (index: number, field: string, value: string) => {
    const updated = (newPlan.vendorProfiles || []).map((vp, i) =>
      i === index ? { ...vp, [field]: value } : vp
    )
    setNewPlan({ ...newPlan, vendorProfiles: updated })
  }

  // --- RESYNC FUNCTION ---
  const handleResync = async () => {
    try {
      setIsResyncing(true)
      const res = await apiRequest("/pkgplan/resync", { method: "POST" })
      toast.success(res?.message || "Plans resynced successfully from DB & RADIUS server")
      pkgplans()
    } catch (err: any) {
      console.error("Resync failed:", err)
      toast.error(err?.message || "Failed to resync plans")
    } finally {
      setIsResyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Internet Plan
          </Button>
        )}
        <Button
          onClick={handleResync}
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
          disabled={isResyncing}
        >
          <RefreshCw className="mr-2 h-4 w-4 animate-spin-slow" /> {isResyncing ? "Resyncing..." : "Resync Plans"}
        </Button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-card border rounded-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? "Edit Internet Plan" : "Add New Internet Plan"}
          </h3>

          {/* ===== ROW 1: Service & NAS Type ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Input
                id="service"
                value={newPlan.service}
                onChange={(e) => setNewPlan({ ...newPlan, service: e.target.value })}
                placeholder="e.g., Internet"
              />
            </div>
            <div className="space-y-2">
              <Label>NAS Type</Label>
              <div className="flex gap-4 pt-2">
                {NAS_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer capitalize">
                    <input
                      type="checkbox"
                      checked={(newPlan.nasType || "").split(",").includes(type)}
                      onChange={() => toggleNasType(type)}
                      className="rounded border-gray-300"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ===== ROW 2: Priority ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                value={newPlan.priority}
                onChange={(e) => setNewPlan({ ...newPlan, priority: e.target.value })}
                placeholder="e.g., 1"
              />
            </div>
          </div>

          {/* ===== ROW 3: Package Type ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="packageType">Package Type</Label>
              <SearchableSelect
                options={PACKAGE_TYPES.map(t => ({ value: t, label: t }))}
                value={newPlan.packageType}
                onValueChange={(v) => setNewPlan({ ...newPlan, packageType: Array.isArray(v) ? v[0] || "" : v })}
                placeholder="Select Package Type"
              />
            </div>
          </div>

          {/* ===== ROW 4: Plan Name & Plan Code ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="e.g., Basic Fiber"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Plan Code</Label>
              <Input
                id="code"
                value={newPlan.code}
                onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })}
                placeholder="e.g., FIBER-BASIC"
              />
            </div>
          </div>

          {/* ===== ROW 5: Connection Type & Data Limit ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="connectionType">Connection Type</Label>
              <SearchableSelect
                options={ISP_TYPE_OPTIONS}
                value={String(newPlan.connectionType)}
                onValueChange={(v) =>
                  setNewPlan({ ...newPlan, connectionType: Number(Array.isArray(v) ? v[0] : v) })
                }
                placeholder="Select Connection Type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataLimit">Data Limit (0 for unlimited)</Label>
              <div className="relative">
                <Input
                  id="dataLimit"
                  type="number"
                  value={String(newPlan.dataLimit)}
                  onChange={(e) => setNewPlan({ ...newPlan, dataLimit: +e.target.value || 0 })}
                  placeholder="e.g., 500"
                  className="pl-9"
                />
                <Infinity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Number of Devices for Extra types */}
          {selectedType?.isExtra && (
            <div className="space-y-2 mb-4">
              <Label htmlFor="deviceLimit">Number of Devices</Label>
              <Input
                id="deviceLimit"
                type="number"
                min={1}
                value={String(newPlan.deviceLimit ?? 1)}
                onChange={(e) => setNewPlan({ ...newPlan, deviceLimit: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          )}

          {/* ===== ROW 6: All Speed Fields ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="downloadSpeed">Download Speed (Mbps)</Label>
              <div className="relative">
                <Input
                  id="downloadSpeed"
                  type="number"
                  value={String(newPlan.downloadSpeed)}
                  onChange={(e) => setNewPlan({ ...newPlan, downloadSpeed: +e.target.value || 0 })}
                  placeholder="e.g., 100"
                  className="pl-9"
                />
                <Download className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadSpeed">Upload Speed (Mbps)</Label>
              <div className="relative">
                <Input
                  id="uploadSpeed"
                  type="number"
                  value={String(newPlan.uploadSpeed)}
                  onChange={(e) => setNewPlan({ ...newPlan, uploadSpeed: +e.target.value || 0 })}
                  placeholder="e.g., 20"
                  className="pl-9"
                />
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intUpload">INT Upload</Label>
              <Input
                id="intUpload"
                type="number"
                value={String(newPlan.intUpload)}
                onChange={(e) => setNewPlan({ ...newPlan, intUpload: +e.target.value || 0 })}
                placeholder="INT Upload"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firDownload">FIR Download</Label>
              <Input
                id="firDownload"
                type="number"
                value={String(newPlan.firDownload)}
                onChange={(e) => setNewPlan({ ...newPlan, firDownload: +e.target.value || 0 })}
                placeholder="FIR Download"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localUpload">Local Upload</Label>
              <Input
                id="localUpload"
                type="number"
                value={String(newPlan.localUpload)}
                onChange={(e) => setNewPlan({ ...newPlan, localUpload: +e.target.value || 0 })}
                placeholder="Local Upload"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localDownload">Local Download</Label>
              <Input
                id="localDownload"
                type="number"
                value={String(newPlan.localDownload)}
                onChange={(e) => setNewPlan({ ...newPlan, localDownload: +e.target.value || 0 })}
                placeholder="Local Download"
              />
            </div>
          </div>

          {/* ===== Organization (Branches) ===== */}
          <div className="space-y-2 mb-4">
            <Label>Organization</Label>
            <div className="border rounded-md p-3 bg-muted/30">
              <div className="flex flex-wrap gap-3">
                {/* ISP as organization */}
                {ispInfo && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm bg-background px-3 py-1.5 rounded-md border">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="rounded border-gray-300"
                    />
                    <span className="font-medium">{ispInfo.companyName}</span>
                    <span className="text-xs text-muted-foreground">(ISP)</span>
                  </label>
                )}
                {/* Branches */}
                {branches.map((branch) => (
                  <label key={branch.id} className="flex items-center gap-2 cursor-pointer text-sm bg-background px-3 py-1.5 rounded-md border hover:bg-accent transition-colors">
                    <input
                      type="checkbox"
                      checked={newPlan.branchIds.includes(branch.id)}
                      onChange={() => toggleBranch(branch.id)}
                      className="rounded border-gray-300"
                    />
                    <span>{branch.name}</span>
                    <span className="text-xs text-muted-foreground">({branch.code})</span>
                  </label>
                ))}
                {resellers.map((reseller) => (
                  <label key={`reseller-${reseller.id}`} className="flex items-center gap-2 cursor-pointer text-sm bg-background px-3 py-1.5 rounded-md border hover:bg-accent transition-colors">
                    <input
                      type="checkbox"
                      checked={newPlan.resellerIds.includes(reseller.id)}
                      onChange={() => toggleReseller(reseller.id)}
                      className="rounded border-gray-300"
                    />
                    <span>{reseller.name}</span>
                    <span className="text-xs text-muted-foreground">({reseller.code}, Reseller)</span>
                  </label>
                ))}
                {branches.length === 0 && !ispInfo && (
                  <span className="text-sm text-muted-foreground">No branches available</span>
                )}
              </div>
            </div>
          </div>

          {/* ===== Toggle Switches Row ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allowRename"
                checked={newPlan.allowRename}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, allowRename: c })}
              />
              <Label htmlFor="allowRename" className="text-sm">Allow Rename</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="fupApply"
                checked={newPlan.fupApply}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, fupApply: c })}
              />
              <Label htmlFor="fupApply" className="text-sm">FUP Apply</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isFupPackage"
                checked={newPlan.isFupPackage}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, isFupPackage: c })}
              />
              <Label htmlFor="isFupPackage" className="text-sm">Is FUP Package</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="onlyRenewal"
                checked={newPlan.onlyRenewal}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, onlyRenewal: c })}
              />
              <Label htmlFor="onlyRenewal" className="text-sm">Only Renewal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPopular"
                checked={newPlan.isPopular}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, isPopular: c })}
              />
              <Label htmlFor="isPopular" className="text-sm">Popular</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="highPriority"
                checked={newPlan.highPriority}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, highPriority: c })}
              />
              <Label htmlFor="highPriority" className="text-sm">High Priority</Label>
            </div>
          </div>

          {newPlan.fupApply && !newPlan.isFupPackage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="fupLimitGb">FUP Limit (GB)</Label>
                <Input
                  id="fupLimitGb"
                  type="number"
                  min={0}
                  value={String(newPlan.fupLimitGb)}
                  onChange={(e) => setNewPlan({ ...newPlan, fupLimitGb: +e.target.value || 0 })}
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fupPenaltyPlanId">FUP Penalty Plan</Label>
                <SearchableSelect
                  options={fupPenaltyPlanOptions}
                  value={newPlan.fupPenaltyPlanId ? String(newPlan.fupPenaltyPlanId) : ""}
                  onValueChange={(v) => setNewPlan({ ...newPlan, fupPenaltyPlanId: Number(Array.isArray(v) ? v[0] : v) || 0 })}
                  placeholder="Select FUP Package"
                />
              </div>
            </div>
          )}

          {/* ===== Framed Pool ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="applyFramedPool"
                checked={newPlan.applyFramedPool}
                onCheckedChange={(c) => setNewPlan({ ...newPlan, applyFramedPool: c })}
              />
              <Label htmlFor="applyFramedPool">Apply Framed Pool</Label>
            </div>
            {newPlan.applyFramedPool && (
              <div className="space-y-2">
                <Label htmlFor="framedPoolValue">Framed Pool Value</Label>
                <SearchableSelect
                  options={framedPoolOptions}
                  value={newPlan.framedPoolValue}
                  onValueChange={(v) => setNewPlan({ ...newPlan, framedPoolValue: Array.isArray(v) ? v[0] || "" : v })}
                  placeholder={framedPoolOptions.length > 0 ? "Choose framed pool" : "Create pools in RADIUS Pools settings"}
                />
                <p className="text-xs text-muted-foreground">Saved value is the pool value string, not an internal ID.</p>
              </div>
            )}
          </div>

          {/* ===== Vendor-Specific Profiles ===== */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Vendor-Specific Profiles</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVendorProfile}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Vendor Profile
              </Button>
            </div>
            {newPlan.vendorProfiles && newPlan.vendorProfiles.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[150px_1fr_40px] gap-2 px-3 py-2 bg-muted text-sm font-medium">
                  <span>Vendor</span>
                  <span>Profile Name / Variable</span>
                  <span></span>
                </div>
                <div className="divide-y">
                  {newPlan.vendorProfiles.map((vp, index) => (
                    <div key={index} className="grid grid-cols-[150px_1fr_40px] gap-2 p-2 items-center">
                      <SearchableSelect
                        options={NAS_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))}
                        value={vp.vendor}
                        onValueChange={(v) => updateVendorProfile(index, "vendor", Array.isArray(v) ? v[0] || "" : v)}
                        placeholder="Select Vendor"
                      />
                      <Input
                        value={vp.profile}
                        onChange={(e) => updateVendorProfile(index, "profile", e.target.value)}
                        placeholder={vp.vendor === "juniper" ? "x-ppp-profile" : vp.vendor === "nokia" ? "SLA profile, e.g. KSN-75-IPTV" : "Profile name"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 h-8 w-8"
                        onClick={() => removeVendorProfile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== Description ===== */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* ===== Custom Radius Attributes ===== */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Custom Radius Attributes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCustomAttr}>
                <PlusCircle className="mr-1 h-4 w-4" /> Add Attribute
              </Button>
            </div>
            {newPlan.customRadiusAttributes.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_1fr_40px] gap-2 px-3 py-2 bg-muted text-sm font-medium">
                  <span>Attribute</span>
                  <span>Operator</span>
                  <span>Value</span>
                  <span></span>
                </div>
                {newPlan.customRadiusAttributes.map((attr, index) => (
                  <div key={index} className="grid grid-cols-[1fr_100px_1fr_40px] gap-2 px-3 py-2 border-t">
                    <Input
                      value={attr.attribute}
                      onChange={(e) => updateCustomAttr(index, "attribute", e.target.value)}
                      placeholder="e.g., WISPr-Bandwidth-Max-Down"
                      className="h-9"
                    />
                    <select
                      value={attr.op}
                      onChange={(e) => updateCustomAttr(index, "op", e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {OP_OPTIONS.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <Input
                      value={attr.value}
                      onChange={(e) => updateCustomAttr(index, "value", e.target.value)}
                      placeholder="Value"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomAttr(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive/90"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {newPlan.customRadiusAttributes.length === 0 && (
              <p className="text-sm text-muted-foreground">No custom attributes added. Click &quot;Add Attribute&quot; to add RADIUS reply attributes.</p>
            )}
          </div>

          {/* ===== Discount Settings ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="maxDiscountPercentage">Max Discount Percentage (%)</Label>
              <Input
                id="maxDiscountPercentage"
                type="number"
                min={0}
                max={100}
                value={String(newPlan.maxDiscountPercentage)}
                onChange={(e) => setNewPlan({ ...newPlan, maxDiscountPercentage: +e.target.value || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiscountCount">Max Discount Count Per Month</Label>
              <Input
                id="maxDiscountCount"
                type="number"
                min={0}
                value={String(newPlan.maxDiscountCount)}
                onChange={(e) => setNewPlan({ ...newPlan, maxDiscountCount: +e.target.value || 0 })}
              />
            </div>
          </div>

          {/* ===== Actions ===== */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={editingId ? handleUpdate : handleAdd}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" /> {editingId ? "Update" : "Add"} Internet Plan
            </Button>
          </div>
        </div>
      )}

      {/* Plans Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[150px]">Connection</TableHead>
                <TableHead className="w-[150px]">Speed</TableHead>
                <TableHead className="w-[100px]">Data Limit</TableHead>
                <TableHead className="w-[120px]">Organizations</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {internetPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No internet plans found. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                internetPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.code}</span>
                        {plan.packageType && (
                          <span className="text-xs mt-0.5 inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded w-fit">{plan.packageType}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{plan.nasType || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {ispTypes.find(t => t.id === plan.connectionType)?.name || "(unknown)"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-1 text-amber-500" />
                        <span>{plan.downloadSpeed}/{plan.uploadSpeed} Mbps</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDataLimit(plan.dataLimit)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {plan.branchIds.length > 0 || plan.resellerIds.length > 0
                          ? [
                              ...plan.branchIds.map(bid => branches.find(b => b.id === bid)?.name || bid),
                              ...plan.resellerIds.map(rid => `${resellers.find(r => r.id === rid)?.name || rid} (Reseller)`)
                            ].join(", ")
                          : "All"
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(plan.id)} className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} className="h-8 w-8 text-destructive hover:text-destructive/90">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
