"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LayoutGrid, Settings, Plus, RotateCcw, Activity, Users, CreditCard, Server, MessageSquare, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardWidget } from "./dashboard-widget"
import { cn } from "@/lib/utils"

// Import all widgets
import { BandwidthMonitor } from "./bandwidth-monitor"
import { ActiveSessions } from "./active-sessions"
import { RevenueChart } from "./revenue-chart"
import { AlertsPanel } from "./alerts-panel"
import { CalendarSystemWidget } from "./calendar-system-widget"
import { QuickActions } from "./quick-actions"
import { RealTimeStats } from "./real-time-stats"
import { UpcomingFollowUps } from "./upcoming-follow-ups"
import { LeadSearchHero } from "./lead-search-hero"
import { SmsCampaign } from "./sms-campaign"
import { StatsCards } from "./stats-cards"
import { ActivityFeed } from "./activity-feed"

type WidgetDefinition = {
  id: string
  title: string
  subtitle?: string
  icon: any
  component: React.ComponentType<any>
  defaultRoles: string[]
  span?: "full" | "wide" | "normal"
}

const WIDGETS_REGISTRY: WidgetDefinition[] = [
  { id: "summary", title: "Subscriber & Billing KPIs", subtitle: "Live operational totals from the OSS/BSS database", icon: Gauge, component: StatsCards, defaultRoles: ["administrator", "admin", "super admin", "global manager"], span: "full" },
  { id: "bandwidth", title: "Bandwidth Monitor", subtitle: "Real-time traffic throughput", icon: Activity, component: BandwidthMonitor, defaultRoles: ["administrator", "global manager", "technical", "network engineer"] },
  { id: "sessions", title: "Active Sessions", subtitle: "Live subscriber connections", icon: Users, component: ActiveSessions, defaultRoles: ["administrator", "global manager", "technical", "support", "network engineer"] },
  { id: "revenue", title: "Revenue Chart", subtitle: "Billing and collections overview", icon: CreditCard, component: RevenueChart, defaultRoles: ["administrator", "global manager"], span: "wide" },
  { id: "alerts", title: "Network Alerts", subtitle: "Active system and NOC warnings", icon: Server, component: AlertsPanel, defaultRoles: ["administrator", "global manager", "technical", "support", "network engineer"] },
  { id: "calendar", title: "Calendar System", subtitle: "Nepali BS / Gregorian AD dual calendar", icon: LayoutGrid, component: CalendarSystemWidget, defaultRoles: ["administrator", "global manager", "support", "marketing", "technical", "field staff"] },
  { id: "actions", title: "Quick Actions", subtitle: "Common administrative shortcuts", icon: Settings, component: QuickActions, defaultRoles: ["administrator", "global manager", "technical", "support"] },
  { id: "stats", title: "System Resources", subtitle: "Core hardware and memory usage", icon: Server, component: RealTimeStats, defaultRoles: ["administrator", "global manager", "technical"] },
  { id: "followups", title: "CRM Follow-ups", subtitle: "Recent lead tracking updates", icon: Users, component: UpcomingFollowUps, defaultRoles: ["administrator", "global manager", "marketing", "sales"] },
  { id: "activity", title: "Operational Activity", subtitle: "Live lead and ticket activity", icon: Activity, component: ActivityFeed, defaultRoles: ["administrator", "global manager"] },
  { id: "leads", title: "CRM Search", subtitle: "Sales funnel and lead search", icon: Users, component: LeadSearchHero, defaultRoles: ["administrator", "global manager", "marketing", "sales"] },
  { id: "campaigns", title: "Campaign Managers", subtitle: "SMS & WhatsApp operations", icon: MessageSquare, component: SmsCampaign, defaultRoles: ["administrator", "global manager", "marketing"], span: "full" },
]

