"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    Building2,
    Package,
    FileSpreadsheet,
    FileCode,
    FileText,
    Download,
    Loader2,
    Sparkles,
    Copy,
    RefreshCw,
    Search,
    Wifi,
    Radio,
    Terminal,
    ArrowRight,
    Layers,
    Server,
    UserPlus,
    Users,
    Key,
    ShieldCheck,
    Database,
    Zap,
    Link2,
    Network,
    Calculator,
    Check,
    Eye
} from "lucide-react"
import { apiRequest, getApiUrl } from "@/lib/api"
import { toast } from "react-hot-toast"
import * as XLSX from "xlsx"

type LogItem = {
    rowNumber: number
    name: string
    status: "success" | "skipped" | "failed" | "warning"
    message: string
}

type TabType = "branches" | "plans" | "packages" | "leads" | "customers" | "olts"

const INTERNET_PLAN_CSV_EXAMPLE = [
    "Plan Name,Plan Code,Service,NAS Type,Priority,Package Type,Connection Type,Download Speed (Mbps),Upload Speed (Mbps),INT Upload,FIR Download,Local Upload,Local Download,Organization,Branch,Allow Rename,FUP Apply,Is FUP Package,Only Renewal,Popular,High Priority,FUP Limit (GB),Apply Framed Pool,Framed Pool Value,Vendor-Specific Profiles,Custom Radius Attributes,Description",
    '155 Mbps,155 MBPS,155 Mbps,"cisco, juniper, mikrotik, nokia",1,HOME,FTTH,155,155,155,155,155,155,ARROWNET Pvt. Ltd.,ARROWNET Pvt. Ltd.,FALSE,TRUE,FALSE,FALSE,TRUE,TRUE,0,TRUE,Pool 2 (pool2),JUNIPER:xFTTH-pp0,"ERX-IPv6-Delegated-Pool-Name := v6-default-pd\nFramed-IPv6-Pool := v6-ndra",Ultra High Speed 155 Mbps FTTH Internet',
    '100 Mbps,100 MBPS,Internet,"mikrotik, juniper",1,HOME,Fiber,100,100,100,100,100,100,ARROWNET Pvt. Ltd.,Arrownet RTC,FALSE,TRUE,FALSE,FALSE,TRUE,FALSE,0,FALSE,,,,Standard 100 Mbps Unlimited Fiber Internet',
].join("\n")

/**
 * Universal Item Matcher for Package Addon Charges
 */
function findMatchingAddon(rawKey: string, addonList: any[]) {
    if (!rawKey || !Array.isArray(addonList) || addonList.length === 0) return null
    const clean = String(rawKey).trim()
    if (!clean) return null

    if (/^\d+$/.test(clean)) {
        const byId = addonList.find((a) => a && a.id === Number(clean))
        if (byId) return byId
    }

    const lower = clean.toLowerCase()

    let match = addonList.find(
        (a) =>
            a && (
                (a.code && a.code.toLowerCase() === lower) ||
                (a.name && a.name.toLowerCase() === lower) ||
                (a.referenceId && a.referenceId.toLowerCase() === lower)
            )
    )
    if (match) return match

    const normalize = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
    const normKey = normalize(clean)
    if (!normKey) return null

    match = addonList.find(
        (a) =>
            a && (
                (a.code && normalize(a.code) === normKey) ||
                (a.name && normalize(a.name) === normKey) ||
                (a.referenceId && normalize(a.referenceId) === normKey)
            )
    )
    if (match) return match

    match = addonList.find((a) => {
        if (!a) return false
        const nName = normalize(a.name)
        const nCode = normalize(a.code)
        return (
            (nName && (normKey.includes(nName) || nName.includes(normKey))) ||
            (nCode && (normKey === nCode || normKey.includes(nCode)))
        )
    })
    if (match) return match

    return null
}

function ImportHubContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const paramType = searchParams ? (searchParams.get("type") as TabType) : "branches"
    const initialType: TabType = ["branches", "plans", "packages", "leads", "customers", "olts"].includes(paramType)
        ? paramType
        : "branches"

    const [activeTab, setActiveTab] = useState<TabType>(initialType)
    const [inputMode, setInputMode] = useState<"file" | "paste">("file")
    const [fileName, setFileName] = useState("")
    const [rawText, setRawText] = useState("")
    const [parsedRows, setParsedRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState<LogItem[]>([])
    const [logFilter, setLogFilter] = useState<"all" | "success" | "skipped" | "failed">("all")
    const [logSearch, setLogSearch] = useState("")
    const [skipExisting, setSkipExisting] = useState(false)
    const [syncRadius, setSyncRadius] = useState(true)

    // Speed Plan Selection, Addon Charges & Tax Settings
    const [planOptions, setPlanOptions] = useState<Option[]>([])
    const [selectedTargetPlanId, setSelectedTargetPlanId] = useState<string>("")
    const [tscPercentage, setTscPercentage] = useState<number>(10)
    const [addonCharges, setAddonCharges] = useState<any[]>([])

    const dynamicPackagePlaceholder = useMemo(() => {
        const itemSamples = addonCharges.length > 0
            ? addonCharges.map(a => `${a.name || a.code}: ${a.amount || (a.isRenewal ? 500 : 0)}`).join(", ")
            : "Internet: 500, Support And Maintance: 500, Drop Wire: 0, Douplex Router: 0"
        
        return [
            "Plan Name,Package Reference Name,Duration,Enabled,Online,Package Items",
            `100 Mbps,Premium Fiber 100M,1 Month,TRUE,FALSE,"${itemSamples}"`,
            `100 Mbps,Premium Fiber 100M,3 Months,TRUE,FALSE,"${itemSamples}"`,
            `100 Mbps,Premium Fiber 100M,6 Months,TRUE,FALSE,"${itemSamples}"`,
            `100 Mbps,Premium Fiber 100M,12 Months,TRUE,TRUE,"${itemSamples}"`
        ].join("\n")
    }, [addonCharges])

    // Load available speed plans, addon inventory items, and ISP tax settings
    useEffect(() => {
        apiRequest<{ id: number; planName: string }[]>("/pkgplan")
            .then((raw) => {
                const list = Array.isArray(raw)
                    ? raw.map((p) => ({ value: String(p.id), label: p.planName }))
                    : []
                setPlanOptions([
                    { value: "", label: "Auto-match from Template (or Create Plan)" },
                    ...list
                ])
            })
            .catch(() => {})

        apiRequest<any[]>("/extra-charges")
            .then((raw) => {
                if (Array.isArray(raw)) {
                    setAddonCharges(raw)
                }
            })
            .catch(() => {})

        apiRequest<Record<string, string>>("/settings")
            .then((data) => {
                if (data && data.tscPercentage) {
                    setTscPercentage(parseInt(data.tscPercentage, 10) || 10)
                }
            })
            .catch(() => {})
    }, [])

    useEffect(() => {
        const typeParam = searchParams ? (searchParams.get("type") as TabType) : null
        if (typeParam && ["branches", "plans", "packages", "leads", "customers"].includes(typeParam)) {
            setActiveTab(typeParam)
            resetState()
        }
    }, [searchParams])

    const handleTabChange = (val: TabType) => {
        setActiveTab(val)
        resetState()
        router.push(`/import?type=${val}`, { scroll: false })
    }

    const resetState = () => {
        setFileName("")
        setRawText("")
        setParsedRows([])
        setLogs([])
    }

    // Dynamically locate real header row in spreadsheets (supporting title banners like Arrownet report)
    const parseWorksheetRows = (worksheet: XLSX.WorkSheet): any[] => {
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        if (!rawRows || rawRows.length === 0) return []

        let headerRowIndex = 0
        const headerKeywords = [
            "username", "customer", "first name", "name", "expiration", "remaining days",
            "expiry", "phone", "mobile", "address", "organization", "branch", "package",
            "plan", "period", "lead", "registered on", "olt", "splitter", "service", "nas"
        ]

        for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
            const row = rawRows[i]
            if (Array.isArray(row) && row.length > 0) {
                const matches = row.filter(cell => {
                    const str = String(cell || "").toLowerCase().trim()
                    return headerKeywords.some(kw => str.includes(kw))
                })
                if (matches.length >= 2 || row.some(cell => String(cell || "").toLowerCase().trim() === "username")) {
                    headerRowIndex = i
                    break
                }
            }
        }

        return XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: "" })
    }

    // Process and parse file (XLSX, XLS, CSV, JSON)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        const isJson = file.name.endsWith(".json")

        if (isJson) {
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string)
                    const arrayData = Array.isArray(parsed) ? parsed : [parsed]
                    setParsedRows(arrayData)
                    toast.success(`Loaded ${arrayData.length} records from JSON file`)
                } catch (err: any) {
                    toast.error(`JSON parse error: ${err.message}`)
                }
            }
            reader.readAsText(file)
        } else {
            // Excel or CSV
            const reader = new FileReader()
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer)
                    const workbook = XLSX.read(data, { type: "array" })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]
                    const jsonRows = parseWorksheetRows(worksheet)
                    setParsedRows(jsonRows)
                    toast.success(`Loaded ${jsonRows.length} rows from ${file.name}`)
                } catch (err: any) {
                    toast.error(`Failed to parse spreadsheet: ${err.message}`)
                }
            }
            reader.readAsArrayBuffer(file)
        }
    }

    // Process raw text paste (CSV / JSON)
    const handleParseRawText = () => {
        if (!rawText.trim()) {
            toast.error("Please paste CSV or JSON data first")
            return
        }

        try {
            if (rawText.trim().startsWith("[") || rawText.trim().startsWith("{")) {
                const parsed = JSON.parse(rawText.trim())
                const arrayData = Array.isArray(parsed) ? parsed : [parsed]
                setParsedRows(arrayData)
                toast.success(`Parsed ${arrayData.length} JSON records`)
            } else {
                // Parse CSV text via XLSX utility
                const workbook = XLSX.read(rawText.trim(), { type: "string" })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const jsonRows = parseWorksheetRows(worksheet)
                setParsedRows(jsonRows)
                toast.success(`Parsed ${jsonRows.length} CSV rows`)
            }
        } catch (err: any) {
            toast.error(`Parse failed: ${err.message}`)
        }
    }

    // Download template from backend
    const handleDownloadTemplate = async (format: "xlsx" | "csv" | "json") => {
        try {
            const url = `${getApiUrl()}/import/template/${activeTab}?format=${format}`
            window.open(url, "_blank")
        } catch (err: any) {
            toast.error("Failed to download template")
        }
    }

    // Download Arrownet-specific template (supporting arrownetorg.xlsx columns)
    const handleDownloadArrownetTemplate = (format: "xlsx" | "csv") => {
        const headers = [
            "Username", "Name", "Customer Code", "Mobile", "Address",
            "Organization", "Branch", "Expiration", "Remaining Days",
            "Package", "Period", "Registered On"
        ]
        const sampleRow = {
            Username: "akash",
            Name: "Akash Shrestha",
            "Customer Code": "32497",
            Mobile: "9801191325",
            Address: "Thimi",
            Organization: "ARROWNET Pvt. Ltd.",
            Branch: "ARROWNET Pvt. Ltd.",
            Expiration: "15th Jul 2030",
            "Remaining Days": "1405",
            Package: "155 Mbps",
            Period: "1",
            "Registered On": "3rd Dec 2013"
        }
        const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers })
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
        if (format === "xlsx") {
            XLSX.writeFile(wb, "arrownet_customers_template.xlsx")
        } else {
            XLSX.writeFile(wb, "arrownet_customers_template.csv")
        }
    }

    const isArrownetFormat = useMemo(() => {
        if (!parsedRows || parsedRows.length === 0) return false
        const first = parsedRows[0]
        return Boolean(first && ("Expiration" in first || "expiration" in first || "Remaining Days" in first || "Customer Code" in first))
    }, [parsedRows])

    const [importProgress, setImportProgress] = useState<{ current: number; total: number; percent: number; batch: number; totalBatches: number } | null>(null)

    // Execute Import API with Automatic Batching (to prevent 413 Payload Too Large)
    const handleExecuteImport = async () => {
        if (!parsedRows || parsedRows.length === 0) {
            toast.error("No data rows available to import. Please upload a file or paste data.")
            return
        }

        setLoading(true)
        setLogs([])
        setImportProgress(null)

        try {
            let endpoint = "/import/branches"
            if (activeTab === "plans") endpoint = "/import/plans"
            else if (activeTab === "packages") endpoint = "/import/packages"
            else if (activeTab === "leads") endpoint = "/import/leads"
            else if (activeTab === "customers") endpoint = "/import/customers"
            else if (activeTab === "olts") endpoint = "/import/olts"

            const BATCH_SIZE = 50
            const totalRows = parsedRows.length
            const totalBatches = Math.ceil(totalRows / BATCH_SIZE)

            let overallSuccess = 0
            let overallFailed = 0
            let overallSkipped = 0
            const accumulatedLogs: any[] = []

            for (let b = 0; b < totalBatches; b++) {
                const batchItems = parsedRows.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE)
                const currentCount = Math.min((b + 1) * BATCH_SIZE, totalRows)
                const percent = Math.round((currentCount / totalRows) * 100)

                setImportProgress({
                    current: currentCount,
                    total: totalRows,
                    percent,
                    batch: b + 1,
                    totalBatches
                })

                const payload = {
                    items: batchItems,
                    skipExisting,
                    syncRadius: activeTab === "plans" || activeTab === "packages" || activeTab === "customers" ? syncRadius : false,
                    targetPlanId: activeTab === "packages" && selectedTargetPlanId ? Number(selectedTargetPlanId) : undefined
                }

                try {
                    const response = await apiRequest<any>(endpoint, {
                        method: "POST",
                        body: JSON.stringify(payload)
                    })

                    if (response?.logs && Array.isArray(response.logs)) {
                        const offsetLogs = response.logs.map((l: any, idx: number) => ({
                            ...l,
                            rowNumber: l.rowNumber ? (b * BATCH_SIZE) + l.rowNumber : (b * BATCH_SIZE) + idx + 1
                        }))
                        accumulatedLogs.push(...offsetLogs)
                        setLogs([...accumulatedLogs])
                    }

                    overallSuccess += response?.successCount || 0
                    overallFailed += response?.failedCount || 0
                    overallSkipped += response?.skippedCount || 0
                } catch (batchErr: any) {
                    console.error(`Batch ${b + 1} failed:`, batchErr)
                    const errorMsg = batchErr.message || "Failed to process batch"
                    batchItems.forEach((item, itemIdx) => {
                        accumulatedLogs.push({
                            rowNumber: (b * BATCH_SIZE) + itemIdx + 1,
                            name: item['Plan Name'] || item['Plan Code'] || item['First Name'] || item['Branch Name'] || `Row ${(b * BATCH_SIZE) + itemIdx + 1}`,
                            status: "failed",
                            message: errorMsg
                        })
                    })
                    overallFailed += batchItems.length
                    setLogs([...accumulatedLogs])
                }
            }

            if (overallFailed === 0) {
                toast.success(`Import complete! ${overallSuccess} processed successfully.`)
            } else {
                toast.error(`Import completed: ${overallSuccess} succeeded, ${overallFailed} failed, ${overallSkipped} skipped.`)
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to process import")
        } finally {
            setLoading(false)
            setImportProgress(null)
        }
    }

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (logFilter !== "all" && log.status !== logFilter) return false
            if (logSearch.trim()) {
                const q = logSearch.toLowerCase()
                return (
                    log.name.toLowerCase().includes(q) ||
                    log.message.toLowerCase().includes(q) ||
                    String(log.rowNumber).includes(q)
                )
            }
            return true
        })
    }, [logs, logFilter, logSearch])

    const counts = useMemo(() => {
        return {
            total: logs.length,
            success: logs.filter((l) => l.status === "success").length,
            skipped: logs.filter((l) => l.status === "skipped").length,
            failed: logs.filter((l) => l.status === "failed").length
        }
    }, [logs])

    const copyLogsToClipboard = () => {
        const text = logs
            .map((l) => `[Row ${l.rowNumber}] [${l.status.toUpperCase()}] ${l.name}: ${l.message}`)
            .join("\n")
        navigator.clipboard.writeText(text)
        toast.success("Logs copied to clipboard")
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <PageHeader
                    title="Data Import Hub"
                    description="Centralized data ingestion for Branches, Internet Plans, Package Tariffs, CRM Leads, and RADIUS Customers with live verification logs"
                    icon={Upload}
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Import Hub", href: "/import" },
                    ]}
                />

                {/* Primary Section Tabs */}
                <Tabs value={activeTab} onValueChange={(val: any) => handleTabChange(val)} className="w-full">
                    <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 w-full h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
                        <TabsTrigger
                            value="branches"
                            className="gap-2 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold rounded-lg text-xs sm:text-sm"
                        >
                            <Building2 className="h-4 w-4" />
                            Branches & Sub-Branches
                        </TabsTrigger>
                        <TabsTrigger
                            value="plans"
                            className="gap-2 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-semibold rounded-lg text-xs sm:text-sm"
                        >
                            <Wifi className="h-4 w-4" />
                            Internet Plans
                        </TabsTrigger>
                        <TabsTrigger
                            value="packages"
                            className="gap-2 py-2.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-semibold rounded-lg text-xs sm:text-sm"
                        >
                            <Package className="h-4 w-4" />
                            Packages & Tariffs
                        </TabsTrigger>
                        <TabsTrigger
                            value="leads"
                            className="gap-2 py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold rounded-lg text-xs sm:text-sm"
                        >
                            <UserPlus className="h-4 w-4" />
                            CRM Leads
                        </TabsTrigger>
                        <TabsTrigger
                            value="customers"
                            className="gap-2 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold rounded-lg text-xs sm:text-sm"
                        >
                            <Users className="h-4 w-4" />
                            Customers (RADIUS)
                        </TabsTrigger>
                        <TabsTrigger
                            value="olts"
                            className="gap-2 py-2.5 data-[state=active]:bg-cyan-600 data-[state=active]:text-white font-semibold rounded-lg text-xs sm:text-sm"
                        >
                            <Server className="h-4 w-4" />
                            OLTs & PON
                        </TabsTrigger>
                    </TabsList>

                    {/* ================= 1. BRANCHES TAB ================= */}
                    <TabsContent value="branches" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Branches & Sub-Branches"
                                    description="Supports parent branch hierarchy and identical names (e.g. Branch: Arrownet > Sub-Branch: Arrownet, Charikot > Bhimeshwor)"
                                >
                                    <div className="space-y-5">
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="branch-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="branch-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <FileSpreadsheet className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Excel, CSV, or JSON file"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supported formats: .xlsx, .xls, .csv, .json
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste CSV Lines or JSON Array</Label>
                                                <Textarea
                                                    placeholder="Branch Name,Sub-Branch Name,Phone Number,Email,Address&#10;Arrownet,Arrownet,9802022600,info@arrownet.com.np,Head Office&#10;Arrownet,Arrownet Akar Complex,9802022600,sushila@arrownet.com.np,Akar Complex&#10;Charikot,Charikot,9801191323,charikot@arrownet.com.np,Main Bazar&#10;Charikot,Bhimeshwor,9801191323,bhimeshwor@arrownet.com.np,Bhimeshwor Ward 3"
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        <div className="bg-muted/40 p-4 rounded-lg flex items-center justify-between border border-border">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Skip Already Existing Branches</p>
                                                <p className="text-xs text-muted-foreground">If enabled, existing branches & sub-branches will not be overwritten</p>
                                            </div>
                                            <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} rows ready for import` : "No rows loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                Start Branch Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            <div className="space-y-6">
                                <CardContainer title="Download Sample Templates" description="Pre-filled with real hierarchical branch data">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">Formatted with sample branches</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard comma-separated format</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Hierarchy Tips:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li><span className="font-semibold text-foreground">Same-Name Branch & Sub-Branch:</span> Supported! A sub-branch can share the exact name as the parent branch (e.g. Branch: <span className="font-mono text-foreground">Arrownet</span> & Sub-Branch: <span className="font-mono text-foreground">Arrownet</span>).</li>
                                            <li>Leave <span className="font-mono text-foreground">Sub-Branch Name</span> blank to create an Organization / Head Branch only.</li>
                                            <li>To group sub-branches under a parent, specify the same <span className="font-mono text-foreground">Branch Name</span> across rows.</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= 2. INTERNET PLANS TAB ================= */}
                    <TabsContent value="plans" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Internet Plans & RADIUS Profiles"
                                    description="Configure base internet plans with speeds (Down, Up, Local, FIR, INT), multi-NAS (Cisco, Juniper, MikroTik, Nokia), Organization branch linking, FUP, framed pools, and custom RADIUS attributes"
                                >
                                    <div className="space-y-5">
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-indigo-500/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="plan-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="plan-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                                        <Wifi className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Internet Plans spreadsheet"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supports full plan specifications, branch mapping, and FreeRADIUS profiles
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste Internet Plans CSV or JSON Array</Label>
                                                <Textarea
                                                    placeholder={INTERNET_PLAN_CSV_EXAMPLE}
                                                    rows={8}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-muted/40 p-4 rounded-lg flex items-center justify-between border border-border">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Skip Existing Plans</p>
                                                    <p className="text-xs text-muted-foreground">Skip if Plan Code or Name already exists</p>
                                                </div>
                                                <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                                            </div>

                                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <Server className="h-5 w-5 text-indigo-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">Sync to FreeRADIUS</p>
                                                        <p className="text-xs text-muted-foreground">Create radgroupcheck & radgroupreply</p>
                                                    </div>
                                                </div>
                                                <Switch checked={syncRadius} onCheckedChange={setSyncRadius} />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} internet plans ready for import` : "No plans loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                                                Start Internet Plan Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            <div className="space-y-6">
                                <CardContainer title="Download Plan Templates" description="Separate Organization & Branch hierarchy with the complete plan field set">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Internet Plans Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">Parent Organization and child Branch are separate columns</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Internet Plans CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard comma-separated format</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Internet Plans JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Plan Configuration Features:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li><span className="font-semibold text-foreground">Organization + Branch:</span> Enter exact names only—no numeric IDs and no <span className="font-mono text-foreground">BR-/SB-</span> codes. <span className="font-mono text-foreground">Organization</span> must have no parent; <span className="font-mono text-foreground">Branch</span> must belong to that Organization. Both may safely have the same name.</li>
                                            <li><span className="font-semibold text-foreground">Custom Radius Attributes:</span> Enter multiple attributes on separate lines (e.g. <span className="font-mono text-foreground">ERX-IPv6-Delegated-Pool-Name := v6-default-pd</span> and <span className="font-mono text-foreground">Framed-IPv6-Pool := v6-ndra</span>). All lines are parsed and sent directly to FreeRADIUS!</li>
                                            <li><span className="font-semibold text-foreground">Multi-NAS RADIUS:</span> Supports <span className="font-mono text-foreground">cisco, juniper, mikrotik, nokia</span>. Generates dynamic vendor profiles (e.g. `JUNIPER:xFTTH-pp0`), IPv6 delegation pools, and QoS overrides automatically.</li>
                                            <li><span className="font-semibold text-foreground">Speeds:</span> Supports Download, Upload, INT Upload, FIR Download, Local Upload, and Local Download in Mbps.</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= 3. PACKAGES & TARIFFS TAB ================= */}
                    <TabsContent value="packages" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Packages & Tariff Rate Sheet"
                                    description="Auto-parses duration prices (1M, 3M, 6M, 12M), Internet/Support charges with TSC (10%) and VAT (13%), and connects with Package Plans"
                                >
                                    <div className="space-y-5">
                                        {/* Optional Target Internet Speed Plan Selector */}
                                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                                                    <Wifi className="h-3.5 w-3.5 text-amber-600" />
                                                    Target Internet Speed Plan (Optional Override)
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground">
                                                    If blank, plan is read or created from template
                                                </span>
                                            </div>
                                            <SearchableSelect
                                                options={planOptions}
                                                value={selectedTargetPlanId}
                                                onValueChange={(val) => setSelectedTargetPlanId(val as string)}
                                                placeholder="Select Speed Plan or auto-match from template"
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </div>

                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-amber-500/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="package-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="package-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Tariff Rate Sheet"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supports 1M, 3M, 6M, 12M rate matrix with dynamic inventory items from your catalog
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste Tariff CSV or JSON Array</Label>
                                                <Textarea
                                                    placeholder={dynamicPackagePlaceholder}
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        {/* Live Preview of Parsed Packages */}
                                        {parsedRows.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Calculator className="h-4 w-4 text-amber-600" />
                                                        <span className="text-xs font-bold text-foreground">
                                                            Parsed Tariff Rate Matrix Preview ({parsedRows.length} plans)
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                                        <Check className="h-3.5 w-3.5" />
                                                        Auto-calculating TSC ({tscPercentage}%) & VAT (13%)
                                                    </span>
                                                </div>

                                                <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
                                                    {parsedRows.slice(0, 5).map((row, rIdx) => {
                                                        const targetPlanObj = planOptions.find(p => p.value === selectedTargetPlanId);
                                                        const planName = targetPlanObj?.value ? targetPlanObj.label : (row['Plan Name'] || row.planName || row['Internet Speed Plan'] || row['Package Name'] || row.packageName || `Plan #${rIdx + 1}`);
                                                        const pkgRefName = row['Package Reference Name'] || row.packageReferenceName || row['Package Name'] || row.packageName || planName;

                                                        const parseBool = (v: any, def: boolean) => {
                                                            if (v === undefined || v === null || v === '') return def;
                                                            if (typeof v === 'boolean') return v;
                                                            const s = String(v).trim().toLowerCase();
                                                            if (['true', '1', 'yes', 'enabled', 'active', 'y'].includes(s)) return true;
                                                            if (['false', '0', 'no', 'disabled', 'inactive', 'n'].includes(s)) return false;
                                                            return def;
                                                        };

                                                        const DURATIONS_DEF = [
                                                            { name: "1 Month", prefixes: ['1m', '1 month', '1_month', '1month', '1_m'] },
                                                            { name: "3 Months", prefixes: ['3m', '3 months', '3_months', '3months', '3 month', '3_m'] },
                                                            { name: "6 Months", prefixes: ['6m', '6 months', '6_months', '6months', '6 month', '6_m'] },
                                                            { name: "12 Months", prefixes: ['12m', '12 months', '12_months', '12months', '1 year', '1_year', '1year', '12 month', '12_m'] }
                                                        ];

                                                        const rowDurationRaw = (row.duration || row['Duration'] || row.period || row['Period'] || row.tier || row['Tier'] || '').toString().trim().toLowerCase();

                                                        const tiers = DURATIONS_DEF.map(dConf => {
                                                            let enabled = true;
                                                            let online = false;
                                                            const itemsMap = new Map<number, { addon: any; amount: number }>();

                                                            const isSingleTierRow = Boolean(rowDurationRaw);
                                                            const matchesThisDuration = isSingleTierRow && dConf.prefixes.some(p => {
                                                                const cleanP = p.replace(/[^a-z0-9]/g, '');
                                                                const cleanD = rowDurationRaw.replace(/[^a-z0-9]/g, '');
                                                                return cleanD === cleanP || cleanD.startsWith(cleanP);
                                                            });

                                                            // If this row is a single-tier row for another duration, mark unconfigured
                                                            if (isSingleTierRow && !matchesThisDuration) {
                                                                return {
                                                                    dur: dConf.name,
                                                                    enabled: false,
                                                                    online: false,
                                                                    items: [],
                                                                    recurringBase: 0,
                                                                    totalTsc: 0,
                                                                    itemsSum: 0,
                                                                    initialTotal: 0,
                                                                    renewTotal: 0
                                                                };
                                                            }

                                                            if (isSingleTierRow) {
                                                                enabled = parseBool(row.enabled ?? row['Enabled'] ?? row.active ?? row['Active'] ?? row.status ?? row['Status'], true);
                                                                online = parseBool(row.online ?? row['Online'] ?? row.isOnline ?? row['Is Online'], false);
                                                                const rawItems = row.packageItems || row['Package Items'] || row.items || row['Items'] || row.addons || row['Addon Charges'] || row['Item Charges'];
                                                                if (rawItems && typeof rawItems === 'string') {
                                                                    const parts = rawItems.split(/[\n\r,;|]+/);
                                                                    for (const part of parts) {
                                                                        const [k, v] = part.split(/[:=]+/);
                                                                        if (k) {
                                                                            const matched = findMatchingAddon(k.trim(), addonCharges);
                                                                            if (matched) {
                                                                                itemsMap.set(matched.id, { addon: matched, amount: parseFloat(v ? v.trim() : '0') || (matched.amount || 0) });
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }

                                                            for (const [rawColKey, rawVal] of Object.entries(row)) {
                                                                if (rawVal === undefined || rawVal === null || rawVal === '') continue;
                                                                const colKey = rawColKey.trim();
                                                                const colKeyLower = colKey.toLowerCase();

                                                                let matchedPrefix: string | null = null;
                                                                for (const p of dConf.prefixes) {
                                                                    if (colKeyLower.startsWith(p)) {
                                                                        const rem = colKey.slice(p.length);
                                                                        if (!rem || /^[\s_:-]/.test(rem)) {
                                                                            matchedPrefix = p;
                                                                            break;
                                                                        }
                                                                    }
                                                                }

                                                                if (!matchedPrefix) {
                                                                    if (isSingleTierRow) {
                                                                        const matchedAddon = findMatchingAddon(colKey, addonCharges);
                                                                        if (matchedAddon && !itemsMap.has(matchedAddon.id)) {
                                                                            itemsMap.set(matchedAddon.id, { addon: matchedAddon, amount: parseFloat(rawVal as string) || 0 });
                                                                        }
                                                                    }
                                                                    continue;
                                                                }

                                                                const suffix = colKey.slice(matchedPrefix.length).replace(/^[\s_:-]+/, '').trim();
                                                                const normSuffix = suffix.toLowerCase().replace(/[^a-z0-9]/g, '');

                                                                if (['enabled', 'active', 'isactive', 'isenabled', 'status'].includes(normSuffix)) {
                                                                    enabled = parseBool(rawVal, true);
                                                                    continue;
                                                                }

                                                                if (['online', 'isonline', 'live', 'portal'].includes(normSuffix)) {
                                                                    online = parseBool(rawVal, false);
                                                                    continue;
                                                                }

                                                                if (['items', 'addons', 'charges', 'itemlist', 'packageitems'].includes(normSuffix)) {
                                                                    try {
                                                                        if (typeof rawVal === 'object') {
                                                                            for (const [k, v] of Object.entries(rawVal as Record<string, any>)) {
                                                                                const matched = findMatchingAddon(k, addonCharges);
                                                                                if (matched) {
                                                                                    itemsMap.set(matched.id, { addon: matched, amount: parseFloat(v as string) || 0 });
                                                                                }
                                                                            }
                                                                        } else if (typeof rawVal === 'string') {
                                                                            const parts = (rawVal as string).split(/[\n\r,;|]+/);
                                                                            for (const part of parts) {
                                                                                const [k, v] = part.split(/[:=]+/);
                                                                                if (k) {
                                                                                    const matched = findMatchingAddon(k.trim(), addonCharges);
                                                                                    if (matched) {
                                                                                        itemsMap.set(matched.id, { addon: matched, amount: parseFloat(v ? v.trim() : '0') || 0 });
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    } catch (e) {}
                                                                    continue;
                                                                }

                                                                const matchedAddon = findMatchingAddon(suffix, addonCharges);
                                                                if (matchedAddon) {
                                                                    const amt = parseFloat(rawVal as string) || 0;
                                                                    itemsMap.set(matchedAddon.id, { addon: matchedAddon, amount: amt });
                                                                }
                                                            }

                                                            const items = Array.from(itemsMap.values());
                                                            let initialTaxableSum = 0;
                                                            let initialNonTaxableSum = 0;
                                                            let renewTaxableSum = 0;
                                                            let renewNonTaxableSum = 0;
                                                            let recurringBase = 0;
                                                            let totalTsc = 0;

                                                            items.forEach(({ addon, amount }) => {
                                                                if (!addon) return;
                                                                const isTsc = Boolean(addon.isTscApplicable);
                                                                const isTaxable = addon.isTaxable !== false;
                                                                const isRenewal = Boolean(addon.isRenewal);

                                                                const tscAmt = isTsc ? (amount * tscPercentage) / 100 : 0;
                                                                totalTsc += tscAmt;

                                                                const taxableAmt = isTaxable ? (amount + tscAmt) : 0;
                                                                const nonTaxableAmt = !isTaxable ? (amount + tscAmt) : 0;

                                                                initialTaxableSum += taxableAmt;
                                                                initialNonTaxableSum += nonTaxableAmt;

                                                                if (isRenewal) {
                                                                    recurringBase += amount;
                                                                    renewTaxableSum += taxableAmt;
                                                                    renewNonTaxableSum += nonTaxableAmt;
                                                                }
                                                            });

                                                            const itemsSum = items.reduce((sum, i) => sum + i.amount, 0);
                                                            const initialTotal = Math.round((initialTaxableSum * 1.13 + initialNonTaxableSum) * 100) / 100;
                                                            const renewTotal = Math.round((renewTaxableSum * 1.13 + renewNonTaxableSum) * 100) / 100;

                                                            return {
                                                                dur: dConf.name,
                                                                enabled,
                                                                online,
                                                                items,
                                                                recurringBase: recurringBase > 0 ? recurringBase : itemsSum,
                                                                totalTsc,
                                                                itemsSum,
                                                                initialTotal,
                                                                renewTotal
                                                            };
                                                        });

                                                        return (
                                                            <div key={rIdx} className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                                                    <div>
                                                                        <span className="font-bold text-sm text-foreground">{pkgRefName}</span>
                                                                        {planName !== pkgRefName && (
                                                                            <span className="text-xs text-muted-foreground ml-2">({planName})</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-muted-foreground">
                                                                        Row #{rIdx + 1}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                                    {tiers.map((t) => (
                                                                        <div key={t.dur} className="bg-muted/30 border rounded-lg p-2.5 text-[11px] space-y-2">
                                                                            <div className="flex justify-between items-center font-bold border-b pb-1">
                                                                                <span className="text-amber-600 dark:text-amber-400">{t.dur}</span>
                                                                                <div className="flex gap-1 text-[9px]">
                                                                                    <span className={`px-1 rounded ${t.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'}`}>
                                                                                        {t.enabled ? 'Active' : 'Off'}
                                                                                    </span>
                                                                                    <span className={`px-1 rounded ${t.online ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-200 text-slate-600'}`}>
                                                                                        {t.online ? 'Online' : 'Offline'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-1 text-muted-foreground min-h-[45px]">
                                                                                {t.items.length > 0 ? (
                                                                                    t.items.map(({ addon, amount }) => (
                                                                                        <div key={addon.id} className="flex justify-between items-center text-[10px]">
                                                                                            <span className="truncate max-w-[100px]" title={addon.name}>
                                                                                                {addon.name || addon.code}:
                                                                                            </span>
                                                                                            <div className="flex items-center gap-1 font-medium text-foreground">
                                                                                                {addon.isTscApplicable && (
                                                                                                    <span className="text-[8px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1 rounded">
                                                                                                        +TSC
                                                                                                    </span>
                                                                                                )}
                                                                                                <span>Rs. {amount}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <p className="text-[10px] text-muted-foreground/60 italic">No item breakdown</p>
                                                                                )}
                                                                            </div>

                                                                            <div className="border-t pt-1.5 space-y-0.5 font-medium">
                                                                                <div className="flex justify-between text-blue-600 dark:text-blue-400 text-[10px]">
                                                                                    <span>Items TSC ({tscPercentage}%):</span>
                                                                                    <span>Rs. {t.totalTsc.toFixed(2)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-foreground text-[10px]">
                                                                                    <span>Base (Recurring):</span>
                                                                                    <span>Rs. {t.recurringBase}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                                                                    <span>Est. Total (VAT 13%):</span>
                                                                                    <span>Rs. {t.initialTotal}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                                                    <span>Renew (VAT 13%):</span>
                                                                                    <span>Rs. {t.renewTotal}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {parsedRows.length > 5 && (
                                                        <p className="text-[11px] text-center text-muted-foreground pt-1">
                                                            Showing preview for first 5 of {parsedRows.length} packages...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Sync to FreeRADIUS Database</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Creates group check (Auth-Type := Accept) & group reply (Mikrotik-Rate-Limit: 100M/100M)
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch checked={syncRadius} onCheckedChange={setSyncRadius} />
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} plans ready for import` : "No plans loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                                                Start Package & Tariff Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            <div className="space-y-6">
                                <CardContainer title="Download Tariff Templates" description="Pre-filled with dynamic rate sheets from your inventory package addon charges">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Tariff Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">1M, 3M, 6M, 12M rate matrix with dynamic inventory items</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Tariff CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard rate breakdown with dynamic inventory items</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Tariff JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Package Creation & Tariff Highlights:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li><span className="font-semibold text-foreground">No Manual Taxes Needed:</span> TSC (10%) and VAT (13%) are automatically computed from item rules—no tax columns needed in your rate sheet!</li>
                                            <li><span className="font-semibold text-foreground">Duration Tiers:</span> Supports 1M, 3M, 6M, and 12M with separate <span className="font-mono text-foreground">Enabled</span> and <span className="font-mono text-foreground">Online</span> status flags.</li>
                                            <li><span className="font-semibold text-foreground">Dynamic Item Breakdown:</span> Automatically generates columns for all active Inventory Items for Package Addon Charges (e.g. Internet, Support, Drop Wire, Douplex Router, NetTV, etc.) with custom item amounts.</li>
                                            <li><span className="font-semibold text-foreground">Billing & RADIUS Synced:</span> Auto-creates unique reference IDs and synchronizes seamlessly with FreeRADIUS & Nepurix/Billing services.</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= 4. LEADS TAB ================= */}
                    <TabsContent value="leads" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload CRM Prospect Leads"
                                    description="Import sales prospects with auto-branch resolution, interested package linking, and status tracking"
                                >
                                    <div className="space-y-5">
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-emerald-500/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="lead-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="lead-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                        <UserPlus className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Leads spreadsheet"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supported formats: .xlsx, .xls, .csv, .json
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste Leads CSV or JSON Array</Label>
                                                <Textarea
                                                    placeholder="First Name,Last Name,Phone Number,Email,Address,City,Branch Name,Interested Package&#10;Ram,Thapa,9841234567,ram@gmail.com,Putalisadak,Kathmandu,Arrownet,100 Mbps&#10;Sita,Shrestha,9851098765,sita@gmail.com,Bhimeshwor,Charikot,Charikot,50 Mbps"
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        <div className="bg-muted/40 p-4 rounded-lg flex items-center justify-between border border-border">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Skip Already Existing Leads</p>
                                                <p className="text-xs text-muted-foreground">If enabled, leads with matching email or phone number will be skipped</p>
                                            </div>
                                            <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} leads ready for import` : "No leads loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                                Start Leads Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            <div className="space-y-6">
                                <CardContainer title="Download Leads Template" description="Pre-filled with standard CRM sales prospect format">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Leads Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">Formatted with sample lead prospects</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Leads CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard comma-separated format</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Leads JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Supported Lead Columns:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li><span className="font-mono text-foreground">First Name, Last Name, Full Name</span></li>
                                            <li><span className="font-mono text-foreground">Phone Number, Email, Address, City, Province</span></li>
                                            <li><span className="font-mono text-foreground">Branch Name, Sub-Branch Name, Interested Package</span></li>
                                            <li><span className="font-mono text-foreground">Status (new, contacted, qualified), Source, Notes</span></li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= 5. CUSTOMERS TAB (WITH RADIUS) ================= */}
                    <TabsContent value="customers" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Active Customers & RADIUS Subscribers"
                                    description="Imports complete customer records with Lead ID linking, PPPoE/Radius credentials, Internet Plan subscriptions, and OLT/ONT hardware"
                                >
                                    <div className="space-y-5">
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="customer-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="customer-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                                        <Users className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop Customers file"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Comprehensive format: Lead details, Service Type, NAS, OLT/Splitter, Inventory Item/Log, PPPoE/Radius, Portal User, Subscription & NetTV
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste Customers CSV or JSON Array</Label>
                                                <Textarea
                                                    placeholder="First Name,Last Name,Phone Number,Email,Address,City,Province,Branch Name,Sub-Branch Name,Customer Type,Service Type,NAS,Package Name,Duration,Plan Start Date,Plan End Date,PPPoE Username,PPPoE Password,OLT Name,OLT Port,Splitter Name,Splitter Port,VLAN IDs,VLAN Names,GEM Indices,Line Profile ID,Line Profile Name,Service Profile ID,Service Profile Name,Services,Upstream Bandwidth,Downstream Bandwidth,Device Type,Device Brand,Device Model,Device Serial Number,PON Serial,MAC Address&#10;Prakash,Dahal,9801191325,prakash.dahal@example.com,Bhimeshwor Main Road,Charikot,Bagmati,Charikot,Bhimeshwor,Home,Fiber,Mikrotik-Charikot-01,50 Mbps,3 Months,2026-08-26,2026-11-26,prakash_chk50,User@12345,OLT-Charikot-01,0/1/2,SPL-02,Port 2,527; 528,527_ACS; 528_INTERNET,6; 7,12,KISAN_LINE_100M,12,KISAN_SERV_FTTH,internet; voice; iptv; management,100M,1G,ONT,Huawei,HG8145V5,HWTC782103,HWTC782103,744d.2890.1234&#10;Sunil,Khadka,9802022610,sunil.khadka@example.com,Barhabise Chowk,Sindhupalchok,Bagmati,Khadichaur,Barhabisa Municipality Sindhupalchok,Enterprise,Fiber,Mikrotik-Khadichaur-01,100 Mbps,12 Months,2026-08-26,2027-08-26,sunil_ent100,User@12345,OLT-Khadichaur-01,0/1/3,SPL-03,Port 1,103; 104,103_ENT; 104_MGMT,3; 4,14,ENT_LINE_1G,14,ENT_SERV_1G,internet; management,100M,1G,ONT,ZTE,F670L,ZTEGC901234,ZTEGC901234,9000.4e55.6677"
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-muted/40 p-4 rounded-lg flex items-center justify-between border border-border">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Skip Existing Customers</p>
                                                    <p className="text-xs text-muted-foreground">Skip if subscriber username or phone already exists</p>
                                                </div>
                                                <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                                            </div>

                                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <Server className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                                            Sync with FreeRADIUS
                                                        </p>
                                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                                            Pushes radcheck and radusergroup subscriber records to FreeRADIUS
                                                        </p>
                                                    </div>
                                                </div>
                                                <Switch checked={syncRadius} onCheckedChange={setSyncRadius} />
                                            </div>
                                        </div>

                                        {isArrownetFormat && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5 text-xs flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
                                                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">Arrownet Customers Format Detected</p>
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                                                        Supports ordinal dates (e.g. 15th Jul 2030), converts duration (1, 3, 12) to months, derives missing plan start date from expiry, splits names into first/middle/last, and treats missing email as optional in the database.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} customers ready for import` : "No customers loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                Start Customer Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            <div className="space-y-6">
                                <CardContainer title="Download Customer Template" description="Pre-filled with CRM Leads, multiple VLANs, Line/Service profiles, and device inventory">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Customers Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">Complete multi-vlan, profile, and inventory template</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Customers CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard comma-separated format</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">Customers JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Programmatic JSON payload</div>
                                            </div>
                                        </Button>

                                        <div className="pt-3 border-t border-border">
                                            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                                Arrownet Report Format:
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                                    onClick={() => handleDownloadArrownetTemplate("xlsx")}
                                                >
                                                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600" />
                                                    Arrownet (.xlsx)
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                                    onClick={() => handleDownloadArrownetTemplate("csv")}
                                                >
                                                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                                                    Arrownet (.csv)
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">Automatic 360° Provisioning Pipeline:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li><span className="font-semibold text-foreground">Dynamic Multiple VLANs:</span> Supports multiple VLANs per customer (<span className="font-mono text-foreground">VLAN IDs: 527, 528</span>, <span className="font-mono text-foreground">VLAN Names: 527_ACS, 528_INTERNET</span>, <span className="font-mono text-foreground">GEM Indices: 6, 7</span>) with auto-creation in OLT tables.</li>
                                            <li><span className="font-semibold text-foreground">Separate Line & Service Profiles:</span> Supports distinct <span className="font-mono text-foreground">Line Profile ID / Name</span> and <span className="font-mono text-foreground">Service Profile ID / Name</span> with services and bandwidth.</li>
                                            <li><span className="font-semibold text-foreground">Standard MAC Dot Notation:</span> Formats MAC addresses into <span className="font-mono text-foreground">xxxx.xxxx.xxxx</span>.</li>
                                            <li><span className="font-semibold text-foreground">Unified Serial Numbers:</span> Assigns same serial number to Device Serial and PON Serial across Inventory and Device mappings.</li>
                                            <li><span className="font-semibold text-foreground">Local DB Registration:</span> All OLT hardware, profiles, and VLANs are stored locally in the database.</li>
                                            <li><span className="font-semibold text-foreground">FreeRADIUS:</span> Creates <span className="font-mono text-foreground">radcheck</span> with cleartext password and assigns to <span className="font-mono text-foreground">radusergroup</span> with expiry attribute.</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= 6. OLTS TAB ================= */}
                    <TabsContent value="olts" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <CardContainer
                                    title="Upload Optical Line Terminals (OLTs)"
                                    description="Provision hardware OLTs with SSH/Telnet credentials, service boards array, VLANs, and profiles"
                                >
                                    <div className="space-y-5">
                                        <div className="flex gap-2 border-b border-border pb-3">
                                            <Button
                                                type="button"
                                                variant={inputMode === "file" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("file")}
                                                className="gap-1.5"
                                            >
                                                <Upload className="h-4 w-4" />
                                                File Upload (.xlsx, .csv, .json)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={inputMode === "paste" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setInputMode("paste")}
                                                className="gap-1.5"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Paste Raw CSV / JSON
                                            </Button>
                                        </div>

                                        {inputMode === "file" ? (
                                            <div className="border-2 border-dashed border-border hover:border-cyan-500/50 transition-colors rounded-xl p-8 text-center bg-muted/20">
                                                <input
                                                    type="file"
                                                    id="olt-file-input"
                                                    className="hidden"
                                                    accept=".xlsx,.xls,.csv,.json"
                                                    onChange={handleFileUpload}
                                                />
                                                <label htmlFor="olt-file-input" className="cursor-pointer flex flex-col items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                                                        <Server className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground text-sm">
                                                            {fileName ? fileName : "Click to select or drag & drop OLTs file"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Supports Huawei, ZTE, VSOL, BDCOM, Fiberhome, Nokia with SSH/Telnet shared passwords and Service Boards array
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Paste OLTs CSV or JSON Array</Label>
                                                <Textarea
                                                    placeholder="OLT Name,IP Address,Vendor,Model,Status,Branch Name,Username,Password,Default Transport,SSH Port,Telnet Port,Telnet Enabled,Number of Service Boards,Board Type,Ports per Board,Service Boards,VLAN ID,VLAN Name,GEM Index,VLANs,Profile ID,Profile Name,Services,Upstream Bandwidth,Downstream Bandwidth,Line Profiles,Service Profiles&#10;OLT-Charikot-01,192.168.10.10,Huawei,MA5608T,online,Charikot,admin,Admin@12345,ssh,22,23,true,2,GPON,16,[{&quot;slot&quot;:1,&quot;type&quot;:&quot;GPON&quot;,&quot;portCount&quot;:16},{&quot;slot&quot;:2,&quot;type&quot;:&quot;GPON&quot;,&quot;portCount&quot;:16}],527,527_ACS,6,527; 101; 102,12,KISAN_FTTH,internet; voice; iptv; management,100M,1G,12:KISAN_FTTH:100M:1G,12:KISAN_FTTH&#10;OLT-Khadichaur-01,192.168.20.10,ZTE,C320,online,Khadichaur,admin,Admin@12345,ssh,22,23,false,1,GPON,16,[{&quot;slot&quot;:1,&quot;type&quot;:&quot;GPON&quot;,&quot;portCount&quot;:16}],103,103_INTERNET,3,101; 102; 103,14,ENT_PROFILE,internet; management,100M,1G,14:ENT_PROFILE:100M:1G,14:ENT_PROFILE&#10;OLT-Akar-01,192.168.30.10,VSOL,V1600G,online,Arrownet,admin,Admin@12345,ssh,22,23,false,1,EPON,8,[{&quot;slot&quot;:1,&quot;type&quot;:&quot;EPON&quot;,&quot;portCount&quot;:8}],101,101_DEFAULT,1,101,10,HOME_FIBER,internet; iptv,100M,1G,10:HOME_FIBER:50M:50M,10:HOME_FIBER"
                                                    rows={6}
                                                    value={rawText}
                                                    onChange={(e) => setRawText(e.target.value)}
                                                    className="font-mono text-xs"
                                                />
                                                <Button size="sm" variant="outline" onClick={handleParseRawText}>
                                                    Parse Pasted Data
                                                </Button>
                                            </div>
                                        )}

                                        <div className="bg-muted/40 p-4 rounded-lg flex items-center justify-between border border-border">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Skip Existing OLTs</p>
                                                <p className="text-xs text-muted-foreground">Skip if OLT with same IP Address or Name already exists</p>
                                            </div>
                                            <Switch checked={skipExisting} onCheckedChange={setSkipExisting} />
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {parsedRows.length > 0 ? `✅ ${parsedRows.length} OLTs ready for import` : "No OLTs loaded yet"}
                                            </p>
                                            <Button
                                                onClick={handleExecuteImport}
                                                disabled={loading || parsedRows.length === 0}
                                                className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6"
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
                                                Start OLT Import
                                            </Button>
                                        </div>
                                    </div>
                                </CardContainer>
                            </div>

                            <div className="space-y-6">
                                <CardContainer title="Download OLT Template" description="Pre-configured template with service board arrays & credentials">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("xlsx")}
                                        >
                                            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">OLT Excel Template (.xlsx)</div>
                                                <div className="text-[10px] text-muted-foreground">Formatted with Service Boards & VLAN columns</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-blue-500/30 hover:bg-blue-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("csv")}
                                        >
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">OLT CSV Template (.csv)</div>
                                                <div className="text-[10px] text-muted-foreground">Standard comma-separated format</div>
                                            </div>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-11 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
                                            onClick={() => handleDownloadTemplate("json")}
                                        >
                                            <FileCode className="h-5 w-5 text-purple-600" />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">OLT JSON Template (.json)</div>
                                                <div className="text-[10px] text-muted-foreground">Full JSON schema with ServiceBoard arrays</div>
                                            </div>
                                        </Button>
                                    </div>

                                    <div className="mt-5 p-3.5 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                                        <p className="font-semibold text-foreground">OLT Import Specifications:</p>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1 text-[11px]">
                                            <li><span className="font-semibold text-foreground">Unified Password:</span> The password supplied is applied to <span className="font-mono text-foreground">SSH Password</span>, <span className="font-mono text-foreground">SSH Enable Password</span>, and <span className="font-mono text-foreground">Telnet Password</span>.</li>
                                            <li><span className="font-semibold text-foreground">Service Boards Array:</span> Can be provided as JSON array <span className="font-mono text-foreground">[{`{"slot":1,"type":"GPON","portCount":16}`}]</span> or with separate columns (<span className="font-mono text-foreground">Number of Service Boards</span>, <span className="font-mono text-foreground">Board Type</span>, <span className="font-mono text-foreground">Ports per Board</span>).</li>
                                            <li><span className="font-semibold text-foreground">Local DB Registration:</span> All OLT hardware, profiles (ID, Name, Services, Bandwidth), and VLANs (ID, Name, GEM Index) are saved in local database without physical OLT push.</li>
                                            <li><span className="font-semibold text-foreground">RADIUS Synchronization:</span> Subscriber credentials and speed profile groups are pushed directly to FreeRADIUS.</li>
                                        </ul>
                                    </div>
                                </CardContainer>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* ================= DATA PREVIEW TABLE ================= */}
                {parsedRows.length > 0 && (
                    <CardContainer
                        title={`Data Preview (${parsedRows.length} Rows Detected)`}
                        description="Review the parsed records before triggering database insertion and RADIUS synchronization"
                    >
                        <div className="space-y-4">
                            <div className="border border-border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/80 text-muted-foreground font-semibold sticky top-0 border-b border-border">
                                        <tr>
                                            <th className="p-3">#</th>
                                            {Object.keys(parsedRows[0] || {})
                                                .slice(0, 8)
                                                .map((key) => (
                                                    <th key={key} className="p-3 font-mono">
                                                        {key}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {parsedRows.slice(0, 10).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 text-muted-foreground font-mono">{idx + 1}</td>
                                                {Object.keys(parsedRows[0] || {})
                                                    .slice(0, 8)
                                                    .map((key) => (
                                                        <td key={key} className="p-3 text-foreground max-w-[200px] truncate">
                                                            {String(row[key] ?? "")}
                                                        </td>
                                                    ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {parsedRows.length > 10 && (
                                <p className="text-[11px] text-muted-foreground text-center">
                                    Showing first 10 rows of {parsedRows.length} total rows.
                                </p>
                            )}
                        </div>
                    </CardContainer>
                )}

                {/* ================= LIVE EXECUTION LOGS ================= */}
                {(logs.length > 0 || importProgress) && (
                    <CardContainer
                        title="Import Execution Summary & Live Logs"
                        description="Detailed row-by-row status of created, updated, skipped, and failed entities"
                    >
                        <div className="space-y-4">
                            {/* Live Batch Progress Bar */}
                            {importProgress && (
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="flex items-center gap-2 text-primary">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing Batch {importProgress.batch} of {importProgress.totalBatches} ({importProgress.current} / {importProgress.total} items)...
                                        </span>
                                        <span className="text-primary font-bold">{importProgress.percent}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${importProgress.percent}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Summary Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-lg bg-muted/40 border border-border">
                                    <p className="text-xs text-muted-foreground">Total Rows</p>
                                    <p className="text-xl font-bold text-foreground mt-0.5">{counts.total}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Success</p>
                                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {counts.success}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-xs text-amber-600 dark:text-amber-400">Skipped</p>
                                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                        {counts.skipped}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                                    <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
                                        {counts.failed}
                                    </p>
                                </div>
                            </div>

                            {/* Log Filters & Search */}
                            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                                <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                    <Button
                                        size="sm"
                                        variant={logFilter === "all" ? "default" : "outline"}
                                        onClick={() => setLogFilter("all")}
                                        className="text-xs h-8"
                                    >
                                        All ({counts.total})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={logFilter === "success" ? "default" : "outline"}
                                        onClick={() => setLogFilter("success")}
                                        className="text-xs h-8 text-emerald-600"
                                    >
                                        Success ({counts.success})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={logFilter === "skipped" ? "default" : "outline"}
                                        onClick={() => setLogFilter("skipped")}
                                        className="text-xs h-8 text-amber-600"
                                    >
                                        Skipped ({counts.skipped})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={logFilter === "failed" ? "default" : "outline"}
                                        onClick={() => setLogFilter("failed")}
                                        className="text-xs h-8 text-red-600"
                                    >
                                        Failed ({counts.failed})
                                    </Button>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search log output..."
                                            value={logSearch}
                                            onChange={(e) => setLogSearch(e.target.value)}
                                            className="pl-8 text-xs h-8"
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={copyLogsToClipboard}
                                        className="h-8 gap-1.5 text-xs shrink-0"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy Logs
                                    </Button>
                                </div>
                            </div>

                            {/* Logs Container */}
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                                    {filteredLogs.length === 0 ? (
                                        <div className="p-8 text-center text-xs text-muted-foreground">
                                            No logs match the current filter criteria
                                        </div>
                                    ) : (
                                        filteredLogs.map((log, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-3 text-xs flex items-start gap-3 transition-colors ${
                                                    log.status === "failed"
                                                        ? "bg-red-500/5 hover:bg-red-500/10"
                                                        : log.status === "skipped"
                                                        ? "bg-amber-500/5 hover:bg-amber-500/10"
                                                        : "hover:bg-muted/30"
                                                }`}
                                            >
                                                <div className="shrink-0 mt-0.5">
                                                    {log.status === "success" && (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    )}
                                                    {log.status === "skipped" && (
                                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                                    )}
                                                    {log.status === "failed" && (
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[11px] text-muted-foreground">
                                                            Row #{log.rowNumber}
                                                        </span>
                                                        <span className="font-semibold text-foreground truncate">
                                                            {log.name}
                                                        </span>
                                                    </div>
                                                    <p
                                                        className={`text-[11px] mt-0.5 ${
                                                            log.status === "failed"
                                                                ? "text-red-600 dark:text-red-400"
                                                                : log.status === "skipped"
                                                                ? "text-amber-600 dark:text-amber-400"
                                                                : "text-muted-foreground"
                                                        }`}
                                                    >
                                                        {log.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContainer>
                )}
            </div>
        </DashboardLayout>
    )
}

export default function ImportHubPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Import Hub...</div>}>
            <ImportHubContent />
        </Suspense>
    )
}
