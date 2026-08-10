"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import "leaflet/dist/leaflet.css"
import { Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet"
import { SafeMapContainer as MapContainer } from "@/components/maps/safe-map-container"
import {
    Upload, Maximize2, Minimize2, Trash2, Search, Eye, EyeOff,
    X, Plus, Folder, FolderOpen, Layers,
    Users, ChevronLeft, ChevronRight, Target, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { apiRequest } from "@/lib/api"
import { fetchFiberNetworkDataset } from "@/lib/fiber-network-data"
import { useTheme } from "next-themes"

/* ───────────────────────── LEAFLET ICON FIX ───────────────────────── */
const fixLeafletIcons = () => {
    if (typeof window === "undefined") return
    const L = require("leaflet")
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
        iconUrl: "/leaflet/images/marker-icon.png",
        shadowUrl: "/leaflet/images/marker-shadow.png",
    })
}

/* ──────────────────── SVG ICON ENGINE (theme-aware) ──────────────── */
type NodeKind = "olt" | "mdb" | "fdb" | "ont" | "pole"

const NODE_STYLES: Record<NodeKind, { bg: string; border: string; darkBg: string; darkBorder: string; size: number }> = {
    olt:  { bg: "#4f46e5", border: "#3730a3", darkBg: "#6366f1", darkBorder: "#818cf8", size: 38 },
    mdb:  { bg: "#7c3aed", border: "#5b21b6", darkBg: "#8b5cf6", darkBorder: "#a78bfa", size: 32 },
    fdb:  { bg: "#8b5cf6", border: "#6d28d9", darkBg: "#a78bfa", darkBorder: "#c4b5fd", size: 28 },
    ont:  { bg: "#6366f1", border: "#4338ca", darkBg: "#818cf8", darkBorder: "#a5b4fc", size: 10 },
    pole: { bg: "#475569", border: "#334155", darkBg: "#64748b", darkBorder: "#475569", size: 20 },
}

const createNodeIcon = (kind: NodeKind, label: string, isDark: boolean, highlighted = false) => {
    if (typeof window === "undefined") return null
    const L = require("leaflet")
    const s = NODE_STYLES[kind]
    const bg = isDark ? s.darkBg : s.bg
    const border = isDark ? s.darkBorder : s.border
    const size = highlighted ? s.size + 6 : s.size

    if (kind === "ont") {
        // Small filled circle for ONT/customer
        const dotSize = highlighted ? 14 : 10
        const html = `<div style="width:${dotSize}px;height:${dotSize}px;background:${bg};border:2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'white'};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25);${highlighted ? 'animation:pulse 1.5s ease-in-out infinite;box-shadow:0 0 0 4px rgba(236,72,153,0.3),0 1px 4px rgba(0,0,0,0.25);background:#ec4899;border-color:white;' : ''}"></div>`
        return L.divIcon({ html, className: "", iconSize: [dotSize, dotSize], iconAnchor: [dotSize / 2, dotSize / 2] })
    }

    if (kind === "pole") {
        // Round dark circle with a white 'P' inside for poles
        const dotSize = highlighted ? 22 : 18
        const highlightRing = highlighted ? `box-shadow:0 0 0 3px rgba(236,72,153,0.4);background:#ec4899;border-color:white;` : ""
        const html = `<div style="width:${dotSize}px;height:${dotSize}px;display:flex;align-items:center;justify-content:center;background:${highlighted ? '#ec4899' : bg};border:1.5px solid ${highlighted ? 'white' : border};border-radius:50%;color:white;font-size:9px;font-weight:700;font-family:Inter,system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,0.25);${highlightRing}">P</div>`
        return L.divIcon({ html, className: "", iconSize: [dotSize, dotSize], iconAnchor: [dotSize / 2, dotSize / 2] })
    }

    // Square icon with rounded corners and label text for OLT/MDB/FDB
    const radius = kind === "olt" ? 8 : 6
    const fontSize = kind === "olt" ? 11 : kind === "mdb" ? 10 : 9
    const highlightRing = highlighted ? `box-shadow:0 0 0 4px rgba(236,72,153,0.4),0 2px 8px rgba(0,0,0,0.3);background:#ec4899;border-color:white;animation:pulse 1.5s ease-in-out infinite;` : ""
    const html = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${highlighted ? '#ec4899' : bg};border:2.5px solid ${highlighted ? 'white' : border};border-radius:${radius}px;color:white;font-size:${fontSize}px;font-weight:700;font-family:Inter,system-ui,sans-serif;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,${isDark ? '0.5' : '0.2'});${highlightRing}">${label}</div>`
    return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

