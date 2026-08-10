import { cn } from "@/lib/utils"

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return <section data-ui="form-section" className={cn("grid gap-4 border-b pb-5 last:border-0 last:pb-0 lg:grid-cols-[minmax(180px,0.35fr)_minmax(0,1fr)]", className)}><div><h2 className="font-heading text-sm font-semibold">{title}</h2>{description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}</div><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>
}
