import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-ui="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/55 to-muted bg-[length:200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
