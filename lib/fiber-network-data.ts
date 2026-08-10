"use client"

import { apiRequest } from "@/lib/api"

export type FiberNodeType = "core" | "olt" | "service-port" | "splitter-master" | "splitter-slave" | "onu" | "acs" | "radius"

export interface FiberTreeNode {
  id: string
  name: string
  type: FiberNodeType
  status: "active" | "inactive" | "maintenance"
  children?: FiberTreeNode[]
  meta?: Record<string, any>
}

export interface FiberNetworkRow {
  id: string
  name: string
  type: string
  location: string
  subscribers: number
  oltCount: number
  splitterCount: number
  onuCount: number
  status: "active" | "inactive" | "maintenance"
  signalQuality: "excellent" | "good" | "fair" | "poor" | "unknown"
}

export interface FiberNetworkDataset {
  olts: any[]
  splitters: any[]
  customers: any[]
  rows: FiberNetworkRow[]
  tree: FiberTreeNode
  mapFeatures: FiberMapFeature[]
  stats: {
    totalNetworks: number
    activeSubscribers: number
    signalQuality: string
    activeAlerts: number
  }
}

export interface FiberMapFeature {
  type: "Point" | "Line"
  kind: "olt" | "splitter" | "ont" | "fiber"
  subKind?: "mdb" | "fdb" | "backbone" | "distribution" | "drop"
  name: string
  coords?: [number, number]
  path?: [number, number][]
  status?: string
  relation?: string
  meta?: Record<string, any>
}

const unwrapList = (response: any) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.items)) return response.items
  return []
}

const toNumber = (value: any) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeStatus = (status?: string): "active" | "inactive" | "maintenance" => {
  const value = (status || "").toLowerCase()
  if (["online", "active", "enabled", "provisioned"].includes(value)) return "active"
  if (["maintenance", "warning"].includes(value)) return "maintenance"
  return "inactive"
}

const getCustomerName = (customer: any) => {
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim()
  return name || customer.customerUniqueId || `Customer ${customer.id}`
}

const getCustomerOnt = (customer: any) => {
  return (customer.devices || []).find((device: any) => String(device.deviceType || "").toUpperCase() === "ONT")
}

const getPrimaryService = (customer: any) => {
  return (customer.serviceDetails || []).find((detail: any) => detail.status === "active") || customer.serviceDetails?.[0] || null
}

const coordinatesOf = (source: any): [number, number] | null => {
  if (!source) return null
  const latitude = toNumber(source.latitude ?? source.lat ?? source.location?.latitude ?? source.location?.lat)
  const longitude = toNumber(source.longitude ?? source.lng ?? source.lon ?? source.location?.longitude ?? source.location?.lng ?? source.location?.lon)
  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return [latitude, longitude]
}

/** Create an L-shaped routed path between two points to simulate road-following fiber routes */
const routedPath = (from: [number, number], to: [number, number]): [number, number][] => {
  const latDiff = Math.abs(to[0] - from[0])
  const lngDiff = Math.abs(to[1] - from[1])
  // For very short or nearly straight segments, use direct line
  if (latDiff < 0.0003 && lngDiff < 0.0003) return [from, to]
  // Create an L-shaped path (go horizontal first, then vertical) to mimic road routing
  if (latDiff > lngDiff) {
    const mid: [number, number] = [from[0], to[1]]
    return [from, mid, to]
  }
  const mid: [number, number] = [to[0], from[1]]
  return [from, mid, to]
}

