"use client"

import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useCalendarSystem } from "@/contexts/CalendarSystemContext"
import type { CalendarSystem } from "@/lib/calendar-system"
import { NepaliCalendarWidget } from "@/components/dashboard/nepali-calendar-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalendarSystemWidget() {
  const { system, setViewSystem } = useCalendarSystem()
  return <section className="relative grid min-w-0 auto-rows-max gap-2" aria-label="Dashboard calendar"><div className="flex min-w-0 items-center justify-between rounded-lg border bg-card px-3 py-2"><div className="flex min-w-0 items-center gap-2 text-xs font-semibold"><CalendarDays className="size-4 shrink-0 text-primary" /><span className="truncate">Calendar</span></div><div className="ml-3 flex shrink-0 rounded-md bg-muted p-0.5">{(["AD", "BS"] as CalendarSystem[]).map(value => <button key={value} onClick={() => setViewSystem(value)} className={`rounded px-3 py-1 text-[10px] font-semibold ${system === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>{value}</button>)}</div></div><div className="relative min-w-0">{system === "BS" ? <NepaliCalendarWidget /> : <GregorianCalendarWidget />}</div></section>
}

function GregorianCalendarWidget() {
  const [view, setView] = useState(() => new Date())
  const year = view.getFullYear(), month = view.getMonth(), today = new Date()
  const days = new Date(year, month + 1, 0).getDate(), blanks = new Date(year, month, 1).getDay()
  const move = (amount: number) => setView(new Date(year, month + amount, 1))
  return <Card><CardHeader className="flex-row items-center justify-between p-3"><Button size="icon" variant="ghost" onClick={() => move(-1)}><ChevronLeft className="size-4" /></Button><CardTitle className="text-sm">{view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</CardTitle><Button size="icon" variant="ghost" onClick={() => move(1)}><ChevronRight className="size-4" /></Button></CardHeader><CardContent className="p-3 pt-0"><div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground">{["S","M","T","W","T","F","S"].map((day,index)=><div key={`${day}-${index}`} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-1 text-center text-xs">{Array.from({length:blanks},(_,index)=><div key={`b-${index}`} />)}{Array.from({length:days},(_,index)=>index+1).map(day => { const active = day === today.getDate() && month === today.getMonth() && year === today.getFullYear(); return <div key={day} className={`grid h-8 place-items-center rounded-md ${active ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"}`}>{day}</div> })}</div></CardContent></Card>
}
