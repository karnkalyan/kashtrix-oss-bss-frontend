"use client"

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, Loader2, PlugZap, RotateCcw, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DEVICE_TYPES, deviceApi, type CommunicationMethod, type DevicePayload, type DeviceProtocol, type DeviceType, type ManagedDevice } from '@/lib/device-management'

const recommended = (type: DeviceType, version?: string, restUrl?: string): DeviceProtocol =>
    type === 'mikrotik'
        ? (Number.parseInt(version || '0') >= 7 && restUrl ? 'ROUTEROS_REST' : 'ROUTEROS_API')
        : ['cisco', 'nokia-bng', 'nokia-olt', 'huawei-olt', 'vsol', 'cdata', 'bdcom', 'fortiget-firewall', 'alto-palo', 'sophos'].includes(type)
            ? 'AUTO'
            : 'SSH'

const legacyMethod = (protocol: DeviceProtocol, definition: typeof DEVICE_TYPES[DeviceType]): CommunicationMethod =>
    protocol === 'TELNET' ? 'telnet' : protocol === 'SSH' ? 'ssh' : ['AUTO', 'NETCONF', 'GNMI', 'SNMP'].includes(protocol) ? (definition.defaultMethod as CommunicationMethod) : 'web_api'

const blank = (type: DeviceType): DevicePayload => {
    const definition = DEVICE_TYPES[type]
    const preferredProtocol = recommended(type)
    return {
        name: '',
        displayName: '',
        deviceType: type,
        vendor: definition.vendor,
        host: '',
        managementPort: definition.defaultMethod === 'ssh' ? 22 : definition.defaultMethod === 'telnet' ? 23 : 443,
        communicationMethod: legacyMethod(preferredProtocol, definition),
        defaultCommunicationMethod: definition.defaultMethod as CommunicationMethod,
        protocolMode: 'AUTO',
        preferredProtocol,
        fallbackProtocols: type === 'mikrotik' ? ['ROUTEROS_API_TLS', 'ROUTEROS_API', 'SSH'] : ['SSH'],
        apiPort: type === 'mikrotik' ? 8728 : undefined,
        apiTlsPort: type === 'mikrotik' ? 8729 : undefined,
        restPort: 443,
        sshPort: 22,
        netconfPort: 830,
        sshProfile: 'AUTO',
        legacyCompatibilityEnabled: false,
        tlsEnabled: true,
        verifyTls: true,
        pollingEnabled: true,
        liveMonitoringEnabled: true,
        pollingInterval: 15,
        connectionTimeout: 20000,
        commandTimeout: 20000,
        retryCount: 2,
        reconnectEnabled: true,
        maxReconnectAttempts: 3,
        enabled: true,
        credentials: {}
    }
}