const buildMapFeatures = (olts: any[], splitters: any[], customers: any[]): FiberMapFeature[] => {
  const features: FiberMapFeature[] = []
  const oltPositions = new Map<number, [number, number]>()
  const splitterPositions = new Map<number, [number, number]>()
  const masterSplitterIds = new Set<number>()

  // Identify master splitters (those that have children referencing them)
  splitters.forEach(splitter => {
    if (splitter.masterSplitterId) {
      const master = splitters.find(candidate => splitterKeyMatches(splitter, candidate))
      if (master) masterSplitterIds.add(Number(master.id))
    }
  })

  olts.forEach(olt => {
    const coords = coordinatesOf(olt)
    if (!coords) return
    oltPositions.set(Number(olt.id), coords)
    features.push({ type: "Point", kind: "olt", name: olt.name || olt.ipAddress || `OLT ${olt.id}`, coords, status: normalizeStatus(olt.status), meta: { id: olt.id, ipAddress: olt.ipAddress, vendor: olt.vendor, model: olt.model } })
  })

  splitters.forEach(splitter => {
    const coords = coordinatesOf(splitter)
    if (!coords) return
    splitterPositions.set(Number(splitter.id), coords)
    // A splitter is MDB if it connects directly to OLT (no masterSplitterId)
    const isMdb = !splitter.masterSplitterId
    const subKind = isMdb ? "mdb" as const : "fdb" as const
    const label = isMdb ? "MDB" : "FDB"
    features.push({ type: "Point", kind: "splitter", subKind, name: `${label} · ${splitter.name || splitter.splitterId || splitter.id}`, coords, status: normalizeStatus(splitter.status), meta: { id: splitter.id, splitterId: splitter.splitterId, splitRatio: splitter.splitRatio, usedPorts: splitter.usedPorts, portCount: splitter.portCount, isMdb } })
  })

  // Fiber lines between nodes — classified by tier
  splitters.forEach(splitter => {
    const target = splitterPositions.get(Number(splitter.id))
    if (!target) return
    const master = splitters.find(candidate => splitterKeyMatches(splitter, candidate))
    const source = master ? splitterPositions.get(Number(master.id)) : oltPositions.get(Number(splitter.oltId || splitter.olt?.id))
    if (!source) return
    // OLT → Splitter = backbone, MDB → FDB = distribution
    const tier = master ? "distribution" as const : "backbone" as const
    const relation = master ? `${master.name || master.splitterId} → ${splitter.name || splitter.splitterId}` : `OLT → ${splitter.name || splitter.splitterId}`
    features.push({ type: "Line", kind: "fiber", subKind: tier, name: `${tier === "backbone" ? "Backbone" : "Distribution"} · ${relation}`, path: routedPath(source, target), relation, meta: { splitterId: splitter.id, coreColor: splitter.upstreamFiber?.coreColor, cableId: splitter.upstreamFiber?.cableId } })
  })

  // Customer ONT nodes and drop fibers
  customers.forEach(customer => {
    const ont = getCustomerOnt(customer)
    const coords = coordinatesOf(customer)
    if (!ont || !coords) return
    const service = getPrimaryService(customer)
    const splitterId = toNumber(service?.splitterId || service?.splitter?.id || customer.splitterId)
    const oltId = toNumber(service?.oltId || service?.olt?.id || customer.oltId)
    const source = splitterId !== null ? splitterPositions.get(splitterId) : oltId !== null ? oltPositions.get(oltId) : null
    const customerName = getCustomerName(customer)
    features.push({ type: "Point", kind: "ont", name: customerName, coords, status: normalizeStatus(ont.status || customer.status), meta: { customerId: customer.customerUniqueId, serialNumber: ont.serialNumber || ont.ponSerial, macAddress: ont.macAddress, oltPort: service?.oltPort, splitterPort: service?.splitterPort } })
    if (source) {
      const relation = splitterId !== null ? `FDB → ${customerName}` : `OLT → ${customerName}`
      features.push({ type: "Line", kind: "fiber", subKind: "drop", name: `Drop · ${relation}`, path: routedPath(source, coords), relation, meta: { customerId: customer.customerUniqueId } })
    }
  })

  return features
}

const customerMatchesOlt = (customer: any, oltId: number) => {
  const service = getPrimaryService(customer)
  return toNumber(service?.oltId || service?.olt?.id || customer.oltId) === oltId
}

const customerMatchesSplitter = (customer: any, splitterId: number) => {
  const service = getPrimaryService(customer)
  return toNumber(service?.splitterId || service?.splitter?.id || customer.splitterId) === splitterId
}

const buildOntNode = (customer: any): FiberTreeNode => {
  const ont = getCustomerOnt(customer)
  const serial = ont?.serialNumber || ont?.serialNo || customer.customerUniqueId || customer.id
  return {
    id: `ont-${customer.id}`,
    name: `${getCustomerName(customer)} (${serial || "ONT"})`,
    type: "onu",
    status: normalizeStatus(customer.status),
    meta: {
      customerId: customer.customerUniqueId,
      phone: customer.phoneNumber,
      macAddress: ont?.macAddress,
    },
    children: [
      {
        id: `acs-${customer.id}`,
        name: `ACS: ${customer.acsRealtimeStatus === "online" ? "Online" : "Offline"}`,
        type: "acs",
        status: customer.acsRealtimeStatus === "online" ? "active" : "inactive",
      },
      {
        id: `radius-${customer.id}`,
        name: `RADIUS: ${customer.radiusRealtimeStatus === "online" ? "Online" : "Offline"}`,
        type: "radius",
        status: customer.radiusRealtimeStatus === "online" ? "active" : "inactive",
      },
    ],
  }
}