/* ─────────────────────── FIBER LINE STYLES ─────────────────────── */
const FIBER_STYLES = {
    backbone:     { weight: 4.5, opacity: 0.9,  color: "#4f46e5", darkColor: "#818cf8", dash: "" },
    distribution: { weight: 3,   opacity: 0.8,  color: "#7c3aed", darkColor: "#a78bfa", dash: "" },
    drop:         { weight: 1.8, opacity: 0.55, color: "#a5b4fc", darkColor: "#6366f1", dash: "" },
    highlighted:  { weight: 5,   opacity: 1,    color: "#ec4899", darkColor: "#f472b6", dash: "" },
}

/* ─────────────────────── FILE PARSER ─────────────────────── */
const parseFile = async (file: File): Promise<any[]> => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    let text = ""
    if (ext === "kmz") {
        const JSZip = (await import("jszip")).default
        const zip = new JSZip()
        const data = await zip.loadAsync(await file.arrayBuffer())
        const kmlFile = Object.keys(data.files).find(f => f.endsWith(".kml"))
        text = await data.file(kmlFile!)!.async("string")
    } else text = await file.text()

    const features: any[] = []
    const xml = new DOMParser().parseFromString(text, "text/xml")
    const nodes = xml.querySelectorAll("Placemark, maplayer, Entity")
    nodes.forEach(node => {
        const name = node.querySelector("name, layername")?.textContent || "Node"
        const coordNodes = node.querySelectorAll("coordinates, point")
        if (coordNodes.length > 0) {
            const coordStr = coordNodes[0].textContent?.trim() || ""
            if (coordStr.includes(",")) {
                const parts = coordStr.split(/\s+/)
                if (parts.length === 1) {
                    const [lngStr, latStr] = parts[0].split(",")
                    const lng = parseFloat(lngStr), lat = parseFloat(latStr)
                    if (!isNaN(lat) && !isNaN(lng)) features.push({ type: "Point", coords: [lat, lng], name })
                } else {
                    const path = parts.map(p => { const [lngStr, latStr] = p.split(","); return [parseFloat(latStr), parseFloat(lngStr)] }).filter(p => !isNaN(p[0]))
                    features.push({ type: "Line", path, name })
                }
            }
        }
    })
    return features
}

