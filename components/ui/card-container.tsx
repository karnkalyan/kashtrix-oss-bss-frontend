import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CardAction {
  label: string
  onClick: () => void
  icon?: ReactNode
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
}

interface CardContainerProps {
  title?: string
  description?: string
  children: ReactNode
  gradientColor?: string
  forceDarkMode?: boolean
  className?: string
  contentClassName?: string
  action?: ReactNode
  actions?: CardAction[]
}

export function CardContainer({
  title,
  description,
  children,
  className = "",
  contentClassName = "",
  action,
  actions
}: CardContainerProps) {
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined || action !== undefined

  return (
    <Card
      className={cn("overflow-hidden", className)}
    >
      {hasHeader && (
        <CardHeader className="border-b border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <CardDescription>
                  {description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions && actions.map((act, i) => (
                <Button 
                  key={i} 
                  variant={act.variant || "ghost"} 
                  size="sm" 
                  onClick={act.onClick}
                  className="h-8 gap-1.5 px-3"
                >
                  {act.icon}
                  <span className="hidden sm:inline">{act.label}</span>
                </Button>
              ))}
              {action && <div>{action}</div>}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("p-4", hasHeader && "pt-4", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