const splitterKeyMatches = (splitter: any, master: any) => {
  if (!splitter.masterSplitterId) return false
  return (
    String(splitter.masterSplitterId) === String(master.splitterId || "") ||
    String(splitter.masterSplitterId) === String(master.id || "")
  )
}

function buildSplitterNode(splitter: any, allSplitters: any[], customers: any[], visited = new Set<string>()): FiberTreeNode {
  const key = String(splitter.id)
  if (visited.has(key)) {
    return {
      id: `splitter-loop-${key}`,
      name: `${splitter.name || splitter.splitterId} (linked already)`,
      type: splitter.isMaster ? "splitter-master" : "splitter-slave",
      status: normalizeStatus(splitter.status),
    }
  }

  visited.add(key)

  const childSplitters = allSplitters.filter((candidate) => splitterKeyMatches(candidate, splitter))
  const connectedCustomers = customers.filter((customer) => customerMatchesSplitter(customer, Number(splitter.id)))

  return {
    id: `splitter-${splitter.id}`,
    name: `${splitter.name || splitter.splitterId || "Splitter"}${splitter.splitRatio ? ` (${splitter.splitRatio})` : ""}`,
    type: splitter.isMaster ? "splitter-master" : "splitter-slave",
    status: normalizeStatus(splitter.status),
    meta: {
      splitterId: splitter.splitterId,
      ports: splitter.portCount,
      usedPorts: splitter.usedPorts,
      coreColor: splitter.upstreamFiber?.coreColor || "Blue",
    },
    children: [
      ...childSplitters.map((child) => buildSplitterNode(child, allSplitters, customers, new Set(visited))),
      ...connectedCustomers.map(buildOntNode),
    ].filter(Boolean),
  }
}

