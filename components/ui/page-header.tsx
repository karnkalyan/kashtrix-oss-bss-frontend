import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import React from "react"

interface Breadcrumb {
  label: string
  href?: string
}

interface PageAction {
  label: string
  href?: string
  component?: React.ReactNode
  onClick?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  icon?: React.ReactNode
}

interface PageHeaderProps {
  title: string
  description?: string

  icon?: LucideIcon

  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "critical" | "major" | "maintenance" | "neutral" | "outline"
  }

  breadcrumbs?: Breadcrumb[]

  actions?: PageAction[]
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <header data-ui="page-header" className="space-y-4 border-b border-border pb-5">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-[11px] text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span className="mx-2">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className="rounded-xl border border-primary/15 bg-primary/[0.055] p-2.5 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}

          {/* Title + Description */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-heading text-2xl font-semibold leading-tight tracking-[-0.025em] md:text-[28px]">
                {title}
              </h1>

              {badge && (
                <Badge variant={badge.variant ?? "secondary"}>
                  {badge.text}
                </Badge>
              )}
            </div>

            {description && (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {actions.map((action, index) =>
              action.component ? (
                <React.Fragment key={index}>
                  {action.component}
                </React.Fragment>
              ) : action.href ? (
                <Button asChild key={index} variant={action.variant}>
                  <Link href={action.href}>
                    {action.icon}
                    {action.label}
                  </Link>
                </Button>
              ) : (
                <Button key={index} variant={action.variant} onClick={action.onClick}>
                  {action.icon}
                  {action.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </header>
  )
}
