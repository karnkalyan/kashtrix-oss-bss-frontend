"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    FileText,
    RefreshCw,
    Search,
    CheckCircle2,
    XCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Terminal,
    ArrowUpDown
} from "lucide-react";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

interface LogEntry {
    id: number;
    ispId: number;
    serviceCode: string;
    operation: string;
    status: string;
    message?: string;
    data?: any;
    duration?: number;
    createdAt: string;
}

export function IntegrationLogsViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [serviceFilter, setServiceFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLogs = useCallback(async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setLoading(true);

        try {
            const response = await ServicesAPI.getServiceLogs(serviceFilter, statusFilter, page, 15);
            if (response.success) {
                setLogs(response.data);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages || 1);
                    setTotalLogs(response.pagination.total || 0);
                }
            } else {
                toast.error("Failed to load integration logs");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load logs");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [serviceFilter, statusFilter, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRefresh = () => {
        fetchLogs(true);
    };

    // Filter logs client-side additionally for instant search matching operation/message
    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.operation.toLowerCase().includes(query) ||
            (log.message || "").toLowerCase().includes(query) ||
            log.serviceCode.toLowerCase().includes(query)
        );
    });

    const formatJson = (data: any) => {
        if (!data) return "No payload data available.";
        try {
            if (typeof data === "string") {
                return JSON.stringify(JSON.parse(data), null, 2);
            }
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return String(data);
        }
    };

    return (
        <Card className="border border-gray-200/80 shadow-md">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-indigo-500" />
                        Integration Request & Response Logs
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 mt-1">
                        Track live outbound API operations, request payloads, and status codes for third-party systems
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-white hover:bg-gray-50 border-gray-200"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search operation, URL path, message..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-gray-200"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select
                            value={serviceFilter}
                            onValueChange={(val) => {
                                setServiceFilter(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[160px] bg-white border-gray-200">
                                <SelectValue placeholder="All Services" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Services</SelectItem>
                                <SelectItem value="NETTV">NetTV Integration</SelectItem>
                                <SelectItem value="NEPURIX">Nepurix Billing</SelectItem>
                                <SelectItem value="TSHUL">Tshul Billing</SelectItem>
                                <SelectItem value="AAKASHSMS">Aakash SMS</SelectItem>
                                <SelectItem value="SPARROWSMS">Sparrow SMS</SelectItem>
                                <SelectItem value="ESEWA">eSewa Payments</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setStatusFilter(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[140px] bg-white border-gray-200">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200/60 rounded-lg bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50/70 text-gray-600 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-left">Timestamp</th>
                                <th className="px-4 py-3 text-left">Service</th>
                                <th className="px-4 py-3 text-left">Operation / Path</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Message</th>
                                <th className="px-4 py-3 text-center w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="h-4 w-28 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-48 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-8 w-12 bg-gray-100 rounded mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No log entries found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <Badge
                                                variant="outline"
                                                className={`font-semibold text-xs py-0.5 px-2.5 rounded-full ${
                                                    log.serviceCode === "NETTV" ? "border-sky-300 text-sky-800 bg-sky-50" :
                                                    log.serviceCode === "NEPURIX" ? "border-amber-300 text-amber-800 bg-amber-50" :
                                                    log.serviceCode === "TSHUL" ? "border-purple-300 text-purple-800 bg-purple-50" :
                                                    log.serviceCode === "ESEWA" ? "border-emerald-300 text-emerald-800 bg-emerald-50" :
                                                    "border-indigo-300 text-indigo-800 bg-indigo-50"
                                                }`}
                                            >
                                                {log.serviceCode}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs max-w-[240px] truncate text-gray-700" title={log.operation}>
                                            {log.operation}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            {log.status === "success" ? (
                                                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                                    <XCircle className="h-3 w-3 mr-1 text-rose-600" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-gray-600 max-w-[300px] truncate" title={log.message || ""}>
                                            {log.message || <span className="text-gray-400 italic">None</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <Eye className="h-4 w-4 text-gray-500 hover:text-indigo-600" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                            Showing page {page} of {totalPages} ({totalLogs} total log entries)
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 bg-white"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="h-8 bg-white"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Inspect Payload Details Modal */}
            <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                            <Terminal className="h-5 w-5 text-indigo-500" />
                            Inspection payload - Log #{selectedLog?.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Captured at {selectedLog && new Date(selectedLog.createdAt).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border text-xs">
                                <div>
                                    <div className="text-gray-400 font-medium">SERVICE</div>
                                    <div className="font-bold text-gray-800 mt-0.5">{selectedLog.serviceCode}</div>
                                </div>
                                <div>
                                    <div className="text-gray-400 font-medium">OPERATION</div>
                                    <div className="font-bold text-gray-800 mt-0.5 truncate" title={selectedLog.operation}>
                                        {selectedLog.operation}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 font-medium">STATUS</div>
                                    <div className="mt-0.5">
                                        {selectedLog.status === "success" ? (
                                            <span className="text-emerald-600 font-bold">SUCCESS</span>
                                        ) : (
                                            <span className="text-rose-600 font-bold">FAILED</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 font-medium">DURATION</div>
                                    <div className="font-bold text-gray-800 mt-0.5">
                                        {selectedLog.duration ? `${selectedLog.duration} ms` : "N/A"}
                                    </div>
                                </div>
                            </div>

                            {selectedLog.message && (
                                <div className="p-3 bg-red-50/50 border border-red-200/80 rounded-lg text-xs text-red-800">
                                    <div className="font-semibold mb-1">Status Message / Failure Reason:</div>
                                    <div className="font-mono">{selectedLog.message}</div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Request & Response Payload JSON:</h4>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[350px] shadow-inner">
                                    {formatJson(selectedLog.data)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