export function buildFiberNetworkDataset(olts: any[], splitters: any[], customers: any[]): FiberNetworkDataset {
  const splitterById = new Map(splitters.map((splitter) => [Number(splitter.id), splitter]))

  const rows = olts.map((olt) => {
    const oltId = Number(olt.id)
    const oltSplitters = splitters.filter((splitter) => toNumber(splitter.oltId || splitter.olt?.id) === oltId)
    const oltCustomers = customers.filter((customer) => customerMatchesOlt(customer, oltId))
    const ontCustomers = oltCustomers.filter((customer) => getCustomerOnt(customer))
    const activeOnts = ontCustomers.filter((customer) => normalizeStatus(getCustomerOnt(customer)?.status || customer.status) === "active").length
    const signalRatio = ontCustomers.length ? activeOnts / ontCustomers.length : null
    const splitterLocation = oltSplitters.find((splitter) => splitter.location?.site || splitter.location?.description)?.location

    return {
      id: `OLT-${olt.id}`,
      name: olt.name || `OLT ${olt.id}`,
      type: "FTTH/FTTB",
      location:
        olt.site ||
        olt.region ||
        olt.location?.site ||
        olt.location?.region ||
        splitterLocation?.site ||
        splitterLocation?.description ||
        "Unassigned",
      subscribers: oltCustomers.length,
      oltCount: 1,
      splitterCount: oltSplitters.length,
      onuCount: ontCustomers.length,
      status: normalizeStatus(olt.status),
      signalQuality:
        signalRatio === null ? "unknown" :
        signalRatio >= 0.95 ? "excellent" :
        signalRatio >= 0.8 ? "good" :
        signalRatio >= 0.6 ? "fair" : "poor",
    } satisfies FiberNetworkRow
  })

  const tree: FiberTreeNode = {
    id: "fiber-core",
    name: "ISP Fiber Network",
    type: "core",
    status: olts.some((olt) => normalizeStatus(olt.status) === "active") ? "active" : "inactive",
    children: olts.map((olt) => {
      const oltId = Number(olt.id)
      const oltSplitters = splitters.filter((splitter) => toNumber(splitter.oltId || splitter.olt?.id) === oltId)
      const childSplitterIds = new Set(
        oltSplitters
          .filter((splitter) => splitter.masterSplitterId)
          .map((splitter) => String(splitter.id))
      )
      const rootSplitters = oltSplitters.filter((splitter) => {
        if (!splitter.masterSplitterId) return true
        const master = splitters.find((candidate) => splitterKeyMatches(splitter, candidate))
        return !master || toNumber(master.oltId || master.olt?.id) !== oltId
      })
      const customersOnOlt = customers.filter((customer) => customerMatchesOlt(customer, oltId))
      const directCustomers = customersOnOlt.filter((customer) => {
        const service = getPrimaryService(customer)
        const splitterId = toNumber(service?.splitterId || service?.splitter?.id || customer.splitterId)
        return !splitterId || !splitterById.has(splitterId)
      })

      return {
        id: `olt-${olt.id}`,
        name: `${olt.name || `OLT ${olt.id}`}${olt.ipAddress ? ` (${olt.ipAddress})` : ""}`,
        type: "olt",
        status: normalizeStatus(olt.status),
        meta: {
          vendor: olt.vendor,
          model: olt.model,
          ports: olt.totalPorts,
        },
        children: [
          ...rootSplitters
            .filter((splitter) => !childSplitterIds.has(String(splitter.id)) || !splitter.masterSplitterId)
            .map((splitter) => buildSplitterNode(splitter, splitters, customers)),
          ...directCustomers.map((customer) => {
            const service = getPrimaryService(customer)
            return {
              id: `direct-port-${customer.id}`,
              name: service?.oltPort ? `OLT Port ${service.oltPort}` : "Direct OLT Connection",
              type: "service-port" as FiberNodeType,
              status: normalizeStatus(customer.status),
              children: [buildOntNode(customer)],
            }
          }),
        ],
      }
    }),
  }

  const allOntCustomers = customers.filter((customer) => getCustomerOnt(customer))
  const activeOnts = allOntCustomers.filter((customer) => normalizeStatus(getCustomerOnt(customer)?.status || customer.status) === "active").length
  const signalQuality = allOntCustomers.length ? `${Math.round((activeOnts / allOntCustomers.length) * 100)}%` : "N/A"
  const activeAlerts =
    olts.filter((olt) => normalizeStatus(olt.status) !== "active").length +
    allOntCustomers.filter((customer) => normalizeStatus(getCustomerOnt(customer)?.status || customer.status) !== "active").length

  return {
    olts,
    splitters,
    customers,
    rows,
    tree,
    mapFeatures: buildMapFeatures(olts, splitters, customers),
    stats: {
      totalNetworks: olts.length,
      activeSubscribers: customers.filter((customer) => normalizeStatus(customer.status) === "active").length,
      signalQuality,
      activeAlerts,
    },
  }
}

export async function fetchFiberNetworkDataset(): Promise<FiberNetworkDataset> {
  const [oltResponse, splitterResponse, customerResponse] = await Promise.all([
    apiRequest<any>("/olt?limit=1000"),
    apiRequest<any>("/splitters?limit=1000"),
    apiRequest<any>("/customer?limit=5000"),
  ])

  const customers = unwrapList(customerResponse)
  const realtimeByCustomerId = new Map<number, any>()
  const customersWithOnt = customers.filter((customer: any) => getCustomerOnt(customer))
  const batchSize = 10
  for (let index = 0; index < customersWithOnt.length; index += batchSize) {
    const batch = customersWithOnt.slice(index, index + batchSize)
    const details = await Promise.all(batch.map((customer: any) =>
      apiRequest<any>(`/customer/${customer.id}`, { suppressToast: true }).catch(() => null)
    ))
    details.forEach((detail, detailIndex) => {
      if (detail) realtimeByCustomerId.set(Number(batch[detailIndex].id), detail)
    })
  }
  const enrichedCustomers = customers.map((customer: any) => {
    const realtime = realtimeByCustomerId.get(Number(customer.id))
    return {
      ...customer,
      acsRealtimeStatus: String(realtime?.ontRealtimeStatus || "offline").toLowerCase(),
      radiusRealtimeStatus: String(realtime?.radiusRealtimeStatus || "offline").toLowerCase(),
    }
  })

  return buildFiberNetworkDataset(
    unwrapList(oltResponse),
    unwrapList(splitterResponse),
    enrichedCustomers
  )
}
