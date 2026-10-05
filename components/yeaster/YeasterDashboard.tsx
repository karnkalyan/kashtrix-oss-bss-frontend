"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Phone, Users, BarChart3, RefreshCw, Activity, Wifi, Clock, Server, Cpu, WifiIcon, Settings, Trash2, RadioIcon } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useWebSocket } from "@/contexts/WebSocketContext"
import MakeCallModal from "./MakeCallModal"
import ExtensionsList from "./ExtensionsList"
import TrunksList from "./TrunksList"
import CallLogsTable from "./CallLogsTable"
import ActiveCalls from "./ActiveCalls"
import CallDashboard from "./CallDashboard"
import AddExtensionModal from "./AddExtensionModal"
import AddTrunkModal from "./AddTrunkModal"

interface YeastarStatus {
    configured: boolean
    isActive: boolean
    listenerActive: boolean
    apiConnected: boolean
    pbxIp?: string
    uptime?: number
    lastUpdated: string
    error?: string
    success?: boolean
}

interface SystemInfo {
    version: string
    uptime: number
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkStatus: string
    activeCalls: number
    totalExtensions: number
    totalTrunks: number
    lastBackup: string
    securityLevel: string
    data?: any
}

interface YeastarDashboardProps {
    ispId: number
    makeCallModalOpen: boolean
    onMakeCallModalChange: (open: boolean) => void
}

