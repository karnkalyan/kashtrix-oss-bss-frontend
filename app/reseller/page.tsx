"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { CardContainer } from "@/components/ui/card-container";
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
import {
    Users, Plus, Search, Wallet, Percent, Phone, Mail,
    Edit3, Loader2, Building2
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Reseller {
    id: number;
    name: string;
    code: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    contactPerson?: string;
    isActive: boolean;
    commissionType?: string;
    commissionValue?: number;
    wallet?: { balance: number };
    _count?: { customers: number };
}

export default function ResellerPage() {
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        email: "",
        password: "",
        phoneNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Nepal",
        website: "",
        legalName: "",
        registrationNo: "",
        panNo: "",
        notes: "",
        contactPerson: "",
        commissionType: "PERCENTAGE",
        commissionValue: "10",
        initialWalletBalance: "0"
    });

    const fetchResellers = async () => {
        try {
            setIsLoading(true);
            const response = await apiRequest<{ success: boolean; data: Reseller[] }>(
                `/resellers?search=${encodeURIComponent(search)}`
            );
            if (response?.success) {
                setResellers(response.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch resellers:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchResellers(), 0);
        return () => window.clearTimeout(timer);
    }, [search]);

    const handleCreate = async () => {
        if (!formData.name || !formData.code || !formData.email || formData.password.length < 8) {
            toast.error("Name, code, email, and an 8-character password are required");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiRequest<{ success: boolean; error?: string }>("/resellers", {
                method: "POST",
                body: JSON.stringify(formData)
            });

            if (response?.success) {
                toast.success("Reseller created successfully");
                setIsCreateModalOpen(false);
                setFormData({
                    name: "", code: "", email: "", password: "", phoneNumber: "", address: "",
                    city: "", state: "", zipCode: "", country: "Nepal", website: "",
                    legalName: "", registrationNo: "", panNo: "", notes: "", contactPerson: "", commissionType: "PERCENTAGE",
                    commissionValue: "10", initialWalletBalance: "0"
                });
                fetchResellers();
            } else {
                toast.error(response?.error || "Failed to create reseller");
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error creating reseller");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Standalone Resellers"
                    description="Manage resellers with independent wallets, commissions, and customer assignments"
                />

                {/* Search Bar & Action */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, code, phone..."
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Reseller
                    </Button>
                </div>

                {/* Resellers Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : resellers.length === 0 ? (
                    <CardContainer className="p-8 text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No resellers found</p>
                        <p className="text-xs mt-1">Click &quot;Add Reseller&quot; to create a new standalone reseller</p>
                    </CardContainer>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resellers.map((reseller) => (
                            <CardContainer key={reseller.id} className="p-5 space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{reseller.name}</h3>
                                            <Badge variant={reseller.isActive ? "default" : "secondary"}>
                                                {reseller.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-mono text-muted-foreground">Code: {reseller.code}</p>
                                    </div>
                                    <Button variant="ghost" size="icon-sm">
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 p-3 rounded-lg">
                                    <div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Wallet className="h-3 w-3" /> Wallet Balance
                                        </span>
                                        <p className="font-bold text-primary">NPR {(reseller.wallet?.balance || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Customers
                                        </span>
                                        <p className="font-bold">{reseller._count?.customers || 0}</p>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs text-muted-foreground">
                                    {reseller.contactPerson && (
                                        <p className="flex items-center gap-2">
                                            <Users className="h-3 w-3 text-muted-foreground/70" /> Contact: {reseller.contactPerson}
                                        </p>
                                    )}
                                    {reseller.phoneNumber && (
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground/70" /> {reseller.phoneNumber}
                                        </p>
                                    )}
                                    {reseller.email && (
                                        <p className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-muted-foreground/70" /> {reseller.email}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 border-t flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Percent className="h-3 w-3" /> Commission: {reseller.commissionValue}% ({reseller.commissionType})
                                    </span>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/finance/wallet?resellerId=${reseller.id}&topUp=1`}>
                                            <Wallet className="mr-1 h-3.5 w-3.5" /> Top up / ledger
                                        </Link>
                                    </Button>
                                </div>
                            </CardContainer>
                        ))}
                    </div>
                )}

                {/* Create Reseller Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add Standalone Reseller</DialogTitle>
                            <DialogDescription>Create a new reseller with an independent wallet</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Reseller Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Acme Net"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Unique Code *</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. RES001"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Contact Person</Label>
                                    <Input
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        placeholder="Full name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="98XXXXXXXX"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Login Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="reseller@example.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Temporary Password *</Label>
                                <Input
                                    type="password"
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 8 characters"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Legal Business Name</Label>
                                    <Input value={formData.legalName} onChange={(e) => setFormData({ ...formData, legalName: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Registration Number</Label>
                                    <Input value={formData.registrationNo} onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label>PAN / VAT Number</Label>
                                    <Input value={formData.panNo} onChange={(e) => setFormData({ ...formData, panNo: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Website</Label>
                                    <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Address</Label>
                                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="space-y-1"><Label>City</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                                <div className="space-y-1"><Label>State</Label><Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
                                <div className="space-y-1"><Label>Postal Code</Label><Input value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} /></div>
                                <div className="space-y-1"><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} /></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Commission Type</Label>
                                    <Select
                                        value={formData.commissionType}
                                        onValueChange={(val) => setFormData({ ...formData, commissionType: val })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                            <SelectItem value="FLAT">Flat Amount (NPR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Commission Value</Label>
                                    <Input
                                        type="number"
                                        value={formData.commissionValue}
                                        onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Initial Wallet Balance (NPR)</Label>
                                <Input
                                    type="number"
                                    value={formData.initialWalletBalance}
                                    onChange={(e) => setFormData({ ...formData, initialWalletBalance: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Reseller"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
