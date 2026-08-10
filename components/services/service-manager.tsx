// components/services/service-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Plus,
    Trash2,
    Save,
    X,
    AlertCircle,
    Upload,
    Download,
    Copy,
    Info
} from "lucide-react";
import { ISPService } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { toast } from "react-hot-toast";

interface ServiceManagerProps {
    service?: ISPService;
    mode: 'add' | 'edit' | 'view';
    onSuccess?: () => void;
    onCancel?: () => void;
}

// REAL CONFIGURATIONS FOR ALL SERVICES - FIXED JSON
const defaultServiceTemplates = {
    GEMINI: {
        baseUrl: "https://generativelanguage.googleapis.com",
        apiVersion: "v1beta",
        config: JSON.stringify({
            provider: "google",
            model: "gemini-2.5-flash",
            temperature: 0.4,
            timeout: 60000,
            defaultCredentials: { api_key: "" }
        }, null, 2)
    },
    OPENAI: {
        baseUrl: "https://api.openai.com",
        apiVersion: "v1",
        config: JSON.stringify({ provider: "openai", model: "gpt-5-mini", defaultCredentials: { api_key: "" } }, null, 2)
    },
    ANTHROPIC: {
        baseUrl: "https://api.anthropic.com",
        apiVersion: "v1",
        config: JSON.stringify({ provider: "anthropic", model: "claude-sonnet", defaultCredentials: { api_key: "" } }, null, 2)
    },
    TSHUL: {
        baseUrl: "https://kisan-net.tshul.app/api",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 30000,
            retryAttempts: 3,
            demoCredentials: {
                username: "",
                password: ""
            }
        }, null, 2)
    },
    NEPURIX: {
        baseUrl: "https://your-nepurix-host.example",
        apiVersion: "v1",
        config: JSON.stringify({ isDefault: true, timeout: 30000, retryAttempts: 3 }, null, 2)
    },
    RADIUS: {
        baseUrl: "http://10.3.2.6:3005/api",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 10000,
            secret: "",
            defaultCredentials: {
                username: "",
                password: ""
            }
        }, null, 2)
    },
    YEASTAR: {
        baseUrl: "http://10.3.2.50",
        apiVersion: "v2.0.0",
        config: JSON.stringify({
            tcp_port: 8333,
            api_port: 80,
            version: "2.0.0",
            defaultCredentials: {
                pbx_ip: "",
                username: "",
                password: ""
            }
        }, null, 2)
    },
    ASTERISK: {
        baseUrl: "http://10.3.2.51",
        apiVersion: "v1",
        config: JSON.stringify({
            ami_port: 5038,
            ari_port: 8088,
            ari_app_name: "kisan",
            defaultCredentials: {
                ami_host: "",
                ami_port: "",
                ami_username: "",
                ami_password: "",
                ari_host: "",
                ari_port: "",
                ari_username: "",
                ari_password: "",
                ari_app_name: ""
            }
        }, null, 2)
    },
    NETTV: {
        baseUrl: "https://resources.geniustv.dev.geniussystems.com.np",
        apiVersion: "v1",
        config: JSON.stringify({
            timeout: 60000,
            retry: 3,
            defaultCredentials: {
                api_key: "",
                api_secret: "",
                app_key: "",
                app_secret: ""
            }
        }, null, 2)
    },
    MIKROTIK: {
        baseUrl: "http://10.1.5.2",
        apiVersion: "v1",
        config: JSON.stringify({
            port: 8728,
            use_ssl: false,
            timeout: 5000,
            defaultCredentials: {
                username: "bipin",
                password: "bipin"
            }
        }, null, 2)
    },
    ESEWA: {
        baseUrl: "https://rc-epay.esewa.com.np",
        apiVersion: "v1",
        config: JSON.stringify({
            integrationMode: "TOKEN_BASED",
            environment: "uat",
            tokenEnabled: true,
            epayEnabled: true,
            productCode: "EPAYTEST",
            epaySecretKey: "8gBm/:&EnhH.1/q",
            timeout: 30000
        }, null, 2)
    },
    KHALTI: {
        baseUrl: "https://khalti.com/api/v2",
        apiVersion: "v2",
        config: JSON.stringify({
            environment: "test",
            timeout: 30000
        }, null, 2)
    }
};

