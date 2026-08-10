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
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    TrendingUp, TrendingDown, DollarSign, Wallet, ArrowRightLeft,
    Plus, FileText, ShoppingBag, Receipt, PieChart, RefreshCw,
    Calendar, CheckCircle2, Loader2, Building2, Tag, Package, Trash2, AlertTriangle, Printer
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";

interface DashboardData {
    totalSales: number;
    totalPaidSales: number;
    totalDueSales: number;
    totalSalesCount: number;
    totalPurchases: number;
    totalPaidPurchases: number;
    totalPurchasesCount: number;
    totalExpenses: number;
    totalExpensesCount: number;
    netProfit: number;
    accounts: { id: number; name: string; type: string; balance: number }[];
    salesByCategory: any[];
    expensesByCategory: any[];
}

interface SaleLineItem {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
    createNew?: boolean;
}

export default function AccountingPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");

    // Lists
    const [sales, setSales] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [transfers, setTransfers] = useState<any[]>([]);
    const [billingAccounts, setBillingAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // Create Modals
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sales Form State with Multi-Item, Discount, Tax
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);
    const [saleCategoryId, setSaleCategoryId] = useState("");
    const [saleBillingAccountId, setSaleBillingAccountId] = useState("");
    const [saleLineItems, setSaleLineItems] = useState<SaleLineItem[]>([
        { description: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0, total: 0 }
    ]);
    const [overallDiscount, setOverallDiscount] = useState("0");
    const [overallTax, setOverallTax] = useState("0");
    const [paidAmount, setPaidAmount] = useState("");

    // Simple Forms
    const [purchaseForm, setPurchaseForm] = useState({
        vendorName: "", categoryId: "", billingAccountId: "",
        description: "", amount: "", paidAmount: ""
    });
    const [expenseForm, setExpenseForm] = useState({
        description: "", categoryId: "", billingAccountId: "", amount: ""
    });
    const [transferForm, setTransferForm] = useState({
        fromAccountId: "", toAccountId: "", amount: "", description: ""
    });
    const [accountForm, setAccountForm] = useState({
        name: "", type: "BANK", accountNo: "", initialBalance: "0"
    });

    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            const res = await apiRequest<{ success: boolean; data: DashboardData }>("/accounting/dashboard");
            if (res?.success) setData(res.data);
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllData = async () => {
        try {
            const [sRes, pRes, eRes, tRes, aRes, cRes, iRes, custRes] = await Promise.all([
                apiRequest<any>("/accounting/sales"),
                apiRequest<any>("/accounting/purchases"),
                apiRequest<any>("/accounting/expenses"),
                apiRequest<any>("/accounting/transfers"),
                apiRequest<any>("/accounting/accounts"),
                apiRequest<any>("/accounting/categories"),
                apiRequest<any>("/accounting/items"),
                apiRequest<any>("/api/customer?limit=100").catch(() => ({ data: [] }))
            ]);
            if (sRes?.data) setSales(sRes.data);
            if (pRes?.data) setPurchases(pRes.data);
            if (eRes?.data) setExpenses(eRes.data);
            if (tRes?.data) setTransfers(tRes.data);
            if (aRes?.data) setBillingAccounts(aRes.data);
            if (cRes?.data) setCategories(cRes.data);
            if (iRes?.data) setItems(iRes.data);
            if (custRes?.data) setCustomers(custRes.data);
        } catch (err) {
            console.error("Data fetch error:", err);
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchAllData();
    }, []);

    // When Customer is selected in Sale Modal, check subscription status
    const handleCustomerChange = async (custVal: string) => {
        setSelectedCustomerId(custVal);
        setSubscriptionNotice(null);
        if (!custVal) return;

        try {
            const res = await apiRequest<any>(`/accounting/customer-subscription-check/${custVal}`);
            if (res?.success && res.data) {
                setCustomerName(res.data.customerName || "");
                if (res.data.isExpired && res.data.package) {
                    setSubscriptionNotice(`⚠️ Customer subscription '${res.data.package.name}' is EXPIRED! Subscription package preloaded below.`);
                    setSaleLineItems([
                        {
                            description: `Subscription Recharge: ${res.data.package.name}`,
                            quantity: 1,
                            unitPrice: res.data.package.price || 0,
                            discount: 0,
                            tax: 0,
                            total: res.data.package.price || 0
                        }
                    ]);
                }
            }
        } catch (err) {
            console.error("Failed to check subscription:", err);
        }
    };

    // Calculate totals for Sale Form
    const subtotal = saleLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const lineDiscounts = saleLineItems.reduce((sum, item) => sum + item.discount, 0);
    const lineTaxes = saleLineItems.reduce((sum, item) => sum + item.tax, 0);
    const overallDiscVal = parseFloat(overallDiscount || "0");
    const overallTaxVal = parseFloat(overallTax || "0");
    const totalDiscount = lineDiscounts + overallDiscVal;
    const totalTax = lineTaxes + overallTaxVal;
    const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

    // Line item helpers
    const addLineItem = () => {
        setSaleLineItems([...saleLineItems, { description: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0, total: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (saleLineItems.length === 1) return;
        setSaleLineItems(saleLineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: keyof SaleLineItem, value: any) => {
        const updated = [...saleLineItems];
        const item = { ...updated[index], [field]: value };

        // If item ID chosen from catalog, fill name and price
        if (field === "itemId" && value) {
            const catItem = items.find(i => String(i.id) === String(value));
            if (catItem) {
                item.description = catItem.name;
                item.unitPrice = catItem.unitPrice || 0;
            }
        }

        const qty = item.quantity || 1;
        const price = item.unitPrice || 0;
        const disc = item.discount || 0;
        const tx = item.tax || 0;
        item.total = Math.max(0, (qty * price) - disc + tx);

        updated[index] = item;
        setSaleLineItems(updated);
    };

    // Submit Handlers
    const handleCreateSale = async () => {
        if (saleLineItems.some(i => !i.description.trim())) {
            toast.error("Please enter a description for all items");
            return;
        }

        try {
            setIsSubmitting(true);
            const body = {
                customerId: selectedCustomerId ? parseInt(selectedCustomerId) : undefined,
                customerName: customerName || "Walk-in Customer",
                categoryId: saleCategoryId ? parseInt(saleCategoryId) : undefined,
                billingAccountId: saleBillingAccountId ? parseInt(saleBillingAccountId) : undefined,
                items: saleLineItems.map(i => ({
                    itemId: i.itemId ? parseInt(i.itemId) : undefined,
                    description: i.description,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    discount: i.discount,
                    tax: i.tax,
                    total: i.total,
                    createNew: !i.itemId
                })),
                discountAmount: totalDiscount,
                taxAmount: totalTax,
                paidAmount: paidAmount ? parseFloat(paidAmount) : grandTotal,
            };

            const res = await apiRequest<any>("/accounting/sales", {
                method: "POST",
                body: JSON.stringify(body)
            });

            if (res?.success) {
                toast.success("Sale created & Invoice generated!");
                setIsSaleModalOpen(false);
                setSelectedCustomerId("");
                setCustomerName("");
                setSaleLineItems([{ description: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0, total: 0 }]);
                fetchDashboard(); fetchAllData();
            }
        } catch (err: any) { toast.error(err.message || "Failed to create sale"); }
        finally { setIsSubmitting(false); }
    };

    const handleCreatePurchase = async () => {
        if (!purchaseForm.amount) return toast.error("Amount is required");
        try {
            setIsSubmitting(true);
            const res = await apiRequest<any>("/accounting/purchases", {
                method: "POST",
                body: JSON.stringify({
                    vendorName: purchaseForm.vendorName || "Vendor",
                    categoryId: purchaseForm.categoryId ? parseInt(purchaseForm.categoryId) : undefined,
                    billingAccountId: purchaseForm.billingAccountId ? parseInt(purchaseForm.billingAccountId) : undefined,
                    paidAmount: parseFloat(purchaseForm.paidAmount || purchaseForm.amount),
                    items: [{ description: purchaseForm.description || "Vendor Item Purchase", quantity: 1, unitPrice: parseFloat(purchaseForm.amount) }]
                })
            });
            if (res?.success) {
                toast.success("Purchase recorded!");
                setIsPurchaseModalOpen(false);
                fetchDashboard(); fetchAllData();
            }
        } catch (err: any) { toast.error(err.message || "Failed to create purchase"); }
        finally { setIsSubmitting(false); }
    };

    const handleCreateExpense = async () => {
        if (!expenseForm.amount) return toast.error("Amount is required");
        try {
            setIsSubmitting(true);
            const res = await apiRequest<any>("/accounting/expenses", {
                method: "POST",
                body: JSON.stringify({
                    description: expenseForm.description || "Daily Expense",
                    categoryId: expenseForm.categoryId ? parseInt(expenseForm.categoryId) : undefined,
                    billingAccountId: expenseForm.billingAccountId ? parseInt(expenseForm.billingAccountId) : undefined,
                    amount: parseFloat(expenseForm.amount)
                })
            });
            if (res?.success) {
                toast.success("Expense recorded!");
                setIsExpenseModalOpen(false);
                fetchDashboard(); fetchAllData();
            }
        } catch (err: any) { toast.error(err.message || "Failed to create expense"); }
        finally { setIsSubmitting(false); }
    };

    const handleCreateTransfer = async () => {
        if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.amount) {
            return toast.error("Please fill in all transfer fields");
        }
        try {
            setIsSubmitting(true);
            const res = await apiRequest<any>("/accounting/transfers", {
                method: "POST",
                body: JSON.stringify({
                    fromAccountId: parseInt(transferForm.fromAccountId),
                    toAccountId: parseInt(transferForm.toAccountId),
                    amount: parseFloat(transferForm.amount),
                    description: transferForm.description || "Account Transfer"
                })
            });
            if (res?.success) {
                toast.success("Account Transfer completed!");
                setIsTransferModalOpen(false);
                fetchDashboard(); fetchAllData();
            }
        } catch (err: any) { toast.error(err.message || "Failed transfer"); }
        finally { setIsSubmitting(false); }
    };

    const handleCreateAccount = async () => {
        if (!accountForm.name) return toast.error("Account name is required");
        try {
            setIsSubmitting(true);
            const res = await apiRequest<any>("/accounting/accounts", {
                method: "POST",
                body: JSON.stringify({
                    name: accountForm.name,
                    type: accountForm.type,
                    accountNo: accountForm.accountNo,
                    initialBalance: parseFloat(accountForm.initialBalance || "0")
                })
            });
            if (res?.success) {
                toast.success("Billing Account created!");
                setIsAccountModalOpen(false);
                fetchDashboard(); fetchAllData();
            }
        } catch (err: any) { toast.error(err.message || "Failed to create account"); }
        finally { setIsSubmitting(false); }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Accounting & Billing Management"
                    description="Sales, Purchases, Expenses, Account-to-Account Transfers, & Financial Reports"
                    actions={[
                        { label: "Record Sale", onClick: () => setIsSaleModalOpen(true) },
                        { label: "Add Expense", onClick: () => setIsExpenseModalOpen(true) },
                        { label: "Vendor Purchase", onClick: () => setIsPurchaseModalOpen(true) },
                        { label: "Account Transfer", onClick: () => setIsTransferModalOpen(true) }
                    ]}
                />

                {/* Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="flex flex-wrap h-auto p-1">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="sales">Sales & Invoices</TabsTrigger>
                        <TabsTrigger value="purchases">Purchases</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="transfers">Transfers</TabsTrigger>
                        <TabsTrigger value="accounts">Billing Accounts</TabsTrigger>
                    </TabsList>

                    {/* DASHBOARD TAB */}
                    <TabsContent value="dashboard" className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CardContainer className="p-5 border-l-4 border-l-green-500 space-y-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Total Sales Revenue</span>
                                <div className="text-2xl font-bold text-green-600">
                                    NPR {(data?.totalSales || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">{data?.totalSalesCount || 0} sales transactions</p>
                            </CardContainer>

                            <CardContainer className="p-5 border-l-4 border-l-red-500 space-y-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Total Expenses</span>
                                <div className="text-2xl font-bold text-red-600">
                                    NPR {(data?.totalExpenses || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">{data?.totalExpensesCount || 0} expense items</p>
                            </CardContainer>

                            <CardContainer className="p-5 border-l-4 border-l-orange-500 space-y-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Vendor Purchases</span>
                                <div className="text-2xl font-bold text-orange-600">
                                    NPR {(data?.totalPurchases || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">{data?.totalPurchasesCount || 0} purchase orders</p>
                            </CardContainer>

                            <CardContainer className="p-5 border-l-4 border-l-blue-500 space-y-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase">Net Income</span>
                                <div className={`text-2xl font-bold ${(data?.netProfit || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                    NPR {(data?.netProfit || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Revenue - (Expenses + Purchases)</p>
                            </CardContainer>
                        </div>

                        {/* Billing Accounts Summary */}
                        <CardContainer className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-primary" /> Billing Accounts Balances
                                </h3>
                                <Button size="sm" variant="outline" onClick={() => setIsAccountModalOpen(true)}>
                                    <Plus className="mr-1 h-3.5 w-3.5" /> New Account
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {billingAccounts.map((acc) => (
                                    <div key={acc.id} className="bg-muted/30 border rounded-lg p-4 space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <Badge variant="outline">{acc.type}</Badge>
                                            {acc.accountNo && <span>Acc: {acc.accountNo}</span>}
                                        </div>
                                        <h4 className="font-semibold">{acc.name}</h4>
                                        <p className="text-xl font-bold text-primary">NPR {acc.balance.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContainer>
                    </TabsContent>

                    {/* SALES TAB */}
                    <TabsContent value="sales" className="space-y-4">
                        <CardContainer className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Sales Records & Generated Invoices</h3>
                                <Button size="sm" onClick={() => setIsSaleModalOpen(true)}><Plus className="mr-1 h-4 w-4" /> Record Sale</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground bg-muted/30">
                                            <th className="p-3">Invoice #</th>
                                            <th className="p-3">Customer</th>
                                            <th className="p-3">Subtotal</th>
                                            <th className="p-3">Discount</th>
                                            <th className="p-3">Tax</th>
                                            <th className="p-3">Grand Total</th>
                                            <th className="p-3">Paid</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Billing Account</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.map((s) => (
                                            <tr key={s.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-mono font-medium text-primary">{s.invoiceNumber}</td>
                                                <td className="p-3 font-medium">{s.customerName}</td>
                                                <td className="p-3">NPR {s.subtotal.toLocaleString()}</td>
                                                <td className="p-3 text-muted-foreground">NPR {(s.discountAmount || 0).toLocaleString()}</td>
                                                <td className="p-3 text-muted-foreground">NPR {(s.taxAmount || 0).toLocaleString()}</td>
                                                <td className="p-3 font-semibold text-primary">NPR {s.totalAmount.toLocaleString()}</td>
                                                <td className="p-3 text-green-600">NPR {s.paidAmount.toLocaleString()}</td>
                                                <td className="p-3"><Badge variant={s.status === "PAID" ? "default" : "secondary"}>{s.status}</Badge></td>
                                                <td className="p-3 text-xs">{s.billingAccount?.name || "N/A"}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(s.saleDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContainer>
                    </TabsContent>

                    {/* PURCHASES TAB */}
                    <TabsContent value="purchases" className="space-y-4">
                        <CardContainer className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Vendor Purchases</h3>
                                <Button size="sm" onClick={() => setIsPurchaseModalOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add Purchase</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground bg-muted/30">
                                            <th className="p-3">Vendor</th>
                                            <th className="p-3">Total Amount</th>
                                            <th className="p-3">Paid Amount</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Account</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchases.map((p) => (
                                            <tr key={p.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-medium">{p.vendorName}</td>
                                                <td className="p-3 font-semibold">NPR {p.totalAmount.toLocaleString()}</td>
                                                <td className="p-3">NPR {p.paidAmount.toLocaleString()}</td>
                                                <td className="p-3"><Badge variant="outline">{p.status}</Badge></td>
                                                <td className="p-3 text-xs">{p.billingAccount?.name || "N/A"}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContainer>
                    </TabsContent>

                    {/* EXPENSES TAB */}
                    <TabsContent value="expenses" className="space-y-4">
                        <CardContainer className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Expense Records</h3>
                                <Button size="sm" onClick={() => setIsExpenseModalOpen(true)}><Plus className="mr-1 h-4 w-4" /> Record Expense</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground bg-muted/30">
                                            <th className="p-3">Description</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Billing Account</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map((e) => (
                                            <tr key={e.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-medium">{e.description}</td>
                                                <td className="p-3"><Badge variant="outline">{e.category?.name || "General"}</Badge></td>
                                                <td className="p-3 font-semibold text-red-600">NPR {e.totalAmount.toLocaleString()}</td>
                                                <td className="p-3 text-xs">{e.billingAccount?.name || "N/A"}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(e.expenseDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContainer>
                    </TabsContent>

                    {/* TRANSFERS TAB */}
                    <TabsContent value="transfers" className="space-y-4">
                        <CardContainer className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Account-to-Account Transfers</h3>
                                <Button size="sm" onClick={() => setIsTransferModalOpen(true)}><ArrowRightLeft className="mr-1 h-4 w-4" /> New Transfer</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground bg-muted/30">
                                            <th className="p-3">From Account</th>
                                            <th className="p-3">To Account</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transfers.map((t) => (
                                            <tr key={t.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3 font-medium">{t.fromAccount?.name}</td>
                                                <td className="p-3 font-medium">{t.toAccount?.name}</td>
                                                <td className="p-3 font-semibold text-blue-600">NPR {t.amount.toLocaleString()}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{t.description}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(t.transferDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContainer>
                    </TabsContent>

                    {/* BILLING ACCOUNTS TAB */}
                    <TabsContent value="accounts" className="space-y-4">
                        <CardContainer className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Billing Accounts</h3>
                                <Button size="sm" onClick={() => setIsAccountModalOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add Account</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {billingAccounts.map((acc) => (
                                    <div key={acc.id} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Badge>{acc.type}</Badge>
                                            <span className="text-xs text-muted-foreground">{acc.accountNo || "No acc #"}</span>
                                        </div>
                                        <h4 className="font-bold text-lg">{acc.name}</h4>
                                        <p className="text-2xl font-bold text-primary">NPR {acc.balance.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContainer>
                    </TabsContent>
                </Tabs>

                {/* ADVANCED SALE MODAL WITH MULTI-ITEMS, CATALOG CHOICE, INLINE CREATION, DISCOUNT & TAX */}
                <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-primary" /> Create Sale & Generate Invoice
                            </DialogTitle>
                            <DialogDescription>
                                Add customer, select/create line items, apply discounts, taxes, and record payments
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2 text-sm">
                            {/* Customer Selection & Expired Notice */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Customer (Optional)</Label>
                                    <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                                        <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Walk-in / Direct Sale --</SelectItem>
                                            {customers.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.lead?.name || `Customer #${c.id}`} ({c.customerUniqueId || c.panNo || "Cust"})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Customer / Bill-to Name</Label>
                                    <Input
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Walk-in Customer Name"
                                    />
                                </div>
                            </div>

                            {subscriptionNotice && (
                                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-lg p-3 text-xs flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>{subscriptionNotice}</span>
                                </div>
                            )}

                            {/* Category & Billing Account */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Sales Category</Label>
                                    <Select value={saleCategoryId} onValueChange={setSaleCategoryId}>
                                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Received In Billing Account</Label>
                                    <Select value={saleBillingAccountId} onValueChange={setSaleBillingAccountId}>
                                        <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                        <SelectContent>
                                            {billingAccounts.map((a) => (
                                                <SelectItem key={a.id} value={String(a.id)}>
                                                    {a.name} ({a.type} - NPR {a.balance})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-bold">Sale Line Items</Label>
                                    <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                                        <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                                    </Button>
                                </div>

                                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                                    {saleLineItems.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                                            {/* Catalog Item Select / Name */}
                                            <div className="col-span-4 space-y-1">
                                                <Select
                                                    value={item.itemId || "custom"}
                                                    onValueChange={(val) => updateLineItem(idx, "itemId", val === "custom" ? undefined : val)}
                                                >
                                                    <SelectTrigger className="h-8"><SelectValue placeholder="Select Catalog Item" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="custom">✍️ Custom / New Inline Item</SelectItem>
                                                        {items.map((cat) => (
                                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                                {cat.name} (NPR {cat.unitPrice})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    className="h-8 text-xs font-medium"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                                                    placeholder="Item name / description"
                                                />
                                            </div>

                                            {/* Qty */}
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Qty</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                                                />
                                            </div>

                                            {/* Price */}
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Price</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateLineItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>

                                            {/* Discount */}
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Disc (NPR)</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-xs"
                                                    value={item.discount}
                                                    onChange={(e) => updateLineItem(idx, "discount", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>

                                            {/* Delete */}
                                            <div className="col-span-2 flex items-center justify-end gap-1 pt-4">
                                                <span className="font-mono font-bold text-xs">NPR {item.total}</span>
                                                {saleLineItems.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => removeLineItem(idx)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Calculation Box */}
                            <div className="bg-muted/40 p-3 rounded-lg space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono font-medium">NPR {subtotal.toLocaleString()}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <Label className="text-[10px]">Extra Overall Discount (NPR)</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={overallDiscount}
                                            onChange={(e) => setOverallDiscount(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px]">Extra Overall Tax / VAT (NPR)</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={overallTax}
                                            onChange={(e) => setOverallTax(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between pt-2 border-t font-bold text-sm">
                                    <span>Grand Total</span>
                                    <span className="text-primary font-mono">NPR {grandTotal.toLocaleString()}</span>
                                </div>

                                <div className="pt-2">
                                    <Label className="text-[10px]">Amount Received / Paid (NPR)</Label>
                                    <Input
                                        type="number"
                                        className="h-8 text-xs font-bold"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder={`Default: NPR ${grandTotal}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateSale} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Create Invoice"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* SIMPLE MODALS */}

                {/* Record Expense Modal */}
                <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-2 text-sm">
                            <div><Label>Expense Description *</Label><Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Office rent, tea, fuel..." /></div>
                            <div><Label>Expense Amount (NPR) *</Label><Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>
                            <div>
                                <Label>Paid From Billing Account</Label>
                                <Select value={expenseForm.billingAccountId} onValueChange={(v) => setExpenseForm({ ...expenseForm, billingAccountId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                    <SelectContent>{billingAccounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name} (Bal: NPR {a.balance})</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreateExpense} disabled={isSubmitting}>Save Expense</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Record Purchase Modal */}
                <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Record Vendor Purchase</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-2 text-sm">
                            <div><Label>Vendor Name *</Label><Input value={purchaseForm.vendorName} onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorName: e.target.value })} placeholder="Vendor / Supplier Name" /></div>
                            <div><Label>Description</Label><Input value={purchaseForm.description} onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })} placeholder="Fiber cable, ONU devices..." /></div>
                            <div><Label>Purchase Amount (NPR) *</Label><Input type="number" value={purchaseForm.amount} onChange={(e) => setPurchaseForm({ ...purchaseForm, amount: e.target.value })} /></div>
                            <div>
                                <Label>Paid From Billing Account</Label>
                                <Select value={purchaseForm.billingAccountId} onValueChange={(v) => setPurchaseForm({ ...purchaseForm, billingAccountId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                    <SelectContent>{billingAccounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name} (Bal: NPR {a.balance})</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleCreatePurchase} disabled={isSubmitting}>Save Purchase</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Transfer Modal */}
                <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Account-to-Account Transfer</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-2 text-sm">
                            <div>
                                <Label>From Account (Source)</Label>
                                <Select value={transferForm.fromAccountId} onValueChange={(v) => setTransferForm({ ...transferForm, fromAccountId: v })}>
                                    <SelectTrigger><SelectValue placeholder="From Account" /></SelectTrigger>
                                    <SelectContent>{billingAccounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name} (NPR {a.balance})</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>To Account (Destination)</Label>
                                <Select value={transferForm.toAccountId} onValueChange={(v) => setTransferForm({ ...transferForm, toAccountId: v })}>
                                    <SelectTrigger><SelectValue placeholder="To Account" /></SelectTrigger>
                                    <SelectContent>{billingAccounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name} (NPR {a.balance})</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div><Label>Amount (NPR) *</Label><Input type="number" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} /></div>
                            <div><Label>Note / Ref</Label><Input value={transferForm.description} onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })} placeholder="Transfer reason..." /></div>
                        </div>
                        <DialogFooter><Button onClick={handleCreateTransfer} disabled={isSubmitting}>Transfer Funds</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* New Billing Account Modal */}
                <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Billing Account</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-2 text-sm">
                            <div><Label>Account Name *</Label><Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="Cash Counter, NIC Asia Bank, eSewa Merchant..." /></div>
                            <div>
                                <Label>Account Type</Label>
                                <Select value={accountForm.type} onValueChange={(v) => setAccountForm({ ...accountForm, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="BANK">Bank Account</SelectItem>
                                        <SelectItem value="DIGITAL_WALLET">Digital Wallet (eSewa/Khalti)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div><Label>Account Number / Ref</Label><Input value={accountForm.accountNo} onChange={(e) => setAccountForm({ ...accountForm, accountNo: e.target.value })} placeholder="Account # or mobile number" /></div>
                            <div><Label>Initial Balance (NPR)</Label><Input type="number" value={accountForm.initialBalance} onChange={(e) => setAccountForm({ ...accountForm, initialBalance: e.target.value })} /></div>
                        </div>
                        <DialogFooter><Button onClick={handleCreateAccount} disabled={isSubmitting}>Create Account</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
