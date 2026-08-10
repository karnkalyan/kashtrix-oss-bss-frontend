"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Copy,
  Edit2,
  GitBranch,
  Link2,
  MapPin,
  Network,
  Radio,
  Server,
  Split,
  Waypoints,
  Wifi,
} from "lucide-react"
import React, { type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

type RecordValue = Record<string, any>

type SplitterDetailsModernProps = {
  splitter: RecordValue
  splitters: RecordValue[]
  olts: RecordValue[]
  onEdit: () => void
  onMap: () => void
  onCopy: () => void
  onClose: () => void
}

const formatDate = (value: unknown) => {
  if (!value) return "Not recorded"
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export function SplitterDetailsModern({
  splitter,
  splitters,
  olts,
  onEdit,
  onMap,
  onCopy,
  onClose,
}: SplitterDetailsModernProps) {
  const usedPorts = Number(splitter.usedPorts || 0)
  const portCount = Number(splitter.portCount || 0)
  const availablePorts = Number(splitter.availablePorts ?? Math.max(0, portCount - usedPorts))
  const utilization = portCount ? Math.min(100, Math.round(usedPorts / portCount * 100)) : 0
  const parent = splitter.masterSplitterId
    ? splitters.find(item => String(item.splitterId) === String(splitter.masterSplitterId))
    : null

  const hierarchy: RecordValue[] = [splitter]
  const visited = new Set<string>([String(splitter.splitterId)])
  let cursor = splitter
  while (cursor?.masterSplitterId && !visited.has(String(cursor.masterSplitterId))) {
    const next = splitters.find(item => String(item.splitterId) === String(cursor.masterSplitterId))
    if (!next) break
    hierarchy.push(next)
    visited.add(String(next.splitterId))
    cursor = next
  }

  const rootConnection = [...hierarchy].reverse().find(item => item.connectedServiceBoard)?.connectedServiceBoard
    || splitter.connectedServiceBoard
  const rootOlt = olts.find(item => String(item.id) === String(rootConnection?.oltId))
  const oltName = rootOlt?.name || rootConnection?.oltName || "Not connected"
  const oltIp = rootOlt?.ipAddress || rootConnection?.oltIpAddress || "No IP recorded"
  const hasCoordinates = Boolean(splitter.location?.latitude && splitter.location?.longitude)
  const ratioOutput = String(splitter.splitRatio || "1:0").split(":")[1] || portCount

  return <div className="splitter-details-modern">
    <DialogHeader className="border-b px-6 py-5 pr-14">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600">
          <GitBranch className="size-7"/>
        </div>
        <div className="min-w-0">
          <DialogTitle className="text-xl">Splitter Details</DialogTitle>
          <DialogDescription className="mt-1 truncate">
            Detailed information for {splitter.name || splitter.splitterId}
          </DialogDescription>
        </div>
        <Badge variant="outline" className="ml-auto border-violet-300 bg-violet-500/5 px-3 py-1 text-violet-700 dark:text-violet-300">
          <Waypoints className="mr-1.5 size-3.5"/>
          {splitter.isMaster ? "Master Splitter" : "Slave Splitter"}
        </Badge>
      </div>
    </DialogHeader>

    <div className="space-y-5 px-6 py-5">
      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-100/80 via-card to-card dark:border-violet-900 dark:from-violet-950/40">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.45fr_repeat(4,minmax(0,1fr))]">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="truncate text-2xl font-bold tracking-tight">{splitter.name}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold">ID: {splitter.splitterId}</span>
              <Badge className={String(splitter.status).toLowerCase()==="active" ? "border-emerald-200 bg-emerald-500/10 text-emerald-700" : "border-amber-200 bg-amber-500/10 text-amber-700"}>
                <CheckCircle2 className="mr-1 size-3"/>
                {splitter.status || "Unknown"}
              </Badge>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">Splitter Type</span>
              <Badge variant="outline" className="border-violet-200 bg-white/60 text-violet-700 dark:bg-black/20 dark:text-violet-300">{splitter.splitterType || "N/A"}</Badge>
              <span>{splitter.splitterType === "FBT" ? "Fused Biconical Taper" : "Planar Lightwave Circuit"}</span>
            </div>
          </div>
          <Metric icon={Split} label="Split Ratio" value={splitter.splitRatio || "N/A"} hint={`1 input to ${ratioOutput} outputs`}/>
          <Metric icon={Network} label="Total Ports" value={portCount} hint={`${usedPorts} currently used`}/>
          <Metric icon={Radio} label="Available Ports" value={availablePorts} hint="Ready for assignment"/>
          <Metric icon={CircleGauge} label="Port Utilization" value={`${utilization}%`} progress={utilization}/>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <Panel title="Port Information" icon={Network}>
            <div className="grid grid-cols-3 gap-3">
              <MiniMetric label="Total Ports" value={portCount}/>
              <MiniMetric label="Used Ports" value={usedPorts}/>
              <MiniMetric label="Available" value={availablePorts}/>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs"><span className="font-medium">Port Utilization</span><span className="font-semibold">{utilization}%</span></div>
              <Progress value={utilization} className="h-2" indicatorClassName={utilization > 85 ? "bg-red-500" : utilization > 60 ? "bg-amber-500" : "bg-emerald-500"}/>
            </div>
          </Panel>

          <Panel title="Upstream Fiber" icon={Wifi}>
            <DetailRow label="Fiber Core Color">
              <span className="flex items-center gap-2 font-semibold">
                <span className="size-4 rounded-full border" style={{backgroundColor:String(splitter.upstreamFiber?.coreColor || "transparent").toLowerCase()}}/>
                {splitter.upstreamFiber?.coreColor || "Not specified"}
              </span>
            </DetailRow>
            <DetailRow label="Connected To">
              <Badge variant="outline" className="border-violet-200 bg-violet-500/5 capitalize text-violet-700 dark:text-violet-300">
                {parent ? "Parent Splitter" : rootConnection ? "OLT Service Board" : splitter.upstreamFiber?.connectedTo || "Not connected"}
              </Badge>
            </DetailRow>
            {splitter.upstreamFiber?.port&&<DetailRow label="Port"><span className="font-mono text-xs">{splitter.upstreamFiber.port}</span></DetailRow>}
          </Panel>

          <Panel title="Location Information" icon={MapPin}>
            <DetailRow label="Site"><span className="font-semibold">{splitter.location?.site || "Not assigned"}</span></DetailRow>
            {hasCoordinates&&<DetailRow label="Coordinates"><span className="font-mono text-xs">{Number(splitter.location.latitude).toFixed(6)}, {Number(splitter.location.longitude).toFixed(6)}</span></DetailRow>}
            {splitter.location?.description&&<div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{splitter.location.description}</div>}
          </Panel>

          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-4 text-xs">
            <div><div className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="size-3.5"/>Created</div><div className="mt-1 font-medium">{formatDate(splitter.createdAt)}</div></div>
            <div><div className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="size-3.5"/>Last Updated</div><div className="mt-1 font-medium">{formatDate(splitter.updatedAt)}</div></div>
          </div>
        </div>

        <div className="space-y-5">
          <Panel title="Connection Hierarchy" icon={Waypoints}>
            <div className="space-y-0">
              {hierarchy.map((item,index)=><HierarchyNode
                key={item.id || item.splitterId || index}
                title={index===0 ? "Current Splitter" : index===1 ? "Master Splitter (Parent)" : "Upstream Splitter"}
                name={item.name || item.splitterId}
                detail={`${item.isMaster ? "Master" : "Slave"} · ${item.splitRatio || "No ratio"}`}
                tone={index===0 ? "violet" : "purple"}
                last={false}
              />)}
              {rootConnection
                ? <HierarchyNode title="OLT" name={oltName} detail={`IP: ${oltIp} · Port: ${rootConnection.boardPort || rootConnection.port || "N/A"}`} tone="green" last/>
                : <HierarchyNode title="OLT" name="Not connected" detail="No upstream OLT connection was found" tone="slate" last/>}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-violet-200 bg-violet-500/5 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 font-medium text-violet-700 dark:text-violet-300"><GitBranch className="size-3.5"/>Connection Summary</span>
              <span className="text-muted-foreground">{hierarchy.length} splitter{hierarchy.length===1?"":"s"} connected to OLT</span>
            </div>
          </Panel>

          <Panel title="Connection Details" icon={Link2}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-3 text-xs font-semibold text-violet-700 dark:text-violet-300">Current Splitter</div>
                <DetailRow label="Splitter ID"><span className="font-mono text-xs">{splitter.splitterId}</span></DetailRow>
                <DetailRow label="Type"><span>{splitter.isMaster ? "Master" : "Slave"}</span></DetailRow>
                <DetailRow label="Split Ratio"><span className="font-semibold">{splitter.splitRatio}</span></DetailRow>
                <DetailRow label="Ports"><span>{usedPorts}/{portCount} ({availablePorts} available)</span></DetailRow>
              </div>
              <div className="border-t pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <div className="mb-3 text-xs font-semibold text-violet-700 dark:text-violet-300">Direct Connection</div>
                <DetailRow label="Connected to"><span className="font-semibold">{parent ? "Parent Splitter" : rootConnection ? "OLT Service Board" : "Not connected"}</span></DetailRow>
                {parent&&<><DetailRow label="Parent ID"><span className="font-mono text-xs">{parent.splitterId}</span></DetailRow><DetailRow label="Parent Type"><Badge variant="outline">{parent.isMaster ? "Master" : "Slave"}</Badge></DetailRow></>}
                {rootConnection&&!parent&&<><DetailRow label="OLT Name"><span>{oltName}</span></DetailRow><DetailRow label="Service Port"><span className="font-mono text-xs">{rootConnection.boardPort || "N/A"}</span></DetailRow></>}
              </div>
            </div>
          </Panel>

          <div className="rounded-xl border border-emerald-200 bg-emerald-500/[0.06] p-4 dark:border-emerald-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Server className="size-4"/>Ultimate OLT Connection
            </div>
            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <DetailRow label="OLT Name"><span className="font-semibold">{oltName}</span></DetailRow>
              <DetailRow label="IP Address"><span className="font-mono">{oltIp}</span></DetailRow>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white/60 p-2 text-xs text-emerald-900 dark:bg-black/20 dark:text-emerald-200">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground mr-1">Connection Path:</span>
              {[...hierarchy].map((item, index) => <React.Fragment key={item.id || item.splitterId || index}>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-500/10 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                  {item.name || item.splitterId}
                </Badge>
                <span className="text-muted-foreground">&rarr;</span>
              </React.Fragment>)}
              <Badge variant="outline" className="border-emerald-500 bg-emerald-500/20 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                {oltName}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DialogFooter className="border-t bg-muted/20 px-6 py-4">
      <Button variant="outline" onClick={onEdit}><Edit2 className="mr-2 size-4"/>Edit Splitter</Button>
      <Button variant="outline" onClick={onMap} disabled={!hasCoordinates}><MapPin className="mr-2 size-4"/>View on Map</Button>
      <Button variant="outline" onClick={onCopy}><Copy className="mr-2 size-4"/>Copy Details</Button>
      <Button className="bg-violet-700 hover:bg-violet-800" onClick={onClose}>Close</Button>
    </DialogFooter>
  </div>
}

function Metric({icon:Icon,label,value,hint,progress}:{icon:typeof Split;label:string;value:unknown;hint?:string;progress?:number}) {
  return <div className="rounded-xl border border-white/60 bg-white/65 p-3 shadow-sm dark:border-white/5 dark:bg-black/15">
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Icon className="size-4 text-violet-600"/>{label}</div>
    <div className="mt-3 font-mono text-xl font-bold">{String(value)}</div>
    {progress===undefined?<div className="mt-1 text-[9px] text-muted-foreground">{hint}</div>:<Progress value={progress} className="mt-3 h-1.5" indicatorClassName="bg-violet-600"/>}
  </div>
}

function MiniMetric({label,value}:{label:string;value:unknown}) {
  return <div className="rounded-lg border bg-muted/25 p-3 text-center"><div className="font-mono text-xl font-bold">{String(value)}</div><div className="mt-1 text-[9px] text-muted-foreground">{label}</div></div>
}

function Panel({title,icon:Icon,children}:{title:string;icon:typeof Split;children:ReactNode}) {
  return <section className="rounded-xl border bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-violet-600"/>{title}</div>{children}</section>
}

function DetailRow({label,children}:{label:string;children:ReactNode}) {
  return <div className="flex min-h-8 items-center justify-between gap-4 border-b border-dashed py-2 text-xs last:border-0"><span className="text-muted-foreground">{label}</span><span className="min-w-0 text-right">{children}</span></div>
}

function HierarchyNode({title,name,detail,tone,last}:{title:string;name:string;detail:string;tone:"violet"|"purple"|"green"|"slate";last:boolean}) {
  const colors = {
    violet:"border-violet-500 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300",
    purple:"border-fuchsia-400 bg-fuchsia-500/[0.06] text-fuchsia-700 dark:text-fuchsia-300",
    green:"border-emerald-500 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300",
    slate:"border-slate-400 bg-slate-500/[0.06] text-slate-600 dark:text-slate-300",
  }
  return <div>
    <div className={`flex items-center gap-3 rounded-xl border border-l-4 p-3 ${colors[tone]}`}>
      <div className="rounded-full bg-current/10 p-2">{tone==="green"?<Server className="size-4"/>:<Split className="size-4"/>}</div>
      <div className="min-w-0 flex-1"><div className="text-[9px] font-semibold uppercase tracking-wide opacity-75">{title}</div><div className="truncate text-xs font-bold">{name}</div><div className="truncate text-[9px] opacity-75">{detail}</div></div>
      <Badge variant="outline" className="border-current/20 bg-white/40 text-[8px] dark:bg-black/20">{title.includes("Current")?"Current":title==="OLT"?"OLT":"Upstream"}</Badge>
    </div>
    {!last&&<div className="ml-7 h-4 border-l border-dashed border-violet-300"/>}
  </div>
}
