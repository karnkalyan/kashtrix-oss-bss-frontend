"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cpu,
  Bot,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Terminal,
  Lock,
  Layers,
  Sparkles,
  Server
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import toast from "react-hot-toast"

interface McpTool {
  name: string
  description?: string
  enabled: boolean
}

const TOOL_GROUPS: Record<string, { label: string; icon: any; tools: string[] }> = {
  customer: {
    label: "Customers & Subscriptions",
    icon: Bot,
    tools: ["list_customers", "get_customer_details", "get_customer_summary", "get_customer_radius_auth_logs"]
  },
  crm: {
    label: "Leads & CRM Follow-ups",
    icon: Layers,
    tools: ["list_leads", "get_lead_details", "list_followups", "get_followup_details"]
  },
  network: {
    label: "OLT, PON & ODN Fiber Hardware",
    icon: Server,
    tools: ["list_olts", "get_olt_details", "get_olt_vlans", "get_olt_pon_ports", "get_olt_optical_power", "list_splitters", "get_splitter_details"]
  },
  tr069: {
    label: "TR-069 ACS & Customer ONTs",
    icon: Cpu,
    tools: ["list_tr069_devices", "get_tr069_device_details", "list_onts", "get_ont_details", "list_low_power_onts"]
  },
  operations: {
    label: "Helpdesk Tickets & Engineering Tasks",
    icon: Sliders,
    tools: ["list_tickets", "get_ticket_details", "list_tasks", "get_task_details"]
  },
  finance: {
    label: "Billing & Invoicing",
    icon: ShieldCheck,
    tools: ["list_invoices", "get_invoice_details"]
  }
}

