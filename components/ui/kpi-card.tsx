import type {LucideIcon} from "lucide-react"
import {ArrowDownRight,ArrowUpRight,Minus} from "lucide-react"
import {Card,CardContent} from "@/components/ui/card"
import {cn} from "@/lib/utils"

export function KpiCard({label,value,trend,period,icon:Icon,className}:{label:string;value:React.ReactNode;trend?:number;period?:string;icon?:LucideIcon;className?:string}){
  const Trend=trend===undefined||trend===0?Minus:trend>0?ArrowUpRight:ArrowDownRight
  return <Card data-kpi className={cn("min-h-28",className)}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="data-value mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {Icon&&<span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/[0.055] text-primary"><Icon className="size-[18px]"/></span>}
      </div>
      {trend!==undefined&&<div className="mt-2 flex items-center gap-1.5 text-[11px]"><Trend className={cn("size-3.5",trend>0?"text-[var(--status-success)]":trend<0?"text-[var(--status-danger)]":"text-muted-foreground")}/><span className="font-semibold tabular-nums">{Math.abs(trend)}%</span><span className="truncate text-muted-foreground">{period||"vs previous period"}</span></div>}
    </CardContent>
  </Card>
}
