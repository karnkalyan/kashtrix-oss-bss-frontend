"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, Eye, Info, KeyRound, Loader2, MapPin, Package, Plus, RefreshCw, Repeat, Save, Search, Trash2, Tv, UserCheck, Users, Wrench, AlertTriangle } from "lucide-react"
import { ServicesAPI } from "@/lib/api/service"
import { apiRequest } from "@/lib/api"
import { NetTVDialog } from "@/components/customers/add-customer-form"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDateInput } from "@/components/ui/calendar-date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"
import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(() => import("@/components/maps/safe-map-container").then(mod => mod.SafeMapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false })

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.subscribers)) return payload.subscribers
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const getTotalPages = (payload: any, fallbackItems: any[], perPage: number) => {
  const totalPages = payload?.last_page || payload?.totalPages || payload?.pagination?.totalPages || payload?.meta?.last_page
  if (Number(totalPages) > 0) return Number(totalPages)
  const total = payload?.total || payload?.pagination?.total || payload?.meta?.total
  if (Number(total) > 0) return Math.ceil(Number(total) / perPage)
  return fallbackItems.length >= perPage ? 2 : 1
}

const valueOf = (item: any, keys: string[], fallback = "N/A") => {
  for (const key of keys) {
    const value = item?.[key]
    if (value !== undefined && value !== null && value !== "") return String(value)
  }
  return fallback
}

const numberOf = (value: any) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatBoolean = (value: any) => {
  if (value === true || value === 1 || value === "1") return "Yes"
  if (value === false || value === 0 || value === "0") return "No"
  return "N/A"
}

const firstDefined = (...values: any[]) => values.find(value => value !== undefined && value !== null && value !== "")

const toInputValue = (value: any) => {
  if (value === undefined || value === null) return ""
  return String(value)
}

const fullName = (item: any) => {
  const details = item?.details || {}
  const joined = [item?.fname || details.fname, item?.mname || details.mname, item?.lname || details.lname].filter(Boolean).join(" ")
  return item?.name || item?.full_name || joined || "N/A"
}

const statusVariant = (status: string): "success" | "warning" | "destructive" | "secondary" => {
  const normalized = status.toLowerCase()
  if (normalized === "1" || normalized === "true" || normalized.includes("active") || normalized.includes("enabled")) return "success"
  if (normalized.includes("pending") || normalized.includes("hold")) return "warning"
  if (normalized === "0" || normalized === "false" || normalized.includes("inactive") || normalized.includes("disabled") || normalized.includes("expired")) return "destructive"
  return "secondary"
}

function renderValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return "N/A"
  
  if (typeof value === "boolean") {
    return <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-xs text-muted-foreground">Empty list</span>
    if (typeof value[0] === "object") {
      const columns = Array.from(new Set(value.flatMap((item: any) =>
        Object.keys(item || {}).filter(key => item?.[key] !== null && item?.[key] !== undefined && typeof item?.[key] !== "object")
      ))).slice(0, 8)
      return (
        <div className="mt-1 overflow-auto rounded-md border">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-muted/50">
              <tr>
                {columns.map(column => <th key={column} className="whitespace-nowrap px-2 py-1 font-semibold">{column.replace(/_/g, " ")}</th>)}
              </tr>
            </thead>
            <tbody>
              {value.map((item, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map(column => <td key={column} className="max-w-[220px] truncate px-2 py-1 font-mono">{String(item?.[column] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {value.map((val, idx) => (
          <Badge key={idx} variant="secondary" className="text-[10px]">{String(val)}</Badge>
        ))}
      </div>
    )
  }
  
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && typeof v !== "object")
    if (entries.length === 0) return <span className="text-xs text-muted-foreground">Empty object</span>
    return (
      <div className="grid grid-cols-1 gap-1 border rounded bg-muted/20 p-1.5 mt-1 text-xs">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-border/30 last:border-0 pb-0.5">
            <span className="text-muted-foreground text-[10px] uppercase font-mono">{k.replace(/_/g, " ")}</span>
            <span className="font-mono text-[11px] truncate max-w-[150px]">{String(v)}</span>
          </div>
        ))}
      </div>
    )
  }
  
  return String(value)
}

function DetailsBlock({ title, data }: { title: string; data: any }) {
  const entries = Object.entries(data || {}).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      key !== "password" &&
      typeof value !== "object"
  )
  if (entries.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 border-b border-slate-100 dark:border-slate-800/50 pb-2 text-primary/90">{title}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0 flex flex-col justify-start">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{key.replace(/_/g, " ")}</div>
            <div className="break-words text-sm font-medium mt-0.5 text-slate-800 dark:text-slate-200">
              {renderValue(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailGrid({ title, items }: { title: string; items: Array<{ label: string; value: any }> }) {
  const visibleItems = items.filter(item => item.value !== undefined && item.value !== null && item.value !== "")
  if (!visibleItems.length) return null
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleItems.map(item => (
          <div key={item.label} className="min-w-0 rounded-md bg-muted/30 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-muted-foreground">{item.label}</div>
            <div className="mt-1 break-words text-sm font-medium">{String(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {type === "date"
        ? <CalendarDateInput value={value} onChange={onChange} />
        : <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />}
    </div>
  )
}

function DataTable({ items, columns, emptyText }: { items: any[]; columns: Array<{ key: string; label: string; render?: (item: any) => React.ReactNode }>; emptyText: string }) {
  if (!items?.length) return <p className="py-3 text-sm text-muted-foreground">{emptyText}</p>
  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(column => <TableHead key={column.key}>{column.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item?.id || item?.package_id || item?.serial || index}-${index}`}>
              {columns.map(column => (
                <TableCell key={column.key} className="align-top text-sm">
                  {column.render ? column.render(item) : valueOf(item, [column.key], "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function NettvLocationMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const [icon, setIcon] = useState<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const L = require("leaflet")
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
      iconUrl: "/leaflet/images/marker-icon.png",
      shadowUrl: "/leaflet/images/marker-shadow.png",
    })
    setIcon(new L.Icon({
      iconUrl: "/leaflet/images/marker-icon.png",
      iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
      shadowUrl: "/leaflet/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }))
  }, [])

  if (!icon) return <div className="flex h-[320px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">Loading map...</div>

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="h-[320px] w-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{label}</div>
              <div>Lat: {lat.toFixed(6)}</div>
              <div>Lng: {lng.toFixed(6)}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <style jsx>{`:global(.leaflet-control-attribution) { display: none !important; }`}</style>
    </div>
  )
}

export function NettvDashboard() {
  const router = useRouter()
  const [resellerInfo, setResellerInfo] = useState<any>(null)
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [stbs, setStbs] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [replaceReasons, setReplaceReasons] = useState<any[]>([])
  const [countriesList, setCountriesList] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)

  // Sub-pagination states
  const [packagePage, setPackagePage] = useState(1)
  const [stbPage, setStbPage] = useState(1)
  const subLimit = 10

  const paginatedPackages = useMemo(() => {
    return packages.slice((packagePage - 1) * subLimit, packagePage * subLimit)
  }, [packages, packagePage])
  const totalPackagePages = Math.max(1, Math.ceil(packages.length / subLimit))

  const paginatedStbs = useMemo(() => {
    return stbs.slice((stbPage - 1) * subLimit, stbPage * subLimit)
  }, [stbs, stbPage])
  const totalStbPages = Math.max(1, Math.ceil(stbs.length / subLimit))
  const [selected, setSelected] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [selectedStbSerial, setSelectedStbSerial] = useState("")
  const [selectedPackageSaleId, setSelectedPackageSaleId] = useState("")
  const [packageConfigItems, setPackageConfigItems] = useState<any[]>([])
  const [packageConfigLoading, setPackageConfigLoading] = useState(false)
  const [packageQty, setPackageQty] = useState(1)
  const [paymentGateway, setPaymentGateway] = useState("reseller_wallet")
  const [assigningPackage, setAssigningPackage] = useState(false)
  const [stbLoading, setStbLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creatingSubscriber, setCreatingSubscriber] = useState(false)
  const [rawDetailsOpen, setRawDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ password: "", conf_password: "", reseller_id: "" })
  const [isResellerConfigured, setIsResellerConfigured] = useState(true)
  const [subscriberStbOpen, setSubscriberStbOpen] = useState(false)
  const [subscriberStbSaving, setSubscriberStbSaving] = useState(false)
  const [subscriberStbForm, setSubscriberStbForm] = useState({
    serial: "",
    package_id: "",
    status: "1",
    balance: "",
    expiry_date: "",
    extended_date: "",
  })
  const [removeStbOpen, setRemoveStbOpen] = useState(false)
  const [removeStbSaving, setRemoveStbSaving] = useState(false)
  const [removeStbForm, setRemoveStbForm] = useState({ reason_id: "1", detail: "" })
  const [replaceStbOpen, setReplaceStbOpen] = useState(false)
  const [replaceStbSaving, setReplaceStbSaving] = useState(false)
  const [replaceStbForm, setReplaceStbForm] = useState({ serial: "", reason_id: "1", detail: "" })
  const [cancelPackageOpen, setCancelPackageOpen] = useState(false)
  const [cancelPackageSaving, setCancelPackageSaving] = useState(false)
  const [cancelPackageForm, setCancelPackageForm] = useState({ order_id: "", notes: "", cancel_by: "" })
  const [invoicePaymentId, setInvoicePaymentId] = useState("")
  const [creditNotePaymentId, setCreditNotePaymentId] = useState("")
  const [printLookupLoading, setPrintLookupLoading] = useState<"invoice" | "credit" | null>(null)
  const [printLookupResult, setPrintLookupResult] = useState<any>(null)
  const [printLookupOpen, setPrintLookupOpen] = useState(false)
  const [statusChanging, setStatusChanging] = useState("")
  const [requestedSubscriber, setRequestedSubscriber] = useState("")
  const [linkSubscriber, setLinkSubscriber] = useState<any>(null)
  const [linkCustomers, setLinkCustomers] = useState<any[]>([])
  const [linkCustomerId, setLinkCustomerId] = useState("")
  const [linkSaving, setLinkSaving] = useState(false)

  const openCustomerLink = async (subscriber: any) => {
    setLinkSubscriber(subscriber)
    setLinkCustomerId("")
    try {
      const response: any = await apiRequest("/customer?limit=5000")
      setLinkCustomers(unwrapList(response))
    } catch (error: any) {
      toast.error(error.message || "Failed to load customers")
    }
  }

  const linkCustomer = async () => {
    const username = valueOf(linkSubscriber, ["username", "user_name", "customer_username"], "")
    if (!username || !linkCustomerId) return
    setLinkSaving(true)
    try {
      await ServicesAPI.linkNetTVSubscriberCustomer(username, Number(linkCustomerId))
      toast.success("NetTV subscriber linked to customer")
      setLinkSubscriber(null)
      await fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to link customer")
    } finally {
      setLinkSaving(false)
    }
  }

  const fetchAllNetTVPages = async (fetcher: (page: number, perPage: number) => Promise<{ data: any }>) => {
    const perPage = 100
    const first = await fetcher(1, perPage)
    const firstPayload = first.data
    const firstItems = unwrapList(firstPayload)
    const totalPages = Math.min(getTotalPages(firstPayload, firstItems, perPage), 100)
    if (totalPages <= 1) return firstItems

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => fetcher(index + 2, perPage))
    )
    return [firstItems, ...rest.map(response => unwrapList(response.data))].flat()
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subscriberList, packageRes, stbRes, resellerRes] = await Promise.all([
        fetchAllNetTVPages((page, perPage) => ServicesAPI.getNetTVSubscribers(page, perPage)),
        fetchAllNetTVPages((page, perPage) => ServicesAPI.getNetTVPackages(page, perPage)).catch(() => []),
        fetchAllNetTVPages((page, perPage) => ServicesAPI.getNetTVSTBs(page, perPage)).catch(() => []),
        ServicesAPI.getNetTVResellerInfo().catch(() => null)
      ])
      const [modelRes, vendorRes, reasonRes, countriesRes] = await Promise.all([
        ServicesAPI.getNetTVModels(1, 100).then(response => unwrapList(response.data)).catch(() => []),
        ServicesAPI.getNetTVVendors(1, 100).then(response => unwrapList(response.data)).catch(() => []),
        ServicesAPI.getNetTVMacReplaceReasons().then(response => unwrapList(response.data)).catch(() => []),
        ServicesAPI.getNetTVCountries().then(response => response.data || []).catch(() => []),
      ])
      setSubscribers(subscriberList)
      setPackages(packageRes)
      setStbs(stbRes)
      if (resellerRes && resellerRes.success) {
        setResellerInfo(resellerRes.data)
        setIsResellerConfigured(resellerRes.configured !== false)
      } else {
        setIsResellerConfigured(false)
      }
      setModels(modelRes)
      setVendors(vendorRes)
      setReplaceReasons(reasonRes)
      setCountriesList(countriesRes)
    } catch (error: any) {
      toast.error(error.message || "Failed to load NetTV service data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequestedSubscriber(new URLSearchParams(window.location.search).get("subscriber") || "")
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!requestedSubscriber || loading || selected) return
    const match = subscribers.find(item => valueOf(item, ["username", "user_name", "customer_username"], "") === requestedSubscriber)
    if (match) {
      openDetails(match)
    } else if (requestedSubscriber) {
      setSearch(requestedSubscriber)
    }
  }, [requestedSubscriber, loading, subscribers, selected])

  const filteredSubscribers = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return subscribers
    return subscribers.filter(item =>
      [item?.username, item?.email, item?.mobile, item?.phone, item?.details?.phone_no, item?.details?.mobile_no, fullName(item), item?.package_name, item?.status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    )
  }, [search, subscribers])

  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / limit))
  const paginatedSubscribers = filteredSubscribers.slice((page - 1) * limit, page * limit)
  const activeCount = subscribers.filter(item => statusVariant(valueOf(item, ["status", "state"], "") as string) === "success").length

  const openDetails = async (subscriber: any) => {
    const username = valueOf(subscriber, ["username", "user_name", "customer_username"], "")
    setSelected(subscriber)
    if (!username) return
    setDetailsLoading(true)
    try {
      const response = await ServicesAPI.getNetTVSubscriber(username)
      const details = response.data || subscriber
      setSelected(details)
      setSelectedStbSerial(details?.stbs?.[0]?.serial || "")
    } catch {
      setSelected(subscriber)
    } finally {
      setDetailsLoading(false)
    }
  }

  const refreshSelectedSubscriber = async () => {
    const username = valueOf(selected?.subscriber || selected, ["username", "user_name", "customer_username"], "")
    if (!username) return
    const response = await ServicesAPI.getNetTVSubscriber(username)
    const refreshed = response.data
    setSelected(refreshed)
    const serials = (refreshed?.stbs || []).map((stb: any) => stb.serial)
    setSelectedStbSerial((current) => serials.includes(current) ? current : (serials[0] || ""))
    setSubscribers((current) => current.map((subscriber) =>
      valueOf(subscriber, ["username", "user_name", "customer_username"], "") === username
        ? { ...subscriber, ...(refreshed?.subscriber || {}) }
        : subscriber
    ))
  }

  const createSubscriber = async (payload: any) => {
    setCreatingSubscriber(true)
    try {
      await ServicesAPI.createNetTVSubscriber(payload)
      const response = await ServicesAPI.getNetTVSubscriber(payload.username).catch(() => null)
      const created = response?.data?.subscriber || payload
      setSubscribers((current) => [created, ...current.filter((item) =>
        valueOf(item, ["username", "user_name", "customer_username"], "") !== payload.username
      )])
      setCreateOpen(false)
      toast.success("NetTV subscriber added successfully")
    } catch (error: any) {
      setCreateOpen(true)
      toast.error(error.message || "Failed to add NetTV subscriber")
    } finally {
      setCreatingSubscriber(false)
    }
  }

  const selectedUsername = () => valueOf(selected?.subscriber || selected, ["username", "user_name", "customer_username"], "")

  const buildSubscriberUpdatePayload = (subscriber: any, overrides: Record<string, any> = {}) => {
    const contact = subscriber?.details || {}
    const base = {
      email: subscriber?.email,
      status: subscriber?.status,
      fname: firstDefined(contact?.fname, subscriber?.fname),
      mname: firstDefined(contact?.mname, subscriber?.mname),
      lname: firstDefined(contact?.lname, subscriber?.lname),
      address: contact?.address,
      city: contact?.city,
      district: contact?.district,
      province: firstDefined(contact?.province, contact?.province_info?.id),
      country: firstDefined(contact?.country, contact?.country_info?.id),
      phone_no: contact?.phone_no,
      mobile_no: contact?.mobile_no,
      website: contact?.website,
      longitude: contact?.longitude,
      latitude: contact?.latitude,
      pan: contact?.pan,
      gender: contact?.gender,
      dob: contact?.dob,
      branch: contact?.branch,
      ...overrides,
    }
    return Object.fromEntries(Object.entries(base).filter(([_, value]) => value !== undefined && value !== null && value !== ""))
  }

  const openEditDialog = () => {
    const subscriber = selected?.subscriber || selected || {}
    const contact = subscriber?.details || selected?.details || {}
    setEditForm({
      email: toInputValue(subscriber?.email),
      status: toInputValue(subscriber?.status),
      fname: toInputValue(firstDefined(contact?.fname, subscriber?.fname)),
      mname: toInputValue(firstDefined(contact?.mname, subscriber?.mname)),
      lname: toInputValue(firstDefined(contact?.lname, subscriber?.lname)),
      address: toInputValue(contact?.address),
      city: toInputValue(contact?.city),
      district: toInputValue(contact?.district),
      province: toInputValue(firstDefined(contact?.province, contact?.province_info?.id)),
      country: toInputValue(firstDefined(contact?.country, contact?.country_info?.id)),
      phone_no: toInputValue(contact?.phone_no),
      mobile_no: toInputValue(contact?.mobile_no),
      website: toInputValue(contact?.website),
      longitude: toInputValue(contact?.longitude),
      latitude: toInputValue(contact?.latitude),
      pan: toInputValue(contact?.pan),
      gender: toInputValue(contact?.gender),
      dob: toInputValue(contact?.dob),
      branch: toInputValue(contact?.branch),
    })
    setEditOpen(true)
  }

  const updateEditField = (field: string, value: string) => setEditForm((current) => ({ ...current, [field]: value }))

  const saveSubscriberEdit = async () => {
    const username = selectedUsername()
    if (!username) return
    setSavingEdit(true)
    try {
      const payload = Object.fromEntries(Object.entries(editForm).filter(([key, value]) => key !== "username" && value !== ""))
      await ServicesAPI.updateNetTVSubscriber(username, payload)
      toast.success("NetTV subscriber updated")
      setEditOpen(false)
      await refreshSelectedSubscriber()
    } catch (error: any) {
      toast.error(error.message || "Failed to update NetTV subscriber")
    } finally {
      setSavingEdit(false)
    }
  }

  const changeSubscriberStatus = async (subscriber: any) => {
    const username = valueOf(subscriber, ["username", "user_name", "customer_username"], "")
    if (!username) return
    const currentStatus = String(subscriber?.status ?? "").toLowerCase()
    const nextStatus = currentStatus === "1" || currentStatus === "active" ? "0" : "1"
    setStatusChanging(username)
    try {
      await ServicesAPI.updateNetTVSubscriber(username, buildSubscriberUpdatePayload(subscriber, { status: nextStatus }))
      setSubscribers((current) => current.map((item) =>
        valueOf(item, ["username", "user_name", "customer_username"], "") === username ? { ...item, status: nextStatus } : item
      ))
      toast.success(`NetTV subscriber ${nextStatus === "1" ? "activated" : "deactivated"}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to change NetTV status")
    } finally {
      setStatusChanging("")
    }
  }

  const deleteSubscriber = async () => {
    const username = selectedUsername()
    if (!username || !window.confirm(`Delete NetTV subscriber ${username}?`)) return
    try {
      await ServicesAPI.deleteNetTVSubscriber(username)
      setSubscribers((current) => current.filter((subscriber) => valueOf(subscriber, ["username", "user_name", "customer_username"], "") !== username))
      setSelected(null)
      toast.success("NetTV subscriber deleted")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete NetTV subscriber")
    }
  }

  const forcePassword = async () => {
    const username = selectedUsername()
    if (!username) return
    if (!passwordForm.password || passwordForm.password !== passwordForm.conf_password) {
      toast.error("Password and confirmation must match")
      return
    }
    setPasswordSaving(true)
    try {
      const resellerId = selected?.subscriber?.reseller?.id || selected?.subscriber?.reseller_id || selected?.reseller?.id || 5;
      await ServicesAPI.forceNetTVPassword(username, {
        password: passwordForm.password,
        conf_password: passwordForm.conf_password,
        reseller_id: resellerId,
      })
      toast.success("NetTV password updated")
      setPasswordOpen(false)
      setPasswordForm({ password: "", conf_password: "", reseller_id: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to update NetTV password")
    } finally {
      setPasswordSaving(false)
    }
  }

  const addSubscriberStb = async () => {
    const username = selectedUsername()
    if (!username || !subscriberStbForm.serial) {
      toast.error("STB serial is required")
      return
    }
    setSubscriberStbSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries({ username, ...subscriberStbForm }).filter(([_, value]) => value !== ""))
      await ServicesAPI.addNetTVSubscriberSTB(username, payload)
      toast.success("STB linked to subscriber")
      setSubscriberStbOpen(false)
      setSubscriberStbForm({ serial: "", package_id: "", status: "1", balance: "", expiry_date: "", extended_date: "" })
      await refreshSelectedSubscriber()
    } catch (error: any) {
      toast.error(error.message || "Failed to link STB")
    } finally {
      setSubscriberStbSaving(false)
    }
  }

  const removeSubscriberStb = async () => {
    const username = selectedUsername()
    if (!username || !selectedStbSerial) return
    setRemoveStbSaving(true)
    try {
      await ServicesAPI.removeNetTVSubscriberSTB(username, selectedStbSerial, removeStbForm)
      toast.success("STB removed from subscriber")
      setRemoveStbOpen(false)
      await refreshSelectedSubscriber()
    } catch (error: any) {
      toast.error(error.message || "Failed to remove STB")
    } finally {
      setRemoveStbSaving(false)
    }
  }

  const replaceSubscriberStb = async () => {
    const username = selectedUsername()
    if (!username || !selectedStbSerial || !replaceStbForm.serial) {
      toast.error("Current and replacement STB serials are required")
      return
    }
    setReplaceStbSaving(true)
    try {
      await ServicesAPI.replaceNetTVSubscriberSTB(username, selectedStbSerial, {
        serial: replaceStbForm.serial,
        reason_id: replaceStbForm.reason_id,
        detail: replaceStbForm.detail,
      })
      toast.success("Subscriber STB replaced")
      setReplaceStbOpen(false)
      await refreshSelectedSubscriber()
    } catch (error: any) {
      toast.error(error.message || "Failed to replace STB")
    } finally {
      setReplaceStbSaving(false)
    }
  }

  const cancelSelectedPackage = async () => {
    if (!selectedStbSerial || !cancelPackageForm.order_id) {
      toast.error("Order ID is required")
      return
    }
    setCancelPackageSaving(true)
    try {
      await ServicesAPI.cancelNetTVPackage(selectedStbSerial, {
        order_id: Number(cancelPackageForm.order_id),
        notes: cancelPackageForm.notes,
        cancel_by: cancelPackageForm.cancel_by || selected?.subscriber?.reseller?.username || "admin",
      })
      toast.success("Package order cancelled")
      setCancelPackageOpen(false)
      await refreshSelectedSubscriber()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel package")
    } finally {
      setCancelPackageSaving(false)
    }
  }

  const lookupInvoicePrint = async () => {
    if (!invoicePaymentId.trim()) {
      toast.error("Invoice payment ID is required")
      return
    }
    setPrintLookupLoading("invoice")
    try {
      const response = await ServicesAPI.getNetTVInvoicePrint(invoicePaymentId.trim())
      setPrintLookupResult(response.data)
      setPrintLookupOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to get invoice print")
    } finally {
      setPrintLookupLoading(null)
    }
  }

  const lookupCreditNotePrint = async () => {
    if (!creditNotePaymentId.trim()) {
      toast.error("Credit-note payment ID is required")
      return
    }
    setPrintLookupLoading("credit")
    try {
      const response = await ServicesAPI.getNetTVCreditNotePrint(creditNotePaymentId.trim())
      setPrintLookupResult(response.data)
      setPrintLookupOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to get credit-note print")
    } finally {
      setPrintLookupLoading(null)
    }
  }

  const selectedStb = (selected?.stbs || []).find((stb: any) => stb.serial === selectedStbSerial) || selected?.stbs?.[0] || null
  const packageConfigs = useMemo(() => {
    if (!selectedStb) return []
    const configItems = packageConfigItems.flatMap((pkg: any) =>
      (pkg?.package_for_sale || pkg?.package_config || []).map((config: any) => ({ ...config, package_name: pkg.name, package_id: pkg.id }))
    )
    if (configItems.length) return configItems
    return (selectedStb.package_details || []).flatMap((pkg: any) =>
      (pkg?.package_config || []).map((config: any) => ({ ...config, package_name: pkg.name, package_id: pkg.id }))
    )
  }, [selectedStb, packageConfigItems])

  useEffect(() => {
    if (!selected || !selectedStbSerial) {
      setPackageConfigItems([])
      return
    }
    let cancelled = false
    setPackageConfigLoading(true)
    ServicesAPI.getNetTVPackageConfigs(selectedStbSerial)
      .then(response => {
        if (!cancelled) setPackageConfigItems(unwrapList(response.data))
      })
      .catch(() => {
        if (!cancelled) setPackageConfigItems([])
      })
      .finally(() => {
        if (!cancelled) setPackageConfigLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected, selectedStbSerial])

  const refreshSelectedStb = async () => {
    if (!selectedStbSerial) return
    setStbLoading(true)
    try {
      const response = await ServicesAPI.getNetTVSTB(selectedStbSerial)
      setSelected((prev: any) => ({
        ...prev,
        stbs: (prev?.stbs || []).map((stb: any) => stb.serial === selectedStbSerial ? { ...stb, ...response.data } : stb)
      }))
      toast.success("STB details refreshed")
    } catch (error: any) {
      toast.error(error.message || "Failed to get STB details")
    } finally {
      setStbLoading(false)
    }
  }

  const assignPackage = async () => {
    if (!selectedStbSerial || !selectedPackageSaleId) {
      toast.error("Select an STB and package configuration")
      return
    }
    setAssigningPackage(true)
    try {
      await ServicesAPI.subscribeNetTVPackages(selectedStbSerial, {
        pos: selected?.subscriber?.reseller?.address || "Kisan Net",
        created_by: selected?.subscriber?.reseller?.username || "kisannet",
        payment_gateway: paymentGateway,
        packages: [{ package_sale_id: Number(selectedPackageSaleId), qty: Math.max(1, Number(packageQty)) }],
        send_mail: 0,
      })
      toast.success("NetTV package assigned successfully")
      await refreshSelectedSubscriber()
      setSelectedPackageSaleId("")
    } catch (error: any) {
      toast.error(error.message || "Failed to assign NetTV package")
    } finally {
      setAssigningPackage(false)
    }
  }

  if (selected) {
    const subscriber = selected?.subscriber || selected
    const contact = subscriber?.details || selected?.details || {}
    const reseller = selected?.reseller || subscriber?.reseller || {}
    
    const resolveCountryName = (val: any) => {
      if (!val) return "N/A"
      const num = Number(val)
      if (!isNaN(num) && countriesList.length > 0) {
        const matched = countriesList.find(c => c.id === num)
        if (matched) return matched.name
      }
      return String(val)
    }

    const resolveProvinceName = (val: any) => {
      if (!val) return "N/A"
      const num = Number(val)
      if (!isNaN(num) && countriesList.length > 0) {
        const matched = countriesList.flatMap(c => c.provinces || []).find(p => p.id === num)
        if (matched) return matched.name
      }
      return String(val)
    }

    const countryName = contact?.country_info?.name || contact?.country_name || resolveCountryName(valueOf(contact, ["country"], ""))
    const provinceName = contact?.province_info?.name || contact?.province_name || resolveProvinceName(valueOf(contact, ["province"], ""))
    const latitude = numberOf(contact?.latitude)
    const longitude = numberOf(contact?.longitude)
    const subscriberLabel = fullName(subscriber)

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subscribers
          </Button>
          <h1 className="text-2xl font-bold">NetTV Subscriber Details</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Save className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" /> Password
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRawDetailsOpen(true)}>
              <Info className="mr-2 h-4 w-4" /> API Details
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteSubscriber}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Dialog open={rawDetailsOpen} onOpenChange={setRawDetailsOpen}>
          <DialogContent className="max-h-[85vh] w-[95vw] sm:max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>NetTV API Details</DialogTitle>
              <DialogDescription>Full subscriber payload returned by NetTV.</DialogDescription>
            </DialogHeader>
            <pre className="max-h-[65vh] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-50">
              {JSON.stringify(selected, null, 2)}
            </pre>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={(open) => { if (!savingEdit) setEditOpen(open) }}>
          <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Edit NetTV Subscriber</DialogTitle>
              <DialogDescription>Updates the subscriber through the NetTV PATCH subscriber API.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["email", "Email"], ["status", "Status"],
                ["fname", "First Name"], ["mname", "Middle Name"], ["lname", "Last Name"],
                ["phone_no", "Phone"], ["mobile_no", "Mobile"], ["pan", "PAN"],
                ["address", "Address"], ["city", "City"], ["district", "District"],
                ["branch", "Branch"],
                ["website", "Website"], ["longitude", "Longitude"], ["latitude", "Latitude"],
                ["gender", "Gender"], ["dob", "DOB"],
              ].map(([field, label]) => (
                <FormField key={field} label={label} value={editForm[field] || ""} onChange={(value) => updateEditField(field, value)} />
              ))}
              
              {/* Country Select */}
              <div className="space-y-1.5">
                <Label>Country</Label>
                <select
                  value={editForm.country || ""}
                  onChange={(e) => updateEditField("country", e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 border-slate-200 dark:border-slate-800"
                >
                  <option value="">Select Country</option>
                  {countriesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Province Select */}
              <div className="space-y-1.5">
                <Label>Province</Label>
                <select
                  value={editForm.province || ""}
                  onChange={(e) => updateEditField("province", e.target.value)}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 border-slate-200 dark:border-slate-800"
                >
                  <option value="">Select Province</option>
                  {(countriesList.find(c => String(c.id) === String(editForm.country))?.provinces || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>Cancel</Button>
              <Button onClick={saveSubscriberEdit} disabled={savingEdit}>
                {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={passwordOpen} onOpenChange={(open) => { if (!passwordSaving) setPasswordOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Force Password Change</DialogTitle>
              <DialogDescription>Sets a new NetTV password for this subscriber.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="Password" type="password" value={passwordForm.password} onChange={(value) => setPasswordForm((current) => ({ ...current, password: value }))} />
              <FormField label="Confirm Password" type="password" value={passwordForm.conf_password} onChange={(value) => setPasswordForm((current) => ({ ...current, conf_password: value }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordOpen(false)} disabled={passwordSaving}>Cancel</Button>
              <Button onClick={forcePassword} disabled={passwordSaving}>
                {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={subscriberStbOpen} onOpenChange={(open) => { if (!subscriberStbSaving) setSubscriberStbOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subscriber STB</DialogTitle>
              <DialogDescription>Links an existing NetTV STB serial to this subscriber.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Serial" value={subscriberStbForm.serial} onChange={(value) => setSubscriberStbForm((current) => ({ ...current, serial: value }))} />
              <FormField label="Package ID" value={subscriberStbForm.package_id} onChange={(value) => setSubscriberStbForm((current) => ({ ...current, package_id: value }))} />
              <FormField label="Status" value={subscriberStbForm.status} onChange={(value) => setSubscriberStbForm((current) => ({ ...current, status: value }))} />
              <FormField label="Balance" value={subscriberStbForm.balance} onChange={(value) => setSubscriberStbForm((current) => ({ ...current, balance: value }))} />
              <FormField label="Expiry Date" type="date" value={subscriberStbForm.expiry_date} onChange={(value) => setSubscriberStbForm((current) => ({ ...current, expiry_date: value }))} />
              <FormField label="Extended Date" type="date" value={subscriberStbForm.extended_date} onChange={(value) => setSubscriberStbForm((current) => ({ ...current, extended_date: value }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubscriberStbOpen(false)} disabled={subscriberStbSaving}>Cancel</Button>
              <Button onClick={addSubscriberStb} disabled={subscriberStbSaving}>
                {subscriberStbSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Link STB
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={removeStbOpen} onOpenChange={(open) => { if (!removeStbSaving) setRemoveStbOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Subscriber STB</DialogTitle>
              <DialogDescription>Removes {selectedStbSerial || "the selected STB"} from this subscriber.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="Reason ID" value={removeStbForm.reason_id} onChange={(value) => setRemoveStbForm((current) => ({ ...current, reason_id: value }))} />
              <div className="space-y-1.5">
                <Label>Detail</Label>
                <Textarea value={removeStbForm.detail} onChange={(event) => setRemoveStbForm((current) => ({ ...current, detail: event.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveStbOpen(false)} disabled={removeStbSaving}>Cancel</Button>
              <Button variant="destructive" onClick={removeSubscriberStb} disabled={removeStbSaving}>
                {removeStbSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove STB
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={replaceStbOpen} onOpenChange={(open) => { if (!replaceStbSaving) setReplaceStbOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Replace Subscriber STB</DialogTitle>
              <DialogDescription>Replaces {selectedStbSerial || "the selected STB"} with another STB serial.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="New Serial" value={replaceStbForm.serial} onChange={(value) => setReplaceStbForm((current) => ({ ...current, serial: value }))} />
              <FormField label="Reason ID" value={replaceStbForm.reason_id} onChange={(value) => setReplaceStbForm((current) => ({ ...current, reason_id: value }))} />
              <div className="space-y-1.5">
                <Label>Detail</Label>
                <Textarea value={replaceStbForm.detail} onChange={(event) => setReplaceStbForm((current) => ({ ...current, detail: event.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplaceStbOpen(false)} disabled={replaceStbSaving}>Cancel</Button>
              <Button onClick={replaceSubscriberStb} disabled={replaceStbSaving}>
                {replaceStbSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Replace STB
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={cancelPackageOpen} onOpenChange={(open) => { if (!cancelPackageSaving) setCancelPackageOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Package Order</DialogTitle>
              <DialogDescription>Cancels a NetTV subscription order on the selected STB.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField label="Order ID" value={cancelPackageForm.order_id} onChange={(value) => setCancelPackageForm((current) => ({ ...current, order_id: value }))} />
              <FormField label="Cancelled By" value={cancelPackageForm.cancel_by} onChange={(value) => setCancelPackageForm((current) => ({ ...current, cancel_by: value }))} />
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={cancelPackageForm.notes} onChange={(event) => setCancelPackageForm((current) => ({ ...current, notes: event.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelPackageOpen(false)} disabled={cancelPackageSaving}>Cancel</Button>
              <Button variant="destructive" onClick={cancelSelectedPackage} disabled={cancelPackageSaving}>
                {cancelPackageSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {detailsLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading details...
          </div>
        ) : (
          <div className="space-y-6">
            {!isResellerConfigured && (
              <div className="p-4 text-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-pulse" />
                <div>
                  <h4 className="font-semibold text-sm">Reseller ID is not configured</h4>
                  <p className="text-xs opacity-90">Please configure the reseller ID in the NetTV integration settings to activate full billing, package, and credit wallet operations.</p>
                </div>
              </div>
            )}
            {/* Top overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <CardContainer title="Subscriber Account" gradientColor="#10b981">
                <div className="py-1">
                  <div className="text-xl font-bold">{subscriberLabel}</div>
                  <div className="font-mono text-sm text-muted-foreground">{subscriber?.username || valueOf(subscriber, ["user_name", "customer_username"])}</div>
                </div>
              </CardContainer>
              <CardContainer title="Contact Information" gradientColor="#3b82f6">
                <div className="py-1">
                  <div className="text-base font-semibold">{contact?.mobile_no || contact?.phone_no || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">{subscriber?.email || "N/A"}</div>
                </div>
              </CardContainer>
              <CardContainer title="Reseller Balance" gradientColor="#f59e0b">
                <div className="py-1">
                  <div className="text-2xl font-bold">NPR {reseller?.credit_balance?.credit_balance ?? subscriber?.balance ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Reseller ID: #{reseller?.id || "N/A"}</div>
                </div>
              </CardContainer>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-4">
              <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="devices">Devices & Orders</TabsTrigger>
                <TabsTrigger value="reseller">Reseller Info</TabsTrigger>
                <TabsTrigger value="location">Location Map</TabsTrigger>
                <TabsTrigger value="raw-api">Raw API Fields</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-6 xl:grid-cols-2">
                  <DetailGrid
                    title="Subscriber Account"
                    items={[
                      { label: "Username", value: subscriber?.username },
                      { label: "Email", value: subscriber?.email },
                      { label: "Status", value: subscriber?.status },
                      { label: "ERP ID", value: subscriber?.erp_id },
                      { label: "Registration Type", value: subscriber?.registration_type },
                      { label: "Wallet Enabled", value: formatBoolean(subscriber?.is_wallet_enable) },
                      { label: "Remote Enabled", value: formatBoolean(subscriber?.is_remote_enable) },
                      { label: "STBs", value: subscriber?.user_stbs_count },
                      { label: "Active STBs", value: subscriber?.active_user_stbs_count },
                      { label: "Balance", value: subscriber?.balance },
                      { label: "Created", value: subscriber?.created_at },
                      { label: "Updated", value: subscriber?.updated_at },
                    ]}
                  />
                  <DetailGrid
                    title="Subscriber Contact & Address"
                    items={[
                      { label: "Display Name", value: contact?.display_name || subscriberLabel },
                      { label: "First Name", value: contact?.fname },
                      { label: "Middle Name", value: contact?.mname },
                      { label: "Last Name", value: contact?.lname },
                      { label: "Phone", value: contact?.phone_no },
                      { label: "Mobile", value: contact?.mobile_no },
                      { label: "Address", value: contact?.address },
                      { label: "City", value: contact?.city },
                      { label: "District", value: contact?.district },
                      { label: "Province", value: provinceName },
                      { label: "Country", value: countryName },
                      { label: "PAN", value: contact?.pan },
                      { label: "Branch", value: contact?.branch },
                      { label: "Website", value: contact?.website },
                    ]}
                  />
                </div>
              </TabsContent>

              <TabsContent value="devices" className="space-y-4">
                {/* STB Devices management section */}
                <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-lg font-bold">Set-Top Box (STB) & Service Provisioning</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSubscriberStbOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Link STB
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setReplaceStbOpen(true)} disabled={!selectedStbSerial}>
                        <Repeat className="mr-2 h-4 w-4" /> Replace
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setRemoveStbOpen(true)} disabled={!selectedStbSerial}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-sm font-semibold">Select Linked STB</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={selectedStbSerial}
                        onChange={(event) => { setSelectedStbSerial(event.target.value); setSelectedPackageSaleId("") }}
                      >
                        <option value="">Select device</option>
                        {(selected?.stbs || []).map((stb: any) => (
                          <option key={stb.serial} value={stb.serial}>{stb.serial} · {stb.model?.name || stb.model || "STB"}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="button" variant="outline" className="h-10" onClick={refreshSelectedStb} disabled={!selectedStbSerial || stbLoading}>
                      {stbLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Get Device Details
                    </Button>
                  </div>

                  {selectedStb ? (
                    <div className="space-y-6 pt-2">
                      <div className="grid gap-4 text-sm md:grid-cols-4 rounded-lg bg-muted/40 p-4 border">
                        <div><div className="text-xs text-muted-foreground">Serial / MAC</div><div className="break-all font-mono font-semibold">{selectedStb.serial}</div></div>
                        <div><div className="text-xs text-muted-foreground">Status</div><Badge variant={statusVariant(String(selectedStb.status || "unknown"))} className="mt-1">{selectedStb.status || "unknown"}</Badge></div>
                        <div><div className="text-xs text-muted-foreground">Vendor</div><div className="font-semibold">{selectedStb.vendor?.name || selectedStb.vendor || "N/A"}</div></div>
                        <div><div className="text-xs text-muted-foreground">Model</div><div className="font-semibold">{selectedStb.model?.name || selectedStb.model || "N/A"}</div></div>
                      </div>

                      {/* Assign packages */}
                      <div className="rounded-lg border p-4 bg-background shadow-xs space-y-4">
                        <div className="font-semibold border-b pb-2 text-primary">Assign Subscription Package</div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <Label>Select Package</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={selectedPackageSaleId}
                              onChange={(event) => setSelectedPackageSaleId(event.target.value)}
                            >
                              <option value="">{packageConfigLoading ? "Loading package configurations..." : "Select package configuration"}</option>
                              {packageConfigs.map((config: any) => (
                                <option key={config.id} value={config.id}>
                                  {config.package_name || "Package"} · {config.display_name} · {config.duration} · Rs. {config.price_with_vat ?? config.price ?? 0}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Payment Mode</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={paymentGateway}
                              onChange={(event) => setPaymentGateway(event.target.value)}
                            >
                              <option value="reseller_wallet">Reseller Wallet</option>
                              <option value="wallet">Subscriber Wallet</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min={1}
                              value={packageQty}
                              onChange={(event) => setPackageQty(Math.max(1, Number(event.target.value)))}
                            />
                          </div>
                        </div>
                        <Button type="button" onClick={assignPackage} disabled={assigningPackage || !selectedPackageSaleId}>
                          {assigningPackage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Assign Selected Package
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setCancelPackageOpen(true)} disabled={!selectedStbSerial}>
                          <Wrench className="mr-2 h-4 w-4" /> Cancel Order
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          {packageConfigItems.length
                            ? `\\${packageConfigItems.length} package groups loaded from NetTV config API`
                            : "Package options fall back to STB package details when the config API has no data."}
                        </div>
                      </div>

                      <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-lg border p-4 bg-background">
                          <div className="mb-3 font-semibold border-b pb-1">Subscribed Packages</div>
                          <div className="space-y-2">
                            {(selectedStb.subscribed_packages || []).map((pkg: any) => (
                              <div key={pkg.id} className="rounded-md bg-muted/40 p-3 text-sm">
                                <div className="font-semibold text-primary">{pkg.package_config_name}</div>
                                <div className="text-xs text-muted-foreground mt-1">Package #\\${pkg.package_id} · {pkg.package_subscription_details?.[0]?.expiry_date ? `Expires \\${pkg.package_subscription_details[0].expiry_date}` : "No expiry"}</div>
                              </div>
                            ))}
                            {!selectedStb.subscribed_packages?.length && <p className="text-sm text-muted-foreground py-2">No subscribed packages.</p>}
                          </div>
                        </div>

                        <div className="rounded-lg border p-4 bg-background">
                          <div className="mb-3 font-semibold border-b pb-1">Active Orders</div>
                          <div className="space-y-2">
                            {(selectedStb.active_package || []).map((pkg: any) => (
                              <div key={pkg.id} className="rounded-md bg-muted/40 p-3 text-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold text-primary">{pkg.name}</span>
                                  <Badge variant={statusVariant(String(pkg.status || "unknown"))}>{pkg.status}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1.5">Order #\\${pkg.id} · Qty \\${pkg.qty} · Rs. \\${pkg.total_with_vat}</div>
                              </div>
                            ))}
                            {!selectedStb.active_package?.length && <p className="text-sm text-muted-foreground py-2">No active orders.</p>}
                          </div>
                        </div>
                      </div>

                      {selectedStb?.bootstrap?.services?.length > 0 && (
                        <div className="rounded-lg border p-4 bg-background">
                          <div className="mb-2 font-semibold">Device Services</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedStb.bootstrap.services.map((service: any) => (
                              <Badge key={service.name} variant="outline" title={service.baseURL}>{service.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 border rounded-lg text-center bg-muted/10 border-dashed">No set-top box linked/selected. Pick a device from the list above to assign packages or view STB subscriptions.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reseller" className="space-y-4">
                <DetailGrid
                  title="Reseller Details"
                  items={[
                    { label: "Name", value: reseller?.name },
                    { label: "Username", value: reseller?.username },
                    { label: "Profile", value: reseller?.profile },
                    { label: "Status", value: reseller?.status },
                    { label: "KYC Status", value: reseller?.kyc_status },
                    { label: "ERP Code", value: reseller?.erp_cust_code },
                    { label: "Mobile", value: reseller?.details?.mobile_no || reseller?.mobile_no },
                    { label: "Email", value: reseller?.details?.email || reseller?.email },
                    { label: "Expiry Date", value: reseller?.expiry_date },
                    { label: "Credit Balance", value: reseller?.credit_balance?.credit_balance },
                  ]}
                />
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" /> Subscriber Location
                  </div>
                  {latitude !== null && longitude !== null ? (
                    <div className="space-y-3">
                      <NettvLocationMap lat={latitude} lng={longitude} label={subscriberLabel} />
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-md bg-muted/30 px-3 py-2"><span className="text-muted-foreground">Latitude</span><div className="font-mono">{latitude.toFixed(6)}</div></div>
                        <div className="rounded-md bg-muted/30 px-3 py-2"><span className="text-muted-foreground">Longitude</span><div className="font-mono">{longitude.toFixed(6)}</div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">No coordinates available for this subscriber.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="raw-api" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold">Complete NetTV Details</h2>
                    <p className="text-sm text-muted-foreground">All non-empty fields returned by the NetTV APIs, grouped for scanning.</p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <DetailsBlock title="Subscriber Account Details" data={subscriber} />
                    <DetailsBlock title="Subscriber Contact Details" data={contact} />
                    <DetailsBlock title="Reseller Details" data={subscriber?.reseller || {}} />
                    <DetailsBlock title="Payment Methods" data={reseller?.payment_methods || {}} />
                    <DetailsBlock title="Credit Balance" data={reseller?.credit_balance || {}} />
                    <DetailsBlock title="Selected STB Full Details" data={selectedStb || {}} />
                  </div>
                  {(selected?.stbs || []).length > 0 && (
                    <div className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="mb-3 text-sm font-semibold">All Linked STBs</div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {(selected?.stbs || []).map((stb: any, index: number) => (
                          <DetailsBlock key={`\\${stb?.serial || stb?.id || index}-\\${index}`} title={stb?.serial || `STB \\${index + 1}`} data={stb} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <CardContainer title="Subscribers" gradientColor="#10b981">
          <div className="flex items-center gap-3 py-2">
            <Users className="h-8 w-8 text-emerald-500" />
            <div className="text-3xl font-bold">{subscribers.length}</div>
          </div>
        </CardContainer>
        <CardContainer title="Active" gradientColor="#22c55e">
          <div className="flex items-center gap-3 py-2">
            <UserCheck className="h-8 w-8 text-green-500" />
            <div className="text-3xl font-bold">{activeCount}</div>
          </div>
        </CardContainer>
        <CardContainer title="Packages" gradientColor="#3b82f6">
          <div className="flex items-center gap-3 py-2">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="text-3xl font-bold">{packages.length}</div>
          </div>
        </CardContainer>
        <CardContainer title="STBs" gradientColor="#f59e0b">
          <div className="flex items-center gap-3 py-2">
            <Tv className="h-8 w-8 text-amber-500" />
            <div className="text-3xl font-bold">{stbs.length}</div>
          </div>
        </CardContainer>
        <CardContainer title="Reseller Wallet" gradientColor="#a855f7">
          <div className="flex flex-col justify-center py-1">
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {resellerInfo?.creditBalance?.credit_balance !== undefined
                ? `Rs. ${resellerInfo.creditBalance.credit_balance}`
                : "N/A"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">ID: #${resellerInfo?.resellerId || "N/A"}</span>
          </div>
        </CardContainer>
      </div>

      <CardContainer
        title="NetTV Subscribers"
        description="Subscriber accounts, plans, status, contact data, devices, and service identifiers"
        gradientColor="#10b981"
        actions={[
          { label: "Add Subscriber", onClick: () => setCreateOpen(true), icon: <Plus className="h-4 w-4" /> },
          { label: "Refresh", onClick: fetchData, icon: <RefreshCw className="h-4 w-4" />, variant: "outline" }
        ]}
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Search subscribers"
              className="pl-9"
            />
          </div>
          <select
            value={limit}
            onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {[10, 25, 50, 100].map(value => <option key={value} value={value}>{value} rows</option>)}
          </select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Local Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="w-[180px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6}><Skeleton className="h-7 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">No NetTV subscribers found.</TableCell>
                </TableRow>
              ) : (
                paginatedSubscribers.map((subscriber, index) => {
                  const username = valueOf(subscriber, ["username", "user_name", "customer_username"])
                  const status = valueOf(subscriber, ["status", "state"], "Unknown")
                  return (
                    <TableRow key={`${username}-${index}`}>
                      <TableCell>
                        <div className="font-semibold">{fullName(subscriber)}</div>
                        <div className="font-mono text-xs text-muted-foreground">{username}</div>
                      </TableCell>
                      <TableCell>
                        {subscriber.local_customer ? (
                          <div className="space-y-1">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {subscriber.local_customer.firstName} {subscriber.local_customer.lastName}
                            </span>
                            <span className="block">
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs text-blue-500 hover:text-blue-600 flex items-center"
                                onClick={() => router.push(`/customers/${subscriber.local_customer.id}`)}
                              >
                                <Users className="mr-1 h-3 w-3" /> View Profile
                              </Button>
                            </span>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => openCustomerLink(subscriber)}>
                            <UserCheck className="mr-1 h-3.5 w-3.5" /> Link customer
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{valueOf(subscriber, ["email"])}</div>
                        <div className="text-xs text-muted-foreground">{valueOf(subscriber, ["mobile", "phone", "contact"], valueOf(subscriber?.details, ["mobile_no", "phone_no"]))}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{valueOf(subscriber, ["package_name", "package", "plan_name", "subscription_package"])}</div>
                        <div className="text-xs text-muted-foreground">{valueOf(subscriber, ["subscription_id", "package_id", "plan_id"])}</div>
                      </TableCell>
                      <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      <TableCell className="text-sm">{valueOf(subscriber, ["expires_at", "expiry_date", "expire_date", "valid_till", "end_date"])}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openDetails(subscriber)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changeSubscriberStatus(subscriber)}
                            disabled={statusChanging === username}
                            title="Change NetTV status"
                          >
                            {statusChanging === username ? <Loader2 className="h-4 w-4 animate-spin" /> : statusVariant(status) === "success" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={Boolean(linkSubscriber)} onOpenChange={(open) => !open && setLinkSubscriber(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Link NetTV Subscriber</DialogTitle><DialogDescription>Choose the local customer associated with this NetTV username.</DialogDescription></DialogHeader>
            <div className="space-y-2 py-3">
              <Label htmlFor="nettv-local-customer">Local customer</Label>
              <select id="nettv-local-customer" value={linkCustomerId} onChange={event => setLinkCustomerId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Select customer</option>
                {linkCustomers.map(customer => <option key={customer.id} value={customer.id}>{customer.customerUniqueId} · {customer.firstName || customer.lead?.firstName || ""} {customer.lastName || customer.lead?.lastName || ""}</option>)}
              </select>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setLinkSubscriber(null)}>Cancel</Button><Button onClick={linkCustomer} disabled={!linkCustomerId || linkSaving}>{linkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Link customer</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Showing {paginatedSubscribers.length ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, filteredSubscribers.length)} of {filteredSubscribers.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>First</Button>
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(prev => prev - 1)}>Prev</Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)}>Next</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</Button>
          </div>
        </div>
      </CardContainer>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CardContainer title="NetTV Packages" description="Available NetTV subscription packages" gradientColor="#3b82f6">
          <div className="max-h-[520px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4}><Skeleton className="h-7 w-full" /></TableCell></TableRow>
                ) : paginatedPackages.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No packages found.</TableCell></TableRow>
                ) : (
                  paginatedPackages.map((pkg, index) => {
                    const status = valueOf(pkg, ["status", "state"], "Available")
                    return (
                      <TableRow key={`${valueOf(pkg, ["id", "package_id", "code"], String(index))}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{valueOf(pkg, ["name", "package_name", "title"])}</div>
                          <div className="text-xs text-muted-foreground">{valueOf(pkg, ["description", "duration", "validity"], "")}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{valueOf(pkg, ["code", "id", "package_id"])}</TableCell>
                        <TableCell>{valueOf(pkg, ["price", "amount", "rate", "mrp"])}</TableCell>
                        <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>Showing {paginatedPackages.length ? (packagePage - 1) * subLimit + 1 : 0} to {Math.min(packagePage * subLimit, packages.length)} of {packages.length}</div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === 1} onClick={() => setPackagePage(1)}>First</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === 1} onClick={() => setPackagePage(prev => prev - 1)}>Prev</Button>
              <span className="px-1 text-[11px]">Page {packagePage} of {totalPackagePages}</span>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === totalPackagePages} onClick={() => setPackagePage(prev => prev + 1)}>Next</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={packagePage === totalPackagePages} onClick={() => setPackagePage(totalPackagePages)}>Last</Button>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="NetTV STBs" description="Set-top boxes linked with NetTV subscribers" gradientColor="#f59e0b">
          <div className="max-h-[520px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>MAC / SN</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4}><Skeleton className="h-7 w-full" /></TableCell></TableRow>
                ) : paginatedStbs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No STBs found.</TableCell></TableRow>
                ) : (
                  paginatedStbs.map((stb, index) => {
                    const status = valueOf(stb, ["status", "state"], "Unknown")
                    const modelName = stb?.model?.name || stb?.model_name || (typeof stb?.model === "string" ? stb.model : "N/A")
                    const vendorName = stb?.vendor?.name || stb?.vendor_name || (typeof stb?.vendor === "string" ? stb.vendor : "N/A")
                    const subscriberUsername = stb?.stb_user?.user?.username || stb?.username || stb?.subscriber_username || "N/A"
                    const ownerName = stb?.owner?.name || (typeof stb?.owner === "string" ? stb.owner : "N/A")
                    return (
                      <TableRow key={`${valueOf(stb, ["id", "serial", "serial_number", "mac"], String(index))}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{modelName}</div>
                          <div className="text-xs text-muted-foreground">{vendorName} · STB #{valueOf(stb, ["id", "stb_id", "device_id"], "N/A")}</div>
                        </TableCell>
                        <TableCell><div className="font-mono text-xs">{subscriberUsername}</div><div className="text-xs text-muted-foreground">{ownerName}</div></TableCell>
                        <TableCell><div className="font-mono text-xs">{stb.serial || stb.serial_number || "N/A"}</div><div className="text-xs text-muted-foreground">MAC: {stb.mac || stb.mac_address || "N/A"}</div></TableCell>
                        <TableCell><Badge variant={statusVariant(status)}>{status}</Badge></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>Showing {paginatedStbs.length ? (stbPage - 1) * subLimit + 1 : 0} to {Math.min(stbPage * subLimit, stbs.length)} of {stbs.length}</div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === 1} onClick={() => setStbPage(1)}>First</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === 1} onClick={() => setStbPage(prev => prev - 1)}>Prev</Button>
              <span className="px-1 text-[11px]">Page {stbPage} of {totalStbPages}</span>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === totalStbPages} onClick={() => setStbPage(prev => prev + 1)}>Next</Button>
              <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" disabled={stbPage === totalStbPages} onClick={() => setStbPage(totalStbPages)}>Last</Button>
            </div>
          </div>
        </CardContainer>
      </div>

      <CardContainer title="NetTV Reference Data" description="Vendors, models, and MAC replacement reasons from NetTV configuration APIs" gradientColor="#14b8a6">
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <div className="font-semibold">STB Vendors</div>
              <Badge variant="secondary">{vendors.length}</Badge>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto">
              {vendors.slice(0, 80).map((vendor: any, index: number) => (
                <div key={`${vendor?.id || vendor?.name || index}-${index}`} className="rounded-md bg-muted/30 p-2 text-sm">
                  <div className="font-medium">{vendor?.name || vendor?.vendor_name || "Unnamed vendor"}</div>
                  <div className="text-xs text-muted-foreground">ID: {vendor?.id || "N/A"}</div>
                </div>
              ))}
              {!vendors.length && <div className="text-sm text-muted-foreground">No vendor data returned.</div>}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <div className="font-semibold">STB Models</div>
              <Badge variant="secondary">{models.length}</Badge>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto">
              {models.slice(0, 80).map((model: any, index: number) => (
                <div key={`${model?.id || model?.name || index}-${index}`} className="rounded-md bg-muted/30 p-2 text-sm">
                  <div className="font-medium">{model?.name || model?.model_name || "Unnamed model"}</div>
                  <div className="text-xs text-muted-foreground">ID: {model?.id || "N/A"}{model?.vendor_id ? ` - Vendor ${model.vendor_id}` : ""}</div>
                </div>
              ))}
              {!models.length && <div className="text-sm text-muted-foreground">No model data returned.</div>}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <div className="font-semibold">Replacement Reasons</div>
              <Badge variant="secondary">{replaceReasons.length}</Badge>
            </div>
            <div className="max-h-72 space-y-2 overflow-auto">
              {replaceReasons.slice(0, 80).map((reason: any, index: number) => (
                <div key={`${reason?.id || reason?.name || index}-${index}`} className="rounded-md bg-muted/30 p-2 text-sm">
                  <div className="font-medium">{reason?.name || reason?.title || reason?.reason || "Replacement reason"}</div>
                  <div className="text-xs text-muted-foreground">ID: {reason?.id || "N/A"}</div>
                </div>
              ))}
              {!replaceReasons.length && <div className="text-sm text-muted-foreground">No replacement reasons returned.</div>}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg border bg-background p-4">
          <div className="mb-3 font-semibold">Billing Document Lookup</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={invoicePaymentId}
                onChange={(event) => setInvoicePaymentId(event.target.value)}
                placeholder="Invoice company payment ID"
              />
              <Button type="button" variant="outline" onClick={lookupInvoicePrint} disabled={printLookupLoading === "invoice"}>
                {printLookupLoading === "invoice" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invoice Print
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={creditNotePaymentId}
                onChange={(event) => setCreditNotePaymentId(event.target.value)}
                placeholder="Credit-note company payment ID"
              />
              <Button type="button" variant="outline" onClick={lookupCreditNotePrint} disabled={printLookupLoading === "credit"}>
                {printLookupLoading === "credit" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Credit Note Print
              </Button>
            </div>
          </div>
        </div>
      </CardContainer>

      <Dialog open={printLookupOpen} onOpenChange={setPrintLookupOpen}>
        <DialogContent className="max-h-[85vh] w-[95vw] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>NetTV Billing Document</DialogTitle>
            <DialogDescription>Response returned by the NetTV print endpoint.</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[65vh] overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-50">
            {typeof printLookupResult === "string" ? printLookupResult : JSON.stringify(printLookupResult, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      <NetTVDialog
        open={createOpen}
        onOpenChange={(open) => { if (!creatingSubscriber) setCreateOpen(open) }}
        onConfirm={createSubscriber}
      />
    </div>
  )
}
