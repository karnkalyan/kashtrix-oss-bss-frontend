"use client"

import { useEffect, useRef, useState } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"
import { Bot, CheckCircle, Loader2, MessageCircle, Pencil, Plus, Power, QrCode, RefreshCw, Save, Send, Trash2 } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { useConfirmToast } from "@/hooks/use-confirm-toast"

type AlarmRule = {
    id: string
    name: string
    metric: string
    operator: string
    value: string
    cooldownMinutes: number
    channels: string[]
    recipients: string
    enabled: boolean
}

type AutomationRule = { id: number; name: string; triggerType: string; keywords: string[]; response: string; enabled: boolean; priority: number; businessHoursOnly: boolean }

export function NotificationsWhatsAppSettings() {
    // WhatsApp States
    const [provider, setProvider] = useState<"META" | "QR">("META")
    const [metaPhoneId, setMetaPhoneId] = useState("")
    const [metaAccountId, setMetaAccountId] = useState("")
    const [metaToken, setMetaToken] = useState("")
    const [savingWhatsApp, setSavingWhatsApp] = useState(false)

    // QR Session States
    const [qrState, setQrState] = useState<"DISCONNECTED" | "CONNECTING" | "QR_READY" | "CONNECTED" | "ERROR">("DISCONNECTED")
    const [qrCode, setQrCode] = useState("")
    const [qrError, setQrError] = useState("")
    const [loadingQr, setLoadingQr] = useState(false)

    // Telemetry Alarm States
    const [rules, setRules] = useState<AlarmRule[]>([])
    const [loadingRules, setLoadingRules] = useState(true)
    const [savingRules, setSavingRules] = useState(false)
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
    const [chats, setChats] = useState<any[]>([])
    const [selectedPhone, setSelectedPhone] = useState("")
    const [messages, setMessages] = useState<any[]>([])
    const [chatBody, setChatBody] = useState("")
    const [newChatPhone, setNewChatPhone] = useState("")
    const [sendingChat, setSendingChat] = useState(false)
    const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
    const [automationForm, setAutomationForm] = useState({ name: "", triggerType: "KEYWORD", keywords: "", response: "", priority: 100, businessHoursOnly: false })
    const [savingAutomation, setSavingAutomation] = useState(false)
    const inboxPollBusy = useRef(false)
    const messageListRef = useRef<HTMLDivElement | null>(null)
    const { confirm, ConfirmDialog } = useConfirmToast()

    // Add Rule Form States
    const [showAddForm, setShowAddForm] = useState(false)
    const [newRule, setNewRule] = useState<Omit<AlarmRule, "id">>({
        name: "",
        metric: "cpuLoadPercent",
        operator: "gt",
        value: "90",
        cooldownMinutes: 15,
        channels: ["Email"],
        recipients: "",
        enabled: true
    })

    // Load configurations
    const loadSettings = async () => {
        try {
            // Fetch WhatsApp
            const wa = await apiRequest<any>("/settings/whatsapp")
            if (wa) {
                setProvider(wa.provider || "META")
                setMetaPhoneId(wa.metaPhoneId || "")
                setMetaAccountId(wa.metaAccountId || "")
                setMetaToken(wa.metaToken || "")
                setQrState(wa.qrState || "DISCONNECTED")
                setQrCode(wa.qrCode || "")
                setQrError(wa.qrError || "")
            }

            // Fetch Rules
            const systemSettings = await apiRequest<Record<string, string>>("/settings")
            if (systemSettings && systemSettings.telemetry_alarm_rules) {
                try {
                    const parsed = JSON.parse(systemSettings.telemetry_alarm_rules)
                    setRules(Array.isArray(parsed) ? parsed : [])
                } catch (e) {
                    setRules([])
                }
            }
            const [chatRows, automationRows] = await Promise.all([
                apiRequest<any[]>("/settings/whatsapp/chats").catch(() => []),
                apiRequest<AutomationRule[]>("/settings/whatsapp/automation").catch(() => [])
            ])
            setChats(Array.isArray(chatRows) ? chatRows : [])
            setAutomationRules(Array.isArray(automationRows) ? automationRows : [])
        } catch (e) {
            toast.error("Failed to load notification settings")
        } finally {
            setLoadingRules(false)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    // Keep the inbox synchronized with messages received by the background
    // WhatsApp client. Sending already refreshed the list, but inbound messages
    // arrive independently of any browser action.
    useEffect(() => {
        let cancelled = false
        const refreshInbox = async () => {
            if (cancelled || inboxPollBusy.current || (typeof document !== "undefined" && document.hidden)) return
            inboxPollBusy.current = true
            try {
                const [chatRows, messageRows] = await Promise.all([
                    apiRequest<any[]>("/settings/whatsapp/chats", { suppressToast: true }),
                    selectedPhone
                        ? apiRequest<any[]>(`/settings/whatsapp/chats/${encodeURIComponent(selectedPhone)}/messages`, { suppressToast: true })
                        : Promise.resolve(null),
                ])
                if (cancelled) return
                setChats(Array.isArray(chatRows) ? chatRows : [])
                if (messageRows !== null) setMessages(Array.isArray(messageRows) ? messageRows : [])
            } catch {
                // Connection/status errors are already shown by the WhatsApp setup;
                // background inbox polling should remain quiet and retry.
            } finally {
                inboxPollBusy.current = false
            }
        }
        refreshInbox()
        const interval = window.setInterval(refreshInbox, 3000)
        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [selectedPhone])

    useEffect(() => {
        const list = messageListRef.current
        if (list) list.scrollTop = list.scrollHeight
    }, [selectedPhone, messages.length])

    // Poll QR Session state if QR is connecting or ready
    useEffect(() => {
        let interval: any
        if (provider === "QR" && (qrState === "QR_READY" || qrState === "CONNECTING")) {
            interval = setInterval(async () => {
                try {
                    const wa = await apiRequest<any>("/settings/whatsapp")
                    if (wa) {
                        setQrState(wa.qrState)
                        setQrCode(wa.qrCode || "")
                        setQrError(wa.qrError || "")
                        if (wa.qrState === "CONNECTED") {
                            toast.success("WhatsApp QR Session successfully connected!")
                            clearInterval(interval)
                        }
                    }
                } catch (e) {}
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [provider, qrState])

    // Save Meta configs
    const saveWhatsAppConfig = async () => {
        setSavingWhatsApp(true)
        try {
            await apiRequest("/settings/whatsapp", {
                method: "POST",
                body: JSON.stringify({
                    provider,
                    metaPhoneId,
                    metaAccountId,
                    metaToken
                })
            })
            toast.success("WhatsApp Gateway settings updated successfully!")
        } catch (err: any) {
            toast.error(err.message || "Failed to update WhatsApp settings")
        } finally {
            setSavingWhatsApp(false)
        }
    }

    // Unofficial QR actions
    const connectQr = async () => {
        setLoadingQr(true)
        setQrState("CONNECTING")
        try {
            const data = await apiRequest<any>("/settings/whatsapp/qr/generate", { method: "POST" })
            setQrState(data.state)
            setQrCode(data.qrCode)
            toast.success("QR Code generated. Scan to authenticate.")
        } catch (err: any) {
            toast.error(err.message || "Failed to generate QR Code")
            setQrState("DISCONNECTED")
        } finally {
            setLoadingQr(false)
        }
    }

    const disconnectQr = async () => {
        setLoadingQr(true)
        try {
            await apiRequest("/settings/whatsapp/qr/disconnect", { method: "POST" })
            setQrState("DISCONNECTED")
            setQrCode("")
            toast.success("WhatsApp session disconnected successfully.")
        } catch (err: any) {
            toast.error(err.message || "Failed to disconnect session")
        } finally {
            setLoadingQr(false)
        }
    }

    // Save alarm rules to settings
    const saveRulesConfig = async (nextRules: AlarmRule[]) => {
        setSavingRules(true)
        try {
            await apiRequest("/settings", {
                method: "POST",
                body: JSON.stringify({
                    key: "telemetry_alarm_rules",
                    value: JSON.stringify(nextRules),
                    description: "Rule-based telemetry triggers and cooldown notification configurations"
                })
            })
            setRules(nextRules)
            toast.success("Alarm rules configuration updated!")
            return true
        } catch (err: any) {
            toast.error(err.message || "Failed to save alarm rules")
            return false
        } finally {
            setSavingRules(false)
        }
    }

    const resetRuleForm = () => {
        setShowAddForm(false)
        setEditingRuleId(null)
        setNewRule({ name: "", metric: "cpuLoadPercent", operator: "gt", value: "90", cooldownMinutes: 15, channels: ["Email"], recipients: "", enabled: true })
    }

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newRule.name.trim()) return
        if (!newRule.channels.length) return toast.error("Select at least one alert channel")
        const updated: AlarmRule[] = editingRuleId
            ? rules.map(rule => rule.id === editingRuleId ? { ...newRule, id: editingRuleId } : rule)
            : [...rules, { ...newRule, id: `rule_${Date.now()}` }]
        if (await saveRulesConfig(updated)) resetRuleForm()
    }

    const editRule = (rule: AlarmRule) => {
        setEditingRuleId(rule.id)
        setNewRule({ name: rule.name, metric: rule.metric, operator: rule.operator, value: rule.value, cooldownMinutes: rule.cooldownMinutes, channels: [...rule.channels], recipients: rule.recipients, enabled: rule.enabled })
        setShowAddForm(true)
    }

    const handleDeleteRule = async (id: string) => {
        const accepted = await confirm({ title: "Delete alarm rule?", message: "This telemetry rule will stop sending alerts immediately.", type: "danger", confirmText: "Delete Rule" })
        if (!accepted) return
        const updated = rules.filter(r => r.id !== id)
        await saveRulesConfig(updated)
        if (editingRuleId === id) resetRuleForm()
    }

    const toggleRuleEnabled = (id: string, current: boolean) => {
        const updated = rules.map(r => r.id === id ? { ...r, enabled: !current } : r)
        saveRulesConfig(updated)
    }

    const handleChannelChange = (channel: string, checked: boolean) => {
        setNewRule(prev => {
            const list = checked ? [...prev.channels, channel] : prev.channels.filter(c => c !== channel)
            return { ...prev, channels: list }
        })
    }

    const openChat = async (phone: string) => {
        setSelectedPhone(phone)
        try {
            const rows = await apiRequest<any[]>(`/settings/whatsapp/chats/${encodeURIComponent(phone)}/messages`)
            setMessages(Array.isArray(rows) ? rows : [])
            setChats(prev => prev.map(chat => chat.phone === phone ? { ...chat, unreadCount: 0 } : chat))
        } catch (error: any) { toast.error(error.message || "Failed to load messages") }
    }

    const sendChat = async () => {
        if (!selectedPhone || !chatBody.trim()) return
        setSendingChat(true)
        try {
            await apiRequest(`/settings/whatsapp/chats/${encodeURIComponent(selectedPhone)}/messages`, { method: "POST", body: JSON.stringify({ body: chatBody }) })
            setChatBody("")
            await openChat(selectedPhone)
            const nextChats = await apiRequest<any[]>("/settings/whatsapp/chats")
            setChats(Array.isArray(nextChats) ? nextChats : [])
        } catch (error: any) { toast.error(error.message || "Failed to send WhatsApp message") }
        finally { setSendingChat(false) }
    }

    const saveAutomation = async (event: React.FormEvent) => {
        event.preventDefault()
        setSavingAutomation(true)
        try {
            await apiRequest("/settings/whatsapp/automation", { method: "POST", body: JSON.stringify({ ...automationForm, keywords: automationForm.keywords.split(",").map(item => item.trim()).filter(Boolean) }) })
            const rows = await apiRequest<AutomationRule[]>("/settings/whatsapp/automation")
            setAutomationRules(Array.isArray(rows) ? rows : [])
            setAutomationForm({ name: "", triggerType: "KEYWORD", keywords: "", response: "", priority: 100, businessHoursOnly: false })
            toast.success("WhatsApp automation rule saved")
        } catch (error: any) { toast.error(error.message || "Failed to save automation") }
        finally { setSavingAutomation(false) }
    }

    const deleteAutomation = async (id: number) => {
        const accepted = await confirm({ title: "Delete automation rule?", message: "Messages matching this rule will no longer receive an automatic reply.", type: "danger", confirmText: "Delete Rule" })
        if (!accepted) return
        try {
            await apiRequest(`/settings/whatsapp/automation/${id}`, { method: "DELETE" })
            setAutomationRules(prev => prev.filter(rule => rule.id !== id))
        } catch (error: any) { toast.error(error.message || "Failed to delete automation") }
    }

    const toggleAutomation = async (rule: AutomationRule) => {
        try {
            const updated = await apiRequest<AutomationRule>("/settings/whatsapp/automation", { method: "POST", body: JSON.stringify({ ...rule, enabled: !rule.enabled }) })
            setAutomationRules(prev => prev.map(item => item.id === rule.id ? updated : item))
        } catch (error: any) { toast.error(error.message || "Failed to update automation") }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WhatsApp Integration Panel */}
            <CardContainer title="WhatsApp Messaging Integration" description="Configure Meta WhatsApp Business API or scan QR Code for Unofficial Session">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>WhatsApp Provider</Label>
                        <Select value={provider} onValueChange={(v: any) => { setProvider(v); apiRequest("/settings/whatsapp", { method: "POST", body: JSON.stringify({ provider: v }) }) }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="META">Official Meta Cloud API (Recommended)</SelectItem>
                                <SelectItem value="QR">Unofficial QR Code Scan (Node Session)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {provider === "META" ? (
                        <div className="space-y-4 border-t pt-4 border-border">
                            <div className="space-y-2">
                                <Label>Phone Number ID</Label>
                                <Input value={metaPhoneId} onChange={e => setMetaPhoneId(e.target.value)} placeholder="e.g. 104829302839201" />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp Business Account ID</Label>
                                <Input value={metaAccountId} onChange={e => setMetaAccountId(e.target.value)} placeholder="e.g. 948293829023849" />
                            </div>
                            <div className="space-y-2">
                                <Label>Permanent Access Token</Label>
                                <Input type="password" value={metaToken} onChange={e => setMetaToken(e.target.value)} placeholder="EAAG..." />
                            </div>
                            <Button onClick={saveWhatsAppConfig} disabled={savingWhatsApp} className="w-full flex items-center justify-center gap-2">
                                {savingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Gateway Credentials
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 border-t pt-4 border-border text-center">
                            <div className="flex justify-center items-center gap-2 mb-2">
                                <span className={`h-3 w-3 rounded-full ${qrState === "CONNECTED" ? "bg-emerald-500 animate-pulse" : qrState === "QR_READY" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`} />
                                <span className="text-sm font-semibold uppercase tracking-wider">{qrState.replace("_", " ")}</span>
                            </div>

                            {qrState === "DISCONNECTED" && (
                                <div className="py-6 space-y-3">
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">Generate a live WhatsApp Web session, then scan its QR code from WhatsApp → Linked Devices.</p>
                                    <Button onClick={connectQr} disabled={loadingQr} className="w-full max-w-xs mx-auto flex items-center justify-center gap-2">
                                        {loadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                                        Generate Session QR Code
                                    </Button>
                                </div>
                            )}

                            {qrState === "CONNECTING" && (
                                <div className="py-10 space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    <p className="text-sm text-muted-foreground">Initializing socket environment...</p>
                                </div>
                            )}

                            {qrState === "QR_READY" && qrCode && (
                                <div className="py-4 space-y-4">
                                    <div className="p-3 border inline-block rounded-lg bg-white shadow-sm max-w-[200px] mx-auto">
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-[180px] h-[180px] object-contain" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">Waiting for a real scan from WhatsApp Linked Devices.</p>
                                        <div className="flex justify-center gap-2">
                                            <Button variant="outline" size="sm" onClick={connectQr} disabled={loadingQr} className="flex items-center gap-1 text-xs">
                                                <RefreshCw className="h-3 w-3" /> Refresh QR
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {qrState === "CONNECTED" && (
                                <div className="py-8 space-y-4 max-w-md mx-auto">
                                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-700 text-left">
                                        <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold">Gateway Connected</h4>
                                            <p className="text-xs text-emerald-600/90 mt-0.5">Device session is online and listening. Alert notification routing is active.</p>
                                        </div>
                                    </div>
                                    <Button variant="destructive" onClick={disconnectQr} disabled={loadingQr} className="w-full flex items-center justify-center gap-2">
                                        <Power className="h-4 w-4" /> Disconnect Session
                                    </Button>
                                </div>
                            )}
                            {qrState === "ERROR" && (
                                <div className="py-6 space-y-3 text-center">
                                    <p className="text-sm font-semibold text-destructive">WhatsApp session failed to start</p>
                                    <p className="text-xs text-muted-foreground break-words">{qrError || "Ensure the WhatsApp Web Chromium dependencies are installed, then retry."}</p>
                                    <Button onClick={connectQr} disabled={loadingQr}>Retry Session</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContainer>

            {/* Telemetry Trigger Rules Panel */}
            <CardContainer title="Rule-Based Telemetry Alarms" description="Trigger email/sms/whatsapp alerts when CPU, Memory, or connectivity thresholds are crossed">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="font-semibold text-sm">Configured Alarm Rules</Label>
                        {!showAddForm && (
                            <Button size="sm" onClick={() => { setEditingRuleId(null); setShowAddForm(true) }} className="flex items-center gap-1">
                                <Plus className="h-3.5 w-3.5" /> Add Rule
                            </Button>
                        )}
                    </div>

                    {showAddForm && (
                        <form onSubmit={handleAddRule} className="border p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-border space-y-3">
                            <div className="text-sm font-semibold">{editingRuleId ? "Edit Alarm Rule" : "Add Alarm Rule"}</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs">Alarm Name</Label>
                                    <Input value={newRule.name} onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Critical BNG CPU" required />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Metric</Label>
                                    <Select value={newRule.metric} onValueChange={v => setNewRule(prev => ({ ...prev, metric: v }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cpuLoadPercent">CPU Load %</SelectItem>
                                            <SelectItem value="memoryUtilizationPercent">Memory Utilization %</SelectItem>
                                            <SelectItem value="maximumTemperatureC">Temperature °C</SelectItem>
                                            <SelectItem value="status">Offline / Failure Status</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Operator</Label>
                                    <Select value={newRule.operator} onValueChange={v => setNewRule(prev => ({ ...prev, operator: v }))} disabled={newRule.metric === "status"}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gt">Greater Than</SelectItem>
                                            <SelectItem value="lt">Less Than</SelectItem>
                                            <SelectItem value="eq">Equals</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Threshold Value</Label>
                                    <Input value={newRule.value} onChange={e => setNewRule(prev => ({ ...prev, value: e.target.value }))} placeholder="90" disabled={newRule.metric === "status"} required />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Cooldown (min)</Label>
                                    <Input type="number" value={newRule.cooldownMinutes} onChange={e => setNewRule(prev => ({ ...prev, cooldownMinutes: Number(e.target.value) }))} required />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs">Alert Recipients</Label>
                                    <Input value={newRule.recipients} onChange={e => setNewRule(prev => ({ ...prev, recipients: e.target.value }))} placeholder="Email address, phone number, etc." required />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-xs">Channels</Label>
                                    <div className="flex gap-4">
                                        {["Email", "SMS", "WhatsApp"].map(ch => (
                                            <label key={ch} className="flex items-center gap-1.5 text-xs cursor-pointer font-medium">
                                                <input type="checkbox" checked={newRule.channels.includes(ch)} onChange={e => handleChannelChange(ch, e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5" />
                                                {ch}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={resetRuleForm}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={savingRules}>{savingRules && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}{editingRuleId ? "Update Rule" : "Save Rule"}</Button>
                            </div>
                        </form>
                    )}

                    {loadingRules ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl p-4">No alarm rules configured yet. Click Add Rule above.</div>
                    ) : (
                        <div className="space-y-2 max-h-[350px] overflow-auto">
                            {rules.map(rule => (
                                <div key={rule.id} className="p-3 border border-border rounded-xl bg-card flex justify-between items-start text-xs">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-sm flex items-center gap-1.5">
                                            {rule.name}
                                            <span className={`h-1.5 w-1.5 rounded-full ${rule.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                                        </div>
                                        <div className="text-muted-foreground space-y-0.5">
                                            <div>Trigger: <span className="font-medium text-foreground capitalize">{rule.metric.replace(/([A-Z])/g, ' $1')}</span> {rule.metric !== "status" ? `${rule.operator === "gt" ? ">" : rule.operator === "lt" ? "<" : "="} ${rule.value}` : "is Offline/Failure"}</div>
                                            <div>Channels: <span className="font-medium text-foreground">{rule.channels.join(", ")}</span></div>
                                            <div>Recipients: <span className="font-medium text-foreground">{rule.recipients}</span></div>
                                            <div>Cooldown: <span className="font-medium text-foreground">{rule.cooldownMinutes} minutes</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Switch checked={rule.enabled} onCheckedChange={() => toggleRuleEnabled(rule.id, rule.enabled)} className="scale-75" />
                                        <Button variant="ghost" size="icon" onClick={() => editRule(rule)} className="h-7 w-7 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/20" aria-label={`Edit ${rule.name}`}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContainer>

            <div className="lg:col-span-2">
                <CardContainer title="WhatsApp Chat Inbox" description="View inbound conversations and reply through the connected provider">
                    <div className="grid h-[720px] min-h-0 grid-cols-1 grid-rows-[260px_minmax(0,1fr)] overflow-hidden rounded-xl border md:h-[560px] md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-1">
                        <div className="flex min-h-0 flex-col overflow-hidden border-b md:border-b-0 md:border-r">
                            <div className="border-b p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4" /> Conversations</div><div className="flex gap-1"><Input className="h-8 text-xs" value={newChatPhone} onChange={e => setNewChatPhone(e.target.value)} placeholder="Phone with country code" /><Button type="button" size="sm" className="h-8" onClick={() => { const phone = newChatPhone.replace(/[^0-9]/g, ""); if (phone) { setNewChatPhone(""); openChat(phone) } }}>New</Button></div></div>
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                                {chats.length === 0 ? <p className="p-6 text-center text-xs text-muted-foreground">Incoming and outgoing chats will appear here.</p> : chats.map(chat => (
                                    <button key={chat.id} onClick={() => openChat(chat.phone)} className={`w-full border-b p-3 text-left hover:bg-muted/60 ${selectedPhone === chat.phone ? "bg-muted" : ""}`}>
                                        <div className="flex justify-between gap-2"><span className="text-sm font-semibold">+{chat.phone}</span>{chat.unreadCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{chat.unreadCount}</span>}</div>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                            {!selectedPhone ? <div className="m-auto text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-2 h-8 w-8" />Select a conversation</div> : <>
                                <div className="border-b p-3"><div className="text-sm font-semibold">{chats.find(chat => chat.phone === selectedPhone)?.displayName || `+${selectedPhone}`}</div>{chats.find(chat => chat.phone === selectedPhone)?.displayName && <div className="text-xs text-muted-foreground">+{selectedPhone}</div>}</div>
                                <div ref={messageListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-muted/20 p-4">
                                    {messages.length === 0 ? <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No messages in this conversation yet.</div> : messages.map(message => <div key={message.id} className={`flex ${message.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm ${message.direction === "OUTBOUND" ? "bg-primary text-primary-foreground" : "border bg-card"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><div className={`mt-1 flex items-center gap-1 text-[10px] ${message.direction === "OUTBOUND" ? "justify-end opacity-75" : "text-muted-foreground"}`}><span>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>{message.automated && <span>· Automated</span>}{message.direction === "OUTBOUND" && message.status && <span>· {String(message.status).toLowerCase()}</span>}</div></div></div>)}
                                </div>
                                <div className="flex gap-2 border-t p-3"><Input value={chatBody} onChange={e => setChatBody(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendChat() }} placeholder="Type a WhatsApp message" /><Button onClick={sendChat} disabled={sendingChat || !chatBody.trim()}>{sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div>
                            </>}
                        </div>
                    </div>
                </CardContainer>
            </div>

            <div className="lg:col-span-2">
                <CardContainer title="WhatsApp Chat Automation" description="Automatically reply to exact phrases, keywords, or unmatched messages">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <form onSubmit={saveAutomation} className="space-y-3 rounded-xl border p-4">
                            <div className="flex items-center gap-2 font-semibold"><Bot className="h-4 w-4" /> Add automation rule</div>
                            <div className="grid grid-cols-2 gap-3"><div className="col-span-2 space-y-1"><Label>Name</Label><Input required value={automationForm.name} onChange={e => setAutomationForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Greeting reply" /></div><div className="space-y-1"><Label>Trigger</Label><Select value={automationForm.triggerType} onValueChange={value => setAutomationForm(prev => ({ ...prev, triggerType: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="KEYWORD">Contains keyword</SelectItem><SelectItem value="EXACT">Exact message</SelectItem><SelectItem value="DEFAULT">Default fallback</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Priority</Label><Input type="number" value={automationForm.priority} onChange={e => setAutomationForm(prev => ({ ...prev, priority: Number(e.target.value) }))} /></div></div>
                            {automationForm.triggerType !== "DEFAULT" && <div className="space-y-1"><Label>Keywords (comma separated)</Label><Input required value={automationForm.keywords} onChange={e => setAutomationForm(prev => ({ ...prev, keywords: e.target.value }))} placeholder="hello, support, help" /></div>}
                            <div className="space-y-1"><Label>Automatic response</Label><Input required value={automationForm.response} onChange={e => setAutomationForm(prev => ({ ...prev, response: e.target.value }))} placeholder="Thanks for messaging us..." /></div>
                            <label className="flex items-center gap-2 text-sm"><Switch checked={automationForm.businessHoursOnly} onCheckedChange={checked => setAutomationForm(prev => ({ ...prev, businessHoursOnly: checked }))} />Business hours only (09:00–18:00)</label>
                            <Button type="submit" disabled={savingAutomation}>{savingAutomation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save automation</Button>
                        </form>
                        <div className="space-y-2">
                            {automationRules.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No automation rules configured.</div> : automationRules.map(rule => <div key={rule.id} className="flex items-start justify-between rounded-xl border p-3"><div><div className="font-semibold">{rule.name}</div><p className="text-xs text-muted-foreground">{rule.triggerType} · priority {rule.priority}{rule.keywords?.length ? ` · ${rule.keywords.join(", ")}` : ""}</p><p className="mt-1 text-sm">{rule.response}</p></div><div className="flex items-center gap-1"><Switch checked={rule.enabled} onCheckedChange={() => toggleAutomation(rule)} /><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAutomation(rule.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}
                        </div>
                    </div>
                </CardContainer>
            </div>
            <ConfirmDialog />
        </div>
    )
}
