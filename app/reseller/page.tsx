"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Users, Plus, Search, Wallet, Percent, Phone, Mail,
    Edit3, Loader2, Building2
} from "lucide-react";
import { apiRequest } from "@/lib/api";
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
                    <Button asChild>
                        <Link href="/reseller/create">
                            <Plus className="mr-2 h-4 w-4" /> Add Reseller
                        </Link>
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

            </div>
        </DashboardLayout>
    );
}
