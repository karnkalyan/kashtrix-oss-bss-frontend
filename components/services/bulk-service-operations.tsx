// components/services/bulk-service-operations.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    Download,
    Trash2,
    Power,
    RefreshCw,
    Settings,
    CheckCircle,
    XCircle,
    AlertCircle,
    Package
} from "lucide-react";
import { ISPService } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

interface BulkServiceOperationsProps {
    services: ISPService[];
    onUpdate: () => void;
}

export function BulkServiceOperations({ services, onUpdate }: BulkServiceOperationsProps) {
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentOperation, setCurrentOperation] = useState<string>("");

    const toggleSelectAll = () => {
        if (selectedServices.length === services.length) {
            setSelectedServices([]);
        } else {
            setSelectedServices(services.map(s => s.id.toString()));
        }
    };

    const toggleSelectService = (id: string) => {
        if (selectedServices.includes(id)) {
            setSelectedServices(selectedServices.filter(serviceId => serviceId !== id));
        } else {
            setSelectedServices([...selectedServices, id]);
        }
    };

    const handleBulkActivation = async (activate: boolean) => {
        if (selectedServices.length === 0) {
            toast.error("Please select at least one service");
            return;
        }

        if (!confirm(`Are you sure you want to ${activate ? 'activate' : 'deactivate'} ${selectedServices.length} services?`)) {
            return;
        }

        try {
            setLoading(true);
            setCurrentOperation(activate ? "Activating services..." : "Deactivating services...");
            setProgress(0);

            const selected = services.filter(s => selectedServices.includes(s.id.toString()));

            for (let i = 0; i < selected.length; i++) {
                const service = selected[i];
                try {
                    await ServicesAPI.toggleServiceActivation(service.service.code, activate);
                } catch (error) {
                    console.error(`Failed to update ${service.service.name}:`, error);
                }

                setProgress(((i + 1) / selected.length) * 100);
            }

            toast.success(`${activate ? 'Activated' : 'Deactivated'} ${selected.length} services`);
            onUpdate();
            setSelectedServices([]);
        } catch (error: any) {
            toast.error(error.message || "Bulk operation failed");
        } finally {
            setLoading(false);
            setCurrentOperation("");
            setProgress(0);
        }
    };

    const handleBulkTest = async () => {
        if (selectedServices.length === 0) {
            toast.error("Please select at least one service");
            return;
        }

        try {
            setLoading(true);
            setCurrentOperation("Testing connections...");
            setProgress(0);

            const selected = services.filter(s => selectedServices.includes(s.id.toString()));
            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            for (let i = 0; i < selected.length; i++) {
                const service = selected[i];
                try {
                    const result = await ServicesAPI.testServiceConnection(service.service.code);
                    if (result.connected) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`${service.service.name}: ${result.message}`);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`${service.service.name}: Test failed`);
                }

                setProgress(((i + 1) / selected.length) * 100);
            }

            if (results.failed === 0) {
                toast.success(`All ${results.success} services are connected successfully`);
            } else if (results.success === 0) {
                toast.error(`All ${results.failed} services failed connection tests`);
            } else {
                toast.success(`${results.success} services connected, ${results.failed} failed`);
            }

            // Show errors if any
            if (results.errors.length > 0) {
                console.error("Connection errors:", results.errors);
            }
        } catch (error: any) {
            toast.error(error.message || "Bulk test failed");
        } finally {
            setLoading(false);
            setCurrentOperation("");
            setProgress(0);
        }
    };

    const handleExportSelected = () => {
        if (selectedServices.length === 0) {
            toast.error("Please select at least one service");
            return;
        }

        const selected = services.filter(s => selectedServices.includes(s.id.toString()));
        const exportData = {
            services: selected.map(s => ({
                code: s.service.code,
                name: s.service.name,
                baseUrl: s.baseUrl,
                apiVersion: s.apiVersion,
                config: s.config,
                isActive: s.isActive,
                credentials: s.credentials.map(c => ({
                    key: c.key,
                    label: c.label,
                    credentialType: c.credentialType,
                    isEncrypted: c.isEncrypted
                    // Note: We don't export actual credential values for security
                }))
            })),
            exportDate: new Date().toISOString(),
            count: selected.length
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `services-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`Exported ${selected.length} services`);
    };

    const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);

                if (!data.services || !Array.isArray(data.services)) {
                    throw new Error("Invalid import file format");
                }

                if (!confirm(`Import ${data.services.length} services? This will create new service configurations.`)) {
                    return;
                }

                setLoading(true);
                setCurrentOperation("Importing services...");
                setProgress(0);

                let successCount = 0;
                let errorCount = 0;

                for (let i = 0; i < data.services.length; i++) {
                    const service = data.services[i];
                    try {
                        await ServicesAPI.configureService({
                            serviceCode: service.code,
                            baseUrl: service.baseUrl,
                            apiVersion: service.apiVersion,
                            config: service.config,
                            isActive: service.isActive
                        });
                        successCount++;
                    } catch (error) {
                        errorCount++;
                        console.error(`Failed to import ${service.name}:`, error);
                    }

                    setProgress(((i + 1) / data.services.length) * 100);
                }

                toast.success(`Imported ${successCount} services, ${errorCount} failed`);
                onUpdate();
            } catch (error) {
                toast.error("Failed to parse import file");
            } finally {
                setLoading(false);
                setCurrentOperation("");
                setProgress(0);
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const getSelectedStats = () => {
        const selected = services.filter(s => selectedServices.includes(s.id.toString()));
        return {
            count: selected.length,
            active: selected.filter(s => s.isActive).length,
            configured: selected.filter(s => !!s.baseUrl).length,
            withCredentials: selected.filter(s => s.credentialCount > 0).length
        };
    };

    const stats = getSelectedStats();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bulk Operations</CardTitle>
                <CardDescription>
                    Manage multiple services at once
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Selection Summary */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={selectedServices.length === services.length && services.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                    disabled={services.length === 0}
                                />
                                <span className="text-sm font-medium">
                                    {selectedServices.length === 0
                                        ? "Select all services"
                                        : `${selectedServices.length} of ${services.length} selected`}
                                </span>
                            </div>

                            {selectedServices.length > 0 && (
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {stats.active} Active
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {stats.configured} Configured
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        {stats.withCredentials} With Credentials
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {selectedServices.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedServices([])}
                                disabled={loading}
                            >
                                Clear Selection
                            </Button>
                        )}
                    </div>

                    {/* Selected Services List */}
                    {selectedServices.length > 0 && (
                        <ScrollArea className="h-40 border rounded-md p-2">
                            <div className="space-y-2">
                                {services
                                    .filter(s => selectedServices.includes(s.id.toString()))
                                    .map(service => (
                                        <div
                                            key={service.id}
                                            className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={true}
                                                    onCheckedChange={() => toggleSelectService(service.id.toString())}
                                                />
                                                <div>
                                                    <div className="font-medium text-sm">{service.service.name}</div>
                                                    <div className="text-xs text-gray-500">{service.service.code}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {service.isActive ? (
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-gray-400" />
                                                )}
                                                {service.baseUrl ? (
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                {/* Bulk Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-24 gap-2"
                        onClick={() => handleBulkActivation(true)}
                        disabled={loading || selectedServices.length === 0}
                    >
                        <Power className="h-5 w-5 text-green-500" />
                        <span>Activate</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-24 gap-2"
                        onClick={() => handleBulkActivation(false)}
                        disabled={loading || selectedServices.length === 0}
                    >
                        <Power className="h-5 w-5 text-red-500" />
                        <span>Deactivate</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-24 gap-2"
                        onClick={handleBulkTest}
                        disabled={loading || selectedServices.length === 0}
                    >
                        <RefreshCw className="h-5 w-5 text-blue-500" />
                        <span>Test All</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-24 gap-2"
                        onClick={handleExportSelected}
                        disabled={loading || selectedServices.length === 0}
                    >
                        <Download className="h-5 w-5 text-purple-500" />
                        <span>Export</span>
                    </Button>
                </div>

                {/* Import Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Import Services</h4>
                            <p className="text-sm text-gray-500">Import services from JSON file</p>
                        </div>
                        <div>
                            <Input
                                type="file"
                                accept=".json"
                                onChange={handleImportFromFile}
                                className="hidden"
                                id="import-services"
                                disabled={loading}
                            />
                            <Label htmlFor="import-services" className="cursor-pointer">
                                <Button variant="outline" asChild>
                                    <span>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </span>
                                </Button>
                            </Label>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium">Import Format</p>
                                <p className="text-xs text-gray-500">
                                    JSON file containing an array of service configurations
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                {loading && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{currentOperation}</span>
                            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold">{services.length}</div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {services.filter(s => s.isActive).length}
                        </div>
                        <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                            {services.filter(s => !!s.baseUrl).length}
                        </div>
                        <div className="text-xs text-gray-500">Configured</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {services.filter(s => s.credentialCount > 0).length}
                        </div>
                        <div className="text-xs text-gray-500">Has Credentials</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}