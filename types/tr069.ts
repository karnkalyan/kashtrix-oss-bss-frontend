export interface Device {
    id: string;
    serialNumber: string;
    productClass: string;
    manufacturer: string;
    oui: string;
    status: string;
    lastContact: string;
    uptime: string;
    wanConnections: WanConnection[];
    deviceInfo: DeviceInfo;
    connectedDevices: ConnectedDevice[] | string; // Can be array OR string
    ssidList: SSID[];
}

export interface WanConnection {
    root?: string;
    modelRoot?: "TR-098" | "TR-181";
    wanDeviceIndex?: string;
    wanConnectionDeviceIndex?: string;
    connectionIndex: string;
    type: string;
    externalIPAddress?: string;
    ipAddress?: string;
    macAddress?: string;
    macAddressSource?: string;
    connectionStatus: string;
    connectionType: string;
    addressingType?: string;
    lowerLayers?: string;
    gateway?: string;
    subnetMask?: string;
    dnsServers: string[];
    mtu: number;
    name: string;
    uptime: number;
    username?: string;
    password?: string;
    remoteIPAddress?: string;
    transportType?: string;
    authenticationProtocol?: string;
    compressionProtocol?: string;
    encryptionProtocol?: string;
    pppoeAcName?: string;
    pppoeServiceName?: string;
    pppoeSessionId?: number;
    currentMRU?: number;
    maximumMRU?: number;
    pppoeACName?: string;
    pppoeSessionID?: number | string;
    mru?: number;
    maxMRU?: number;
    lcpEchoInterval?: number;
    lcpEchoRetryCount?: number;
    vlanId?: number | string;
    vlan?: number;
    vlanPriority?: number;
    serviceType?: string;
    connectionTrigger?: string;
    routeProtocolRx?: string;
    dhcpServerIPAddress?: string;
    dhcpLeaseTime?: number;
    enabled?: boolean;
    accessControl?: Record<string, { enabled?: boolean; trusted?: boolean }>;
    stats?: Record<string, number>;
    ipv6Address?: string;
    ipv6Gateway?: string;
    ipv6Prefix?: string;
    parameters: Record<string, any>;
}

export interface DeviceInfo {
    modelName: string;
    description: string;
    hardwareVersion: string;
    softwareVersion: string;
    firmwareVersion: string;
    serialNumber: string;
    productClass: string;
    manufacturer: string;
    manufacturerOUI: string;
    accessType: string;
    provisioningCode: string;
    uptimeSeconds: number;
    uptime: string;
    firstUseDate: string;
    deviceLog: string;
    specVersion: string;
    memoryFree: number;
    memoryTotal: number;
    cpuUsage: number;
    cpuTemp: string;
    rxPower?: string;
    lastContact?: string;
    additionalHardwareVersion: string;
    additionalSoftwareVersion: string;
    xAluComGeUpLinkEnable: boolean;
    xAluComNatNumberOfEntries: number;
    xAluComVoiceNetworkMode: string;
    xAluComServiceManage: {
        sshEnable: boolean;
        sshPort: number;
        telnetEnable: boolean;
        telnetPort: number;
        ftpEnable: boolean;
        sftpEnable: boolean;
        sambaEnable: boolean;
        wanHttpsPort: number;
        managementIdleDisconnectTime: number;
    };
    xAluComWolan: {
        enable: boolean;
        publicPort: number;
    };
    supportedDataModelEntries: number;
    parameters: Record<string, any>;
}

export interface ConnectedDevice {
    hostName: string;
    ipAddress: string;
    macAddress: string;
    active: boolean | { _object: boolean; _writable: boolean };
    leaseTimeRemaining: number | { _object: boolean; _writable: boolean };
    interfaceType: string | { _object: boolean; _writable: boolean };
    layer1Interface: string;
    associatedDeviceMACAddress: string;
    physicalPort: string;
}

export interface SSID {
    source: string;
    instance: string;
    ssid: string;
    enable: boolean;
    status: string;
    channel: number;
    radioEnabled: boolean;
    beaconType: string;
    encryptionMode: string;
    authenticationMode: string;
    maxBitRate: string;
    bssid: string;
    keyPassphrase: string;
    associatedDeviceCount: string;
    parameters: Record<string, any>;
    wifiDeviceIndex: string;
    wifiConnectionDeviceIndex: string;
}

export interface DeviceApiResponse {
    success: boolean;
    data: Device;
}