export function ServiceManager({ service, mode, onSuccess, onCancel }: ServiceManagerProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        serviceCode: service?.service.code || "",
        baseUrl: service?.baseUrl || "",
        apiVersion: service?.apiVersion || "v1",
        isActive: service?.isActive ?? true,
        config: service?.config ? (typeof service.config === 'string' ? service.config : JSON.stringify(service.config, null, 2)) : "{}",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.serviceCode) {
            newErrors.serviceCode = "Service code is required";
        }

        if (!formData.baseUrl && mode !== 'add') {
            newErrors.baseUrl = "Base URL is required for configuration";
        }

        try {
            JSON.parse(formData.config || "{}");
        } catch (error) {
            newErrors.config = "Invalid JSON configuration";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTemplateSelect = (serviceCode: string) => {
        const template = defaultServiceTemplates[serviceCode as keyof typeof defaultServiceTemplates];
        if (template) {
            setFormData(prev => ({
                ...prev,
                serviceCode,
                baseUrl: template.baseUrl || "",
                apiVersion: template.apiVersion,
                config: template.config || "{}"
            }));

            toast.success(`${serviceCode} template loaded`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        try {
            setLoading(true);

            let config;
            try {
                config = JSON.parse(formData.config);
            } catch (error) {
                config = {};
            }

            if (mode === 'add') {
                // Create new service configuration
                const response = await ServicesAPI.configureService({
                    serviceCode: formData.serviceCode,
                    baseUrl: formData.baseUrl || undefined,
                    apiVersion: formData.apiVersion,
                    config: config,
                    isActive: formData.isActive,
                });

                if (response.success) {
                    toast.success("Service added successfully");
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    toast.error((response as any).error || "Failed to add service");
                }
            } else {
                // Update existing service
                const response = await ServicesAPI.configureService({
                    serviceCode: formData.serviceCode,
                    baseUrl: formData.baseUrl || undefined,
                    apiVersion: formData.apiVersion,
                    config: config,
                    isActive: formData.isActive,
                });

                if (response.success) {
                    toast.success("Service updated successfully");
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    toast.error((response as any).error || "Failed to update service");
                }
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save service");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!service || !confirm("Are you sure you want to deactivate this service?")) {
            return;
        }

        try {
            setLoading(true);
            const response = await ServicesAPI.toggleServiceActivation(service.service.code, false);

            if (response.success) {
                toast.success("Service deactivated successfully");
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error((response as any).error || "Failed to deactivate service");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete service");
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = () => {
        const newCode = `${formData.serviceCode}_COPY`;
        setFormData(prev => ({
            ...prev,
            serviceCode: newCode,
        }));
        toast.success("Service duplicated. Please review and save.");
    };

    const handleExport = () => {
        const exportData = {
            service: formData,
            timestamp: new Date().toISOString(),
            version: "1.0.0"
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service-${formData.serviceCode}-config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Configuration exported successfully");
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (data.service) {
                    setFormData(prev => ({
                        ...prev,
                        ...data.service,
                        config: typeof data.service.config === 'string'
                            ? data.service.config
                            : JSON.stringify(data.service.config || {}, null, 2)
                    }));
                    toast.success("Configuration imported successfully");
                }
            } catch (error) {
                toast.error("Failed to parse configuration file");
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    };

    const selectedTemplate = defaultServiceTemplates[formData.serviceCode as keyof typeof defaultServiceTemplates];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>
                            {mode === 'add' ? 'Add New Service' : mode === 'edit' ? 'Edit Service' : 'Service Details'}
                        </CardTitle>
                        <CardDescription>
                            {mode === 'add'
                                ? 'Configure a new service integration'
                                : mode === 'edit'
                                    ? 'Update service configuration'
                                    : 'View service configuration'}
                        </CardDescription>
                    </div>

                    {mode !== 'view' && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={loading}
                            >
                                <Download className="h-3 w-3 mr-2" />
                                Export
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDuplicate}
                                disabled={loading}
                            >
                                <Copy className="h-3 w-3 mr-2" />
                                Duplicate
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    {mode === 'add' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Start by selecting a service template or enter custom configuration
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Quick Templates */}
                    {mode === 'add' && (
                        <div className="space-y-3">
                            <Label>Quick Templates</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(defaultServiceTemplates).map((serviceCode) => (
                                    <Badge
                                        key={serviceCode}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-gray-100 px-3 py-1"
                                        onClick={() => handleTemplateSelect(serviceCode)}
                                    >
                                        {serviceCode}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                Click on a service code to load pre-configured settings
                            </p>
                        </div>
                    )}

                    {/* Service Information */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="serviceCode">
                                    Service Code *
                                    {mode === 'add' && (
                                        <span className="text-xs text-gray-500 ml-2">(e.g., TSHUL, NETTV, YEASTAR)</span>
                                    )}
                                </Label>
                                <Input
                                    id="serviceCode"
                                    value={formData.serviceCode}
                                    onChange={(e) => handleInputChange("serviceCode", e.target.value.toUpperCase())}
                                    placeholder="TSHUL"
                                    disabled={mode === 'edit' || mode === 'view'}
                                    className={errors.serviceCode ? "border-red-500" : ""}
                                />
                                {errors.serviceCode && (
                                    <p className="text-xs text-red-500">{errors.serviceCode}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseUrl">
                                    Base URL {mode !== 'add' && '*'}
                                </Label>
                                <Input
                                    id="baseUrl"
                                    value={formData.baseUrl}
                                    onChange={(e) => handleInputChange("baseUrl", e.target.value)}
                                    placeholder="https://api.example.com"
                                    disabled={mode === 'view'}
                                    className={errors.baseUrl ? "border-red-500" : ""}
                                />
                                {errors.baseUrl && (
                                    <p className="text-xs text-red-500">{errors.baseUrl}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    The base URL for API requests (required for configuration)
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="apiVersion">API Version</Label>
                                    <Input
                                        id="apiVersion"
                                        value={formData.apiVersion}
                                        onChange={(e) => handleInputChange("apiVersion", e.target.value)}
                                        placeholder="v1"
                                        disabled={mode === 'view'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="config">Configuration (JSON)</Label>
                                    <Textarea
                                        id="config"
                                        value={formData.config}
                                        onChange={(e) => handleInputChange("config", e.target.value)}
                                        placeholder='{"timeout": 30000, "retryAttempts": 3}'
                                        rows={4}
                                        className={`font-mono text-sm ${errors.config ? "border-red-500" : ""}`}
                                        disabled={mode === 'view'}
                                    />
                                    {errors.config && (
                                        <p className="text-xs text-red-500">{errors.config}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Template Info */}
                    {selectedTemplate && mode === 'add' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-green-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-green-800 mb-1">
                                        {formData.serviceCode} Template Loaded
                                    </h4>
                                    <p className="text-xs text-green-700">
                                        Base URL: <code className="bg-green-100 px-1 rounded">{selectedTemplate.baseUrl}</code>
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Check default credentials in the config section. You'll need to add credentials after saving.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Controls */}
                    {mode !== 'view' && (
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold">Status & Activation</h3>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive">Active Status</Label>
                                    <p className="text-xs text-gray-500">
                                        Enable or disable the service
                                    </p>
                                </div>
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Import Configuration */}
                    {mode === 'add' && (
                        <div className="space-y-2">
                            <Label>Import Configuration</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 mb-2">
                                    Drag & drop a configuration file or click to browse
                                </p>
                                <Input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="hidden"
                                    id="import-config"
                                />
                                <Label
                                    htmlFor="import-config"
                                    className="cursor-pointer inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                                >
                                    Browse Files
                                </Label>
                                <p className="text-xs text-gray-500 mt-2">
                                    JSON format only. File should contain service configuration.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-6">
                    <div>
                        {mode === 'edit' && service && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate Service
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        )}

                        {mode !== 'view' && (
                            <Button type="submit" disabled={loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? "Saving..." : mode === 'add' ? "Add Service" : "Save Changes"}
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
