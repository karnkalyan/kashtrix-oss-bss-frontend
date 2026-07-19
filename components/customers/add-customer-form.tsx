"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  CheckCircle2,
  Upload,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
  UserCheck,
  Building2,
  Target,
  Zap,
  ShieldCheck,
  Cpu,
  Split,
  Server,
  Router,
  Cable,
  Search,
  Loader2,
  Globe,
  Navigation,
  Ruler,
  AlertTriangle,
  ChevronRight,
  Key,
  Wifi,
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { ServicesAPI } from "@/lib/api/service"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


import "leaflet/dist/leaflet.css"
import { useMapEvents, useMap } from 'react-leaflet'

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('@/components/maps/safe-map-container').then(mod => mod.SafeMapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

// Custom icon factory function (only runs on client)
const getCustomIcon = () => {
  if (typeof window === 'undefined') return null

  const L = require('leaflet')

  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
    iconUrl: "/leaflet/images/marker-icon.png",
    shadowUrl: "/leaflet/images/marker-shadow.png",
  })

  return new L.Icon({
    iconUrl: "/leaflet/images/marker-icon.png",
    iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
    shadowUrl: "/leaflet/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

// ==================== Map Helper Components ====================
const MapClickHandler = ({ onLocationSelect, disabled }: { onLocationSelect: (lat: number, lng: number) => void; disabled?: boolean }) => {
  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        if (!disabled) {
          onLocationSelect(e.latlng.lat, e.latlng.lng)
        }
      },
    })
    return null
  }
  return <MapEvents />
}

const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  return null
}

const LocationMarker = ({
  position,
  draggable = true,
  onDragEnd,
  address = "",
  serviceAvailable = null,
  nearestSplitter = null,
}: {
  position: [number, number]
  draggable?: boolean
  onDragEnd?: (lat: number, lng: number, address?: string) => void
  address?: string
  serviceAvailable?: boolean | null
  nearestSplitter?: { distance: number; name: string } | null
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)
  const [isDragging, setIsDragging] = useState(false)
  const [customIcon, setCustomIcon] = useState<any>(null)

  useEffect(() => {
    setCustomIcon(getCustomIcon())
  }, [])

  const eventHandlers = useMemo(
    () => ({
      dragstart: () => {
        setIsDragging(true)
      },
      dragend: (e: any) => {
        const marker = e.target
        const position = marker.getLatLng()
        const newPosition: [number, number] = [position.lat, position.lng]
        setMarkerPosition(newPosition)
        if (onDragEnd) {
          onDragEnd(position.lat, position.lng, address)
        }
        setIsDragging(false)
      },
    }),
    [onDragEnd, address]
  )

  useEffect(() => {
    if (position) {
      setMarkerPosition(position)
    }
  }, [position])

  if (!markerPosition || !customIcon) return null

  return (
    <Marker position={markerPosition} draggable={draggable} eventHandlers={eventHandlers} icon={customIcon}>
      <Popup>
        <div className="p-2 min-w-[250px]">
          <div className="font-semibold text-sm mb-2">📍 Selected Location</div>
          <div className="space-y-2">
            <div className="text-xs">
              <span className="font-medium">Coordinates:</span>
              <div className="text-gray-600">
                Lat: {markerPosition[0].toFixed(6)}
                <br />
                Lng: {markerPosition[1].toFixed(6)}
              </div>
            </div>
            {address && (
              <div className="text-xs">
                <span className="font-medium">Address:</span>
                <div className="text-gray-600 mt-1">{address}</div>
              </div>
            )}
            {serviceAvailable !== null && (
              <div
                className={`text-xs p-2 rounded ${serviceAvailable ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
              >
                <span className="font-medium">Service:</span>
                <div className="mt-1">{serviceAvailable ? "✅ Available" : "❌ Not Available"}</div>
              </div>
            )}
            {nearestSplitter && (
              <div className="text-xs bg-blue-50 p-2 rounded">
                <span className="font-medium">Nearest Splitter:</span>
                <div className="text-gray-600 mt-1">
                  {nearestSplitter.name}
                  <br />
                  Distance: {formatDistance(nearestSplitter.distance)}
                </div>
              </div>
            )}
            {isDragging && <div className="text-xs text-amber-600 italic">Dragging marker...</div>}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

const SplitterMarker = ({ splitter }: { splitter: Splitter }) => {
  const [isClient, setIsClient] = useState(false)
  const [splitterIcon, setSplitterIcon] = useState<any>(null)

  const lat = splitter.location?.latitude
  const lng = splitter.location?.longitude

  useEffect(() => {
    setIsClient(true)

    if (typeof window !== 'undefined') {
      const L = require('leaflet')
      const icon = new L.DivIcon({
        html: `
          <div class="relative">
            <div class="w-6 h-6 rounded-full ${splitter.isMaster ? "bg-purple-500" : "bg-blue-500"
          } border-2 border-white shadow-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        `,
        className: "splitter-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      setSplitterIcon(icon)
    }
  }, [splitter.isMaster])

  if (!lat || !lng || !isClient || !splitterIcon) return null

  return (
    <Marker position={[lat, lng]} icon={splitterIcon}>
      <Popup>
        <div className="p-1">
          <strong>{splitter.name}</strong>
          <br />
          ID: {splitter.splitterId}
          <br />
          Type: {splitter.splitterType || "N/A"}
          <br />
          Ratio: {splitter.splitRatio}
          <br />
          Status:{" "}
          <span
            className={`px-2 py-1 rounded text-xs ${splitter.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
          >
            {splitter.status}
          </span>
          <br />
          Available Ports: {splitter.availablePorts ?? 0}/{splitter.portCount}
          <br />
          <div className="mt-2 text-xs text-gray-500">{splitter.location?.site || "No site specified"}</div>
        </div>
      </Popup>
    </Marker>
  )
}

// Helper function to format distance
const formatDistance = (distance: any): string => {
  try {
    const distNum = Number(distance)
    if (isNaN(distNum) || !isFinite(distNum)) {
      return "N/A"
    }
    if (distNum < 1) {
      const meters = distNum * 1000
      if (meters < 100) {
        return `${meters.toFixed(0)} m`
      } else {
        return `${meters.toFixed(0)} m`
      }
    } else if (distNum < 10) {
      return `${distNum.toFixed(2)} km`
    } else {
      return `${distNum.toFixed(1)} km`
    }
  } catch (error) {
    return "N/A"
  }
}

const buildNettvCredential = (value?: string | null) => {
  const cleaned = String(value || "").trim().replace(/^_?nettv/i, "").replace(/_nettv$/i, "")
  return cleaned ? `${cleaned}_nettv` : ""
}

// ==================== Type Definitions ====================
interface Package {
  id: number
  planId: number
  packageName: string
  price: number
  initialTotalWithTax?: number | null
  renewAmountWithTax?: number | null
  packageDuration: string
  isActive: boolean
  isTrial: boolean
  referenceId: string
  packagePlanDetails?: {
    planName: string
    planCode?: string
    deviceLimit: number
  }
}

interface User {
  id: number
  name: string
  email: string
  role?: {
    name?: string
  }
}

interface Membership {
  id: number
  name: string
}

interface ExistingISP {
  id: number
  name: string
  code?: string
  type?: string
}

interface CustomerType {
  id: number
  name: string
}

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
  loadFiles?: Array<{ id: string; tftpHost: string; filename: string }>
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

interface DocumentFile {
  file: File | null
  type: "idProof" | "addressProof" | "photo" | "other"
  name: string
}

interface LeadSearchResult {
  id: number
  firstName: string
  middleName: string | null
  lastName: string
  email: string | null
  phoneNumber: string | null
  secondaryContactNumber: string | null
  gender: string | null
  street: string | null
  city: string | null
  district: string | null
  province: string | null
  zipCode: string | null
  lat: number | null
  lon: number | null
  metadata?: {
    age?: number | null
    fullAddress?: string | null
    latitude?: number | null
    longitude?: number | null
    serviceRadius?: number | null
  }
  memberShipId?: string | null
  membership?: {
    id: number
    name: string
    code: string
  } | null
  interestedPackageId?: number | null
}

interface ServiceCatalogItem {
  id: number
  name: string
  code: string
  description: string | null
  category: string
  iconUrl: string | null
  config?: Record<string, any> | null
}

interface CustomerDevice {
  id?: number
  deviceType: string // "ONT", "Router", "STB"
  brand: string
  model: string
  serialNumber: string
  macAddress: string
  ponSerial?: string // for GPON
  ponVendorIdIncluded?: boolean
  notes: string
  inventoryItemId?: number
}

interface ProvisionResult {
  success: boolean
  message: string
  customer?: {
    id: number
    customerUniqueId: string
    name: string
    status: string
    onboardStatus: string
  }
  subscription?: any
  order?: any
  provisioning?: {
    radius: any[]
    tshul: any
    connectionUsers: number
    ont?: any
  }
  services?: Array<{
    service: string
    success: boolean
    message?: string
    data?: any
  }>
}

// Geocoding result interface
interface GeocodingResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  class: string
  type: string
  place_rank: number
  importance: number
  addresstype: string
  name: string
  display_name: string
  address?: {
    road?: string
    city?: string
    state?: string
    county?: string
    state_district?: string
  }
  boundingbox: [string, string, string, string]
}

// Country/Province interfaces for NETTV
interface Country {
  id: number
  name: string
  country_code: string
  calling_code: string
  provinces: Province[]
}

interface Province {
  id: number
  country_id: number
  name: string
}

// ==================== Device Dialog Component (with MAC formatting) ====================
interface DeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: CustomerDevice
  onSave: (device: CustomerDevice) => void
}

function formatMacAddress(value: string): string {
  // Remove all non-alphanumeric characters and convert to lowercase
  const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toLowerCase()
  // Group in chunks of 4
  const groups = cleaned.match(/.{1,4}/g)
  if (!groups) return value
  return groups.join('.')
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
      apiRequest(`/inventory?type=${encodeURIComponent(formData.deviceType)}&status=ASSIGNED_TO_USER&userId=${user.id}`)
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
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add Provisioned Device"}</DialogTitle>
          <DialogDescription>
            Assign an ONT/Device from your branch's inventory to this customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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

// ==================== NETTV Service Dialog (updated with countries/provinces) ====================
interface NetTVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: any) => void // full payload
  defaultFname?: string
  defaultLname?: string
  defaultEmail?: string
  defaultUsername?: string
  defaultPassword?: string
  defaultAddress?: string
  defaultCity?: string
  defaultDistrict?: string
  defaultProvince?: string
  defaultZip?: string
  defaultPhone?: string
  defaultMobile?: string
  defaultLat?: string
  defaultLng?: string
}

interface UploadedDocument {
  type: string
  data: string
  mime_type: string
  extension: string
  size: string
  fileName?: string
  previewUrl?: string
}

