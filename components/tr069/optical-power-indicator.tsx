"use client"

import { cn } from "@/lib/utils"

export const OPTICAL_POWER_THRESHOLDS = {
  goodMin: -25,
  goodMax: -15,
  warningMin: -28,
} as const

export type OpticalPowerState = "good" | "warning" | "critical" | "unknown"

export function opticalPowerState(value?: number | null): OpticalPowerState {
  if (value == null || !Number.isFinite(Number(value))) return "unknown"
  const power = Number(value)
  if (power >= OPTICAL_POWER_THRESHOLDS.goodMin && power <= OPTICAL_POWER_THRESHOLDS.goodMax) return "good"
  if (power >= OPTICAL_POWER_THRESHOLDS.warningMin && power < OPTICAL_POWER_THRESHOLDS.goodMin) return "warning"
  return "critical"
}

const styles: Record<OpticalPowerState, { label: string; text: string; bar: string }> = {
  good: { label: "Good", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  warning: { label: "Warning", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  critical: { label: "Critical", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500" },
  unknown: { label: "N/A", text: "text-muted-foreground", bar: "bg-muted" },
}

export function OpticalPowerIndicator({ label, value, className, showThreshold = true }: { label: string; value?: number | null; className?: string; showThreshold?: boolean }) {
  const numeric = value == null || !Number.isFinite(Number(value)) ? null : Number(value)
  const state = opticalPowerState(numeric)
  const style = styles[state]
  const percentage = numeric == null ? 0 : Math.max(4, Math.min(100, ((numeric + 30) / 22) * 100))

  return (
    <div className={cn("min-w-[150px] space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-bold", style.text)}>{numeric == null ? "N/A" : `${numeric.toFixed(2)} dBm`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className={cn("font-semibold", style.text)}>{style.label}</span>
        {showThreshold && <span className="text-muted-foreground" title="Good: -25 to -15 dBm; Warning: -28 to -25 dBm; Critical: below -28 or above -15 dBm">Good −25…−15</span>}
      </div>
    </div>
  )
}
