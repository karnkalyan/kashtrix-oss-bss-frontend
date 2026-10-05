"use client"

import React, { useState, useEffect, useMemo } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import {
    MapPin,
    AlertTriangle,
    CheckCircle,
    Navigation,
    Ruler,
    Search,
    Loader2,
    ChevronRight,
    Cable,
    Maximize2,
    Minimize2
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { Slider } from "@/components/ui/slider"

// Dynamic imports for Leaflet (to avoid SSR issues)
import dynamic from 'next/dynamic'
import "leaflet/dist/leaflet.css"
import { useMapEvents, useMap } from 'react-leaflet'

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

// Interface for geocoding result
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
    boundingbox: [string, string, string, string]
    address?: {
        road?: string
        county?: string
        district?: string
        state_district?: string
        state?: string
        country?: string
    }
}

interface Splitter {
    id: string
    name: string
    splitterId: string
    splitRatio: string
    ratio: number
    splitterType: "PLC" | "FBT"
    portCount: number
    usedPorts: number
    availablePorts: number
    location: {
        site: string
        latitude?: number
        longitude?: number
        description?: string
    }
    upstreamFiber: {
        coreColor: string
        connectedTo: string
        connectionId?: string
        port?: string
    }
    isMaster: boolean
    masterSplitterId?: string
    connectedServiceBoard?: {
        oltId: string
        oltName: string
        boardSlot: number
        boardPort: string
    }
    status: "active" | "inactive" | "maintenance"
    notes?: string
    createdAt: string
    updatedAt: string
    totalCustomers?: number
    slaveCount?: number
    distance?: number
}

// Helper function to format distance
const formatDistance = (distance: any): string => {
    try {
        const distNum = Number(distance);
        if (isNaN(distNum) || !isFinite(distNum)) {
            return "N/A";
        }
        if (distNum < 1) {
            const meters = distNum * 1000;
            return `${meters.toFixed(0)} m`;
        } else if (distNum < 10) {
            return `${distNum.toFixed(2)} km`;
        } else {
            return `${distNum.toFixed(1)} km`;
        }
    } catch (error) {
        return "N/A";
    }
}

// Custom icon factory function (only runs on client)
const getCustomIcon = () => {
    if (typeof window === 'undefined') return null

    const L = require('leaflet')

    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        iconUrl: '/leaflet/images/marker-icon.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
    })

    return new L.Icon({
        iconUrl: '/leaflet/images/marker-icon.png',
        iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
        shadowUrl: '/leaflet/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })
}

// Map Click Handler Component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    const MapEvents = () => {
        useMapEvents({
            click: (e) => {
                onLocationSelect(e.latlng.lat, e.latlng.lng)
            },
        })
        return null
    }
    return <MapEvents />
}

