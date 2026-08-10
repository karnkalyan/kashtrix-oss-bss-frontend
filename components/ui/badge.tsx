import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex min-h-5 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
        success:
          "border-transparent bg-[var(--status-success-bg)] text-[var(--status-success)]",
        warning:
          "border-transparent bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
        info: "border-transparent bg-[var(--status-info-bg)] text-[var(--status-info)]",
        critical:
          "border-transparent bg-[var(--status-critical-bg)] text-[var(--status-critical)]",
        major:
          "border-transparent bg-[var(--status-major-bg)] text-[var(--status-major)]",
        maintenance:
          "border-transparent bg-[var(--status-maintenance-bg)] text-[var(--status-maintenance)]",
        neutral:
          "border-transparent bg-[var(--status-neutral-bg)] text-[var(--status-neutral)]",
        ai: "border-transparent bg-[var(--status-info-bg)] text-[var(--status-info)]",
        outline: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  indicatorClassName?: string
}

function Badge({ className, variant, indicatorClassName, children, ...props }: BadgeProps) {
  return (
    <div data-ui="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {indicatorClassName && <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-current", indicatorClassName)} />}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