/* ─────────────────────── MAP CONTROLLER ─────────────────────── */
function MapController({ focusPosition, zoom, invalidate }: { focusPosition: [number, number] | null; zoom: number; invalidate: number }) {
    const map = useMap()
    useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 150); return () => clearTimeout(t) }, [map, invalidate])
    useEffect(() => {
        const t = setTimeout(() => {
            if (focusPosition) map.setView(focusPosition, zoom, { animate: true })
            else map.setZoom(zoom, { animate: true })
        }, 80)
        return () => clearTimeout(t)
    }, [map, focusPosition, zoom])
    return null
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
export default function FiberGISMap() {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
    const containerRef = useRef<HTMLDivElement>(null)

    // UI state
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [panelTab, setPanelTab] = useState<"layers" | "files" | "subscribers">("layers")
    const [panelOpen, setPanelOpen] = useState(true)
    const [search, setSearch] = useState("")
    const [isClient, setIsClient] = useState(false)

    // Map data
    const [topology, setTopology] = useState<any>(null)
    const [files, setFiles] = useState<any[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string; isExpanded: boolean }[]>([])
    const [focusPosition, setFocusPosition] = useState<[number, number] | null>([27.7172, 85.3240])
    const [mapZoom, setMapZoom] = useState(13)
    const [selectedCat, setSelectedCat] = useState<string | null>(null)
    const [targetCat, setTargetCat] = useState<string | null>(null)
    const [newFolderName, setNewFolderName] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Layer visibility
    const [layers, setLayers] = useState({ olt: true, mdb: true, fdb: true, ont: true, pole: true, backbone: true, distribution: true, drop: true, misc: true })

    // Subscriber highlight
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [subscriberSearch, setSubscriberSearch] = useState("")

    /* ── fullscreen ── */
    const toggleFullScreen = () => {
        if (!containerRef.current) return
        if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => setIsFullScreen(true))
        else document.exitFullscreen().catch(() => setIsFullScreen(false))
    }
    useEffect(() => {
        const handler = () => setIsFullScreen(document.fullscreenElement === containerRef.current)
        document.addEventListener("fullscreenchange", handler)
        return () => document.removeEventListener("fullscreenchange", handler)
    }, [])
    useEffect(() => {
        if (!isFullScreen) return
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { document.fullscreenElement ? document.exitFullscreen().catch(() => setIsFullScreen(false)) : setIsFullScreen(false) } }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [isFullScreen])

    /* ── load data ── */
    const getFirstPos = (data: any[]): [number, number] | null => {
        const p = data?.find(d => d.type === "Point" && d.coords) || data?.[0]
        if (!p) return null
        if (p.type === "Point" && p.coords) return [p.coords[0], p.coords[1]]
        if (p.type === "Line" && p.path?.[0]) return [p.path[0][0], p.path[0][1]]
        return null
    }

    const loadMapData = useCallback(async () => {
        try {
            const [folderResult, topologyResult] = await Promise.allSettled([
                apiRequest<any[]>("/fiber-map/folders"),
                fetchFiberNetworkDataset(),
            ])
            const data = folderResult.status === "fulfilled" ? folderResult.value || [] : []
            const topo = topologyResult.status === "fulfilled" ? topologyResult.value : null
            if (topo) setTopology(topo)
            const loadedCats = [
                ...(topo ? [{ id: "live-network", name: "Live Network", isExpanded: true }] : []),
                ...data.map((f: any) => ({ id: f.id.toString(), name: f.name, isExpanded: true })),
            ]
            setCategories(loadedCats)
            setSelectedCat(cur => (cur && loadedCats.some(c => c.id === cur)) ? cur : loadedCats[0]?.id || null)
            const allFiles: any[] = []
            if (topo) allFiles.push({ id: "live-fiber-topology", catId: "live-network", name: "OLT · MDB · FDB · ONT", data: topo.mapFeatures, isVisible: true, readOnly: true })
            data.forEach((f: any) => f.files?.forEach((file: any) => allFiles.push({ id: file.id.toString(), catId: f.id.toString(), name: file.name, data: file.data || [], isVisible: true })))
            setFiles(allFiles)
            const livePos = getFirstPos(topo?.mapFeatures || [])
            if (livePos) setFocusPosition(livePos)
        } catch { /* silently handle */ }
    }, [])

    /* ── init ── */
    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            fixLeafletIcons()
            setIsClient(true)
            void loadMapData()
        })
        return () => window.cancelAnimationFrame(frame)
    }, [loadMapData])

    /* ── highlight path ── */
    const highlightedPathKeys = useMemo(() => {
        if (!topology || !selectedCustomerId) return new Set<string>()
        const keys = new Set<string>()
        const customer = topology.customers.find((c: any) => c.customerUniqueId === selectedCustomerId)
        if (!customer) return keys
        keys.add(`ont-${selectedCustomerId}`)
        keys.add(`drop-fiber-${selectedCustomerId}`)
        const service = (customer.serviceDetails || []).find((d: any) => d.status === "active") || customer.serviceDetails?.[0]
        let splitterId = Number(service?.splitterId || service?.splitter?.id || customer.splitterId) || null
        let depth = 0
        while (splitterId && depth < 10) {
            depth++
            const splitter = topology.splitters.find((s: any) => Number(s.id) === splitterId)
            if (!splitter) break
            keys.add(`splitter-${splitter.id}`)
            keys.add(`fiber-splitter-${splitter.id}`)
            if (splitter.masterSplitterId) {
                const master = topology.splitters.find((m: any) => String(splitter.masterSplitterId) === String(m.splitterId || m.id))
                splitterId = master ? Number(master.id) : null
            } else {
                const oltId = splitter.oltId || splitter.olt?.id
                if (oltId) keys.add(`olt-${oltId}`)
                break
            }
        }
        const directOlt = service?.oltId || service?.olt?.id || customer.oltId
        if (directOlt) keys.add(`olt-${directOlt}`)
        return keys
    }, [selectedCustomerId, topology])

    /* ── file management ── */
    const createFolder = async () => {
        const name = newFolderName.trim()
        if (!name) return toast.error("Folder name is required")
        try {
            const res = await apiRequest<any>("/fiber-map/folders", { method: "POST", body: JSON.stringify({ name }) })
            const cat = { id: res.id.toString(), name: res.name || name, isExpanded: true }
            setCategories(p => [...p, cat])
            setSelectedCat(cat.id)
            setNewFolderName("")
            toast.success("Folder created")
        } catch { toast.error("Failed to create folder") }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !targetCat) return toast.error("No folder selected")
        try {
            const data = await parseFile(file)
            const formData = new FormData()
            formData.append("mapFile", file)
            formData.append("folderId", targetCat)
            formData.append("name", file.name)
            formData.append("parsedData", JSON.stringify(data))
            const res = await apiRequest<any>("/fiber-map/files", { method: "POST", body: formData })
            setFiles(p => [...p, { id: res.id.toString(), catId: targetCat, name: file.name, data, isVisible: true }])
            setTargetCat(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
            toast.success(`Loaded ${file.name}`)
        } catch { toast.error("Failed to upload") }
    }

    const removeFile = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        try { await apiRequest(`/fiber-map/files/${id}`, { method: "DELETE" }); setFiles(p => p.filter(f => f.id !== id)); toast.success("Removed") } catch { toast.error("Failed") }
    }

    const toggleLayer = (key: string) => setLayers(p => ({ ...p, [key]: !(p as any)[key] }))

    /* ── icons (memoized per theme) ── */
    const icons = useMemo(() => {
        if (!isClient) return null
        return {
            OLT: createNodeIcon("olt", "OLT", isDark),
            MDB: createNodeIcon("mdb", "MDB", isDark),
            FDB: createNodeIcon("fdb", "FDB", isDark),
            POLE: createNodeIcon("pole", "", isDark),
            ONT: createNodeIcon("ont", "", isDark),
            OLT_HL: createNodeIcon("olt", "OLT", isDark, true),
            MDB_HL: createNodeIcon("mdb", "MDB", isDark, true),
            FDB_HL: createNodeIcon("fdb", "FDB", isDark, true),
            POLE_HL: createNodeIcon("pole", "", isDark, true),
            ONT_HL: createNodeIcon("ont", "", isDark, true),
        }
    }, [isClient, isDark])

    /* ── layer config for panel ── */
    const layerConfig = [
        { key: "backbone", label: "Backbone", desc: "OLT → MDB trunk fiber", type: "line" as const, color: isDark ? FIBER_STYLES.backbone.darkColor : FIBER_STYLES.backbone.color },
        { key: "distribution", label: "Distribution", desc: "MDB → FDB branches", type: "line" as const, color: isDark ? FIBER_STYLES.distribution.darkColor : FIBER_STYLES.distribution.color },
        { key: "drop", label: "Drop", desc: "Last-mile to customer", type: "line" as const, color: isDark ? FIBER_STYLES.drop.darkColor : FIBER_STYLES.drop.color },
        { key: "olt", label: "OLT", desc: "Optical Line Terminal", type: "node" as const, color: isDark ? NODE_STYLES.olt.darkBg : NODE_STYLES.olt.bg },
        { key: "mdb", label: "MDB", desc: "Main Distribution Box", type: "node" as const, color: isDark ? NODE_STYLES.mdb.darkBg : NODE_STYLES.mdb.bg },
        { key: "fdb", label: "FDB", desc: "Fiber Distribution Box", type: "node" as const, color: isDark ? NODE_STYLES.fdb.darkBg : NODE_STYLES.fdb.bg },
        { key: "pole", label: "Pole", desc: "Utility Pole marker", type: "node" as const, color: isDark ? NODE_STYLES.pole.darkBg : NODE_STYLES.pole.bg },
        { key: "ont", label: "ONT", desc: "Customer terminal", type: "node" as const, color: isDark ? NODE_STYLES.ont.darkBg : NODE_STYLES.ont.bg },
    ]

    /* ── stats ── */
    const stats = useMemo(() => {
        if (!topology) return null
        return { olts: topology.olts?.length || 0, splitters: topology.splitters?.length || 0, customers: topology.customers?.length || 0 }
    }, [topology])

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div ref={containerRef} className={cn("relative w-full", isFullScreen ? "fixed inset-0 z-[9999]" : "h-[calc(100vh-3.5rem)]")}>
            {/* ── Tile layer + markers ── */}
            {isClient && icons && (
                <div className="absolute inset-0 z-0">
                    <MapContainer center={focusPosition || [27.7172, 85.324]} zoom={mapZoom} className="h-full w-full" zoomControl={false} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            url={isDark
                                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        <MapController focusPosition={focusPosition} zoom={mapZoom} invalidate={isFullScreen ? 1 : 0} />

                        {/* Render features */}
                        {files.filter(f => f.isVisible).map(f => f.data.map((feat: any, i: number) => {
                            const tag = (feat.name || "").toLowerCase()
                            const isOlt = feat.kind === "olt" || (!feat.kind && tag.includes("olt"))
                            const isSplitter = feat.kind === "splitter" || (!feat.kind && (tag.includes("splitter") || tag.includes("mdb") || tag.includes("fdb") || tag.includes("fat") || tag.includes("master")))
                            const isMdb = feat.subKind === "mdb" || (isSplitter && (tag.includes("mdb") || tag.includes("master")))
                            const isFdb = feat.subKind === "fdb" || (isSplitter && !isMdb)
                            const isOnt = feat.kind === "ont" || (!feat.kind && (tag.includes("ont") || tag.includes("onu") || tag.includes("customer") || tag.includes("sub")))
                            const isPole = !isOlt && !isSplitter && !isOnt && (feat.kind === "pole" || (!feat.kind && (tag.includes("pole") || tag.startsWith("pl") || tag.includes(" pl") || tag.includes("-pl") || tag.includes("post"))))

                            // Build feature key for highlighting
                            let featKey = ""
                            if (feat.type === "Point") {
                                if (isOlt && feat.meta?.id) featKey = `olt-${feat.meta.id}`
                                else if (isSplitter && feat.meta?.id) featKey = `splitter-${feat.meta.id}`
                                else if (isOnt && feat.meta?.customerId) featKey = `ont-${feat.meta.customerId}`
                            } else {
                                if (feat.meta?.customerId) featKey = `drop-fiber-${feat.meta.customerId}`
                                else if (feat.meta?.splitterId) featKey = `fiber-splitter-${feat.meta.splitterId}`
                            }
                            const isHL = !!(selectedCustomerId && featKey && highlightedPathKeys.has(featKey))

                            /* ── POINT ── */
                            if (feat.type === "Point" && feat.coords) {
                                let icon = icons.ONT
                                let show = layers.ont
                                if (isOlt) { icon = isHL ? icons.OLT_HL : icons.OLT; show = layers.olt }
                                else if (isMdb) { icon = isHL ? icons.MDB_HL : icons.MDB; show = layers.mdb }
                                else if (isFdb) { icon = isHL ? icons.FDB_HL : icons.FDB; show = layers.fdb }
                                else if (isPole) { icon = isHL ? icons.POLE_HL : icons.POLE; show = layers.pole }
                                else if (isOnt) { icon = isHL ? icons.ONT_HL : icons.ONT; show = layers.ont }
                                else { show = layers.misc }
                                if (!show && !isHL) return null
                                if (search && !isHL && !tag.includes(search.toLowerCase())) return null

                                return (
                                    <Marker key={`${f.id}-p-${i}`} position={feat.coords} icon={icon}>
                                        <Popup>
                                            <div className="p-3 min-w-[200px] font-sans">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                                                    <div className="w-3 h-3 rounded-sm" style={{ background: isOlt ? NODE_STYLES.olt.bg : isMdb ? NODE_STYLES.mdb.bg : isFdb ? NODE_STYLES.fdb.bg : isPole ? NODE_STYLES.pole.bg : NODE_STYLES.ont.bg }} />
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                        {isOlt ? "OLT" : isMdb ? "MDB" : isFdb ? "FDB" : isPole ? "Pole" : "ONT"}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-sm mb-2">{feat.name}</p>
                                                {feat.status && <p className="text-xs mb-1"><span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", feat.status === "active" ? "bg-emerald-500" : "bg-red-400")} />{feat.status}</p>}
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                                                    <span className="text-muted-foreground">Lat</span><span className="font-mono text-right">{feat.coords[0].toFixed(6)}</span>
                                                    <span className="text-muted-foreground">Lng</span><span className="font-mono text-right">{feat.coords[1].toFixed(6)}</span>
                                                    {feat.meta && Object.entries(feat.meta).filter(([, v]) => v != null && v !== "").slice(0, 5).map(([k, v]) => (
                                                        <span key={k} className="contents"><span className="text-muted-foreground truncate">{k}</span><span className="font-mono text-right truncate">{String(v)}</span></span>
                                                    ))}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            }

                            /* ── LINE ── */
                            if (feat.type === "Line" && feat.path) {
                                const isBackbone = tag.includes("backbone") || tag.includes("master") || tag.includes("olt") || tag.includes("trunk")
                                const isDrop = tag.includes("drop") || tag.includes("ont") || tag.includes("onu") || tag.includes("customer")
                                const tier = feat.subKind || (isBackbone ? "backbone" : isDrop ? "drop" : "distribution")

                                if (!isHL) {
                                    if (tier === "backbone" && !layers.backbone) return null
                                    if (tier === "distribution" && !layers.distribution) return null
                                    if (tier === "drop" && !layers.drop) return null
                                }
                                if (search && !isHL && !tag.includes(search.toLowerCase())) return null
                                const style = isHL ? FIBER_STYLES.highlighted : (FIBER_STYLES as any)[tier] || FIBER_STYLES.drop
                                return (
                                    <Polyline
                                        key={`${f.id}-l-${i}`}
                                        positions={feat.path}
                                        pathOptions={{
                                            color: isDark ? style.darkColor : style.color,
                                            weight: isHL ? style.weight : style.weight,
                                            opacity: isHL ? 1 : style.opacity,
                                            dashArray: style.dash || undefined,
                                        }}
                                    />
                                )
                            }
                            return null
                        }))}
                    </MapContainer>
                </div>
            )}

            {/* ── TOP BAR ── */}
            <div className="absolute top-4 left-4 right-4 z-[1001] flex items-center justify-between pointer-events-none">
                {/* Left: branding */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className={cn(
                        "flex items-center gap-2.5 px-4 py-2 rounded-xl shadow-lg border backdrop-blur-xl",
                        isDark ? "bg-gray-900/80 border-white/10" : "bg-white/90 border-gray-200/60"
                    )}>
                        <MapPin className="h-5 w-5 text-indigo-500" />
                        <span className="text-sm font-bold tracking-tight">Fiber GIS</span>
                        {stats && (
                            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                                <span className="text-[10px] text-muted-foreground">{stats.olts} OLT</span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">{stats.splitters} Splitters</span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">{stats.customers} ONT</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: search + controls */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className={cn("relative", isDark ? "text-white" : "text-gray-900")}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            className={cn(
                                "w-56 h-9 pl-9 pr-3 rounded-xl text-xs border shadow-lg backdrop-blur-xl outline-none focus:ring-2 focus:ring-indigo-500/30",
                                isDark ? "bg-gray-900/80 border-white/10 placeholder:text-gray-500" : "bg-white/90 border-gray-200/60 placeholder:text-gray-400"
                            )}
                            placeholder="Search nodes, fibers…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={toggleFullScreen}
                        className={cn(
                            "h-9 w-9 flex items-center justify-center rounded-xl border shadow-lg backdrop-blur-xl transition-colors",
                            isDark ? "bg-gray-900/80 border-white/10 hover:bg-gray-800/80" : "bg-white/90 border-gray-200/60 hover:bg-gray-100/90"
                        )}
                    >
                        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* ── LEGEND (bottom-right) ── */}
            <div className={cn(
                "absolute bottom-6 right-4 z-[1001] rounded-xl border shadow-lg backdrop-blur-xl p-3",
                isDark ? "bg-gray-900/80 border-white/10" : "bg-white/90 border-gray-200/60"
            )}>
                <div className="space-y-2">
                    {/* Lines */}
                    {[
                        { label: "Backbone", color: isDark ? FIBER_STYLES.backbone.darkColor : FIBER_STYLES.backbone.color, w: "w-6 h-[3px]" },
                        { label: "Distribution", color: isDark ? FIBER_STYLES.distribution.darkColor : FIBER_STYLES.distribution.color, w: "w-6 h-[2.5px]" },
                        { label: "Drop", color: isDark ? FIBER_STYLES.drop.darkColor : FIBER_STYLES.drop.color, w: "w-6 h-[1.5px]" },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-2.5">
                            <div className={cn(item.w, "rounded-full flex-shrink-0")} style={{ background: item.color }} />
                            <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                    <div className="border-t border-border my-1.5" />
                    {/* Nodes */}
                    {[
                        { label: "OLT", bg: isDark ? NODE_STYLES.olt.darkBg : NODE_STYLES.olt.bg, shape: "rounded-[3px] w-4 h-4" },
                        { label: "MDB", bg: isDark ? NODE_STYLES.mdb.darkBg : NODE_STYLES.mdb.bg, shape: "rounded-[3px] w-3.5 h-3.5" },
                        { label: "FDB", bg: isDark ? NODE_STYLES.fdb.darkBg : NODE_STYLES.fdb.bg, shape: "rounded-[2px] w-3 h-3" },
                        { label: "Pole", bg: isDark ? NODE_STYLES.pole.darkBg : NODE_STYLES.pole.bg, shape: "rounded-full w-3 h-3" },
                        { label: "ONT", bg: isDark ? NODE_STYLES.ont.darkBg : NODE_STYLES.ont.bg, shape: "rounded-full w-2.5 h-2.5" },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-2.5">
                            <div className={cn(item.shape, "flex-shrink-0 border border-white/30")} style={{ background: item.bg }} />
                            <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── SIDE PANEL ── */}
            <div className={cn(
                "absolute top-16 left-4 bottom-6 z-[1001] transition-all duration-300 flex",
                !panelOpen && "-translate-x-[calc(100%+1rem)]"
            )}>
                <div className={cn(
                    "w-80 rounded-xl border shadow-xl backdrop-blur-xl overflow-hidden flex flex-col",
                    isDark ? "bg-gray-900/90 border-white/10" : "bg-white/95 border-gray-200/60"
                )}>
                    {/* Tab bar */}
                    <div className={cn("flex border-b", isDark ? "border-white/10" : "border-gray-200/60")}>
                        {[
                            { key: "layers" as const, icon: <Layers className="h-3.5 w-3.5" />, label: "Layers" },
                            { key: "files" as const, icon: <Folder className="h-3.5 w-3.5" />, label: "Files" },
                            { key: "subscribers" as const, icon: <Users className="h-3.5 w-3.5" />, label: "Subscribers" },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setPanelTab(tab.key)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors border-b-2",
                                    panelTab === tab.key
                                        ? "border-indigo-500 text-indigo-500"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-3">
                            {/* ── LAYERS TAB ── */}
                            {panelTab === "layers" && (
                                <div className="space-y-1">
                                    {layerConfig.map(layer => (
                                        <button
                                            key={layer.key}
                                            onClick={() => toggleLayer(layer.key)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                                                (layers as any)[layer.key] ? (isDark ? "bg-white/5" : "bg-gray-50") : "opacity-40"
                                            )}
                                        >
                                            {layer.type === "line" ? (
                                                <div className="w-6 flex items-center justify-center flex-shrink-0"><div className="w-5 h-[2.5px] rounded-full" style={{ background: layer.color }} /></div>
                                            ) : (
                                                <div className="w-6 flex items-center justify-center flex-shrink-0">
                                                    <div className={cn(
                                                        "border border-white/30",
                                                        ["ont", "pole"].includes(layer.key) ? "w-2.5 h-2.5 rounded-full" : "w-3.5 h-3.5 rounded-[3px]"
                                                    )} style={{ background: layer.color }} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium">{layer.label}</p>
                                                <p className="text-[10px] text-muted-foreground">{layer.desc}</p>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-[18px] rounded-full relative transition-colors flex-shrink-0",
                                                (layers as any)[layer.key] ? "bg-indigo-500" : (isDark ? "bg-white/10" : "bg-gray-200")
                                            )}>
                                                <div className={cn(
                                                    "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform",
                                                    (layers as any)[layer.key] ? "translate-x-[16px]" : "translate-x-[2px]"
                                                )} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ── FILES TAB ── */}
                            {panelTab === "files" && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="New folder…"
                                            className="flex-1 h-8 text-xs"
                                            value={newFolderName}
                                            onChange={e => setNewFolderName(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createFolder() } }}
                                        />
                                        <Button size="icon" className="h-8 w-8" onClick={createFolder}><Plus className="h-3.5 w-3.5" /></Button>
                                    </div>
                                    {categories.map(cat => (
                                        <div key={cat.id} className={cn("border rounded-lg overflow-hidden", isDark ? "border-white/10" : "border-gray-200/60", selectedCat === cat.id && "ring-1 ring-indigo-500/50")}>
                                            <div className={cn("flex items-center justify-between p-2.5", isDark ? "bg-white/5" : "bg-gray-50")}>
                                                <button
                                                    className="flex items-center gap-2 text-xs font-medium flex-1 text-left"
                                                    onClick={() => { setSelectedCat(cat.id); setCategories(p => p.map(c => c.id === cat.id ? { ...c, isExpanded: !c.isExpanded } : c)) }}
                                                >
                                                    {cat.isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-indigo-500" /> : <Folder className="h-3.5 w-3.5" />}
                                                    {cat.name}
                                                    <span className="text-[10px] text-muted-foreground">({files.filter(f => f.catId === cat.id).length})</span>
                                                </button>
                                                {!cat.id.startsWith("live") && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setTargetCat(cat.id); fileInputRef.current?.click() }}>
                                                        <Upload className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            {cat.isExpanded && (
                                                <div className="p-1.5 space-y-0.5">
                                                    {files.filter(f => f.catId === cat.id).map(file => (
                                                        <div
                                                            key={file.id}
                                                            className={cn("flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer group transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-gray-50", !file.isVisible && "opacity-40")}
                                                            onClick={() => setFiles(p => p.map(f => f.id === file.id ? { ...f, isVisible: !f.isVisible } : f))}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {file.isVisible ? <Eye className="h-3 w-3 text-indigo-500 flex-shrink-0" /> : <EyeOff className="h-3 w-3 flex-shrink-0" />}
                                                                <span className="truncate">{file.name}</span>
                                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">{file.data.length}</span>
                                                            </div>
                                                            {!file.readOnly && (
                                                                <button onClick={e => removeFile(e, file.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {files.filter(f => f.catId === cat.id).length === 0 && (
                                                        <p className="text-[10px] text-muted-foreground text-center py-4">Empty folder</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── SUBSCRIBERS TAB ── */}
                            {panelTab === "subscribers" && (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input className="pl-8 h-8 text-xs" placeholder="Search subscriber…" value={subscriberSearch} onChange={e => setSubscriberSearch(e.target.value)} />
                                    </div>

                                    {selectedCustomerId && (
                                        <div className={cn("flex items-center justify-between p-2.5 rounded-lg border", isDark ? "bg-pink-500/10 border-pink-500/20" : "bg-pink-50 border-pink-200/40")}>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold text-pink-500 uppercase tracking-wider">Active Path</p>
                                                <p className="text-xs font-medium truncate">{(() => {
                                                    const c = topology?.customers?.find((c: any) => c.customerUniqueId === selectedCustomerId)
                                                    return c ? `${c.firstName} ${c.lastName}` : selectedCustomerId
                                                })()}</p>
                                            </div>
                                            <button onClick={() => { setSelectedCustomerId(null); setMapZoom(13) }} className="text-pink-500 hover:text-pink-600">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-0.5">
                                        {topology?.customers
                                            ?.filter((c: any) => {
                                                const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase()
                                                const q = subscriberSearch.toLowerCase()
                                                return name.includes(q) || (c.customerUniqueId || "").toLowerCase().includes(q) || (c.phoneNumber || "").includes(q)
                                            })
                                            .map((cust: any) => {
                                                const isSelected = selectedCustomerId === cust.customerUniqueId
                                                const ont = (cust.devices || []).find((d: any) => String(d.deviceType || "").toUpperCase() === "ONT")
                                                const coords = ont ? [Number(cust.latitude ?? cust.lat ?? cust.location?.latitude), Number(cust.longitude ?? cust.lng ?? cust.lon ?? cust.location?.longitude)] : null
                                                const hasCoords = coords && !isNaN(coords[0]) && !isNaN(coords[1])
                                                return (
                                                    <button
                                                        key={cust.id}
                                                        onClick={() => {
                                                            if (!hasCoords) return toast.error("No coordinates for this subscriber")
                                                            setSelectedCustomerId(cust.customerUniqueId)
                                                            setFocusPosition(coords as [number, number])
                                                            setMapZoom(18)
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors",
                                                            isSelected ? (isDark ? "bg-pink-500/10" : "bg-pink-50") : (isDark ? "hover:bg-white/5" : "hover:bg-gray-50"),
                                                            !hasCoords && "opacity-40 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{cust.firstName} {cust.lastName}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono truncate">{cust.customerUniqueId}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span className={cn("w-1.5 h-1.5 rounded-full", cust.status === "active" || cust.status === "online" ? "bg-emerald-500" : "bg-red-400")} />
                                                            {hasCoords && <Target className="h-3 w-3 text-muted-foreground" />}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        {(!topology?.customers || topology.customers.length === 0) && (
                                            <p className="text-[10px] text-muted-foreground text-center py-8">No subscriber data</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Panel toggle */}
                <button
                    onClick={() => setPanelOpen(p => !p)}
                    className={cn(
                        "self-center -mr-3 w-6 h-10 flex items-center justify-center rounded-r-lg border border-l-0 shadow-md backdrop-blur-xl transition-colors",
                        isDark ? "bg-gray-900/80 border-white/10 hover:bg-gray-800/80" : "bg-white/90 border-gray-200/60 hover:bg-gray-100"
                    )}
                >
                    {panelOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
            </div>

            {/* Zoom controls (bottom-right, above legend) */}
            <div className="absolute bottom-[260px] right-4 z-[1001] flex flex-col gap-0.5">
                {[
                    { icon: "+", action: () => setMapZoom(z => Math.min(z + 1, 19)) },
                    { icon: "−", action: () => setMapZoom(z => Math.max(z - 1, 3)) },
                ].map((btn, i) => (
                    <button
                        key={i}
                        onClick={btn.action}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg border shadow-lg backdrop-blur-xl transition-colors",
                            isDark ? "bg-gray-900/80 border-white/10 hover:bg-gray-800/80" : "bg-white/90 border-gray-200/60 hover:bg-gray-100",
                            i === 0 && "rounded-b-none",
                            i === 1 && "rounded-t-none border-t-0"
                        )}
                    >
                        {btn.icon}
                    </button>
                ))}
            </div>

            {/* Hidden upload input */}
            <input type="file" ref={fileInputRef} className="hidden" accept=".kml,.kmz,.qgs,.dxf" onChange={handleUpload} />

            {/* Pulse animation keyframe */}
            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
            `}</style>
        </div>
    )
}
