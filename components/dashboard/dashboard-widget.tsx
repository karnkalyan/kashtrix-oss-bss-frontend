"use client"

import type React from "react"
import { useState } from "react"
import { X, Minimize2, Maximize2, ChevronDown, ChevronUp, GripVertical, Settings } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardWidgetProps {
  title: string
  subtitle?: string
  icon?: React.ComponentType<any>
  children: React.ReactNode
  className?: string
  dragHandleProps?: any
  onRemove?: () => void
  onConfigure?: () => void
  isCollapsible?: boolean
  isMaximizable?: boolean
}

export function DashboardWidget({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  dragHandleProps,
  onRemove,
  onConfigure,
  isCollapsible = true,
  isMaximizable = true,
}: DashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsCollapsed(!isCollapsed)
  }

  const handleToggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMaximized(!isMaximized)
  }

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="size-5 text-primary" />}
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onConfigure && (
              <Button variant="ghost" size="icon" onClick={onConfigure}>
                <Settings className="size-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleToggleMaximize} title="Restore Down">
              <Minimize2 className="size-4" />
            </Button>
            {onRemove && (
              <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive hover:bg-destructive/10">
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("group overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-[0_8px_28px_-24px_hsl(var(--foreground))] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 bg-card px-4 py-3.5 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors p-0.5">
              <GripVertical className="size-4" />
            </div>
          )}
          {Icon && <Icon className="size-4.5 text-primary/80 group-hover:text-primary transition-colors shrink-0" />}
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold tracking-tight truncate text-foreground/90 group-hover:text-foreground transition-colors">
              {title}
            </CardTitle>
            {subtitle && !isCollapsed && (
              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {onConfigure && !isCollapsed && (
            <Button variant="ghost" size="icon" className="size-7 h-7 w-7 rounded-sm" onClick={onConfigure}>
              <Settings className="size-3.5" />
            </Button>
          )}
          {isMaximizable && !isCollapsed && (
            <Button variant="ghost" size="icon" className="size-7 h-7 w-7 rounded-sm" onClick={handleToggleMaximize} title="Maximize">
              <Maximize2 className="size-3.5" />
            </Button>
          )}
          {isCollapsible && (
            <Button variant="ghost" size="icon" className="size-7 h-7 w-7 rounded-sm" onClick={handleToggleCollapse}>
              {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
            </Button>
          )}
          {onRemove && (
            <Button variant="ghost" size="icon" className="size-7 h-7 w-7 rounded-sm text-destructive/80 hover:text-destructive hover:bg-destructive/10" onClick={onRemove}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <div className={cn("transition-all duration-200", isCollapsed ? "h-0 overflow-hidden" : "h-auto")}>
        <CardContent className="p-4">
          {children}
        </CardContent>
      </div>
    </Card>
  )
}