export function NetTVDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultFname = "",
  defaultLname = "",
  defaultEmail = "",
  defaultUsername = "",
  defaultPassword = "",
  defaultAddress = "",
  defaultCity = "",
  defaultDistrict = "",
  defaultProvince = "",
  defaultZip = "",
  defaultPhone = "",
  defaultMobile = "",
  defaultLat = "",
  defaultLng = "",
}: NetTVDialogProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)

  const [username, setUsername] = useState(buildNettvCredential(defaultUsername || defaultEmail))
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState("")
  const [fname, setFname] = useState(defaultFname)
  const [mname, setMname] = useState("") // optional
  const [lname, setLname] = useState(defaultLname)
  const [address, setAddress] = useState(defaultAddress)
  const [city, setCity] = useState(defaultCity)
  const [district, setDistrict] = useState(defaultDistrict)
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null)
  const [phone_no, setPhoneNo] = useState(defaultPhone)
  const [mobile_no, setMobileNo] = useState(defaultMobile)
  const [website, setWebsite] = useState("")
  const [longitude, setLongitude] = useState(defaultLng)
  const [latitude, setLatitude] = useState(defaultLat)
  const [nettvStbs, setNettvStbs] = useState<any[]>([])
  const [nettvPackageConfigs, setNettvPackageConfigs] = useState<any[]>([])
  const [selectedStb, setSelectedStb] = useState("")
  const [selectedPackageSaleId, setSelectedPackageSaleId] = useState("")
  const [packageQty, setPackageQty] = useState(1)
  const [nettvSubscriberRegistered, setNettvSubscriberRegistered] = useState(false)
  const [nettvResellerBalance, setNettvResellerBalance] = useState<number | null>(null)

  // Document upload state
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed (JPEG, PNG, GIF, WebP)")
      return
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    setUploadingDoc(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove the data:image/xxx;base64, prefix
          const base64Data = result.split(",")[1] || result
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const mimeType = extension === "png" ? "png" : extension === "gif" ? "gif" : extension === "webp" ? "webp" : "jpg"

      const doc: UploadedDocument = {
        type: mimeType,
        data: base64,
        mime_type: mimeType,
        extension: extension,
        size: String(file.size),
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
      }

      setDocuments(prev => [...prev, doc])
    } catch {
      toast.error("Failed to read the file")
    } finally {
      setUploadingDoc(false)
      // Reset the input so the same file can be re-selected
      e.target.value = ""
    }
  }

  const removeDocument = (index: number) => {
    setDocuments(prev => {
      const removed = prev[index]
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  // Validation errors for name fields
  const [nameErrors, setNameErrors] = useState({ fname: "", lname: "" })

  // Fetch countries when dialog opens
  useEffect(() => {
    if (open) {
      const candidateUsername = buildNettvCredential(defaultUsername || defaultEmail)
      ServicesAPI.getNetTVSubscriber(candidateUsername).then((response: any) => {
        const subscriber = response?.data?.subscriber || response?.data
        const subscriberId = subscriber?.id ? String(subscriber.id) : undefined
        setNettvSubscriberRegistered(Boolean(subscriber?.username || subscriber?.id))
        return ServicesAPI.getNetTVSTBs(1, 100, subscriberId)
      }).then((response: any) => {
        const payload = response?.data
        setNettvStbs(Array.isArray(payload) ? payload : (payload?.data || payload?.items || payload?.stbs || []))
      }).catch(() => { setNettvSubscriberRegistered(false); setNettvStbs([]) })
      ServicesAPI.getNetTVResellerInfo().then((response: any) => {
        setNettvResellerBalance(Number(response?.data?.creditBalance?.credit_balance ?? response?.data?.credit_balance?.credit_balance ?? 0))
      }).catch(() => setNettvResellerBalance(null))
      const fetchCountries = async () => {
        setLoadingCountries(true)
        try {
          const response = await apiRequest("/services/nettv/countries")
          if (response.success && response.data) {
            const normalizedCountries = response.data.map((country: Country) => ({ ...country, id: Number(country.id), provinces: (country.provinces || []).map((province: Province) => ({ ...province, id: Number(province.id), country_id: Number(province.country_id) })) }))
            setCountries(normalizedCountries)
            
            // Set default country to Nepal (id 156 or name Nepal)
            const nepal = normalizedCountries.find((c: Country) => c.name.toLowerCase() === "nepal" || c.id === 156)
            if (nepal) {
              setSelectedCountryId(nepal.id)
              const requestedProvince = nepal.provinces?.find((province: Province) => province.id === 3891)
              if (!defaultProvince && requestedProvince) setSelectedProvinceId(requestedProvince.id)
            }

            let resolvedProvince: Province | undefined
            if (defaultProvince) {
              const cleanDefault = String(defaultProvince).toLowerCase().replace(/province/gi, "").replace(/state/gi, "").replace(/no\./gi, "").trim();
              resolvedProvince = normalizedCountries.flatMap((c: Country) => c.provinces || []).find((p: Province) => {
                const cleanName = p.name.toLowerCase().replace(/province/gi, "").replace(/state/gi, "").replace(/no\./gi, "").trim();
                return cleanName === cleanDefault || cleanName.includes(cleanDefault) || cleanDefault.includes(cleanName);
              })
            }
            resolvedProvince ||= nepal?.provinces?.find((province: Province) => province.id === 3891) || nepal?.provinces?.[0]
            if (resolvedProvince) {
              setSelectedProvinceId(resolvedProvince.id)
              setSelectedCountryId(resolvedProvince.country_id)
            }
          } else {
            toast.error("Failed to load countries")
          }
        } catch (error) {
          console.error("Error fetching countries:", error)
          toast.error("Error loading countries")
        } finally {
          setLoadingCountries(false)
        }
      }
      fetchCountries()
    }
  }, [open, defaultProvince])

  useEffect(() => {
    if (!selectedStb) {
      setNettvPackageConfigs([])
      setSelectedPackageSaleId("")
      return
    }
    ServicesAPI.getNetTVPackageConfigs(selectedStb).then((response: any) => {
      const payload = response?.data
      const groups = Array.isArray(payload) ? payload : (payload?.data || payload?.items || payload?.packages || [])
      setNettvPackageConfigs(groups.flatMap((group: any) => {
        const sales = Array.isArray(group?.package_for_sale) ? group.package_for_sale : []
        return sales.length ? sales.map((sale: any) => ({ ...sale, package_type: group.type, package_name: group.name })) : [group]
      }))
    }).catch(() => setNettvPackageConfigs([]))
  }, [selectedStb])

  // Update provinces when country changes
  useEffect(() => {
    if (selectedCountryId) {
      const country = countries.find(c => c.id === selectedCountryId)
      const nextProvinces = country?.provinces || []
      setProvinces(nextProvinces)
      if (!nextProvinces.some(province => province.id === selectedProvinceId)) {
        setSelectedProvinceId(selectedCountryId === 156 ? (nextProvinces.find(province => province.id === 3891)?.id || nextProvinces[0]?.id || null) : (nextProvinces[0]?.id || null))
      }
    } else {
      setProvinces([])
    }
  }, [selectedCountryId, countries])

  // Validate name fields (only alphabets)
  const validateName = (value: string): boolean => {
    return /^[A-Za-z]*$/.test(value)
  }

  const handleFnameChange = (value: string) => {
    if (validateName(value) || value === "") {
      setFname(value)
      setNameErrors(prev => ({ ...prev, fname: "" }))
    } else {
      setNameErrors(prev => ({ ...prev, fname: "Only alphabetic characters allowed" }))
    }
  }

  const handleLnameChange = (value: string) => {
    if (validateName(value) || value === "") {
      setLname(value)
      setNameErrors(prev => ({ ...prev, lname: "" }))
    } else {
      setNameErrors(prev => ({ ...prev, lname: "Only alphabetic characters allowed" }))
    }
  }

  // Populate defaults when dialog opens
  useEffect(() => {
    if (open) {
      setUsername(buildNettvCredential(defaultUsername || defaultEmail))
      setPassword(defaultPassword || "")
      setEmail(defaultEmail)
      setFname(defaultFname)
      setLname(defaultLname)
      setAddress(defaultAddress)
      setCity(defaultCity)
      setDistrict(defaultDistrict)
      setPhoneNo(defaultPhone)
      setMobileNo(defaultMobile)
      setLongitude(defaultLng)
      setLatitude(defaultLat)
      setSelectedCountryId(156)
      setSelectedProvinceId(3891)
      setNameErrors({ fname: "", lname: "" })
      setDocuments([])
    }
  }, [open, defaultFname, defaultLname, defaultEmail, defaultUsername, defaultPassword, defaultAddress, defaultCity, defaultDistrict, defaultPhone, defaultMobile, defaultLat, defaultLng])

  const handleConfirm = () => {
    // Validate required fields
    if (!username || !email || !password || !fname || !lname || !address || !city || !district || !selectedCountryId || !selectedProvinceId || !phone_no || !mobile_no) {
      toast.error("Please fill all required fields")
      return
    }
    if (nameErrors.fname || nameErrors.lname) {
      toast.error("Please fix name errors")
      return
    }

    // Find selected country and province names
    const country = countries.find(c => c.id === selectedCountryId)
    const province = provinces.find(p => p.id === selectedProvinceId)

    // Build documents array (strip preview fields before sending)
    const docsPayload = documents.map(({ type, data, mime_type, extension, size }) => ({
      type, data, mime_type, extension, size
    }))

    const payload: any = {
      username: buildNettvCredential(username),
      password,
      email: email.trim(),
      status: "0", // active
      fname: fname.trim(),
      mname: mname.trim(),
      lname: lname.trim(),
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      province: province?.id || "",
      country: country?.id || "",
      phone_no,
      mobile_no,
      longitude: longitude || "0",
      latitude: latitude || "0",
      website,
      provisioning: selectedStb ? {
        stb: { serial: selectedStb, status: "1" },
        package: selectedPackageSaleId ? {
          pos: "web",
          created_by: username,
          payment_gateway: "reseller_wallet",
          packages: [{ package_sale_id: Number(selectedPackageSaleId), qty: packageQty }],
          send_mail: 0,
        } : null,
      } : undefined,
    }
    if (docsPayload.length > 0) {
      payload.documents = docsPayload
    }
    onConfirm(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{nettvSubscriberRegistered ? "NETTV Device & Subscription Provisioning" : "Configure NETTV Service"}</DialogTitle>
          <DialogDescription>
            {nettvSubscriberRegistered ? `Subscriber ${buildNettvCredential(username)} is registered. Link the customer's STB and assign a subscription package.` : "Enter the NETTV subscriber details. Fields marked * are required."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!nettvSubscriberRegistered && <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nettvUsername">Username *</Label>
              <Input
                id="nettvUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvPassword">Password *</Label>
              <Input
                id="nettvPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nettvEmail">Email *</Label>
            <Input
              id="nettvEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nettvFname">First Name *</Label>
              <Input
                id="nettvFname"
                value={fname}
                onChange={(e) => handleFnameChange(e.target.value)}
                placeholder="John"
                className={nameErrors.fname ? "border-red-500" : ""}
              />
              {nameErrors.fname && <p className="text-xs text-red-500">{nameErrors.fname}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvMname">Middle Name</Label>
              <Input
                id="nettvMname"
                value={mname}
                onChange={(e) => setMname(e.target.value)}
                placeholder="(optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvLname">Last Name *</Label>
              <Input
                id="nettvLname"
                value={lname}
                onChange={(e) => handleLnameChange(e.target.value)}
                placeholder="Doe"
                className={nameErrors.lname ? "border-red-500" : ""}
              />
              {nameErrors.lname && <p className="text-xs text-red-500">{nameErrors.lname}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nettvAddress">Address *</Label>
            <Input
              id="nettvAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nettvCity">City *</Label>
              <Input
                id="nettvCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kathmandu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvDistrict">District *</Label>
              <Input
                id="nettvDistrict"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kathmandu"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nettvCountry">Country *</Label>
              <Select value={selectedCountryId?.toString() || "156"} onValueChange={(value) => setSelectedCountryId(Number(value))} disabled={loadingCountries}>
                <SelectTrigger id="nettvCountry"><SelectValue placeholder={loadingCountries ? "Loading countries..." : "Select country"} /></SelectTrigger>
                <SelectContent>{countries.map(country => <SelectItem key={country.id} value={String(country.id)}>{country.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvProvince">Province *</Label>
              <Select value={selectedProvinceId?.toString() || (selectedCountryId === 156 ? "3891" : "")} onValueChange={(value) => setSelectedProvinceId(Number(value))} disabled={!selectedCountryId || loadingCountries}>
                <SelectTrigger id="nettvProvince"><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>{provinces.map(province => <SelectItem key={province.id} value={String(province.id)}>{province.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nettvPhone">Phone (Landline) *</Label>
              <Input
                id="nettvPhone"
                value={phone_no}
                onChange={(e) => setPhoneNo(e.target.value)}
                placeholder="01-1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvMobile">Mobile *</Label>
              <Input
                id="nettvMobile"
                value={mobile_no}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="9812345678"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nettvLongitude">Longitude</Label>
              <Input
                id="nettvLongitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="85.3240"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nettvLatitude">Latitude</Label>
              <Input
                id="nettvLatitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="27.7172"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nettvWebsite">Website</Label>
            <Input
              id="nettvWebsite"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          </>}

          {nettvSubscriberRegistered && <div className="space-y-4 rounded-lg border p-4">
            <div>
              <Label className="text-base font-semibold">Set-Top Box (STB) & Service Provisioning</Label>
              <p className="text-xs text-muted-foreground">Optionally link an available STB and assign its package during subscriber provisioning.</p>
              {nettvResellerBalance !== null && <p className="mt-1 text-sm font-medium text-emerald-600">Reseller wallet: Rs. {nettvResellerBalance.toFixed(2)}</p>}
            </div>
            <div className="space-y-2">
              <Label>Select Linked STB</Label>
              <select value={selectedStb} onChange={event => setSelectedStb(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">No STB</option>
                {nettvStbs.map((stb: any) => {
                  const serial = String(stb.serial || stb.mac || stb.serial_number || "")
                  return <option key={serial} value={serial}>{serial} · {stb.model?.name || stb.model_name || stb.vendor?.name || "Default"}</option>
                })}
              </select>
            </div>
            {selectedStb && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assign Subscription Package</Label>
                <select value={selectedPackageSaleId} onChange={event => setSelectedPackageSaleId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Select package configuration</option>
                  {nettvPackageConfigs.map((pkg: any, index: number) => {
                    const id = String(pkg.package_sale_id || pkg.sale_id || pkg.id || "")
                    const label = pkg.display_name || pkg.name || pkg.package_name || pkg.title || `Package #${id}`
                    const price = pkg.price_with_vat ?? pkg.package_price ?? pkg.price
                    return <option key={`${id}-${index}`} value={id}>{label}{price !== undefined ? ` · Rs. ${price}` : ""}{pkg.package_type ? ` · ${String(pkg.package_type).replace(/_/g, " ")}` : ""}</option>
                  })}
                </select>
              </div>
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={packageQty} onChange={event => setPackageQty(Math.max(1, Number(event.target.value) || 1))} /></div>
            </div>}
          </div>}

          {/* Document Upload Section */}
          {!nettvSubscriberRegistered && <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Documents</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Upload identity documents (images only, max 5MB each)</p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={uploadingDoc}>
                  <span>{uploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Add Document</span>
                </Button>
              </label>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-md border bg-muted/30 p-2">
                    {doc.previewUrl && (
                      <img
                        src={doc.previewUrl}
                        alt={doc.fileName || "document"}
                        className="h-12 w-12 rounded object-cover border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{doc.fileName || `document.${doc.extension}`}</div>
                      <div className="text-xs text-muted-foreground">{doc.extension.toUpperCase()} · {Math.round(Number(doc.size) / 1024)} KB</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeDocument(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {documents.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-md">
                No documents uploaded. Click "Add Document" to upload an image.
              </div>
            )}
          </div>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleConfirm}>{nettvSubscriberRegistered ? "Assign STB & Package" : "Create Subscriber"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Import ACS WAN Component ====================
import { TR069DeviceWanConnections } from "@/components/tr069/device-wan-connections"

// ==================== Main Component ====================
export function AddCustomerForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showProvisionSection, setShowProvisionSection] = useState(false)
  const [createdCustomer, setCreatedCustomer] = useState<any>(null)
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  const [isFree, setIsFree] = useState(false)
  const [freeCustomerSecretKey, setFreeCustomerSecretKey] = useState("")
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [typedSecretKey, setTypedSecretKey] = useState("")
  const [systemSecretKey, setSystemSecretKey] = useState("admin123")
  const [freeCustomerUnlocked, setFreeCustomerUnlocked] = useState(false)

  const roleStr = typeof user?.role === 'string' ? user.role : (user?.role?.name || '')
  const normalizedRole = roleStr.toLowerCase()
  const isAdmin = normalizedRole === "admin" || normalizedRole === "isp_admin" || normalizedRole === "administrator" || normalizedRole.startsWith("global ");

  const handleVerifySecretKey = useCallback(() => {
    if (typedSecretKey === systemSecretKey) {
      setFreeCustomerSecretKey(typedSecretKey)
      setFreeCustomerUnlocked(true)
      setIsFree(true)
      setShowSecretModal(false)
      toast.success("Free Customer feature unlocked!")
    } else {
      toast.error("Invalid verification key.")
    }
  }, [typedSecretKey, systemSecretKey])

  // Listen to keyboard shortcut (Ctrl + Z) or (Ctrl + Alt + F) to toggle the secret modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === "z" || e.key === "Z")) ||
        (e.ctrlKey && e.altKey && (e.key === "f" || e.key === "F"))) {
        e.preventDefault()
        setShowSecretModal(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Load the free customer secret key from settings if the user is admin
  useEffect(() => {
    if (isAdmin) {
      apiRequest<Record<string, string>>("/settings")
        .then((data) => {
          if (data && data.freeCustomerSecretKey) {
            setSystemSecretKey(data.freeCustomerSecretKey)
          }
        })
        .catch((err) => console.warn("Failed to load settings secret key:", err))
    }
  }, [isAdmin])

  // ========== Data State ==========
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedServicePlanId, setSelectedServicePlanId] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [existingISPs, setExistingISPs] = useState<ExistingISP[]>([])
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([])
  const [olts, setOlts] = useState<OLT[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>([])

  const [loading, setLoading] = useState({
    packages: true,
    users: true,
    memberships: true,
    existingISPs: true,
    customerTypes: true,
    olts: true,
    splitters: true,
    services: true,
  })

  // ========== Lead Search ==========
  const [leadSearchQuery, setLeadSearchQuery] = useState("")
  const [leadSearchResults, setLeadSearchResults] = useState<LeadSearchResult[]>([])
  const [isSearchingLead, setIsSearchingLead] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null) // full lead detail
  const [loadingLeadDetails, setLoadingLeadDetails] = useState(false)
  const urlLeadLoadAttemptRef = useRef<string | null>(null)

  // ========== Form State ==========
  const [formValues, setFormValues] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    secondaryPhone: "",
    gender: "male",
    streetAddress: "",
    city: "",
    district: "",
    state: "",
    zipCode: "",
    idNumber: "",
    panNumber: "",          // PAN for account billing
    fullAddress: "",
  })

  const [coordinates, setCoordinates] = useState({
    lat: "",
    lon: "",
  })

  const [serviceDetails, setServiceDetails] = useState({
    connectionType: "fiber", // fiber, wireless, infra_share
    subscribedPkgId: "",
  })
  useEffect(() => {
    const selected = packages.find(pkg => String(pkg.id) === serviceDetails.subscribedPkgId)
    if (selected) setSelectedServicePlanId(String(selected.planId))
  }, [packages, serviceDetails.subscribedPkgId])

  const [provisionDetails, setProvisionDetails] = useState({
    oltId: "",
    splitterId: "",
    oltPort: "",
    splitterPort: "",
    useSplitter: true,
    useDirectOLT: false,
    selectedVlanIds: [] as string[],
    selectedProfileIds: [] as string[],
    loadOntConfig: false,
    selectedLoadFileId: "",
  })

  const [referenceDetails, setReferenceDetails] = useState({
    membershipId: "",
    installedById: "",
    customerTypeId: "",
    isReferenced: false,
    referencedById: "",
    existingISPId: "",
    leadId: "",
  })

  // Devices
  const [devices, setDevices] = useState<CustomerDevice[]>([])
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [editingDeviceIndex, setEditingDeviceIndex] = useState<number | null>(null)

  // Wireless Credentials
  const [wirelessCredentials, setWirelessCredentials] = useState<Array<{ username: string; password: string }>>([
    { username: "", password: "" },
  ])
  const [customerLogin, setCustomerLogin] = useState({
    username: "",
    password: "",
  })

  // Add‑on services selection (after customer creation)
  const [selectedAddonServices, setSelectedAddonServices] = useState<Set<string>>(new Set()) // "TSHUL", "RADIUS", "NETTV"
  const [nasOptions, setNasOptions] = useState<any[]>([])
  const [selectedNasId, setSelectedNasId] = useState("")
  const [accountBillingDialogOpen, setAccountBillingDialogOpen] = useState(false)
  const [nettvDialogOpen, setNettvDialogOpen] = useState(false)
  const [nettvData, setNettvData] = useState<any>(null)

  useEffect(() => {
    apiRequest<any[]>("/nas")
      .then((list) => {
        const active = (Array.isArray(list) ? list : []).filter(nas => nas.isActive && !nas.isDeleted)
        setNasOptions(active)
        const preferred = active.find(nas => nas.isDefault) || (active.length === 1 ? active[0] : null)
        setSelectedNasId(preferred ? String(preferred.id) : "")
      })
      .catch(() => setNasOptions([]))
  }, [])

  // Track service provision results for retry
  const [serviceProvisionResults, setServiceProvisionResults] = useState<Array<{
    service: string
    success: boolean
    message?: string
    data?: any
  }>>([])

  const [documents, setDocuments] = useState<DocumentFile[]>([
    { file: null, type: "idProof", name: "ID Proof" },
    { file: null, type: "addressProof", name: "Address Proof" },
    { file: null, type: "photo", name: "Photo" },
    { file: null, type: "other", name: "Other Documents" },
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // ========== Map & Location State ==========
  const [mapPosition, setMapPosition] = useState<[number, number]>([27.7172, 85.3240])
  const [nearestSplitters, setNearestSplitters] = useState<Splitter[]>([])
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null)
  const [serviceRadius, setServiceRadius] = useState<number>(0.1)
  const [currentLocationAddress, setCurrentLocationAddress] = useState<string>("")
  const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false)

  // Search location state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [searching, setSearching] = useState(false)

  // ========== Autofind ONT State ==========
  const [discoveredOnts, setDiscoveredOnts] = useState<any[]>([])
  const [isAutoFinding, setIsAutoFinding] = useState(false)
  const [autoFindError, setAutoFindError] = useState<string | null>(null)
  const [selectedDiscoveredOnt, setSelectedDiscoveredOnt] = useState<any | null>(null)
  const [matchedDeviceForOnt, setMatchedDeviceForOnt] = useState<CustomerDevice | null>(null)

  // Set mounted state
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ========== Helper Functions for Splitter Hierarchy ==========
  const findUltimateOltForSplitter = useCallback((splitterId: string): OLT | null => {
    if (!splitterId) return null

    const findRootSplitter = (id: string): Splitter | null => {
      const splitter = splitters.find(s => s.id.toString() === id)
      if (!splitter) return null
      if (!splitter.masterSplitterId) return splitter
      const parent = splitters.find(s => s.splitterId === splitter.masterSplitterId)
      if (!parent) return splitter
      return findRootSplitter(parent.id.toString())
    }

    const rootSplitter = findRootSplitter(splitterId)
    if (!rootSplitter) return null

    const oltId = rootSplitter.connectedServiceBoard?.oltId || rootSplitter.olt?.id?.toString()
    if (!oltId) return null

    return olts.find(o => o.id.toString() === oltId) || null
  }, [splitters, olts])

  const getSplitterPath = useCallback((splitterId: string): Splitter[] => {
    const path: Splitter[] = []
    let current = splitters.find(s => s.id.toString() === splitterId)
    while (current) {
      path.push(current)
      if (!current.masterSplitterId) break
      const currentSplitter = current
      const parent = splitters.find(s => s.splitterId === currentSplitter.masterSplitterId)
      if (!parent) break
      current = parent
    }
    return path
  }, [splitters])

  // ========== Effects ==========
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading({
          packages: true,
          users: true,
          memberships: true,
          existingISPs: true,
          customerTypes: true,
          olts: true,
          splitters: true,
          services: true,
        })

        const fetchExistingISPs = async () => {
          try {
            const response = await apiRequest("/existingisp")
            if (response && response.success) {
              return response.data || []
            } else {
              console.error("Failed to fetch existing ISPs:", response?.error)
              return []
            }
          } catch (error) {
            console.error("Error fetching existing ISPs:", error)
            return []
          }
        }

        const [packagesData, usersData, membershipsData, existingISPsData, customerTypesData, oltsData, splittersData, servicesData] =
          await Promise.all([
            apiRequest("/package-price").catch(() => []),
            apiRequest("/users").catch(() => []),
            apiRequest("/membership").catch(() => []),
            fetchExistingISPs(),
            apiRequest("/customer-types").catch(() => []),
            apiRequest("/olt?limit=1000").catch(() => []),
            apiRequest("/splitters?limit=1000").catch(() => []),
            apiRequest("/services/isp").catch(() => ({ data: [] })),
          ])

        setPackages(Array.isArray(packagesData) ? packagesData : [])
        setUsers(Array.isArray(usersData)
          ? usersData.filter((user: User) => user.role?.name?.trim().toLowerCase() !== "customer")
          : [])
        setMemberships(Array.isArray(membershipsData) ? membershipsData : [])
        setExistingISPs(Array.isArray(existingISPsData) ? existingISPsData : [])
        setCustomerTypes(Array.isArray(customerTypesData) ? customerTypesData : (Array.isArray(customerTypesData?.data) ? customerTypesData.data : []))
        setOlts(Array.isArray(oltsData?.data) ? oltsData.data : [])
        setSplitters(Array.isArray(splittersData?.data) ? splittersData.data : [])
        setServicesCatalog(Array.isArray(servicesData?.data)
          ? servicesData.data.map((entry: any) => ({ ...entry.service, config: entry.config || null }))
          : [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading({
          packages: false,
          users: false,
          memberships: false,
          existingISPs: false,
          customerTypes: false,
          olts: false,
          splitters: false,
          services: false,
        })
      }
    }

    fetchAllData()
  }, [])

  // Lead search
  const searchLeads = useCallback(async (query: string) => {
    if (!query.trim()) {
      setLeadSearchResults([])
      return
    }

    setIsSearchingLead(true)
    try {
      const response = await apiRequest(`/lead?search=${encodeURIComponent(query)}&limit=10&status=qualified`)
      if (response.success && response.data) {
        setLeadSearchResults(response.data)
      } else {
        setLeadSearchResults([])
      }
    } catch (error) {
      console.error("Lead search error:", error)
      toast.error("Failed to search leads")
    } finally {
      setIsSearchingLead(false)
    }
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (leadSearchQuery) {
        searchLeads(leadSearchQuery)
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [leadSearchQuery, searchLeads])

  useEffect(() => {
    if (!referenceDetails.customerTypeId && customerTypes.length > 0) {
      setReferenceDetails(current => ({ ...current, customerTypeId: String(customerTypes[0].id) }))
    }
  }, [customerTypes, referenceDetails.customerTypeId])

  // Fetch full lead details with status check
  const fetchLeadDetails = useCallback(async (leadId: number) => {
    setLoadingLeadDetails(true)
    try {
      const response = await apiRequest(`/lead/${leadId}`)

      let lead: any
      if (response?.success && response?.data) {
        lead = response.data
      } else if (response?.id) {
        lead = response
      } else {
        toast.error("Failed to load lead details")
        return
      }

      // Check lead status
      if (lead.status === "converted" || lead.convertedToCustomer === true) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Lead Already Converted</span>
            <span className="text-sm">This lead has already been converted to a customer and cannot be processed further.</span>
            {lead.convertedAt && (
              <span className="text-xs mt-1">Converted on: {new Date(lead.convertedAt).toLocaleDateString()}</span>
            )}
          </div>,
          { duration: 5000 }
        )
        setLoadingLeadDetails(false)
        setSelectedLead(null)
        return
      }

      if (lead.status !== "qualified") {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Lead Not Qualified</span>
            <span className="text-sm">
              Lead status is "{lead.status}". Only qualified leads can be converted to customers.
            </span>
            <span className="text-xs mt-1">Please update the lead status to "qualified" in the lead management section.</span>
          </div>,
          { duration: 5000 }
        )
        setLoadingLeadDetails(false)
        setSelectedLead(null)
        return
      }

      const genderMap: Record<string, string> = {
        MALE: "male",
        FEMALE: "female",
        OTHER: "other",
      }

      let lat = ""
      let lon = ""
      const leadLatitude = lead.metadata?.latitude ?? lead.latitude ?? lead.lat ?? lead.location?.latitude
      const leadLongitude = lead.metadata?.longitude ?? lead.longitude ?? lead.lon ?? lead.lng ?? lead.location?.longitude
      if (leadLatitude !== undefined && leadLatitude !== null) lat = String(leadLatitude)
      if (leadLongitude !== undefined && leadLongitude !== null) lon = String(leadLongitude)

      setFormValues({
        firstName: lead.firstName || "",
        middleName: lead.middleName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        phoneNumber: lead.phoneNumber || "",
        secondaryPhone: lead.secondaryContactNumber || "",
        gender: genderMap[lead.gender || ""] || "male",
        streetAddress: lead.street || "",
        city: lead.city || "",
        district: lead.district || "",
        state: lead.province || "",
        zipCode: lead.zipCode || "",
        idNumber: "",
        panNumber: "",
        fullAddress: lead.metadata?.fullAddress || "",
      })

      setCoordinates({ lat, lon })
      if (lat && lon) {
        setMapPosition([parseFloat(lat), parseFloat(lon)])
      }

      // Pre‑fill subscribed package from lead's interestedPackageId
      if (lead.interestedPackageId) {
        setServiceDetails(prev => ({ ...prev, subscribedPkgId: String(lead.interestedPackageId) }))
      }

      setReferenceDetails((prev) => ({
        ...prev,
        leadId: String(lead.id),
        membershipId: lead.memberShipId ? String(lead.memberShipId) : "",
        installedById: lead.assignedUserId ? String(lead.assignedUserId) : "",
      }))

      setSelectedLead(lead)
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Qualified Lead Loaded</span>
          <span className="text-sm">Lead is ready for customer conversion.</span>
        </div>
      )
    } catch (error) {
      console.error("Error fetching lead details:", error)
      toast.error("Error loading lead details")
    } finally {
      setLoadingLeadDetails(false)
    }
  }, [])

  const handleLeadSelect = useCallback((lead: LeadSearchResult) => {
    setLeadSearchQuery("")
    setLeadSearchResults([])
    setShowProvisionSection(false)
    setCreatedCustomer(null)
    fetchLeadDetails(lead.id)
  }, [fetchLeadDetails])

  useEffect(() => {
    if (typeof window === "undefined") return
    const leadId = new URLSearchParams(window.location.search).get("leadId")
    if (!leadId || selectedLead || loadingLeadDetails || urlLeadLoadAttemptRef.current === leadId) return

    const numericLeadId = Number(leadId)
    if (!Number.isFinite(numericLeadId)) return

    // A converted or invalid lead intentionally leaves selectedLead empty. Track
    // the URL attempt separately so the loading-state transition cannot trigger
    // an endless request/toast loop for that same lead.
    urlLeadLoadAttemptRef.current = leadId
    setShowProvisionSection(false)
    setCreatedCustomer(null)
    fetchLeadDetails(numericLeadId)
  }, [selectedLead, loadingLeadDetails, fetchLeadDetails])

  // ========== Map Functions ==========
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const findNearestSplitters = useCallback((lat: number, lng: number, maxDistanceKm: number = 5) => {
    if (!lat || !lng) return []

    const splittersWithDistance = splitters
      .filter((s) => s.location?.latitude && s.location?.longitude)
      .map((s) => {
        const distance = calculateDistance(lat, lng, s.location!.latitude!, s.location!.longitude!)
        return { ...s, distance }
      })
      .filter((s) => s.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)

    return splittersWithDistance
  }, [splitters])

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setReverseGeocodingLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      if (data.display_name) {
        setCurrentLocationAddress(data.display_name)
      } else {
        setCurrentLocationAddress("Location details not available")
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      setCurrentLocationAddress("Unable to get location details")
    } finally {
      setReverseGeocodingLoading(false)
    }
  }, [])

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    if (selectedLead) return
    setCoordinates({ lat: lat.toString(), lon: lng.toString() })
    setMapPosition([lat, lng])

    const nearest = findNearestSplitters(lat, lng, serviceRadius)
    setNearestSplitters(nearest)
    const available = nearest.some((s) => s.distance <= serviceRadius)
    setServiceAvailable(available)

    await reverseGeocode(lat, lng)
  }, [findNearestSplitters, serviceRadius, reverseGeocode, selectedLead])

  const handleMarkerDragEnd = useCallback(async (lat: number, lng: number) => {
    if (selectedLead) return
    setCoordinates({ lat: lat.toString(), lon: lng.toString() })
    setMapPosition([lat, lng])

    const nearest = findNearestSplitters(lat, lng, serviceRadius)
    setNearestSplitters(nearest)
    const available = nearest.some((s) => s.distance <= serviceRadius)
    setServiceAvailable(available)

    await reverseGeocode(lat, lng)
  }, [findNearestSplitters, serviceRadius, reverseGeocode, selectedLead])

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      toast.error("Please enter a location to search")
      return
    }
    if (selectedLead) return

    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=np`
      )
      const data: GeocodingResult[] = await response.json()

      if (data.length > 0) {
        setSearchResults(data)
        toast.success(`Found ${data.length} location${data.length > 1 ? "s" : ""}`)
      } else {
        setSearchResults([])
        toast.error("No locations found")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to search location")
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [selectedLead])

  const handleSelectSearchResult = useCallback((result: GeocodingResult) => {
    if (selectedLead) return
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)

    setCoordinates({ lat: lat.toString(), lon: lng.toString() })
    setMapPosition([lat, lng])

    setFormValues((prev) => ({
      ...prev,
      streetAddress: result.address?.road || "",
      city: result.address?.city || result.address?.county || "",
      district: result.address?.state_district || "",
      state: result.address?.state || "",
      fullAddress: result.display_name,
    }))

    setCurrentLocationAddress(result.display_name)

    const nearest = findNearestSplitters(lat, lng, serviceRadius)
    setNearestSplitters(nearest)
    const available = nearest.some((s) => s.distance <= serviceRadius)
    setServiceAvailable(available)

    setSearchResults([])
    setSearchQuery("")
    toast.success(`Location set to: ${result.display_name.split(",")[0]}`)
  }, [findNearestSplitters, serviceRadius, selectedLead])

  useEffect(() => {
    if (coordinates.lat && coordinates.lon) {
      const lat = parseFloat(coordinates.lat)
      const lng = parseFloat(coordinates.lon)
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapPosition([lat, lng])
        const nearest = findNearestSplitters(lat, lng, serviceRadius)
        setNearestSplitters(nearest)
        const available = nearest.some((s) => s.distance <= serviceRadius)
        setServiceAvailable(available)
      }
    }
  }, [coordinates, serviceRadius, findNearestSplitters])

  const getCurrentLocation = useCallback(() => {
    if (selectedLead) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationSelect(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          toast.error(`Location error: ${error.message}`)
        }
      )
    } else {
      toast.error("Geolocation is not supported by this browser")
    }
  }, [handleLocationSelect, selectedLead])

  // ========== Input Handlers ==========
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormValues((prev) => ({ ...prev, [id]: value }))
    setTouched((prev) => ({ ...prev, [id]: true }))
    setErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const handleServiceChange = useCallback((field: string, value: string) => {
    setServiceDetails((prev) => ({ ...prev, [field]: value }))
    if (field === "connectionType" && value !== "fiber") {
      setProvisionDetails((prev) => ({
        ...prev,
        oltId: "",
        splitterId: "",
        oltPort: "",
        splitterPort: "",
        selectedVlanIds: [],
        selectedProfileIds: [],
      }))
      setSelectedDiscoveredOnt(null)
      setMatchedDeviceForOnt(null)
      setAutoFindError(null)
    }
  }, [])

  const handleProvisionChange = useCallback((field: string, value: string | boolean | string[]) => {
    setProvisionDetails((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleReferenceChange = useCallback((field: string, value: string | boolean) => {
    setReferenceDetails((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleCoordinateChange = useCallback((field: "lat" | "lon", value: string) => {
    if (selectedLead) return
    setCoordinates((prev) => ({ ...prev, [field]: value }))
  }, [selectedLead])

  // Device management
  const addDevice = useCallback((device: CustomerDevice) => {
    setDevices(prev => [...prev, device])
  }, [])

  const updateDevice = useCallback((index: number, device: CustomerDevice) => {
    setDevices(prev => {
      const updated = [...prev]
      updated[index] = device
      return updated
    })
  }, [])

  const removeDevice = useCallback((index: number) => {
    setDevices(prev => prev.filter((_, i) => i !== index))
  }, [])

  const openDeviceDialogForEdit = useCallback((index: number) => {
    setEditingDeviceIndex(index)
    setDeviceDialogOpen(true)
  }, [])

  const handleDeviceSave = useCallback((device: CustomerDevice) => {
    if (editingDeviceIndex !== null) {
      updateDevice(editingDeviceIndex, device)
      setEditingDeviceIndex(null)
    } else {
      addDevice(device)
    }
  }, [editingDeviceIndex, addDevice, updateDevice])

  // Wireless Credentials management
  const addCredential = useCallback(() => {
    setWirelessCredentials(prev => [...prev, { username: "", password: "" }])
  }, [])

  const removeCredential = useCallback((index: number) => {
    setWirelessCredentials(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateCredential = useCallback((index: number, field: "username" | "password", value: string) => {
    setWirelessCredentials(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }, [])

  // Document upload
  const handleDocumentUpload = useCallback((index: number, file: File | null) => {
    setDocuments((prev) => {
      const updated = [...prev]
      updated[index].file = file
      return updated
    })
  }, [])

  // ========== Autofind ONT Function ==========
  const handleAutoFindOnt = useCallback(async () => {
    if (!provisionDetails.oltId) {
      toast.error("Please select an OLT first");
      return;
    }

    let frame: number, slot: number, port: number;

    if (provisionDetails.useSplitter) {
      if (!provisionDetails.splitterId) {
        toast.error("Please select a splitter first");
        return;
      }

      const selectedSplitter = splitters.find(s => s.id.toString() === provisionDetails.splitterId);
      const ultimateOlt = findUltimateOltForSplitter(provisionDetails.splitterId);
      const path = getSplitterPath(provisionDetails.splitterId);
      const boardPortStr = resolveSplitterBoardPort(path);

      if (!boardPortStr) {
        toast.error("Unable to determine board port from splitter");
        return;
      }

      const parts = boardPortStr.split('/').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) {
        toast.error(`Invalid board port format from splitter: ${boardPortStr}`);
        return;
      }
      [frame, slot, port] = parts;
    } else {
      // Direct OLT mode
      if (!provisionDetails.oltPort) {
        toast.error("Please enter the OLT port (frame/slot/port) for direct connection");
        return;
      }
      const parts = provisionDetails.oltPort.split('/').map(Number);
      if (parts.length !== 3 || parts.some(isNaN)) {
        toast.error("OLT port must be in format frame/slot/port (e.g., 0/0/1)");
        return;
      }
      [frame, slot, port] = parts;
    }

    setIsAutoFinding(true);
    setAutoFindError(null);
    setDiscoveredOnts([]);
    setSelectedDiscoveredOnt(null);
    setMatchedDeviceForOnt(null);

    try {
      const response = await apiRequest(`/device/${provisionDetails.oltId}/action`, {
        method: "POST",
        body: JSON.stringify({
          action: "autofind",
          params: [frame, slot, port],
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.success && response.data) {
        setDiscoveredOnts(response.data);
      } else {
        setAutoFindError(response.error || "Failed to discover ONTs");
      }
    } catch (error) {
      setAutoFindError("Error during autofind");
    } finally {
      setIsAutoFinding(false);
    }
  }, [provisionDetails.oltId, provisionDetails.useSplitter, provisionDetails.splitterId, provisionDetails.oltPort, splitters, findUltimateOltForSplitter, getSplitterPath]);

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

  // When user selects a discovered ONT from dropdown, check for match
  const handleSelectDiscoveredOnt = useCallback((ontId: string) => {
    const ont = discoveredOnts.find(o => o.ont_id_details === ontId)
    setSelectedDiscoveredOnt(ont)

    if (!ont) {
      setMatchedDeviceForOnt(null)
      return
    }

    if (!devices.length) {
      setMatchedDeviceForOnt(null)
      toast.error("No devices added. Please add a device first.")
      return
    }

    const selectedSplitter = splitters.find(s => s.id.toString() === provisionDetails.splitterId)
    const ultimateOlt = findUltimateOltForSplitter(provisionDetails.splitterId)
    const boardType = selectedSplitter?.connectedServiceBoard?.boardType || ultimateOlt?.serviceBoards?.[0]?.type
    const isEpon = boardType?.toUpperCase().includes("EPON")

    const ontIdentifier = ont.ont_id_details  // e.g., "414C434CB2C804B0" for GPON
    const normalizedOnt = normalizeIdentifier(ontIdentifier)

    // Try to match with any added ONT device
    for (const device of devices) {
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
        setSelectedDiscoveredOnt((prev: any) => ({ ...prev, ont_id: ont.ont_id }))
        toast.success(`Matched with device: ${device.brand} ${device.model}`)
        return
      }

      if (isEpon) {
        // EPON: match by MAC
        const normalizedMac = normalizeIdentifier(device.macAddress)
        if (normalizedMac && normalizedMac === normalizedOnt) {
          setMatchedDeviceForOnt(device)
          setSelectedDiscoveredOnt((prev: any) => ({ ...prev, ont_id: ont.ont_id }))
          toast.success(`Matched with device: ${device.brand} ${device.model}`)
          return
        }
      } else {
        // GPON: match by serialNumber or ponSerial after converting to hex
        const deviceSerialHex = convertToPonHex(device.serialNumber || "")
        const devicePonHex = convertToPonHex(device.ponSerial || "")
        if ((devicePonHex && devicePonHex === ontIdentifier) || (deviceSerialHex && deviceSerialHex === ontIdentifier)) {
          setMatchedDeviceForOnt(device)
          setSelectedDiscoveredOnt((prev: any) => ({ ...prev, ont_id: ont.ont_id }))
          toast.success(`Matched with device: ${device.brand} ${device.model}`)
          return
        }
      }
    }

    // No match found
    setMatchedDeviceForOnt(null)
    toast.error("No matching device found")
  }, [devices, provisionDetails.splitterId, splitters, findUltimateOltForSplitter, discoveredOnts, convertToPonHex])

  // Helper to get serial for OLT registration
  const getOntSerialForRegistration = useCallback((device: CustomerDevice, isEpon: boolean): string => {
    if (isEpon) {
      // EPON: use MAC address without dots
      return device.macAddress
    } else {
      const ponSerial = device.ponSerial || device.serialNumber
      return device.ponVendorIdIncluded === false ? ponSerial.toUpperCase() : convertToPonHex(ponSerial)
    }
  }, [convertToPonHex])

  // OLT Provisioning function
  const registerOntOnOlt = useCallback(async (): Promise<boolean> => {
    if (serviceDetails.connectionType !== "fiber") return true
    if (!provisionDetails.oltId) {
      toast.error("No OLT selected")
      return false
    }
    if (!matchedDeviceForOnt || !selectedDiscoveredOnt) {
      toast.error("No matched ONT device")
      return false
    }

    const selectedOlt = olts.find(o => o.id.toString() === provisionDetails.oltId)
    if (!selectedOlt) {
      toast.error("Please select a valid OLT")
      return false
    }

    let boardPortStr = provisionDetails.oltPort || ""
    let boardType = selectedOlt.serviceBoards?.[0]?.type

    if (provisionDetails.useSplitter) {
      const ultimateOlt = findUltimateOltForSplitter(provisionDetails.splitterId)
      if (!ultimateOlt) {
        toast.error("Could not determine OLT from selected splitter. Check splitter service-board mapping or use Direct OLT.")
        return false
      }

      const path = getSplitterPath(provisionDetails.splitterId)
      boardPortStr = resolveSplitterBoardPort(path)
      const selectedSplitter = splitters.find(s => s.id.toString() === provisionDetails.splitterId)
      boardType = selectedSplitter?.connectedServiceBoard?.boardType || ultimateOlt.serviceBoards?.[0]?.type
    }

    // boardPortStr format like "0/0/1"
    const [frame, slot, port] = boardPortStr.split('/').map(Number)
    if ([frame, slot, port].some(part => Number.isNaN(part) || part === undefined)) {
      toast.error("Invalid OLT port format. Use frame/slot/port, for example 0/0/1.")
      return false
    }

    // Determine board type
    const isEpon = boardType?.toUpperCase().includes("EPON")

    // Build serial
    const serial = getOntSerialForRegistration(matchedDeviceForOnt, Boolean(isEpon))
    if (!serial) {
      toast.error("No serial/MAC available for ONT")
      return false
    }

    // Get VLANs
    const vlans = provisionDetails.selectedVlanIds
      .map(vlanId => {
        const vlan = selectedOlt?.vlans?.find(v => v.id === vlanId)
        if (!vlan) return null
        return {
          vlan: vlan.vlanId,
          gemport: vlan.gemIndex || 1, // fallback if gemIndex missing
        }
      })
      .filter(Boolean)

    // Get profiles (line_profile_id and service_profile_id)
    const profiles = selectedOlt?.profiles?.filter(p => provisionDetails.selectedProfileIds.includes(p.id)) || []
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

    const selectedLoadFile = provisionDetails.loadOntConfig
      ? selectedOlt.loadFiles?.find(file => file.id === provisionDetails.selectedLoadFileId)
      : null
    if (provisionDetails.loadOntConfig && !selectedLoadFile) {
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
        description: `${formValues.firstName}_${formValues.lastName}_${formValues.streetAddress}`.replace(/\s+/g, '_'),
        vlans,
        load_file: selectedLoadFile?.filename?.toLowerCase() || null,
      },
    }

    try {
      const response = await apiRequest(`/device/${provisionDetails.oltId}/action`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      if (response.success) {
        toast.success("ONT registered on OLT successfully")
        return true
      } else {
        toast.error(response.error || "ONT registration failed")
        return false
      }
    } catch (error: any) {
      toast.error(error.message || "ONT registration error")
      return false
    }
  }, [serviceDetails.connectionType, provisionDetails, matchedDeviceForOnt, selectedDiscoveredOnt, findUltimateOltForSplitter, getSplitterPath, splitters, olts, formValues, getOntSerialForRegistration])

  const isFiber = serviceDetails.connectionType === "fiber"
  const isInfraShare = serviceDetails.connectionType === "infra_share"
  const accountingService = useMemo(() => {
    const billing = servicesCatalog.filter(service => service.category === "BILLING" && ["TSHUL", "NEPURIX"].includes(service.code))
    return billing.find(service => service.config?.isDefault === true) || billing[0] || null
  }, [servicesCatalog])
  const accountingServiceCode = accountingService?.code || "TSHUL"
  const accountingRequiresPan = accountingService?.config?.is_pan_necessary
    ?? accountingService?.config?.requiresPan
    ?? accountingService?.config?.panRequired
    ?? accountingService?.config?.requirePan
    ?? accountingServiceCode === "TSHUL"
  const hasActiveRadius = servicesCatalog.some(service => service.code === "RADIUS")
  const hasActiveNettv = servicesCatalog.some(service => service.code === "NETTV")

  // Helper to get Radius group by package ID. Radius groups are keyed by plan code.
  const getRadiusGroupByPackageId = useCallback((pkgId: string): string => {
    const pkg = packages.find(p => p.id.toString() === pkgId)
    return pkg ? (pkg.packagePlanDetails?.planCode || pkg.packageName) : `pkg_${pkgId}`
  }, [packages])

  const addAccountBillingService = useCallback(() => {
    if (!formValues.idNumber.trim()) {
      toast.error("ID number is required for account billing.")
      return false
    }
    if (accountingRequiresPan && (!formValues.panNumber || !/^\d{9}$/.test(formValues.panNumber))) {
      toast.error("A valid 9-digit PAN number is required for account billing.")
      return false
    }
    setSelectedAddonServices((current) => {
      const next = new Set(current)
      next.add(accountingServiceCode)
      return next
    })
    setAccountBillingDialogOpen(false)
    return true
  }, [formValues.idNumber, formValues.panNumber, accountingRequiresPan, accountingServiceCode])

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    if (!selectedLead) {
      newErrors.lead = "Please select a lead first"
      isValid = false
    }

    if (!serviceDetails.subscribedPkgId) {
      newErrors.subscribedPkgId = "Please select a subscribed package"
      isValid = false
    }

    if (!referenceDetails.customerTypeId) {
      newErrors.customerTypeId = "Please select a customer type"
      isValid = false
    }

    if (!formValues.idNumber.trim()) {
      newErrors.idNumber = "ID number is required"
      isValid = false
    }

    // Draft save is allowed without a matched ONT. Provisioning remains strict.
    if (isFiber && selectedDiscoveredOnt && !matchedDeviceForOnt) {
      newErrors.ont = "Autofound ONT and selected device are not matched. Save as draft and update the device before provisioning."
    }

    // For wireless, require at least one valid credential set
    if (serviceDetails.connectionType === "wireless") {
      const validCredentials = wirelessCredentials.filter(c => c.username && c.password)
      if (validCredentials.length === 0) {
        newErrors.credentials = "At least one valid username/password is required"
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [selectedLead, isFiber, serviceDetails.connectionType, serviceDetails.subscribedPkgId, referenceDetails.customerTypeId, provisionDetails.splitterId, selectedDiscoveredOnt, matchedDeviceForOnt, wirelessCredentials, formValues.idNumber])

  const handleTabChange = useCallback((newTab: string) => {
    // Do not let users bypass the required identity field by clicking a tab.
    if (activeTab === "personal" && newTab !== "personal" && !formValues.idNumber.trim()) {
      setErrors((prev) => ({ ...prev, idNumber: "ID number is required" }))
      setTouched((prev) => ({ ...prev, idNumber: true }))
      toast.error("ID number is required")
      return
    }

    setErrors((prev) => {
      const next = { ...prev }
      delete next.idNumber
      return next
    })
    setActiveTab(newTab)
  }, [activeTab, formValues.idNumber])

  const handlePersonalNext = useCallback(() => {
    if (!formValues.idNumber.trim()) {
      setErrors((prev) => ({ ...prev, idNumber: "ID number is required" }))
      setTouched((prev) => ({ ...prev, idNumber: true }))
      toast.error("ID number is required")
      return
    }

    handleTabChange("location")
  }, [formValues.idNumber, handleTabChange])

  // Submit
  const handleCreateCustomer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setTimeout(() => {
        setErrors((currentErrors) => {
          const messages = Object.values(currentErrors).filter(Boolean)
          toast.error(messages.length ? messages.join("\n") : "Please fix validation errors before creating customer")
          return currentErrors
        })
      }, 0)
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Only leadId is required; personal data comes from lead
      formData.append("leadId", referenceDetails.leadId)

      // Add ID number and PAN
      if (formValues.idNumber) formData.append("idNumber", formValues.idNumber)
      if (formValues.panNumber) formData.append("panNumber", formValues.panNumber)

      // Devices
      formData.append("devices", JSON.stringify(devices))

      // Wireless Credentials (filter out empty)
      const validCredentials = wirelessCredentials.filter(c => c.username && c.password)
      formData.append("wirelessCredentials", JSON.stringify(validCredentials))
      if (customerLogin.username.trim()) formData.append("customerLoginUsername", customerLogin.username.trim())
      if (customerLogin.password.trim()) formData.append("customerLoginPassword", customerLogin.password.trim())

      const serviceConnection = {
        oltId: provisionDetails.oltId,
        splitterId: provisionDetails.splitterId,
        oltPort: provisionDetails.oltPort,
        splitterPort: provisionDetails.splitterPort,
        vlanIds: provisionDetails.selectedVlanIds,
        profileIds: provisionDetails.selectedProfileIds,
        connectionType: serviceDetails.connectionType,
        selectedOntSerial: matchedDeviceForOnt?.serialNumber || matchedDeviceForOnt?.ponSerial,
        selectedOntId: selectedDiscoveredOnt?.ont_id,
      }
      formData.append("serviceConnection", JSON.stringify(serviceConnection))

      if (serviceDetails.subscribedPkgId) formData.append("subscribedPkgId", serviceDetails.subscribedPkgId)

      if (referenceDetails.membershipId) formData.append("membershipId", referenceDetails.membershipId)
      if (referenceDetails.installedById) formData.append("installedById", referenceDetails.installedById)
      if (referenceDetails.customerTypeId) formData.append("customerTypeId", referenceDetails.customerTypeId)
      formData.append("isReferenced", referenceDetails.isReferenced.toString())
      if (referenceDetails.referencedById) formData.append("referencedById", referenceDetails.referencedById)
      if (referenceDetails.existingISPId) formData.append("existingISPId", referenceDetails.existingISPId)

      formData.append("isFree", isFree.toString())
      if (isFree) {
        formData.append("freeCustomerSecretKey", freeCustomerSecretKey)
      }

      // No add‑on services here – they will be handled after provisioning

      documents.forEach((doc) => {
        if (doc.file) {
          if (doc.type === "other") {
            formData.append("otherDocuments", doc.file)
          } else {
            formData.append(doc.type, doc.file)
          }
        }
      })

      const response = await apiRequest("/customer", {
        method: "POST",
        body: formData,
      })

      if (response.success) {
        setCreatedCustomer(response.customer)
        setProvisionResult({ ...response, customer: response.customer, subscription: response.subscription, order: response.order })
        const defaultServices = new Set<string>()
        if (accountingService) defaultServices.add(accountingServiceCode)
        if (hasActiveRadius) defaultServices.add("RADIUS")
        if (hasActiveNettv) defaultServices.add("NETTV")
        setSelectedAddonServices(defaultServices)
        setShowProvisionSection(true)
        if (hasActiveNettv) setNettvDialogOpen(true)
        if (response.customerLogin) {
          toast.success(`Customer login: ${response.customerLogin.username} / ${response.customerLogin.password}`)
        }
        toast.success(response.customer?.status === "active" ? "Customer is active. Add-on services can be provisioned now." : "Customer created successfully in draft status!")
      } else {
        throw new Error(response.error || "Failed to create customer")
      }
    } catch (error: any) {
      console.error("Submit error details:", error)
      toast.error(error.message || "Failed to create customer")
    } finally {
      setIsSubmitting(false)
    }
  }, [validateForm, formValues.idNumber, formValues.panNumber, devices, wirelessCredentials, customerLogin, provisionDetails, serviceDetails, referenceDetails, documents, matchedDeviceForOnt, selectedDiscoveredOnt, accountingService, accountingServiceCode, hasActiveRadius, hasActiveNettv])

  // Provision (activation) – now sends selected services to backend
  const handleProvisionCustomer = useCallback(async () => {
    if (!createdCustomer) return

    setIsProvisioning(true)
    setServiceProvisionResults([])

    try {
      // Step 1: Register ONT on OLT (if fiber)
      if (isFiber) {
        const ontRegistered = await registerOntOnOlt()
        if (!ontRegistered) {
          setIsProvisioning(false)
          return
        }
      }

      // Step 2: Build services payload
      const servicesPayload: any[] = []

      if (selectedAddonServices.has(accountingServiceCode)) {
        // Validate PAN
        if (accountingRequiresPan && (!formValues.panNumber || !/^\d{9}$/.test(formValues.panNumber))) {
          setAccountBillingDialogOpen(true)
          toast.error("Account billing requires a valid 9-digit PAN number.")
          setIsProvisioning(false)
          return
        }
        servicesPayload.push({
          service: accountingServiceCode,
          data: {
            Name: `${formValues.firstName} ${formValues.lastName}`,
            ReferenceId: createdCustomer.customerUniqueId,
            PanNo: formValues.panNumber,
            Address: `${formValues.streetAddress}, ${formValues.city}, ${formValues.state}, ${formValues.zipCode}`,
            City: formValues.city,
            Province: formValues.state,
            PostalCode: formValues.zipCode,
            Country: 'Nepal',
            Phone: formValues.phoneNumber,
            Email: formValues.email,
            Website: '',
            ContactPerson: `${formValues.firstName} ${formValues.lastName}`,
            ContactPersonPhone: formValues.phoneNumber,
            Bank: '',
            AcNo: '',
            AcName: '',
            CustomerId: formValues.idNumber,
            Notes: `Created via API. Customer ID: ${createdCustomer.id}`,
          }
        })
      }

      if (selectedAddonServices.has("RADIUS")) {
        const selectedNas = nasOptions.find(nas => String(nas.id) === selectedNasId)
        if (nasOptions.length > 0 && !selectedNas) {
          toast.error("Select a NAS for RADIUS provisioning.")
          setIsProvisioning(false)
          return
        }
        // Use first valid wireless credential; if none, generate random
        let username = "", password = ""
        const validCred = wirelessCredentials.find(c => c.username && c.password)
        if (validCred) {
          username = validCred.username
          password = validCred.password
        } else {
          username = `user_${Math.random().toString(36).substring(2, 10)}`
          password = Math.random().toString(36).substring(2, 10) + "A1!"
        }

        // Expiry from subscription planEnd (if available)
        const expiryDate = provisionResult?.subscription?.planEnd
          ? new Date(provisionResult.subscription.planEnd).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
          }).replace(/,/g, '').replace(/ /g, ' ')
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/,/g, '').replace(/ /g, ' ')

        const radiusGroupName = getRadiusGroupByPackageId(serviceDetails.subscribedPkgId)

        servicesPayload.push({
          service: "RADIUS",
          data: {
            username,
            password,
            planCode: radiusGroupName,
            attributes: {
              Expiration: expiryDate,
              ...(selectedNas?.nasname ? { "NAS-IP-Address": selectedNas.nasname } : {}),
            },
            nasId: selectedNas?.id,
            groups: [radiusGroupName],
          }
        })
      }

      if (selectedAddonServices.has("NETTV")) {
        if (!nettvData) {
          toast.error("NETTV data not configured")
          setIsProvisioning(false)
          return
        }
        servicesPayload.push({
          service: "NETTV",
          data: nettvData
        })
      }

      // Step 3: Call backend provision endpoint with services
      const response = await apiRequest(`/customer/${createdCustomer.id}/provision`, {
        method: "POST",
        body: JSON.stringify({ services: servicesPayload }),
        headers: { "Content-Type": "application/json" },
      })

      setProvisionResult(prev => ({ ...prev, ...response }))

      if (response.success) {
        setServiceProvisionResults(response.services || [])
        if (isFiber && provisionDetails.oltId) {
          const syncResults = await Promise.allSettled([
            apiRequest("/tr069-devices/sync", { method: "POST" }),
            apiRequest(`/olt/${provisionDetails.oltId}/onts/sync`, { method: "POST" }),
          ])
          syncResults.forEach((result, index) => {
            if (result.status === "rejected") {
              console.warn(index === 0 ? "TR-069 sync after provisioning failed" : "OLT ONT sync after provisioning failed", result.reason)
            }
          })
        }
        // If any services failed, we still show success for core, but highlight failures
        const allSucceeded = response.services?.every((s: any) => s.success) ?? true
        if (allSucceeded) {
          toast.success("Customer provisioned successfully with all services!")
        } else {
          toast.success("Customer provisioned, but some services failed. See details below.")
        }
        setCreatedCustomer((prev: any) => ({
          ...prev,
          status: "active",
          onboardStatus: "fully_onboarded",
        }))
        setIsSuccess(true) // Show success view with ACS tabs
        const nettvResult = response.services?.find((service: any) => String(service.service || service.code || "").toUpperCase() === "NETTV")
        if (nettvResult?.success && selectedAddonServices.has("NETTV") && !nettvData?.provisioning?.stb?.serial) {
          toast.success("NETTV subscriber created. Select the customer's STB and package to finish provisioning.")
          setNettvDialogOpen(true)
        }
      } else {
        toast.error(response.message || "Provisioning failed")
      }
    } catch (error: any) {
      console.error("Provision error details:", error)
      toast.error(error.message || "Failed to provision customer")
    } finally {
      setIsProvisioning(false)
    }
  }, [createdCustomer, isFiber, serviceDetails.connectionType, registerOntOnOlt, selectedAddonServices, formValues, wirelessCredentials, provisionResult, getRadiusGroupByPackageId, nettvData, nasOptions, selectedNasId, accountingServiceCode, accountingRequiresPan])

  // Retry failed services
  const handleRetryService = useCallback(async (service: string) => {
    // For NETTV, reopen dialog to allow updating data
    if (service === "NETTV") {
      setNettvDialogOpen(true)
      // After user confirms, we will need to re-run provision only for that service
      // For simplicity, we can just call provision again with only that service
      // But we need to update nettvData first.
      // We'll implement a separate retry function that re-sends only the failed service.
    }
    // For account billing or RADIUS, we can just re-send with same data
    // We'll collect failed services and call a dedicated retry endpoint or just call provision again with selected services.
    // This is left as an exercise; for now we'll just show the idea.
    toast(`Retry logic for ${service} not fully implemented.`)
  }, [])

  const handleAddAnotherCustomer = useCallback(() => {
    setSelectedLead(null)
    setFormValues({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      secondaryPhone: "",
      gender: "male",
      streetAddress: "",
      city: "",
      district: "",
      state: "",
      zipCode: "",
      idNumber: "",
      panNumber: "",
      fullAddress: "",
    })
    setCoordinates({ lat: "", lon: "" })
    setMapPosition([27.7172, 85.3240])
    setServiceDetails({
      connectionType: "fiber",
      subscribedPkgId: "",
    })
    setProvisionDetails({
      oltId: "",
      splitterId: "",
      oltPort: "",
      splitterPort: "",
      useSplitter: true,
      useDirectOLT: false,
      selectedVlanIds: [],
      selectedProfileIds: [],
      loadOntConfig: false,
      selectedLoadFileId: "",
    })
    setReferenceDetails({
      membershipId: "",
      installedById: "",
      customerTypeId: "",
      isReferenced: false,
      referencedById: "",
      existingISPId: "",
      leadId: "",
    })
    setDevices([])
    setWirelessCredentials([{ username: "", password: "" }])
    setCustomerLogin({ username: "", password: "" })
    setIsFree(false)
    setFreeCustomerSecretKey("")
    setSelectedAddonServices(new Set())
    setNettvData(null)
    setDocuments(documents.map((doc) => ({ ...doc, file: null })))
    setCreatedCustomer(null)
    setProvisionResult(null)
    setShowProvisionSection(false)
    setIsSuccess(false)
    setActiveTab("personal")
    setLeadSearchQuery("")
    setLeadSearchResults([])
    setCurrentLocationAddress("")
    setNearestSplitters([])
    setServiceAvailable(null)
    setDiscoveredOnts([])
    setSelectedDiscoveredOnt(null)
    setMatchedDeviceForOnt(null)
    setAutoFindError(null)
    setServiceProvisionResults([])
  }, [documents])

  // Success view with ACS WAN tabs
  if (isSuccess && createdCustomer) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Customer Process Complete</h3>
              <p className="mt-2 text-center text-muted-foreground">
                {createdCustomer.status === "active"
                  ? "Customer has been created and fully provisioned."
                  : "Customer has been created in draft status and can be provisioned later."}
              </p>

              <div className="mt-6 p-4 border rounded-lg bg-muted/50 w-full max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Customer ID</p>
                    <p className="text-sm">{createdCustomer.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Unique ID</p>
                    <p className="text-sm">{createdCustomer.customerUniqueId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p
                      className={`text-sm ${createdCustomer.status === "active" ? "text-green-600" : "text-amber-600"
                        }`}
                    >
                      {createdCustomer.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Onboard Status</p>
                    <p className="text-sm">{createdCustomer.onboardStatus}</p>
                  </div>
                </div>
              </div>

              {/* Service Provision Results */}
              {serviceProvisionResults.length > 0 && (
                <div className="mt-6 w-full max-w-md">
                  <h4 className="font-medium mb-2">Service Provisioning Results</h4>
                  <div className="space-y-2">
                    {serviceProvisionResults.map((result, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.service}</span>
                          {result.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        {result.message && <p className="text-sm mt-1">{result.message}</p>}
                        {!result.success && (
                          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => handleRetryService(result.service)}>
                            Retry
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button asChild>
                  <a href={`/customers/${createdCustomer.id}`}>View Customer</a>
                </Button>
                <Button asChild>
                  <a href="/customers/all">View All Customers</a>
                </Button>
                <Button type="button" variant="outline" onClick={handleAddAnotherCustomer}>
                  Add Another Customer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACS WAN Tabs for ONT devices */}
        {devices.filter(d => d.deviceType === "ONT" && d.serialNumber).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ACS Device Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={devices.find(d => d.deviceType === "ONT")?.serialNumber}>
                <TabsList className="w-full flex overflow-x-auto justify-start h-auto scrollbar-none mb-4 bg-muted p-1 rounded-lg">
                  {devices.filter(d => d.deviceType === "ONT").map((device, idx) => (
                    <TabsTrigger key={idx} value={device.serialNumber} className="flex-shrink-0">
                      {device.brand} {device.model}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {devices.filter(d => d.deviceType === "ONT").map((device, idx) => (
                  <TabsContent key={idx} value={device.serialNumber}>
                    <TR069DeviceWanConnections deviceId={device.serialNumber} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {provisionResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Provisioning Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subscription</Label>
                <div className="text-sm">
                  {provisionResult.subscription && (
                    <div>
                      Plan: {new Date(provisionResult.subscription.planStart).toLocaleDateString()} - {new Date(provisionResult.subscription.planEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <div className="text-sm">
                  {provisionResult.order && (
                    <div>
                      Order #{provisionResult.order.id} - Total: Rs. {provisionResult.order.totalAmount}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Secret Unlock Dialog for Free Customer feature */}
      <Dialog open={showSecretModal} onOpenChange={setShowSecretModal}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unlock Free Customer Option</DialogTitle>
            <DialogDescription>
              Enter the secret verification key to enable the "Free Customer" pricing override feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="secretKeyInput">Secret Verification Key *</Label>
              <Input
                id="secretKeyInput"
                type="password"
                placeholder="Enter secret key"
                value={typedSecretKey}
                onChange={(e) => setTypedSecretKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerifySecretKey()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setShowSecretModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleVerifySecretKey} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-650 hover:to-indigo-700 text-white">
              Verify & Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Dialog */}
      <DeviceDialog
        open={deviceDialogOpen}
        onOpenChange={setDeviceDialogOpen}
        device={editingDeviceIndex !== null ? devices[editingDeviceIndex] : undefined}
        onSave={handleDeviceSave}
      />

      <Dialog open={accountBillingDialogOpen} onOpenChange={setAccountBillingDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Billing Details</DialogTitle>
            <DialogDescription>
              Enter the billing identifiers required before activating Account Billing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="billingIdNumber">ID Number *</Label>
              <Input
                id="billingIdNumber"
                value={formValues.idNumber}
                onChange={(event) => setFormValues((prev) => ({ ...prev, idNumber: event.target.value }))}
                placeholder="Citizenship, passport, or customer ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingPanNumber">PAN Number {accountingRequiresPan ? "*" : "(optional)"}</Label>
              <Input
                id="billingPanNumber"
                inputMode="numeric"
                maxLength={9}
                value={formValues.panNumber}
                onChange={(event) => setFormValues((prev) => ({ ...prev, panNumber: event.target.value.replace(/\D/g, "").slice(0, 9) }))}
                placeholder="9-digit PAN number"
              />
              <p className="text-xs text-muted-foreground">{accountingRequiresPan ? "A valid 9-digit PAN number is required by this accounting provider." : "This accounting provider does not require PAN."}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setAccountBillingDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={addAccountBillingService}>Use for Billing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NETTV Dialog (only shown after customer creation) */}
      {showProvisionSection && createdCustomer && (
        <NetTVDialog
          open={nettvDialogOpen}
          onOpenChange={setNettvDialogOpen}
          onConfirm={setNettvData}
          defaultFname={formValues.firstName}
          defaultLname={formValues.lastName}
          defaultEmail={formValues.email}
          defaultUsername={(() => {
            const cred = wirelessCredentials.find(c => c.username && c.password)
            return buildNettvCredential(cred?.username || createdCustomer.customerUniqueId)
          })()}
          defaultPassword={(() => {
            const cred = wirelessCredentials.find(c => c.username && c.password)
            return buildNettvCredential(cred?.password)
          })()}
          defaultAddress={formValues.streetAddress || formValues.fullAddress}
          defaultCity={formValues.city}
          defaultDistrict={formValues.district}
          defaultProvince={formValues.state}
          defaultZip={formValues.zipCode}
          defaultPhone={formValues.phoneNumber}
          defaultMobile={formValues.secondaryPhone && !/^no secondary$/i.test(formValues.secondaryPhone.trim()) ? formValues.secondaryPhone : formValues.phoneNumber}
          defaultLat={coordinates.lat}
          defaultLng={coordinates.lon}
        />
      )}

      {/* Lead Search */}
      {!selectedLead && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lead by name, email or phone..."
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {isSearchingLead && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" onClick={() => setLeadSearchQuery("")}>
                  Clear
                </Button>
              </div>

              {leadSearchResults.length > 0 && (
                <div className="border rounded-md divide-y">
                  {leadSearchResults.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3 hover:bg-accent cursor-pointer flex items-center justify-between"
                      onClick={() => handleLeadSelect(lead)}
                    >
                      <div>
                        <p className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.email} • {lead.phoneNumber}
                        </p>
                        {lead.city && <p className="text-xs text-muted-foreground">{lead.city}</p>}
                      </div>
                      <Button type="button" size="sm" variant="ghost">
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLead && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Using lead: <strong>{selectedLead.firstName} {selectedLead.lastName}</strong> (ID: {selectedLead.id}) - Status: <Badge variant="default" className="ml-1">Qualified</Badge>
              {loadingLeadDetails && <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
              Change Lead
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Provision Section (after customer creation) */}
      {showProvisionSection && createdCustomer && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Ready to Activate Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Alert>
              <AlertDescription>
                {createdCustomer.status === "draft"
                  ? <>Customer <strong>{createdCustomer.name}</strong> has been created in draft status. You can now provision services to activate the customer.</>
                  : <>Customer <strong>{createdCustomer.name}</strong> is active. You can provision any missing add-on services below.</>}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Customer ID</p>
                <p className="text-sm">{createdCustomer.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Unique ID</p>
                <p className="text-sm font-mono">{createdCustomer.customerUniqueId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${createdCustomer.status === "active" ? "bg-green-500" : "bg-amber-500"
                      }`}
                  />
                  <span className="text-sm capitalize">{createdCustomer.status}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Onboard Status</p>
                <p className="text-sm capitalize">{createdCustomer.onboardStatus}</p>
              </div>
            </div>

            {/* Add‑on services checkboxes */}
            <div className="space-y-2">
              <Label className="text-base">Add‑on Services (optional)</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tshul"
                    checked={selectedAddonServices.has(accountingServiceCode)}
                    onCheckedChange={(checked) => {
                      if (checked && !formValues.idNumber.trim()) {
                        setAccountBillingDialogOpen(true)
                        toast.error("ID number is required for account billing.")
                        return
                      }
                      if (checked && accountingRequiresPan && (!formValues.panNumber || !/^\d{9}$/.test(formValues.panNumber))) {
                        setAccountBillingDialogOpen(true)
                        toast.error("A valid 9-digit PAN number is required for account billing.")
                        return
                      }
                      const newSet = new Set(selectedAddonServices)
                      if (checked) newSet.add(accountingServiceCode)
                      else newSet.delete(accountingServiceCode)
                      setSelectedAddonServices(newSet)
                    }}
                  />
                  <Label htmlFor="tshul" className="cursor-pointer">Account Billing ({accountingService?.name || accountingServiceCode})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="radius"
                    checked={selectedAddonServices.has("RADIUS")}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedAddonServices)
                      if (checked) newSet.add("RADIUS")
                      else newSet.delete("RADIUS")
                      setSelectedAddonServices(newSet)
                    }}
                  />
                  <Label htmlFor="radius" className="cursor-pointer">RADIUS Authentication</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nettv"
                    checked={selectedAddonServices.has("NETTV")}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedAddonServices)
                      if (checked) {
                        setNettvDialogOpen(true)
                        newSet.add("NETTV")
                      } else {
                        newSet.delete("NETTV")
                        setNettvData(null)
                      }
                      setSelectedAddonServices(newSet)
                    }}
                  />
                  <Label htmlFor="nettv" className="cursor-pointer">NETTV IPTV</Label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                onClick={handleProvisionCustomer}
                disabled={isProvisioning}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isProvisioning ? "Activating..." : "Activate Customer Now"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSuccess(true)
                  toast.success("Customer saved. You can activate services later from the customer details page.")
                }}
              >
                Skip for Now
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowProvisionSection(false)}>
                Back to Form
              </Button>
            </div>

            {provisionResult && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Activation Results:</h4>
                <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
                  {JSON.stringify(provisionResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      {!showProvisionSection && !createdCustomer && selectedLead && (
        <form key={selectedLead.id} onSubmit={handleCreateCustomer}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="flex w-full overflow-x-auto justify-start h-auto scrollbar-none p-1 bg-muted rounded-lg">
              <TabsTrigger value="personal" className="flex-1 flex-shrink-0">Personal</TabsTrigger>
              <TabsTrigger value="location" className="flex-1 flex-shrink-0">Location</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 flex-shrink-0">Documents</TabsTrigger>
              <TabsTrigger value="references" className="flex-1 flex-shrink-0">References</TabsTrigger>
              <TabsTrigger value="service" className="flex-1 flex-shrink-0">Service</TabsTrigger>
              <TabsTrigger value="provisioning" className="flex-1 flex-shrink-0">Provisioning</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information (from Lead)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formValues.firstName}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={formValues.middleName}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formValues.lastName}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={formValues.phoneNumber}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                      <Input
                        id="secondaryPhone"
                        value={formValues.secondaryPhone}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <SearchableSelect
                        options={[
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "other", label: "Other" },
                        ]}
                        value={formValues.gender}
                        onValueChange={(value) => {
                          const val = Array.isArray(value) ? value[0] : value;
                          setFormValues((prev) => ({ ...prev, gender: val || "" }));
                        }}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number / Passport</Label>
                    <Input
                      id="idNumber"
                      value={formValues.idNumber}
                      onChange={handleInputChange}
                      placeholder="Enter ID number"
                    />
                    {errors.idNumber && <p className="text-sm text-red-500">{errors.idNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number (for account billing)</Label>
                    <Input
                      id="panNumber"
                      value={formValues.panNumber}
                      onChange={handleInputChange}
                      placeholder="Enter 9‑digit PAN"
                      maxLength={9}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handlePersonalNext}>
                      Next: Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Location Tab (full map restored) */}
            <TabsContent value="location">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                      id="streetAddress"
                      value={formValues.streetAddress}
                      onChange={handleInputChange}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formValues.city}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        value={formValues.district}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formValues.state}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formValues.zipCode}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Map Section - Only render on client */}
                  {isMounted && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Coordinates & Service Availability</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedLead ? "Location locked from lead" : "Click on map or search to set customer location"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} disabled={!!selectedLead}>
                            <Navigation className="h-4 w-4 mr-2" />
                            Use My Location
                          </Button>
                        </div>
                      </div>

                      {/* Search Location */}
                      <div className="space-y-2 relative">
                        <Label>Search Location</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search for address, city, or landmark..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  searchLocation(searchQuery)
                                }
                              }}
                              className="pl-9"
                              disabled={!!selectedLead}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => searchLocation(searchQuery)}
                            disabled={searching || !searchQuery.trim() || !!selectedLead}
                          >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                          </Button>
                        </div>

                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto z-[9999]">
                            {searchResults.map((result) => (
                              <div
                                key={result.place_id}
                                className="p-2 hover:bg-accent cursor-pointer border-b last:border-0"
                                onClick={() => handleSelectSearchResult(result)}
                              >
                                <p className="font-medium">{result.display_name.split(",")[0]}</p>
                                <p className="text-xs text-muted-foreground truncate">{result.display_name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Map */}
                      <div className="relative h-[350px] overflow-hidden rounded-lg border">
                        <MapContainer
                          key={`customer-location-${selectedLead?.id || "manual"}`}
                          center={mapPosition}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <MapCenterUpdater center={mapPosition} />
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='Simulcast Technologies Pvt Ltd'
                          />

                          <MapClickHandler onLocationSelect={handleLocationSelect} disabled={!!selectedLead} />

                          {coordinates.lat && coordinates.lon && (
                            <LocationMarker
                              position={mapPosition}
                              draggable={!selectedLead}
                              onDragEnd={handleMarkerDragEnd}
                              address={currentLocationAddress}
                              serviceAvailable={serviceAvailable}
                              nearestSplitter={
                                nearestSplitters[0]
                                  ? { distance: nearestSplitters[0].distance ?? 0, name: nearestSplitters[0].name }
                                  : null
                              }
                            />
                          )}

                          {splitters
                            .filter((s) => s.location?.latitude && s.location?.longitude)
                            .map((splitter) => (
                              <SplitterMarker key={splitter.id} splitter={splitter} />
                            ))}

                          {coordinates.lat && coordinates.lon && (
                            <Circle
                              center={mapPosition}
                              radius={serviceRadius * 1000}
                              pathOptions={{
                                fillColor: serviceAvailable ? "green" : "red",
                                color: serviceAvailable ? "darkgreen" : "darkred",
                                fillOpacity: 0.2,
                                weight: 2,
                              }}
                            />
                          )}
                        </MapContainer>
                      </div>

                      {/* Service Radius Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Service Radius: {formatDistance(serviceRadius)}</Label>
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Adjust radius</span>
                          </div>
                        </div>
                        <Slider
                          value={[serviceRadius]}
                          min={0.05}
                          max={10}
                          step={0.05}
                          onValueChange={(val) => setServiceRadius(val[0])}
                          disabled={!!selectedLead}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>50 m</span>
                          <span>10 km</span>
                        </div>
                      </div>

                      {/* Current Location Info */}
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        <h4 className="font-medium mb-2">📍 Current Location Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Map Coordinates:</span>
                            <span className="font-mono">
                              {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
                            </span>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Location Address:</div>
                            {reverseGeocodingLoading ? (
                              <div className="flex items-center gap-1 text-blue-600 py-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Getting address...</span>
                              </div>
                            ) : currentLocationAddress ? (
                              <div className="text-xs bg-white p-2 rounded border break-words max-h-[100px] overflow-y-auto">
                                {currentLocationAddress}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic p-2">Not set on map</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Service Availability Badge */}
                      {serviceAvailable !== null && (
                        <div>
                          {serviceAvailable ? (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">Service Available</p>
                                <p className="text-sm text-green-600">
                                  Nearest splitter is {formatDistance(nearestSplitters[0]?.distance || 0)} away
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <div>
                                <p className="font-medium text-red-800">Service Not Available</p>
                                <p className="text-sm text-red-600">
                                  No splitters within service range ({formatDistance(serviceRadius)})
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Nearest Splitters List */}
                      {nearestSplitters.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">
                            Nearest Splitters (within {formatDistance(serviceRadius)})
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {nearestSplitters.map((splitter, idx) => (
                              <div key={splitter.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{splitter.name}</div>
                                    <div className="text-sm text-gray-500">
                                      ID: {splitter.splitterId} • Ratio: {splitter.splitRatio}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {splitter.location?.site || "No site specified"}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatDistance(splitter.distance || 0)}</div>
                                    <Badge
                                      className={`mt-1 ${(splitter.distance || 0) <= serviceRadius
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                        }`}
                                    >
                                      {(splitter.distance || 0) <= serviceRadius ? "Within range" : "Out of range"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <span>
                                    Available Ports: {splitter.availablePorts ?? 0}/{splitter.portCount}
                                  </span>
                                  <span>•</span>
                                  <span>Type: {splitter.splitterType || "N/A"}</span>
                                  <span>•</span>
                                  <span
                                    className={`px-2 py-0.5 rounded ${splitter.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                    {splitter.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {nearestSplitters.length === 0 && coordinates.lat && coordinates.lon && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="font-medium text-yellow-800">No Splitters Found</p>
                              <p className="text-sm text-yellow-600">
                                No splitters found within {formatDistance(serviceRadius)} radius. Service may not be
                                available at this location.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Manual coordinates input */}
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            value={coordinates.lat}
                            onChange={(e) => handleCoordinateChange("lat", e.target.value)}
                            placeholder="27.7172"
                            disabled={!!selectedLead}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            value={coordinates.lon}
                            onChange={(e) => handleCoordinateChange("lon", e.target.value)}
                            placeholder="85.3240"
                            disabled={!!selectedLead}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => handleTabChange("documents")}>
                      Next: Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab (unchanged) */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Upload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Upload customer identification and verification documents (Optional, Max 10MB each)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {documents.map((doc, index) => (
                        <div key={doc.type} className="space-y-2">
                          <Label htmlFor={`document-${doc.type}`}>{doc.name}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`document-${doc.type}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(index, e.target.files?.[0] || null)}
                              accept={doc.type === "photo" ? "image/*" : ".pdf,.jpg,.jpeg,.png,.doc,.docx"}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById(`document-${doc.type}`)?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {doc.file ? doc.file.name : `Upload ${doc.name}`}
                            </Button>
                          </div>
                          {doc.file && (
                            <p className="text-xs text-muted-foreground">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("location")}>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => handleTabChange("references")}>
                      Next: References
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* References Tab (unchanged) */}
            <TabsContent value="references">
              <Card>
                <CardHeader>
                  <CardTitle>Customer References</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="membershipId">Membership</Label>
                    <SearchableSelect
                      options={memberships.map((m) => ({
                        value: m.id.toString(),
                        label: m.name,
                      }))}
                      value={referenceDetails.membershipId}
                      onValueChange={(value) => handleReferenceChange("membershipId", Array.isArray(value) ? value[0] : value)}
                      placeholder={loading.memberships ? "Loading memberships..." : "Select membership"}
                      disabled={loading.memberships}
                    />
                    {selectedLead?.membership && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Lead membership: {selectedLead.membership.name} (auto-selected)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installedById">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Installed By (Technician)
                      </div>
                    </Label>
                    <SearchableSelect
                      options={users.map((user) => ({
                        value: user.id.toString(),
                        label: user.name,
                        description: user.email,
                      }))}
                      value={referenceDetails.installedById}
                      onValueChange={(value) => handleReferenceChange("installedById", Array.isArray(value) ? value[0] : value)}
                      placeholder={loading.users ? "Loading users..." : "Select technician"}
                      disabled={loading.users}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerTypeId">Customer Type *</Label>
                    <SearchableSelect
                      options={customerTypes.map((type) => ({
                        value: type.id.toString(),
                        label: type.name,
                      }))}
                      value={referenceDetails.customerTypeId}
                      onValueChange={(value) => handleReferenceChange("customerTypeId", Array.isArray(value) ? value[0] : value)}
                      placeholder={loading.customerTypes ? "Loading customer types..." : "Select customer type"}
                      disabled={loading.customerTypes}
                    />
                    {errors.customerTypeId && <p className="text-sm text-red-500">{errors.customerTypeId}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isReferenced">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Referred by Existing Customer?
                        </div>
                      </Label>
                      <Switch
                        checked={referenceDetails.isReferenced}
                        onCheckedChange={(checked) => handleReferenceChange("isReferenced", checked)}
                      />
                    </div>

                    {referenceDetails.isReferenced && (
                      <div className="space-y-2">
                        <Label htmlFor="referencedById">Referenced By Customer</Label>
                        <SearchableSelect
                          options={[]}
                          value={referenceDetails.referencedById}
                          onValueChange={(value) => handleReferenceChange("referencedById", Array.isArray(value) ? value[0] : value)}
                          placeholder="Select customer"
                          disabled
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="existingISPId">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Previous ISP
                      </div>
                    </Label>
                    <SearchableSelect
                      options={existingISPs.map((isp) => ({
                        value: isp.id.toString(),
                        label: `${isp.name}${isp.code ? ` (${isp.code})` : ""}`,
                        description: isp.type ? `Type: ${isp.type.charAt(0).toUpperCase() + isp.type.slice(1)}` : undefined,
                      }))}
                      value={referenceDetails.existingISPId}
                      onValueChange={(value) => handleReferenceChange("existingISPId", Array.isArray(value) ? value[0] : value)}
                      placeholder={loading.existingISPs ? "Loading ISPs..." : "Select previous ISP"}
                      disabled={loading.existingISPs}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadSummary">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Lead Relation
                      </div>
                    </Label>
                    <Input
                      id="leadSummary"
                      value={selectedLead ? `${selectedLead.firstName || ""} ${selectedLead.lastName || ""}`.trim() + ` - ${selectedLead.status}` : "No lead selected"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("documents")}>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => handleTabChange("service")}>
                      Next: Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Service Details Tab (with pre-filled subscribed package from lead) */}
            <TabsContent value="service">
              <Card>
                <CardHeader>
                  <CardTitle>Service Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertDescription>
                      Choose connection type and packages.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <Label>Connection Type</Label>
                    <RadioGroup
                      value={serviceDetails.connectionType}
                      onValueChange={(value) => handleServiceChange("connectionType", value)}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="fiber" id="fiber" />
                        <Label htmlFor="fiber" className="flex items-center cursor-pointer">
                          <Cable className="mr-2 h-5 w-5" />
                          Fiber
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="wireless" id="wireless" />
                        <Label htmlFor="wireless" className="flex items-center cursor-pointer">
                          <Wifi className="mr-2 h-5 w-5" />
                          Wireless
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="infra_share" id="infra_share" />
                        <Label htmlFor="infra_share" className="flex items-center cursor-pointer">
                          <Router className="mr-2 h-5 w-5" />
                          Infra Share
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 max-w-xl">
                    <Label htmlFor="customerNas">NAS Router</Label>
                    <Select value={selectedNasId} onValueChange={setSelectedNasId} disabled={nasOptions.length === 0}>
                      <SelectTrigger id="customerNas">
                        <SelectValue placeholder={nasOptions.length ? "Select NAS" : "No active NAS available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {nasOptions.map((nas) => (
                          <SelectItem key={nas.id} value={String(nas.id)}>
                            {nas.shortname || nas.nasname}{nas.isDefault ? " (Default)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for Fiber, Wireless, and Infra Share RADIUS provisioning. The default NAS, or the only available NAS, is selected automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="servicePlanId">Plan</Label>
                      <SearchableSelect
                        options={packages
                          .filter((pkg) => !pkg.isTrial)
                          .filter((pkg, index, rows) => rows.findIndex(p => p.planId === pkg.planId) === index)
                          .map((pkg) => ({ value: String(pkg.planId), label: String(pkg.packageName || pkg.packagePlanDetails?.planName || "Package").replace(/\s+-\s+(1|3|6|12)\s+Months?$/i, "") }))}
                        value={selectedServicePlanId}
                        onValueChange={(value) => {
                          const next = Array.isArray(value) ? value[0] || "" : value
                          setSelectedServicePlanId(next)
                          handleServiceChange("subscribedPkgId", "")
                        }}
                        placeholder={loading.packages ? "Loading plans..." : "Select plan"}
                        disabled={loading.packages}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscribedPkgId">Duration</Label>
                      <SearchableSelect
                        options={packages.filter(pkg => !pkg.isTrial && String(pkg.planId) === selectedServicePlanId && pkg.isActive !== false).map(pkg => ({ value: String(pkg.id), label: pkg.packageDuration, description: `Rs. ${pkg.price}` }))}
                        value={serviceDetails.subscribedPkgId}
                        onValueChange={(value) => handleServiceChange("subscribedPkgId", Array.isArray(value) ? value[0] || "" : value)}
                        placeholder={selectedServicePlanId ? "Select duration" : "Select a plan first"}
                        disabled={!selectedServicePlanId || loading.packages}
                      />
                      {errors.subscribedPkgId && <p className="text-sm text-red-500">{errors.subscribedPkgId}</p>}
                    </div>
                  </div>

                  {/* Free Customer Section (only for admins, and only if unlocked via secret key) */}
                  {isAdmin && freeCustomerUnlocked && (
                    <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-purple-800 dark:text-purple-400 font-medium">Free Customer</Label>
                          <p className="text-xs text-muted-foreground">Enable this to override the package price and addons to 0.</p>
                        </div>
                        <Switch
                          checked={isFree}
                          onCheckedChange={setIsFree}
                        />
                      </div>
                      {isFree && (
                        <div className="space-y-2">
                          <Label htmlFor="freeCustomerSecretKey">Secret Verification Key *</Label>
                          <Input
                            id="freeCustomerSecretKey"
                            type="password"
                            placeholder="Enter secret verification key"
                            value={freeCustomerSecretKey}
                            onChange={(e) => setFreeCustomerSecretKey(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("references")}>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => handleTabChange("provisioning")}>
                      Next: Provisioning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Provisioning Tab (fully restored) */}
            <TabsContent value="provisioning">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    {isFiber
                      ? "Fiber Network Provisioning"
                      : isInfraShare
                        ? "Infra Share Provisioning"
                        : "Wireless Provisioning"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertDescription>
                      {isFiber
                        ? "Configure splitter, OLT, VLANs, and add devices. Use Autofind to discover and match ONT."
                        : isInfraShare
                          ? "Configure subscriber credentials and device access. Infra Share skips OLT and splitter provisioning."
                        : "Configure wireless settings and add credentials."}
                    </AlertDescription>
                  </Alert>

                  {/* Fiber-specific fields */}
                  {isFiber && (
                    <>
                      {/* Connection Method */}
                      <div className="space-y-4">
                        <Label>Connection Method</Label>
                        <RadioGroup
                          value={provisionDetails.useSplitter ? "splitter" : "direct"}
                          onValueChange={(value) => {
                            if (value === "splitter") {
                              setProvisionDetails((prev) => ({ ...prev, useSplitter: true, useDirectOLT: false }))
                            } else {
                              setProvisionDetails((prev) => ({ ...prev, useSplitter: false, useDirectOLT: true }))
                            }
                          }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value="splitter" id="splitter" />
                            <Label htmlFor="splitter" className="flex items-center cursor-pointer">
                              <Split className="mr-2 h-5 w-5" />
                              Via Splitter
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value="direct" id="direct" />
                            <Label htmlFor="direct" className="flex items-center cursor-pointer">
                              <Server className="mr-2 h-5 w-5" />
                              Direct OLT Port
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Splitter selection */}
                      {provisionDetails.useSplitter && (
                        <div className="space-y-2">
                          <Label htmlFor="splitterId">Splitter</Label>
                          <SearchableSelect
                            options={splitters
                              .filter(s => (s.availablePorts ?? 0) > 0)
                              .map((splitter) => ({
                                value: splitter.id.toString(),
                                label: `${splitter.name} (${splitter.splitterId})`,
                                description: `Ratio: ${splitter.splitRatio} | Ports: ${splitter.portCount} | Available: ${splitter.availablePorts ?? 0}`,
                              }))}
                            value={provisionDetails.splitterId}
                            onValueChange={(value) => {
                              const selectedValue = Array.isArray(value) ? value[0] || "" : value
                              const selectedSplitter = splitters.find(s => s.id.toString() === selectedValue)
                              if (selectedSplitter) {
                                const ultimateOlt = findUltimateOltForSplitter(selectedValue)
                                setProvisionDetails((prev) => ({
                                  ...prev,
                                  splitterId: selectedValue,
                                  oltId: ultimateOlt ? ultimateOlt.id.toString() : '',
                                }))
                              } else {
                                setProvisionDetails((prev) => ({ ...prev, splitterId: selectedValue }))
                              }
                            }}
                            placeholder={loading.splitters ? "Loading splitters..." : "Select splitter with available ports"}
                            disabled={loading.splitters}
                          />
                        </div>
                      )}

                      {/* Display selected splitter details with hierarchy */}
                      {provisionDetails.splitterId && provisionDetails.useSplitter && (
                        (() => {
                          const selectedSplitter = splitters.find(s => s.id.toString() === provisionDetails.splitterId)
                          if (!selectedSplitter) return null
                          const path = getSplitterPath(provisionDetails.splitterId)
                          const ultimateOlt = findUltimateOltForSplitter(provisionDetails.splitterId)
                          return (
                            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                              <h4 className="font-medium mb-2">Selected Splitter Details</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
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
                                  <Label className="text-xs text-muted-foreground">Splitter Hierarchy</Label>
                                  <div className="flex flex-wrap items-center gap-1 mt-1 text-xs">
                                    {path.map((s, idx) => (
                                      <React.Fragment key={s.id}>
                                        {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                        <span className={`px-2 py-1 rounded ${s.id === selectedSplitter.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                                          {s.name}
                                        </span>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Ultimate OLT – only Name and Port, no IP */}
                              {ultimateOlt && (
                                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                                  <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">Ultimate OLT</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                                    <span>Name:</span><span>{ultimateOlt.name}</span>
                                    {resolveSplitterBoardPort(path) && (
                                      <>
                                        <span>Port:</span><span>{resolveSplitterBoardPort(path)}</span>
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
                      {!provisionDetails.useSplitter && (
                        <div className="space-y-2">
                          <Label htmlFor="oltId">OLT</Label>
                          <SearchableSelect
                            options={olts.map((olt) => ({
                              value: olt.id.toString(),
                              label: olt.name,
                              description: `${olt.model}`,
                            }))}
                            value={provisionDetails.oltId}
                            onValueChange={(value) => handleProvisionChange("oltId", value)}
                            placeholder={loading.olts ? "Loading OLTs..." : "Select OLT"}
                            disabled={loading.olts}
                          />
                        </div>
                      )}

                      {/* OLT Port Input – only for direct connection */}
                      {!provisionDetails.useSplitter && (
                        <div className="space-y-2">
                          <Label htmlFor="oltPort">OLT Port</Label>
                          <Input
                            id="oltPort"
                            value={provisionDetails.oltPort}
                            onChange={(e) => handleProvisionChange("oltPort", e.target.value)}
                            placeholder="e.g., 1/1/1"
                          />
                        </div>
                      )}

                      {provisionDetails.useSplitter && (
                        <div className="space-y-2">
                          <Label htmlFor="splitterPort">Splitter Output Port</Label>
                          <Input
                            id="splitterPort"
                            value={provisionDetails.splitterPort}
                            onChange={(e) => handleProvisionChange("splitterPort", e.target.value)}
                            placeholder="e.g., 1-32"
                          />
                        </div>
                      )}

                      {/* VLAN Multi-Select */}
                      {provisionDetails.oltId && (
                        (() => {
                          const selectedOlt = olts.find(o => o.id.toString() === provisionDetails.oltId)
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
                                      checked={provisionDetails.selectedVlanIds.includes(vlan.id)}
                                      onCheckedChange={(checked) => {
                                        const newIds = checked
                                          ? [...provisionDetails.selectedVlanIds, vlan.id]
                                          : provisionDetails.selectedVlanIds.filter(id => id !== vlan.id)
                                        handleProvisionChange("selectedVlanIds", newIds)
                                      }}
                                    />
                                    <Label htmlFor={`vlan-${vlan.id}`} className="text-sm cursor-pointer">
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
                      {provisionDetails.oltId && (
                        (() => {
                          const selectedOlt = olts.find(o => o.id.toString() === provisionDetails.oltId)
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
                                      checked={provisionDetails.selectedProfileIds.includes(profile.id)}
                                      onCheckedChange={(checked) => {
                                        const newIds = checked
                                          ? [...provisionDetails.selectedProfileIds, profile.id]
                                          : provisionDetails.selectedProfileIds.filter(id => id !== profile.id)
                                        handleProvisionChange("selectedProfileIds", newIds)
                                      }}
                                    />
                                    <Label htmlFor={`profile-${profile.id}`} className="text-sm cursor-pointer">
                                      {profile.name} ({profile.type}) {profile.description ? `- ${profile.description}` : ''}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()
                      )}

                      {provisionDetails.oltId && (() => {
                        const selectedOlt = olts.find(o => o.id.toString() === provisionDetails.oltId)
                        const loadFiles = selectedOlt?.loadFiles || []
                        return (
                          <div className="space-y-3 rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>Load ONT configuration file</Label>
                                <p className="text-xs text-muted-foreground">Runs after ONT registration and service-port creation.</p>
                              </div>
                              <Switch
                                checked={provisionDetails.loadOntConfig}
                                disabled={loadFiles.length === 0}
                                onCheckedChange={(checked) => setProvisionDetails(prev => ({
                                  ...prev,
                                  loadOntConfig: checked,
                                  selectedLoadFileId: checked ? (prev.selectedLoadFileId || loadFiles[0]?.id || "") : prev.selectedLoadFileId,
                                }))}
                              />
                            </div>
                            {provisionDetails.loadOntConfig && (
                              <Select value={provisionDetails.selectedLoadFileId} onValueChange={(value) => handleProvisionChange("selectedLoadFileId", value)}>
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

                      {/* Devices Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Customer Devices</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => setDeviceDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Device
                          </Button>
                        </div>

                        {devices.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No devices added yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {devices.map((device, index) => (
                              <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">{device.brand} {device.model}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {device.deviceType} • SN: {device.serialNumber} • MAC: {device.macAddress || "N/A"}
                                    {device.ponSerial && <span> • PON-SN: {device.ponSerial}</span>}
                                  </div>
                                  {device.notes && <div className="text-xs text-gray-500 mt-1">{device.notes}</div>}
                                </div>
                                <div className="flex gap-2">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => openDeviceDialogForEdit(index)}>
                                    Edit
                                  </Button>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeDevice(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Autofind ONT Section */}
                      {provisionDetails.oltId && (
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">ONT Discovery</Label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAutoFindOnt}
                              disabled={
                                isAutoFinding ||
                                !provisionDetails.oltId ||
                                (provisionDetails.useDirectOLT && !provisionDetails.oltPort)
                              }
                            >
                              {isAutoFinding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Autofind ONT
                            </Button>
                          </div>

                          {/* Show the board port that will be used */}
                          {provisionDetails.useSplitter && provisionDetails.splitterId && (
                            <div className="text-sm text-muted-foreground">
                              Using board port from splitter:{' '}
                              <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {(() => {
                                  const path = getSplitterPath(provisionDetails.splitterId);
                                  return resolveSplitterBoardPort(path) || 'Not available';
                                })()}
                              </code>
                            </div>
                          )}

                          {provisionDetails.useDirectOLT && provisionDetails.oltPort && (
                            <div className="text-sm text-muted-foreground">
                              Using entered OLT port:{' '}
                              <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {provisionDetails.oltPort}
                              </code>
                            </div>
                          )}

                          {autoFindError && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{autoFindError}</AlertDescription>
                            </Alert>
                          )}

                          {discoveredOnts.length > 0 && (
                            <div className="space-y-2">
                              <Label htmlFor="discoveredOntSelect">Select Discovered ONT</Label>
                              <SearchableSelect
                                options={discoveredOnts.map((ont) => ({
                                  value: ont.ont_id_details,
                                  label: `${ont.ont_id_details} (on ${ont.interface})`,
                                }))}
                                value={selectedDiscoveredOnt?.ont_id_details || ''}
                                onValueChange={(value) => handleSelectDiscoveredOnt(Array.isArray(value) ? value[0] : value)}
                                placeholder="Choose an ONT from the list"
                              />
                            </div>
                          )}

                          {matchedDeviceForOnt && selectedDiscoveredOnt && (
                            <Alert className="bg-green-50 border-green-200">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <AlertDescription>
                                Matched with device: {matchedDeviceForOnt.brand} {matchedDeviceForOnt.model}
                                {matchedDeviceForOnt.ponSerial && ` (PON-SN: ${matchedDeviceForOnt.ponSerial})`}
                              </AlertDescription>
                            </Alert>
                          )}
                          {selectedDiscoveredOnt && !matchedDeviceForOnt && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                No matching device found. Please add a device with matching serial/MAC/PON-SN.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {isInfraShare && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Customer Devices</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDeviceDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Device
                        </Button>
                      </div>

                      {devices.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No devices added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {devices.map((device, index) => (
                            <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{device.brand} {device.model}</div>
                                <div className="text-sm text-muted-foreground">
                                  {device.deviceType} • SN: {device.serialNumber} • MAC: {device.macAddress || "N/A"}
                                  {device.ponSerial && <span> • PON-SN: {device.ponSerial}</span>}
                                </div>
                                {device.notes && <div className="text-xs text-gray-500 mt-1">{device.notes}</div>}
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => openDeviceDialogForEdit(index)}>
                                  Edit
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => removeDevice(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <Label>Customer Login</Label>
                      <p className="text-xs text-muted-foreground">
                        Portal login for the subscriber. Leave username blank to use the customer ID and password blank to auto-generate one.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="customerLoginUsername">Username</Label>
                        <Input
                          id="customerLoginUsername"
                          placeholder="Auto from customer ID"
                          value={customerLogin.username}
                          onChange={(e) => setCustomerLogin((prev) => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="customerLoginPassword">Password</Label>
                        <Input
                          id="customerLoginPassword"
                          type="password"
                          placeholder="Auto-generate if blank"
                          value={customerLogin.password}
                          onChange={(e) => setCustomerLogin((prev) => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* User Credentials Section - Available for both fiber and wireless */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>User Credentials (PPPoE / Wi‑Fi)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addCredential}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another
                      </Button>
                    </div>

                    {wirelessCredentials.map((cred, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Username"
                            value={cred.username}
                            onChange={(e) => updateCredential(index, "username", e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Input
                            type="password"
                            placeholder="Password"
                            value={cred.password}
                            onChange={(e) => updateCredential(index, "password", e.target.value)}
                          />
                        </div>
                        {wirelessCredentials.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCredential(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {errors.credentials && (
                      <p className="text-sm text-red-500">{errors.credentials}</p>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("service")}>
                      Previous
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating Customer..." : "Create Customer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      )}
    </div>
  )
}