export default function YeastarDashboard({
    ispId,
    makeCallModalOpen,
    onMakeCallModalChange
}: YeastarDashboardProps) {
    const [status, setStatus] = useState<YeastarStatus | null>(null)
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [systemLoading, setSystemLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("extensions")
    const [apiError, setApiError] = useState<string | null>(null)
    const [isListenerStarting, setIsListenerStarting] = useState(false)
    const [isListenerStopping, setIsListenerStopping] = useState(false)
    const [serverDown, setServerDown] = useState(false)

    // Refs to track state changes
    const hasSetUpListeners = useRef(false)
    const pendingCommands = useRef<Array<{ command: string, data: any }>>([])

    // Use WebSocket context
    const {
        isConnected: webSocketConnected,
        isAuthenticated: webSocketAuthenticated,
        connectionStatus,
        subscribe,
        unsubscribe,
        sendCommand,
        on,
        off,
        isConnecting: webSocketConnecting
    } = useWebSocket()

    // Fetch initial data - independent of WebSocket
    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true)
            setApiError(null)
            console.log('🔄 Fetching Yeastar status for ISP:', ispId)

            const data = await apiRequest<YeastarStatus>('/yeaster/status', { suppressToast: true })
            console.log('✅ Status response:', data)
            setStatus(data)
            setServerDown(false)

            if (data.error && data.configured) {
                toast.error(data.error)
            }
        } catch (error: any) {
            console.error("❌ Error fetching Yeastar status:", error)
            setApiError(error.message)
            setServerDown(true)

            // Show specific message for server down
            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                toast.error("Backend server is not running. Please start the server on port 3200.")
            } else if (!error.message.includes('configured') && !error.message.includes('not found')) {
                toast.error("Failed to fetch Yeastar status")
            }
        } finally {
            setLoading(false)
        }
    }, [ispId])

    const fetchSystemInfo = useCallback(async () => {
        try {
            setSystemLoading(true)
            console.log('🔄 Fetching system info...')

            const data = await apiRequest<SystemInfo>('/yeaster/system/info', { suppressToast: true })
            console.log('✅ System info:', data)
            setSystemInfo(data)
            setServerDown(false)
        } catch (error: any) {
            console.error("❌ Error fetching system info:", error)
            setServerDown(true)
        } finally {
            setSystemLoading(false)
        }
    }, [])

    // Handle WebSocket commands with authentication check
    const sendAuthenticatedCommand = useCallback(async (command: string, data?: any) => {
        if (!webSocketAuthenticated) {
            console.log('⚠️ WebSocket not authenticated, queueing command:', command)
            pendingCommands.current.push({ command, data })
            toast.info("Waiting for WebSocket authentication...")
            return false
        }

        try {
            console.log(`📤 Sending WebSocket command: ${command}`, data)
            sendCommand(command, data)
            return true
        } catch (error) {
            console.error(`❌ Error sending command ${command}:`, error)
            toast.error(`Failed to send command: ${command}`)
            return false
        }
    }, [webSocketAuthenticated, sendCommand])

    // Process pending commands when authentication completes
    useEffect(() => {
        if (webSocketAuthenticated && pendingCommands.current.length > 0) {
            console.log('🔄 Processing pending commands:', pendingCommands.current.length)
            const commands = [...pendingCommands.current]
            pendingCommands.current = []

            commands.forEach(({ command, data }) => {
                sendCommand(command, data)
                console.log(`📤 Sent queued command: ${command}`)
            })
        }
    }, [webSocketAuthenticated, sendCommand])

    // WebSocket event handlers - only setup once
    useEffect(() => {
        // Don't setup if server is down
        if (serverDown) return;

        // Set up listeners only once
        if (hasSetUpListeners.current) {
            return
        }

        console.log('📡 Setting up WebSocket listeners for ISP:', ispId)

        // Define event handlers
        const handleWebSocketAuthenticated = (data: any) => {
            console.log('✅ WebSocket authenticated event received:', data);
            if (data.ispId === ispId || data.userId) {
                console.log('✅ WebSocket authenticated for this ISP');
                // Subscribe to topics when authenticated
                const ispRoom = `isp_${ispId}`;
                // Ensure all channels are valid strings
                const yeastarTopics = [
                    ispRoom,
                    'yeastar_calls',
                    'yeastar_extensions',
                    'yeastar_trunks',
                    'yeastar_monitoring'
                ].filter(ch => ch && typeof ch === 'string'); // Filter for safety

                if (yeastarTopics.length > 0) {
                    subscribe(yeastarTopics);
                    console.log('✅ Subscribed to topics on auth:', yeastarTopics);
                } else {
                    console.warn('⚠️ No valid topics to subscribe to');
                }
            }
        };


        const handleYeastarCallStart = (data: any) => {
            if (data.ispId === ispId) {
                toast.success(`Call started: ${data.from} → ${data.to}`)
            }
        }

        const handleYeastarCallEnd = (data: any) => {
            if (data.ispId === ispId) {
                console.log('Call ended:', data)
                fetchStatus()
            }
        }

        const handleYeastarExtensionUpdate = (data: any) => {
            if (data.ispId === ispId) {
                toast.success(`Extension ${data.extension} updated`)
                fetchStatus()
            }
        }

        const handleYeastarTrunkUpdate = (data: any) => {
            if (data.ispId === ispId) {
                toast.success(`Trunk ${data.trunkId} updated`)
                fetchStatus()
            }
        }

        const handleYeastarServiceUpdate = (data: any) => {
            if (data.ispId === ispId) {
                setStatus(prev => prev ? { ...prev, ...data } : data)
            }
        }

        const handleYeastarSystemStatus = (data: any) => {
            if (data.ispId === ispId) {
                setStatus(prev => prev ? {
                    ...prev,
                    ...data,
                    lastUpdated: new Date().toISOString()
                } : null)
            }
        }

        const handleYeastarListenerStarted = (data: any) => {
            if (data.ispId === ispId) {
                setStatus(prev => prev ? {
                    ...prev,
                    listenerActive: true,
                    lastUpdated: new Date().toISOString()
                } : null)
                setIsListenerStarting(false)
                toast.success('Listener started successfully')
                fetchStatus()
            }
        }

        const handleYeastarListenerStopped = (data: any) => {
            if (data.ispId === ispId) {
                setStatus(prev => prev ? {
                    ...prev,
                    listenerActive: false,
                    lastUpdated: new Date().toISOString()
                } : null)
                setIsListenerStopping(false)
                toast.info('Listener stopped')
                fetchStatus()
            }
        }

        const handleDataSynced = (data: any) => {
            if (data.ispId === ispId) {
                toast.success('Yeastar data synced successfully')
                fetchStatus()
            }
        }

        const handleCommandResponse = (data: any) => {
            console.log('📥 Command response:', data)
            if (data.success === false) {
                toast.error(data.message || 'Command failed')
            }
        }

        const handleWebSocketError = (data: any) => {
            console.error('❌ WebSocket error:', data)
            if (data.message?.includes('auth') || data.message?.includes('Auth') || data.code?.includes('AUTH')) {
                toast.error('Authentication failed. Please refresh the page.')
            } else if (data.message?.includes('server is not running')) {
                setServerDown(true)
                toast.error('Backend server is not running. Please start the server.')
            }
        }

        // Register event listeners
        const unsubscribeAuthenticated = on('authenticated', handleWebSocketAuthenticated)
        const unsubscribeCallStart = on('yeastar.call.start', handleYeastarCallStart)
        const unsubscribeCallEnd = on('yeastar.call.end', handleYeastarCallEnd)
        const unsubscribeExtensionUpdated = on('yeastar.extension.updated', handleYeastarExtensionUpdate)
        const unsubscribeTrunkUpdated = on('yeastar.trunk.updated', handleYeastarTrunkUpdate)
        const unsubscribeServiceAvailable = on('yeastar.service.available', handleYeastarServiceUpdate)
        const unsubscribeSystemStatus = on('yeastar.system.status.update', handleYeastarSystemStatus)
        const unsubscribeListenerStarted = on('yeastar.listener.started', handleYeastarListenerStarted)
        const unsubscribeListenerStopped = on('yeastar.listener.stopped', handleYeastarListenerStopped)
        const unsubscribeDataSynced = on('yeastar.data.synced', handleDataSynced)
        const unsubscribeCommandResponse = on('command.response', handleCommandResponse)
        const unsubscribeWebSocketError = on('error', handleWebSocketError)
        const unsubscribeSystemNotification = on('system.notification', (data) => {
            if (data.ispId === ispId) {
                toast[data.type || 'info'](data.message, {
                    duration: data.duration || 4000,
                })
            }
        })

        hasSetUpListeners.current = true

        return () => {
            console.log('🧹 Cleaning up WebSocket listeners')

            // Unsubscribe from all events
            unsubscribeAuthenticated()
            unsubscribeCallStart()
            unsubscribeCallEnd()
            unsubscribeExtensionUpdated()
            unsubscribeTrunkUpdated()
            unsubscribeServiceAvailable()
            unsubscribeSystemStatus()
            unsubscribeListenerStarted()
            unsubscribeListenerStopped()
            unsubscribeDataSynced()
            unsubscribeCommandResponse()
            unsubscribeWebSocketError()
            unsubscribeSystemNotification()

            hasSetUpListeners.current = false
        }
    }, [ispId, on, subscribe, fetchStatus, serverDown])

    // Fetch data on component mount - independent of WebSocket
    useEffect(() => {
        console.log('🎯 YeastarDashboard mounted, fetching data...')
        fetchStatus()
        fetchSystemInfo()

        // Test API connection
        const testApi = async () => {
            try {
                const result = await apiRequest('/yeaster/test-fix')
                console.log('✅ Test API success:', result)
            } catch (error) {
                console.error('❌ Test API failed:', error)
            }
        }
        testApi()
    }, [fetchStatus, fetchSystemInfo])

    const handleStartListener = async () => {
        if (serverDown) {
            toast.error('Server is not running. Please start the backend server first.')
            return
        }

        try {
            setIsListenerStarting(true)
            console.log('🚀 Starting listener...')
            const success = await sendAuthenticatedCommand('yeastar.listener.start')
            if (success) {
                console.log('✅ Start listener command sent')
                toast.success('Starting listener...')
            }
        } catch (error: any) {
            console.error('❌ Start listener error:', error)
            setIsListenerStarting(false)
            toast.error(error.message || "Failed to start listener")
        }
    }

    const handleStopListener = async () => {
        if (serverDown) {
            toast.error('Server is not running. Please start the backend server first.')
            return
        }

        try {
            setIsListenerStopping(true)
            console.log('🛑 Stopping listener...')
            const success = await sendAuthenticatedCommand('yeastar.listener.stop')
            if (success) {
                console.log('✅ Stop listener command sent')
                toast.success('Stopping listener...')
            }
        } catch (error: any) {
            console.error('❌ Stop listener error:', error)
            setIsListenerStopping(false)
            toast.error(error.message || "Failed to stop listener")
        }
    }

    const handleRefreshAll = async () => {
        try {
            console.log('🔄 Refreshing all data...')
            setLoading(true)
            setSystemLoading(true)

            await Promise.all([
                fetchStatus(),
                fetchSystemInfo()
            ])

            // Also refresh via WebSocket command if authenticated
            if (webSocketAuthenticated && !serverDown) {
                await sendAuthenticatedCommand('yeastar.data.refresh', { ispId })
            }

            toast.success("All data refreshed")
        } catch (error) {
            console.error('❌ Refresh error:', error)
            toast.error("Failed to refresh data")
        } finally {
            setLoading(false)
            setSystemLoading(false)
        }
    }

    const handleDeleteAllExtensions = async () => {
        if (serverDown) {
            toast.error('Server is not running. Please start the backend server first.')
            return
        }

        if (!confirm("Are you sure you want to delete ALL extensions? This action cannot be undone.")) {
            return
        }

        try {
            console.log('🗑️ Deleting all extensions...')
            const success = await sendAuthenticatedCommand('yeastar.extensions.delete.all', { ispId })
            if (success) {
                toast.success("Deleting all extensions...")
            }
        } catch (error: any) {
            console.error('❌ Delete extensions error:', error)
            toast.error(error.message || "Failed to delete extensions")
        }
    }

    const handleDeleteAllTrunks = async () => {
        if (serverDown) {
            toast.error('Server is not running. Please start the backend server first.')
            return
        }

        if (!confirm("Are you sure you want to delete ALL trunks? This action cannot be undone.")) {
            return
        }

        try {
            console.log('🗑️ Deleting all trunks...')
            const success = await sendAuthenticatedCommand('yeastar.trunks.delete.all', { ispId })
            if (success) {
                toast.success("Deleting all trunks...")
            }
        } catch (error: any) {
            console.error('❌ Delete trunks error:', error)
            toast.error(error.message || "Failed to delete trunks")
        }
    }

    const handleCallHangup = async (callId: string) => {
        if (serverDown) {
            toast.error('Server is not running. Please start the backend server first.')
            return
        }

        try {
            console.log('📞 Hanging up call:', callId)
            const success = await sendAuthenticatedCommand('yeastar.call.hangup', { ispId, callId })
            if (success) {
                toast.success("Hangup command sent")
            }
        } catch (error: any) {
            console.error('❌ Hangup error:', error)
            toast.error(error.message || "Failed to hangup call")
        }
    }

    const formatUptime = (seconds?: number) => {
        if (!seconds) return "N/A"
        const days = Math.floor(seconds / (3600 * 24))
        const hours = Math.floor((seconds % (3600 * 24)) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`
    }

    // Show server down message
    if (serverDown && loading) {
        return (
            <CardContainer title="Yeastar Dashboard">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-4 max-w-md text-center">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <h3 className="text-lg font-semibold">Backend Server Not Running</h3>
                        <p className="text-muted-foreground">
                            The backend server on port 3200 is not running. Please start the server to use Yeastar features.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={fetchStatus}
                            >
                                Retry Connection
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContainer>
        )
    }

    if (loading) {
        return (
            <CardContainer title="Yeastar Dashboard">
                <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading Yeastar status...</p>
                        {apiError && (
                            <p className="text-sm text-red-500 mt-2">Error: {apiError}</p>
                        )}
                    </div>
                </div>
            </CardContainer>
        )
    }

    if (apiError && !status?.configured) {
        return (
            <CardContainer title="Yeastar Dashboard">
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                Yeastar Service Issue
                            </h3>
                            <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                                <p className="mb-2">{apiError}</p>
                                <p>
                                    Please check if the service is properly configured in the Service Management section.
                                </p>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                                    onClick={() => window.location.href = '/services'}
                                >
                                    Configure Service
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={fetchStatus}
                                >
                                    Retry
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContainer>
        )
    }

    if (!status?.configured) {
        return (
            <CardContainer title="Yeastar Dashboard">
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                Yeastar Service Not Configured
                            </h3>
                            <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                                <p>
                                    Please configure Yeastar service in the Service Management section.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                                onClick={() => window.location.href = '/services'}
                            >
                                Configure Service
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContainer>
        )
    }

    return (
        <>
            <MakeCallModal
                open={makeCallModalOpen}
                onOpenChange={onMakeCallModalChange}
                ispId={ispId}
                onSuccess={() => {
                    onMakeCallModalChange(false)
                    toast.success("Call initiated")
                }}
            />

            <div className="space-y-6">
                {/* Server Status Warning */}
                {serverDown && (
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-4">
                        <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Backend Server Issue
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                    <p>
                                        The backend server on port 3200 is not running. Some features may not work.
                                    </p>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                                        onClick={fetchStatus}
                                    >
                                        Retry Connection
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                    >
                                        Refresh Page
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Bar */}
                <CardContainer
                    title="Service Status"
                    actions={[
                        {
                            label: "Refresh All",
                            onClick: handleRefreshAll,
                            icon: <RefreshCw className="h-4 w-4" />,
                            variant: "outline",
                            disabled: loading || systemLoading || serverDown
                        },
                        {
                            label: "Make Call",
                            onClick: () => onMakeCallModalChange(true),
                            icon: <Phone className="h-4 w-4" />,
                            variant: "default",
                            disabled: !status.apiConnected || serverDown
                        }
                    ]}
                >
                    <div className="space-y-4">
                        {/* WebSocket Status */}
                        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                                <RadioIcon className={`h-4 w-4 ${webSocketConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                                <span className="text-sm font-medium">Real-time Updates</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={webSocketConnected ? "success" : "secondary"}>
                                    {webSocketConnected ? "Connected" : "Disconnected"}
                                </Badge>
                                <Badge variant={webSocketAuthenticated ? "success" : "secondary"}>
                                    {webSocketAuthenticated ? "Authenticated" : "Pending Auth"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Status: {connectionStatus}
                                </span>
                            </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Activity className={`h-4 w-4 ${status.isActive ? 'text-green-500' : 'text-amber-500'}`} />
                                        <span className="text-sm font-medium">Service</span>
                                    </div>
                                    <Badge variant={status.isActive ? "success" : "secondary"}>
                                        {status.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Yeastar service
                                </p>
                            </div>

                            <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {status.apiConnected ? (
                                            <Wifi className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Wifi className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm font-medium">API</span>
                                    </div>
                                    <Badge variant={status.apiConnected ? "success" : "destructive"}>
                                        {status.apiConnected ? "Connected" : "Disconnected"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    HTTP API connection
                                </p>
                            </div>

                            <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {status.listenerActive ? (
                                            <Activity className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                        )}
                                        <span className="text-sm font-medium">TCP Listener</span>
                                    </div>
                                    <Badge variant={status.listenerActive ? "success" : "secondary"}>
                                        {status.listenerActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Event listener
                                </p>
                            </div>

                            <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">Uptime</span>
                                    </div>
                                    <span className="text-sm font-medium">
                                        {formatUptime(status.uptime)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Listener uptime
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* PBX Info */}
                            <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                                <div className="flex items-center gap-2 mb-3">
                                    <Server className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium">PBX Information</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">IP Address:</span>
                                    </div>
                                    <div className="text-right">
                                        <code className="text-xs font-mono bg-muted dark:bg-gray-800 px-2 py-1 rounded">
                                            {status.pbxIp || "Not set"}
                                        </code>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Last Updated:</span>
                                    </div>
                                    <div className="text-right">
                                        {new Date(status.lastUpdated).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            {systemInfo?.data && (
                                <div className="rounded-lg border dark:border-gray-800 p-4 bg-card">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Cpu className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm font-medium">System Information</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Device:</span>
                                            <span className="font-medium">{systemInfo.data.devicename || 'Yeastar PBX'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Firmware:</span>
                                            <span className="font-medium">{systemInfo.data.firmwarever || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Uptime:</span>
                                            <span className="font-medium">{systemInfo.data.uptime || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Extensions:</span>
                                            <span className="font-medium">{systemInfo.data.extensionstatus || '0/0'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {status.listenerActive ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleStopListener}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                                    disabled={!webSocketAuthenticated || isListenerStopping || serverDown}
                                >
                                    {isListenerStopping ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Stopping...
                                        </>
                                    ) : (
                                        'Stop Listener'
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleStartListener}
                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                                    disabled={!webSocketAuthenticated || isListenerStarting || serverDown}
                                >
                                    {isListenerStarting ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        'Start Listener'
                                    )}
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={fetchSystemInfo}
                                disabled={systemLoading || serverDown}
                            >
                                <Cpu className={`mr-2 h-4 w-4 ${systemLoading ? 'animate-spin' : ''}`} />
                                System Info
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`http://${status.pbxIp}`, '_blank')}
                                disabled={!status.pbxIp || serverDown}
                            >
                                <Server className="mr-2 h-4 w-4" />
                                Open PBX Web
                            </Button>
                        </div>
                    </div>
                </CardContainer>

                {/* Quick Actions - Disabled when server is down */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AddExtensionModal
                        ispId={ispId}
                        onSuccess={() => {
                            toast.success("Extension added successfully")
                        }}
                        trigger={
                            <Button
                                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                                disabled={serverDown}
                            >
                                <Users className="h-6 w-6" />
                                <span>Add Extension</span>
                                <span className="text-xs text-muted-foreground">Create new extension</span>
                            </Button>
                        }
                    />

                    <AddTrunkModal
                        ispId={ispId}
                        onSuccess={() => {
                            toast.success("Trunk added successfully")
                        }}
                        trigger={
                            <Button
                                className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                                variant="outline"
                                disabled={serverDown}
                            >
                                <WifiIcon className="h-6 w-6" />
                                <span>Add Trunk</span>
                                <span className="text-xs text-muted-foreground">Configure new trunk</span>
                            </Button>
                        }
                    />

                    <Button
                        className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                        variant="outline"
                        onClick={() => setActiveTab("active-calls")}
                        disabled={serverDown}
                    >
                        <Phone className="h-6 w-6" />
                        <span>Active Calls</span>
                        <span className="text-xs text-muted-foreground">View live calls</span>
                    </Button>

                    <Button
                        className="w-full h-auto py-4 flex flex-col items-center justify-center gap-2"
                        variant="outline"
                        onClick={handleRefreshAll}
                        disabled={loading || systemLoading || serverDown}
                    >
                        <RefreshCw className={`h-6 w-6 ${loading || systemLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh All</span>
                        <span className="text-xs text-muted-foreground">Update all data</span>
                    </Button>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-muted/50 grid grid-cols-6">
                        <TabsTrigger value="extensions" className="flex items-center gap-2 data-[state=active]:bg-background">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Extensions</span>
                        </TabsTrigger>
                        <TabsTrigger value="trunks" className="flex items-center gap-2 data-[state=active]:bg-background">
                            <WifiIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Trunks</span>
                        </TabsTrigger>
                        <TabsTrigger value="active-calls" className="flex items-center gap-2 data-[state=active]:bg-background">
                            <Phone className="h-4 w-4" />
                            <span className="hidden sm:inline">Active Calls</span>
                        </TabsTrigger>
                        <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-background">
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="flex items-center gap-2 data-[state=active]:bg-background">
                            <Activity className="h-4 w-4" />
                            <span className="hidden sm:inline">Call Logs</span>
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-background">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">System</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="extensions" className="space-y-4">
                        <div className="flex justify-end gap-2 mb-4">
                            <AddExtensionModal
                                ispId={ispId}
                                onSuccess={() => {
                                    toast.success("Extension added successfully")
                                }}
                                disabled={serverDown}
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAllExtensions}
                                className="gap-2"
                                disabled={!webSocketAuthenticated || serverDown}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete All Extensions
                            </Button>
                        </div>
                        <ExtensionsList
                            ispId={ispId}
                            webSocketConnected={webSocketAuthenticated}
                            onCallHangup={handleCallHangup}
                            serverDown={serverDown}
                        />
                    </TabsContent>

                    <TabsContent value="trunks" className="space-y-4">
                        <div className="flex justify-end gap-2 mb-4">
                            <AddTrunkModal
                                ispId={ispId}
                                onSuccess={() => {
                                    toast.success("Trunk added successfully")
                                }}
                                disabled={serverDown}
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAllTrunks}
                                className="gap-2"
                                disabled={!webSocketAuthenticated || serverDown}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete All Trunks
                            </Button>
                        </div>
                        <TrunksList
                            ispId={ispId}
                            webSocketConnected={webSocketAuthenticated}
                            serverDown={serverDown}
                        />
                    </TabsContent>

                    <TabsContent value="active-calls" className="space-y-4">
                        <ActiveCalls
                            ispId={ispId}
                            webSocketConnected={webSocketAuthenticated}
                            onCallHangup={handleCallHangup}
                            serverDown={serverDown}
                        />
                    </TabsContent>

                    <TabsContent value="dashboard" className="space-y-4">
                        <CallDashboard
                            ispId={ispId}
                            webSocketConnected={webSocketAuthenticated}
                            serverDown={serverDown}
                        />
                    </TabsContent>

                    <TabsContent value="logs" className="space-y-4">
                        <CallLogsTable
                            ispId={ispId}
                            serverDown={serverDown}
                        />
                    </TabsContent>

                    <TabsContent value="system" className="space-y-4">
                        <CardContainer title="System Management" description="Advanced system controls">
                            <div className="space-y-6">
                                {/* System Status */}
                                <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                                    <h3 className="text-lg font-semibold mb-4">System Health</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">API Status</span>
                                                <Badge variant={status?.apiConnected ? "success" : "destructive"}>
                                                    {status?.apiConnected ? "Online" : "Offline"}
                                                </Badge>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${status?.apiConnected ? 'bg-green-500' : 'bg-red-500'}`}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Listener</span>
                                                <Badge variant={status?.listenerActive ? "success" : "secondary"}>
                                                    {status?.listenerActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${status?.listenerActive ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Uptime</span>
                                                <span className="text-sm font-medium">{formatUptime(status?.uptime)}</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: '75%' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                                <span className="text-sm font-medium">
                                                    {status?.lastUpdated ? new Date(status.lastUpdated).toLocaleTimeString() : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500"
                                                    style={{ width: '90%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Management Actions */}
                                <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                                    <h3 className="text-lg font-semibold mb-4">Management Actions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex flex-col items-center gap-2"
                                            onClick={handleStartListener}
                                            disabled={status?.listenerActive || !webSocketAuthenticated || isListenerStarting || serverDown}
                                        >
                                            <Activity className={`h-6 w-6 ${isListenerStarting ? 'animate-spin' : ''}`} />
                                            <span>Start Listener</span>
                                            <span className="text-xs text-muted-foreground">Start TCP event listener</span>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex flex-col items-center gap-2"
                                            onClick={handleStopListener}
                                            disabled={!status?.listenerActive || !webSocketAuthenticated || isListenerStopping || serverDown}
                                        >
                                            <Activity className={`h-6 w-6 ${isListenerStopping ? 'animate-spin' : ''}`} />
                                            <span>Stop Listener</span>
                                            <span className="text-xs text-muted-foreground">Stop TCP event listener</span>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex flex-col items-center gap-2"
                                            onClick={fetchSystemInfo}
                                            disabled={systemLoading || serverDown}
                                        >
                                            <Cpu className={`h-6 w-6 ${systemLoading ? 'animate-spin' : ''}`} />
                                            <span>Refresh System</span>
                                            <span className="text-xs text-muted-foreground">Update system information</span>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex flex-col items-center gap-2"
                                            onClick={() => window.open(`http://${status?.pbxIp}`, '_blank')}
                                            disabled={!status?.pbxIp || serverDown}
                                        >
                                            <Server className="h-6 w-6" />
                                            <span>PBX Web</span>
                                            <span className="text-xs text-muted-foreground">Open PBX web interface</span>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex flex-col items-center gap-2"
                                            onClick={handleDeleteAllExtensions}
                                            disabled={!webSocketAuthenticated || serverDown}
                                        >
                                            <Trash2 className="h-6 w-6" />
                                            <span>Clear Extensions</span>
                                            <span className="text-xs text-muted-foreground">Delete all extensions</span>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="h-auto py-4 flex flex-col items-center gap-2"
                                            onClick={handleDeleteAllTrunks}
                                            disabled={!webSocketAuthenticated || serverDown}
                                        >
                                            <Trash2 className="h-6 w-6" />
                                            <span>Clear Trunks</span>
                                            <span className="text-xs text-muted-foreground">Delete all trunks</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* System Information */}
                                {systemInfo?.data && (
                                    <div className="rounded-lg border dark:border-gray-800 p-6 bg-card">
                                        <h3 className="text-lg font-semibold mb-4">PBX Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">Device Name</span>
                                                <p className="font-medium">{systemInfo.data.devicename || 'Yeastar PBX'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">Firmware Version</span>
                                                <p className="font-medium">{systemInfo.data.firmwarever || 'Unknown'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">System Uptime</span>
                                                <p className="font-medium">{systemInfo.data.uptime || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">IP Address</span>
                                                <p className="font-medium">{status?.pbxIp || 'Not configured'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">API Port</span>
                                                <p className="font-medium">80</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-sm text-muted-foreground">TCP Port</span>
                                                <p className="font-medium">8333</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContainer>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