export function McpSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [readOnly, setReadOnly] = useState(true)
  const [authToken, setAuthToken] = useState("")
  const [transport, setTransport] = useState("all")
  const [disabledTools, setDisabledTools] = useState<string[]>([])
  const [allTools, setAllTools] = useState<McpTool[]>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Diagnostics & Tester state
  const [testTool, setTestTool] = useState("")
  const [testArgs, setTestArgs] = useState("{}")
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const origin = typeof window !== "undefined" ? window.location.origin : "https://isp.yourdomain.com"

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await apiRequest<any>("/mcp/config")
      if (res) {
        setEnabled(res.enabled !== false)
        setReadOnly(res.readOnly !== false)
        setAuthToken(res.authToken || "")
        setTransport(res.transport || "all")
        setDisabledTools(res.disabledTools || [])
        setAllTools(res.allTools || [])
        if (res.allTools?.length && !testTool) {
          setTestTool(res.allTools[0].name)
        }
      }
    } catch (e: any) {
      console.warn("Failed to fetch MCP config:", e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleTool = (toolName: string) => {
    setDisabledTools((prev) =>
      prev.includes(toolName) ? prev.filter((t) => t !== toolName) : [...prev, toolName]
    )
  }

  const handleToggleGroup = (groupTools: string[], enable: boolean) => {
    setDisabledTools((prev) => {
      if (enable) {
        return prev.filter((t) => !groupTools.includes(t))
      } else {
        return Array.from(new Set([...prev, ...groupTools]))
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiRequest("/mcp/config", {
        method: "PUT",
        body: JSON.stringify({
          enabled,
          readOnly,
          authToken,
          transport,
          disabledTools
        })
      })
      toast.success("MCP Server settings saved successfully!")
      fetchConfig()
    } catch (e: any) {
      toast.error(e.message || "Failed to save MCP configuration")
    } finally {
      setSaving(false)
    }
  }

  const handleTestTool = async () => {
    if (!testTool) return toast.error("Select a tool to test")
    setTestLoading(true)
    setTestResult(null)
    try {
      let parsedArgs = {}
      if (testArgs.trim()) {
        try {
          parsedArgs = JSON.parse(testArgs)
        } catch {
          setTestLoading(false)
          return toast.error("Invalid JSON in Arguments")
        }
      }
      const res = await apiRequest("/mcp/call-tool", {
        method: "POST",
        body: JSON.stringify({
          name: testTool,
          arguments: parsedArgs
        })
      })
      setTestResult(res)
      toast.success(`Tool '${testTool}' executed!`)
    } catch (e: any) {
      setTestResult({ error: e.message })
      toast.error(e.message || "Execution failed")
    } finally {
      setTestLoading(false)
    }
  }

  const mcpConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        "kisan-isp": {
          url: `${origin}/mcp`,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        }
      }
    },
    null,
    2
  )

  const activeCount = allTools.filter((t) => !disabledTools.includes(t.name)).length

  return (
    <div className="space-y-6">
      <CardContainer
        title="Model Context Protocol (MCP) Server"
        description="Configure AI Agent connectivity (Claude, Cursor, Antigravity, Open WebUI) to inspect network, subscriber, and billing telemetry."
        gradientColor="#6366f1"
      >
        <div className="space-y-6">
          {/* Main Server Toggle Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-xl bg-card">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${enabled ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-muted text-muted-foreground"}`}>
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">Model Context Protocol Server</h3>
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? "Active" : "Disabled"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {activeCount} of {allTools.length || 16} Tools Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allows authorized AI agents to safely query subscribers, OLT hardware, and ticketing in real time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>

          {/* Quick Connection Endpoints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streamable HTTP Endpoint</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText(`${origin}/mcp`, "endpoint-http")}>
                  {copiedKey === "endpoint-http" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="font-mono text-xs break-all bg-background p-2 rounded border">{origin}/mcp</p>
              <p className="text-[11px] text-muted-foreground">Standard Streamable HTTP transport for modern AI assistants.</p>
            </div>

            <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SSE Legacy Endpoint</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText(`${origin}/mcp/sse`, "endpoint-sse")}>
                  {copiedKey === "endpoint-sse" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="font-mono text-xs break-all bg-background p-2 rounded border">{origin}/mcp/sse</p>
              <p className="text-[11px] text-muted-foreground">Server-Sent Events transport with bidirectional message pump.</p>
            </div>

            <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Claude / Cursor JSON Config</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyText(mcpConfigSnippet, "endpoint-json")}>
                  {copiedKey === "endpoint-json" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <p className="font-mono text-xs truncate bg-background p-2 rounded border">{`{ "mcpServers": { "kisan-isp": ... } }`}</p>
              <p className="text-[11px] text-muted-foreground">One-click copyable config block for `claude_desktop_config.json`.</p>
            </div>
          </div>

          {/* Security & Access Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="mcp-token" className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Optional Access Token / API Secret
              </Label>
              <Input
                id="mcp-token"
                type="password"
                placeholder="Leave blank for open internal network, or set an authorization token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Clients must supply `Authorization: Bearer &lt;token&gt;` when this secret is configured.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Strict Read-Only Enforcement
              </Label>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <p className="text-sm font-medium">Read-Only Safety Guarantee</p>
                  <p className="text-xs text-muted-foreground">Prevent any AI mutation, deletion, or plan alterations.</p>
                </div>
                <Switch checked={readOnly} onCheckedChange={setReadOnly} />
              </div>
            </div>
          </div>
        </div>
      </CardContainer>

      {/* Domain Feature Tool Toggles */}
      <CardContainer
        title="MCP Tools & Feature Enablement"
        description="Fine-tune which functional tools are exposed to external LLMs and internal agents."
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Available Tool Registry</span>
              <Badge variant="outline" className="text-xs">
                {activeCount} Active
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisabledTools([])}
                className="text-xs h-7"
              >
                Enable All Tools
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisabledTools(allTools.map((t) => t.name))}
                className="text-xs h-7"
              >
                Disable All Tools
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(TOOL_GROUPS).map(([key, group]) => {
              const GroupIcon = group.icon
              const groupTools = allTools.filter((t) => group.tools.includes(t.name))
              const allEnabled = groupTools.every((t) => !disabledTools.includes(t.name))

              return (
                <div key={key} className="border rounded-xl p-4 bg-card/60 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <GroupIcon className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">{group.label}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-muted-foreground"
                      onClick={() => handleToggleGroup(group.tools, !allEnabled)}
                    >
                      {allEnabled ? "Disable Group" : "Enable Group"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {groupTools.map((tool) => {
                      const isToolEnabled = !disabledTools.includes(tool.name)
                      return (
                        <div
                          key={tool.name}
                          className="flex items-start justify-between gap-3 p-2.5 rounded-lg border hover:bg-muted/40 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-foreground">
                                {tool.name}
                              </span>
                              {isToolEnabled ? (
                                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 py-0">
                                  Allowed
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] py-0">
                                  Disabled
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              {tool.description || "Read-only CMS query tool"}
                            </p>
                          </div>
                          <Switch
                            checked={isToolEnabled}
                            onCheckedChange={() => toggleTool(tool.name)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-3 border-t">
            <Button onClick={handleSave} disabled={saving} size="default">
              {saving ? "Saving..." : "Save Tool Preferences"}
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Live Tool Execution & Diagnostic Sandbox */}
      <CardContainer
        title="Live Tool Execution Sandbox"
        description="Test MCP tool outputs directly from the web interface without connecting an external client."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Select Tool</Label>
              <select
                className="w-full h-9 px-3 rounded-md border text-sm bg-background font-mono"
                value={testTool}
                onChange={(e) => setTestTool(e.target.value)}
              >
                {allTools.map((t) => (
                  <option key={t.name} value={t.name} disabled={disabledTools.includes(t.name)}>
                    {t.name} {disabledTools.includes(t.name) ? "(DISABLED)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Tool Arguments (JSON)</Label>
              <Input
                value={testArgs}
                onChange={(e) => setTestArgs(e.target.value)}
                placeholder='{"limit": 5, "status": "active"}'
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleTestTool}
              disabled={testLoading || !testTool}
              className="flex items-center gap-2"
            >
              {testLoading ? <RotateCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Execute Tool
            </Button>
          </div>

          {testResult && (
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold">Execution Output</Label>
              <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContainer>
    </div>
  )
}
