"use client"

import { useEffect, useState, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { StatusBadge } from "@/components/ui/status-badge"
import { MoreHorizontal, FileText, Loader2, Printer, Search, Trash, Plus, ExternalLink } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

const numberToWords = (amount: number) => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const toWords = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim()
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${toWords(n % 100)}`.trim()
    if (n < 100000) return `${toWords(Math.floor(n / 1000))} Thousand ${toWords(n % 1000)}`.trim()
    if (n < 10000000) return `${toWords(Math.floor(n / 100000))} Lakh ${toWords(n % 100000)}`.trim()
    return `${toWords(Math.floor(n / 10000000))} Crore ${toWords(n % 10000000)}`.trim()
  }
  return `${toWords(Math.round(amount)) || "Zero"} Only`
}

const getDisplayPaymentMethod = (pm: string) => {
  if (!pm) return "Payment"
  const cleaned = String(pm).toUpperCase()
  if (cleaned.includes("STRIPE") || cleaned.includes("CARD")) return "Card Payment (Stripe)"
  if (cleaned.includes("PAYPAL")) return "PayPal Global"
  if (cleaned.includes("RAZORPAY")) return "Razorpay"
  if (cleaned.includes("INSTAPAY")) return "InstaPay"
  if (cleaned.includes("ESEWA")) return "eSewa"
  if (cleaned.includes("KHALTI")) return "Khalti"
  if (cleaned.includes("EPAY")) return "ePay"
  return String(pm).replaceAll("_", " ")
}

function PrintableInvoice({
  invoice,
  isp,
  addonCharges = [],
  tscPercentage = 10
}: {
  invoice: any
  isp: any
  addonCharges?: any[]
  tscPercentage?: number
}) {
  const tscPct = Number(tscPercentage || 10)
  const hasConfiguredPackageItems = Array.isArray(invoice?.packageItems) && invoice.packageItems.length > 0
  const configuredByReference = new Map((invoice?.packageItems || []).filter((item: any) => item.referenceId).map((item: any) => [item.referenceId, item]))
  const hasActualOrderItems = Array.isArray(invoice?.items) && invoice.items.length > 0
  const items = invoice?.isTrialInvoice
    ? [{ itemName: invoice?.packageName || "Trial Package", description: "Trial subscription", referenceId: null, itemPrice: 0, isTaxable: false, isTscApplicable: false }]
    : hasConfiguredPackageItems
    ? invoice.packageItems.map((item: any) => ({
        id: `package-${item.id}`,
        itemName: item.name || "Package item",
        description: item.description || item.name || "Package item",
        referenceId: item.referenceId,
        itemPrice: Number(item.amount || 0),
        isTaxable: item.isTaxable !== false,
        isTscApplicable: item.isTscApplicable === true,
      }))
    : hasActualOrderItems
    ? invoice.items.map((item: any) => {
        const configured: any = item.referenceId ? configuredByReference.get(item.referenceId) : null
        return {
          ...item,
          isTaxable: configured ? (configured.isTaxable !== false && configured.IsTaxable !== false) : (item.isTaxable !== false),
          isTscApplicable: configured ? (configured.isTscApplicable === true || configured.IsExcisable === true) : (item.isTscApplicable === true),
        }
      })
    : [{ itemName: invoice?.packageName || "Internet Package", referenceId: null, itemPrice: Number(invoice?.amount || 0), isTaxable: true, isTscApplicable: invoice?.isTscApplicable || false }]
  
  const itemsSum = items.reduce((sum: number, item: any) => sum + Number(item.itemPrice || 0), 0)
  const invoiceTotalAmount = Number(invoice?.amount || 0)
 
  let subtotal = 0
  let totalTsc = 0
  let taxableAmount = 0
  let vat = 0
  let total = 0
  let displayItems: any[] = []
 
  const findAddonConfig = (refId: string) => {
    if (!refId) return null
    const cleanRefId = String(refId).toUpperCase().trim()
    let found = addonCharges.find(a => String(a.referenceId || a.ReferenceId || '').toUpperCase().trim() === cleanRefId)
    if (found) return found
    const cleanCode = cleanRefId.startsWith('INT-') ? cleanRefId.substring(4) : cleanRefId
    found = addonCharges.find(a => {
      const isForPkg = a.forPackageCreation === true || a.ForPackageCreation === true
      const aCode = String(a.code || a.Code || '').toUpperCase().trim()
      return isForPkg && cleanCode.startsWith(aCode)
    })
    return found || null
  }

  const isLegacy = !invoice?.isTrialInvoice && !hasConfiguredPackageItems && Math.abs(itemsSum - invoiceTotalAmount) < 1

  if (isLegacy) {
    total = invoiceTotalAmount
    const tscFactor = invoice?.isTscApplicable ? (tscPct / 100) : 0
    const baseAmount = total / ((1 + tscFactor) * 1.13)
    totalTsc = Math.round(baseAmount * tscFactor * 100) / 100
    taxableAmount = Math.round(baseAmount * (1 + tscFactor) * 100) / 100
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    subtotal = Math.round((total - totalTsc - vat) * 100) / 100

    displayItems = items.map((item: any) => {
      const itemPrice = Number(item.itemPrice || 0)
      const addon = item.referenceId ? findAddonConfig(item.referenceId) : null
      const itemIsTsc = addon
        ? (addon.isTscApplicable === true || addon.IsExcisable === true)
        : (invoice?.isTscApplicable || false)
      const itemTscFactor = itemIsTsc ? (tscPct / 100) : 0
      const itemPreTax = itemPrice / ((1 + itemTscFactor) * 1.13)
      return {
        ...item,
        preTaxPrice: itemPreTax
      }
    })
  } else {
    displayItems = items.map((item: any) => {
      const price = Number(item.itemPrice || 0)
      let isTaxable = true
      let isTscApplicable = false

      if (hasActualOrderItems || hasConfiguredPackageItems) {
        isTaxable = item.isTaxable !== false
        isTscApplicable = item.isTscApplicable === true
      } else if (item.referenceId) {
        const addon = findAddonConfig(item.referenceId)
        if (addon) {
          isTaxable = addon.isTaxable !== false && addon.IsTaxable !== false
          isTscApplicable = addon.isTscApplicable === true || addon.IsExcisable === true
        } else {
          isTaxable = true
          isTscApplicable = invoice?.isTscApplicable || false
        }
      } else {
        isTaxable = true
        isTscApplicable = false
      }



      const itemTsc = isTscApplicable ? (price * tscPct) / 100 : 0

      return {
        ...item,
        preTaxPrice: price,
        isTaxable,
        isTscApplicable,
        itemTsc
      }
    })

    subtotal = displayItems.reduce((sum: number, item: any) => sum + item.preTaxPrice, 0)
    totalTsc = displayItems.reduce((sum: number, item: any) => sum + item.itemTsc, 0)
    taxableAmount = displayItems.reduce((sum: number, item: any) => {
      if (item.isTaxable) {
        return sum + item.preTaxPrice + item.itemTsc
      }
      return sum
    }, 0)
    vat = Math.round(taxableAmount * 0.13 * 100) / 100
    total = Math.round((subtotal + totalTsc + vat) * 100) / 100
  }

  const printedAt = new Date()

  return (
    <div id="printable-invoice" className="printable-invoice relative mx-auto bg-white p-5 text-black">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="-rotate-45 text-6xl font-bold tracking-widest text-slate-300/50">COPY OF ORIGINAL</div>
      </div>
      <div className="relative border-2 border-black p-3">
        <div className="grid grid-cols-[1fr_auto] gap-4">
          <div className="text-center">
            <div className="text-xl font-bold">{isp?.companyName || isp?.name || "ISP"}</div>
            <div className="text-sm font-semibold">{isp?.address || "Address"}</div>
            <div className="text-sm font-semibold">
              Tel: {isp?.phoneNumber || "-"} {isp?.masterEmail ? ` Email: ${isp.masterEmail}` : ""}
            </div>
          </div>
          <div className="text-right text-sm">
            <div>Transaction Date:</div>
            <div>{new Date(invoice?.date || Date.now()).toLocaleString()}</div>
            <div className="mt-4">Copy of Original 1</div>
            <div className="mt-4">Reprint Date:</div>
            <div>{printedAt.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 items-start">
          <div>
            <div className="font-bold">TPIN</div>
            <div className="mt-1 inline-flex border border-black font-mono text-sm">
              {String(isp?.panNo || "000000000").split("").map((digit: string, index: number) => (
                <span key={index} className="border-r border-black px-1 last:border-r-0">{digit}</span>
              ))}
            </div>
          </div>
          <div className="text-center text-3xl font-bold">INVOICE</div>
          <div className="text-right text-xl">Invoice No.: <span className="text-2xl font-semibold">{invoice?.invoiceId}</span></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div className="grid grid-cols-[110px_1fr] gap-y-2">
            <div className="font-bold">Username:</div><div>{invoice?.customerId || "-"}</div>
            <div className="font-bold">Address:</div><div>{invoice?.customerAddress || "-"}</div>
            <div className="font-bold">TPIN</div><div>{invoice?.customerPan || "-"}</div>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-y-2">
            <div className="font-bold">Subscriber&apos;s Name:</div><div>{invoice?.customer || "-"}</div>
            <div className="font-bold">Tel:</div><div>{invoice?.customerPhone || "-"}</div>
          </div>
        </div>

        {invoice?.packageStart && invoice?.packageEnd && (
          <div className="mt-4 text-sm font-semibold">
            Effective from {invoice.packageStart} to {invoice.packageEnd} - {invoice.planName || invoice.packageName || "Internet"}
          </div>
        )}

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr>
              {["S.N", "HS Code", "Particulars", "Description", "Qty", "Rate", "Amount (Rs.)"].map((head) => (
                <th key={head} className="border border-black p-1 text-left">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item: any, index: number) => {
              const price = item.preTaxPrice
              const isInternet = !item.referenceId || item.itemName?.toUpperCase().includes('INTERNET');
              const itemDesc = isInternet && invoice?.packageStart && invoice?.packageEnd
                ? `INTERNET CHARGE FOR ${invoice.planName || invoice.packageName || "Internet"} EFFECTIVE FROM ${invoice.packageStart} TO ${invoice.packageEnd}`
                : (item.description || item.itemName || "Internet service package");

              return (
                <tr key={item.id || index}>
                  <td className="border-x border-black p-1 align-top">{index + 1}</td>
                  <td className="border-x border-black p-1 align-top"></td>
                  <td className="border-x border-black p-1 align-top">{item.itemName || invoice?.packageName || "Internet"}</td>
                  <td className="border-x border-black p-1 align-top">{itemDesc}</td>
                  <td className="border-x border-black p-1 align-top">1</td>
                  <td className="border-x border-black p-1 text-right align-top">{price.toFixed(2)}</td>
                  <td className="border-x border-black p-1 text-right align-top">{price.toFixed(2)}</td>
                </tr>
              )
            })}
            <tr><td colSpan={7} className="h-10 border-x border-b border-black"></td></tr>
          </tbody>
        </table>

        <div className="grid grid-cols-[1fr_1.6fr]">
          <div className="border-x border-b border-black p-5">
            <div className="font-bold underline">Payment Mode#</div>
            <div className="mt-3 font-semibold text-xs">
              <div>{invoice?.status === "paid" ? getDisplayPaymentMethod(invoice?.paymentMethod) : "Unpaid"}</div>
              {invoice?.status === "paid" && invoice?.paymentTransactionCode && (
                <div className="mt-1 font-mono text-[10px] text-slate-700 font-normal">
                  Txn ID: {invoice.paymentTransactionCode}
                </div>
              )}
            </div>
          </div>
          <table className="border-collapse text-sm">
            <tbody>
              {[
                ["Total", subtotal],
                ["Discount", 0],
                ["TSC", totalTsc],
                ["Taxable Amount", taxableAmount],
                ["Vat 13 %", vat],
                ["Total Amount", total],
              ].map(([label, value]) => (
                <tr key={String(label)}>
                  <td className="border-b border-r border-black p-1 text-right">{label}</td>
                  <td className="w-36 border-b border-r border-black p-1 text-right">{Number(value).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-end justify-between text-sm">
          <div>In Words : {numberToWords(total)}</div>
          <div className="w-72 text-center">
            <div className="border-b border-slate-400 pb-1">{invoice?.paymentMethod ? getDisplayPaymentMethod(invoice.paymentMethod) : "Payment"}</div>
            <div className="mt-1">For {isp?.companyName || isp?.name || "ISP"}</div>
          </div>
        </div>
        <div className="mt-8 text-sm">Note: This is a pdf copy of computer generated invoice.</div>
      </div>
    </div>
  )
}

function PrintableReceipt({
  invoice,
  isp
}: {
  invoice: any
  isp: any
  addonCharges?: any[]
  tscPercentage?: number
}) {
  const amount = Number(invoice?.amount || 0)
  const paymentMethod = invoice?.paymentMethod ? getDisplayPaymentMethod(invoice.paymentMethod) : "Cash"
  const receiptNumber = `REC-${invoice?.invoiceId || invoice?.id || ""}`

  return (
    <div id="printable-receipt" className="printable-receipt relative mx-auto bg-white p-5 text-black">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="-rotate-45 text-5xl font-bold tracking-widest text-slate-300/30">CASH RECEIPT</div>
      </div>
      <div className="receipt-shell relative mx-auto max-h-[400px] max-w-3xl overflow-hidden border-2 border-black p-4">
        <div className="receipt-header text-center border-b border-black pb-3">
          <div className="text-xl font-bold">{isp?.companyName || isp?.name || "Kisan Net Pvt Ltd"}</div>
          <div className="text-xs font-semibold">{isp?.address || "Address"}</div>
          <div className="text-xs font-semibold">
            Tel: {isp?.phoneNumber || "-"} | Email: {isp?.masterEmail || "-"}
          </div>
          <div className="text-xs font-bold mt-1">TPIN/PAN: {isp?.panNo || "000000000"}</div>
          <div className="text-lg font-bold mt-2 uppercase tracking-wide">Cash Receipt</div>
        </div>

        <div className="receipt-meta mt-2 flex justify-between border-b border-black pb-2 text-xs">
          <div><span className="font-bold">Receipt No.:</span> {receiptNumber}</div>
          <div><span className="font-bold">Date:</span> {new Date(invoice?.date || Date.now()).toLocaleDateString()}</div>
        </div>

        <div className="receipt-body space-y-2 py-3 text-sm leading-6">
          <p>
            Received with thanks from <span className="receipt-line inline-block min-w-64 border-b border-black px-2 font-semibold">{invoice?.customer || ""}</span>
            <span className="ml-2 text-sm">(Subscriber ID: {invoice?.customerId || "____________"})</span>
          </p>
          <p>
            the sum of <span className="receipt-line receipt-line-wide inline-block min-w-96 border-b border-black px-2 font-semibold">{numberToWords(amount)}</span>
          </p>
          <p>
            as <span className="receipt-line receipt-line-short inline-block min-w-32 border-b border-black px-2">&nbsp;</span> part / full payment against order / bill / subscription for
            <span className="receipt-line ml-2 inline-block min-w-56 border-b border-black px-2 font-semibold">{invoice?.packageName || ""}</span>.
          </p>
          <p>
            Paid in cash / by cheque no. <span className="receipt-line inline-block min-w-48 border-b border-black px-2 font-semibold">{paymentMethod}</span>
            <span className="ml-2">against</span> <span className="receipt-line inline-block min-w-48 border-b border-black px-2 font-semibold">subscription charge</span>.
          </p>

          <div className="flex items-center gap-3 pt-1 text-base font-bold">
            <span>Amount:</span>
            <span className="receipt-amount inline-block min-w-64 border-2 border-black px-3 py-1">NPR {amount.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="receipt-footer mt-4 flex items-end justify-between text-xs">
          <div>
            <div>
              <span className="font-semibold">Payment mode:</span> {paymentMethod}
              {invoice?.paymentTransactionCode && (
                <div className="mt-1 font-mono text-[10px] text-slate-700">Txn ID: {invoice.paymentTransactionCode}</div>
              )}
            </div>
            <div className="mt-4">Remarks: <span className="receipt-line receipt-line-wide inline-block min-w-72 border-b border-black">&nbsp;</span></div>
          </div>
          <div className="w-48 border-t border-black pt-2 text-center">
            Received by
          </div>
        </div>
      </div>
    </div>
  )
}

export function InvoicesList() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)
  const [paymentInvoiceNumber, setPaymentInvoiceNumber] = useState("")
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [isp, setIsp] = useState<any>(null)
  const [adjustingInvoice, setAdjustingInvoice] = useState<any>(null)
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [adjustmentSubmitting, setAdjustmentSubmitting] = useState(false)
  const [addonCharges, setAddonCharges] = useState<any[]>([])
  const [tscPercentage, setTscPercentage] = useState(10)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [newPaymentMethodId, setNewPaymentMethodId] = useState("")
  const [dialogView, setDialogView] = useState<"invoice" | "receipt">("invoice")
  const [accountingSyncingId, setAccountingSyncingId] = useState<number | null>(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/billing/invoices?page=${page}&limit=10`
      if (debouncedSearch.trim()) url += `&search=${encodeURIComponent(debouncedSearch.trim())}`
      if (status !== "all") url += `&status=${status}`
      
      const res = await apiRequest(url)
      if (res.success) {
        setInvoices(res.invoices)
        setTotalPages(res.pagination.totalPages || 1)
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    apiRequest<any>("/isp/active")
      .then((response) => setIsp(response?.data || response?.isp || response))
      .catch(() => setIsp(null))

    apiRequest<any[]>("/extra-charges")
      .then((data) => setAddonCharges(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load extra charges:", err))

    apiRequest<Record<string, string>>("/settings")
      .then((data) => {
        if (data && data.tscPercentage) {
          setTscPercentage(Number(data.tscPercentage))
        }
      })
      .catch((err) => console.error("Failed to load settings:", err))

    apiRequest<any[]>("/billing/payment-methods?enabled=true")
      .then((data) => setPaymentMethods(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load payment methods:", err))
  }, [])

  const openMarkPaid = (invoice: any) => {
    setPaymentInvoice(invoice)
    setPaymentInvoiceNumber(invoice.invoiceId?.startsWith("INV-") ? "" : invoice.invoiceId || "")
    const defaultPm = paymentMethods.find(p => p.isDefault)
    setNewPaymentMethodId(defaultPm ? String(defaultPm.id) : (paymentMethods[0] ? String(paymentMethods[0].id) : "CASH"))
  }

  const openInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice)
    setDialogView("invoice")
  }

  const handleMarkPaid = async () => {
    if (!paymentInvoice || !paymentInvoiceNumber.trim()) {
      toast.error("Invoice number is required")
      return
    }
    try {
      setPaymentSubmitting(true)
      toast.loading("Processing payment...", { id: "payment" })
      
      const body: any = {
        orderId: paymentInvoice.id,
        invoiceId: paymentInvoiceNumber.trim(),
        amount: paymentInvoice.amount
      }
      const numericId = Number(newPaymentMethodId)
      if (!isNaN(numericId)) {
        body.paymentMethodId = numericId
        const pm = paymentMethods.find(p => p.id === numericId)
        body.paymentMethod = pm ? pm.code : "CASH"
      } else {
        body.paymentMethod = newPaymentMethodId || "CASH"
      }

      await apiRequest("/billing/pay", {
        method: "POST",
        body: JSON.stringify(body)
      })
      toast.success("Payment recorded successfully", { id: "payment" })
      setPaymentInvoice(null)
      setPaymentInvoiceNumber("")
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment", { id: "payment" })
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const handleSendToAccounting = async (invoice: any) => {
    try {
      setAccountingSyncingId(invoice.id)
      toast.loading("Sending sales invoice to accounting...", { id: "accounting-sync" })
      await apiRequest(`/billing/invoices/${invoice.id}/sync-accounting`, { method: "POST" })
      toast.success("Sales invoice created in accounting", { id: "accounting-sync" })
      await fetchInvoices()
    } catch (error: any) {
      toast.error(error.message || "Failed to send invoice to accounting", { id: "accounting-sync" })
    } finally {
      setAccountingSyncingId(null)
    }
  }

  const formatNpr = (val: number) => {
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(val)
  }

  const printInvoice = () => {
    const printTarget = dialogView === "invoice" ? "printable-invoice" : "printable-receipt"
    const el = document.getElementById(printTarget)
    if (!el) return
    const printWindow = window.open("", "_blank", "width=1100,height=800")
    if (!printWindow) return
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${dialogView === "invoice" ? "Invoice" : "Receipt"} - ${selectedInvoice?.invoiceId || ""}</title><style>
      @page { size: A4 portrait; margin: ${dialogView === "invoice" ? "6mm" : "5mm"}; }
      * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { font-family: system-ui, -apple-system, sans-serif; background: white; color: black; }
      .printable-invoice, .printable-receipt { position: relative; width: 100%; max-width: 100%; background: white; padding: 20px; color: black; }
      .printable-receipt { width: 100%; padding: 0; break-inside: avoid; page-break-inside: avoid; }
      .receipt-shell { position: relative; width: 100%; max-width: 190mm; height: 88mm !important; max-height: 88mm !important; margin: 0 auto; overflow: hidden; break-inside: avoid; page-break-inside: avoid; border: 1.5px solid #000; padding: 4mm 5mm !important; }
      .receipt-header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 2mm; line-height: 1.15; }
      .receipt-header .text-xl { font-size: 16px; }
      .receipt-header .text-lg { font-size: 14px; margin-top: 2px; }
      .receipt-header .text-xs { font-size: 9px; }
      .receipt-meta { display: flex; justify-content: space-between; margin-top: 2mm !important; padding-bottom: 2mm !important; border-bottom: 1px solid #000; font-size: 10px; }
      .receipt-body { padding: 2.5mm 0 1.5mm !important; font-size: 10px; line-height: 1.75; }
      .receipt-body p { margin: 0; }
      .receipt-line { display: inline-block; min-width: 42mm; padding: 0 1.5mm 1px; border: 0 !important; border-bottom: 1px solid #000 !important; vertical-align: baseline; }
      .receipt-line-short { min-width: 18mm; }
      .receipt-line-wide { min-width: 70mm; }
      .receipt-amount { display: inline-block; min-width: 48mm; padding: 1.5mm 3mm; border: 1.5px solid #000 !important; }
      .receipt-body .text-lg { font-size: 12px; }
      .receipt-footer { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 1.5mm !important; font-size: 10px; }
      .receipt-footer .mt-4 { margin-top: 2mm; }
      .receipt-footer .w-48 { width: 38mm; }
      .pointer-events-none { pointer-events: none; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .pointer-events-none > div { transform: rotate(-45deg); font-size: 3.75rem; font-weight: bold; letter-spacing: 0.1em; color: rgba(148,163,184,0.5); }
      .relative { position: relative; }
      .border-2 { border: 2px solid black; }
      .border { border: 1px solid black; }
      .border-black { border-color: black; }
      .border-b { border-bottom: 1px solid black; }
      .border-r { border-right: 1px solid black; }
      .border-x { border-left: 1px solid black; border-right: 1px solid black; }
      .border-dotted { border-style: dotted; }
      .border-slate-300 { border-color: #cbd5e1; }
      .border-slate-400 { border-color: #94a3b8; }
      .p-1 { padding: 4px; } .p-3 { padding: 12px; } .p-4 { padding: 16px; } .p-5 { padding: 20px; }
      .px-1 { padding-left: 4px; padding-right: 4px; }
      .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
      .pb-1 { padding-bottom: 4px; } .pb-3 { padding-bottom: 12px; }
      .pt-1 { padding-top: 4px; }
      .mt-1 { margin-top: 4px; } .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; } .mt-5 { margin-top: 20px; } .mt-8 { margin-top: 32px; }
      .mr-6 { margin-right: 24px; }
      .mb-1 { margin-bottom: 4px; }
      .gap-2 { gap: 8px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }
      .gap-y-2 { row-gap: 8px; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .text-xs { font-size: 0.75rem; } .text-sm { font-size: 0.875rem; } .text-lg { font-size: 1.125rem; } .text-xl { font-size: 1.25rem; } .text-2xl { font-size: 1.5rem; } .text-3xl { font-size: 1.875rem; }
      .text-6xl { font-size: 3.75rem; }
      .text-5xl { font-size: 3rem; }
      .font-bold { font-weight: 700; } .font-semibold { font-weight: 600; } .font-mono { font-family: monospace; }
      .uppercase { text-transform: uppercase; } .underline { text-decoration: underline; } .italic { font-style: italic; }
      .tracking-wide { letter-spacing: 0.025em; } .tracking-widest { letter-spacing: 0.1em; }
      .leading-none { line-height: 1; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .grid-cols-\\[1fr_auto\\] { grid-template-columns: 1fr auto; }
      .grid-cols-\\[1fr_1\\.6fr\\] { grid-template-columns: 1fr 1.6fr; }
      .grid-cols-\\[110px_1fr\\] { grid-template-columns: 110px 1fr; }
      .grid-cols-\\[160px_1fr\\] { grid-template-columns: 160px 1fr; }
      .items-start { align-items: flex-start; } .items-end { align-items: flex-end; } .items-center { align-items: center; }
      .flex { display: flex; } .inline-flex { display: inline-flex; }
      .justify-between { justify-content: space-between; } .justify-center { justify-content: center; }
      .overflow-hidden { overflow: hidden; }
      .w-full { width: 100%; } .w-36 { width: 9rem; } .w-48 { width: 12rem; } .w-72 { width: 18rem; }
      .h-10 { height: 2.5rem; }
      .align-top { vertical-align: top; }
      table { width: 100%; border-collapse: collapse; }
      .last\\:border-r-0:last-child { border-right: 0; }
      .-rotate-45 { transform: rotate(-45deg); }
      .inset-0 { inset: 0; } .absolute { position: absolute; }
      .text-slate-300\\/50 { color: rgba(203,213,225,0.5); }
      .text-slate-300\\/30 { color: rgba(203,213,225,0.3); }
    </style></head><body>${el.outerHTML}</body></html>`)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      printWindow.onafterprint = () => printWindow.close()
    }
  }

  const handleAddAdjustment = async () => {
    if (!adjustingInvoice || !newItemName.trim() || !newItemPrice.trim()) {
      toast.error("Item name and price are required")
      return
    }
    const priceNum = parseFloat(newItemPrice)
    if (isNaN(priceNum)) {
      toast.error("Price must be a number")
      return
    }
    try {
      setAdjustmentSubmitting(true)
      const res = await apiRequest("/billing/adjustments/add", {
        method: "POST",
        body: JSON.stringify({
          orderId: adjustingInvoice.id,
          itemName: newItemName.trim(),
          itemPrice: priceNum
        })
      })
      toast.success("Adjustment added successfully")
      
      // Update adjustingInvoice details
      setAdjustingInvoice((prev: any) => ({
        ...prev,
        amount: res.totalAmount,
        items: res.items
      }))
      setNewItemName("")
      setNewItemPrice("")
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to add adjustment")
    } finally {
      setAdjustmentSubmitting(false)
    }
  }

  const handleRemoveAdjustment = async (detailId: number) => {
    try {
      setAdjustmentSubmitting(true)
      const res = await apiRequest("/billing/adjustments/remove", {
        method: "POST",
        body: JSON.stringify({
          detailId
        })
      })
      toast.success("Adjustment removed successfully")
      
      // Update adjustingInvoice details
      setAdjustingInvoice((prev: any) => ({
        ...prev,
        amount: res.totalAmount,
        items: res.items
      }))
      fetchInvoices()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove adjustment")
    } finally {
      setAdjustmentSubmitting(false)
    }
  }

  return (
    <CardContainer title="Recent Invoices" description="Latest customer invoices and payments">
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Input
            placeholder="Search by invoice number or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
            <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
            <FileText className="h-12 w-12 mb-3 text-muted-foreground/60 mx-auto" />
            <p>No invoices found matching criteria.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Invoice ID</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Package</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Payment Mode</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Accounting</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border/60 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-2 bg-blue-500/15">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{invoice.invoiceId}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-semibold text-foreground">{invoice.customer}</div>
                    <div className="text-xs text-muted-foreground">{invoice.customerId}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-foreground/80">{new Date(invoice.date).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 text-sm text-foreground/80">{invoice.packageName}</td>
                  <td className="p-4 text-sm font-semibold text-foreground">{formatNpr(invoice.amount)}</td>
                  <td className="p-4">
                    <StatusBadge status={invoice.status as any} />
                  </td>
                  <td className="p-4 text-sm font-medium text-foreground">{invoice.paymentMethod ? getDisplayPaymentMethod(invoice.paymentMethod) : "—"}</td>
                  <td className="p-4 text-sm">
                    {invoice.accountingInvoiceId ? (
                      <div className="space-y-1">
                        <div className="font-medium">{invoice.accountingProvider} #{invoice.accountingInvoiceId}</div>
                        {invoice.accountingInvoiceUrl && (
                          <a href={invoice.accountingInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                            {invoice.accountingProvider === "NEPURIX" ? "Print Nepurix Invoice" : "Open sales invoice"} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ) : invoice.accountingSyncError ? (
                      <span className="text-xs text-red-600" title={invoice.accountingSyncError}>Sync failed</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] bg-popover border-border text-popover-foreground">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openInvoiceDetails(invoice)}>
                          View details
                        </DropdownMenuItem>
                        {invoice.status === "paid" && (
                          <>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedInvoice(invoice); setDialogView("receipt"); }}>
                              Print Cash Receipt
                            </DropdownMenuItem>
                            {invoice.accountingInvoiceId && invoice.accountingProvider === "NEPURIX" && invoice.accountingInvoiceUrl && (
                              <DropdownMenuItem className="cursor-pointer text-purple-600 focus:text-purple-600" onClick={() => window.open(invoice.accountingInvoiceUrl, "_blank")}>
                                Print Nepurix Invoice
                              </DropdownMenuItem>
                            )}
                            {!invoice.accountingInvoiceId && !invoice.isTrialInvoice && Number(invoice.amount) > 0 && (
                              <DropdownMenuItem
                                className="cursor-pointer text-blue-600 focus:text-blue-600"
                                disabled={accountingSyncingId === invoice.id}
                                onClick={() => handleSendToAccounting(invoice)}
                              >
                                {accountingSyncingId === invoice.id ? "Sending to accounting..." : "Send to Accounting"}
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {invoice.status !== "paid" && (
                          <>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-blue-600 focus:text-blue-600 dark:focus:bg-blue-950 cursor-pointer" onClick={() => setAdjustingInvoice(invoice)}>
                              Adjust
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950 cursor-pointer" onClick={() => openMarkPaid(invoice)}>
                              Mark as paid
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 flex justify-between items-center border-t border-border mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="text-foreground"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="text-foreground"
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={!!paymentInvoice} onOpenChange={(open) => { if (!open) setPaymentInvoice(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="text-sm text-muted-foreground">
              Record payment for {paymentInvoice?.customer || "customer"} totaling {formatNpr(Number(paymentInvoice?.amount || 0))}.
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Invoice Number</label>
              <Input
                value={paymentInvoiceNumber}
                onChange={(event) => setPaymentInvoiceNumber(event.target.value)}
                placeholder="Enter invoice number"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
              <Select value={newPaymentMethodId} onValueChange={setNewPaymentMethodId}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={String(pm.id)}>
                      {pm.name}
                    </SelectItem>
                  ))}
                  {paymentMethods.length === 0 && (
                    <>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="ESEWA">eSewa</SelectItem>
                      <SelectItem value="KHALTI">Khalti</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPaymentInvoice(null)} disabled={paymentSubmitting}>Cancel</Button>
              <Button onClick={handleMarkPaid} disabled={paymentSubmitting || !paymentInvoiceNumber.trim()}>
                {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustingInvoice} onOpenChange={(open) => { if (!open) { setAdjustingInvoice(null); setNewItemName(""); setNewItemPrice(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust Invoice: {adjustingInvoice?.invoiceId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-foreground">Current Items</h4>
              {adjustingInvoice?.items && adjustingInvoice.items.length > 0 ? (
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-background max-h-48 overflow-y-auto">
                  {adjustingInvoice.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-medium text-foreground truncate">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">Price: {formatNpr(item.itemPrice)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={adjustmentSubmitting}
                        onClick={() => handleRemoveAdjustment(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic bg-muted/40 p-4 rounded-lg text-center">No items on this invoice.</p>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3 text-foreground">Add Custom Adjustment</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Item Name</label>
                  <Input
                    placeholder="e.g. Discount, Router Charge"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    disabled={adjustmentSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Amount (NPR)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 150 or -200"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    disabled={adjustmentSubmitting}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAdjustment}
                disabled={adjustmentSubmitting || !newItemName.trim() || !newItemPrice.trim()}
                className="w-full gap-2"
              >
                {adjustmentSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Item
              </Button>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center text-sm font-semibold">
              <span className="text-foreground">Updated Total (Excl. VAT):</span>
              <span className="text-primary text-base">
                {adjustingInvoice && formatNpr(Number(adjustingInvoice.amount))}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setAdjustingInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between gap-3 mr-6">
              <DialogTitle>
                {dialogView === "invoice" ? "Invoice" : "Cash Receipt"} - {selectedInvoice?.invoiceId}
              </DialogTitle>
              <div className="flex gap-2">
                <div className="flex border border-input rounded-md overflow-hidden mr-2">
                  <Button
                    variant={dialogView === "invoice" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none h-8"
                    onClick={() => setDialogView("invoice")}
                  >
                    Invoice
                  </Button>
                  {selectedInvoice?.status === "paid" && (
                    <Button
                      variant={dialogView === "receipt" ? "default" : "ghost"}
                      size="sm"
                      className="rounded-none h-8"
                      onClick={() => setDialogView("receipt")}
                    >
                      Cash Receipt
                    </Button>
                  )}
                </div>
                <Button onClick={printInvoice} className="gap-2 h-8">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>
          {selectedInvoice && dialogView === "invoice" && (
            <PrintableInvoice 
              invoice={selectedInvoice} 
              isp={isp} 
              addonCharges={addonCharges} 
              tscPercentage={tscPercentage} 
            />
          )}
          {selectedInvoice && dialogView === "receipt" && (
            <PrintableReceipt 
              invoice={selectedInvoice} 
              isp={isp} 
              addonCharges={addonCharges} 
              tscPercentage={tscPercentage} 
            />
          )}
        </DialogContent>
      </Dialog>
    </CardContainer>
  )
}