// Location Marker Component with enhanced popup
const LocationMarker = ({
    position,
    draggable = true,
    onDragEnd,
    address = "",
    serviceAvailable = null,
    nearestSplitter = null,
}: {
    position: [number, number],
    draggable?: boolean,
    onDragEnd?: (lat: number, lng: number, address?: string) => void,
    address?: string,
    serviceAvailable?: boolean | null,
    nearestSplitter?: { distance: number, name: string } | null
}) => {
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position)
    const [isDragging, setIsDragging] = useState(false)
    const [customIcon, setCustomIcon] = useState<any>(null)

    useEffect(() => {
        setCustomIcon(getCustomIcon())
    }, [])

    const eventHandlers = useMemo(() => ({
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
    }), [onDragEnd, address])

    useEffect(() => {
        if (position) {
            setMarkerPosition(position)
        }
    }, [position])

    if (!markerPosition || !customIcon) return null

    return (
        <Marker
            position={markerPosition}
            draggable={draggable}
            eventHandlers={eventHandlers}
            icon={customIcon}
        >
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
                            <div className={`text-xs p-2 rounded ${serviceAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <span className="font-medium">Service:</span>
                                <div className="mt-1">
                                    {serviceAvailable ? '✅ Available' : '❌ Not Available'}
                                </div>
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

                        {isDragging && (
                            <div className="text-xs text-amber-600 italic">
                                Dragging marker...
                            </div>
                        )}
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}

// Map Center Updater Component
const MapCenterUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap()

    useEffect(() => {
        if (center && center[0] && center[1] && map && typeof map.getZoom === 'function') {
            map.setView(center, map.getZoom())
        }
    }, [center, map])

    return null
}

// Map Resize Handler
const MapResizeHandler = () => {
    const map = useMap()
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize()
        }, 200)
    })
    return null
}

// Splitter Marker Component
const SplitterMarker = ({ splitter }: { splitter: Splitter }) => {
    const [isClient, setIsClient] = useState(false)
    const [splitterIcon, setSplitterIcon] = useState<any>(null)

    useEffect(() => {
        setIsClient(true)

        if (typeof window !== 'undefined') {
            const L = require('leaflet')
            const icon = new L.DivIcon({
                html: `
                    <div class="relative">
                        <div class="w-6 h-6 rounded-full ${splitter.isMaster ? 'bg-purple-500' : 'bg-blue-500'} border-2 border-white shadow-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                `,
                className: 'splitter-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
            setSplitterIcon(icon)
        }
    }, [splitter.isMaster])

    const position: [number, number] = [splitter.location.latitude || 0, splitter.location.longitude || 0]

    if (!splitter.location.latitude || !splitter.location.longitude || !isClient || !splitterIcon) {
        return null
    }

    return (
        <Marker
            position={position}
            icon={splitterIcon}
        >
            <Popup>
                <div className="p-1">
                    <strong>{splitter.name}</strong><br />
                    ID: {splitter.splitterId}<br />
                    Type: {splitter.splitterType}<br />
                    Ratio: {splitter.splitRatio}<br />
                    Status: <span className={`px-2 py-1 rounded text-xs ${splitter.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {splitter.status}
                    </span><br />
                    Available Ports: {splitter.availablePorts}/{splitter.portCount}<br />
                    <div className="mt-2 text-xs text-gray-500">
                        {splitter.location.site || 'No site specified'}
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}

export default function FiberService() {
    const [isMounted, setIsMounted] = useState(false)
    const [splitters, setSplitters] = useState<Splitter[]>([])
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Map state
    const [mapPosition, setMapPosition] = useState<[number, number]>([27.7172, 85.3240])
    const [nearestSplitters, setNearestSplitters] = useState<Splitter[]>([])
    const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null)
    const [serviceRadius, setServiceRadius] = useState<number>(0.1)
    const [hasLocation, setHasLocation] = useState(false)

    // Address state
    const [currentLocationAddress, setCurrentLocationAddress] = useState<string>("")
    const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
    const [searching, setSearching] = useState(false)

    // Coordinate inputs
    const [latitude, setLatitude] = useState<string>("")
    const [longitude, setLongitude] = useState<string>("")

    useEffect(() => {
        setIsMounted(true)
        fetchSplitters()
    }, [])

    const fetchSplitters = async () => {
        try {
            const response = await apiRequest("/splitters?limit=1000")
            let dataArray: any[] = []
            if (response && typeof response === 'object') {
                if (Array.isArray(response.data)) {
                    dataArray = response.data
                } else if (Array.isArray(response)) {
                    dataArray = response
                }
            }

            const processedSplitters = dataArray.map((splitter: any) => ({
                ...splitter,
                id: String(splitter.id),
                location: {
                    site: splitter.location?.site || '',
                    latitude: splitter.location?.latitude || 0,
                    longitude: splitter.location?.longitude || 0,
                    description: splitter.location?.description || ''
                },
                upstreamFiber: splitter.upstreamFiber || {
                    coreColor: "Blue",
                    connectedTo: "service-board",
                    connectionId: "",
                    port: ""
                },
                isMaster: splitter.isMaster || false,
                status: splitter.status || "active",
                totalCustomers: splitter.totalCustomers || 0,
                slaveCount: splitter.slaveCount || 0
            }))

            setSplitters(processedSplitters)
        } catch (error: any) {
            console.error("Failed to fetch splitters:", error)
            toast.error("Failed to load splitters")
        }
    }

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Find nearest splitters
    const findNearestSplitters = (lat: number, lng: number, maxDistanceKm: number = 5) => {
        if (!lat || !lng) return []

        const splittersWithDistance = splitters
            .filter(splitter => splitter.location.latitude && splitter.location.longitude)
            .map(splitter => {
                const distance = calculateDistance(
                    lat,
                    lng,
                    splitter.location.latitude!,
                    splitter.location.longitude!
                )
                return {
                    ...splitter,
                    distance: typeof distance === 'number' ? distance : 0
                }
            })
            .filter(splitter => splitter.distance <= maxDistanceKm)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10)

        return splittersWithDistance
    }

    // Reverse geocode function
    const reverseGeocode = async (lat: number, lng: number) => {
        setReverseGeocodingLoading(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            )
            const data = await response.json()

            if (data.display_name) {
                setCurrentLocationAddress(data.display_name)
                return data.display_name
            } else {
                setCurrentLocationAddress("Location details not available")
                return null
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error)
            setCurrentLocationAddress("Unable to get location details")
            return null
        } finally {
            setReverseGeocodingLoading(false)
        }
    }

    // Search location
    const searchLocation = async (query: string) => {
        if (!query.trim()) {
            toast.error("Please enter a location to search")
            return
        }

        setSearching(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=np`
            )
            const data: GeocodingResult[] = await response.json()

            if (data.length > 0) {
                setSearchResults(data)
                toast.success(`Found ${data.length} location${data.length > 1 ? 's' : ''}`)
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
    }

    // Handle selecting a search result
    const handleSelectSearchResult = (result: GeocodingResult) => {
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        setMapPosition([lat, lng])
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        setHasLocation(true)

        setCurrentLocationAddress(result.display_name)

        const radius = serviceRadius || 0.1
        const nearest = findNearestSplitters(lat, lng, radius)
        setNearestSplitters(nearest)
        const available = nearest.some(splitter => splitter.distance <= radius)
        setServiceAvailable(available)

        setSearchResults([])
        setSearchQuery("")
        toast.success(`Location set to: ${result.display_name.split(',')[0]}`)
    }

    // Handle map click location select
    const handleLocationSelect = async (lat: number, lng: number) => {
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        setMapPosition([lat, lng])
        setHasLocation(true)

        const radius = serviceRadius || 0.1
        const nearest = findNearestSplitters(lat, lng, radius)
        setNearestSplitters(nearest)

        const available = nearest.some(splitter => splitter.distance <= radius)
        setServiceAvailable(available)

        await reverseGeocode(lat, lng)
        toast.success(`Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    // Handle marker drag end
    const handleMarkerDragEnd = async (lat: number, lng: number) => {
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        setMapPosition([lat, lng])

        const radius = serviceRadius || 0.1
        const nearest = findNearestSplitters(lat, lng, radius)
        setNearestSplitters(nearest)

        const available = nearest.some(splitter => splitter.distance <= radius)
        setServiceAvailable(available)

        await reverseGeocode(lat, lng)
        toast.success(`Marker moved to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    // Handle coordinate input changes
    const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
        if (field === 'latitude') setLatitude(value)
        else setLongitude(value)

        const lat = field === 'latitude' ? parseFloat(value) : parseFloat(latitude || '')
        const lon = field === 'longitude' ? parseFloat(value) : parseFloat(longitude || '')
        if (!isNaN(lat) && !isNaN(lon)) {
            setMapPosition([lat, lon])
            setHasLocation(true)
            const radius = serviceRadius || 0.1
            const nearest = findNearestSplitters(lat, lon, radius)
            setNearestSplitters(nearest)
            const available = nearest.some(splitter => splitter.distance <= radius)
            setServiceAvailable(available)
            reverseGeocode(lat, lon)
        }
    }

    // Handle service radius change
    const handleRadiusChange = (value: number) => {
        setServiceRadius(value)
        if (latitude && longitude) {
            const lat = parseFloat(latitude)
            const lon = parseFloat(longitude)
            if (!isNaN(lat) && !isNaN(lon)) {
                const nearest = findNearestSplitters(lat, lon, value)
                setNearestSplitters(nearest)
                const available = nearest.some(splitter => splitter.distance <= value)
                setServiceAvailable(available)
            }
        }
    }

    // Splitter stats
    const splitterStats = useMemo(() => {
        const total = splitters.length
        const active = splitters.filter(s => s.status === 'active').length
        const withLocation = splitters.filter(s => s.location.latitude && s.location.longitude).length
        const totalPorts = splitters.reduce((sum, s) => sum + s.portCount, 0)
        const totalUsed = splitters.reduce((sum, s) => sum + s.usedPorts, 0)
        return { total, active, withLocation, totalPorts, totalUsed }
    }, [splitters])

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950' : ''}`}>
            <div className={`${isFullscreen ? 'h-full flex flex-col' : 'space-y-4'}`}>

                {/* Stats Row */}
                {!isFullscreen && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
                            <div className="text-xs text-gray-500 dark:text-slate-400">Total Splitters</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{splitterStats.total}</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
                            <div className="text-xs text-gray-500 dark:text-slate-400">Active</div>
                            <div className="text-xl font-bold text-green-600">{splitterStats.active}</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
                            <div className="text-xs text-gray-500 dark:text-slate-400">On Map</div>
                            <div className="text-xl font-bold text-blue-600">{splitterStats.withLocation}</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
                            <div className="text-xs text-gray-500 dark:text-slate-400">Total Ports</div>
                            <div className="text-xl font-bold text-gray-900 dark:text-slate-100">{splitterStats.totalPorts}</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-white dark:bg-slate-900 dark:border-slate-800">
                            <div className="text-xs text-gray-500 dark:text-slate-400">Used Ports</div>
                            <div className="text-xl font-bold text-amber-600">{splitterStats.totalUsed}</div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={`${isFullscreen ? 'flex-1 flex' : 'grid grid-cols-1 lg:grid-cols-3 gap-4'}`}>

                    {/* Map Section */}
                    <div className={`${isFullscreen ? 'flex-1 relative' : 'lg:col-span-2 space-y-4'}`}>

                        {/* Search Bar - positioned above map in fullscreen */}
                        <div className={`${isFullscreen ? 'absolute top-3 left-3 right-3 z-[1000]' : ''}`}>
                            <div className={`${isFullscreen ? 'max-w-xl' : ''}`}>
                                <div className="space-y-2 relative">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search for address, city, or landmark..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        searchLocation(searchQuery)
                                                    }
                                                }}
                                                className="pl-9 bg-white dark:bg-slate-900 shadow-sm"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => searchLocation(searchQuery)}
                                            disabled={searching || !searchQuery.trim()}
                                            className="flex items-center gap-2"
                                        >
                                            {searching ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                            Search
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (navigator.geolocation) {
                                                    navigator.geolocation.getCurrentPosition(
                                                        (position) => {
                                                            const lat = position.coords.latitude
                                                            const lng = position.coords.longitude
                                                            handleLocationSelect(lat, lng)
                                                        },
                                                        () => {
                                                            toast.error("Unable to get current location")
                                                        }
                                                    )
                                                } else {
                                                    toast.error("Geolocation is not supported by your browser")
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-white dark:bg-slate-900"
                                        >
                                            <Navigation className="h-4 w-4" />
                                            <span className="hidden sm:inline">My Location</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setIsFullscreen(!isFullscreen)}
                                            className="bg-white dark:bg-slate-900"
                                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                        >
                                            {isFullscreen ? (
                                                <Minimize2 className="h-4 w-4" />
                                            ) : (
                                                <Maximize2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-lg shadow-xl max-h-80 overflow-y-auto z-[9999]">
                                            <div className="sticky top-0 p-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
                                                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                                    Found {searchResults.length} location{searchResults.length > 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                    Click on a result to set the location
                                                </div>
                                            </div>

                                            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                                {searchResults.map((result) => (
                                                    <button
                                                        type="button"
                                                        key={result.place_id}
                                                        onClick={() => handleSelectSearchResult(result)}
                                                        className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm text-gray-900 dark:text-slate-100 mb-1">
                                                                    {result.name || result.display_name.split(',')[0]}
                                                                </div>
                                                                <div className="text-xs text-gray-600 dark:text-slate-400 mb-2 line-clamp-2">
                                                                    {result.display_name}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <span>📍</span>
                                                                        <span>{parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}</span>
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{result.type}</span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="sticky bottom-0 p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Data from OpenStreetMap</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Map Container */}
                        {isMounted && (
                            <div className={`${isFullscreen ? 'h-full' : 'h-[calc(100dvh-22rem)] min-h-[28rem]'} rounded-lg overflow-hidden border relative`}>
                                <MapContainer
                                    center={mapPosition}
                                    zoom={15}
                                    style={{ height: "100%", width: "100%" }}
                                >
                                    <MapCenterUpdater center={mapPosition} />
                                    <MapResizeHandler />
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='Simulcast Technologies Pvt Ltd'
                                    />

                                    <MapClickHandler onLocationSelect={handleLocationSelect} />

                                    {/* Draggable marker for selected location */}
                                    {hasLocation && latitude && longitude && (
                                        <LocationMarker
                                            position={mapPosition}
                                            draggable={true}
                                            onDragEnd={handleMarkerDragEnd}
                                            address={currentLocationAddress}
                                            serviceAvailable={serviceAvailable}
                                            nearestSplitter={nearestSplitters[0] ? {
                                                distance: nearestSplitters[0].distance ?? 0,
                                                name: nearestSplitters[0].name
                                            } : null}
                                        />
                                    )}

                                    {/* Show splitters on map */}
                                    {splitters
                                        .filter(splitter => splitter.location.latitude && splitter.location.longitude)
                                        .map((splitter) => (
                                            <SplitterMarker key={splitter.id} splitter={splitter} />
                                        ))}

                                    {/* Service area circle */}
                                    {hasLocation && latitude && longitude && (
                                        <Circle
                                            center={mapPosition}
                                            radius={serviceRadius * 1000}
                                            pathOptions={{
                                                fillColor: serviceAvailable ? 'green' : 'red',
                                                color: serviceAvailable ? 'darkgreen' : 'darkred',
                                                fillOpacity: 0.2,
                                                weight: 2
                                            }}
                                        />
                                    )}
                                </MapContainer>

                                <style jsx>{`
                                    :global(.leaflet-control-attribution) {
                                        display: none !important;
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Service Info */}
                    <div className={`${isFullscreen ? 'w-80 border-l bg-white dark:bg-slate-950 overflow-y-auto p-4' : ''} space-y-4`}>

                        {/* Coordinates & Radius */}
                        <CardContainer title="Location & Radius" description="Set coordinates or click the map">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="0.000001"
                                            placeholder="27.7172"
                                            value={latitude}
                                            onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="0.000001"
                                            placeholder="85.3240"
                                            value={longitude}
                                            onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs flex items-center gap-1">
                                        <Ruler className="h-3 w-3" />
                                        Service Radius: {formatDistance(serviceRadius)}
                                    </Label>
                                    <Slider
                                        value={[serviceRadius]}
                                        min={0.05}
                                        max={10}
                                        step={0.05}
                                        onValueChange={(value) => handleRadiusChange(value[0])}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                                        <span>50 m</span>
                                        <span>10 km</span>
                                    </div>
                                </div>
                            </div>
                        </CardContainer>

                        {/* Current Location Info */}
                        <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 rounded-lg">
                            <h4 className="font-medium mb-2 text-sm">📍 Current Location Info</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-slate-400 text-xs">Map Coordinates:</span>
                                    <span className="font-mono text-gray-900 dark:text-slate-100 text-xs">
                                        {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)}
                                    </span>
                                </div>

                                <div>
                                    <div className="text-gray-600 dark:text-slate-400 mb-1 text-xs">Location Address:</div>
                                    {reverseGeocodingLoading ? (
                                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 py-1 text-xs">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Getting address...</span>
                                        </div>
                                    ) : currentLocationAddress ? (
                                        <div className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-gray-200 dark:border-slate-800 dark:text-slate-200 break-words min-h-[40px] max-h-[80px] overflow-y-auto">
                                            {currentLocationAddress}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 dark:text-slate-500 italic p-2 text-xs">Click on map to set location</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Service Availability Badge */}
                        {serviceAvailable !== null && (
                            <div>
                                {serviceAvailable ? (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <div>
                                            <p className="font-medium text-green-800 dark:text-green-300 text-sm">Service Available</p>
                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                Nearest splitter is {formatDistance(nearestSplitters[0]?.distance || 0)} away
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        <div>
                                            <p className="font-medium text-red-800 dark:text-red-300 text-sm">Service Not Available</p>
                                            <p className="text-xs text-red-600 dark:text-red-400">
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
                                <h4 className="font-medium mb-2 text-sm">Nearest Splitters ({nearestSplitters.length})</h4>
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                    {nearestSplitters.map((splitter) => (
                                        <div key={splitter.id} className="p-3 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-slate-100 text-sm">{splitter.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400">
                                                        ID: {splitter.splitterId} • Ratio: {splitter.splitRatio}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                                        {splitter.location.site || 'No site specified'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-gray-900 dark:text-slate-100 text-sm">
                                                        {formatDistance(splitter.distance || 0)}
                                                    </div>
                                                    <Badge className={`mt-1 text-xs ${(splitter.distance ?? 0) <= serviceRadius
                                                        ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                                                        : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400'
                                                        }`}>
                                                        {(splitter.distance ?? 0) <= serviceRadius ? 'Within range' : 'Out of range'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                <span>Available Ports: {splitter.availablePorts}/{splitter.portCount}</span>
                                                <span>•</span>
                                                <span>Type: {splitter.splitterType}</span>
                                                <span>•</span>
                                                <span className={`px-2 py-0.5 rounded ${splitter.status === 'active'
                                                    ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400'
                                                    }`}>
                                                    {splitter.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {nearestSplitters.length === 0 && hasLocation && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                    <div>
                                        <p className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">No Splitters Found</p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                            No splitters found within {formatDistance(serviceRadius)} radius.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        {!isFullscreen && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-400 font-medium mb-1">
                                    Instructions
                                </p>
                                <ul className="list-disc pl-4 space-y-1 text-xs text-blue-700 dark:text-blue-400">
                                    <li>Search for a location or click on the map to set position</li>
                                    <li>Drag the marker to adjust location</li>
                                    <li>Click "My Location" to get your current position</li>
                                    <li>Adjust the service radius slider to check coverage</li>
                                    <li>Use fullscreen mode for a better map view</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
