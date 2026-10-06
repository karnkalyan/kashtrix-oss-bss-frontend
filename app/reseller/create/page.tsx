"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    DollarSign,
    Globe,
    KeyRound,
    Loader2,
    Mail,
    MapPin,
    Percent,
    Phone,
    Save,
    Shield,
    UserCheck,
    Wallet
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";

export default function CreateResellerPage() {
    const router = useRouter();
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Reseller name is required");
            return;
        }
        if (!formData.code.trim()) {
            toast.error("Reseller code is required");
            return;
        }
        if (!formData.email.trim()) {
            toast.error("Email address is required");
            return;
        }
        if (formData.password.length < 8) {
            toast.error("Temporary password must be at least 8 characters long");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiRequest<{ success: boolean; error?: string }>("/resellers", {
                method: "POST",
                body: JSON.stringify(formData)
            });

            if (response?.success) {
                toast.success("Reseller created successfully!");
                router.push("/reseller");
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
            <form onSubmit={handleCreate} className="space-y-6 max-w-5xl mx-auto pb-12">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            asChild
                            className="h-9 w-9"
                        >
                            <Link href="/reseller">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Create New Reseller</h1>
                            <p className="text-sm text-muted-foreground">
                                Register a standalone partner reseller with isolated wallet, commissions, and customer management.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                            <Link href="/reseller">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Save Reseller
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Account & Credentials */}
                    <CardContainer
                        title="Primary Account & Login"
                        description="Basic credentials and identification for the reseller portal"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Reseller / Business Name *</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Kathmandu Valley Net Hub"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Unique Reseller Code *</Label>
                                    <Input
                                        id="code"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                                        placeholder="e.g. KVL_NET"
                                        className="font-mono uppercase"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Used as customer prefix & identifier</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">Contact Person</Label>
                                    <Input
                                        id="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        placeholder="e.g. Ramesh Shrestha"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Official Email Address *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="billing@reseller.com"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Temporary Password *</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            minLength={8}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Min. 8 characters"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="98XXXXXXXX"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContainer>

                    {/* Financial & Commission Settings */}
                    <CardContainer
                        title="Wallet & Commission Settings"
                        description="Revenue share structure and initial operational balance"
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Commission Model</Label>
                                    <Select
                                        value={formData.commissionType}
                                        onValueChange={(val) => setFormData({ ...formData, commissionType: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE">Percentage (%) of Recharge</SelectItem>
                                            <SelectItem value="FLAT">Flat Fee per Recharge (NPR)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Commission Value</Label>
                                    <div className="relative">
                                        {formData.commissionType === "PERCENTAGE" ? (
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.commissionValue}
                                            onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                                            className="pl-9 font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="initialWalletBalance">Initial Wallet Credit (NPR)</Label>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="initialWalletBalance"
                                        type="number"
                                        step="0.01"
                                        value={formData.initialWalletBalance}
                                        onChange={(e) => setFormData({ ...formData, initialWalletBalance: e.target.value })}
                                        placeholder="0.00"
                                        className="pl-9 font-semibold"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Opening balance available in reseller wallet for onboarding customers immediately.
                                </p>
                            </div>

                            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs space-y-1 text-blue-900 dark:text-blue-200">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Independent Ledger
                                </div>
                                <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                                    Each reseller operates on an isolated balance ledger. Recharge deductions occur against their wallet balance in real time.
                                </p>
                            </div>
                        </div>
                    </CardContainer>

                    {/* Legal & Business Entity */}
                    <CardContainer
                        title="Legal & Business Information"
                        description="Official tax and government registration details"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="legalName">Registered Company Name</Label>
                                <Input
                                    id="legalName"
                                    value={formData.legalName}
                                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                                    placeholder="e.g. Kathmandu Valley Communications Pvt. Ltd."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="registrationNo">Company Reg. No.</Label>
                                    <Input
                                        id="registrationNo"
                                        value={formData.registrationNo}
                                        onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                                        placeholder="e.g. 12345/079/080"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="panNo">PAN / VAT Number</Label>
                                    <Input
                                        id="panNo"
                                        value={formData.panNo}
                                        onChange={(e) => setFormData({ ...formData, panNo: e.target.value })}
                                        placeholder="e.g. 601234567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website / Domain</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://reseller-isp.com"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContainer>

                    {/* Location & Address */}
                    <CardContainer
                        title="Location & Physical Address"
                        description="Operating headquarters and postal address"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Street Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Ward No. 4, Main Road"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City / Municipality</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="Kathmandu"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">Province / State</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="Bagmati Province"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Postal / Zip Code</Label>
                                    <Input
                                        id="zipCode"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                        placeholder="44600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        placeholder="Nepal"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContainer>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                        <Link href="/reseller">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[160px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Reseller
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
