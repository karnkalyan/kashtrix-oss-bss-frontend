import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-base shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/15 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-[13px]",
        className
      )}
      ref={ref}
      data-ui="textarea"
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
