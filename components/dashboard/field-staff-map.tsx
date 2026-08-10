"use client";

import { useCallback, useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Battery, Clock, MapPin, Loader2, Radio, WifiOff } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface FieldStaffLocation {
    userId: number;
    name: string;
    email: string;
    role: string;
    department: string;
    latestLocation: {
        latitude: number;
        longitude: number;
        accuracy?: number | null;
        battery?: number | null;
        timestamp: string;
        receivedAt?: string;
        permissionStatus?: string;
    } | null;
    locationStatus: "current" | "stale" | "unavailable" | "permission_denied";
    ageSeconds: number | null;
}

function locationTime(location: FieldStaffLocation["latestLocation"]) {
    if (!location?.timestamp) return "Never reported";
    const parsed = new Date(location.timestamp);
    return Number.isNaN(parsed.getTime())
        ? "Unknown time"
        : parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function FieldStaffMap() {
    const [staffList, setStaffList] = useState<FieldStaffLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState<FieldStaffLocation | null>(null);
    const { on, isConnected } = useWebSocket();

    const fetchLocations = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiRequest<{ success: boolean; data: FieldStaffLocation[] }>(
                "/gps/field-staff"
            );
            if (response?.success) {
                const nextStaff = response.data || [];
                setStaffList(nextStaff);
                setSelectedStaff((current) =>
                    nextStaff.find((staff) => staff.userId === current?.userId) ||
                    nextStaff.find((staff) => staff.latestLocation && staff.locationStatus !== "permission_denied") ||
                    nextStaff[0] ||
                    null
                );
            }
        } catch (err) {
            console.error("Failed to fetch staff locations:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    useEffect(() => {
        const unsubscribe = on("gps.location.updated", (event: {
            userId: number;
            latestLocation: FieldStaffLocation["latestLocation"];
            locationStatus: FieldStaffLocation["locationStatus"];
            ageSeconds: number;
        }) => {
            if (!event?.userId || !event.latestLocation) return;

            setStaffList((current) =>
                current.map((staff) =>
                    staff.userId === Number(event.userId)
                        ? {
                            ...staff,
                            latestLocation: event.latestLocation,
                            locationStatus: "current",
                            ageSeconds: 0
                        }
                        : staff
                )
            );
            setSelectedStaff((current) =>
                current?.userId === Number(event.userId)
                    ? {
                        ...current,
                        latestLocation: event.latestLocation,
                        locationStatus: "current",
                        ageSeconds: 0
                    }
                    : current
            );
        });

        return () => {
            unsubscribe();
        };
    }, [on]);

    return (
        <CardContainer className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-primary" /> Live Field Staff GPS Location
                    </h3>
                    <p className="text-xs text-muted-foreground">Real-time GPS tracking of field staff and technicians</p>
                </div>
                <Badge
                    variant="outline"
                    className={isConnected
                        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600"
                        : "border-amber-500/40 bg-amber-500/5 text-amber-600"}
                >
                    {isConnected
                        ? <><Radio className="mr-1.5 h-3.5 w-3.5 animate-pulse" /> Live updates</>
                        : <><WifiOff className="mr-1.5 h-3.5 w-3.5" /> Reconnecting</>}
                </Badge>
            </div>

            {isLoading && staffList.length === 0 ? (
                <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : staffList.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">No live field staff location reported yet</p>
                    <p className="text-xs mt-1">Field staff can enable GPS tracking on the mobile staff app</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Staff List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {staffList.map((staff) => (
                            <div
                                key={staff.userId}
                                onClick={() => setSelectedStaff(staff)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedStaff?.userId === staff.userId
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "hover:bg-muted/40"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm">{staff.name}</div>
                                    <div className="flex items-center gap-1">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${
                                                staff.locationStatus === "current"
                                                    ? "border-emerald-500/40 text-emerald-600"
                                                    : staff.locationStatus === "stale"
                                                        ? "border-amber-500/40 text-amber-600"
                                                        : "text-muted-foreground"
                                            }`}
                                        >
                                            {staff.locationStatus.replace("_", " ")}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px]">{staff.role}</Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {locationTime(staff.latestLocation)}
                                    </span>
                                    {staff.latestLocation?.battery !== undefined && staff.latestLocation?.battery !== null && (
                                        <span className="flex items-center gap-1">
                                            <Battery className="h-3 w-3" />
                                            {staff.latestLocation.battery}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Selected Staff Location Details / Map Embed */}
                    <div className="lg:col-span-2 border rounded-lg p-4 bg-muted/10 space-y-3 flex flex-col justify-between">
                        {selectedStaff?.latestLocation && selectedStaff.locationStatus !== "permission_denied" ? (
                            <>
                                <div className="flex items-center justify-between pb-3 border-b">
                                    <div>
                                        <h4 className="font-bold text-base">{selectedStaff.name}</h4>
                                        <p className="text-xs text-muted-foreground">{selectedStaff.department} • {selectedStaff.email}</p>
                                    </div>
                                    <a
                                        href={`https://maps.google.com/?q=${selectedStaff.latestLocation.latitude},${selectedStaff.latestLocation.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button size="sm">
                                            <MapPin className="mr-1 h-3.5 w-3.5" /> Open in Google Maps
                                        </Button>
                                    </a>
                                </div>

                                {/* OpenStreetMap iFrame Embed */}
                                <div className="w-full h-64 rounded-lg overflow-hidden border">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        scrolling="no"
                                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedStaff.latestLocation.longitude - 0.005}%2C${selectedStaff.latestLocation.latitude - 0.005}%2C${selectedStaff.latestLocation.longitude + 0.005}%2C${selectedStaff.latestLocation.latitude + 0.005}&layer=mapnik&marker=${selectedStaff.latestLocation.latitude}%2C${selectedStaff.latestLocation.longitude}`}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs text-center bg-background p-2 rounded-md border">
                                    <div>
                                        <span className="text-muted-foreground block">Latitude</span>
                                        <span className="font-mono font-medium">{selectedStaff.latestLocation.latitude.toFixed(6)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Longitude</span>
                                        <span className="font-mono font-medium">{selectedStaff.latestLocation.longitude.toFixed(6)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Accuracy</span>
                                        <span className="font-mono font-medium">{selectedStaff.latestLocation.accuracy ? `±${selectedStaff.latestLocation.accuracy}m` : "N/A"}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="font-medium">
                                    {selectedStaff?.locationStatus === "permission_denied"
                                        ? "Location permission denied"
                                        : selectedStaff
                                            ? "No location reported"
                                            : "Select a staff member"}
                                </p>
                                <p className="text-xs mt-1">
                                    {selectedStaff
                                        ? "This staff account remains listed and will appear on the map after a valid GPS update."
                                        : "Choose a staff member to view their latest reported location."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </CardContainer>
    );
}
