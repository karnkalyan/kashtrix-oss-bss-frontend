"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, CheckCircle2, LifeBuoy, MapPin, Navigation, Loader2, Package, ExternalLink } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { apiRequest } from "@/lib/api"
import toast from "react-hot-toast"

type Task = { id: number; title: string; description?: string; status: string; priority: string; startTime?: string; customer?: { customerUniqueId?: string; lead?: { firstName?: string; lastName?: string; phoneNumber?: string; address?: string; street?: string } }; ticket?: { id?: number; ticketNumber?: string } }
type TicketResponse = { data?: unknown[]; pagination?: { total?: number } }
type InventoryItem = { id: number; name: string; serialNumber?: string; qty?: number }
type BulkAssignment = { id: number; quantity: number; status: string; bulkInventory?: { name: string; unit: string } }

export function FieldDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [ticketCount, setTicketCount] = useState(0)
  const [devices, setDevices] = useState<InventoryItem[]>([])
  const [consumables, setConsumables] = useState<BulkAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [taskData, ticketData, deviceData, bulkData] = await Promise.all([
        apiRequest<Task[]>("/tasks"),
        apiRequest<TicketResponse>("/tickets?limit=1"),
        apiRequest<InventoryItem[]>("/inventory/assigned/me"),
        apiRequest<BulkAssignment[]>("/bulk-inventory/assignments/me"),
      ])
      setTasks(Array.isArray(taskData) ? taskData : [])
      setTicketCount(ticketData?.pagination?.total || ticketData?.data?.length || 0)
      setDevices(Array.isArray(deviceData) ? deviceData : [])
      setConsumables(Array.isArray(bulkData) ? bulkData : [])
    } catch (error) {
      console.error("Failed to load field operations dashboard", error)
      toast.error("Could not load field operations data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pendingTasks = useMemo(() => tasks.filter(task => ["PENDING", "IN_PROGRESS"].includes(task.status)), [tasks])
  const completedTasks = useMemo(() => tasks.filter(task => task.status === "COMPLETED"), [tasks])
  const activeTask = pendingTasks.find(task => task.status === "IN_PROGRESS") || pendingTasks[0]
  const lead = activeTask?.customer?.lead
  const address = lead?.address || lead?.street || "Location not provided"

  const completeTask = async () => {
    if (!activeTask) return
    setUpdating(true)
    try {
      await apiRequest(`/tasks/${activeTask.id}`, { method: "PUT", body: JSON.stringify({ status: "COMPLETED" }) })
      toast.success("Task marked as completed")
      await load()
    } catch (error: any) {
      toast.error(error.message || "Unable to update task")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Field Operations</h1><p className="text-muted-foreground">Your live assigned workload, tickets, and inventory.</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Open Tasks" value={loading ? "..." : String(pendingTasks.length)} icon={<ClipboardList className="h-4 w-4" />} description="Assigned to you" />
        <StatsCard title="Completed Tasks" value={loading ? "..." : String(completedTasks.length)} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} description="Your completed assignments" />
        <StatsCard title="Assigned Tickets" value={loading ? "..." : String(ticketCount)} icon={<LifeBuoy className="h-4 w-4" />} description="Support tickets assigned to you" />
        <StatsCard title="Inventory Items" value={loading ? "..." : String(devices.length + consumables.length)} icon={<Package className="h-4 w-4" />} description="Devices and consumables" />
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4"><CardHeader><CardTitle>Current Assigned Job</CardTitle></CardHeader><CardContent>
          {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : !activeTask ? <div className="rounded-lg border p-8 text-center text-muted-foreground">No open task assigned.</div> : (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-bold">
                    <Link href={`/tasks/${activeTask.id}`} className="hover:underline flex items-center gap-1">
                      {activeTask.title} <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    {activeTask.ticket?.id ? (
                      <Link href={`/tickets/${activeTask.ticket.id}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                        Ticket {activeTask.ticket.ticketNumber} <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      `Task #${activeTask.id}`
                    )}
                    <span>· {activeTask.priority}</span>
                  </p>
                </div>
                <span className="h-fit rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{activeTask.status}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm"><div className="flex gap-2"><MapPin className="h-4 w-4" />{address}</div>{address !== "Location not provided" && <a className="flex items-center gap-2 font-medium text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}><Navigation className="h-4 w-4" />Open in Google Maps</a>}{activeTask.description && <p className="border-t pt-3 text-muted-foreground">{activeTask.description}</p>}</div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href={`/tasks/${activeTask.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" /> View Task Details Page
                  </Link>
                </Button>
                <Button className="w-full" onClick={completeTask} disabled={updating}>{updating ? "Updating..." : "Mark as Completed"}</Button>
              </div>
            </div>
          )}
        </CardContent></Card>
        <Card className="col-span-3"><CardHeader><CardTitle>Inventory Assigned to Me</CardTitle></CardHeader><CardContent className="space-y-3">
          {!loading && devices.length + consumables.length === 0 && <p className="text-sm text-muted-foreground">No inventory assigned.</p>}
          {devices.slice(0, 4).map(item => <div key={`device-${item.id}`} className="flex justify-between rounded border p-2 text-sm"><div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.serialNumber || "Device"}</p></div><span>x{item.qty || 1}</span></div>)}
          {consumables.slice(0, 4).map(item => <div key={`bulk-${item.id}`} className="flex justify-between rounded border p-2 text-sm"><div><p className="font-medium">{item.bulkInventory?.name}</p><p className="text-xs text-muted-foreground">{item.status}</p></div><span>{item.quantity} {item.bulkInventory?.unit}</span></div>)}
          <Button variant="outline" asChild className="w-full"><Link href="/inventory/assigned">View All Assigned Items</Link></Button>
        </CardContent></Card>
      </div>
    </div>
  )
}
