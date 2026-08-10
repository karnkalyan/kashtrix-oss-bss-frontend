// components/services/service-catalog.tsx - FIXED VERSION
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, Phone, Smartphone, Settings, CheckCircle, XCircle, CreditCard, Bot } from "lucide-react";
import { ISPService, Service, ServiceCategory } from "@/types/service.types";
import { ServicesAPI } from "@/lib/api/service";
import { ServiceCatalogCard } from "./service-catalog-card";
import { ServiceConfigureDialog } from "./service-configure-dialog";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const categories: (ServiceCategory | 'ALL')[] = [
    'ALL',
    'BILLING',
    'AUTHENTICATION',
    'PAYMENT',
    'STREAMING',
    'NETWORK',
    'VOIP',
    'SECURITY',
    'COMMUNICATION',
    'ACS',
    'OTHER'
];

const SMS_PROVIDER_CODES = ["AAKASHSMS", "SPARROWSMS"];
const VOIP_PROVIDER_CODES = ["YEASTAR", "ASTERISK"];
const BILLING_PROVIDER_CODES = ["TSHUL", "NEPURIX"];
const AI_PROVIDER_CODES = ["GEMINI", "OPENAI", "ANTHROPIC"];
const GROUPED_PROVIDER_CODES = [...SMS_PROVIDER_CODES, ...VOIP_PROVIDER_CODES, ...BILLING_PROVIDER_CODES, ...AI_PROVIDER_CODES, "SMS_GATEWAY"];

const defaultProviderTemplates: Record<string, { baseUrl: string; apiVersion: string; config: Record<string, any> }> = {
    GEMINI: { baseUrl: "https://generativelanguage.googleapis.com", apiVersion: "v1beta", config: { provider: "google", model: "gemini-2.5-flash", temperature: 0.4, defaultCredentials: { api_key: "" } } },
    OPENAI: { baseUrl: "https://api.openai.com", apiVersion: "v1", config: { provider: "openai", model: "gpt-5-mini", defaultCredentials: { api_key: "" } } },
    ANTHROPIC: { baseUrl: "https://api.anthropic.com", apiVersion: "v1", config: { provider: "anthropic", model: "claude-sonnet", defaultCredentials: { api_key: "" } } },
    AAKASHSMS: {
        baseUrl: "https://sms.aakashsms.com",
        apiVersion: "v4",
        config: {
            timeout: 30000,
            defaultCredentials: {
                auth_token: "",
                sender_id: ""
            }
        }
    },
    SPARROWSMS: {
        baseUrl: "http://api.sparrowsms.com/v2",
        apiVersion: "v2",
        config: {
            timeout: 30000,
            defaultCredentials: {
                auth_token: "",
                sender_id: ""
            }
        }
    },
    YEASTAR: {
        baseUrl: "http://10.3.2.50",
        apiVersion: "v2.0.0",
        config: {
            tcp_port: 8333,
            api_port: 80,
            version: "2.0.0",
            defaultCredentials: {
                pbx_ip: "",
                username: "",
                password: ""
            }
        }
    },
    ASTERISK: {
        baseUrl: "http://10.3.2.51",
        apiVersion: "v1",
        config: {
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
        }
    },
    TSHUL: { baseUrl: "", apiVersion: "v1", config: { isDefault: true, timeout: 30000, retryAttempts: 3 } },
    NEPURIX: { baseUrl: "", apiVersion: "v1", config: { isDefault: true, timeout: 30000, retryAttempts: 3 } }
};

type ServiceProviderGroup = {
    key: string;
    title: string;
    description: string;
    category: ServiceCategory;
    codes: string[];
    icon: ReactNode;
};

const providerGroups: ServiceProviderGroup[] = [
    {
        key: "ai-provider",
        title: "AI & Automation Provider",
        description: "Choose the model provider used by AI agents and automated operations. Credentials are stored separately and encrypted.",
        category: "OTHER",
        codes: AI_PROVIDER_CODES,
        icon: <Bot className="h-5 w-5" />
    },
    {
        key: "sms-gateway",
        title: "SMS Gateway",
        description: "Configure Aakash SMS or Sparrow SMS as the default SMS provider.",
        category: "COMMUNICATION",
        codes: SMS_PROVIDER_CODES,
        icon: <Smartphone className="h-5 w-5" />
    },
    {
        key: "voip-provider",
        title: "VoIP Provider",
        description: "Configure Yeastar or Asterisk as the default VoIP provider.",
        category: "VOIP",
        codes: VOIP_PROVIDER_CODES,
        icon: <Phone className="h-5 w-5" />
    },
    {
        key: "billing-provider",
        title: "Accounting Provider",
        description: "Configure Tshul or Nepurix as the default accounting and billing provider.",
        category: "BILLING",
        codes: BILLING_PROVIDER_CODES,
        icon: <CreditCard className="h-5 w-5" />
    }
];

