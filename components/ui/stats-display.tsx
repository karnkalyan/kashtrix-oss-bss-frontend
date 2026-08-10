"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react"

interface StatsDisplayProps {
  title: string
  value: string
  icon: React.ReactNode
  iconColor: string
  change?: {
    value: number
    type: "increase" | "decrease" | "neutral"
  }
  subtitle?: string
  forceDarkMode?: boolean
}

export function StatsDisplay({
  title,
  value,
  icon,
  iconColor,
  change,
  subtitle,
}: StatsDisplayProps) {
  const getChangeIcon = () => {
    switch (change?.type) {
      case "increase":
        return <ArrowUpIcon className="h-3 w-3 text-[var(--status-success)]" />
      case "decrease":
        return <ArrowDownIcon className="h-3 w-3 text-[var(--status-danger)]" />
      default:
        return <MinusIcon className="h-3 w-3 text-slate-400" />
    }
  }

  const getChangeColor = () => {
    switch (change?.type) {
      case "increase":
        return "text-[var(--status-success)]"
      case "decrease":
        return "text-[var(--status-danger)]"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
            <p className="data-value mt-2 text-2xl font-semibold text-foreground">{value}</p>

            {(change || subtitle) && (
              <div className="flex items-center mt-2">
                {change && (
                  <div className="flex items-center">
                    {getChangeIcon()}
                    <span className={`text-xs ml-1 ${getChangeColor()}`}>{change.value}%</span>
                  </div>
                )}

                {subtitle && (
                  <span
                    className={`text-xs text-muted-foreground ${change ? "ml-2" : ""}`}
                  >
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-2.5" style={{ backgroundColor: `${iconColor}16`, borderColor: `${iconColor}30` }}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
