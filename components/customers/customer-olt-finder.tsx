"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Router, Loader2, MapPin, Link2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";

interface OLTFinderProps {
    isOpen: boolean;
    onClose: () => void;
    macAddress?: string;
    customerId?: number;
    onOltLinked?: (oltId: number, ontData: any) => void;
}

interface FSPMatch {
    macAddress: string;
    portType: string;
    macType: string;
    frame: number;
    slot: number;
    port: number;
    fsp: string;
    ontId: number;
    gemIndex: number;
    vlan: number;
    srvpIndex?: number;
    interface?: string;
}

interface OLTResult {
    oltId: number;
    oltName: string;
    oltIp: string;
    oltVendor: string;
    matches: FSPMatch[];
}

interface SearchResponse {
    success: boolean;
    macAddress: string;
    totalMatches: number;
    results: OLTResult[];
}

/**
 * Convert any MAC format to vendor-specific format for display.
 * Huawei: xxxx-xxxx-xxxx
 * BDCOM/Cisco: xxxx.xxxx.xxxx
 * Standard: XX:XX:XX:XX:XX:XX
 */
function formatMacForVendor(mac: string, vendor?: string): string {
    const clean = mac.replace(/[:\-.\s]/g, "").toLowerCase();
    if (clean.length !== 12) return mac;

    const v = (vendor || "").toLowerCase();
    if (v.includes("huawei")) {
        return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
    }
    if (v.includes("bdcom") || v.includes("cisco")) {
        return `${clean.slice(0, 4)}.${clean.slice(4, 8)}.${clean.slice(8, 12)}`;
    }
    // Standard format
    return clean.replace(/(.{2})/g, "$1:").slice(0, 17);
}

