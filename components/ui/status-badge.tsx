"use client"
import { cn } from "@/lib/utils"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { humanizeEnum } from "@/lib/display-format"

interface StatusBadgeProps extends Omit<BadgeProps,"variant"> { status: string; showIndicator?: boolean }
export function StatusBadge({status,className,showIndicator=true,...props}:StatusBadgeProps){
  const normalized = String(status || "unknown").toLowerCase().replaceAll("_","-")
  const variant: BadgeProps["variant"] =
    ["completed","active","paid","online","healthy","ready","up","connected","success"].includes(normalized) ? "success" :
    ["processing","collecting","pending","syncing","provisioning"].includes(normalized) ? "info" :
    ["warning","degraded","minor"].includes(normalized) ? "warning" :
    ["critical","failure","failed","down","offline","suspended","overdue"].includes(normalized) ? "critical" :
    ["major"].includes(normalized) ? "major" :
    ["maintenance"].includes(normalized) ? "maintenance" :
    "neutral"
  return <Badge variant={variant} className={cn("capitalize",className)} {...props}>{showIndicator&&<span aria-hidden="true" className="size-1.5 rounded-full bg-current"/>}{humanizeEnum(normalized)}</Badge>
}
