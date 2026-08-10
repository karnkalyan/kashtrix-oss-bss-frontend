import { apiRequest } from "@/lib/api"

export const DEVICE_TYPES = {
  mikrotik:{label:"MikroTik RouterOS",vendor:"MikroTik",defaultMethod:"web_api"},
  cisco:{label:"Cisco IOS",vendor:"Cisco",defaultMethod:"ssh"},
  "huawei-olt":{label:"Huawei OLT",vendor:"Huawei",defaultMethod:"ssh"},
  "nokia-bng":{label:"Nokia BNG",vendor:"Nokia",defaultMethod:"ssh"},
  bdcom:{label:"BDCOM OLT",vendor:"BDCOM",defaultMethod:"telnet"},
  cdata:{label:"C-Data OLT",vendor:"CDATA",defaultMethod:"telnet"},
  vsol:{label:"VSOL OLT",vendor:"VSOL",defaultMethod:"web_api"},
  "nokia-olt":{label:"Nokia OLT",vendor:"Nokia",defaultMethod:"ssh"},
  "fortiget-firewall":{label:"Fortinet FortiGate",vendor:"Fortinet",defaultMethod:"web_api"},
  "alto-palo":{label:"Palo Alto Networks",vendor:"Palo Alto",defaultMethod:"web_api"},
  sophos:{label:"Sophos Firewall",vendor:"Sophos",defaultMethod:"web_api"},
  "linux-server":{label:"Linux Server",vendor:"Linux",defaultMethod:"ssh"},
  "juniper-switch":{label:"Juniper EX/QFX Switch",vendor:"Juniper",defaultMethod:"ssh"},
  "juniper-bras":{label:"Juniper BRAS",vendor:"Juniper",defaultMethod:"ssh"},
} as const
export type DeviceType=keyof typeof DEVICE_TYPES
export type DeviceStatus="online"|"offline"|"failure"|"maintenance"
export type CommunicationMethod="web_api"|"ssh"|"telnet"
export type DeviceProtocol="AUTO"|"ROUTEROS_API"|"ROUTEROS_API_TLS"|"ROUTEROS_REST"|"SSH"|"NETCONF"|"RESTCONF"|"GNMI"|"SNMP"|"VENDOR_API"|"TELNET"|"DISABLED"
export interface Capability{id:number;capability:string;supported:boolean;readOnly:boolean;metadata?:Record<string,unknown>}
export interface ManagedDevice{id:number;uuid:string;name:string;displayName?:string;slug:string;deviceType:DeviceType;vendor:string;model?:string;firmwareVersion?:string;platform?:string;operatingSystem?:string;operatingSystemVersion?:string;serialNumber?:string;host:string;managementPort:number;communicationMethod:CommunicationMethod;defaultCommunicationMethod:CommunicationMethod;protocolMode?:string;preferredProtocol?:DeviceProtocol;fallbackProtocols?:string[];sshProfile?:string;legacyCompatibilityEnabled?:boolean;lastConnectionError?:string;lastConnectionDiagnostics?:Record<string,any>;apiBaseUrl?:string;apiPort?:number;apiTlsPort?:number;restBaseUrl?:string;restPort?:number;sshPort?:number;netconfPort?:number;restconfBaseUrl?:string;gnmiEndpoint?:string;snmpPort?:number;snmpVersion?:string;liveMonitoringEnabled?:boolean;reconnectEnabled?:boolean;maxReconnectAttempts?:number;tlsEnabled:boolean;verifyTls:boolean;site?:string;location?:string;description?:string;tags?:string[];status:DeviceStatus;statusMessage?:string;failureReason?:string;maintenanceReason?:string;lastCheckedAt?:string;lastSeenAt?:string;lastSuccessfulConnectionAt?:string;pollingEnabled:boolean;pollingInterval:number;connectionTimeout:number;commandTimeout:number;retryCount:number;enabled:boolean;credential?:{configured:boolean;kinds:string[]};capabilities?:Capability[]}
export interface ManagedDevice{lastConfigurationBackupId?:number}
export interface DevicePayload extends Partial<ManagedDevice>{name:string;deviceType:DeviceType;vendor:string;host:string;managementPort:number;communicationMethod:CommunicationMethod;credentials?:Record<string,string>;pollingProfile?:Record<string,unknown>}
export interface DeviceListResult{items:ManagedDevice[];pagination:{page:number;limit:number;total:number;pages:number}}
export const deviceApi={
 list:(params:Record<string,string|number|boolean|undefined>)=>apiRequest<{success:boolean;data:DeviceListResult}>(`/devices?${new URLSearchParams(Object.entries(params).filter(([,v])=>v!==undefined).map(([k,v])=>[k,String(v)])).toString()}`),
 get:(id:number,options?:Parameters<typeof apiRequest>[1])=>apiRequest<{success:boolean;data:ManagedDevice}>(`/devices/${id}`,options),
 create:(payload:DevicePayload)=>apiRequest<{success:boolean;data:ManagedDevice}>("/devices",{method:"POST",body:JSON.stringify(payload)}),
 update:(id:number,payload:Partial<DevicePayload>)=>apiRequest<{success:boolean;data:ManagedDevice}>(`/devices/${id}`,{method:"PATCH",body:JSON.stringify(payload)}),
 remove:(id:number)=>apiRequest(`/devices/${id}`,{method:"DELETE"}),
 testDraft:(payload:DevicePayload)=>apiRequest<{success:boolean;data:ConnectionTestResult}>("/devices/test-connection",{method:"POST",body:JSON.stringify(payload)}),
 test:(id:number)=>apiRequest<{success:boolean;data:ConnectionTestResult}>(`/devices/${id}/test-connection`,{method:"POST"}),
 refresh:(id:number)=>apiRequest<{success:boolean;data:{status:DeviceStatus;message:string}}>(`/devices/${id}/status/refresh`,{method:"POST"}),
 bulkRefresh:(deviceIds:number[])=>apiRequest("/devices/status/refresh",{method:"POST",body:JSON.stringify({deviceIds})}),
 maintenance:(id:number,reason:string)=>apiRequest(`/devices/${id}/maintenance`,{method:"POST",body:JSON.stringify({reason})}),
 clearMaintenance:(id:number)=>apiRequest(`/devices/${id}/maintenance`,{method:"DELETE"}),
 setEnabled:(id:number,enabled:boolean)=>apiRequest(`/devices/${id}/${enabled?"enable":"disable"}`,{method:"POST"}),
 module:(id:number,module:string)=>apiRequest<{success:boolean;data:any}>(`/devices/${id}/modules/${encodeURIComponent(module)}`),
 command:(id:number,command:string)=>apiRequest<{success:boolean;data:{output:string;durationMs:number}}>(`/devices/${id}/terminal/command`,{method:"POST",body:JSON.stringify({command})}),
 audits:(id:number)=>apiRequest<{success:boolean;data:any[]}>(`/devices/${id}/audit-logs`),
 backups:(id:number)=>apiRequest<{success:boolean;data:any[]}>(`/devices/${id}/backups`),
 createBackup:(id:number,name?:string)=>apiRequest(`/devices/${id}/backups`,{method:"POST",body:JSON.stringify({name})}),
 diagnostics:(id:number)=>apiRequest<{success:boolean;data:any}>(`/devices/${id}/connection-diagnostics`),
 capabilityCatalog:(id:number)=>apiRequest<{success:boolean;data:any[]}>(`/devices/${id}/capability-catalog`),
 configurationTasks:(id:number)=>apiRequest<{success:boolean;data:any[]}>(`/devices/${id}/configuration-tasks`),
 previewTask:(id:number,payload:{capabilityKey:string;input:Record<string,unknown>;idempotencyKey?:string})=>apiRequest<{success:boolean;data:any}>(`/devices/${id}/configuration-tasks/preview`,{method:"POST",body:JSON.stringify(payload)}),
 approveTask:(id:number,taskId:number)=>apiRequest<{success:boolean;data:any}>(`/devices/${id}/configuration-tasks/${taskId}/approve`,{method:"POST"}),
 executeTask:(id:number,taskId:number)=>apiRequest<{success:boolean;data:any}>(`/devices/${id}/configuration-tasks/${taskId}/execute`,{method:"POST"}),
}
export interface ConnectionTestResult{connected:boolean;vendor?:string;protocol?:string;selectedProtocol?:string;profile?:string;profilesAttempted?:string[];legacyCompatibilityUsed?:boolean;deviceFingerprint?:string;latencyMs:number;detection?:Record<string,any>;diagnostics?:Record<string,any>}