export function CustomerOLTFinder({ isOpen, onClose, macAddress = "", customerId, onOltLinked }: OLTFinderProps) {
    const [mac, setMac] = useState(macAddress);
    const [oltId, setOltId] = useState("all");
    const [olts, setOlts] = useState<{ id: number; name: string; vendor: string; ipAddress: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingOlts, setIsLoadingOlts] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
    const [isLinking, setIsLinking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (macAddress) setMac(macAddress);
            loadOLTs();
        }
    }, [isOpen, macAddress]);

    // Load OLTs on dialog open
    const loadOLTs = async () => {
        try {
            setIsLoadingOlts(true);
            const response = await apiRequest<any>("/olt?limit=100");
            const list = Array.isArray(response) ? response : (response?.data || response?.olts || []);
            setOlts(list.map((o: any) => ({
                id: o.id,
                name: o.name || `OLT #${o.id}`,
                vendor: o.vendor || o.brand || "OLT",
                ipAddress: o.ipAddress || o.host || ""
            })));
        } catch (err) {
            console.error("Failed to load OLTs:", err);
        } finally {
            setIsLoadingOlts(false);
        }
    };

    const handleSearch = async () => {
        if (!mac.trim()) {
            toast.error("Please enter a MAC address");
            return;
        }

        try {
            setIsSearching(true);
            setSearchResults(null);
            const response = await apiRequest<SearchResponse>(`/olt/${oltId}/find-fsp-by-mac`, {
                method: "POST",
                body: JSON.stringify({ macAddress: mac.trim() }),
            });

            if (response.success) {
                setSearchResults(response);
                if (response.totalMatches === 0) {
                    toast("No matches found for this MAC address", { icon: "⚠️" });
                } else {
                    toast.success(`Found ${response.totalMatches} match(es) on ${response.results.length} OLT(s)`);
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Search failed");
        } finally {
            setIsSearching(false);
        }
    };

    const handleLinkToOlt = async (oltResult: OLTResult, match: FSPMatch) => {
        try {
            setIsLinking(true);
            if (!customerId) throw new Error("A customer is required before an OLT mapping can be created");
            const payload = {
                customerId,
                fsp: match.fsp,
                ontId: match.ontId,
                vlan: match.vlan,
                macAddress: match.macAddress,
            };
            try {
                await apiRequest(`/olt/${oltResult.oltId}/link-customer-device`, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
            } catch (error: any) {
                if (!/different OLT mapping|confirm replacement|OLT_MAPPING_CONFLICT/i.test(error?.message || "")) throw error;
                if (!window.confirm("This customer already has a different OLT mapping. Replace it with the discovered mapping?")) return;
                await apiRequest(`/olt/${oltResult.oltId}/link-customer-device`, {
                    method: "POST",
                    body: JSON.stringify({ ...payload, replaceExisting: true }),
                });
            }
            onOltLinked?.(oltResult.oltId, {
                oltId: oltResult.oltId,
                oltName: oltResult.oltName,
                fsp: match.fsp,
                ontId: match.ontId,
                vlan: match.vlan,
                macAddress: match.macAddress,
            });
            toast.success(`Linked to OLT ${oltResult.oltName} at F/S/P ${match.fsp}`);
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to link");
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); else loadOLTs(); }}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Find OLT by MAC Address
                    </DialogTitle>
                    <DialogDescription>
                        Search for the OLT frame/slot/port where this MAC address is located
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* MAC Address Input */}
                    <div className="space-y-2">
                        <Label>MAC Address</Label>
                        <Input
                            value={mac}
                            onChange={(e) => setMac(e.target.value)}
                            placeholder="AA:BB:CC:DD:EE:FF or aabb-ccdd-eeff"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Accepts any format: AA:BB:CC:DD:EE:FF, AABB-CCDD-EEFF, AABB.CCDD.EEFF
                        </p>
                    </div>

                    {/* OLT Selection */}
                    <div className="space-y-2">
                        <Label>Search On</Label>
                        <Select value={oltId} onValueChange={setOltId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select OLT" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">🔍 Search All OLTs</SelectItem>
                                {olts.map((olt) => (
                                    <SelectItem key={olt.id} value={String(olt.id)}>
                                        {olt.name} ({olt.vendor} - {olt.ipAddress})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search Button */}
                    <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                        {isSearching ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...</>
                        ) : (
                            <><Search className="mr-2 h-4 w-4" /> Search</>
                        )}
                    </Button>

                    {/* Results */}
                    {searchResults && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">
                                    Results ({searchResults.totalMatches} match{searchResults.totalMatches !== 1 ? "es" : ""})
                                </h4>
                                <Badge variant={searchResults.totalMatches > 0 ? "default" : "destructive"}>
                                    {searchResults.totalMatches > 0 ? "Found" : "Not Found"}
                                </Badge>
                            </div>

                            {searchResults.results.map((oltResult) => (
                                <div key={oltResult.oltId} className="border rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Router className="h-4 w-4 text-primary" />
                                        <span className="font-medium">{oltResult.oltName}</span>
                                        <Badge variant="outline" className="text-xs">{oltResult.oltVendor}</Badge>
                                        <span className="text-xs text-muted-foreground">{oltResult.oltIp}</span>
                                    </div>

                                    {oltResult.matches.map((match, idx) => (
                                        <div key={idx} className="bg-muted/50 rounded-md p-3 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="font-mono font-bold text-primary">
                                                        F/S/P: {match.fsp}
                                                    </span>
                                                    {match.ontId !== undefined && (
                                                        <span className="text-muted-foreground">
                                                            ONT ID: {match.ontId}
                                                        </span>
                                                    )}
                                                    <span className="text-muted-foreground">
                                                        VLAN: {match.vlan}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-mono">{formatMacForVendor(match.macAddress, oltResult.oltVendor)}</span>
                                                    {match.portType && <Badge variant="outline" className="text-xs">{match.portType}</Badge>}
                                                    {match.gemIndex !== undefined && <span>GEM: {match.gemIndex}</span>}
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleLinkToOlt(oltResult, match)}
                                                disabled={isLinking}
                                            >
                                                <Link2 className="mr-1 h-3 w-3" />
                                                Link to OLT
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {searchResults.totalMatches === 0 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No matching MAC address found on any OLT.</p>
                                    <p className="text-xs mt-1">Make sure the device is connected and the MAC address is correct.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