function CatalogProviderGroupCard({
    group,
    providers,
    configuredServices,
    onConfigured
}: {
    group: ServiceProviderGroup;
    providers: Service[];
    configuredServices: ISPService[];
    onConfigured: () => void;
}) {
    const router = useRouter();
    const [selectedProvider, setSelectedProvider] = useState<Service | null>(null);
    const [selectedConfiguredService, setSelectedConfiguredService] = useState<ISPService | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const getConfiguredService = (provider: Service) =>
        configuredServices.find((service) => service.service.code === provider.code);

    const isDefaultProvider = (service?: ISPService) =>
        Boolean(service?.config && typeof service.config === "object" && service.config.isDefault === true);

    const handleConfigure = (provider: Service) => {
        setSelectedProvider(provider);
        setSelectedConfiguredService(getConfiguredService(provider) || null);
    };

    const handleSetDefault = async (provider: Service, providerService?: ISPService) => {
        try {
            setActionLoading(provider.code);
            const template = defaultProviderTemplates[provider.code] || {
                baseUrl: "",
                apiVersion: "v1",
                config: {}
            };
            const currentConfig =
                providerService?.config && typeof providerService.config === "object" ? providerService.config : template.config;

            const response = await ServicesAPI.configureService({
                serviceCode: provider.code,
                baseUrl: providerService?.baseUrl || template.baseUrl || undefined,
                apiVersion: providerService?.apiVersion || template.apiVersion,
                config: { ...currentConfig, isDefault: true },
                isActive: providerService?.isActive ?? true
            });

            if (response.success) {
                toast.success(`${provider.name} set as default`);
                onConfigured();
            } else {
                toast.error((response as any).error || "Failed to set default provider");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to set default provider");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-cyan-100 text-cyan-800 border border-cyan-200">
                                {group.icon}
                            </div>
                            <div>
                                <CardTitle>{group.title}</CardTitle>
                                <CardDescription className="mt-1 line-clamp-2">{group.description}</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {group.category}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {providers.map((provider) => {
                        const configuredService = getConfiguredService(provider);
                        const isConfigured = Boolean(configuredService);
                        const isDefault = isDefaultProvider(configuredService);

                        return (
                            <div key={provider.id} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-sm">{provider.name}</h3>
                                            {provider.isActive ? (
                                                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Inactive
                                                </Badge>
                                            )}
                                            {isConfigured && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Configured
                                                </Badge>
                                            )}
                                            {isDefault && <Badge className="text-xs">Default</Badge>}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{provider.description}</p>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="font-mono">{provider.code}</span>
                                            {configuredService && (
                                                <>
                                                    <span>API: {configuredService.apiVersion || "v1"}</span>
                                                    <span>Credentials: {configuredService.credentialCount}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-2">
                                        {(provider.code === "TSHUL" || provider.code === "NEPURIX") && configuredService && (
                                            <Button size="sm" onClick={() => router.push(provider.code === "TSHUL" ? "/tshul" : "/nepurix")}>
                                                Dashboard
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => handleConfigure(provider)}>
                                            <Settings className="h-3.5 w-3.5 mr-1" />
                                            Configure
                                        </Button>
                                        {!isDefault && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleSetDefault(provider, configuredService)}
                                                disabled={actionLoading === provider.code}
                                            >
                                                Set Default
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {selectedProvider && (
                <ServiceConfigureDialog
                    service={
                        selectedConfiguredService || {
                            id: 0,
                            ispId: 0,
                            serviceId: selectedProvider.id,
                            isActive: false,
                            isEnabled: true,
                            isDeleted: false,
                            baseUrl: "",
                            apiVersion: "v1",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            service: selectedProvider,
                            credentials: [],
                            credentialCount: 0
                        }
                    }
                    open={!!selectedProvider}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedProvider(null);
                            setSelectedConfiguredService(null);
                        }
                    }}
                    onSuccess={() => {
                        setSelectedProvider(null);
                        setSelectedConfiguredService(null);
                        onConfigured();
                    }}
                />
            )}
        </>
    );
}

export function ServiceCatalog() {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [configuredServices, setConfiguredServices] = useState<ISPService[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'ALL'>('ALL');

    const fetchServices = async () => {
        try {
            setLoading(true);
            const filters: any = {};

            if (selectedCategory !== 'ALL') {
                filters.category = selectedCategory;
            }

            if (searchQuery) {
                filters.search = searchQuery;
            }

            const [response, configuredResponse] = await Promise.all([
                ServicesAPI.getServicesCatalog(filters),
                ServicesAPI.getISPServices(true).catch(() => null)
            ]);

            if (response.success) {
                setServices(response.data);
            } else {
                toast.error("Failed to load services catalog");
            }

            if (configuredResponse?.success) {
                setConfiguredServices(configuredResponse.data || []);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load services catalog");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [selectedCategory]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchServices();
    };

    const searchText = searchQuery.trim().toLowerCase();

    const serviceMatchesSearch = (service: Service) =>
        !searchText ||
        service.name.toLowerCase().includes(searchText) ||
        service.code.toLowerCase().includes(searchText) ||
        (service.description || "").toLowerCase().includes(searchText);

    const standaloneServices = services.filter((service) => !GROUPED_PROVIDER_CODES.includes(service.code));

    const filteredServices = standaloneServices.filter(
        (service) =>
            (selectedCategory === 'ALL' || service.category === selectedCategory) &&
            serviceMatchesSearch(service)
    );

    const visibleProviderGroups = providerGroups
        .map((group) => {
            const providers = services.filter((service) => group.codes.includes(service.code));
            const groupMatchesSearch =
                !searchText ||
                group.title.toLowerCase().includes(searchText) ||
                group.description.toLowerCase().includes(searchText) ||
                providers.some(serviceMatchesSearch);

            return {
                group,
                providers: providers.filter((provider) => !searchText || serviceMatchesSearch(provider) || groupMatchesSearch),
                visible:
                    providers.length > 0 &&
                    groupMatchesSearch &&
                    (selectedCategory === 'ALL' || selectedCategory === group.category)
            };
        })
        .filter((item) => item.visible);

    const getCategoryCount = (category: ServiceCategory) => {
        const groupedCount = providerGroups.filter((group) => group.category === category && services.some((service) => group.codes.includes(service.code))).length;
        const standaloneCount = standaloneServices.filter(s => s.category === category).length;
        return groupedCount + standaloneCount;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-40 rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Service Catalog</CardTitle>
                <CardDescription>
                    Browse available services to integrate with your ISP
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search services..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">
                            <Filter className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/services/add')}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                        </Button>
                    </form>

                    {/* Category Tabs */}
                    <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                        <TabsList className="flex-wrap h-auto">
                            {categories.map((category) => (
                                <TabsTrigger key={category} value={category} className="relative">
                                    {category === 'ALL' ? 'All' : category}
                                    {category !== 'ALL' && (
                                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                                            {getCategoryCount(category as ServiceCategory)}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Services Grid */}
                {filteredServices.length === 0 && visibleProviderGroups.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No services found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery
                                ? `No services match "${searchQuery}"`
                                : "No services available in this category"}
                        </p>
                        <div className="flex gap-2 justify-center">
                            {searchQuery && (
                                <Button variant="outline" onClick={() => setSearchQuery("")}>
                                    Clear Search
                                </Button>
                            )}
                            <Button onClick={() => router.push('/services/add')}>
                                Browse All Services
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {visibleProviderGroups.map(({ group, providers }) => (
                            <CatalogProviderGroupCard
                                key={group.key}
                                group={group}
                                providers={providers}
                                configuredServices={configuredServices}
                                onConfigured={fetchServices}
                            />
                        ))}
                        {filteredServices.map((service) => (
                            <ServiceCatalogCard key={service.id} service={service} />
                        ))}
                    </div>
                )}

                {/* Statistics */}
                <div className="mt-8 pt-6 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {standaloneServices.length + providerGroups.filter(group => services.some(service => group.codes.includes(service.code))).length}
                            </div>
                            <div className="text-sm text-gray-500">Catalog Items</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {services.filter(s => s.isActive).length}
                            </div>
                            <div className="text-sm text-gray-500">Active Services</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {Array.from(new Set(services.map(s => s.category))).length}
                            </div>
                            <div className="text-sm text-gray-500">Categories</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">
                                {services.reduce((acc, s) => acc + (s._count?.ispServices || 0), 0)}
                            </div>
                            <div className="text-sm text-gray-500">Total Integrations</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
