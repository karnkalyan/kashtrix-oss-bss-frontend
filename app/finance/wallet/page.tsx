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
    Wallet, ArrowUpRight, ArrowDownRight, RefreshCw,
    History, Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface WalletData {
    id: number;
    balance: number | string;
    availableBalance?: number | string;
    reservedBalance?: number | string;
    branchId?: number;
    resellerId?: number;
}

interface Transaction {
    id: number;
    type: "CREDIT" | "DEBIT";
    amount: number | string;
    balanceAfter: number | string;
    description?: string;
    reference?: string;
    relatedCustomerId?: number;
    relatedInvoiceId?: string;
    metadata?: Record<string, unknown>;
    createdBy?: { id: number; name?: string | null; email: string } | null;
    createdAt: string;
}

interface ResellerOption {
    id: number;
    name: string;
    code: string;
}

export default function WalletPage() {
    const { user } = useAuth();
    const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
    const isAdministrator = ["administrator", "admin", "isp_admin", "super admin", "super_admin"].includes(String(roleName || "").toLowerCase());
    const [resellers, setResellers] = useState<ResellerOption[]>([]);
    const [selectedResellerId, setSelectedResellerId] = useState("");
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [topUpForm, setTopUpForm] = useState({
        amount: "",
        referenceNo: "",
        notes: "",
        paymentMethod: "BANK_TRANSFER",
        bankName: "",
        receiptNumber: ""
    });
    const depositedBy = user?.name || user?.email || "Authenticated user";

    const fetchWalletData = async () => {
        if (isAdministrator && !selectedResellerId) return;
        try {
            setIsLoading(true);
            const ownerQuery = selectedResellerId ? `?resellerId=${selectedResellerId}` : "";
            const [wRes, tRes] = await Promise.all([
                apiRequest<{ success: boolean; data: WalletData }>(`/wallets${ownerQuery}`),
                apiRequest<{ success: boolean; data: Transaction[] }>(`/wallets/transactions${ownerQuery}`)
            ]);

            if (wRes?.success) setWallet(wRes.data);
            if (tRes?.success) setTransactions(tRes.data || []);
        } catch (err) {
            console.error("Failed to load wallet data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdministrator) {
            const timer = window.setTimeout(() => void fetchWalletData(), 0);
            return () => window.clearTimeout(timer);
        }
        const timer = window.setTimeout(async () => {
            try {
                const response = await apiRequest<{ success: boolean; data: ResellerOption[] }>("/resellers?limit=100");
                const options = response?.data || [];
                const requestedId = new URLSearchParams(window.location.search).get("resellerId") || "";
                setResellers(options);
                setSelectedResellerId(current => current || (options.some(option => String(option.id) === requestedId) ? requestedId : String(options[0]?.id || "")));
                if (requestedId && new URLSearchParams(window.location.search).get("topUp") === "1") setIsTopUpOpen(true);
                if (!options.length) setIsLoading(false);
            } catch {
                setIsLoading(false);
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, [isAdministrator]);

    useEffect(() => {
        if (!selectedResellerId) return;
        const timer = window.setTimeout(() => void fetchWalletData(), 0);
        return () => window.clearTimeout(timer);
    }, [selectedResellerId]);

    const handleTopUp = async () => {
        if (!topUpForm.amount || parseFloat(topUpForm.amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiRequest<{ success: boolean; error?: string }>("/wallets/add-funds", {
                method: "POST",
                body: JSON.stringify({
                    resellerId: Number(selectedResellerId),
                    amount: topUpForm.amount,
                    referenceNo: topUpForm.referenceNo,
                    notes: topUpForm.notes,
                    paymentMethod: topUpForm.paymentMethod,
                    bankName: topUpForm.bankName,
                    receiptNumber: topUpForm.receiptNumber
                })
            });

            if (response?.success) {
                toast.success("Wallet top-up successful!");
                setIsTopUpOpen(false);
                setTopUpForm({ amount: "", referenceNo: "", notes: "", paymentMethod: "BANK_TRANSFER", bankName: "", receiptNumber: "" });
                fetchWalletData();
            } else {
                toast.error(response?.error || "Failed to top up wallet");
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Error topping up wallet");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Prepaid Wallet Management"
                    description="View running balances, top up wallet funds, and audit activation transaction histories"
                    actions={isAdministrator && selectedResellerId ? [
                        { label: "Top Up Wallet", onClick: () => setIsTopUpOpen(true) }
                    ] : []}
                />
                {isAdministrator && (
                    <div className="max-w-md space-y-2">
                        <Label>Reseller Wallet</Label>
                        <SearchableSelect
                            options={resellers.map(reseller => ({ value: String(reseller.id), label: `${reseller.name} (${reseller.code})` }))}
                            value={selectedResellerId}
                            onValueChange={(value) => setSelectedResellerId(String(value))}
                            placeholder="Choose reseller"
                        />
                    </div>
                )}

                {/* Balance Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CardContainer className="p-6 col-span-1 border-l-4 border-l-primary space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs uppercase font-medium">Available Wallet Balance</span>
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-3xl font-extrabold text-primary">
                            NPR {Number(wallet?.availableBalance ?? wallet?.balance ?? 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Used automatically for subscriber recharges & package renewals
                        </p>
                    </CardContainer>
                </div>

                {/* Transaction Ledger Table */}
                <CardContainer className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" /> Transaction Ledger
                        </h3>
                        <Button variant="outline" size="sm" onClick={fetchWalletData}>
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No wallet transactions recorded yet
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground bg-muted/30">
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Balance After</th>
                                        <th className="p-3">Payment Details</th>
                                        <th className="p-3">Deposited By</th>
                                        <th className="p-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b hover:bg-muted/30">
                                            <td className="p-3">
                                                <Badge variant={tx.type === "CREDIT" ? "default" : "destructive"} className="flex items-center gap-1 w-fit">
                                                    {tx.type === "CREDIT" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                                    {tx.type}
                                                </Badge>
                                            </td>
                                            <td className={`p-3 font-semibold ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                                                {tx.type === "CREDIT" ? "+" : "-"} NPR {Number(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="p-3 font-mono font-medium">
                                                NPR {Number(tx.balanceAfter).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-xs">
                                                <div>{tx.description || "Wallet Transaction"}</div>
                                                <div className="text-muted-foreground">Method: {String(tx.metadata?.paymentMethod || "N/A")}</div>
                                                <div className="text-muted-foreground">Bank/source: {String(tx.metadata?.bankName || "N/A")}</div>
                                                <div className="text-muted-foreground">Reference: {tx.reference || tx.relatedInvoiceId || "N/A"}</div>
                                                <div className="text-muted-foreground">Receipt: {String(tx.metadata?.receiptNumber || "N/A")}</div>
                                            </td>
                                            <td className="p-3 text-xs">
                                                <div className="font-medium">{String(tx.metadata?.depositedBy || tx.createdBy?.name || tx.createdBy?.email || "System")}</div>
                                                {tx.createdBy?.email && <div className="text-muted-foreground">{tx.createdBy.email}</div>}
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContainer>

                {/* Top Up Modal */}
                <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Top Up Wallet Funds</DialogTitle>
                            <DialogDescription>Credit balance into wallet account</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 text-sm">
                            <div className="space-y-1">
                                <Label>Amount (NPR) *</Label>
                                <Input
                                    type="number"
                                    value={topUpForm.amount}
                                    onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                                    placeholder="e.g. 5000"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Payment Method</Label>
                                    <SearchableSelect
                                        options={[
                                            { value: "BANK_TRANSFER", label: "Bank Transfer" },
                                            { value: "CASH", label: "Cash" },
                                            { value: "CHEQUE", label: "Cheque" },
                                            { value: "DIGITAL_WALLET", label: "Digital Wallet" },
                                            { value: "CARD", label: "Card" },
                                        ]}
                                        value={topUpForm.paymentMethod}
                                        onValueChange={(value) => setTopUpForm({ ...topUpForm, paymentMethod: String(value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Bank / Source</Label>
                                    <Input value={topUpForm.bankName} onChange={(e) => setTopUpForm({ ...topUpForm, bankName: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Deposited By</Label>
                                    <Input value={depositedBy} readOnly aria-readonly="true" className="bg-muted cursor-not-allowed" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Receipt Number</Label>
                                    <Input value={topUpForm.receiptNumber} onChange={(e) => setTopUpForm({ ...topUpForm, receiptNumber: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Reference # / Bank Slip</Label>
                                <Input
                                    value={topUpForm.referenceNo}
                                    onChange={(e) => setTopUpForm({ ...topUpForm, referenceNo: e.target.value })}
                                    placeholder="Bank voucher or cheque reference"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>Notes / Remark</Label>
                                <Input
                                    value={topUpForm.notes}
                                    onChange={(e) => setTopUpForm({ ...topUpForm, notes: e.target.value })}
                                    placeholder="Optional note"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsTopUpOpen(false)}>Cancel</Button>
                            <Button onClick={handleTopUp} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Top Up"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