export function DeviceForm({ deviceType, device, onSaved, onCancel }: { deviceType: DeviceType; device?: ManagedDevice | null; onSaved: (device: ManagedDevice) => void; onCancel: () => void }) {
    const [form, setForm] = useState<DevicePayload>(blank(deviceType))
    const [initialSnapshot, setInitialSnapshot] = useState('')
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [tested, setTested] = useState(Boolean(device))
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Reference data populated from fleet
    const [referenceData, setReferenceData] = useState<{ vendors: string[]; models: string[]; platforms: string[]; sites: string[] }>({
        vendors: [],
        models: [],
        platforms: [],
        sites: []
    })

    useEffect(() => {
        const next = device ? ({ ...device, credentials: {} } as DevicePayload) : blank(deviceType)
        setForm(next)
        setInitialSnapshot(JSON.stringify(next))
        setTested(Boolean(device))
        setErrors({})
    }, [device, deviceType])

    useEffect(() => {
        // Fetch reference metadata from database
        deviceApi.list({ limit: 1000 }).then(res => {
            if (res.data?.items) {
                const items = res.data.items
                const vendors = Array.from(new Set(items.map((i: any) => i.vendor).filter(Boolean))) as string[]
                const models = Array.from(new Set(items.map((i: any) => i.model).filter(Boolean))) as string[]
                const platforms = Array.from(new Set(items.map((i: any) => i.platform).filter(Boolean))) as string[]
                const sites = Array.from(new Set(items.map((i: any) => i.site).filter(Boolean))) as string[]
                setReferenceData({ vendors, models, platforms, sites })
            }
        }).catch(() => {
            // Silently fall back to empty suggestions if list call fails or permission is limited
        })
    }, [deviceType])

    const dirty = Boolean(initialSnapshot) && JSON.stringify(form) !== initialSnapshot
    const credentials = useMemo(() => form.credentials || {}, [form.credentials])
    const protocol = form.preferredProtocol || 'AUTO'
    const isMikrotik = form.deviceType === 'mikrotik'
    const isCli = ['SSH', 'NETCONF', 'GNMI', 'AUTO'].includes(protocol)
    const isRest = ['ROUTEROS_REST', 'RESTCONF', 'VENDOR_API'].includes(protocol)
    const isApi = ['ROUTEROS_API', 'ROUTEROS_API_TLS'].includes(protocol)
    const isSnmp = protocol === 'SNMP' || (form.fallbackProtocols || []).includes('SNMP')
    const valid = Boolean(form.name.trim() && form.vendor.trim() && form.host.trim() && form.managementPort > 0)

    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (dirty) {
                event.preventDefault()
                event.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [dirty])

    const set = (key: string, value: any) => {
        setForm(current => key.startsWith('credentials.')
            ? { ...current, credentials: { ...current.credentials, [key.split('.')[1]]: value } }
            : { ...current, [key]: value }
        )
        setErrors(current => ({ ...current, [key]: '' }))
        setTested(false)
    }

    const setProtocol = (value: DeviceProtocol) => {
        set('preferredProtocol', value)
        set('communicationMethod', legacyMethod(value, DEVICE_TYPES[form.deviceType]))
        set('managementPort', value === 'SSH' ? form.sshPort || 22 : value === 'TELNET' ? 23 : value === 'ROUTEROS_API' ? form.apiPort || 8728 : value === 'ROUTEROS_API_TLS' ? form.apiTlsPort || 8729 : value === 'ROUTEROS_REST' ? form.restPort || 443 : form.managementPort)
    }

    const changeVersion = (value: string) => {
        set('operatingSystemVersion', value)
        if (isMikrotik && form.protocolMode !== 'MANUAL') {
            const next = recommended('mikrotik', value, form.restBaseUrl || form.apiBaseUrl)
            setProtocol(next)
        }
    }

    const test = async () => {
        try {
            setTesting(true)
            const response = device && !Object.values(credentials).some(Boolean)
                ? await deviceApi.test(device.id)
                : await deviceApi.testDraft(form)
            setTested(Boolean(response.data.connected))
            toast.success(`Connected using ${response.data.selectedProtocol || response.data.protocol || response.data.profile || 'the selected protocol'}`)
            return true
        } catch (error: any) {
            setTested(false)
            setErrors(Object.fromEntries((error.details || []).map((item: any) => [item.field, item.message])))
            toast.error(error.message || 'Connection failed')
            return false
        } finally {
            setTesting(false)
        }
    }

    const save = async (action: 'save' | 'test' | 'open' = 'save') => {
        if (!valid) {
            toast.error('Complete the required device name, vendor, host, and port fields.')
            return
        }
        if (action === 'test' && !(await test())) return
        try {
            setSaving(true)
            const response = device ? await deviceApi.update(device.id, form) : await deviceApi.create(form)
            setInitialSnapshot(JSON.stringify(form))
            toast.success(device ? 'Device updated' : 'Device added')
            onSaved(response.data)
            if (action === 'open') {
                window.open(`/network/devices/${response.data.id}`, '_blank', 'noopener,noreferrer')
            }
        } catch (error: any) {
            setErrors(Object.fromEntries((error.details || []).map((item: any) => [item.field, item.message])))
            toast.error(error.message || 'Could not save device')
        } finally {
            setSaving(false)
        }
    }

    const reset = () => {
        const next = device ? ({ ...device, credentials: {} } as DevicePayload) : blank(deviceType)
        setForm(next)
        setErrors({})
        setTested(Boolean(device))
    }

    return (
        <div className="space-y-6">
            <Section title="Device identity">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Device name" error={errors.name}>
                        <Input value={form.name} onChange={e => set('name', e.target.value)} />
                    </Field>
                    <Field label="Display name">
                        <Input value={form.displayName || ''} onChange={e => set('displayName', e.target.value)} />
                    </Field>
                    <Field label="Vendor">
                        <Input list="vendors-ref-list" value={form.vendor} onChange={e => set('vendor', e.target.value)} />
                    </Field>
                    <Field label="Device type">
                        <Input value={DEVICE_TYPES[form.deviceType].label} disabled />
                    </Field>
                    <Field label="Platform">
                        <Input list="platforms-ref-list" value={form.platform || ''} onChange={e => set('platform', e.target.value)} />
                    </Field>
                    <Field label="Model">
                        <Input list="models-ref-list" value={form.model || ''} onChange={e => set('model', e.target.value)} />
                    </Field>
                    <Field label="Operating system">
                        <Input value={form.operatingSystem || ''} placeholder={isMikrotik ? 'RouterOS' : ''} onChange={e => set('operatingSystem', e.target.value)} />
                    </Field>
                    <Field label="Operating-system version">
                        <Input value={form.operatingSystemVersion || ''} placeholder={isMikrotik ? '6.49 or 7.16' : ''} onChange={e => changeVersion(e.target.value)} />
                    </Field>
                    <Field label="Firmware version">
                        <Input value={form.firmwareVersion || ''} onChange={e => set('firmwareVersion', e.target.value)} />
                    </Field>
                </div>
            </Section>

            <Section title="Protocol-aware management">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Management IP or hostname" error={errors.host}>
                        <Input value={form.host} onChange={e => set('host', e.target.value)} />
                    </Field>
                    <Field label="Management port" error={errors.managementPort}>
                        <Input type="number" value={form.managementPort} onChange={e => set('managementPort', Number(e.target.value))} />
                    </Field>
                    <Field label="Protocol mode">
                        <Select value={form.protocolMode || 'AUTO'} onValueChange={value => set('protocolMode', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AUTO">Automatic (recommended)</SelectItem>
                                <SelectItem value="MANUAL">Manual</SelectItem>
                                <SelectItem value="DISABLED">Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Preferred protocol">
                        <Select value={protocol} onValueChange={value => setProtocol(value as DeviceProtocol)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {protocolOptions(form.deviceType).map(value => (
                                    <SelectItem key={value} value={value}>
                                        {value.replaceAll('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Fallback order">
                        <Input value={(form.fallbackProtocols || []).join(', ')} onChange={e => set('fallbackProtocols', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} />
                    </Field>
                    <Field label="Site">
                        <Input list="sites-ref-list" value={form.site || ''} onChange={e => set('site', e.target.value)} />
                    </Field>
                </div>

                {protocol === 'TELNET' && (
                    <div className="mt-4 flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
                        <AlertTriangle className="size-5 shrink-0" />
                        Telnet is unencrypted and is used only when explicitly selected for isolated legacy equipment.
                    </div>
                )}

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {(isApi || isMikrotik) && (
                        <>
                            <Field label="RouterOS API port" error={errors.apiPort}>
                                <Input type="number" value={form.apiPort || 8728} onChange={e => set('apiPort', Number(e.target.value))} />
                            </Field>
                            <Field label="RouterOS API TLS port">
                                <Input type="number" value={form.apiTlsPort || 8729} onChange={e => set('apiTlsPort', Number(e.target.value))} />
                            </Field>
                        </>
                    )}
                    {(isRest || isMikrotik) && (
                        <>
                            <Field label="REST base URL">
                                <Input placeholder="https://device/rest" value={form.restBaseUrl || form.apiBaseUrl || ''} onChange={e => { set('restBaseUrl', e.target.value); set('apiBaseUrl', e.target.value) }} />
                            </Field>
                            <Field label="REST port">
                                <Input type="number" value={form.restPort || 443} onChange={e => set('restPort', Number(e.target.value))} />
                            </Field>
                        </>
                    )}
                    <Field label="SSH port">
                        <Input type="number" value={form.sshPort || 22} onChange={e => set('sshPort', Number(e.target.value))} />
                    </Field>
                    {['AUTO', 'NETCONF'].includes(protocol) && (
                        <Field label="NETCONF port">
                            <Input type="number" value={form.netconfPort || 830} onChange={e => set('netconfPort', Number(e.target.value))} />
                        </Field>
                    )}
                    {['AUTO', 'GNMI'].includes(protocol) && (
                        <Field label="gNMI endpoint">
                            <Input value={form.gnmiEndpoint || ''} onChange={e => set('gnmiEndpoint', e.target.value)} />
                        </Field>
                    )}
                    {isSnmp && (
                        <>
                            <Field label="SNMP port">
                                <Input type="number" value={form.snmpPort || 161} onChange={e => set('snmpPort', Number(e.target.value))} />
                            </Field>
                            <Field label="SNMP version">
                                <Select value={form.snmpVersion || 'v2c'} onValueChange={value => set('snmpVersion', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="v1">v1</SelectItem>
                                        <SelectItem value="v2c">v2c</SelectItem>
                                        <SelectItem value="v3">v3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </>
                    )}
                </div>
            </Section>

            <Section title="Encrypted credentials">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {(isRest || isApi || protocol === 'AUTO') && (
                        <>
                            <Field label="API username">
                                <Input value={credentials.apiUsername || ''} onChange={e => set('credentials.apiUsername', e.target.value)} />
                            </Field>
                            <Field label="API password / token">
                                <Input type="password" placeholder={device?.credential?.configured ? 'Leave blank to keep stored secret' : ''} value={credentials.apiPassword || ''} onChange={e => set('credentials.apiPassword', e.target.value)} />
                            </Field>
                        </>
                    )}
                    {isCli && (
                        <>
                            <Field label="SSH username">
                                <Input value={credentials.sshUsername || ''} onChange={e => set('credentials.sshUsername', e.target.value)} />
                            </Field>
                            <Field label="SSH password">
                                <Input type="password" placeholder={device?.credential?.configured ? 'Leave blank to keep stored secret' : ''} value={credentials.sshPassword || ''} onChange={e => set('credentials.sshPassword', e.target.value)} />
                            </Field>
                            <Field label="Enable password">
                                <Input type="password" value={credentials.enablePassword || ''} onChange={e => set('credentials.enablePassword', e.target.value)} />
                            </Field>
                            <Field label="Private key">
                                <Textarea value={credentials.sshPrivateKey || ''} onChange={e => set('credentials.sshPrivateKey', e.target.value)} />
                            </Field>
                        </>
                    )}
                    {isSnmp && (form.snmpVersion || 'v2c') !== 'v3' && (
                        <Field label="SNMP community">
                            <Input type="password" autoComplete="new-password" placeholder={device?.credential?.kinds?.includes('snmpCommunity') ? 'Leave blank to keep stored community' : 'Read-only community'} value={credentials.snmpCommunity || ''} onChange={e => set('credentials.snmpCommunity', e.target.value)} />
                        </Field>
                    )}
                    {isSnmp && form.snmpVersion === 'v3' && (
                        <>
                            <Field label="SNMPv3 username">
                                <Input value={credentials.snmpUsername || ''} onChange={e => set('credentials.snmpUsername', e.target.value)} />
                            </Field>
                            <Field label="SNMPv3 security">
                                <Select value={credentials.snmpSecurityLevel || 'authPriv'} onValueChange={value => set('credentials.snmpSecurityLevel', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="noAuthNoPriv">No auth / no privacy</SelectItem>
                                        <SelectItem value="authNoPriv">Auth / no privacy</SelectItem>
                                        <SelectItem value="authPriv">Auth / privacy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {credentials.snmpSecurityLevel !== 'noAuthNoPriv' && (
                                <>
                                    <Field label="Authentication protocol">
                                        <Select value={credentials.snmpAuthProtocol || 'sha'} onValueChange={value => set('credentials.snmpAuthProtocol', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sha">SHA</SelectItem>
                                                <SelectItem value="md5">MD5 (legacy)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Authentication password">
                                        <Input type="password" placeholder={device?.credential?.kinds?.includes('snmpAuthPassword') ? 'Leave blank to keep stored secret' : ''} value={credentials.snmpAuthPassword || ''} onChange={e => set('credentials.snmpAuthPassword', e.target.value)} />
                                    </Field>
                                </>
                            )}
                            {(credentials.snmpSecurityLevel || 'authPriv') === 'authPriv' && (
                                <>
                                    <Field label="Privacy protocol">
                                        <Select value={credentials.snmpPrivProtocol || 'aes'} onValueChange={value => set('credentials.snmpPrivProtocol', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="aes">AES</SelectItem>
                                                <SelectItem value="des">DES (legacy)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Privacy password">
                                        <Input type="password" placeholder={device?.credential?.kinds?.includes('snmpPrivPassword') ? 'Leave blank to keep stored secret' : ''} value={credentials.snmpPrivPassword || ''} onChange={e => set('credentials.snmpPrivPassword', e.target.value)} />
                                    </Field>
                                </>
                            )}
                            <Field label="SNMP context">
                                <Input value={credentials.snmpContext || ''} onChange={e => set('credentials.snmpContext', e.target.value)} />
                            </Field>
                        </>
                    )}
                    <Field label="SSH algorithm profile">
                        <Select value={form.sshProfile || 'AUTO'} onValueChange={value => set('sshProfile', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['AUTO', 'modern', 'cisco-modern', 'cisco-legacy', 'mikrotik', 'nokia-sros', 'nokia-olt', 'huawei', 'vsol', 'cdata', 'generic-legacy'].map(value => (
                                    <SelectItem key={value} value={value}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
                <div className="mt-4 flex flex-wrap gap-6">
                    <Toggle label="Verify TLS certificate" checked={form.verifyTls !== false} onChange={v => set('verifyTls', v)} />
                    <Toggle label="Device-specific legacy SSH fallback" checked={Boolean(form.legacyCompatibilityEnabled)} onChange={v => set('legacyCompatibilityEnabled', v)} />
                </div>
            </Section>

            <Section title="Monitoring and lifecycle">
                <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Dashboard refresh (seconds)">
                        <Input type="number" value={form.pollingInterval || 15} onChange={e => set('pollingInterval', Number(e.target.value))} />
                    </Field>
                    <Field label="Connection timeout (ms)">
                        <Input type="number" value={form.connectionTimeout || 20000} onChange={e => set('connectionTimeout', Number(e.target.value))} />
                    </Field>
                    <Field label="Command timeout (ms)">
                        <Input type="number" value={form.commandTimeout || 20000} onChange={e => set('commandTimeout', Number(e.target.value))} />
                    </Field>
                </div>
                <Field label="Description">
                    <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} />
                </Field>
                <div className="flex flex-wrap gap-6">
                    <Toggle label="Enabled" checked={form.enabled !== false} onChange={v => set('enabled', v)} />
                    <Toggle label="Live monitoring" checked={form.liveMonitoringEnabled !== false} onChange={v => set('liveMonitoringEnabled', v)} />
                    <Toggle label="Reconnect automatically" checked={form.reconnectEnabled !== false} onChange={v => set('reconnectEnabled', v)} />
                </div>
            </Section>

            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={reset} disabled={!dirty}>
                    <RotateCcw className="mr-2 size-4" />Reset
                </Button>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button variant="outline" onClick={test} disabled={testing || !valid}>
                    {testing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <PlugZap className="mr-2 size-4" />}Test connection
                </Button>
                <Button onClick={() => save('save')} disabled={saving || !valid}>
                    {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}Save {device ? 'changes' : 'device'}
                </Button>
                <Button variant="secondary" onClick={() => save('test')} disabled={saving || testing || !valid}>
                    Save and test
                </Button>
                <Button variant="secondary" onClick={() => save('open')} disabled={saving || !valid}>
                    <ExternalLink className="mr-2 size-4" />Save and open
                </Button>
            </div>
            {tested && <p className="text-right text-xs text-emerald-600">The current connection settings passed a read-only test.</p>}

            {/* Reference Dropdown Datalists */}
            <datalist id="vendors-ref-list">
                {referenceData.vendors.map(v => <option key={v} value={v} />)}
            </datalist>
            <datalist id="models-ref-list">
                {referenceData.models.map(m => <option key={m} value={m} />)}
            </datalist>
            <datalist id="platforms-ref-list">
                {referenceData.platforms.map(p => <option key={p} value={p} />)}
            </datalist>
            <datalist id="sites-ref-list">
                {referenceData.sites.map(s => <option key={s} value={s} />)}
            </datalist>
        </div>
    )
}

function protocolOptions(type: DeviceType): DeviceProtocol[] {
    if (type === 'mikrotik') return ['AUTO', 'ROUTEROS_REST', 'ROUTEROS_API_TLS', 'ROUTEROS_API', 'SSH', 'SNMP']
    if (type === 'cisco') return ['AUTO', 'RESTCONF', 'NETCONF', 'GNMI', 'VENDOR_API', 'SSH', 'SNMP', 'TELNET']
    if (['nokia-bng', 'huawei-olt'].includes(type)) return ['AUTO', 'GNMI', 'NETCONF', 'RESTCONF', 'VENDOR_API', 'SSH', 'SNMP']
    if (['juniper-switch', 'juniper-bras'].includes(type)) return ['AUTO', 'NETCONF', 'GNMI', 'SSH', 'SNMP']
    if (['nokia-olt', 'vsol', 'cdata', 'bdcom'].includes(type)) return ['AUTO', 'VENDOR_API', 'NETCONF', 'SSH', 'SNMP', 'TELNET']
    if (['fortiget-firewall', 'alto-palo', 'sophos'].includes(type)) return ['AUTO', 'VENDOR_API', 'RESTCONF', 'SSH', 'SNMP']
    return ['AUTO', 'SSH', 'SNMP']
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <fieldset className="space-y-4 rounded-xl border p-4 bg-card shadow-sm border-border">
            <legend className="px-2 font-semibold text-sm text-primary">{title}</legend>
            {children}
        </fieldset>
    )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <div className="flex items-center gap-2">
            <Switch checked={checked} onCheckedChange={onChange} />
            <Label className="text-xs font-medium text-foreground">{label}</Label>
        </div>
    )
}
