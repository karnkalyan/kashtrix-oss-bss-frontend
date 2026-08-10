import type React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface FilterContainerProps {
  children: React.ReactNode
  className?: string
}

export function FilterContainer({ children, className }: FilterContainerProps) {
  return (
    <Card
      className={cn(
        "border-border bg-card p-3 shadow-sm",
        "transition-colors duration-200",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </Card>
  )
}