export function DashboardGrid() {
  const { user } = useAuth()
  const roleName = user?.role?.name?.toLowerCase() || "administrator"
  
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([])
  const [visibleIds, setVisibleIds] = useState<string[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Load from localStorage or defaults
  useEffect(() => {
    const storageKey = `kashtrix-dashboard:${roleName}`
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      try {
        const { order, visible } = JSON.parse(saved)
        const reordered = order
          .map((id: string) => WIDGETS_REGISTRY.find(w => w.id === id))
          .filter(Boolean) as WidgetDefinition[]
        
        // Append any new widgets that might have been added to the registry since last save
        const missing = WIDGETS_REGISTRY.filter(w => !order.includes(w.id))
        
        setWidgets([...reordered, ...missing])
        setVisibleIds(visible)
        return
      } catch (e) {
        console.error("Failed to parse saved dashboard layout:", e)
      }
    }
    
    // Default fallback based on role
    const defaults = WIDGETS_REGISTRY.filter(w => w.defaultRoles.includes(roleName) || w.defaultRoles.includes(roleName.replace(/\s+/g, "")))
    const defaultIds = defaults.map(w => w.id)
    
    // Put default widgets at the top
    const sorted = [...defaults, ...WIDGETS_REGISTRY.filter(w => !defaultIds.includes(w.id))]
    setWidgets(sorted)
    setVisibleIds(defaultIds.length > 0 ? defaultIds : ["calendar", "actions"])
  }, [roleName])

  // Save changes
  const saveLayout = (newWidgets: WidgetDefinition[], newVisible: string[]) => {
    const storageKey = `kashtrix-dashboard:${roleName}`
    localStorage.setItem(storageKey, JSON.stringify({
      order: newWidgets.map(w => w.id),
      visible: newVisible
    }))
  }

  const handleToggleWidget = (id: string) => {
    const nextVisible = visibleIds.includes(id)
      ? visibleIds.filter(item => item !== id)
      : [...visibleIds, id]
    setVisibleIds(nextVisible)
    saveLayout(widgets, nextVisible)
  }

  const handleRemoveWidget = (id: string) => {
    const nextVisible = visibleIds.filter(item => item !== id)
    setVisibleIds(nextVisible)
    saveLayout(widgets, nextVisible)
  }

  const handleReset = () => {
    localStorage.removeItem(`kashtrix-dashboard:${roleName}`)
    // Trigger state refresh
    window.location.reload()
  }

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggedId === null || draggedId === id) return

    const draggedIndex = widgets.findIndex(w => w.id === draggedId)
    const targetIndex = widgets.findIndex(w => w.id === id)

    const updated = [...widgets]
    const [removed] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, removed)

    setWidgets(updated)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    saveLayout(widgets, visibleIds)
  }

  const activeWidgets = widgets.filter(w => visibleIds.includes(w.id))

  return (
    <Sheet>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize lg:text-[28px]">
              Welcome back, {user?.name || roleName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening across your ISP operations today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="size-3.5" />
              Reset Layout
            </Button>

            <SheetTrigger asChild>
              <Button size="sm" className="gap-2 bg-kashtrix-purple hover:bg-kashtrix-purple/90 text-white">
                <Plus className="size-4" />
                Customize Widgets
              </Button>
            </SheetTrigger>
          </div>
        </div>

        {activeWidgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center bg-muted/10">
            <LayoutGrid className="size-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-bold text-foreground">Your dashboard is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Customize your layout to add widgets relevant to your day-to-day operations.
            </p>
            <SheetTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                Add First Widget
              </Button>
            </SheetTrigger>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeWidgets.map(w => {
              const WidgetComponent = w.component
              return (
                <div
                  key={w.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, w.id)}
                  onDragOver={(e) => handleDragOver(e, w.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "min-w-0 transition-opacity duration-150",
                    w.span === "full" && "md:col-span-2 xl:col-span-3",
                    w.span === "wide" && "md:col-span-2 xl:col-span-2",
                    draggedId === w.id ? "opacity-30" : "opacity-100"
                  )}
                >
                  <DashboardWidget
                    title={w.title}
                    subtitle={w.subtitle}
                    icon={w.icon}
                    onRemove={() => handleRemoveWidget(w.id)}
                    dragHandleProps={{}}
                  >
                    <WidgetComponent />
                  </DashboardWidget>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <SheetContent className="w-[360px] sm:w-[440px] overflow-y-auto">
        <SheetHeader className="border-b pb-4 mb-4">
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            Customize Dashboard
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Toggle the switches below to add or remove widgets from your active dashboard view.
          </p>

          <div className="divide-y">
            {widgets.map(w => {
              const isVisible = visibleIds.includes(w.id)
              const Icon = w.icon
              return (
                <div key={w.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="bg-muted p-2 rounded-md shrink-0">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate text-foreground">{w.title}</h4>
                      {w.subtitle && <p className="text-[11px] text-muted-foreground truncate">{w.subtitle}</p>}
                    </div>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => handleToggleWidget(w.id)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
