import type React from "react"
import { cn } from "@/lib/utils"

interface SectionContainerProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function SectionContainer({ title, description, children, className, action }: SectionContainerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}
