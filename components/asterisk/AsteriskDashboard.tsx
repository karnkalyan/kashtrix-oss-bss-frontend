"use client"

import React, { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle, RefreshCw, Activity, Wifi,
  Server, Search, Globe, PhoneCall, Bot,
  Shield, Network, Play, Square, Settings as SettingsIcon,
  Plus, Trash, HelpCircle, PhoneOff, Check, Ban, Eye
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"

interface AsteriskStatus {
  service: string
  configured: boolean
  isActive: boolean
  amiHost?: string
  amiPort?: number
  ariHost?: string
  ariPort?: number
  apiConnected: boolean
  amiConnected: boolean
  apiError?: string | null
  lastUpdated: string
}

interface CapabilityMatrix {
  ari: { configured: boolean; connected: boolean; features: string[] }
  ami: { configured: boolean; connected: boolean; features: string[] }
  provisioning: { configured: boolean; mode: string | null; features: string[] }
}

interface SystemInfo {
  asteriskVersion: string
  operatingSystem: string
  startupTime: string
  lastReloadTime: string
  calculatedUptime: string
  ariConnected: boolean
  amiConnected: boolean
  activeChannelCount: number
  endpointCount: number
  registeredEndpointCount: number
  bridgeCount: number
  recordingCapability: boolean
  provisioningMode: string | null
  lastSuccessfulSync: string
  lastError: string | null
}

interface Extension {
  id?: string
  number: string
  name: string
  status: string
  type: string
  deviceState?: string
  contactCount?: number
  activeCalls?: number
  context?: string
  enabled?: boolean
}

interface AIAgent {
  id: number
  extension: string
  name: string
  description?: string
  provider: string
  model: string
  voice: string
  prompt: string
  promptVersion: number
  audioSocketHost: string
  audioSocketPort: number
  serviceName: string
  enabled: boolean
  runtimeStatus: string
}

interface AgentHealth {
  databaseStatus: string
  dialplanStatus: string
  socketStatus: string
  serviceStatus: string
  runtimeStatus: string
}

interface Trunk {
  id: string
  trunkname: string
  trunktype: string
  status: string
  host: string | null
}

interface ActiveCall {
  channelId: string
  callerNumber: string
  callerName: string
  destination: string
  state: string
  durationSeconds: number
  bridgeId: string | null
}

interface CallLog {
  id: number
  caller: string
  called: string
  duration: number
  status: string
  startTime: string
}

interface InboundRoute {
  id: number
  routeName: string
  trunkId?: string
  didPattern?: string
  callerIdPattern?: string
  primaryDestination: string
  destinationType: string
  enabled: boolean
}

interface OutboundRoute {
  id: number
  routeName: string
  dialPattern: string
  prefix?: string
  prepend?: string
  trunkOrder: string[]
  enabled: boolean
}

interface Queue {
  id: number
  name: string
  number: string
  strategy: string
  enabled: boolean
}

interface RingGroup {
  id: number
  name: string
  number: string
  enabled: boolean
}

interface IVR {
  id: number
  name: string
  extension: string
  greeting: string
  enabled: boolean
}

interface Recording {
  id: number
  fileName: string
  fileSize?: number
  createdAt: string
}

interface ProvisioningConfig {
  mode: string
  host?: string
  port?: number
  username?: string
  credentialReference?: string
  pjsipConfigPath?: string
  dialplanConfigPath?: string
  managedDialplanContext?: string
  enabled: boolean
  sshHost?: string
  sshPort?: number
  sshUsername?: string
  sshPassword?: string
  sshPrivateKey?: string
  localConfigDir?: string
}

interface AsteriskDashboardProps {
  ispId: number
}

export default function AsteriskDashboard({ ispId }: AsteriskDashboardProps) {
  const [status, setStatus] = useState<AsteriskStatus | null>(null)
  const [capabilities, setCapabilities] = useState<CapabilityMatrix | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([])
  const [agentHealths, setAgentHealths] = useState<Record<number, AgentHealth>>({})
  const [trunks, setTrunks] = useState<Trunk[]>([])
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [inboundRoutes, setInboundRoutes] = useState<InboundRoute[]>([])
  const [outboundRoutes, setOutboundRoutes] = useState<OutboundRoute[]>([])
  const [queues, setQueues] = useState<Queue[]>([])
  const [ringGroups, setRingGroups] = useState<RingGroup[]>([])
  const [ivrs, setIvrs] = useState<IVR[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])

  // Provisioning config state
  const [provConfig, setProvConfig] = useState<ProvisioningConfig>({
    mode: "local_file",
    host: "10.3.2.16",
    port: 22,
    username: "kashtrix-api",
    credentialReference: "[REDACTED]",
    pjsipConfigPath: "/etc/asterisk/pjsip.conf",
    dialplanConfigPath: "/etc/asterisk/extensions.conf",
    managedDialplanContext: "internal",
    enabled: true,
    localConfigDir: "./scratch/asterisk"
  })

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")

  // Outbound simulator state
  const [simNumber, setSimNumber] = useState("")
  const [simSource, setSimSource] = useState("")
  const [simResult, setSimResult] = useState<any>(null)

  // Creation/Edit Dialog States
  const [newAgentExt, setNewAgentExt] = useState("")
  const [newAgentName, setNewAgentName] = useState("")
  const [newAgentPrompt, setNewAgentPrompt] = useState("")
  const [newAgentPort, setNewAgentPort] = useState("9020")
  const [newAgentService, setNewAgentService] = useState("kashtrix-voice-agent")

  // Call Agent State
  const [callingAgentId, setCallingAgentId] = useState<number | null>(null)
  const [callSourceExt, setCallSourceExt] = useState("1001")

  // Softphone configuration display state
  const [selectedSoftphoneConfig, setSelectedSoftphoneConfig] = useState<any>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: AsteriskStatus }>('/asterisk/status')
      if (response.success) setStatus(response.data)
    } catch (error) {
      console.error("❌ Error fetching Asterisk status:", error)
    }
  }, [])

  const fetchCapabilities = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: CapabilityMatrix }>('/asterisk/capabilities')
      if (response.success) setCapabilities(response.data)
    } catch (e) {}
  }, [])

  const fetchSystemInfo = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: SystemInfo }>('/asterisk/system/info')
      if (response.success) setSystemInfo(response.data)
    } catch (e) {}
  }, [])

  const fetchExtensions = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Extension[] }>('/asterisk/extensions')
      if (response.success) setExtensions(response.data || [])
    } catch (e) {}
  }, [])

  const fetchAiAgents = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: AIAgent[] }>('/asterisk/ai-agents')
      if (response.success) {
        setAiAgents(response.data || [])
        // Auto check health of first load
        response.data.forEach(agent => {
          handleTestAgentHealth(agent.id)
        })
      }
    } catch (e) {}
  }, [])

  const fetchTrunks = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Trunk[] }>('/asterisk/trunks')
      if (response.success) setTrunks(response.data || [])
    } catch (e) {}
  }, [])

  const fetchActiveCalls = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/asterisk/calls/active')
      if (response.success) {
        const mapped = response.data.map(c => ({
          channelId: c.channelId || c.channelid,
          callerNumber: c.callerNumber || c.caller || 'Unknown',
          callerName: c.callerName || c.caller || 'Unknown',
          destination: c.destination || c.called || 'Unknown',
          state: c.state || c.status || 'Unknown',
          durationSeconds: c.durationSeconds || c.duration || 0,
          bridgeId: c.bridgeId || null
        }))
        setActiveCalls(mapped)
      }
    } catch (e) {}
  }, [])

  const fetchCallLogs = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/asterisk/calls/logs')
      if (response.success) {
        setCallLogs(response.data || [])
      }
    } catch (e) {}
  }, [])

  const fetchInboundRoutes = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: InboundRoute[] }>('/asterisk/routes/inbound')
      if (response.success) setInboundRoutes(response.data || [])
    } catch (e) {}
  }, [])

  const fetchOutboundRoutes = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: OutboundRoute[] }>('/asterisk/routes/outbound')
      if (response.success) setOutboundRoutes(response.data || [])
    } catch (e) {}
  }, [])

  const fetchQueues = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Queue[] }>('/asterisk/queues')
      if (response.success) setQueues(response.data || [])
    } catch (e) {}
  }, [])

  const fetchRingGroups = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: RingGroup[] }>('/asterisk/ring-groups')
      if (response.success) setRingGroups(response.data || [])
    } catch (e) {}
  }, [])

  const fetchIvrs = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: IVR[] }>('/asterisk/ivr')
      if (response.success) setIvrs(response.data || [])
    } catch (e) {}
  }, [])

  const fetchRecordings = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: Recording[] }>('/asterisk/recordings')
      if (response.success) setRecordings(response.data || [])
    } catch (e) {}
  }, [])

  const fetchProvConfig = useCallback(async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: ProvisioningConfig }>('/asterisk/provisioning')
      if (response.success) setProvConfig(response.data)
    } catch (e) {}
  }, [])

  const handleRefreshAll = async () => {
    setLoading(true)
    await Promise.all([
      fetchStatus(),
      fetchCapabilities(),
      fetchSystemInfo(),
      fetchExtensions(),
      fetchAiAgents(),
      fetchTrunks(),
      fetchActiveCalls(),
      fetchCallLogs(),
      fetchInboundRoutes(),
      fetchOutboundRoutes(),
      fetchQueues(),
      fetchRingGroups(),
      fetchIvrs(),
      fetchRecordings(),
      fetchProvConfig()
    ])
    setLoading(false)
    toast.success("Asterisk VoIP Module data refreshed")
  }

  // Active call polling
  useEffect(() => {
    if (activeTab !== "active") return
    fetchActiveCalls()
    const timer = setInterval(fetchActiveCalls, 3000)
    return () => clearInterval(timer)
  }, [activeTab, fetchActiveCalls])

  useEffect(() => {
    handleRefreshAll()
  }, [])

  const handleSimulateRoute = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await apiRequest<any>('/asterisk/routes/outbound/simulate', {
        method: 'POST',
        body: JSON.stringify({ number: simNumber, sourceExtension: simSource })
      })
      setSimResult(result)
    } catch (err: any) {
      toast.error(err.message || 'Simulation failed')
    }
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest<any>('/asterisk/ai-agents', {
        method: 'POST',
        body: JSON.stringify({
          extension: newAgentExt,
          name: newAgentName,
          prompt: newAgentPrompt,
          audioSocketPort: newAgentPort,
          serviceName: newAgentService,
          provider: 'gemini_live',
          model: 'gemini-2.5-flash',
          voice: 'Kore'
        })
      })
      toast.success("AI agent registered and dialplan provisioned")
      fetchAiAgents()
      setNewAgentExt("")
      setNewAgentName("")
      setNewAgentPrompt("")
    } catch (err: any) {
      toast.error(err.message || 'Failed to register agent')
    }
  }

  const handleAgentControl = async (id: number, action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await apiRequest<any>(`/asterisk/ai-agents/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (response.success) {
        toast.success(`Agent service command '${action}' dispatched`)
        // Refetch after command delay
        setTimeout(() => {
          fetchAiAgents()
          handleTestAgentHealth(id)
        }, 1000)
      }
    } catch (err: any) {
      toast.error(err.message || 'Service operation failed')
    }
  }

  const handleTestAgentHealth = async (id: number) => {
    try {
      const response = await apiRequest<{ success: boolean; data: AgentHealth }>(`/asterisk/ai-agents/${id}/test`, {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (response.success) {
        setAgentHealths(prev => ({ ...prev, [id]: response.data }))
      }
    } catch (e) {}
  }

  const handleCallAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callingAgentId) return
    try {
      const response = await apiRequest<any>(`/asterisk/ai-agents/${callingAgentId}/call`, {
        method: 'POST',
        body: JSON.stringify({ sourceExtension: callSourceExt })
      })
      if (response.success) {
        toast.success(`Call originated: ${callSourceExt} -> Agent`)
        setCallingAgentId(null)
        setActiveTab("active")
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to place call")
    }
  }

  const handleSaveProvConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiRequest<any>('/asterisk/provisioning', {
        method: 'PUT',
        body: JSON.stringify(provConfig)
      })
      if (response.success) {
        toast.success("Provisioning configuration saved")
        fetchCapabilities()
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to save configuration")
    }
  }

  const handleTestProvConfig = async () => {
    try {
      const response = await apiRequest<any>('/asterisk/provisioning/test', {
        method: 'POST',
        body: JSON.stringify({})
      })
      if (response.success) {
        toast.success("Provisioning check successful")
      }
    } catch (e: any) {
      toast.error(e.message || "Provisioning test failed")
    }
  }

  const handleHangup = async (channelId: string) => {
    try {
      const response = await apiRequest<any>('/asterisk/calls/hangup', {
        method: 'POST',
        body: JSON.stringify({ channelid: channelId })
      })
      if (response.success) {
        toast.success("Hang up command sent successfully")
        fetchActiveCalls()
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to hang up channel")
    }
  }

  const handleDownloadSoftphone = async (number: string) => {
    try {
      const response = await apiRequest<{ success: boolean; data: any }>(`/asterisk/extensions/${number}/softphone`)
      if (response.success) {
        setSelectedSoftphoneConfig(response.data)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to retrieve configuration")
    }
  }

  // Filter lists
  const filteredExtensions = extensions.filter(e =>
    e.number.includes(searchTerm) || e.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAmiConfigured = capabilities?.ami?.configured
  const isProvisioningConfigured = capabilities?.provisioning?.configured

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <CardContainer title="System Connectivity Matrix" actions={[{ label: "Refresh All", onClick: handleRefreshAll, icon: <RefreshCw className="h-4 w-4" /> }]}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">ARI Connectivity</span>
              <Badge variant={capabilities?.ari?.connected ? "success" : "destructive"}>
                {capabilities?.ari?.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Asterisk REST API connection state</p>
          </div>

          <div className="rounded-lg border p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">AMI Integration</span>
              <Badge variant={isAmiConfigured ? (capabilities?.ami?.connected ? "success" : "destructive") : "secondary"}>
                {isAmiConfigured ? (capabilities?.ami?.connected ? "Connected" : "Disconnected") : "Not Configured"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Asterisk Manager Interface state</p>
          </div>

          <div className="rounded-lg border p-4 bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Provisioning Layer</span>
              <Badge variant={isProvisioningConfigured ? "success" : "secondary"}>
                {isProvisioningConfigured ? `Active (${capabilities?.provisioning?.mode})` : "Not Configured"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Controlled Asterisk configuration adapter</p>
          </div>
        </div>
      </CardContainer>

      {/* Main Tabs Container */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 bg-muted/60 p-1 rounded-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="ai-agents">AI Voice Agents</TabsTrigger>
          <TabsTrigger value="trunks">Trunks</TabsTrigger>
          <TabsTrigger value="active">Active Calls ({activeCalls.length})</TabsTrigger>
          <TabsTrigger value="logs">Call History</TabsTrigger>
          <TabsTrigger value="inbound">Inbound Routes</TabsTrigger>
          <TabsTrigger value="outbound">Outbound Routes</TabsTrigger>
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="ring-groups">Ring Groups</TabsTrigger>
          <TabsTrigger value="ivr">IVR Menu</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          
          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <CardContainer title="Asterisk VoIP System Status Overview">
                  {systemInfo ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><b>Asterisk Version:</b> {systemInfo.asteriskVersion}</div>
                      <div><b>Operating System:</b> {systemInfo.operatingSystem}</div>
                      <div><b>System Uptime:</b> {systemInfo.calculatedUptime}</div>
                      <div><b>Last Reload:</b> {new Date(systemInfo.lastReloadTime).toLocaleString()}</div>
                      <div><b>Total Extensions:</b> {systemInfo.endpointCount}</div>
                      <div><b>Registered Endpoints:</b> {systemInfo.registeredEndpointCount}</div>
                      <div><b>Live Bridges:</b> {systemInfo.bridgeCount}</div>
                      <div><b>Active Call Channels:</b> {systemInfo.activeChannelCount}</div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">System details unavailable. Check ARI connection.</div>
                  )}
                </CardContainer>
              </div>

              <div className="space-y-6">
                <CardContainer title="Outbound Route Simulator">
                  <form onSubmit={handleSimulateRoute} className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Source Extension</label>
                      <Input value={simSource} onChange={(e) => setSimSource(e.target.value)} placeholder="e.g. 1001" required />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Destination Number</label>
                      <Input value={simNumber} onChange={(e) => setSimNumber(e.target.value)} placeholder="e.g. 9841234567" required />
                    </div>
                    <Button type="submit" className="w-full">Simulate Call Path</Button>

                    {simResult && (
                      <div className="p-3 rounded-lg border text-xs bg-muted/20 space-y-1">
                        {simResult.success ? (
                          <>
                            <div className="text-green-500 font-semibold">Match Found!</div>
                            <div><b>Route Name:</b> {simResult.matchedRoute}</div>
                            <div><b>Prepend:</b> {simResult.prepend || 'None'}</div>
                            <div><b>Trunk ID:</b> {simResult.primaryTrunk}</div>
                          </>
                        ) : (
                          <div className="text-red-500">{simResult.message}</div>
                        )}
                      </div>
                    )}
                  </form>
                </CardContainer>
              </div>
            </div>
          </TabsContent>

          {/* Extensions Tab Content */}
          <TabsContent value="extensions">
            <div className="space-y-4">
              {!isProvisioningConfigured && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Extension creation/deletion requires an Asterisk provisioning configuration mode (local_file/ssh_file). Only registered extensions from ARI are listed.</span>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search extensions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredExtensions.map(ext => (
                  <div key={ext.number} className="border p-4 rounded-lg bg-card space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{ext.number}</span>
                      <Badge variant={ext.status === 'Registered' ? 'success' : 'secondary'}>{ext.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div><b>Technology:</b> {ext.type}</div>
                      {ext.deviceState && <div><b>State:</b> {ext.deviceState}</div>}
                      {ext.contactCount !== undefined && <div><b>Contacts Bound:</b> {ext.contactCount}</div>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {/* Hide Softphone Config for non-extensions (trunks, yeastar, etc.) just in case */}
                      {!ext.type.includes('TRUNK') && (
                        <Button size="sm" variant="outline" onClick={() => handleDownloadSoftphone(ext.number)}>Softphone Config</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedSoftphoneConfig && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
                  <div className="bg-card border p-6 rounded-lg max-w-md w-full space-y-4">
                    <h3 className="font-semibold text-lg">Softphone Setup Details</h3>
                    <div className="text-sm space-y-2 font-mono">
                      <div><b>SIP Username:</b> {selectedSoftphoneConfig.username}</div>
                      <div><b>SIP Hostname:</b> {selectedSoftphoneConfig.hostname}</div>
                      <div><b>SIP Port:</b> {selectedSoftphoneConfig.port}</div>
                      <div><b>Display Name:</b> {selectedSoftphoneConfig.displayName}</div>
                    </div>
                    <div className="flex justify-center border p-4 bg-white rounded-lg">
                      <div className="text-xs text-black text-center">
                        <span className="font-semibold">QR Provisioning Payload:</span>
                        <div className="mt-1 font-mono break-all text-[10px]">{selectedSoftphoneConfig.qrPayload}</div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setSelectedSoftphoneConfig(null)}>Close</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Agents Tab Content */}
          <TabsContent value="ai-agents">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {aiAgents.map(agent => {
                    const health = agentHealths[agent.id];
                    return (
                      <div key={agent.id} className="border p-4 rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <span>{agent.name} (Ext: {agent.extension})</span>
                          </h4>
                          <p className="text-xs text-muted-foreground">Prompt: "{agent.prompt}"</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="secondary">Model: {agent.model}</Badge>
                            <Badge variant="secondary">Voice: {agent.voice}</Badge>
                            <Badge variant={agent.runtimeStatus === 'running' ? 'success' : 'secondary'}>
                              Runtime: {agent.runtimeStatus.toUpperCase()}
                            </Badge>
                          </div>

                          {/* Health Status Matrix */}
                          {health && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t pt-2 mt-2 text-xs">
                              <div><b>Socket Status:</b> <Badge variant={health.socketStatus === 'listening' ? 'success' : 'destructive'}>{health.socketStatus}</Badge></div>
                              <div><b>Service Status:</b> <Badge variant={health.serviceStatus === 'running' ? 'success' : 'destructive'}>{health.serviceStatus}</Badge></div>
                              <div><b>Dialplan status:</b> <Badge variant={health.dialplanStatus === 'configured' ? 'success' : 'warning'}>{health.dialplanStatus}</Badge></div>
                              <div><b>Runtime Health:</b> <Badge variant={health.runtimeStatus === 'healthy' ? 'success' : 'destructive'}>{health.runtimeStatus}</Badge></div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setCallingAgentId(agent.id)}>
                            <PhoneCall className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleTestAgentHealth(agent.id)}>
                            <Activity className="h-4 w-4 mr-1" />
                            Test Health
                          </Button>
                          <Button size="sm" variant={agent.runtimeStatus === 'running' ? 'destructive' : 'default'} onClick={() => handleAgentControl(agent.id, agent.runtimeStatus === 'running' ? 'stop' : 'start')}>
                            {agent.runtimeStatus === 'running' ? <Square className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                            {agent.runtimeStatus === 'running' ? 'Stop' : 'Start'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAgentControl(agent.id, 'restart')}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Restart
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  {aiAgents.length === 0 && (
                    <div className="text-muted-foreground text-center py-10">No AI voice agents configured. Add one below.</div>
                  )}
                </div>
              </div>

              {/* Add Agent Form */}
              <div>
                <CardContainer title="Provision Voice Agent">
                  <form onSubmit={handleCreateAgent} className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Extension</label>
                      <Input value={newAgentExt} onChange={(e) => setNewAgentExt(e.target.value)} placeholder="e.g. 801" required />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Agent Name</label>
                      <Input value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} placeholder="e.g. NOC assistant" required />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">AudioSocket Port</label>
                      <Input value={newAgentPort} onChange={(e) => setNewAgentPort(e.target.value)} placeholder="e.g. 9020" required />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Systemd Service Name</label>
                      <Input value={newAgentService} onChange={(e) => setNewAgentService(e.target.value)} placeholder="e.g. kashtrix-voice-agent" required />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">System Prompt</label>
                      <textarea value={newAgentPrompt} onChange={(e) => setNewAgentPrompt(e.target.value)} placeholder="Define the AI agent's instructions..." className="w-full border rounded-md p-2 text-sm h-24 bg-background" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={!isProvisioningConfigured}>Create & Bind Destination</Button>
                  </form>
                </CardContainer>
              </div>
            </div>

            {/* Call Agent Modal */}
            {callingAgentId && (
              <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
                <form onSubmit={handleCallAgentSubmit} className="bg-card border p-6 rounded-lg max-w-md w-full space-y-4">
                  <h3 className="font-semibold text-lg">Originate Call to AI Agent</h3>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Source Extension</label>
                    <Input value={callSourceExt} onChange={(e) => setCallSourceExt(e.target.value)} placeholder="e.g. 1001" required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setCallingAgentId(null)}>Cancel</Button>
                    <Button type="submit">Call Agent</Button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>

          {/* Trunks Tab Content */}
          <TabsContent value="trunks">
            <div className="space-y-4">
              {!isAmiConfigured && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Full trunk registration details require AMI. Displaying ARI-visible SIP trunk status below.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trunks.map(trunk => (
                  <div key={trunk.id} className="border p-4 rounded-lg bg-card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{trunk.trunkname}</span>
                      <Badge variant={trunk.status === 'Registered' ? 'success' : 'secondary'}>{trunk.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Host: {trunk.host || 'Direct Peer'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Type: {trunk.trunktype.toUpperCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Active Calls Tab Content */}
          <TabsContent value="active">
            <div className="border rounded-lg bg-card overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                    <th className="p-3">Channel ID</th>
                    <th className="p-3">Caller</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCalls.map(call => (
                    <tr key={call.channelId} className="border-b hover:bg-accent/20">
                      <td className="p-3 font-mono text-xs">{call.channelId}</td>
                      <td className="p-3">{call.callerName}</td>
                      <td className="p-3">{call.destination}</td>
                      <td className="p-3">
                        <Badge variant="success" className="animate-pulse">{call.state}</Badge>
                      </td>
                      <td className="p-3">{call.durationSeconds}s</td>
                      <td className="p-3">
                        <Button variant="destructive" size="sm" onClick={() => handleHangup(call.channelId)}>
                          <PhoneOff className="h-4 w-4 mr-1" />
                          Hang up
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {activeCalls.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No active calls at this time.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Call History Tab Content */}
          <TabsContent value="logs">
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Historical call records require a configured CDR database source. Displaying local cache logs below.</span>
              </div>

              <div className="border rounded-lg bg-card overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                      <th className="p-3">Date</th>
                      <th className="p-3">Caller</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Disposition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {callLogs.map(log => (
                      <tr key={log.id} className="border-b hover:bg-accent/20">
                        <td className="p-3">{new Date(log.startTime).toLocaleString()}</td>
                        <td className="p-3">{log.caller}</td>
                        <td className="p-3">{log.called}</td>
                        <td className="p-3">{log.duration}s</td>
                        <td className="p-3">
                          <Badge variant={log.status === 'ANSWERED' ? 'success' : 'destructive'}>{log.status}</Badge>
                        </td>
                      </tr>
                    ))}

                    {callLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">No call history logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Dummy placeholders for Inbound, Outbound, Queues, Groups, IVR, recordings */}
          <TabsContent value="inbound">
            <CardContainer title="Inbound Routes">
              <div className="text-muted-foreground text-sm text-center py-10">
                <Ban className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                Inbound route management requires active provisioning adapters.
              </div>
            </CardContainer>
          </TabsContent>

          <TabsContent value="outbound">
            <CardContainer title="Outbound Routes">
              <div className="text-muted-foreground text-sm text-center py-10">
                <Ban className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                Outbound route management requires active provisioning adapters.
              </div>
            </CardContainer>
          </TabsContent>

          <TabsContent value="queues">
            <CardContainer title="Call Queues">
              <div className="text-muted-foreground text-sm text-center py-10">
                <Ban className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                Call queue management is currently disabled on this ISP tier.
              </div>
            </CardContainer>
          </TabsContent>

          <TabsContent value="ring-groups">
            <CardContainer title="Ring Groups">
              <div className="text-muted-foreground text-sm text-center py-10">
                <Ban className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                Ring group management is currently disabled on this ISP tier.
              </div>
            </CardContainer>
          </TabsContent>

          <TabsContent value="ivr">
            <CardContainer title="Interactive Voice Response (IVR)">
              <div className="text-muted-foreground text-sm text-center py-10">
                <Ban className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                IVR menu configuration requires active provisioning adapters.
              </div>
            </CardContainer>
          </TabsContent>

          <TabsContent value="recordings">
            <CardContainer title="Call Recordings Cache">
              <div className="text-muted-foreground text-sm text-center py-10">
                <Ban className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                VoIP call recording archiving requires an active media storage adapter.
              </div>
            </CardContainer>
          </TabsContent>

          {/* Settings Tab Content */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardContainer title="Asterisk Provisioning Setup">
                <form onSubmit={handleSaveProvConfig} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Provisioning Mode</label>
                      <select value={provConfig.mode} onChange={(e) => setProvConfig({ ...provConfig, mode: e.target.value })} className="w-full border rounded-md p-2 text-sm bg-background">
                        <option value="local_file">Local Config Files</option>
                        <option value="ssh_file">Remote SSH Files</option>
                        <option value="external_provisioning_api">External Provisioning API</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Enabled</label>
                      <select value={provConfig.enabled ? "true" : "false"} onChange={(e) => setProvConfig({ ...provConfig, enabled: e.target.value === "true" })} className="w-full border rounded-md p-2 text-sm bg-background">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">SSH/API Host IP</label>
                    <Input value={provConfig.host || ''} onChange={(e) => setProvConfig({ ...provConfig, host: e.target.value })} placeholder="e.g. 10.3.2.16" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">SSH/API Port</label>
                      <Input value={provConfig.port || 22} onChange={(e) => setProvConfig({ ...provConfig, port: parseInt(e.target.value, 10) })} type="number" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">SSH Username</label>
                      <Input value={provConfig.username || ''} onChange={(e) => setProvConfig({ ...provConfig, username: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">SSH Password / Private Key</label>
                    <Input type="password" value={provConfig.credentialReference || ''} onChange={(e) => setProvConfig({ ...provConfig, credentialReference: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">PJSIP Config Path</label>
                      <Input value={provConfig.pjsipConfigPath || ''} onChange={(e) => setProvConfig({ ...provConfig, pjsipConfigPath: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Dialplan Path</label>
                      <Input value={provConfig.dialplanConfigPath || ''} onChange={(e) => setProvConfig({ ...provConfig, dialplanConfigPath: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Managed Dialplan Context</label>
                    <Input value={provConfig.managedDialplanContext || ''} onChange={(e) => setProvConfig({ ...provConfig, managedDialplanContext: e.target.value })} />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={handleTestProvConfig}>Test Connection</Button>
                    <Button type="submit">Save Settings</Button>
                  </div>
                </form>
              </CardContainer>

              <CardContainer title="Asterisk Configuration Guidelines">
                <div className="text-xs text-muted-foreground space-y-3">
                  <p>Follow these instructions to safely set up Asterisk Manager Interface (AMI) access for the Kashtrix Backend.</p>
                  <div className="p-3 bg-muted rounded-lg font-mono whitespace-pre text-[10px] overflow-auto">
{`# /etc/asterisk/manager.conf

[general]
enabled = yes
port = 5038
bindaddr = 10.3.2.16

[kashtrix-manager]
secret = <strong-secret>
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,command,agent,user,config,originate,message`}
                  </div>
                  <p className="text-amber-500 font-semibold">⚠️ Security Warning:</p>
                  <p>Restrict access to port 5038 on the Asterisk server by binding firewall rules exclusively to the IP address of your Kashtrix CMS Backend server.</p>
                </div>
              </CardContainer>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
